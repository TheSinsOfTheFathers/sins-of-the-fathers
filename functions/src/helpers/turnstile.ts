import { secretManagerClient } from "../config/firebase";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import axios from "axios";

// Global değişken ile secret'i önbelleğe alıyoruz
let cachedTurnstileSecret: string | null = null;

export async function getTurnstileSecret(): Promise<string> {
  if (cachedTurnstileSecret) return cachedTurnstileSecret;

  try {
    const SECRET_NAME = "projects/287213062167/secrets/TURNSTILE_SECRET_KEY/versions/latest";
    const [version] = await secretManagerClient.accessSecretVersion({ name: SECRET_NAME });

    if (!version.payload?.data) throw new Error("Turnstile secret not found.");

    const secret = version.payload.data.toString();
    cachedTurnstileSecret = secret;
    return secret;
  } catch (error) {
    logger.error("Failed to access Secret Manager:", error);
    throw new HttpsError("internal", "Could not retrieve security keys.");
  }
}

export async function verifyTurnstileLogic(token: string): Promise<{ isValid: boolean }> {
  try {
    const secretKey = await getTurnstileSecret();
    const verificationUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    
    // Cloudflare documentation says: POST with secret and response.
    // Axios handles JSON body automatically.
    
    const response = await axios.post(verificationUrl, {
      secret: secretKey,
      response: token
    });

    const { success } = response.data;
    
    return { isValid: success };
  } catch (error) {
    logger.error("Turnstile verification error:", error);
    return { isValid: false };
  }
}
