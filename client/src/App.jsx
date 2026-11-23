import { useState } from "react";
import Moods from "./Moods.jsx";
import Journal from "./Journal.jsx";

const API = "http://localhost:5000/api";

export default function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    setError("");
    try {
      const res = await fetch(`${API}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    } catch {
      setError("Server not reachable");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setForm({ name: "", email: "", password: "" });
  }

    if (user) {
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>Welcome, {user.name}</h1>
        <p>You're logged in as {user.email}</p>
        <button onClick={logout}>Log out</button>
        <Moods />
        <Journal />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>AI Therapy</h1>
      <h2>{mode === "login" ? "Log in" : "Sign up"}</h2>

      {mode === "signup" && (
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
        />
      )}
      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
      />
      <input
        name="password"
        type="password"
        placeholder="Password (min 8 characters)"
        value={form.password}
        onChange={handleChange}
        style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={handleSubmit} style={{ padding: "8px 16px" }}>
        {mode === "login" ? "Log in" : "Create account"}
      </button>

      <p>
        {mode === "login" ? "No account yet? " : "Already have an account? "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setError("");
            setMode(mode === "login" ? "signup" : "login");
          }}
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </a>
      </p>
    </div>
  );
}