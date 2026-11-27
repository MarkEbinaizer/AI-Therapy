import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import exercises from "../data/exercises.js";

const router = express.Router();
router.use(requireAuth);

const ALLOWED_DAYS = [7, 14, 30, 90];

router.get("/", async (req, res) => {
  const requested = Number(req.query.days);
  const days = ALLOWED_DAYS.includes(requested) ? requested : 30;
  const includeJournal = req.query.includeJournal === "true";
  const uid = req.userId;

  try {
    const [user, moodStats, weekly, exStats, distortions, hw, hwList] =
      await Promise.all([
        pool.query("SELECT name FROM users WHERE id = $1", [uid]),
        pool.query(
          `SELECT COUNT(*)::int AS count, AVG(score)::float AS avg,
                  MIN(score) AS min, MAX(score) AS max
           FROM moods
           WHERE user_id = $1 AND created_at > NOW() - make_interval(days => $2::int)`,
          [uid, days]
        ),
        pool.query(
          `SELECT to_char(date_trunc('week', created_at), 'YYYY-MM-DD') AS week_start,
                  AVG(score)::float AS avg, COUNT(*)::int AS count
           FROM moods
           WHERE user_id = $1 AND created_at > NOW() - make_interval(days => $2::int)
           GROUP BY week_start ORDER BY week_start`,
          [uid, days]
        ),
        pool.query(
          `SELECT exercise_id, COUNT(*)::int AS count,
                  AVG(feeling_after - feeling_before)::float AS avg_change
           FROM exercise_completions
           WHERE user_id = $1 AND created_at > NOW() - make_interval(days => $2::int)
           GROUP BY exercise_id ORDER BY count DESC`,
          [uid, days]
        ),
        pool.query(
          `SELECT d->>'name' AS name, COUNT(*)::int AS count
           FROM thought_records, jsonb_array_elements(distortions) AS d
           WHERE user_id = $1 AND created_at > NOW() - make_interval(days => $2::int)
           GROUP BY name ORDER BY count DESC LIMIT 5`,
          [uid, days]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::int AS completed,
                  COUNT(*) FILTER (WHERE completed_at IS NULL AND due_date < CURRENT_DATE)::int AS overdue
           FROM homework
           WHERE user_id = $1 AND created_at > NOW() - make_interval(days => $2::int)`,
          [uid, days]
        ),
        pool.query(
          `SELECT title, assigned_by,
                  to_char(due_date, 'YYYY-MM-DD') AS due_date,
                  (completed_at IS NOT NULL) AS done
           FROM homework
           WHERE user_id = $1 AND created_at > NOW() - make_interval(days => $2::int)
           ORDER BY created_at DESC LIMIT 20`,
          [uid, days]
        ),
      ]);

    let journal = [];
    let moodNotes = [];
    if (includeJournal) {
      const [j, n] = await Promise.all([
        pool.query(
          `SELECT situation, thought, distortions, reframe, created_at
           FROM thought_records
           WHERE user_id = $1 AND created_at > NOW() - make_interval(days => $2::int)
           ORDER BY created_at DESC LIMIT 20`,
          [uid, days]
        ),
        pool.query(
          `SELECT score, note, created_at
           FROM moods
           WHERE user_id = $1 AND note IS NOT NULL
             AND created_at > NOW() - make_interval(days => $2::int)
           ORDER BY created_at DESC LIMIT 20`,
          [uid, days]
        ),
      ]);
      journal = j.rows;
      moodNotes = n.rows;
    }

    res.json({
      name: user.rows[0]?.name || "",
      days,
      includeJournal,
      generatedAt: new Date().toISOString(),
      mood: moodStats.rows[0],
      weekly: weekly.rows,
      exercises: exStats.rows.map((e) => ({
        title:
          exercises.find((x) => x.id === e.exercise_id)?.title || e.exercise_id,
        count: e.count,
        avgChange: e.avg_change,
      })),
      distortions: distortions.rows,
      homework: { ...hw.rows[0], items: hwList.rows },
      journal,
      moodNotes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;