import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { parsePagination } from '../utils/pagination.js';
import { requireMediaAccess, findShopForUser, getUserShopIds } from '../utils/access.js';
import config from '../config/index.js';

// Store uploads on disk under a generated UUID name (original extension kept).
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = config.upload.dir;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`File type ${file.mimetype} is not allowed`));
    }
  },
});

/**
 * Middleware factory that accepts a single uploaded `file` field.
 *
 * Multer errors are mapped to ValidationErrors (413-size and general),
 * and a missing file is rejected with a ValidationError.
 *
 * @returns {Function} Express-style middleware `(req, res, next)`.
 */
export function uploadMiddleware() {
  return (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return next(mapUploadError(err));
      }

      if (!req.file) {
        return next(new ValidationError('No file uploaded'));
      }

      next();
    });
  };
}

/**
 * Persist the uploaded file as a media record for the given shop.
 * The file is removed from disk if the shop cannot be found.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function saveMediaRecord(req, res) {
  const uploadedFile = req.file;
  const shopId = req.body.shopId;

  const shop = await findShopForUser(shopId, req.user.id);

  if (!shop) {
    // Avoid leaving an orphaned file behind when the upload is rejected.
    fs.unlinkSync(uploadedFile.path);
    throw new NotFoundError('Shop not found');
  }

  const media = await prisma.media.create({
    data: {
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalname,
      mimeType: uploadedFile.mimetype,
      size: uploadedFile.size,
      url: `/uploads/${uploadedFile.filename}`,
      shopId: shop.id,
      uploadedById: req.user.id,
    },
  });

  res.json({ data: media }, 201);
}

/**
 * List media visible to the authenticated user, with pagination.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function list(req, res) {
  const { page, limit, skip } = parsePagination(req.query);

  const shopIds = await getUserShopIds(req.user.id);

  const where = { shopId: { in: shopIds } };
  if (req.query.shopId) where.shopId = req.query.shopId;

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.media.count({ where }),
  ]);

  res.paginated(media, total, page, limit);
}

/**
 * Delete a media record the user has access to, removing the file from disk.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 */
export async function remove(req, res) {
  const media = await requireMediaAccess(req.params.id, req.user.id);

  const filePath = path.join(config.upload.dir, media.filename);
  try {
    fs.unlinkSync(filePath);
  } catch {
    // File may not exist on disk; still remove the DB record.
  }

  await prisma.media.delete({ where: { id: req.params.id } });

  res.json({ data: { message: 'Media deleted successfully' } });
}

/**
 * Convert a multer error into an appropriate AppError.
 *
 * @param {Error} err - Error raised by multer.
 * @returns {Error} A ValidationError or the original error.
 */
function mapUploadError(err) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new ValidationError('File exceeds maximum size');
    }
    return new ValidationError(err.message);
  }
  return err;
}