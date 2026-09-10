import { useState, useCallback } from "react";
import { initialTransactions, initialHabits, Transaction, Habit, CATEGORIES, CAT_DOT, dateStr } from "./data/mockData";
import Dashboard from "./pages/Dashboard";
import AllEntries from "./pages/AllEntries";
import HabitsPage from "./pages/HabitsPage";
import ToastContainer, { ToastMessage } from "./components/Toast";

type Page = "dashboard" | "entries" | "habits";

const fmt = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const todayStr = () => new Date().toISOString().split("T")[0];

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
  const deleteTransaction = (id: string) => setTransactions((p) => p.filter((t) => t.id !== id));

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

  const addHabit = (partial: Omit<Habit, "id" | "streak" | "history">) => {
    const history: Record<string, boolean> = {};
    for (let i = 0; i < 30; i++) history[dateStr(i)] = false;
    setHabits((p) => [
      ...p,
      { id: Date.now().toString(), streak: 0, history, ...partial },
    ]);
  };

  const deleteHabit = (id: string) => setHabits((p) => p.filter((h) => h.id !== id));

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

  const doneHabits = habits.filter((h) => h.history[todayStr()]).length;
  const habitRate = habits.length > 0 ? Math.round((doneHabits / habits.length) * 100) : 0;

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "entries", label: "All Entries", icon: "☰" },
    { id: "habits", label: "Habits", icon: "◉" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">💳</div>
          <div>
            <div className="brand-name">Tracker</div>
            <div className="brand-sub">Personal workspace</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ id, label, icon }) => (
            <button key={id} className={`nav-item${page === id ? " active" : ""}`} onClick={() => setPage(id)}>
              <span style={{ fontSize: "0.8rem" }}>{icon}</span> {label}
            </button>
          ))}
        </nav>

        {page !== "habits" && (
          <>
            <div className="sidebar-section-label">
              <span>Categories</span>
              <button onClick={() => setPage("entries")}>+</button>
            </div>
            <div className="cat-list">
              <div
                className={`cat-item${activeCat === "all" ? " active" : ""}`}
                onClick={() => setActiveCat("all")}
              >
                <span className="cat-name" style={{ fontWeight: activeCat === "all" ? 600 : 400 }}>
                  All categories
                </span>
              </div>
              {CATEGORIES.filter((c) => catCounts[c]).map((cat) => (
                <div
                  key={cat}
                  className={`cat-item${activeCat === cat ? " active" : ""}`}
                  onClick={() => setActiveCat(cat)}
                >
                  <span className="cat-dot" style={{ background: CAT_DOT[cat] }} />
                  <span className="cat-name">{cat}</span>
                  <span className="cat-count">{catCounts[cat]}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {page === "habits" && (
          <>
            <div className="sidebar-section-label">
              <span>Today</span>
            </div>
            <div style={{ padding: "0 1.25rem 0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>Completion</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#111" }}>{habitRate}%</span>
              </div>
              <div className="pbar-track">
                <div className="pbar-fill" style={{
                  width: `${habitRate}%`,
                  background: habitRate >= 80 ? "#059669" : habitRate >= 50 ? "#2563eb" : "#7c3aed",
                }} />
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#9ca3af" }}>
                {doneHabits} of {habits.length} habits done
              </div>
            </div>
          </>
        )}

        <div className="sidebar-footer">
          {page === "habits" ? (
            <>
              <div className="lbl">Best streak</div>
              <div className="total">{Math.max(0, ...habits.map((h) => h.streak))}d</div>
            </>
          ) : (
            <>
              <div className="lbl">Total tracked</div>
              <div className="total">{fmt(totalTracked)}</div>
            </>
          )}
        </div>
      </aside>

      <main className="main-area">
        {page === "dashboard" && (
          <Dashboard transactions={filteredTransactions} catTotals={catTotals} catCounts={catCounts} />
        )}
        {page === "entries" && (
          <AllEntries
            transactions={filteredTransactions}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
            showToast={showToast}
            activeCat={activeCat}
          />
        )}
        {page === "habits" && (
          <HabitsPage
            habits={habits}
            onToggle={toggleHabit}
            onAdd={addHabit}
            onDelete={deleteHabit}
            showToast={showToast}
          />
        )}
      </main>

      <ToastContainer messages={toasts} onRemove={removeToast} />
    </div>
  );
}
