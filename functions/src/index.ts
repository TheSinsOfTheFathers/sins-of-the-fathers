/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import {onCall, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios"; // Type 'AxiosResponse' not explicitly needed unless inferred
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";

admin.initializeApp();

const secretManagerClient = new SecretManagerServiceClient();
// Eğer function Frankfurt'ta (europe-west3) ise cloud scheduler vs. için bu önemlidir.
const REGION = "europe-west3";

interface RecaptchaVerificationData {
  token: string;
  action: string;
}

/**
 * Google'dan dönen standart v3 yanıt tipi
 */
interface RecaptchaSiteVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
  hostname?: string;
}

async function getRecaptchaSecret(): Promise<string> {
  const SECRET_NAME = "projects/287213062167/secrets/RECAPTCHA_SECRET_KEY/versions/latest";

  // Sürüm erişimi maliyetli olabilir, basit projelerde env variable (defineSecret) daha performanslıdır.
  // Ancak Secret Manager daha güvenlidir.
  const [version] = await secretManagerClient.accessSecretVersion({name: SECRET_NAME});

  if (!version.payload?.data) {
    throw new Error("reCAPTCHA secret not found or is empty.");
  }
  return version.payload.data.toString();
}

async function verifyRecaptcha(
  token: string,
  action: string
): Promise<{isValid: boolean, score: number, errors: string[]}> {
  let secretKey: string;
  try {
    secretKey = await getRecaptchaSecret();
  } catch (error) {
    logger.error("Secret Manager Error:", error);
    // Kritik hata durumunda kullanıcının önünü kesmemek için fail-open veya fail-close kararı verilmelidir.
    // Burada güvenli olan fail-close (reddetme).
    return {isValid: false, score: 0, errors: ["internal-secret-error"]};
  }

  const verificationUrl = "https://www.google.com/recaptcha/api/siteverify";

  try {
    // STANDART V3 DÜZELTMESİ:
    // API JSON body değil, x-www-form-urlencoded bekler.
    const params = new URLSearchParams();
    params.append("secret", secretKey);
    params.append("response", token);
    // params.append("remoteip", "..."); // İsteğe bağlı IP eklenebilir ama Cloud Function ortamında yanıltıcı olabilir.

    const response = await axios.post<RecaptchaSiteVerifyResponse>(verificationUrl, params, {
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
    });

    const data = response.data;
    const finalScore = data.score ?? 0;

    // Google doğrulama başarısızsa (API seviyesinde) veya aksiyon uyuşmazlığı varsa
    if (!data.success) {
      logger.warn("reCAPTCHA API responded false", data);
      return {isValid: false, score: 0, errors: data["error-codes"] || []};
    }

    // Aksiyon kontrolü (Önemli! Token başka bir sayfadan çalınmış olabilir)
    if (data.action && data.action !== action) {
      logger.warn(`reCAPTCHA Action Mismatch. Expected: ${action}, Got: ${data.action}`);
      return {isValid: false, score: finalScore, errors: ["action-mismatch"]};
    }

    logger.info(`Verification Result: Success=${data.success}, Score=${finalScore}`);

    // Eşik değeri (0.5 standarttır, projenin paranoya seviyesine göre 0.6 veya 0.7 yapılabilir)
    if (finalScore >= 0.5) {
      return {isValid: true, score: finalScore, errors: []};
    }

    return {isValid: false, score: finalScore, errors: ["low-score"]};
  } catch (error) {
    logger.error("Axios Error verifyRecaptcha:", error);
    return {isValid: false, score: 0, errors: ["connection-error"]};
  }
}

export const verifyRecaptchaToken = onCall({
  region: REGION,
  cors: true, // Front-end farklı domainde ise (vercel) true olmalı.
}, async (request: CallableRequest<RecaptchaVerificationData>) => {
  const {token, action} = request.data;

  // UID kontrolü, reCAPTCHA doğrulamasından BAĞIMSIZ, uygulamanın kendi "Gatekeeper" mantığıdır.
  // UID buraya gelir ama siteverify API'sine gönderilmez (Çünkü desteklemez).
  // const uid = request.auth?.uid;

  if (!token || !action) {
    throw new HttpsError("invalid-argument", "Token and action are required.");
  }

  const result = await verifyRecaptcha(token, action);

  if (!result.isValid) {
    logger.warn(`Blocking request due to reCAPTCHA failure. Score: ${result.score}`);
    // Saldırgana çok detay vermemek için sadece 'Security check failed' denir.
    throw new HttpsError("permission-denied", "Security check failed.");
  }

  return {
    success: true,
    score: result.score,
  };
});
