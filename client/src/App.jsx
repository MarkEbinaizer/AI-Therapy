import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((r) => r.json())
      .then((d) => setStatus(d.db))
      .catch(() => setStatus("server not reachable"));
  }, []);

  return (
    <div>
      <h1>AI Therapy</h1>
      <p>Database: {status}</p>
    </div>
  );
}