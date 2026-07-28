const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiError extends Error {
  constructor(status, data) {
    super(data?.message || `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(method, path, options = {}) {
  const { params, body, formData } = options;

  let url = `${BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {};

  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let fetchOptions = {
    method,
    headers,
  };

  if (formData) {
    fetchOptions.body = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err) {
    throw new ApiError(0, { message: 'Network error. Please check your connection.' });
  }

  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = { message: 'Invalid JSON response' };
    }
  } else {
    const text = await response.text();
    data = { message: text || response.statusText };
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.hash = '#/login';
    }
    throw new ApiError(response.status, data);
  }

  return data;
}

export const api = {
  get(path, params) {
    return request('GET', path, { params });
  },
  post(path, body) {
    return request('POST', path, { body });
  },
  put(path, body) {
    return request('PUT', path, { body });
  },
  delete(path) {
    return request('DELETE', path);
  },
  upload(path, formData) {
    return request('POST', path, { formData });
  },
};

export { ApiError };
