import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();
router.use(requireAuth);

// to_char keeps the date as plain text so time zones can't shift it
const COLUMNS =
  "id, title, details, assigned_by, to_char(due_date, 'YYYY-MM-DD') AS due_date, completed_at, created_at";

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM homework
       WHERE user_id = $1
       ORDER BY (completed_at IS NOT NULL), due_date ASC NULLS LAST, created_at DESC
       LIMIT 100`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/", async (req, res) => {
  const title = (req.body.title || "").trim();
  const details = (req.body.details || "").trim();
  const assignedBy = (req.body.assignedBy || "").trim();
  const dueDate = (req.body.dueDate || "").trim();

  if (!title) {
    return res.status(400).json({ error: "Please give the task a title" });
  }
  if (title.length > 200 || assignedBy.length > 100 || details.length > 1000) {
    return res.status(400).json({ error: "Something you wrote is too long" });
  }
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return res.status(400).json({ error: "Invalid due date" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO homework (user_id, title, details, assigned_by, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNS}`,
      [req.userId, title, details || null, assignedBy || null, dueDate || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Postgres date errors (like Feb 31)
    if (["22007", "22008"].includes(err.code)) {
      return res.status(400).json({ error: "Invalid due date" });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.patch("/:id/toggle", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const result = await pool.query(
      `UPDATE homework
       SET completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE NULL END
       WHERE id = $1 AND user_id = $2
       RETURNING ${COLUMNS}`,
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    await pool.query("DELETE FROM homework WHERE id = $1 AND user_id = $2", [
      id,
      req.userId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;