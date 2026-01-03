// Removed module; redirect to 404
import { notFound } from "next/navigation";
export default function Page() {
  notFound();
}
"use client";

import TodosApp from "@/components/todos/TodosApp";

export default function PlannerTodosPage() {
  return <TodosApp />;
}
