import { useState, useCallback, useEffect } from "react";
import { Transaction, Habit } from "./data/mockData";
import ExpensesPage from "./pages/ExpensesPage";
import HabitsPage from "./pages/HabitsPage";
import Toast, { ToastMessage } from "./components/Toast";

type Page = "expenses" | "habits";

const todayStr = () => new Date().toISOString().split("T")[0];

export default function App() {
  const [page, setPage] = useState<Page>("expenses");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [metadata, setMetadata] = useState<{ categories: {id: string, name: string}[], accounts: {id: string, name: string}[] }>({ categories: [], accounts: [] });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const showToast = useCallback((text: string, type?: "success" | "error") => {
    setToasts((t) => [...t, { id: Date.now().toString(), text, type }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((m) => m.id !== id));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [txnRes, habRes, metaRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/habits'),
        fetch('/api/metadata')
      ]);

      if (!txnRes.ok || !habRes.ok || !metaRes.ok) {
        throw new Error('One or more APIs failed');
      }

      const [txns, habs, meta] = await Promise.all([
        txnRes.json(),
        habRes.json(),
        metaRes.json()
      ]);
      
      const adaptedTxns = Array.isArray(txns) ? txns.map((t: any) => ({
        ...t,
        category: meta.categories.find((c: any) => c.id === t.categoryId)?.name || "Other",
        account: meta.accounts.find((a: any) => a.id === t.accountId)?.name || "Cash",
      })) : [];
      
      setTransactions(adaptedTxns);
      
      // Adapt habits history array to Record<string, boolean>
      const adaptedHabs = habs.map((h: any) => {
        const historyObj: Record<string, boolean> = {};
        if (h.history) {
          h.history.forEach((hi: any) => {
            historyObj[hi.date] = hi.done;
          });
        }
        return { ...h, history: historyObj };
      });
      setHabits(adaptedHabs);
      setMetadata(meta);
    } catch (e) {
      showToast('Failed to load data from Notion', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTransaction = async (t: Transaction) => {
    // Find IDs from metadata
    const catId = metadata.categories.find(c => c.name === t.category)?.id;
    const accId = metadata.accounts.find(a => a.name === t.account)?.id;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...t, categoryId: catId, accountId: accId })
      });
      if (res.ok) {
        const newTxn = await res.json();
        const adaptedNewTxn = {
          ...newTxn,
          category: metadata.categories.find((c: any) => c.id === newTxn.categoryId)?.name || t.category || "Other",
          account: metadata.accounts.find((a: any) => a.id === newTxn.accountId)?.name || t.account || "Cash",
        };
        setTransactions(prev => [adaptedNewTxn, ...prev]);
        showToast('Expense recorded', 'success');
      } else {
        throw new Error();
      }
    } catch (e) {
      showToast('Failed to record expense', 'error');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTransactions((p) => p.filter((t) => t.id !== id));
        showToast('Expense removed', 'success');
      } else {
        throw new Error();
      }
    } catch (e) {
      showToast('Failed to remove expense', 'error');
    }
  };

  const toggleHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit || !habit.pageId) {
      showToast('Cannot update habit (no pageId)', 'error');
      return;
    }

    const today = todayStr();
    const wasDone = !!habit.history[today];
    const newDone = !wasDone;

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        return { ...h, history: { ...h.history, [today]: newDone }, streak: newDone ? h.streak + 1 : Math.max(0, h.streak - 1) };
      })
    );

    try {
      const res = await fetch(`/api/habits/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: newDone, pageId: habit.pageId })
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      showToast('Failed to update habit', 'error');
      // Revert optimistic update
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== id) return h;
          return { ...h, history: { ...h.history, [today]: wasDone }, streak: wasDone ? h.streak + 1 : Math.max(0, h.streak - 1) };
        })
      );
    }
  };

  const addHabit = async (name: string) => {
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        showToast('Habit added', 'success');
        fetchData(); // Reload to get the new schema
      } else {
        throw new Error();
      }
    } catch (e) {
      showToast('Failed to add habit', 'error');
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      const res = await fetch(`/api/habits/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Habit deleted', 'success');
        fetchData(); // Reload to get the new schema
      } else {
        throw new Error();
      }
    } catch (e) {
      showToast('Failed to delete habit', 'error');
    }
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

  if (loading && transactions.length === 0) {
    return (
      <div className="relative min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-3)" }}>
        <div className="label">Loading Moksha...</div>
      </div>
    );
  }

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
              <button
                onClick={fetchData}
                style={{
                  background: "var(--surface)",
                  border: "0.5px solid var(--border)",
                  borderRadius: "var(--r-xs)",
                  padding: "0.35rem 0.6rem",
                  fontSize: "0.75rem",
                  color: "var(--text-2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                ⟳ Sync
              </button>
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
            categories={metadata.categories.map(c => c.name)}
            accounts={metadata.accounts.map(a => a.name)}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
            showToast={showToast}
          />
        ) : (
          <HabitsPage
            habits={habits}
            onToggle={toggleHabit}
            onAdd={addHabit}
            onDelete={deleteHabit}
            showToast={showToast}
          />
        )}
      </main>

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  );
}
