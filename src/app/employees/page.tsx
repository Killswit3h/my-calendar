"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getEmployees,
  addEmployee,
  deleteEmployee,
  resetEmployees,
  type Employee,
  type Team,
} from "../../employees";

function EmployeesPageContent() {
  const params = useSearchParams();
  const back = params.get("from") || "/";

  const [employees, setEmployees] = useState<Employee[]>(getEmployees());
  const [name, setName] = useState("");
  const [team, setTeam] = useState<Team>("South");

  const refresh = () => setEmployees(getEmployees());

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return;
    const [first, ...rest] = parts;
    addEmployee({ firstName: first, lastName: rest.join(" "), team });
    setName("");
    setTeam("South");
    refresh();
  }

  function remove(id: string) {
    deleteEmployee(id);
    refresh();
  }

  function reset() {
    resetEmployees();
    refresh();
  }

  const initials = (e: Employee) =>
    `${e.firstName[0] ?? ""}${e.lastName[0] ?? ""}`.toUpperCase();

  return (
    <main className="p-4 space-y-6 max-w-lg mx-auto">
      <header className="flex items-center gap-2">
        <Link href={back} className="btn">
          Back
        </Link>
        <h1 className="flex-1 text-center text-xl font-medium">Employees</h1>
        <button className="btn ghost ml-auto" onClick={reset}>
          Reset
        </button>
      </header>

      <form
        onSubmit={handleAdd}
        className="surface p-4 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          placeholder="First Last"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={team}
          onChange={(e) => setTeam(e.target.value as Team)}
        >
          <option value="South">South</option>
          <option value="Central">Central</option>
        </select>
        <button type="submit" className="btn primary">
          Add
        </button>
      </form>

      <ul className="surface divide-y">
        {employees.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-4 p-4 hover:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {initials(e)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {e.firstName} {e.lastName}
              </p>
              <p className="text-sm text-gray-500">{e.team}</p>
            </div>
            <button
              className="btn danger"
              onClick={() => remove(e.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={null}>
      <EmployeesPageContent />
    </Suspense>
  );
}

