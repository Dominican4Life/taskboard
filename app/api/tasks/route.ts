import type { Task } from "@/lib/store";
import { addTask, listTasks, toggleTask, deleteTask } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_TITLE = 200;

export async function GET() {
  const tasks = await listTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title =
    typeof body === "object" && body !== null && "title" in body
      ? (body as { title?: unknown }).title
      : undefined;

  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "A non-empty title is required." }, { status: 400 });
  }
  if (title.trim().length > MAX_TITLE) {
    return NextResponse.json(
      { error: `Title must be ${MAX_TITLE} characters or fewer.` },
      { status: 400 },
    );
  }

  const task = await addTask(title);
  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { id, done } = body as { id?: unknown; done?: unknown };
  if (typeof id !== "string" || typeof done !== "boolean") {
    return NextResponse.json(
      { error: "Expected { id: string, done: boolean }." },
      { status: 400 },
    );
  }

  const task = await toggleTask(id, done);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return NextResponse.json({ task });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing ?id=." }, { status: 400 });
  }
  const removed = await deleteTask(id);
  if (!removed) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export type { Task };
