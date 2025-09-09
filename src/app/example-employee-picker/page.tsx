"use client";

import { useState } from "react";
import EmployeeMultiSelect from "../../components/EmployeeMultiSelect";
import { getEmployees } from "../../employees";

const busyMap: Record<string, string[]> = {
  "2024-05-01": ["edilberto-acuna"],
  "2024-05-02": ["christopher-jones", "troy-sturgil"],
};

export default function ExampleEmployeePicker() {
  const [date, setDate] = useState("");
  const [policy, setPolicy] = useState<"warn" | "disable">("warn");
  const [group, setGroup] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const employees = getEmployees();
  const assigned = busyMap[date] || [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(`Saved ${selected.length} employees`);
  }

  return (
    <main className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Conflict policy</label>
          <select
            value={policy}
            onChange={(e) => setPolicy(e.target.value as any)}
            className="border px-2 py-1 rounded w-full"
          >
            <option value="warn">warn</option>
            <option value="disable">disable</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="group"
            type="checkbox"
            checked={group}
            onChange={(e) => setGroup(e.target.checked)}
          />
          <label htmlFor="group">Group by team</label>
        </div>
        <EmployeeMultiSelect
          employees={employees}
          value={selected}
          onChange={setSelected}
          assignedEmployeeIds={assigned}
          conflictPolicy={policy}
          groupByTeam={group}
          label="Employees"
        />
        <div>
          <h2 className="text-sm font-semibold">Selected</h2>
          <ul className="list-disc pl-4">
            {selected.map((id) => {
              const emp = employees.find((e) => e.id === id);
              if (!emp) return null;
              return (
                <li key={id}>{emp.firstName} {emp.lastName}</li>
              );
            })}
          </ul>
        </div>
        <button type="submit" className="btn primary">Save</button>
      </form>
    </main>
  );
}

