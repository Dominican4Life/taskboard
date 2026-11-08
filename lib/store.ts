import { promises as fs } from "fs";
import path from "path";

export type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "tasks.json");

// Serialize all read/write operations so concurrent requests can't clobber
// each other or read a half-written file.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

async function readAll(): Promise<Task[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is Task =>
        !!t &&
        typeof t.id === "string" &&
        typeof t.title === "string" &&
        typeof t.done === "boolean" &&
        typeof t.createdAt === "string",
    );
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    // Corrupt file: keep a copy for debugging instead of silently dropping it.
    try {
      await fs.rename(DATA_FILE, `${DATA_FILE}.corrupt-${Date.now()}`);
    } catch {
      /* best effort */
    }
    return [];
  }
}

async function writeAll(tasks: Task[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(tasks, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE); // atomic-ish replace
}

export function listTasks(): Promise<Task[]> {
  return enqueue(readAll);
}

export function addTask(title: string): Promise<Task> {
  return enqueue(async () => {
    const tasks = await readAll();
    const task: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(task);
    await writeAll(tasks);
    return task;
  });
}

export function toggleTask(id: string, done: boolean): Promise<Task | null> {
  return enqueue(async () => {
    const tasks = await readAll();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    task.done = done;
    await writeAll(tasks);
    return task;
  });
}

export function deleteTask(id: string): Promise<boolean> {
  return enqueue(async () => {
    const tasks = await readAll();
    const next = tasks.filter((t) => t.id !== id);
    if (next.length === tasks.length) return false;
    await writeAll(next);
    return true;
  });
}
