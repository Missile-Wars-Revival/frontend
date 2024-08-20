import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

export const translations = {
    en: { welcome: 'Hello', name: 'Charlie' },
    ja: { welcome: 'こんにちは' },
  };

export async function language() {


const i18n = new I18n(translations);

i18n.locale = getLocales()[0]?.languageCode ?? 'en';

console.log(i18n.t('welcome'));

}