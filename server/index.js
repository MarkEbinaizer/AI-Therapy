import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import moodRoutes from "./routes/moods.js";
import journalRoutes from "./routes/journal.js";
import exerciseRoutes from "./routes/exercises.js";
import meditationRoutes from "./routes/meditations.js";
import supportRoutes from "./routes/support.js";
import homeworkRoutes from "./routes/homework.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "not connected" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/meditations", meditationRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/homework", homeworkRoutes);
app.listen(process.env.PORT || 5000, () => console.log("Server running"));