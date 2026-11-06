export const SITE_NAME = 'IPhey';
export const SITE_HOST = 'iphey.org';
export const SITE_URL = 'https://iphey.org';
export const API_URL = 'https://api.iphey.org';
export const FALLBACK_API_URL = 'https://iphey-api.difft.workers.dev';
export const ORG_LOGO_URL = `${SITE_URL}/favicon.svg`;

export const absoluteUrl = (path = '/') => {
  if (!path || path === '/') {
    return SITE_URL;
  }

  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
