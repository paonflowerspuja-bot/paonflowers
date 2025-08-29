// server/routes/firebaseAdmin.js
import express from "express";
import admin from "firebase-admin";

// Option 1: use GOOGLE_APPLICATION_CREDENTIALS file path (less ideal on Render free)
// Option 2 (better): load JSON from env var FIREBASE_SA_JSON
const sa = JSON.parse(process.env.FIREBASE_SA_JSON);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const router = express.Router();

router.post("/send-notification", async (req, res) => {
  const { token, payload } = req.body;
  await admin.messaging().send({ token, ...payload });
  res.json({ ok: true });
});

export default router;
