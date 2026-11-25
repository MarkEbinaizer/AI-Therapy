import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function Support() {
  const token = localStorage.getItem("token");
  const [shows, setShows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/support`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not load this section");
          return;
        }
        setShows(data);
      } catch {
        setError("Server not reachable");
      }
    }
    load();
  }, []);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>You're not alone</h2>
      <p>
        Lots of people deal with low mood and loneliness, and hearing others talk
        about it honestly can help. Here are a few podcasts to try.
      </p>
      <p style={{ color: "#777", fontSize: 14 }}>
        These are for support and learning, not treatment. If low mood or
        loneliness is lasting for weeks, or affecting sleep, work or appetite,
        it's worth talking to a doctor or counsellor. In India you can call
        Tele-MANAS any time on 14416 or 1-800-891-4416 (free).
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {shows.map((s) => (
        <div
          key={s.id}
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 0",
            borderBottom: "1px solid #ddd",
          }}
        >
          {s.artwork && (
            <img
              src={s.artwork}
              alt=""
              width="90"
              height="90"
              style={{ flexShrink: 0, objectFit: "cover" }}
            />
          )}
          <div>
            <b>{s.name}</b>{" "}
            <span style={{ color: "#777" }}>· {s.tag}</span>
            <div style={{ color: "#777", fontSize: 14 }}>{s.by}</div>
            <div style={{ marginTop: 4 }}>{s.why}</div>
            {s.note && (
              <div style={{ marginTop: 4, fontSize: 14, color: "#8a5a00" }}>
                Note: {s.note}
              </div>
            )}
            <a
              href={s.link}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-block", marginTop: 6 }}
            >
              Listen on Apple Podcasts
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}