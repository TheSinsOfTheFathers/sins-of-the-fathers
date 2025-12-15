/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import {onCall, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios, {AxiosResponse} from "axios";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
import {Resend} from "resend";

admin.initializeApp();

// const RECAPTCHA_SITE_KEY... (Bu satırı sildik çünkü kullanılmıyordu)
const secretManagerClient = new SecretManagerServiceClient();
const REGION = "europe-west3";

// --- Types ---
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

interface SubscriberData {
  email: string;
  name?: string;
}

// --------------------------------------------------------------------------
//  HELPERS
// --------------------------------------------------------------------------

async function getRecaptchaSecret(): Promise<string> {
  const SECRET_NAME = "projects/287213062167/secrets/RECAPTCHA_SECRET_KEY/versions/latest";
  const [version] = await secretManagerClient.accessSecretVersion({name: SECRET_NAME});

  if (!version.payload?.data) {
    throw new Error("reCAPTCHA secret not found or empty.");
  }
  return version.payload.data.toString();
}

/**
 * Common reCAPTCHA verification logic
 */
async function verifyRecaptchaLogic(token: string): Promise<{isValid: boolean; score: number}> {
  try {
    const secretKey = await getRecaptchaSecret();
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const response: AxiosResponse<AssessmentResponseV3> = await axios.post(verificationUrl);
    const {success, score} = response.data;
    const finalScore = score ?? 0;

    const isValid = success && finalScore >= 0.5;

    return {isValid, score: finalScore};
  } catch (error) {
    logger.error("reCAPTCHA verification error:", error);
    return {isValid: false, score: 0};
  }
}

const getNoirEmailTemplate = (title: string, message: string, ctaLink?: string, ctaText?: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: #050505; color: #d4d4d4; font-family: 'Courier New', Courier, monospace; font-display: swap; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #c5a059; }
        .header { background-color: #080808; padding: 20px; text-align: center; border-bottom: 1px solid #333; }
        .logo { color: #c5a059; font-size: 20px; font-weight: bold; text-decoration: none; letter-spacing: 4px; }
        .content { padding: 40px 30px; text-align: left; }
        h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; border-left: 3px solid #c5a059; padding-left: 15px; }
        .btn { display: inline-block; background-color: #c5a059; color: #000; padding: 14px 28px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { background-color: #080808; padding: 20px; text-align: center; font-size: 10px; color: #444; border-top: 1px solid #333; }
        .footer a { color: #666; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><a href="https://thesinsofthefathers.com" class="logo">TSOF // INTEL</a></div>
        <div class="content">
          <h1>${title}</h1>
          <p>${message}</p>
          ${ctaLink ? `<div style="text-align:center"><a href="${ctaLink}" class="btn">${ctaText || "ACCESS"}</a></div>` : ""}
        </div>
        <div class="footer">
          <p>TOP SECRET // EYES ONLY</p>
          <p>&copy; 2025 The Sins of the Fathers.</p>
          <p><a href="#">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// --------------------------------------------------------------------------
//  CLOUD FUNCTIONS
// --------------------------------------------------------------------------

export const verifyRecaptchaToken = onCall({
  region: REGION,
  cors: true,
}, async (request: CallableRequest<RecaptchaVerificationData>) => {
  const {token, action} = request.data;
  const uid = request.auth?.uid;

  if (!token || !action) {
    throw new HttpsError("invalid-argument", "Token/action required.");
  }

  const result = await verifyRecaptchaLogic(token);

  if (!result.isValid) {
    logger.warn(`Security check failed. Score: ${result.score}`);
    throw new HttpsError("permission-denied", "Bot detected.");
  }

  logger.info(`reCAPTCHA Success for User: ${uid || "Guest"} Action: ${action}`);
  return {success: true, score: result.score};
});

export const onNewSubscriber = onDocumentCreated({
  region: REGION,
  document: "subscribers/{subscriberId}",
  secrets: ["resend-api-key"],
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data() as SubscriberData;
  const email = data.email;

  if (!email) {
    logger.warn("No email found.");
    return;
  }

  const resendApiKey = process.env["resend-api-key"];

  if (!resendApiKey) {
    logger.error("resend-api-key is missing.");
    return;
  }

  const resend = new Resend(resendApiKey);

  try {
    const {data: emailData, error} = await resend.emails.send({
      from: "The Sins of the Fathers <intel@thesinsofthefathers.com>",
      to: [email],
      subject: "Access Granted: Welcome to the Network",
      html: getNoirEmailTemplate(
        "IDENTITY CONFIRMED",
        "Your clearance level has been established. You are now part of the inner circle.<br><br>Expect further instructions via this secure channel.",
        "https://thesinsofthefathers.com/pages/timeline.html",
        "ENTER ARCHIVES"
      ),
    });

    if (error) {
      logger.error("Resend Error:", error);
      return;
    }
    logger.info(`Welcome email sent to ${email}. ID: ${emailData?.id}`);
  } catch (err) {
    logger.error("Error in onNewSubscriber:", err);
  }
});
