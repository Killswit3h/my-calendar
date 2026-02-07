# Postman Collections

Postman collection files for API testing. Import these into Postman to test the my-calendar API locally. Collections are version-controlled since Postman no longer supports team collaboration on free plans.

## Setup

1. Open Postman
2. **Import** → Select the `.postman_collection.json` file(s)
3. Update the `baseUrl` variable if needed (default: `http://localhost:3000`)

## Collections

Each collection maps to one controller and includes all CRUD operations (List, Get by ID, Create, Update, Delete).

| Collection | API Path | Query Filters |
|------------|----------|---------------|
| `customers.postman_collection.json` | `/api/customers` | `search` (name substring) |
| `employees.postman_collection.json` | `/api/employees` | `active` (true/false) |
| `invoices.postman_collection.json` | `/api/invoices` | `number` (substring) |
| `pay-items.postman_collection.json` | `/api/pay-items` | `number`, `description` |
| `payment-types.postman_collection.json` | `/api/payment-types` | `description` |
| `project-pay-items.postman_collection.json` | `/api/project-pay-items` | `project_id`, `pay_item_id`, `expanded=true` |
| `projects.postman_collection.json` | `/api/projects` | `name`, `location`, `vendor`, `customer_id` |
| `scope-of-works.postman_collection.json` | `/api/scope-of-works` | `description` |

## Request Bodies

### Customers
- **POST/PATCH:** `name`, `address`, `phone_number`, `email` (required); `notes` (optional)

### Employees
- **POST (required):** `name`, `wage_rate`, `start_date`
- **POST (optional):** `email`, `phone_number`, `active`

### Invoices
- **POST (required):** `number`
- **POST (optional):** `is_contract_invoice` (default: false)

### Pay Items
- **POST (required):** `number`, `description`, `unit`

### Payment Types / Scope of Works
- **POST (required):** `description`

### Project Pay Items
- **POST (required):** `project_id`, `pay_item_id`, `contracted_quantity`, `unit_rate`
- **POST (optional):** `is_original`, `stockpile_billed`, `notes`, `begin_station`, `end_station`, `status`, `locate_ticket`, `LF_RT`, `onsite_review`

### Projects
- **POST (required):** `name`, `location`, `retainage`, `vendor`
- **POST (optional):** `customer_id`, `is_payroll`, `is_EEO`, `status` (default: "ACTIVE")
