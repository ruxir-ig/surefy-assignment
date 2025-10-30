import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import eventRoutes from "../src/routes/events";
import authRoutes from "../src/routes/auth";
import path from "path";

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
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Serve static files from public directory
const publicPath = path.join(process.cwd(), "public");
app.use(express.static(publicPath));

// Routes
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Export handler for Vercel serverless
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any);
};
