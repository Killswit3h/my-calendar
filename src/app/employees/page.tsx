"use client";

import { useState } from "react";
import Link from "next/link";
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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [team, setTeam] = useState<Team>("South");

  const [editing, setEditing] = useState<string | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editTeam, setEditTeam] = useState<Team>("South");

  const refresh = () => setEmployees(getEmployees());

  const filtered = employees.filter((e) =>
    `${e.firstName} ${e.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    addEmployee({ firstName: firstName.trim(), lastName: lastName.trim(), team });
    setFirstName("");
    setLastName("");
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
    <main className="p-4 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/" className="btn">Back</Link>
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded flex-1"
        />
        <button className="btn ghost ml-auto" onClick={reset}>Reset to seed</button>
      </div>
      <form onSubmit={handleAdd} className="bg-white rounded shadow p-4 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex flex-col flex-1">
          <label className="text-sm mb-1">First name</label>
          <input
            className="border rounded px-3 py-2"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="flex flex-col flex-1">
          <label className="text-sm mb-1">Last name</label>
          <input
            className="border rounded px-3 py-2"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Team</label>
          <select
            className="border rounded px-3 py-2"
            value={team}
            onChange={(e) => setTeam(e.target.value as Team)}
          >
            <option value="South">South</option>
            <option value="Central">Central</option>
          </select>
        </div>
        <button type="submit" className="btn primary self-end">Add</button>
      </form>
      <ul className="space-y-2">
        {filtered.map((e) => (
          editing === e.id ? (
            <li key={e.id} className="bg-white rounded shadow p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row sm:gap-4 flex-1">
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
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => saveEdit(e.id)}>Save</button>
                <button className="btn ghost" onClick={cancelEdit}>Cancel</button>
              </div>
            </li>
          ) : (
            <li key={e.id} className="bg-white rounded shadow p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{e.firstName} {e.lastName}</p>
                <p className="text-sm text-gray-500">{e.team}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => startEdit(e)}>Edit</button>
                <button className="btn danger" onClick={() => remove(e.id)}>Delete</button>
              </div>
            </li>
          )
        ))}
      </ul>
    </main>
  );
}

