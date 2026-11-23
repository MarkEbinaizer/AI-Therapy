import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function Journal() {
  const token = localStorage.getItem("token");
  const [entries, setEntries] = useState([]);
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [crisis, setCrisis] = useState(false);
  const [saving, setSaving] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/journal`, { headers });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not load journal");
          return;
        }
        setEntries(data);
      } catch {
        setError("Server not reachable");
      }
    }
    load();
  }, []);

  async function addEntry() {
    setError("");
    setNotice("");
    setCrisis(false);
    setSaving(true);
    try {
      const res = await fetch(`${API}/journal`, {
        method: "POST",
        headers,
        body: JSON.stringify({ situation, thought }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save entry");
        return;
      }
      setEntries([data.entry, ...entries]);
      setCrisis(data.crisis);
      if (data.aiFailed && !data.crisis) {
        setNotice("Saved, but the AI feedback isn't available right now.");
      }
      setSituation("");
      setThought("");
    } catch {
      setError("Server not reachable");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id) {
    try {
      await fetch(`${API}/journal/${id}`, { method: "DELETE", headers });
      setEntries(entries.filter((e) => e.id !== id));
    } catch {
      setError("Server not reachable");
    }
  }

  return (
    <div style={{ marginTop: 40 }}>
      <h2>Thought journal</h2>
      <p style={{ color: "#777", fontSize: 14 }}>
        A self-help tool, not a replacement for a therapist.
      </p>

      <input
        placeholder="What happened? (optional)"
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
      />
      <textarea
        placeholder="What thought is on your mind?"
        value={thought}
        onChange={(e) => setThought(e.target.value)}
        rows={4}
        style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {notice && <p style={{ color: "#777" }}>{notice}</p>}

      {crisis && (
        <div
          style={{
            border: "2px solid #c0392b",
            background: "#fdecea",
            color: "#222",
            padding: 12,
            marginBottom: 12,
          }}
        >
          <b>It sounds like you're going through something really painful.</b>
          <p>
            You don't have to handle it alone. In India, you can call Tele-MANAS
            for free, any time of day, on <b>14416</b> or <b>1-800-891-4416</b>.
            If you're in immediate danger, call <b>112</b>. Elsewhere, you can
            find a local helpline at findahelpline.com.
          </p>
          <p>This app can't provide crisis support. Your entry was saved.</p>
        </div>
      )}

      <button
        onClick={addEntry}
        disabled={saving}
        style={{ padding: "8px 16px" }}
      >
        {saving ? "Analyzing..." : "Save entry"}
      </button>

      <h3 style={{ marginTop: 30 }}>Past entries</h3>
      {entries.length === 0 && <p>No entries yet.</p>}
      {entries.map((e) => (
        <div
          key={e.id}
          style={{ borderBottom: "1px solid #ddd", padding: "10px 0" }}
        >
          <span style={{ color: "#777" }}>
            {new Date(e.created_at).toLocaleString()}
          </span>
          {e.situation && (
            <div>
              <b>Situation:</b> {e.situation}
            </div>
          )}
          <div>
            <b>Thought:</b> {e.thought}
          </div>

          {(e.distortions || []).length > 0 && (
            <div style={{ marginTop: 6 }}>
              <b>Possible thinking traps:</b>
              {e.distortions.map((d) => (
                <div key={d.name} style={{ marginLeft: 10 }}>
                  • <b>{d.name}:</b> {d.explanation}
                </div>
              ))}
            </div>
          )}

          {e.reframe && (
            <div
              style={{
                marginTop: 6,
                background: "#eef6ee",
                color: "#222",
                padding: 8,
              }}
            >
              <b>A more balanced way to see it:</b> {e.reframe}
            </div>
          )}

          <button onClick={() => removeEntry(e.id)} style={{ marginTop: 6 }}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}