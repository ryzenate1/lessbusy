// Keep in sync with packages/twenty-front/src/config/branding.ts.
export const APP_NAME = 'LessBusy';

// This deployment's public origin, used when an email body links back to the
// app and for the email logo. Must point at a reachable origin for email
// clients (set EMAIL_SITE_URL in production; the localhost default only works
// for local runs).
export const EMAIL_SITE_URL =
  process.env.EMAIL_SITE_URL || 'http://localhost:3002';

export const EMAIL_LOGO_URL =
  process.env.EMAIL_LOGO_URL ||
  `${EMAIL_SITE_URL}/images/branding/lessbusy-email-logo.png`;

// Optional outbound links, shown in emails only when configured.
export const EMAIL_WEBSITE_URL = process.env.EMAIL_WEBSITE_URL || '';
export const EMAIL_GITHUB_URL = process.env.EMAIL_GITHUB_URL || '';
export const EMAIL_USER_GUIDE_URL = process.env.EMAIL_USER_GUIDE_URL || '';
export const EMAIL_API_DOCS_URL = process.env.EMAIL_API_DOCS_URL || '';
// Optional publisher line; kept empty so no inherited legal entity is claimed.
export const EMAIL_LEGAL_NAME = process.env.EMAIL_LEGAL_NAME || '';
