import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { REGION } from "../config/firebase";
import { TurnstileVerificationData } from "../types/index";
import { verifyTurnstileLogic } from "../helpers/turnstile";

/**
 * 1. Turnstile Doğrulama
 */
export const verifyTurnstileToken = onCall(
  { region: REGION, cors: true },
  async (request: CallableRequest<TurnstileVerificationData>) => {
    const { token, action } = request.data;
    const uid = request.auth?.uid;

    if (!token) throw new HttpsError("invalid-argument", "Token (Turnstile) required.");

    const result = await verifyTurnstileLogic(token);

    if (!result.isValid) {
      logger.warn(`Security check (Turnstile) failed.`);
      throw new HttpsError("permission-denied", "Bot detected.");
    }

    logger.info(`Turnstile Success for User: ${uid || "Guest"} Action: ${action || "auth"}`);
    return { success: true };
  }
);
