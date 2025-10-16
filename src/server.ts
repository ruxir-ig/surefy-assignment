// console.log("Hello via Bun!");

import express from "express";
import dotenv from "dotenv";
import eventRoutes from "./routes/events";
import { pool } from "./db/index";

dotenv.config();
const app = express();
app.use(express.json());

//routes
app.use("/events", eventRoutes);

const PORT = process.env.PORT || 3000;

pool.connect()
    .then(() => console.log("Connected to PGSQL"))
    .catch((err) => console.log("db connection error:", err.stack()));

app.listen(PORT, () =>{
    console.log(`Server running on http://localhost:${PORT}`);

})

