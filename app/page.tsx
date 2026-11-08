import TaskBoard from "./task-board";
import { listTasks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tasks = await listTasks();
  return <TaskBoard initialTasks={tasks} />;
}
