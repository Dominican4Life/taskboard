"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/store";

async function callApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export default function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { task } = await callApi<{ task: Task }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: value }),
      });
      setTasks((prev) => [task, ...prev]);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add task.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, done: boolean) {
    setError(null);
    // Optimistic flip; roll back if the server rejects it.
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    try {
      await callApi(`/api/tasks`, {
        method: "PATCH",
        body: JSON.stringify({ id, done }),
      });
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !done } : t)));
      setError(err instanceof Error ? err.message : "Could not update task.");
    }
  }

  async function remove(id: string) {
    setError(null);
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await callApi(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      setTasks(snapshot);
      setError(err instanceof Error ? err.message : "Could not delete task.");
    }
  }

  return (
    <main>
      <h1>Taskboard</h1>
      <p className="subtitle">
        Next.js + TypeScript starter · data persists to <code>.data/tasks.json</code>
      </p>

      <form className="add" onSubmit={addTask}>
        <input
          type="text"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          aria-label="New task title"
        />
        <button className="primary" type="submit" disabled={busy || !title.trim()}>
          {busy ? "Adding…" : "Add task"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {tasks.length === 0 ? (
        <p className="empty">No tasks yet — add one above to get started.</p>
      ) : (
        <>
          <ul className="tasks">
            {tasks.map((task) => (
              <li key={task.id} className={task.done ? "task done" : "task"}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={(e) => toggle(task.id, e.target.checked)}
                  aria-label={`Mark "${task.title}" as ${task.done ? "not done" : "done"}`}
                />
                <span className="title">{task.title}</span>
                <button
                  className="icon"
                  type="button"
                  onClick={() => remove(task.id)}
                  aria-label={`Delete "${task.title}"`}
                  title="Delete"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="stats">
            <span>
              {remaining} open · {tasks.length - remaining} done
            </span>
            <span>{tasks.length} total</span>
          </div>
        </>
      )}
    </main>
  );
}
