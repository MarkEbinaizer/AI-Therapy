import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import exercises from "../data/exercises.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json(exercises);
});

router.get("/history", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, exercise_id, feeling_before, feeling_after, note, created_at FROM exercise_completions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30",
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

function rating(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : NaN;
}

router.post("/:id/complete", async (req, res) => {
  const exercise = exercises.find((e) => e.id === req.params.id);
  if (!exercise) {
    return res.status(404).json({ error: "Exercise not found" });
  }

  const before = rating(req.body.feelingBefore);
  const after = rating(req.body.feelingAfter);
  if (Number.isNaN(before) || Number.isNaN(after)) {
    return res.status(400).json({ error: "Ratings must be between 1 and 10" });
  }

  const note = (req.body.note || "").trim();
  if (note.length > 1000) {
    return res.status(400).json({ error: "Note is too long" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO exercise_completions (user_id, exercise_id, feeling_before, feeling_after, note) VALUES ($1, $2, $3, $4, $5) RETURNING id, exercise_id, feeling_before, feeling_after, note, created_at",
      [req.userId, exercise.id, before, after, note || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;