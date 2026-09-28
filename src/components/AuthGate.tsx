import { useState, useEffect, useRef } from "react";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("moksha_auth");
    if (token === "authenticated") {
      setAuthenticated(true);
    }
    setChecking(false);
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      if (res.ok) {
        sessionStorage.setItem("moksha_auth", "authenticated");
        setAuthenticated(true);
      } else {
        setError("Wrong password. Try again.");
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setPassword("");
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
      </div>
    );
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="auth-backdrop">
      <div className="auth-ambient auth-ambient-1" />
      <div className="auth-ambient auth-ambient-2" />
      <div className="auth-ambient auth-ambient-3" />

      <form className={`auth-card ${shake ? "auth-shake" : ""}`} onSubmit={handleSubmit}>
        <div className="auth-lock-wrap">
          <div className="auth-lock-ring">
            <div className="auth-lock-icon">🔒</div>
          </div>
        </div>

        <h1 className="auth-title">Moksha Tracker</h1>
        <p className="auth-subtitle">Enter your password to continue</p>

        <div className="auth-input-wrap">
          <input
            ref={inputRef}
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            id="auth-password-input"
          />
          <div className="auth-input-glow" />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="auth-btn" disabled={loading} id="auth-submit-btn">
          {loading ? (
            <span className="auth-btn-loading">
              <span className="auth-btn-dot" />
              <span className="auth-btn-dot" />
              <span className="auth-btn-dot" />
            </span>
          ) : (
            "Unlock"
          )}
        </button>

        <p className="auth-footer">Personal workspace · Protected access</p>
      </form>
    </div>
  );
}
