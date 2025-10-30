// console.log("Hello via Bun!");

import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import eventRoutes from "./routes/events";
import authRoutes from "./routes/auth";
import { pool } from "./db/index";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());

// Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Serve static files from public directory
app.use(express.static("public"));

// Routes
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);

const PORT = process.env.PORT || 3000;

pool
  .connect()
  .then(() => console.log("Connected to PGSQL"))
  .catch((err) => console.log("db connection error:", err.stack()));

// For Vercel, export the app instead of listening
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;
