// blog/server.mjs
import { onRequest } from "firebase-functions/v2/https";
// DÜZELTME 1: 'handle' yerine 'handler' import ediyoruz
import { handler } from "./dist/server/entry.mjs";

export const astroServer = onRequest(
  {
    region: "us-central1", // Hosting ile uyumlu olması için burası us-central1 kalsın
    memory: "512MiB",
    maxInstances: 10,
  },
  async (request, response) => {
    // DÜZELTME 2: Burada da 'handler' çağırıyoruz
    await handler(request, response);
  }
);
