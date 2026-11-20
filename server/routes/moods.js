import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, score, note, created_at FROM moods WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30",
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/", async (req, res) => {
  const score = Number(req.body.score);
  const note = (req.body.note || "").trim();

  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return res.status(400).json({ error: "Score must be between 1 and 10" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO moods (user_id, score, note) VALUES ($1, $2, $3) RETURNING id, score, note, created_at",
      [req.userId, score, note || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM moods WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.userId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;