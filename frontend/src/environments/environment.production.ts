/**
 * Production configuration. The frontend is served by nginx on the same origin as the API,
 * so the API base URL stays empty and requests use relative paths.
 */
export const environment = {
  production: true,
  apiBaseUrl: '',
};
