import { z } from 'zod';

export const getBusinessDocumentIdentity = (profile: { identity?: unknown; locale?: unknown; documentTemplate?: unknown; documentNotes?: unknown }) => {
  const identity = z.object({ legalName: z.string().trim().min(1).max(250), address: z.string().trim().min(1).max(2000), taxIdentifiers: z.record(z.string().max(50), z.string().max(100)).optional() }).strict().parse(profile.identity);
  const locale = z.string().max(50).parse(profile.locale || 'en');
  new Intl.DateTimeFormat(locale);
  return { ...identity, locale, documentTemplate: z.enum(['MINIMAL', 'CLASSIC']).parse(profile.documentTemplate || 'MINIMAL'), documentNotes: z.string().max(4000).parse(profile.documentNotes || '') };
};
