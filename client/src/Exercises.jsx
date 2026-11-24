import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function Exercises() {
  const token = localStorage.getItem("token");
  const [exercises, setExercises] = useState([]);
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState(null);
  const [phase, setPhase] = useState("before");
  const [stepIndex, setStepIndex] = useState(0);
  const [before, setBefore] = useState(5);
  const [after, setAfter] = useState(5);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    async function load() {
      try {
        const [exRes, histRes] = await Promise.all([
          fetch(`${API}/exercises`, { headers }),
          fetch(`${API}/exercises/history`, { headers }),
        ]);
        const exData = await exRes.json();
        const histData = await histRes.json();
        if (!exRes.ok || !histRes.ok) {
          setError("Could not load exercises");
          return;
        }
        setExercises(exData);
        setHistory(histData);
      } catch {
        setError("Server not reachable");
      }
    }
    load();
  }, []);

  function start(exercise) {
    setActive(exercise);
    setPhase("before");
    setStepIndex(0);
    setBefore(5);
    setAfter(5);
    setNote("");
    setError("");
  }

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/exercises/${active.id}/complete`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          feelingBefore: before,
          feelingAfter: after,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save");
        return;
      }
      setHistory([data, ...history]);
      setActive(null);
    } catch {
      setError("Server not reachable");
    } finally {
      setSaving(false);
    }
  }

  const sliderStyle = { display: "block", width: "100%", marginBottom: 10 };

  if (active) {
    return (
      <div style={{ marginTop: 40 }}>
        <h2>{active.title}</h2>
        <p style={{ color: "#777" }}>
          {active.category} · about {active.minutes} min
        </p>

        {phase === "before" && (
          <div>
            <p>
              How are you feeling right now? <b>{before}</b> / 10
            </p>
            <input
              type="range"
              min="1"
              max="10"
              value={before}
              onChange={(e) => setBefore(Number(e.target.value))}
              style={sliderStyle}
            />
            <button onClick={() => setPhase("steps")}>Begin</button>
          </div>
        )}

        {phase === "steps" && (
          <div>
            <p style={{ color: "#777" }}>
              Step {stepIndex + 1} of {active.steps.length}
            </p>
            <p style={{ fontSize: 18, minHeight: 60 }}>
              {active.steps[stepIndex]}
            </p>
            <button
              onClick={() => setStepIndex(stepIndex - 1)}
              disabled={stepIndex === 0}
              style={{ marginRight: 8 }}
            >
              Back
            </button>
            {stepIndex < active.steps.length - 1 ? (
              <button onClick={() => setStepIndex(stepIndex + 1)}>Next</button>
            ) : (
              <button onClick={() => setPhase("after")}>I'm done</button>
            )}
          </div>
        )}

        {phase === "after" && (
          <div>
            <p>
              How are you feeling now? <b>{after}</b> / 10
            </p>
            <input
              type="range"
              min="1"
              max="10"
              value={after}
              onChange={(e) => setAfter(Number(e.target.value))}
              style={sliderStyle}
            />
            <textarea
              placeholder="Anything you noticed? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
            />
            <button onClick={finish} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button onClick={() => setActive(null)} style={{ marginTop: 20 }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 40 }}>
      <h2>Guided exercises</h2>
      <p style={{ color: "#777", fontSize: 14 }}>
        Self-help practices, not a replacement for professional care.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {exercises.map((ex) => (
        <div
          key={ex.id}
          style={{ borderBottom: "1px solid #ddd", padding: "10px 0" }}
        >
          <b>{ex.title}</b>{" "}
          <span style={{ color: "#777" }}>
            {ex.category} · {ex.minutes} min
          </span>
          <div>{ex.description}</div>
          <button onClick={() => start(ex)} style={{ marginTop: 6 }}>
            Start
          </button>
        </div>
      ))}

      <h3 style={{ marginTop: 30 }}>Recent practice</h3>
      {history.length === 0 && <p>Nothing yet. Try one above.</p>}
      {history.map((h) => {
        const ex = exercises.find((e) => e.id === h.exercise_id);
        return (
          <div
            key={h.id}
            style={{ borderBottom: "1px solid #ddd", padding: "8px 0" }}
          >
            <b>{ex ? ex.title : h.exercise_id}</b>{" "}
            <span style={{ color: "#777" }}>
              {new Date(h.created_at).toLocaleString()}
            </span>
            {h.feeling_before && h.feeling_after && (
              <div>
                Felt {h.feeling_before}/10 before, {h.feeling_after}/10 after
              </div>
            )}
            {h.note && <div>{h.note}</div>}
          </div>
        );
      })}
    </div>
  );
}