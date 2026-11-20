import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function Moods() {
  const token = localStorage.getItem("token");
  const [moods, setMoods] = useState([]);
  const [score, setScore] = useState(5);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function load() {
    try {
      const res = await fetch(`${API}/moods`, { headers });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load moods");
        return;
      }
      setMoods(data);
    } catch {
      setError("Server not reachable");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addMood() {
    setError("");
    try {
      const res = await fetch(`${API}/moods`, {
        method: "POST",
        headers,
        body: JSON.stringify({ score, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save mood");
        return;
      }
      setMoods([data, ...moods]);
      setNote("");
      setScore(5);
    } catch {
      setError("Server not reachable");
    }
  }

  async function removeMood(id) {
    try {
      await fetch(`${API}/moods/${id}`, { method: "DELETE", headers });
      setMoods(moods.filter((m) => m.id !== id));
    } catch {
      setError("Server not reachable");
    }
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h2>How are you feeling?</h2>

      <label>
        Mood: <b>{score}</b> / 10 (1 = very low, 10 = great)
      </label>
      <input
        type="range"
        min="1"
        max="10"
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        style={{ display: "block", width: "100%", marginBottom: 10 }}
      />

      <textarea
        placeholder="Anything on your mind? (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={addMood} style={{ padding: "8px 16px" }}>
        Save mood
      </button>

      <h3 style={{ marginTop: 30 }}>History</h3>
      {moods.length === 0 && <p>No entries yet.</p>}
      {moods.map((m) => (
        <div
          key={m.id}
          style={{ borderBottom: "1px solid #ddd", padding: "8px 0" }}
        >
          <b>{m.score}/10</b>{" "}
          <span style={{ color: "#777" }}>
            {new Date(m.created_at).toLocaleString()}
          </span>
          {m.note && <div>{m.note}</div>}
          <button onClick={() => removeMood(m.id)} style={{ marginTop: 4 }}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}