import { useState } from "react";
import { Transaction, TransactionType, CATEGORIES, ACCOUNTS, CAT_COLOR, CAT_ICON } from "../data/mockData";

interface Props {
  transactions: Transaction[];
  onAdd: (t: Transaction) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  activeCat: string;
}

const fmt = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayStr = () => new Date().toISOString().split("T")[0];

type Filter = "all" | "Income" | "Expense";

export default function AllEntries({ transactions, onAdd, onDelete, showToast, activeCat }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [txType, setTxType] = useState<TransactionType>("Expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = transactions.filter((t) => filter === "all" || t.type === filter);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    onAdd({
      id: Date.now().toString(),
      name: name.trim(),
      amount: parseFloat(amount),
      type: txType,
      category: category || "Other",
      account: account || "Cash",
      date,
    });
    showToast(`${txType} recorded`);
    setName(""); setAmount(""); setDate(todayStr()); setCategory(""); setAccount(""); setFormOpen(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 className="page-title">All Entries</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {activeCat === "all" ? "Every transaction in your workspace." : `Showing: ${activeCat}`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setFormOpen((v) => !v)} style={{ marginTop: "0.35rem" }}>
          {formOpen ? "✕ Cancel" : "+ New Entry"}
        </button>
      </div>

      {formOpen && (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "1rem" }}>Record Transaction</div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {(["Expense", "Income"] as const).map((t) => (
              <button
                key={t} type="button" onClick={() => setTxType(t)} className="btn"
                style={{
                  flex: 1, fontSize: "0.83rem", padding: "0.5rem",
                  background: txType === t ? (t === "Expense" ? "#fef2f2" : "#f0fdf4") : "transparent",
                  border: txType === t ? `1px solid ${t === "Expense" ? "#fecaca" : "#bbf7d0"}` : "1px solid var(--border)",
                  color: txType === t ? (t === "Expense" ? "#dc2626" : "#16a34a") : "var(--text-2)",
                }}
              >
                {t === "Expense" ? "📤" : "📥"} {t}
              </button>
            ))}
          </div>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input className="input" placeholder={txType === "Income" ? "Income source…" : "What did you spend on?"} value={name} onChange={(e) => setName(e.target.value)} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              <input className="input" type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0" step="0.01" />
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
              </select>
              <select className="input" value={account} onChange={(e) => setAccount(e.target.value)}>
                <option value="">Account…</option>
                {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <button type="submit" className={`btn ${txType === "Income" ? "btn-success" : "btn-danger"}`} style={{ width: "100%", justifyContent: "center", marginTop: "0.1rem" }}>
              {txType === "Expense" ? "Record Expense" : "Record Income"} →
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
        <div className="chips">
          {(["all", "Income", "Expense"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? "active" : ""}`}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
        <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{filtered.length} entries</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-3)", fontSize: "0.875rem" }}>No transactions found.</div>
        ) : (
          <table className="entries-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const isIncome = t.type === "Income";
                const color = CAT_COLOR[t.category] || "#94a3b8";
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem" }}>
                          {CAT_ICON[t.category] || "◈"}
                        </span>
                        {t.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        {t.category}
                      </div>
                    </td>
                    <td>{t.account}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{t.date}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: isIncome ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                      {isIncome ? "+" : "−"}{fmt(t.amount)}
                    </td>
                    <td style={{ width: 40, textAlign: "center" }}>
                      <button
                        onClick={() => { onDelete(t.id); showToast("Removed", "error"); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: "0.75rem", padding: "2px 4px", borderRadius: 4, transition: "color 0.15s, background 0.15s" }}
                        onMouseOver={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fef2f2"; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-4)"; e.currentTarget.style.background = "none"; }}
                        title="Remove"
                      >✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
