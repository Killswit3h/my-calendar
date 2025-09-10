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

  return (
    <main className="p-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Link href={back} className="btn">
          Back
        </Link>
        <button className="btn ghost ml-auto" onClick={reset}>
          Reset
        </button>
      </div>
      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          type="text"
          placeholder="First Last"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-input flex-1"
        />
        <select
          className="select-input"
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
      <ul className="employee-list">
        {employees.map((e) => (
          <li key={e.id} className="employee-list-item">
            <span className="flex-1">
              {e.firstName} {e.lastName}
            </span>
            <span className="employee-team">{e.team}</span>
            <button className="btn ghost danger" onClick={() => remove(e.id)}>
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

