// firebase.js
import admin from "firebase-admin";
import serviceAccount from "../fb.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "dhaaba-fusion-be.firebasestorage.app",
});

export const bucket = admin.storage().bucket();
