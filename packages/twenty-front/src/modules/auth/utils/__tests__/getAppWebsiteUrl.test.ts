import { getAppWebsiteUrl } from '@/auth/utils/getAppWebsiteUrl';

describe('getAppWebsiteUrl', () => {
  it('returns an empty URL while the public site is unconfigured', () => {
    expect(getAppWebsiteUrl('terms')).toBe('');
    expect(getAppWebsiteUrl('privacy-policy')).toBe('');
    expect(getAppWebsiteUrl('dpa')).toBe('');
  });
});
