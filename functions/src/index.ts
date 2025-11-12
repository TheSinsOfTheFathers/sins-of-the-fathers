/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import {onCall, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios, {AxiosResponse} from "axios";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
import {Resend} from "resend";

const RECAPTCHA_SITE_KEY = "6LeoRfYrAAAAANpaxG70cHRmK5ciRKf7sVt9Crnz";

// --- E-POSTA ŞABLONU ---
const welcomeEmailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to the Saga</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Lato', sans-serif;
            background-color: #0a0a0a;
            color: #e0e0e0;
            margin: 0;
            padding: 20px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .wrapper {
            background-color: #0a0a0a;
            padding: 20px 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1c1c1c;
            border: 1px solid #444;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
        .header {
            padding: 50px 30px;
            text-align: center;
            border-bottom: 1px solid #ca8a04;
        }
        .header h1 {
            font-family: 'Cormorant Garamond', serif;
            color: #f5d38c;
            font-size: 42px;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
        }
        .content {
            padding: 40px 30px;
            line-height: 1.7;
            text-align: center;
        }
        .content p {
            margin: 0 0 25px;
            font-size: 16px;
            color: #c7c7c7;
        }
        .content p.salutation {
            font-size: 18px;
            font-weight: bold;
            color: #e0e0e0;
        }
        .content p.signature {
            font-style: italic;
            color: #a0a0a0;
        }
        .button-container {
            text-align: center;
            margin-top: 30px;
        }
        .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #ca8a04;
            color: #111;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s ease, transform 0.2s ease;
        }
        .button:hover {
            background-color: #e7a82b;
            transform: translateY(-2px);
        }
        .footer {
            text-align: center;
            padding: 25px;
            font-size: 12px;
            color: #777;
            background-color: #111;
            border-top: 1px solid #333;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>The Sins of the Fathers</h1>
            </div>
            <div class="content">
                <p class="salutation">Welcome, initiate.</p>
                <p>Thank you for subscribing. You are now among the first who will be notified when the saga begins. The chronicles are being written, and the debts of the past will soon be revealed.</p>
                <p class="signature">Stay vigilant.</p>
                <div class="button-container">
                    <a href="https://thesinsofthefathers.com/" class="button" style="color: #111; text-decoration: none;">Return to the Portal</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2025 Sins of the Fathers. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

admin.initializeApp();

const secretManagerClient = new SecretManagerServiceClient();
const REGION = "europe-west3";

let resend: Resend;

async function getSecret(fullSecretPath: string): Promise<string> {
  try {
    const [version] = await secretManagerClient.accessSecretVersion({name: fullSecretPath});
    const secretValue = version.payload?.data?.toString();
    if (!secretValue) {
      throw new Error(`Secret ${fullSecretPath} not found or is empty.`);
    }
    return secretValue;
  } catch (error) {
    logger.error(`Failed to access secret ${fullSecretPath}:`, error);
    throw new HttpsError("internal", `Could not retrieve secret: ${fullSecretPath}.`);
  }
}

async function initializeResend() {
  if (!resend) {
    const apiKey = await getSecret("projects/287213062167/secrets/resend-api-key/versions/1");
    resend = new Resend(apiKey);
  }
}

// --- reCAPTCHA Fonksiyonları (Mevcut Kod) ---
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

async function verifyRecaptcha(
  token: string,
  action: string,
  uid?: string | null,
  email?: string | null
): Promise<{isValid: boolean, score: number, labels: string[]}> {
  let secretKey: string;
  try {
    secretKey = await getSecret("projects/287213062167/secrets/RECAPTCHA_SECRET_KEY/versions/latest");
  } catch (error) {
    return {isValid: false, score: 0, labels: []};
  }

  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  try {
    const requestBody: { [key: string]: any } = {
      event: {
        token: token,
        siteKey: RECAPTCHA_SITE_KEY,
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

export const verifyRecaptchaToken = onCall({
  region: REGION,
  cors: true,
}, async (request: CallableRequest<RecaptchaVerificationData>) => {
  const {token, action} = request.data;
  const uid = request.auth?.uid;
  const email = request.auth?.token.email;

  if (!token || typeof token !== "string" || !action || typeof action !== "string") {
    logger.warn("Missing or invalid reCAPTCHA token/action.");
    throw new HttpsError("invalid-argument", "Token and action are required arguments.");
  }

  const verificationResult = await verifyRecaptcha(token, action, uid, email);

  if (!verificationResult.isValid) {
    logger.warn(`Security check failed. Score: ${verificationResult.score}`);
    throw new HttpsError("permission-denied", "Security check failed. Please try again.");
  }

  logger.info(`reCAPTCHA verification SUCCESS for User ID: ${uid || "Guest"} on action: ${action}`);

  return {success: true, message: "Verification successful.", score: verificationResult.score};
});


// --- YENİ E-POSTA GÖNDERME FONKSİYONU ---
export const onNewSubscriber = functions.region(REGION).firestore
  .document("subscribers/{subscriberId}")
  .onCreate(async (snap: functions.firestore.QueryDocumentSnapshot) => {
    const subscriber = snap.data();
    const email = subscriber.email;

    if (!email) {
      logger.error("Subscriber document is missing 'email' field.", {
        subscriberId: snap.id,
      });
      return;
    }

    try {
      await initializeResend();

      const {data, error} = await resend.emails.send({
        from: "Sins of the Fathers <noreply@thesinsofthefathers.com>",
        to: [email],
        subject: "Welcome to the Saga",
        html: welcomeEmailTemplate,
      });

      if (error) {
        logger.error("Resend API error:", error);
        return;
      }

      logger.info(`Welcome email sent to ${email}. Message ID: ${data?.id}`);
    } catch (error) {
      logger.error("An unexpected error occurred in onNewSubscriber:", error);
    }
  });

