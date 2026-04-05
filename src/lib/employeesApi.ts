/**
 * API client for employees endpoint
 * Handles fetching, creating, updating, and deleting employees
 */

export type ApiEmployee = {
  id: number
  name: string
  wage_rate: number | string
  start_date: string
  phone_number?: string | null
  email?: string | null
  active: boolean
  notes?: string | null
  role?: string | null
  location?: string | null
}

export type CreateEmployeePayload = {
  name: string
  wage_rate: number
  start_date: string
  phone_number?: string
  email?: string
  active?: boolean
  notes?: string
  role?: string
  location?: string
}

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>

/**
 * Fetch all employees from API
 */
export async function fetchEmployees(active?: boolean): Promise<ApiEmployee[]> {
  const url = new URL("/api/employees", window.location.origin)
  if (active !== undefined) {
    url.searchParams.set("active", String(active))
  }
  const res = await fetch(url.toString(), { cache: "no-store" })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to fetch employees" }))
    throw new Error(error.message || error.error || "Failed to fetch employees")
  }
  return res.json()
}

/**
 * Fetch a single employee by ID
 */
export async function fetchEmployee(id: number): Promise<ApiEmployee> {
  const res = await fetch(`/api/employees/${id}`, { cache: "no-store" })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to fetch employee" }))
    throw new Error(error.message || error.error || "Failed to fetch employee")
  }
  return res.json()
}

/**
 * Create a new employee
 */
export async function createEmployee(payload: CreateEmployeePayload): Promise<ApiEmployee> {
  const res = await fetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to create employee" }))
    throw new Error(error.message || error.error || "Failed to create employee")
  }
  return res.json()
}

/**
 * Update an employee
 */
export async function updateEmployee(
  id: number,
  payload: UpdateEmployeePayload
): Promise<ApiEmployee> {
  const res = await fetch(`/api/employees/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to update employee" }))
    throw new Error(error.message || error.error || "Failed to update employee")
  }
  return res.json()
}

/**
 * Delete an employee
 */
export async function deleteEmployee(id: number): Promise<void> {
  const res = await fetch(`/api/employees/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to delete employee" }))
    throw new Error(error.message || error.error || "Failed to delete employee")
  }
}
