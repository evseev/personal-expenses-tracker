"use client";

import { useEffect, useRef, useState } from "react";
import { parseBackup, serializeBackup } from "../domain/backup";
import {
  CATEGORIES,
  currentLocalDate,
  expensesForMonth,
  formatUsd,
  monthSummary,
  parseCents,
  parseExpenseDate,
} from "../domain/expenses";
import type { Category, Expense } from "../domain/expenses";
import { IndexedDbExpenseRepository } from "../storage/indexeddb";
import styles from "./Dashboard.module.css";

const repository = new IndexedDbExpenseRepository();
const categoryColors: Record<Category, string> = {
  Food: "#b6db7e",
  Transport: "#82cbbb",
  Home: "#d9bb8b",
  Shopping: "#c5a9e2",
  Health: "#e4a6a9",
  Leisure: "#9ac1e9",
  Other: "#abb2c2",
};

function useOfflineReady(): { ready: boolean; connected: boolean } {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    queueMicrotask(() => setConnected(navigator.onLine));
    const online = () => setConnected(true);
    const offline = () => setConnected(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      const worker = navigator.serviceWorker;
      const updateReady = () => setReady(Boolean(worker.controller));
      worker.addEventListener("controllerchange", updateReady);
      void worker.register("/sw.js").then(updateReady).catch(() => setReady(false));
      updateReady();
      return () => {
        window.removeEventListener("online", online);
        window.removeEventListener("offline", offline);
        worker.removeEventListener("controllerchange", updateReady);
      };
    }
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return { ready, connected };
}

interface ExpenseFormProps {
  expense: Expense | null;
  busy: boolean;
  onCancel(): void;
  onSave(input: Pick<Expense, "cents" | "date" | "category" | "note">): Promise<void>;
}

function ExpenseForm({ expense, busy, onCancel, onSave }: ExpenseFormProps) {
  const [amount, setAmount] = useState(expense ? (expense.cents / 100).toFixed(2) : "");
  const [date, setDate] = useState(expense?.date ?? currentLocalDate());
  const [category, setCategory] = useState<Category>(expense?.category ?? "Food");
  const [note, setNote] = useState(expense?.note ?? "");
  const [formError, setFormError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => amountRef.current?.focus(), []);

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    ));
    if (focusable.length === 0) return;

    const eventTarget = event.target instanceof HTMLElement ? event.target : null;
    const currentIndex = focusable.indexOf(eventTarget ?? document.activeElement as HTMLElement);
    if (currentIndex === -1) return;
    event.preventDefault();
    const nextIndex = (currentIndex + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
    focusable[nextIndex].focus();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    try {
      const cents = parseCents(amount);
      const parsedDate = parseExpenseDate(date);
      if (note.trim().length > 280) throw new Error("Keep the note under 280 characters.");
      await onSave({ cents, date: parsedDate, category, note: note.trim() });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save this expense.");
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="form-title" onKeyDown={handleDialogKeyDown}>
        <div className={styles.dialogTop}>
          <div>
            <p className={styles.eyebrow}>EXPENSE DETAILS</p>
            <h2 id="form-title">{expense ? "Edit expense" : "Add an expense"}</h2>
          </div>
          <button className={styles.closeButton} type="button" onClick={onCancel} aria-label="Close form">×</button>
        </div>
        <form onSubmit={submit} className={styles.form}>
          <label>Amount in USD<input ref={amountRef} value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" required /></label>
          <div className={styles.formRow}>
            <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
            <label>Category<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <label>Note <span className={styles.optional}>optional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={280} rows={3} placeholder="What was it for?" /></label>
          {formError ? <p role="alert" className={styles.error}>{formError}</p> : null}
          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>Cancel</button>
            <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Saving…" : expense ? "Save changes" : "Save expense"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadSucceeded, setLoadSucceeded] = useState(false);
  const [month, setMonth] = useState("");
  const [filter, setFilter] = useState<Category | "All">("All");
  const [editing, setEditing] = useState<Expense | null | "new">(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const { ready, connected } = useOfflineReady();

  useEffect(() => {
    queueMicrotask(() => setMonth(currentLocalDate().slice(0, 7)));
    let active = true;
    void repository.list().then((items) => { if (active) { setExpenses(items); setLoadSucceeded(true); setLoaded(true); } }).catch(() => { if (active) { setError("Could not load expenses from this browser."); setLoaded(true); } });
    return () => { active = false; };
  }, []);

  const summary = monthSummary(expenses, month);
  const visibleExpenses = expensesForMonth(expenses, month, filter === "All" ? undefined : filter);
  const activeCategories = CATEGORIES.filter((category) => summary.byCategory[category] > 0).sort((a, b) => summary.byCategory[b] - summary.byCategory[a]);

  async function refresh() {
    setExpenses(await repository.list());
    setLoadSucceeded(true);
  }

  async function save(input: Pick<Expense, "cents" | "date" | "category" | "note">) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const existing = editing && editing !== "new" ? editing : null;
      await repository.put({
        ...input,
        id: existing?.id ?? crypto.randomUUID(),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
      await refresh();
      setMonth(input.date.slice(0, 7));
      closeForm();
      setMessage(existing ? "Expense updated." : "Expense saved.");
    } catch (cause) {
      setError("Could not save the expense. Your existing data is unchanged.");
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  function closeForm() {
    const opener = openerRef.current;
    setEditing(null);
    requestAnimationFrame(() => {
      (opener?.isConnected && !opener.disabled ? opener : addButtonRef.current)?.focus();
      openerRef.current = null;
    });
  }

  function openForm(value: Expense | "new", opener: HTMLButtonElement) {
    openerRef.current = opener;
    setError("");
    setMessage("");
    setEditing(value);
  }

  async function remove(expense: Expense) {
    if (!window.confirm(`Delete ${expense.note || expense.category} for ${formatUsd(expense.cents)}?`)) return;
    setError("");
    setMessage("");
    try {
      await repository.remove(expense.id);
      await refresh();
      setMessage("Expense deleted.");
    } catch {
      setError("Could not delete the expense. Try again.");
    }
  }

  async function loadDemo() {
    if (!loadSucceeded || expenses.length > 0) return;
    setError("");
    setMessage("");
    const sampleMonth = currentLocalDate().slice(0, 7);
    const now = new Date().toISOString();
    const samples: Expense[] = [
      { id: "demo-food", cents: 1840, date: `${sampleMonth}-01`, category: "Food", note: "Groceries", createdAt: now },
      { id: "demo-home", cents: 4999, date: `${sampleMonth}-02`, category: "Home", note: "Home supplies", createdAt: now },
      { id: "demo-transport", cents: 725, date: `${sampleMonth}-03`, category: "Transport", note: "Bus tickets", createdAt: now },
    ];
    try {
      if (!await repository.insertIfEmpty(samples)) {
        await refresh();
        setError("Sample expenses require an empty browser store.");
        return;
      }
      await refresh();
      setMonth(sampleMonth);
      setMessage("Sample expenses added.");
    } catch {
      setError("Could not add sample expenses.");
    }
  }

  async function exportData() {
    setError("");
    setMessage("");
    try {
      const items = await repository.list();
      const url = URL.createObjectURL(new Blob([serializeBackup(items)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `current-expenses-${currentLocalDate()}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Backup downloaded.");
    } catch {
      setError("Could not export the backup.");
    }
  }

  async function importData(file: File | undefined) {
    if (!file) return;
    setError("");
    setMessage("");
    try {
      if (file.size > 5_000_000) throw new Error("Backup file is too large.");
      const incoming = parseBackup(await file.text());
      if (!window.confirm(`Replace all current expenses with ${incoming.length} records from this backup?`)) return;
      await repository.replaceAll(incoming);
      await refresh();
      setMessage(`Restored ${incoming.length} expenses.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not import the backup.");
    }
  }

  return (
    <div className={styles.site}>
      <header className={styles.header}>
        <div className={styles.brand}><span className={styles.brandMark} aria-hidden="true">↗</span><span>current<span className={styles.brandDot}>.</span></span></div>
        <div className={styles.headerRight}><span className={styles.privatePill}>PRIVATE BY DEFAULT</span><span className={styles.status}><span className={`${styles.statusDot} ${ready ? styles.ready : ""}`} />{ready ? "Ready offline" : "Offline setup pending"}</span><span className={styles.status} aria-live="polite"><span className={`${styles.statusDot} ${connected ? styles.ready : styles.disconnected}`} />{connected ? "Online" : "Offline now"}</span></div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <div><p className={styles.eyebrow}>PERSONAL EXPENSES / USD</p><h1>Your money, <span>clearly.</span></h1><p className={styles.subtitle}>A quiet place to see where it goes. Just your spending, all in one view.</p></div>
          <button ref={addButtonRef} className={styles.primaryButton} onClick={(event) => openForm("new", event.currentTarget)}>＋ <span>Add expense</span></button>
        </section>

        {error ? <p role="alert" className={styles.errorBanner}>{error}</p> : null}
        {message ? <p role="status" className={styles.srOnly}>{message}</p> : null}

        <section className={styles.overview} aria-label="Monthly overview">
          <div className={styles.totalCard}>
            <div className={styles.cardHeader}><span>SPENT THIS MONTH</span><label className={styles.monthLabel}>Month<input aria-label="Month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label></div>
            <div data-testid="monthly-total" className={styles.total}>{formatUsd(summary.totalCents)}</div>
            <p className={styles.cardFoot}>{summary.count} {summary.count === 1 ? "expense" : "expenses"} recorded <span aria-hidden="true">·</span> {month ? new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "This month"}</p>
            <div className={styles.totalDecoration} aria-hidden="true" />
          </div>
          <div className={styles.breakdownCard}>
            <div className={styles.cardHeader}><span>BY CATEGORY</span><span className={styles.smallMuted}>MONTHLY VIEW</span></div>
            {activeCategories.length ? <div className={styles.bars}>{activeCategories.map((category) => <div className={styles.barRow} key={category}><div className={styles.barLabels}><span>{category}</span><strong>{formatUsd(summary.byCategory[category])}</strong></div><div className={styles.barTrack}><span style={{ width: `${Math.max(3, summary.byCategory[category] / summary.totalCents * 100)}%`, backgroundColor: categoryColors[category] }} /></div></div>)}</div> : <div className={styles.chartEmpty}><span className={styles.emptyCircle}>◌</span><p>Your category breakdown<br />will appear here.</p></div>}
          </div>
        </section>

        <section className={styles.history} aria-label="Expense history">
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>THE DETAILS</p><h2>Activity</h2></div><label className={styles.filterLabel}>Filter category<select aria-label="Filter category" value={filter} onChange={(event) => setFilter(event.target.value as Category | "All")}><option>All</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label></div>
          {!loaded ? <div className={styles.listEmpty}>Loading expenses…</div> : visibleExpenses.length ? <ul className={styles.expenseList}>{visibleExpenses.map((expense) => <li className={styles.expenseRow} key={expense.id}><div className={styles.expenseIcon} style={{ color: categoryColors[expense.category] }} aria-hidden="true">{expense.category[0]}</div><div className={styles.expenseText}><strong>{expense.note || expense.category}</strong><span>{expense.category} <span aria-hidden="true">·</span> {new Date(`${expense.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div><strong className={styles.expenseAmount}>−{formatUsd(expense.cents)}</strong><div className={styles.rowActions}><button aria-label={`Edit ${expense.note || expense.category}`} title="Edit" onClick={(event) => openForm(expense, event.currentTarget)}>Edit</button><button aria-label={`Delete ${expense.note || expense.category}`} title="Delete" onClick={() => void remove(expense)}>Delete</button></div></li>)}</ul> : <div className={styles.listEmpty}><div className={styles.emptyGlyph} aria-hidden="true">＋</div><h3>Nothing here yet</h3><p>Add your first expense to start seeing the full picture.</p>{loadSucceeded && expenses.length === 0 ? <button className={styles.textButton} onClick={() => void loadDemo()}>Or explore with sample expenses →</button> : null}</div>}
        </section>

        <section className={styles.dataSection} aria-label="Data and backup"><div><p className={styles.eyebrow}>YOUR DATA</p><h2>Data &amp; backup</h2><p>Your expenses stay in this browser. Clearing browser data deletes them. Download a backup to keep a copy.</p></div><div className={styles.dataActions}><button className={styles.secondaryButton} onClick={() => void exportData()}>Download JSON</button><label className={styles.uploadButton}>Import JSON backup<input aria-label="Import JSON backup" type="file" accept=".json,application/json" onChange={(event) => { void importData(event.target.files?.[0]); event.target.value = ""; }} /></label></div></section>
      </main>
      <footer className={styles.footer}><span>current. © 2026</span><span>Made for the everyday.</span></footer>
      {editing ? <ExpenseForm key={editing === "new" ? "new" : editing.id} expense={editing === "new" ? null : editing} busy={busy} onCancel={closeForm} onSave={save} /> : null}
    </div>
  );
}
