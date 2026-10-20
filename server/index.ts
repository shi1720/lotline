import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createApp } from "./app";
const firebase = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT,
});
const origins = (process.env.ALLOWED_ORIGINS || process.env.PUBLIC_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (!origins.length && process.env.NODE_ENV === "production")
  throw new Error("ALLOWED_ORIGINS is required in production.");
const app = createApp({
  auth: getAuth(),
  db: getFirestore(firebase, process.env.FIRESTORE_DATABASE_ID || "lotline"),
  allowedOrigins: origins,
  development: process.env.NODE_ENV !== "production",
});
app.listen(Number(process.env.PORT) || 8080, "0.0.0.0", () =>
  console.log("Lotline API listening"),
);
