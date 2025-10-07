"use client";

import { useState } from "react";
import EmployeeMultiSelect from "../../components/EmployeeMultiSelect";
import { getEmployees } from "../../employees";

export default function ExampleEmployeePicker() {
  const [selected, setSelected] = useState<string[]>([]);
  const employees = getEmployees();
  return (
    <main style={{ padding: 16 }}>
      <EmployeeMultiSelect employees={employees} value={selected} onChange={setSelected} label="Employees" />
    </main>
  );
}
