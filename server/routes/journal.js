import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import { analyzeThought } from "../ai.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, situation, thought, distortions, reframe, created_at FROM thought_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/", async (req, res) => {
  const situation = (req.body.situation || "").trim();
  const thought = (req.body.thought || "").trim();

  if (!thought) {
    return res.status(400).json({ error: "Please write your thought" });
  }
  if (thought.length > 2000 || situation.length > 2000) {
    return res.status(400).json({ error: "Entry is too long" });
  }

  // analyzeThought never throws; if the AI fails, we still save the entry
  const analysis = await analyzeThought(thought, situation);

  try {
    const result = await pool.query(
      "INSERT INTO thought_records (user_id, situation, thought, distortions, reframe) VALUES ($1, $2, $3, $4, $5) RETURNING id, situation, thought, distortions, reframe, created_at",
      [
        req.userId,
        situation || null,
        thought,
        JSON.stringify(analysis.distortions),
        analysis.reframe,
      ]
    );
    res.status(201).json({
      entry: result.rows[0],
      crisis: analysis.crisis,
      aiFailed: analysis.failed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM thought_records WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;