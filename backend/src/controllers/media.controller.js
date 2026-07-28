import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { PAGINATION_DEFAULTS } from '../config/constants.js';
import config from '../config/index.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = config.upload.dir;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${uuidv4()}${ext}`;
    cb(null, name);
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

export function uploadMiddleware() {
  return (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ValidationError('File exceeds maximum size'));
          }
          return next(new ValidationError(err.message));
        }
        return next(err);
      }

      if (!req.file) {
        return next(new ValidationError('No file uploaded'));
      }

      next();
    });
  };
}

export async function saveMediaRecord(req, res) {
  const file = req.file;
  const shopId = req.body.shopId;

  const shop = await prisma.shop.findFirst({
    where: {
      id: shopId,
      users: { some: { id: req.user.id } },
    },
  });

  if (!shop) {
    fs.unlinkSync(file.path);
    throw new NotFoundError('Shop not found');
  }

  const media = await prisma.media.create({
    data: {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      shopId: shop.id,
      uploadedById: req.user.id,
    },
  });

  res.json({ data: media }, 201);
}

export async function list(req, res) {
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.page;
  const limit = Math.min(
    parseInt(req.query.limit) || PAGINATION_DEFAULTS.limit,
    PAGINATION_DEFAULTS.maxLimit
  );
  const skip = (page - 1) * limit;

  const userShops = await prisma.shop.findMany({
    where: { users: { some: { id: req.user.id } } },
    select: { id: true },
  });
  const shopIds = userShops.map((s) => s.id);

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

export async function remove(req, res) {
  const media = await prisma.media.findUnique({
    where: { id: req.params.id },
  });

  if (!media) {
    throw new NotFoundError('Media not found');
  }

  const isMember = await prisma.shop.findFirst({
    where: { id: media.shopId, users: { some: { id: req.user.id } } },
  });

  if (!isMember) {
    throw new ForbiddenError('You do not have access to this media');
  }

  const filePath = path.join(config.upload.dir, media.filename);
  try {
    fs.unlinkSync(filePath);
  } catch {
    // File may not exist on disk, still remove from DB
  }

  await prisma.media.delete({ where: { id: req.params.id } });

  res.json({ data: { message: 'Media deleted successfully' } });
}
