import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { Resend } from "resend";
import { REGION } from "../config/firebase";
import { SubscriberData } from "../types/index";
import { getNoirEmailTemplate } from "../helpers/email";

/**
 * 2. Yeni Abone Tetikleyicisi (Email Gönderimi)
 */
export const onNewSubscriber = onDocumentCreated(
  {
    region: REGION,
    document: "subscribers/{subscriberId}",
    secrets: ["RESEND_API_KEY"],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data() as SubscriberData;
    const email = data.email;

    if (!email) {
      logger.warn("No email found.");
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      logger.error("RESEND_API_KEY is missing.");
      return;
    }

    const resend = new Resend(resendApiKey);

    try {
      const { data: emailData, error } = await resend.emails.send({
        from: "The Sins of the Fathers <intel@thesinsofthefathers.com>",
        to: [email],
        subject: "Access Granted: Welcome to the Network",
        html: getNoirEmailTemplate(
          "IDENTITY CONFIRMED",
          "Your clearance level has been established. You are now part of the inner circle.<br><br>Expect further instructions via this secure channel.",
          "https://thesinsofthefathers.com/",
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
  }
);
