import { useState } from "react";

const API = "http://localhost:5000/api";
const PERIODS = [7, 14, 30, 90];

function fmt(n) {
  return n == null ? "n/a" : n.toFixed(1);
}

const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  #report, #report * { visibility: visible; }
  #report { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
}
`;

export default function Report() {
  const token = localStorage.getItem("token");
  const [days, setDays] = useState(30);
  const [includeJournal, setIncludeJournal] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/report?days=${days}&includeJournal=${includeJournal}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create the report");
        return;
      }
      setReport(data);
    } catch {
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  }

  const cell = { padding: "4px 12px 4px 0", textAlign: "left" };

  return (
    <div style={{ marginTop: 40 }}>
      <style>{PRINT_CSS}</style>

      <div className="no-print">
        <h2>Report for your therapist</h2>
        <p style={{ color: "#777", fontSize: 14 }}>
          Create a summary you can save as a PDF and share. Only share what
          you're comfortable with.
        </p>

        <label>
          Period{" "}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                Last {p} days
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", margin: "10px 0" }}>
          <input
            type="checkbox"
            checked={includeJournal}
            onChange={(e) => setIncludeJournal(e.target.checked)}
          />{" "}
          Include my journal entries and mood notes (off by default)
        </label>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button onClick={generate} disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Creating..." : "Create report"}
        </button>
        {report && (
          <button
            onClick={() => window.print()}
            style={{ padding: "8px 16px", marginLeft: 8 }}
          >
            Print / Save as PDF
          </button>
        )}
      </div>

      {report && (
        <div
          id="report"
          style={{
            marginTop: 24,
            padding: 16,
            border: "1px solid #ccc",
            background: "#fff",
            color: "#222",
          }}
        >
          <h2 style={{ marginTop: 0 }}>AI Therapy: progress summary</h2>
          <div>
            <b>Name:</b> {report.name}
          </div>
          <div>
            <b>Period:</b> last {report.days} days (created{" "}
            {new Date(report.generatedAt).toLocaleDateString()})
          </div>
          <p style={{ fontSize: 13, color: "#555" }}>
            This summary comes from information the person entered in a self-help
            app. It is not a clinical assessment or a diagnosis.
          </p>

          <h3>Mood</h3>
          {report.mood.count === 0 ? (
            <p>No mood entries in this period.</p>
          ) : (
            <div>
              <div>
                {report.mood.count} entries, average {fmt(report.mood.avg)}/10
                (lowest {report.mood.min}, highest {report.mood.max})
              </div>
              <table style={{ marginTop: 8, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={cell}>Week starting</th>
                    <th style={cell}>Average mood</th>
                    <th style={cell}>Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {report.weekly.map((w) => (
                    <tr key={w.week_start}>
                      <td style={cell}>{w.week_start}</td>
                      <td style={cell}>{fmt(w.avg)}/10</td>
                      <td style={cell}>{w.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3>Exercises practised</h3>
          {report.exercises.length === 0 ? (
            <p>None in this period.</p>
          ) : (
            <ul>
              {report.exercises.map((e) => (
                <li key={e.title}>
                  {e.title}: {e.count} time{e.count === 1 ? "" : "s"}
                  {e.avgChange != null &&
                    `, average change in mood ${e.avgChange > 0 ? "+" : ""}${fmt(e.avgChange)}`}
                </li>
              ))}
            </ul>
          )}

          <h3>Thinking patterns noticed</h3>
          <p style={{ fontSize: 13, color: "#555" }}>
            Suggested by an AI from journal entries. These are not diagnoses.
          </p>
          {report.distortions.length === 0 ? (
            <p>None recorded in this period.</p>
          ) : (
            <ul>
              {report.distortions.map((d) => (
                <li key={d.name}>
                  {d.name}: {d.count} time{d.count === 1 ? "" : "s"}
                </li>
              ))}
            </ul>
          )}

          <h3>Homework</h3>
          {!report.homework.total ? (
            <p>No tasks in this period.</p>
          ) : (
            <div>
              <div>
                {report.homework.completed} of {report.homework.total} done
                {report.homework.overdue > 0 &&
                  `, ${report.homework.overdue} overdue`}
              </div>
              <ul>
                {report.homework.items.map((h, idx) => (
                  <li key={idx}>
                    {h.done ? "Done" : "Open"}: {h.title}
                    {h.assigned_by && ` (from ${h.assigned_by})`}
                    {h.due_date && `, due ${h.due_date}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.includeJournal && (
            <div>
              <h3>Journal entries (shared by choice)</h3>
              {report.journal.length === 0 ? (
                <p>No entries in this period.</p>
              ) : (
                report.journal.map((j, idx) => (
                  <div key={idx} style={{ marginBottom: 10 }}>
                    <div style={{ color: "#555", fontSize: 13 }}>
                      {new Date(j.created_at).toLocaleDateString()}
                    </div>
                    {j.situation && <div>Situation: {j.situation}</div>}
                    <div>Thought: {j.thought}</div>
                    {j.reframe && <div>Balanced view: {j.reframe}</div>}
                  </div>
                ))
              )}

              <h3>Mood notes (shared by choice)</h3>
              {report.moodNotes.length === 0 ? (
                <p>No notes in this period.</p>
              ) : (
                report.moodNotes.map((n, idx) => (
                  <div key={idx} style={{ marginBottom: 6 }}>
                    {new Date(n.created_at).toLocaleDateString()}: {n.score}/10,{" "}
                    {n.note}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}