import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function Homework() {
  const token = localStorage.getItem("token");
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [assignedBy, setAssignedBy] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // today as YYYY-MM-DD in the user's own time zone
  const today = new Date().toLocaleDateString("en-CA");

  async function load() {
    try {
      const res = await fetch(`${API}/homework`, { headers });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load tasks");
        return;
      }
      setItems(data);
    } catch {
      setError("Server not reachable");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTask() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${API}/homework`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title, details, assignedBy, dueDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save task");
        return;
      }
      setTitle("");
      setDetails("");
      setAssignedBy("");
      setDueDate("");
      await load();
    } catch {
      setError("Server not reachable");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id) {
    setError("");
    try {
      const res = await fetch(`${API}/homework/${id}/toggle`, {
        method: "PATCH",
        headers,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Could not update task");
        return;
      }
      await load();
    } catch {
      setError("Server not reachable");
    }
  }

  async function remove(id) {
    try {
      await fetch(`${API}/homework/${id}`, { method: "DELETE", headers });
      setItems(items.filter((i) => i.id !== id));
    } catch {
      setError("Server not reachable");
    }
  }

  const doneCount = items.filter((i) => i.completed_at).length;
  const inputStyle = {
    display: "block",
    width: "100%",
    marginBottom: 10,
    padding: 8,
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>Homework</h2>
      <p style={{ color: "#777", fontSize: 14 }}>
        Tasks from your therapist or ones you set yourself, to practise between
        sessions.
      </p>

      <input
        placeholder="Task (for example: do a thought record 3 times this week)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Details (optional)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={2}
        style={inputStyle}
      />
      <input
        placeholder="Assigned by (optional)"
        value={assignedBy}
        onChange={(e) => setAssignedBy(e.target.value)}
        style={inputStyle}
      />
      <label style={{ display: "block", marginBottom: 10 }}>
        Due date (optional){" "}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={addTask} disabled={saving} style={{ padding: "8px 16px" }}>
        {saving ? "Saving..." : "Add task"}
      </button>

      <h3 style={{ marginTop: 30 }}>
        Your tasks{" "}
        {items.length > 0 && (
          <span style={{ color: "#777", fontSize: 16 }}>
            ({doneCount} of {items.length} done)
          </span>
        )}
      </h3>
      {items.length === 0 && <p>No tasks yet.</p>}

      {items.map((i) => {
        const done = Boolean(i.completed_at);
        const overdue = !done && i.due_date && i.due_date < today;
        return (
          <div
            key={i.id}
            style={{
              display: "flex",
              gap: 10,
              padding: "10px 0",
              borderBottom: "1px solid #ddd",
            }}
          >
            <input
              type="checkbox"
              checked={done}
              onChange={() => toggle(i.id)}
              aria-label={`Mark "${i.title}" as done`}
              style={{ marginTop: 4 }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: "bold",
                  textDecoration: done ? "line-through" : "none",
                  color: done ? "#777" : "inherit",
                }}
              >
                {i.title}
              </div>
              {i.details && <div>{i.details}</div>}
              <div style={{ color: "#777", fontSize: 14 }}>
                {i.assigned_by && <span>From {i.assigned_by} · </span>}
                {i.due_date && <span>Due {i.due_date}</span>}
                {overdue && (
                  <span style={{ color: "#c0392b", fontWeight: "bold" }}>
                    {" "}
                    · Overdue
                  </span>
                )}
              </div>
              <button onClick={() => remove(i.id)} style={{ marginTop: 4 }}>
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}