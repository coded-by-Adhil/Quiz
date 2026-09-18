import { useEffect, useState } from "react";
import "./App.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [status, setStatus] = useState("Checking API connection...");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkApi() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/ping`);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        setStatus(`Laravel API status: ${data.status}`);
      } catch (err) {
        setError(err.message);
      }
    }

    checkApi();
  }, []);

  return (
    <main>
      <h1>Quiz Platform</h1>
      <p>Phase 0 API check</p>
      {error ? (
        <p role="alert">API connection failed: {error}</p>
      ) : (
        <p>{status}</p>
      )}
    </main>
  );
}

export default App;
