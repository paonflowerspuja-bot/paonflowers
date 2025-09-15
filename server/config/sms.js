// config/sms.js
import twilio from "twilio";

const SMS_DRY_RUN = String(process.env.SMS_DRY_RUN).toLowerCase() === "true";
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

const client =
  ACCOUNT_SID && AUTH_TOKEN ? twilio(ACCOUNT_SID, AUTH_TOKEN) : null;

export const sendOtpViaSms = async (phone) => {
  if (!client || !VERIFY_SID || SMS_DRY_RUN) {
    console.log(
      `📨 [DRY RUN] OTP requested for ${phone}. Twilio disabled/dry-run.`
    );
    return { ok: true, dryRun: true };
  }
  await client.verify.v2
    .services(VERIFY_SID)
    .verifications.create({ to: phone, channel: "sms" });
  return { ok: true };
};

export const checkOtpViaTwilioVerify = async (phone, code) => {
  if (!client || !VERIFY_SID || SMS_DRY_RUN) {
    console.log(
      `🔎 [DRY RUN] OTP check for ${phone} with code ${code}. Returning true.`
    );
    return true;
  }
  const resp = await client.verify.v2
    .services(VERIFY_SID)
    .verificationChecks.create({ to: phone, code });
  return resp.status === "approved";
};
