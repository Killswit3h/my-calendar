"use client";

import { useState } from "react";
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
    <main className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button className="btn ghost" onClick={reset}>Reset to seed</button>
      </div>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-sm mb-1">First name</label>
          <input
            className="border px-2 py-1 rounded"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Last name</label>
          <input
            className="border px-2 py-1 rounded"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Team</label>
          <select
            className="border px-2 py-1 rounded"
            value={team}
            onChange={(e) => setTeam(e.target.value as Team)}
          >
            <option value="South">South</option>
            <option value="Central">Central</option>
          </select>
        </div>
        <button type="submit" className="btn primary">Add</button>
      </form>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1 text-left">First</th>
            <th className="border px-2 py-1 text-left">Last</th>
            <th className="border px-2 py-1 text-left">Team</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e) => (
            <tr key={e.id} className="border-t">
              {editing === e.id ? (
                <>
                  <td className="border px-2 py-1">
                    <input
                      className="border px-1 py-0.5 rounded w-full"
                      value={editFirst}
                      onChange={(ev) => setEditFirst(ev.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="border px-1 py-0.5 rounded w-full"
                      value={editLast}
                      onChange={(ev) => setEditLast(ev.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <select
                      className="border px-1 py-0.5 rounded w-full"
                      value={editTeam}
                      onChange={(ev) => setEditTeam(ev.target.value as Team)}
                    >
                      <option value="South">South</option>
                      <option value="Central">Central</option>
                    </select>
                  </td>
                  <td className="border px-2 py-1 space-x-2 text-center">
                    <button className="btn" onClick={() => saveEdit(e.id)}>Save</button>
                    <button className="btn ghost" onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td className="border px-2 py-1">{e.firstName}</td>
                  <td className="border px-2 py-1">{e.lastName}</td>
                  <td className="border px-2 py-1">{e.team}</td>
                  <td className="border px-2 py-1 space-x-2 text-center">
                    <button className="btn" onClick={() => startEdit(e)}>Edit</button>
                    <button className="btn danger" onClick={() => remove(e.id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

