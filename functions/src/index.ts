/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import {onCall, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios, {AxiosResponse} from "axios";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";

const RECAPTCHA_SITE_KEY = "6LeoRfYrAAAAANpaxG70cHRmK5ciRKf7sVt9Crnz";

admin.initializeApp();

const secretManagerClient = new SecretManagerServiceClient();
const REGION = "europe-west3";

interface RecaptchaVerificationData {
  token: string;
  action: string;
  uid?: string;
  email?: string;
}

interface AssessmentResponseV3 {
  success: boolean;
  score?: number;
  "error-codes"?: string[];
  action?: string;
}

/**
 * Fetches the reCAPTCHA Secret Key from Google Secret Manager.
 * @return {Promise<string>} The secret key as a string.
*/
async function getRecaptchaSecret(): Promise<string> {
  const SECRET_NAME = "projects/287213062167/secrets/RECAPTCHA_SECRET_KEY/versions/latest";
  const [version] = await secretManagerClient.accessSecretVersion({name: SECRET_NAME});

  if (!version.payload?.data) {
    logger.error("reCAPTCHA secret not found or is empty.");
    throw new Error("reCAPTCHA secret not found or is empty.");
  }
  return version.payload.data.toString();
}

/**
 * Verifies the reCAPTCHA token against the Google API and checks the bot score.
 * @param {string} token The reCAPTCHA token provided by the client.
 * @param {string} action The action identifier (e.g., 'login', 'signup').
 * @param {string} uid Optional. The user ID for Account Defender integration.
 * @param {string} email Optional. The user's email for Account Defender integration.
 * @return {Promise<{isValid: boolean, score: number, labels: string[]}>} An object containing validation result, score, and labels (if applicable).
*/
async function verifyRecaptcha(
  token: string,
  action: string,
  uid?: string | null,
  email?: string | null
): Promise<{isValid: boolean, score: number, labels: string[]}> {
  let secretKey: string;
  try {
    secretKey = await getRecaptchaSecret();
  } catch (error) {
    logger.error("Failed to fetch reCAPTCHA secret:", error);
    return {isValid: false, score: 0, labels: []};
  }

  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  try {
    const requestBody: { [key: string]: any } = {
      event: {
        token: token,
        siteKey: RECAPTCHA_SITE_KEY, // This is a placeholder site key for reCAPTCHA v3. Replace with your actual site key if needed for specific server-side assessment.
        action: action,
      },
    };

    if (uid) requestBody.event.accountId = uid;
    if (email) requestBody.event.userEmail = email;

    const response: AxiosResponse<AssessmentResponseV3> = await axios.post(verificationUrl, requestBody, {
      headers: {"Content-Type": "application/json"},
    });

    const {success, score} = response.data;
    const finalScore = score ?? 0;
    const labels: string[] = [];

    logger.log("reCAPTCHA verification details (v3 API):", {success, score, action});

    if (success && finalScore >= 0.5) {
      return {isValid: true, score: finalScore, labels: labels};
    }

    return {isValid: false, score: finalScore, labels: labels};
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error("Error verifying reCAPTCHA token with Google API:", errorMessage);
    return {isValid: false, score: 0, labels: []};
  }
}


/**
 * Verifies the reCAPTCHA token sent from the client.
 * Optionally uses authentication context to pass UID/Email for Account Defender checks.
 */
export const verifyRecaptchaToken = onCall({
  region: REGION,
  cors: true,
}, async (request: CallableRequest<RecaptchaVerificationData>) => {
  // User may be authenticated, but it's not required.
  const {token, action} = request.data;
  const uid = request.auth?.uid;
  const email = request.auth?.token.email;

  if (!token || typeof token !== "string" || !action || typeof action !== "string") {
    logger.warn("Missing or invalid reCAPTCHA token/action.");
    throw new HttpsError("invalid-argument", "Token and action are required arguments.");
  }

  // Verify token and execute Account Defender logic
  const verificationResult = await verifyRecaptcha(token, action, uid, email);

  if (!verificationResult.isValid) {
    logger.warn(`Security check failed. Score: ${verificationResult.score}`);
    throw new HttpsError("permission-denied", "Security check failed. Please try again.");
  }

  logger.info(`reCAPTCHA verification SUCCESS for User ID: ${uid || "Guest"} on action: ${action}`);

  return {success: true, message: "Verification successful.", score: verificationResult.score};
});
