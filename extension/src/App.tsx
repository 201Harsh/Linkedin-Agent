import React, { useState } from "react";

export default function App() {
  const [status, setStatus] = useState("Idle");

  const checkProfile = async () => {
    setStatus("Scanning...");
    setTimeout(() => setStatus("Ready to Connect"), 1000);
  };

  return (
    <div
      style={{
        width: "300px",
        padding: "16px",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ color: "#ea580c", margin: "0 0 16px 0" }}>AgentX</h2>
      <button
        onClick={checkProfile}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#ea580c",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Identify Target
      </button>
      <p style={{ fontSize: "12px", color: "#888", marginTop: "12px" }}>
        Status: {status}
      </p>
    </div>
  );
}
