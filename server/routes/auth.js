import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();

function makeToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [
      cleanEmail,
    ]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name.trim(), cleanEmail, passwordHash]
    );

    const user = result.rows[0];
    res.status(201).json({ user, token: makeToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token: makeToken(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;