// server/config/sms.js
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
  try {
    const resp = await client.verify.v2
      .services(VERIFY_SID)
      .verifications.create({ to: phone, channel: "sms" });
    console.log(
      `✅ Twilio Verify sent: to=${phone} sid=${resp.sid} status=${resp.status}`
    );
    return { ok: true, sid: resp.sid, status: resp.status };
  } catch (err) {
    // Twilio errors include code/message/moreInfo
    console.error("❌ Twilio Verify send error:", {
      code: err.code,
      message: err.message,
      moreInfo: err.moreInfo,
      status: err.status,
    });
    // rethrow so controller can surface a helpful error to the client
    throw err;
  }
};

export const checkOtpViaTwilioVerify = async (phone, code) => {
  if (!client || !VERIFY_SID || SMS_DRY_RUN) {
    console.log(
      `🔎 [DRY RUN] OTP check for ${phone} with code ${code}. Returning true.`
    );
    return true;
  }
  try {
    const resp = await client.verify.v2
      .services(VERIFY_SID)
      .verificationChecks.create({ to: phone, code });
    console.log(`🔎 Twilio Verify check: to=${phone} status=${resp.status}`);
    return resp.status === "approved";
  } catch (err) {
    console.error("❌ Twilio Verify check error:", {
      code: err.code,
      message: err.message,
      moreInfo: err.moreInfo,
      status: err.status,
    });
    return false;
  }
};
