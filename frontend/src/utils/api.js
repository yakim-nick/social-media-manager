const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const TOKEN_STORAGE_KEY = 'auth_token';

/**
 * Error thrown for any failed API request, carrying the HTTP status and
 * the parsed response payload.
 */
class ApiError extends Error {
  /**
   * @param {number} status - HTTP status code (0 for network errors).
   * @param {object} data - Parsed response body.
   */
  constructor(status, data) {
    super(data?.message || `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Perform an HTTP request against the API and return the parsed body.
 *
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
 * @param {string} path - API path, appended to the base URL.
 * @param {object} [options] - Request options.
 * @param {object} [options.params] - Query parameters (falsy values skipped).
 * @param {object} [options.body] - JSON body to send.
 * @param {FormData} [options.formData] - Multipart body (takes precedence over `body`).
 * @returns {Promise<object>} Parsed JSON response body.
 * @throws {ApiError} When the request fails or the response is not OK.
 */
async function request(method, path, options = {}) {
  const { params, body, formData } = options;

  const url = buildUrl(path, params);
  const headers = buildHeaders(body, formData);

  const fetchOptions = {
    method,
    headers,
  };

  if (formData) {
    fetchOptions.body = formData;
  } else if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch {
    throw new ApiError(0, { message: 'Network error. Please check your connection.' });
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    redirectToLoginOnUnauthorized(response.status);
    throw new ApiError(response.status, data);
  }

  return data;
}

/**
 * Build the full request URL, appending non-empty query parameters.
 *
 * @param {string} path - API path.
 * @param {object} [params] - Query parameters.
 * @returns {string} Full URL including any query string.
 */
function buildUrl(path, params) {
  let url = `${BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  return url;
}

/**
 * Build request headers, attaching the stored auth token when present.
 *
 * @param {object} [body] - JSON body (triggers a JSON content type).
 * @param {FormData} [formData] - Multipart body (never sets a content type).
 * @returns {object} Headers object.
 */
function buildHeaders(body, formData) {
  const headers = {};

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body !== undefined && !formData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * Parse a fetch response into a plain object, tolerating non-JSON bodies.
 *
 * @param {Response} response - Fetch Response object.
 * @returns {Promise<object>} Parsed body.
 */
async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return { message: 'Invalid JSON response' };
    }
  }

  const text = await response.text();
  return { message: text || response.statusText };
}

/**
 * Clear the stored token and bounce to the login page on a 401 response.
 *
 * @param {number} status - HTTP status code of the response.
 */
function redirectToLoginOnUnauthorized(status) {
  if (status === 401) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.location.hash = '#/login';
  }
}

/** Thin HTTP client bound to the API base URL. */
export const api = {
  /**
   * @param {string} path - API path.
   * @param {object} [params] - Query parameters.
   * @returns {Promise<object>} Parsed response body.
   */
  get(path, params) {
    return request('GET', path, { params });
  },
  /**
   * @param {string} path - API path.
   * @param {object} [body] - JSON body.
   * @returns {Promise<object>} Parsed response body.
   */
  post(path, body) {
    return request('POST', path, { body });
  },
  /**
   * @param {string} path - API path.
   * @param {object} [body] - JSON body.
   * @returns {Promise<object>} Parsed response body.
   */
  put(path, body) {
    return request('PUT', path, { body });
  },
  /**
   * @param {string} path - API path.
   * @returns {Promise<object>} Parsed response body.
   */
  delete(path) {
    return request('DELETE', path);
  },
  /**
   * @param {string} path - API path.
   * @param {FormData} formData - Multipart body.
   * @returns {Promise<object>} Parsed response body.
   */
  upload(path, formData) {
    return request('POST', path, { formData });
  },
};

export { ApiError };