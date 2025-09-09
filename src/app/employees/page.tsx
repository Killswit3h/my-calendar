"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  resetEmployees,
  type Employee,
  type Team,
} from "../../employees";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(getEmployees());
  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState("");
  const [team, setTeam] = useState<Team>("South");
  const [editing, setEditing] = useState<string | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editTeam, setEditTeam] = useState<Team>("South");
  const router = useRouter();

  const refresh = () => setEmployees(getEmployees());

  const filtered = employees.filter((e) =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const parts = quick.trim().split(/\s+/);
    if (parts.length < 2) return;
    const [first, ...rest] = parts;
    const last = rest.join(" ");
    addEmployee({ firstName: first, lastName: last, team });
    setQuick("");
    setTeam("South");
    refresh();
  }

  function startEdit(emp: Employee) {
    setEditing(emp.id);
    setEditFirst(emp.firstName);
    setEditLast(emp.lastName);
    setEditTeam(emp.team);
  }

  function saveEdit(id: string) {
    updateEmployee(id, { firstName: editFirst, lastName: editLast, team: editTeam });
    setEditing(null);
    refresh();
  }

  function cancelEdit() {
    setEditing(null);
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
    <main className="p-4 space-y-4 max-w-xl mx-auto">
      <div className="flex items-center gap-2">
        <button className="btn" onClick={() => router.back()}>Back</button>
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded flex-1"
        />
        <button className="btn ghost ml-auto" onClick={reset}>Reset to seed</button>
      </div>
      <form onSubmit={handleQuickAdd} className="flex gap-2 items-end">
        <input
          className="border px-3 py-2 rounded flex-1"
          placeholder="First Last"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={team}
          onChange={(e) => setTeam(e.target.value as Team)}
        >
          <option value="South">South</option>
          <option value="Central">Central</option>
        </select>
        <button type="submit" className="btn primary">Add</button>
      </form>
      <ul className="bg-white rounded border divide-y">
        {filtered.map((e) => (
          editing === e.id ? (
            <li key={e.id} className="p-2 flex items-center gap-2">
              <input
                className="border rounded px-2 py-1 flex-1"
                value={editFirst}
                onChange={(ev) => setEditFirst(ev.target.value)}
              />
              <input
                className="border rounded px-2 py-1 flex-1"
                value={editLast}
                onChange={(ev) => setEditLast(ev.target.value)}
              />
              <select
                className="border rounded px-2 py-1"
                value={editTeam}
                onChange={(ev) => setEditTeam(ev.target.value as Team)}
              >
                <option value="South">South</option>
                <option value="Central">Central</option>
              </select>
              <button className="btn" onClick={() => saveEdit(e.id)}>Save</button>
              <button className="btn ghost" onClick={cancelEdit}>Cancel</button>
            </li>
          ) : (
            <li key={e.id} className="p-2 flex items-center gap-2">
              <span className="flex-1">{e.firstName} {e.lastName}</span>
              <span className="text-sm text-gray-500 w-20">{e.team}</span>
              <button className="btn" onClick={() => startEdit(e)}>Edit</button>
              <button className="btn danger" onClick={() => remove(e.id)}>Delete</button>
            </li>
          )
        ))}
      </ul>
    </main>
  );
}

