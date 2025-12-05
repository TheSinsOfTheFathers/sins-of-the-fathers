// blog/src/middleware.ts
import type { MiddlewareResponseHandler } from 'astro';
import en from './i18n/locales/en/en.json';
import tr from './i18n/locales/tr/tr.json';

const allTranslations = { en, tr };

export const onRequest: MiddlewareResponseHandler = ({ locals, cookies }, next) => {
    const langCookie = cookies.get('tsof_blog_lang');
    const lang = langCookie?.value === 'en' ? 'en' : 'tr';
    
    locals.lang = lang;
    locals.translations = allTranslations[lang];
    
    return next();
};