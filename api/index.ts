import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import eventRoutes from "../src/routes/events";
import authRoutes from "../src/routes/auth";
import { pool } from "../src/db/index";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Serve static files from public directory
app.use(express.static("public"));

// Routes
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);

// Test database connection
pool
  .connect()
  .then(() => console.log("Connected to PGSQL"))
  .catch((err) => console.log("db connection error:", err.stack));

// Export for Vercel serverless
export default app;
