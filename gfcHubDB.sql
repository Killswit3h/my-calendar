CREATE TABLE "employee" (
  "id" integer PRIMARY KEY,
  "name" varchar NOT NULL,
  "wage_rate" decimal NOT NULL,
  "start_date" timestamp NOT NULL,
  "last_updated" timestamp,
  "phone_number" varchar,
  "email" varchar UNIQUE,
  "active" boolean DEFAULT true
);

CREATE TABLE "payment_type" (
  "id" integer PRIMARY KEY,
  "description" varchar UNIQUE NOT NULL
);

CREATE TABLE "scope_of_work" (
  "id" integer PRIMARY KEY,
  "description" varchar UNIQUE NOT NULL
);

CREATE TABLE "pay_item" (
  "id" integer PRIMARY KEY,
  "number" varchar UNIQUE NOT NULL,
  "description" text NOT NULL,
  "unit" varchar NOT NULL
);

CREATE TABLE "customer" (
  "id" integer PRIMARY KEY,
  "name" varchar UNIQUE NOT NULL,
  "address" varchar NOT NULL,
  "phone_number" varchar NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "project" (
  "id" integer PRIMARY KEY,
  "customer_id" integer,
  "name" varchar UNIQUE NOT NULL,
  "location" varchar NOT NULL,
  "retainage" decimal NOT NULL,
  "is_payroll" boolean DEFAULT false,
  "is_EEO" boolean DEFAULT false,
  "vendor" varchar NOT NULL,
  "status" varchar DEFAULT 'ACTIVE',
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "project_pay_item" (
  "id" integer PRIMARY KEY,
  "project_id" integer NOT NULL,
  "pay_item_id" integer NOT NULL,
  "contracted_quantity" decimal NOT NULL,
  "unit_rate" decimal NOT NULL,
  "is_original" boolean DEFAULT true,
  "stockpile_billed" decimal DEFAULT 0,
  "notes" text,
  "begin_station" varchar,
  "end_station" varchar,
  "status" varchar,
  "locate_ticket" varchar,
  "LF_RT" varchar,
  "onsite_review" varchar
);

CREATE TABLE "event" (
  "id" integer PRIMARY KEY,
  "project_id" integer NOT NULL,
  "scope_of_work_id" integer NOT NULL,
  "payment_type_id" integer NOT NULL,
  "invoice_id" integer,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp NOT NULL,
  "is_day_shift" boolean DEFAULT true,
  "location" varchar,
  "notes" text,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "event_assignment" (
  "id" integer PRIMARY KEY,
  "event_id" integer NOT NULL,
  "employee_id" integer NOT NULL
);

CREATE TABLE "event_quantity" (
  "id" integer PRIMARY KEY,
  "event_id" integer NOT NULL,
  "project_pay_item_id" integer NOT NULL,
  "quantity" decimal NOT NULL,
  "notes" text
);

CREATE TABLE "invoice" (
  "id" integer PRIMARY KEY,
  "number" varchar UNIQUE NOT NULL,
  "is_contract_invoice" boolean DEFAULT false
);

CREATE UNIQUE INDEX ON "event_assignment" ("event_id", "employee_id");

COMMENT ON TABLE "employee" IS 'Employee roster with wage rates and contact info';

COMMENT ON TABLE "payment_type" IS 'Payment rate types for different work scenarios';

COMMENT ON TABLE "scope_of_work" IS 'Types of work performed';

COMMENT ON TABLE "pay_item" IS 'FDOT pay item catalog';

COMMENT ON TABLE "customer" IS 'Customer/client information (FDOT districts, municipalities, etc.)';

COMMENT ON TABLE "project" IS 'Construction projects. Date range calculated from events.';

COMMENT ON TABLE "project_pay_item" IS 'Bid items for each project with contracted quantities and rates';

COMMENT ON TABLE "event" IS 'Work events/calendar entries. Title derived from project.name';

COMMENT ON TABLE "event_assignment" IS 'Employee assignments to events with hours worked';

COMMENT ON TABLE "event_quantity" IS 'Quantities installed per event. One event can have multiple pay items.';

ALTER TABLE "project" ADD FOREIGN KEY ("customer_id") REFERENCES "customer" ("id");

ALTER TABLE "project_pay_item" ADD FOREIGN KEY ("project_id") REFERENCES "project" ("id");

ALTER TABLE "project_pay_item" ADD FOREIGN KEY ("pay_item_id") REFERENCES "pay_item" ("id");

ALTER TABLE "event" ADD FOREIGN KEY ("project_id") REFERENCES "project" ("id");

ALTER TABLE "event" ADD FOREIGN KEY ("scope_of_work_id") REFERENCES "scope_of_work" ("id");

ALTER TABLE "event" ADD FOREIGN KEY ("payment_type_id") REFERENCES "payment_type" ("id");

ALTER TABLE "event" ADD FOREIGN KEY ("invoice_id") REFERENCES "invoice" ("id");

ALTER TABLE "event_assignment" ADD FOREIGN KEY ("event_id") REFERENCES "event" ("id");

ALTER TABLE "event_assignment" ADD FOREIGN KEY ("employee_id") REFERENCES "employee" ("id");

ALTER TABLE "event_quantity" ADD FOREIGN KEY ("event_id") REFERENCES "event" ("id");

ALTER TABLE "event_quantity" ADD FOREIGN KEY ("project_pay_item_id") REFERENCES "project_pay_item" ("id");
