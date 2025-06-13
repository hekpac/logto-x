import type { Locale } from 'date-fns';
import {
  enUS,
  arSA,
  de,
  es,
  fr,
  it,
  ja,
  ko,
  pl,
  ptBR,
  pt,
  ru,
  tr,
  uk,
  zhCN,
  zhHK,
  zhTW,
} from 'date-fns/locale';

const localeMap: Record<string, Locale> = {
  ar: arSA,
  de,
  en: enUS,
  es,
  fr,
  it,
  ja,
  ko,
  'pl-pl': pl,
  'pt-br': ptBR,
  'pt-pt': pt,
  ru,
  'tr-tr': tr,
  'uk-ua': uk,
  'zh-cn': zhCN,
  'zh-hk': zhHK,
  'zh-tw': zhTW,
};

export const getDateFnsLocale = (language: string): Locale =>
  localeMap[language.toLowerCase()] ?? enUS;
