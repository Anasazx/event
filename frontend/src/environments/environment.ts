/**
 * Development configuration.
 *
 * apiBaseUrl is the origin of the Spring Boot API. It is empty on purpose: the browser calls
 * relative URLs (/api/..., /uploads/...) that the dev server proxies to http://localhost:8080
 * (see proxy.conf.json), exactly like nginx does in production. This keeps the app free of CORS issues.
 * To call a backend on another origin, set it here (e.g. 'http://localhost:8080') and allow the
 * frontend origin in the backend CORS_ORIGINS variable.
 */
export const environment = {
  production: false,
  apiBaseUrl: '',
};
