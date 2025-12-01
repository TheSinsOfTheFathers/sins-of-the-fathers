// Firebase Hosting'e gelen tüm istekleri Astro'nun Node sunucu girişine yönlendirir.
import { IncomingMessage, ServerResponse } from 'http';
import { handle } from './dist/server/entry.mjs'; // Astro'nun oluşturduğu ana sunucu dosyası

/**
 * Astro sunucu fonksiyonu için bir Firebase onRequest adaptörü
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 */
export const astroServer = async (request, response) => {
  // Astro Node adapter'ı içindeki handler'ı çağır
  return handle(request, response);
};