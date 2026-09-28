import { useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  text: string;
  type?: "success" | "error";
}

function ToastItem({ msg, onRemove }: { msg: ToastMessage; onRemove: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setFading(true);
      setTimeout(onRemove, 300);
    }, 2500);
    return () => clearTimeout(t);
  }, [onRemove]);

  return (
    <div className={`toast${msg.type === "error" ? " error" : ""}${fading ? " fade" : ""}`}>
      <span style={{ fontSize: "0.8rem" }}>{msg.type === "error" ? "✕" : "✓"}</span>
      {msg.text}
    </div>
  );
}

export default function ToastContainer({
  messages,
  onRemove,
}: {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="toast-wrap">
      {messages.map((m) => (
        <ToastItem key={m.id} msg={m} onRemove={() => onRemove(m.id)} />
      ))}
    </div>
  );
}
