import { useState, useCallback } from "react";
import { initialTransactions, initialHabits, Transaction, Habit, CATEGORIES, CAT_DOT } from "./data/mockData";
import Dashboard from "./pages/Dashboard";
import AllEntries from "./pages/AllEntries";
import ToastContainer, { ToastMessage } from "./components/Toast";

type Page = "dashboard" | "entries";

const fmt = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const todayStr = () => new Date().toISOString().split("T")[0];
const dateStr = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().split("T")[0];
};

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");

  const showToast = useCallback((text: string, type?: "success" | "error") => {
    setToasts((t) => [...t, { id: Date.now().toString(), text, type }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((m) => m.id !== id));
  }, []);

  const addTransaction = (t: Transaction) => setTransactions((p) => [t, ...p]);
  const deleteTransaction = (id: string) =>
    setTransactions((p) => p.filter((t) => t.id !== id));

  const toggleHabit = (id: string) => {
    const today = todayStr();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const wasDone = !!h.history[today];
        return {
          ...h,
          history: { ...h.history, [today]: !wasDone },
          streak: !wasDone ? h.streak + 1 : Math.max(0, h.streak - 1),
        };
      })
    );
  };

  const addHabit = (name: string) => {
    const history: Record<string, boolean> = {};
    for (let i = 0; i < 14; i++) history[dateStr(i)] = false;
    setHabits((p) => [...p, { id: Date.now().toString(), name, streak: 0, history }]);
  };

  void toggleHabit;
  void addHabit;

  const expenses = transactions.filter((t) => t.type === "Expense");
  const catCounts: Record<string, number> = {};
  const catTotals: Record<string, number> = {};
  expenses.forEach((t) => {
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const totalTracked = expenses.reduce((s, t) => s + t.amount, 0);

  const filteredTransactions =
    activeCat === "all"
      ? transactions
      : transactions.filter((t) => t.category === activeCat);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">💳</div>
          <div>
            <div className="brand-name">Expense Tracker</div>
            <div className="brand-sub">Personal workspace</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${page === "dashboard" ? "active" : ""}`}
            onClick={() => setPage("dashboard")}
          >
            <span style={{ fontSize: "0.8rem" }}>▦</span> Dashboard
          </button>
          <button
            className={`nav-item ${page === "entries" ? "active" : ""}`}
            onClick={() => setPage("entries")}
          >
            <span style={{ fontSize: "0.8rem" }}>☰</span> All Entries
          </button>
        </nav>

        <div className="sidebar-section-label">
          <span>Categories</span>
          <button onClick={() => setPage("entries")}>+</button>
        </div>

        <div className="cat-list">
          <div
            className={`cat-item ${activeCat === "all" ? "active" : ""}`}
            onClick={() => setActiveCat("all")}
          >
            <span className="cat-name" style={{ fontWeight: activeCat === "all" ? 600 : 400 }}>
              All categories
            </span>
          </div>
          {CATEGORIES.filter((c) => catCounts[c]).map((cat) => (
            <div
              key={cat}
              className={`cat-item ${activeCat === cat ? "active" : ""}`}
              onClick={() => setActiveCat(cat)}
            >
              <span className="cat-dot" style={{ background: CAT_DOT[cat] }} />
              <span className="cat-name">{cat}</span>
              <span className="cat-count">{catCounts[cat]}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="lbl">Total tracked</div>
          <div className="total">{fmt(totalTracked)}</div>
        </div>
      </aside>

      <main className="main-area">
        {page === "dashboard" ? (
          <Dashboard
            transactions={filteredTransactions}
            catTotals={catTotals}
            catCounts={catCounts}
          />
        ) : (
          <AllEntries
            transactions={filteredTransactions}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
            showToast={showToast}
            activeCat={activeCat}
          />
        )}
      </main>

      <ToastContainer messages={toasts} onRemove={removeToast} />
    </div>
  );
}
