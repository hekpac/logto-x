import type { LanguageTag } from '@logto/language-kit';
import { isLanguageTag } from '@logto/language-kit';
import type { ZodType } from 'zod';
import { z } from 'zod';

export type I18nPhrases = { en: string } & {
  [K in Exclude<LanguageTag, 'en'>]?: string;
};

export const i18nPhrasesGuard: ZodType<I18nPhrases> = z
  .object({ en: z.string() })
  .and(z.record(z.string()))
  .refine((i18nObject) => {
    const keys = Object.keys(i18nObject);

    if (!keys.includes('en')) {
      return false;
    }

    for (const value of keys) {
      if (!isLanguageTag(value)) {
        return false;
      }
    }

    return true;
  });
