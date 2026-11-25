import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

const TOPICS = [
  ["stress", "Stress"],
  ["anxiety", "Anxiety"],
  ["sleep", "Sleep"],
  ["focus", "Focus"],
  ["breathing", "Breathing"],
];

// YouTube sends titles with HTML codes like &amp;
function clean(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export default function Meditations() {
  const token = localStorage.getItem("token");
  const [topic, setTopic] = useState("stress");
  const [items, setItems] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setPlaying(null);
      try {
        const res = await fetch(`${API}/meditations?topic=${topic}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setItems([]);
          setError(data.error || "Could not load meditations");
          return;
        }
        setItems(data);
      } catch {
        if (!cancelled) setError("Server not reachable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [topic]);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>Guided meditations</h2>
      <p style={{ color: "#777", fontSize: 14 }}>
        Videos come from YouTube. Pick a topic and press play.
      </p>

      <div style={{ marginBottom: 12 }}>
        {TOPICS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTopic(key)}
            style={{
              marginRight: 6,
              padding: "6px 12px",
              fontWeight: topic === key ? "bold" : "normal",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {playing && (
        <div style={{ marginBottom: 16 }}>
          <iframe
            width="100%"
            height="260"
            src={`https://www.youtube-nocookie.com/embed/${playing}`}
            title="Guided meditation"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {items.map((v) => (
        <div
          key={v.videoId}
          onClick={() => setPlaying(v.videoId)}
          style={{
            display: "flex",
            gap: 10,
            padding: "8px 0",
            borderBottom: "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          {v.thumbnail && (
            <img src={v.thumbnail} alt="" width="120" style={{ flexShrink: 0 }} />
          )}
          <div>
            <b>{clean(v.title)}</b>
            <div style={{ color: "#777" }}>{clean(v.channel)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}