import { useState, useCallback } from "react";
import { initialTransactions, initialHabits, Transaction, Habit } from "./data/mockData";
import ExpensesPage from "./pages/ExpensesPage";
import HabitsPage from "./pages/HabitsPage";
import Toast, { ToastMessage } from "./components/Toast";

type Page = "expenses" | "habits";

const todayStr = () => new Date().toISOString().split("T")[0];
const dateStr = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().split("T")[0];
};

export default function App() {
  const [page, setPage] = useState<Page>("expenses");
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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
        return { ...h, history: { ...h.history, [today]: !wasDone }, streak: !wasDone ? h.streak + 1 : Math.max(0, h.streak - 1) };
      })
    );
  };

  const addHabit = (name: string) => {
    const history: Record<string, boolean> = {};
    for (let i = 0; i < 14; i++) history[dateStr(i)] = false;
    setHabits((p) => [...p, { id: Date.now().toString(), name, streak: 0, history }]);
  };

  const today = new Date();
  const todayHabits = habits.filter((h) => h.history[todayStr()]).length;
  const habitRate = habits.length ? Math.round((todayHabits / habits.length) * 100) : 0;

  const now = today;
  const ms = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const me = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const mtxns = transactions.filter((t) => t.date >= ms && t.date <= me);
  const mIncome = mtxns.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
  const mExpense = mtxns.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
  const mNet = mIncome - mExpense;

  const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const dateLabel = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="orb orb-gold" />
      <div className="orb orb-blue" />

      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(5,5,7,0.82)",
          backdropFilter: "blur(28px)",
          borderBottom: "0.5px solid var(--border-2)",
        }}
      >
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="display font-semibold gold-text" style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}>
                Moksha
              </div>
              <div className="label" style={{ fontSize: "0.58rem", marginTop: 1 }}>
                {dateLabel}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-5">
              {[
                { label: "Net", value: fmt(mNet), color: mNet >= 0 ? "var(--green)" : "var(--red)" },
                { label: "Habits", value: `${habitRate}%`, color: "var(--gold)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-right">
                  <div className="label" style={{ fontSize: "0.55rem" }}>{label}</div>
                  <div className="mono font-medium" style={{ fontSize: "0.9rem", color, letterSpacing: "-0.03em" }}>{value}</div>
                </div>
              ))}
            </div>

            <nav className="flex items-center gap-0.5 p-1 rounded-lg" style={{ background: "var(--surface)", border: "0.5px solid var(--border-2)" }}>
              {([
                { id: "expenses", icon: "₹", label: "Expenses" },
                { id: "habits",   icon: "◎", label: "Habits"   },
              ] as const).map(({ id, icon, label }) => (
                <button
                  key={id}
                  onClick={() => setPage(id)}
                  className="btn"
                  style={{
                    padding: "0.35rem 0.9rem",
                    fontSize: "0.8rem",
                    borderRadius: "var(--r-xs)",
                    gap: "0.35rem",
                    background: page === id ? "var(--gold-dim)" : "transparent",
                    color: page === id ? "var(--gold-light)" : "var(--text-3)",
                    border: page === id ? "0.5px solid var(--border)" : "0.5px solid transparent",
                  }}
                >
                  <span style={{ fontFamily: "var(--ff-mono)", fontSize: "0.85rem" }}>{icon}</span>
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-8 pb-24">
        {page === "expenses" ? (
          <ExpensesPage
            transactions={transactions}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
            showToast={showToast}
          />
        ) : (
          <HabitsPage
            habits={habits}
            onToggle={toggleHabit}
            onAdd={addHabit}
            showToast={showToast}
          />
        )}
      </main>

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  );
}
