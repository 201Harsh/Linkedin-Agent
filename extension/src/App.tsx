import React, { useState, useEffect } from "react";

export default function App() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: "320px",
        padding: "24px",
        backgroundColor: "#050505",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #ea580c, #c2410c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "18px",
            boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
          }}
        >
          X
        </div>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            AgentX
          </h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
            Autonomous Networking
          </p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#111",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              backgroundColor: "#10b981",
              borderRadius: "50%",
              boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
            }}
          ></div>
          <span
            style={{ fontSize: "13px", fontWeight: "500", color: "#10b981" }}
          >
            System Active
          </span>
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "#aaa",
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          AgentX is silently monitoring your command center. Send targets from
          your dashboard and they will be executed here.
        </p>
      </div>

      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <p style={{ fontSize: "11px", color: "#666", fontStyle: "italic" }}>
          Monitoring Queue{dots}
        </p>
      </div>
    </div>
  );
}
