import { useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  text: string;
  type?: "success" | "error";
}

function ToastItem({ msg, onRemove }: { msg: ToastMessage; onRemove: () => void }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onRemove, 300); }, 2600);
    return () => clearTimeout(t);
  }, [onRemove]);
  const isError = msg.type === "error";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.1rem", borderRadius: "var(--r-sm)", border: `0.5px solid ${isError ? "rgba(248,113,113,0.3)" : "var(--border)"}`, background: isError ? "rgba(248,113,113,0.1)" : "rgba(14,14,22,0.96)", backdropFilter: "blur(24px)", color: isError ? "var(--red)" : "var(--text)", fontSize: "0.82rem", fontFamily: "var(--ff-body)", fontWeight: 500, whiteSpace: "nowrap", boxShadow: "0 4px 24px rgba(0,0,0,0.5)", opacity: visible ? 1 : 0, transition: "opacity 0.3s", letterSpacing: "0.01em" }}>
      <span style={{ fontSize: "0.75rem", fontFamily: "var(--ff-mono)", color: isError ? "var(--red)" : "var(--gold)" }}>{isError ? "✕" : "✓"}</span>
      {msg.text}
    </div>
  );
}

export default function Toast({ messages, onRemove }: { messages: ToastMessage[]; onRemove: (id: string) => void }) {
  return (
    <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: "0.4rem", zIndex: 9999 }}>
      {messages.map((m) => <ToastItem key={m.id} msg={m} onRemove={() => onRemove(m.id)} />)}
    </div>
  );
}
