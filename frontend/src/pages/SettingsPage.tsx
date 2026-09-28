import { useState } from "react";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState({ message: "", tone: "" });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setStatus({ message: "New password must be at least 6 characters.", tone: "bad" });
      return;
    }
    setLoading(true);
    setStatus({ message: "", tone: "" });

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change",
          password: currentPassword,
          newPassword: newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ message: "Password updated successfully!", tone: "ok" });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setStatus({ message: data.error || "Failed to change password.", tone: "bad" });
      }
    } catch (err) {
      setStatus({ message: "Connection error. Please try again.", tone: "bad" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("moksha_token");
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "2rem", color: "var(--text)" }}>
        Settings & Security
      </h2>

      <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text)" }}>Change Password</h3>
        
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-2)", marginBottom: "0.5rem" }}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)" }}
              required
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-2)", marginBottom: "0.5rem" }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)" }}
              required
              minLength={6}
            />
          </div>

          {status.message && (
            <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: status.tone === "bad" ? "#dc2626" : "#16a34a" }}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      <div style={{ background: "var(--card)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text)" }}>Session Management</h3>
        <p style={{ fontSize: "0.9rem", color: "var(--text-2)", marginBottom: "1rem" }}>
          Log out of the application. You will need your password to access the app again.
        </p>
        <button
          onClick={handleLogout}
          style={{
            padding: "0.75rem 1.5rem",
            background: "var(--bg)",
            color: "#dc2626",
            border: "1px solid #dc2626",
            borderRadius: "10px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
