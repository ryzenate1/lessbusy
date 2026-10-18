import {
  APP_DPA_PATH,
  APP_PRIVACY_PATH,
  APP_TERMS_PATH,
  APP_WEBSITE_URL,
} from '~/config/branding';

export type LegalPage = 'terms' | 'privacy-policy' | 'dpa';

// Empty string while the public site is unprovisioned; callers render
// plain-text labels instead of links until APP_WEBSITE_URL is set.
export const getAppWebsiteUrl = (page: LegalPage): string => {
  if (!APP_WEBSITE_URL) {
    return '';
  }

  const path =
    page === 'terms'
      ? APP_TERMS_PATH
      : page === 'privacy-policy'
        ? APP_PRIVACY_PATH
        : APP_DPA_PATH;

  return `${APP_WEBSITE_URL}${path}`;
};
