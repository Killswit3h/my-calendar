--
-- PostgreSQL database dump
--

\restrict dcuZCdqHC0tR695ochtll3VM9hL8ZPD0NRf08588Ux1BrpqL0cvebIQqGVErW0e

-- Dumped from database version 17.5 (6bc9ef8)
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: EventType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EventType" AS ENUM (
    'GUARDRAIL',
    'FENCE',
    'TEMP_FENCE',
    'HANDRAIL',
    'ATTENUATOR'
);


--
-- Name: InventoryCheckoutStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InventoryCheckoutStatus" AS ENUM (
    'OPEN',
    'CLOSED',
    'LOST',
    'DAMAGED'
);


--
-- Name: InventoryLedgerReason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InventoryLedgerReason" AS ENUM (
    'CHECKOUT',
    'RETURN',
    'ADJUST',
    'CONSUME',
    'TRANSFER'
);


--
-- Name: PlacementType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PlacementType" AS ENUM (
    'FREE',
    'YARD_SHOP',
    'NO_WORK'
);


--
-- Name: ReportKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportKind" AS ENUM (
    'DAILY_PDF',
    'DAILY_XLSX',
    'WEEKLY_PDF'
);


--
-- Name: ShareRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShareRole" AS ENUM (
    'VIEWER',
    'EDITOR'
);


--
-- Name: WeeklyStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WeeklyStatus" AS ENUM (
    'PENDING',
    'SUCCESS',
    'ERROR'
);


--
-- Name: WorkShift; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WorkShift" AS ENUM (
    'DAY',
    'NIGHT'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users_sync; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.users_sync (
    raw_json jsonb NOT NULL,
    id text GENERATED ALWAYS AS ((raw_json ->> 'id'::text)) STORED NOT NULL,
    name text GENERATED ALWAYS AS ((raw_json ->> 'display_name'::text)) STORED,
    email text GENERATED ALWAYS AS ((raw_json ->> 'primary_email'::text)) STORED,
    created_at timestamp with time zone GENERATED ALWAYS AS (to_timestamp((trunc((((raw_json ->> 'signed_up_at_millis'::text))::bigint)::double precision) / (1000)::double precision))) STORED,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: Calendar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Calendar" (
    id text NOT NULL,
    name text NOT NULL,
    "isPrivate" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Certification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Certification" (
    id text NOT NULL,
    "employeeName" text NOT NULL,
    certification text NOT NULL,
    status text NOT NULL,
    "expiresOn" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ChangeOrder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChangeOrder" (
    id text NOT NULL,
    project text NOT NULL,
    title text NOT NULL,
    amount numeric(12,2),
    status text NOT NULL,
    "submittedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Customer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DailyReportSnapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DailyReportSnapshot" (
    id text NOT NULL,
    "reportDate" timestamp(3) without time zone NOT NULL,
    vendor text,
    "payloadJson" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Employee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    name text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "defaultSection" public."PlacementType" DEFAULT 'YARD_SHOP'::public."PlacementType",
    "hourlyRate" numeric(10,2)
);


--
-- Name: Event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    "calendarId" text NOT NULL,
    title text NOT NULL,
    description text,
    "allDay" boolean DEFAULT false NOT NULL,
    location text,
    employees jsonb,
    "invoiceNumber" text,
    type text,
    shift public."WorkShift",
    checklist jsonb,
    "startsAt" timestamp with time zone NOT NULL,
    "endsAt" timestamp with time zone NOT NULL,
    "attachmentData" bytea,
    "attachmentName" text,
    "attachmentType" text
);


--
-- Name: EventAssignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EventAssignment" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "employeeId" text NOT NULL,
    "dayOverride" date,
    hours numeric(4,2),
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: EventQuantity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EventQuantity" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "payItemId" text NOT NULL,
    quantity numeric(18,6) NOT NULL,
    "stationFrom" text,
    "stationTo" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Holiday; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Holiday" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "localName" text NOT NULL,
    name text NOT NULL,
    "countryCode" text NOT NULL,
    regions text,
    types text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: HourlyRate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HourlyRate" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "effectiveDate" date NOT NULL,
    rate numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: InventoryCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryCategory" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: InventoryCheckout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryCheckout" (
    id text NOT NULL,
    "itemId" text NOT NULL,
    qty integer NOT NULL,
    "fromLocationId" text NOT NULL,
    "toEmployeeId" text,
    "toEventId" text,
    "toLocationId" text,
    "dueAt" timestamp(3) without time zone,
    "checkedOutById" text NOT NULL,
    "checkedOutAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."InventoryCheckoutStatus" DEFAULT 'OPEN'::public."InventoryCheckoutStatus" NOT NULL,
    "closedAt" timestamp(3) without time zone
);


--
-- Name: InventoryItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryItem" (
    id text NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    description text,
    unit text NOT NULL,
    "isConsumable" boolean DEFAULT false NOT NULL,
    "minStock" integer DEFAULT 0 NOT NULL,
    barcode text,
    "categoryId" text,
    "defaultLocationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: InventoryLedger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryLedger" (
    id text NOT NULL,
    "itemId" text NOT NULL,
    "deltaQty" integer NOT NULL,
    "fromLocationId" text,
    "toLocationId" text,
    reason public."InventoryLedgerReason" NOT NULL,
    "refType" text,
    "refId" text,
    "actorId" text,
    at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text
);


--
-- Name: InventoryLocation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryLocation" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "isTruck" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: InventoryReservation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryReservation" (
    id text NOT NULL,
    "itemId" text NOT NULL,
    "eventId" text NOT NULL,
    qty integer NOT NULL,
    "neededAt" timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: InventoryReturn; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryReturn" (
    id text NOT NULL,
    "checkoutId" text NOT NULL,
    qty integer NOT NULL,
    "toLocationId" text NOT NULL,
    condition text,
    notes text,
    "photoUrl" text,
    "checkedInById" text NOT NULL,
    "checkedInAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: InventoryStock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryStock" (
    id text NOT NULL,
    "itemId" text NOT NULL,
    "locationId" text NOT NULL,
    qty integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: InventoryTransfer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryTransfer" (
    id text NOT NULL,
    "itemId" text NOT NULL,
    "fromLocationId" text NOT NULL,
    "toLocationId" text NOT NULL,
    qty integer NOT NULL,
    status text NOT NULL,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "fulfilledAt" timestamp(3) without time zone,
    notes text
);


--
-- Name: LaborDaily; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LaborDaily" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "jobName" text NOT NULL,
    day date NOT NULL,
    "eventId" text NOT NULL,
    "eventTitle" text,
    "employeeId" text NOT NULL,
    "employeeName" text NOT NULL,
    "assignmentId" text,
    "hoursDecimal" numeric(6,2) NOT NULL,
    "regularHours" numeric(6,2) NOT NULL,
    "overtimeHours" numeric(6,2) NOT NULL,
    "rateUsd" numeric(10,2) NOT NULL,
    "regularCostUsd" numeric(12,2) NOT NULL,
    "overtimeCostUsd" numeric(12,2) NOT NULL,
    "totalCostUsd" numeric(12,2) NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PayItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PayItem" (
    id text NOT NULL,
    number text NOT NULL,
    description text NOT NULL,
    unit text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Placement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Placement" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "dayKey" text NOT NULL,
    placement public."PlacementType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PurchaseOrder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PurchaseOrder" (
    id text NOT NULL,
    "poNumber" text NOT NULL,
    project text NOT NULL,
    vendor text NOT NULL,
    status text NOT NULL,
    "expectedOn" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ReportFile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReportFile" (
    id text NOT NULL,
    kind public."ReportKind" NOT NULL,
    "reportDate" timestamp(3) without time zone,
    "weekStart" timestamp(3) without time zone,
    "weekEnd" timestamp(3) without time zone,
    vendor text,
    "blobUrl" text NOT NULL,
    bytes integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Rfi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Rfi" (
    id text NOT NULL,
    project text NOT NULL,
    subject text NOT NULL,
    "assignedTo" text,
    status text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ShareToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShareToken" (
    id text NOT NULL,
    "calendarId" text NOT NULL,
    role public."ShareRole" NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Todo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Todo" (
    id text NOT NULL,
    "calendarId" text NOT NULL,
    title text NOT NULL,
    notes text,
    done boolean DEFAULT false NOT NULL,
    type public."EventType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: UserSetting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserSetting" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "showHolidays" boolean DEFAULT true NOT NULL,
    "countryCode" text DEFAULT 'US'::text NOT NULL,
    "useIcs" boolean DEFAULT false NOT NULL,
    "icsUrl" text
);


--
-- Name: Vehicle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Vehicle" (
    id text NOT NULL,
    unit text NOT NULL,
    status text NOT NULL,
    location text,
    "nextServiceOn" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: WeeklyReportRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WeeklyReportRequest" (
    id text NOT NULL,
    "weekStart" timestamp(3) without time zone NOT NULL,
    "weekEnd" timestamp(3) without time zone NOT NULL,
    vendor text,
    status public."WeeklyStatus" DEFAULT 'PENDING'::public."WeeklyStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "finishedAt" timestamp(3) without time zone,
    "errorText" text
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: fdot_cutoffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fdot_cutoffs (
    id text NOT NULL,
    year integer NOT NULL,
    cutoff_date timestamp(3) without time zone NOT NULL,
    label text,
    created_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: labor_daily_v; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.labor_daily_v AS
 SELECT "jobId",
    day,
    "eventId",
    "employeeId",
    "hoursDecimal" AS hours_decimal,
    "rateUsd" AS rate_usd,
    "totalCostUsd" AS cost_usd
   FROM public."LaborDaily";


--
-- Data for Name: users_sync; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.users_sync (raw_json, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: Calendar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Calendar" (id, name, "isPrivate", "createdAt") FROM stdin;
cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	t	2025-10-22 23:42:32.776
codex-test-cal	Default	t	2025-10-25 16:34:26.316
\.


--
-- Data for Name: Certification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Certification" (id, "employeeName", certification, status, "expiresOn", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChangeOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChangeOrder" (id, project, title, amount, status, "submittedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Customer" (id, name, "createdAt", "updatedAt") FROM stdin;
cmfg4zvwz0000ovbomcyt5yq1	A-YAN ELECTRICAL SERVICES, INC.	2025-09-12 01:06:36.755	2025-09-12 01:06:36.755
cmfg4zvzq0001ovbo17d3mc3h	A & A FONTE INC.	2025-09-12 01:06:36.855	2025-09-12 01:06:36.855
cmfg4zw1q0002ovboc9bek6my	A & A FONTE INC.:CUTTLER ROAD	2025-09-12 01:06:36.927	2025-09-12 01:06:36.927
cmfg4zw3m0003ovbo28d2fnc4	A & A FONTE INC.:FP&L PRINCE SUBSTATION	2025-09-12 01:06:36.994	2025-09-12 01:06:36.994
cmfg4zw5m0004ovbog5pne3sx	A & A FONTE INC.:HCA KENDALL REGIONAL	2025-09-12 01:06:37.067	2025-09-12 01:06:37.067
cmfg4zw7l0005ovboz71iau63	A & A FONTE INC.:PORT EVERGLADES PHASE II	2025-09-12 01:06:37.138	2025-09-12 01:06:37.138
cmfg4zw9h0006ovbonawz2mqq	A & B PIPE	2025-09-12 01:06:37.206	2025-09-12 01:06:37.206
cmfg4zwbo0007ovbo4ngjn1t2	A & E CONSTRUCTION	2025-09-12 01:06:37.284	2025-09-12 01:06:37.284
cmfg4zwdo0008ovbol649kdzs	A & Q FENCE CORP	2025-09-12 01:06:37.357	2025-09-12 01:06:37.357
cmfg4zwfj0009ovbo9nso1qza	A & R EQUIPMENT CORP	2025-09-12 01:06:37.423	2025-09-12 01:06:37.423
cmfg4zwhn000aovboilvg1536	A AUTO TECK	2025-09-12 01:06:37.499	2025-09-12 01:06:37.499
cmfg4zwju000bovbo8swsuojw	A GALVEZ CONSTRUCTION CONSULTING	2025-09-12 01:06:37.578	2025-09-12 01:06:37.578
cmfg4zwlw000covboj3v5bq5l	A GREEN WORLD CONSTRUCTION CO INC	2025-09-12 01:06:37.652	2025-09-12 01:06:37.652
cmfg4zwpk000dovbo8765p38c	A&E CONSTRUCTION	2025-09-12 01:06:37.784	2025-09-12 01:06:37.784
cmfg4zwrn000eovbo5oh1qx2j	A&J LOPEZ INC	2025-09-12 01:06:37.859	2025-09-12 01:06:37.859
cmfg4zwtt000fovbohjpxw1vb	A. LUIS MILLING & SERVICE	2025-09-12 01:06:37.938	2025-09-12 01:06:37.938
cmfg4zwwj000govbo9gcmqgrm	A.C.C. DEVELOPMENT GROUP	2025-09-12 01:06:38.036	2025-09-12 01:06:38.036
cmfg4zx5v000hovbop1g844wn	A.C.T SERVICES, INC	2025-09-12 01:06:38.372	2025-09-12 01:06:38.372
cmfg4zx7x000iovbolab8mtnf	A.D.A ENGINEERING	2025-09-12 01:06:38.445	2025-09-12 01:06:38.445
cmfg4zx9y000jovbo5ykrnpm3	A.D.S CONSTRUCTION INC	2025-09-12 01:06:38.519	2025-09-12 01:06:38.519
cmfg4zxc3000kovbo6ubcim8u	A.N.F.	2025-09-12 01:06:38.596	2025-09-12 01:06:38.596
cmfg4zxe3000lovbotr3ze1z4	A.P.E.R. CONSTRUCTION	2025-09-12 01:06:38.667	2025-09-12 01:06:38.667
cmfg4zxfy000movbohiddczr3	AAA	2025-09-12 01:06:38.735	2025-09-12 01:06:38.735
cmfg4zxhy000novboh16tskkt	AAR	2025-09-12 01:06:38.806	2025-09-12 01:06:38.806
cmfg4zxk0000oovbow30v0i8t	AAR LANDING	2025-09-12 01:06:38.88	2025-09-12 01:06:38.88
cmfg4zxly000povbo0gv12gd1	AARON HIALEAH INSPECTOR	2025-09-12 01:06:38.951	2025-09-12 01:06:38.951
cmfg4zxnz000qovbooi5tbbm4	AATI	2025-09-12 01:06:39.023	2025-09-12 01:06:39.023
cmfg4zxx4000rovbowdrr0g3i	AAXICO	2025-09-12 01:06:39.353	2025-09-12 01:06:39.353
cmfg4zxz5000sovbozmlezj7e	AB REMODELING-	2025-09-12 01:06:39.425	2025-09-12 01:06:39.425
cmfg4zy15000tovbok1c7kjgf	ABASCAL GROUP	2025-09-12 01:06:39.497	2025-09-12 01:06:39.497
cmfg4zy35000uovbo54rofit3	ABBOT CONSTRUCTION	2025-09-12 01:06:39.569	2025-09-12 01:06:39.569
cmfg4zy55000vovbozervceth	ABBOTT OCEAN INVESTMENTS, LLC	2025-09-12 01:06:39.641	2025-09-12 01:06:39.641
cmfg4zy74000wovbo2rhoqg8x	ABBOTT PLACE CORP.	2025-09-12 01:06:39.713	2025-09-12 01:06:39.713
cmfg4zy94000xovbonsr49poq	ABC CONSTRUCTION	2025-09-12 01:06:39.785	2025-09-12 01:06:39.785
cmfg4zyb5000yovboludwvx9g	ABCO ELECTRIC INC	2025-09-12 01:06:39.857	2025-09-12 01:06:39.857
cmfg4zyd4000zovbowna8csxt	ABSOLUTE CONSTRUCTION SERVICES, INC	2025-09-12 01:06:39.929	2025-09-12 01:06:39.929
cmfg4zyf50010ovboj2u6eap8	ACA CONTRACTORS	2025-09-12 01:06:40.001	2025-09-12 01:06:40.001
cmfg4zyh40011ovbopghtvwkx	ACADEMICA	2025-09-12 01:06:40.072	2025-09-12 01:06:40.072
cmfg4zyj70012ovboa9dj9ijn	ACCESS BUILDERS INC	2025-09-12 01:06:40.148	2025-09-12 01:06:40.148
cmfg4zyl70013ovboohogsbrl	ACCO FOREIGN SHIPPING INC-	2025-09-12 01:06:40.22	2025-09-12 01:06:40.22
cmfg4zyn90014ovbo9au9tu4l	ACE RACKS & SHELVING	2025-09-12 01:06:40.293	2025-09-12 01:06:40.293
cmfg4zypc0015ovbo7qlfv9ca	ACIES CONSTRUCTION LLC.	2025-09-12 01:06:40.368	2025-09-12 01:06:40.368
cmfg4zyrg0016ovbo0lsnhavu	ACOSTA TRACTORS, INC	2025-09-12 01:06:40.445	2025-09-12 01:06:40.445
cmfg4zytk0017ovboz0z1huxm	ACOSTA TRACTORS, INC:8000 W. SUNRISE	2025-09-12 01:06:40.52	2025-09-12 01:06:40.52
cmfg4zz330018ovbo8fv3tpt7	ACOSTA TRACTORS, INC:ACOSTA 87 AVE PROJECT	2025-09-12 01:06:40.863	2025-09-12 01:06:40.863
cmfg4zz510019ovbog60k085r	ACOSTA TRACTORS, INC:ACOSTA 97TH AVE	2025-09-12 01:06:40.933	2025-09-12 01:06:40.933
cmfg4zz94001aovbogkuagizy	ACOSTA TRACTORS, INC:ACOSTA PROJECT NO. 2015-5 TOWN DAVIE	2025-09-12 01:06:41.081	2025-09-12 01:06:41.081
cmfg4zzb5001bovboauakjgr0	ACOSTA TRACTORS, INC:NW 114 AVE	2025-09-12 01:06:41.153	2025-09-12 01:06:41.153
cmfg4zzd5001covbot68bb68c	ACRE ENGINEERING AND CONSTRUCTION	2025-09-12 01:06:41.225	2025-09-12 01:06:41.225
cmfg4zzf4001dovbog7dcosbx	ACT FLORIDA	2025-09-12 01:06:41.296	2025-09-12 01:06:41.296
cmfg4zzh3001eovboysfmkktm	ACT SERVICES	2025-09-12 01:06:41.368	2025-09-12 01:06:41.368
cmfg4zzj3001fovboq2hoj8mv	ACTION RENTALS.	2025-09-12 01:06:41.439	2025-09-12 01:06:41.439
cmfg4zzl4001govbossgosezy	ADAM BROOKSON	2025-09-12 01:06:41.512	2025-09-12 01:06:41.512
cmfg4zzn5001hovbogfbtvah7	ADANAC DEVELOPMENT & CONSTRUCTION	2025-09-12 01:06:41.585	2025-09-12 01:06:41.585
cmfg4zzp5001iovbow5ab0cfu	ADELA VALERIO	2025-09-12 01:06:41.657	2025-09-12 01:06:41.657
cmfg4zzr5001jovbo5vydwot1	ADI CONTRACTING, LLC	2025-09-12 01:06:41.729	2025-09-12 01:06:41.729
cmfg4zzt5001kovbojrd7ntgr	ADONEL CONCRETES	2025-09-12 01:06:41.801	2025-09-12 01:06:41.801
cmfg4zzw4001lovboxy61h053	ADVANCED RECREATIONAL CONCEPTS	2025-09-12 01:06:41.908	2025-09-12 01:06:41.908
cmfg4zzy3001movbos71o261g	ADVANTIX ENGINEERING CORP	2025-09-12 01:06:41.98	2025-09-12 01:06:41.98
cmfg50005001novbofbp4kmkd	AED CORP	2025-09-12 01:06:42.053	2025-09-12 01:06:42.053
cmfg5002f001oovbocg17l5hb	AFCO CONSTRUCTION CORP.	2025-09-12 01:06:42.135	2025-09-12 01:06:42.135
cmfg5004u001povbo6lzcfhwl	AFFORDABLE ASPHALT	2025-09-12 01:06:42.223	2025-09-12 01:06:42.223
cmfg5006u001qovboxbkzmejx	AGO NORTH AMERICA LLC	2025-09-12 01:06:42.294	2025-09-12 01:06:42.294
cmfg5008y001rovboa6c9zalb	AGUILA MAINTENANCE	2025-09-12 01:06:42.371	2025-09-12 01:06:42.371
cmfg500b0001sovbok8rv2682	AGUSTIN MAIZ	2025-09-12 01:06:42.444	2025-09-12 01:06:42.444
cmfg500cz001tovborvoly1f4	AIG CONSTRUCTION SERVICES	2025-09-12 01:06:42.516	2025-09-12 01:06:42.516
cmfg500ey001uovboq2lmsd7t	AIRGAS USA, LLC	2025-09-12 01:06:42.587	2025-09-12 01:06:42.587
cmfg500gy001vovbomc72zpig	AIRPORT MEDICAL CLINIC	2025-09-12 01:06:42.659	2025-09-12 01:06:42.659
cmfg500it001wovboisvnh5ix	AIRPORT MEDICAL CLINIC-	2025-09-12 01:06:42.726	2025-09-12 01:06:42.726
cmfg500kt001xovbodmjfzitq	AIRPORT MINI STORAGE	2025-09-12 01:06:42.798	2025-09-12 01:06:42.798
cmfg500mv001yovboenkw0849	AJ ENGINEERING	2025-09-12 01:06:42.871	2025-09-12 01:06:42.871
cmfg500ou001zovbozn3lh3ux	AJCE CORP	2025-09-12 01:06:42.942	2025-09-12 01:06:42.942
cmfg500rg0020ovbo8gv9op41	AKAM ON SITE	2025-09-12 01:06:43.036	2025-09-12 01:06:43.036
cmfg500ti0021ovbo3dajal57	AKM RESTAURANT SUPPLY DEPOT	2025-09-12 01:06:43.11	2025-09-12 01:06:43.11
cmfg500vh0022ovbo2bq7wkul	AL ENTERPRISES	2025-09-12 01:06:43.181	2025-09-12 01:06:43.181
cmfg500xm0023ovboqzqd7nu8	ALABAMA JACKS, INC.	2025-09-12 01:06:43.258	2025-09-12 01:06:43.258
cmfg500zq0024ovbokbesfa4p	ALAIN NORVAL	2025-09-12 01:06:43.334	2025-09-12 01:06:43.334
cmfg5011p0025ovbox2gs22f6	ALBERT MORALES	2025-09-12 01:06:43.406	2025-09-12 01:06:43.406
cmfg5013t0026ovbohk156q30	ALBERTO MORALES	2025-09-12 01:06:43.481	2025-09-12 01:06:43.481
cmfg5015s0027ovbo6f8a17k5	ALBERTO PERMUY	2025-09-12 01:06:43.553	2025-09-12 01:06:43.553
cmfg5017z0028ovbo88cbxvht	ALE HOUSE RETAURANT	2025-09-12 01:06:43.631	2025-09-12 01:06:43.631
cmfg501a20029ovbomzfm2fuw	ALES GROUP	2025-09-12 01:06:43.706	2025-09-12 01:06:43.706
cmfg501c2002aovbo8tnxcmsq	ALES GROUP-	2025-09-12 01:06:43.779	2025-09-12 01:06:43.779
cmfg501e3002bovboq03vbb6u	ALEX CASTRILLON	2025-09-12 01:06:43.851	2025-09-12 01:06:43.851
cmfg501g6002covbouph9pv0x	ALEX FIALLOS	2025-09-12 01:06:43.926	2025-09-12 01:06:43.926
cmfg501ib002dovbon33erpya	ALEXANDER & JOHNSON CONTRACTORS	2025-09-12 01:06:44.003	2025-09-12 01:06:44.003
cmfg501l7002eovbospebf1la	ALEXIS CHANG	2025-09-12 01:06:44.107	2025-09-12 01:06:44.107
cmfg501nb002fovboawq22o0p	ALEXIS LODDE	2025-09-12 01:06:44.183	2025-09-12 01:06:44.183
cmfg501pa002govbog9hcc4qs	ALHEY CORP.	2025-09-12 01:06:44.254	2025-09-12 01:06:44.254
cmfg501r9002hovbogo4h81zg	ALICE & DIEGO	2025-09-12 01:06:44.326	2025-09-12 01:06:44.326
cmfg501t9002iovbonpjxb6k0	ALL-SITE CONSTRUCTION, INC	2025-09-12 01:06:44.397	2025-09-12 01:06:44.397
cmfg501vb002jovboqbz3ruak	ALL AMERICAN BARRICADES.	2025-09-12 01:06:44.472	2025-09-12 01:06:44.472
cmfg501xa002kovbofekxe96f	ALL COUNTY PAVEMENT	2025-09-12 01:06:44.542	2025-09-12 01:06:44.542
cmfg501za002lovbo7w3x493h	ALL DADE FENCES	2025-09-12 01:06:44.615	2025-09-12 01:06:44.615
cmfg5021a002movbojk7wf5ze	ALL IMPORT	2025-09-12 01:06:44.686	2025-09-12 01:06:44.686
cmfg50239002novboq8dux3ie	ALL POWER GARAGE DOORS	2025-09-12 01:06:44.757	2025-09-12 01:06:44.757
cmfg5025a002oovbo2n9t6n8j	ALL SITE CONSTRUCTION, INC	2025-09-12 01:06:44.83	2025-09-12 01:06:44.83
cmfg50279002povbovgjzn0o2	ALL STAR ENTERPRISES, INC	2025-09-12 01:06:44.902	2025-09-12 01:06:44.902
cmfg5029e002qovboedrl7c2q	ALL STATE AUTO TRANSPORT	2025-09-12 01:06:44.978	2025-09-12 01:06:44.978
cmfg502bl002rovboh5nkksyx	ALL TRADES CONTRACTING, INC.	2025-09-12 01:06:45.057	2025-09-12 01:06:45.057
cmfg502dl002sovboz5z6zpdw	ALL WEBBS	2025-09-12 01:06:45.129	2025-09-12 01:06:45.129
cmfg502fp002tovbooc49fqg3	ALLIED AEROFOAM	2025-09-12 01:06:45.206	2025-09-12 01:06:45.206
cmfg502hp002uovbohq2sxy8j	ALLIED CONTRACTORS INC.	2025-09-12 01:06:45.277	2025-09-12 01:06:45.277
cmfg502jo002vovboox1gmoqd	ALLRAIL	2025-09-12 01:06:45.348	2025-09-12 01:06:45.348
cmfg502lt002wovbofekpafzu	ALLSTATE INS.	2025-09-12 01:06:45.425	2025-09-12 01:06:45.425
cmfg502nt002xovbo2hdvj1nt	ALLY ENGINEERING SERVICES	2025-09-12 01:06:45.498	2025-09-12 01:06:45.498
cmfg502rp002yovbozkk18o5e	ALPHA MARINE SURVEYORS	2025-09-12 01:06:45.637	2025-09-12 01:06:45.637
cmfg502to002zovboit6t6dh0	ALPINE ENGINEERING & DEVELOPMENT CORP	2025-09-12 01:06:45.709	2025-09-12 01:06:45.709
cmfg502vo0030ovbotu9sishl	ALSTON CONSTRUCTION	2025-09-12 01:06:45.781	2025-09-12 01:06:45.781
cmfg502xo0031ovbo83dd7fd6	ALSTON CONSTRUCTION:SKY HARBOR PHASE II	2025-09-12 01:06:45.853	2025-09-12 01:06:45.853
cmfg502zp0032ovboy5qv57cf	ALT INTERMODAL LLC	2025-09-12 01:06:45.925	2025-09-12 01:06:45.925
cmfg5031o0033ovbos68gmx08	ALTA DEVELOPERS	2025-09-12 01:06:45.997	2025-09-12 01:06:45.997
cmfg5033n0034ovboo9g2fbgp	ALTA QUALITY BUILDERS	2025-09-12 01:06:46.068	2025-09-12 01:06:46.068
cmfg5035o0035ovbo8x8wvnbh	am	2025-09-12 01:06:46.14	2025-09-12 01:06:46.14
cmfg5037n0036ovbo66ourabc	AMAURI	2025-09-12 01:06:46.211	2025-09-12 01:06:46.211
cmfg5039q0037ovboznp41uvq	AMAZON-	2025-09-12 01:06:46.286	2025-09-12 01:06:46.286
cmfg503bp0038ovbo8f9z1m3h	AMAZON ROBOTICS	2025-09-12 01:06:46.358	2025-09-12 01:06:46.358
cmfg503du0039ovbon6uj3eek	AMERESCO	2025-09-12 01:06:46.434	2025-09-12 01:06:46.434
cmfg503fz003aovbofntxmkpw	AMERICA ENGINEERING AND DEVELOPMENT	2025-09-12 01:06:46.511	2025-09-12 01:06:46.511
cmfg503i1003bovbov86xvbi2	AMERICA ENGINEERING AND DEVELOPMENT:BIOTEST	2025-09-12 01:06:46.586	2025-09-12 01:06:46.586
cmfg503k2003covbo6fi0p4tr	AMERICA ENGINEERING AND DEVELOPMENT:BISCAYNE BLVD IMPROVEMENT	2025-09-12 01:06:46.659	2025-09-12 01:06:46.659
cmfg503m8003dovbo58q7lnvl	AMERICA ENGINEERING AND DEVELOPMENT:BOCA RATON RECLAIMED WATER	2025-09-12 01:06:46.737	2025-09-12 01:06:46.737
cmfg503o5003eovbomfxn71rf	AMERICA ENGINEERING AND DEVELOPMENT:BRYAN ROAD & OLD GRIFFIN PLAN	2025-09-12 01:06:46.806	2025-09-12 01:06:46.806
cmfg503s4003fovbozk1jx1zv	AMERICA ENGINEERING AND DEVELOPMENT:COCONUT CREEK CASINO	2025-09-12 01:06:46.949	2025-09-12 01:06:46.949
cmfg503u4003govbo7yq2sv67	AMERICA ENGINEERING AND DEVELOPMENT:DR PEPPER	2025-09-12 01:06:47.021	2025-09-12 01:06:47.021
cmfg503wa003hovbo3yd14s9c	AMERICA ENGINEERING AND DEVELOPMENT:FAU	2025-09-12 01:06:47.098	2025-09-12 01:06:47.098
cmfg503yc003iovbokf9cbks5	AMERICA ENGINEERING AND DEVELOPMENT:JACKSON SOUTH	2025-09-12 01:06:47.172	2025-09-12 01:06:47.172
cmfg5040c003jovboqnut0qt5	AMERICA ENGINEERING AND DEVELOPMENT:Job 1	2025-09-12 01:06:47.245	2025-09-12 01:06:47.245
cmfg5042c003kovbofxzfftr1	AMERICA ENGINEERING AND DEVELOPMENT:LYONS ROAD	2025-09-12 01:06:47.316	2025-09-12 01:06:47.316
cmfg5044g003lovbofrkh0krz	AMERICA ENGINEERING AND DEVELOPMENT:MARINE HARVEST @ MEDLEY	2025-09-12 01:06:47.393	2025-09-12 01:06:47.393
cmfg5046k003movbobt3xs90k	AMERICA ENGINEERING AND DEVELOPMENT:MIDPOINT MIAMI	2025-09-12 01:06:47.468	2025-09-12 01:06:47.468
cmfg5048j003novbo213wntz6	AMERICA ENGINEERING AND DEVELOPMENT:PORT OF MIAMI	2025-09-12 01:06:47.54	2025-09-12 01:06:47.54
cmfg504ak003oovbor2qpbbdk	AMERICA ENGINEERING AND DEVELOPMENT:WALMART - DAVIE	2025-09-12 01:06:47.612	2025-09-12 01:06:47.612
cmfg504cj003povboj2jqsv69	AMERICA ENGINEERING AND DEVELOPMENT:WALMART. FRT LAUDERDALE	2025-09-12 01:06:47.684	2025-09-12 01:06:47.684
cmfg504ek003qovbotubrv0zt	AMERICAN ASPHALT EQUIPMENT CORP	2025-09-12 01:06:47.756	2025-09-12 01:06:47.756
cmfg504gn003rovbo9t2o8pr5	AMERICAN EMPIRE BUILDER	2025-09-12 01:06:47.832	2025-09-12 01:06:47.832
cmfg504io003sovbo0g56m4cv	AMERICAN FARGO	2025-09-12 01:06:47.905	2025-09-12 01:06:47.905
cmfg504kn003tovbomq0eafn1	AMERICAN GROUP ADVISORS, LLC	2025-09-12 01:06:47.975	2025-09-12 01:06:47.975
cmfg504mo003uovbo3pdhw4n3	AMERICAN PIPELINE CONSTRUCTION, LLC	2025-09-12 01:06:48.049	2025-09-12 01:06:48.049
cmfg504ox003vovbopl2dtsvc	AMERICAN PROPERTY MANAGEMENT SPECIALISTS	2025-09-12 01:06:48.129	2025-09-12 01:06:48.129
cmfg504qz003wovbo42ufouw6	AMERICAN VET	2025-09-12 01:06:48.203	2025-09-12 01:06:48.203
cmfg504sz003xovbobqw3e8k7	AMERICAN VILLAGE TRAILOR PARK	2025-09-12 01:06:48.275	2025-09-12 01:06:48.275
cmfg504uy003yovbow9ojzb6m	AMERICAN WINGS, INC.	2025-09-12 01:06:48.347	2025-09-12 01:06:48.347
cmfg504wz003zovbob20wxd3a	AMERICANA VILLAGE	2025-09-12 01:06:48.42	2025-09-12 01:06:48.42
cmfg504z50040ovboj302rful	AMERICANA VILLAGES	2025-09-12 01:06:48.497	2025-09-12 01:06:48.497
cmfg505190041ovboy2zpaacj	AMERICARIBE, LLC	2025-09-12 01:06:48.574	2025-09-12 01:06:48.574
cmfg505390042ovbo2umwpp7u	AMERICAS PROPERTY MANAGEMENT	2025-09-12 01:06:48.645	2025-09-12 01:06:48.645
cmfg5055a0043ovbo55u3db1l	AMERICAS PROPERTY MANAGEMENT CORP.	2025-09-12 01:06:48.718	2025-09-12 01:06:48.718
cmfg505790044ovbo2ojl27ya	AMG GLOBAL DISTRIBUTION INC	2025-09-12 01:06:48.789	2025-09-12 01:06:48.789
cmfg505990045ovbo14tcd0ac	AMICON	2025-09-12 01:06:48.862	2025-09-12 01:06:48.862
cmfg505ba0046ovbolo39pxkt	AMP 11 - NARANJA AND ARTHUR MAYS VILLAGE	2025-09-12 01:06:48.934	2025-09-12 01:06:48.934
cmfg505da0047ovbovs4yd91z	AMR MEDICS	2025-09-12 01:06:49.006	2025-09-12 01:06:49.006
cmfg505fd0048ovbofc84un89	AMROAD	2025-09-12 01:06:49.081	2025-09-12 01:06:49.081
cmfg505hc0049ovbo765lz2rb	AMTRACK	2025-09-12 01:06:49.153	2025-09-12 01:06:49.153
cmfg505jc004aovbov2bweot6	AMY PRETZY	2025-09-12 01:06:49.225	2025-09-12 01:06:49.225
cmfg505ld004bovbo2pv99jgl	ANATOLIA CONSTRUCTION	2025-09-12 01:06:49.298	2025-09-12 01:06:49.298
cmfg505nd004covbo4mo80vg1	ANCHOR FENCE WHOLESALERS OF MIAMI	2025-09-12 01:06:49.369	2025-09-12 01:06:49.369
cmfg505ph004dovbo468segag	ANDALE GROUP	2025-09-12 01:06:49.446	2025-09-12 01:06:49.446
cmfg505rh004eovbos2deoa7b	ANDES CONSTRUCTION GROUP, INC	2025-09-12 01:06:49.517	2025-09-12 01:06:49.517
cmfg505tk004fovboolb5qdpl	ANDREA GRAY	2025-09-12 01:06:49.593	2025-09-12 01:06:49.593
cmfg505vi004govbohco85k5d	ANDREW RICHARDS	2025-09-12 01:06:49.663	2025-09-12 01:06:49.663
cmfg505xi004hovbohi32gkdv	ANDY JOHNSON	2025-09-12 01:06:49.735	2025-09-12 01:06:49.735
cmfg505zi004iovbohnrv34mg	ANGELA POWELL	2025-09-12 01:06:49.807	2025-09-12 01:06:49.807
cmfg5061j004jovboj9lzv3xd	ANNA BERCK	2025-09-12 01:06:49.879	2025-09-12 01:06:49.879
cmfg5063j004kovbo9ng8d82r	ANNISS NAANAA	2025-09-12 01:06:49.952	2025-09-12 01:06:49.952
cmfg5065j004lovboxkvm38lf	ANOTHER GARAGE DOOR & GATES	2025-09-12 01:06:50.023	2025-09-12 01:06:50.023
cmfg5067i004movboz0w078ij	ANTONIO RODRIGUEZ	2025-09-12 01:06:50.095	2025-09-12 01:06:50.095
cmfg5069i004novbo41iwovu5	ANWIL CORP.	2025-09-12 01:06:50.167	2025-09-12 01:06:50.167
cmfg506bj004oovbof8mrfa9o	ANYTIME GAS INVOICE	2025-09-12 01:06:50.24	2025-09-12 01:06:50.24
cmfg506dj004povbohckgfbn0	ANZAC CONTRACTORS, INC	2025-09-12 01:06:50.311	2025-09-12 01:06:50.311
cmfg506fj004qovboei2eqls9	ANZAC CONTRACTORS, INC:EVERGLADES HOLIDAY PARK BRIDGE REPLACEME	2025-09-12 01:06:50.383	2025-09-12 01:06:50.383
cmfg506hn004rovboq12t5xyc	ANZAC CONTRACTORS, INC:MATER ACADEMY - PEDESTRAIN BRIDGE	2025-09-12 01:06:50.459	2025-09-12 01:06:50.459
cmfg506jn004sovbojkfsip4d	ANZAC CONTRACTORS, INC:UM Vechicular Bridge	2025-09-12 01:06:50.531	2025-09-12 01:06:50.531
cmfg506ll004tovbouyarttzg	AP FINISHING	2025-09-12 01:06:50.602	2025-09-12 01:06:50.602
cmfg506nn004uovbok9t4mv12	APEX TURNKEY CONSTRUCTION	2025-09-12 01:06:50.675	2025-09-12 01:06:50.675
cmfg506pr004vovbozvshgfe3	APMC CONSTRUCTION CORP.	2025-09-12 01:06:50.752	2025-09-12 01:06:50.752
cmfg506rr004wovbouylsyk2r	APP & C SERVICES-	2025-09-12 01:06:50.823	2025-09-12 01:06:50.823
cmfg506tr004xovbopkeln17r	APPC SERVICES	2025-09-12 01:06:50.895	2025-09-12 01:06:50.895
cmfg506vq004yovboequrt3oh	APRIL PROPERTIES LLC	2025-09-12 01:06:50.967	2025-09-12 01:06:50.967
cmfg506xs004zovbow21nbbid	AQUA MASTER ASSOCIATION	2025-09-12 01:06:51.04	2025-09-12 01:06:51.04
cmfg506zr0050ovbobidbwyfd	AQUATIC CENTRAL GROUP	2025-09-12 01:06:51.112	2025-09-12 01:06:51.112
cmfg5071w0051ovbon2okt9lb	ARAMARK	2025-09-12 01:06:51.189	2025-09-12 01:06:51.189
cmfg5073z0052ovbou1f7d8k0	ARAZOZA BROTHERS CORP.	2025-09-12 01:06:51.263	2025-09-12 01:06:51.263
cmfg5075z0053ovbonyuhlyiu	ARC FLORIDA	2025-09-12 01:06:51.335	2025-09-12 01:06:51.335
cmfg5077z0054ovbo5lx9i40w	ARCADIA CONDOS	2025-09-12 01:06:51.408	2025-09-12 01:06:51.408
cmfg507a00055ovboti7lg479	ARCHER WESTERN CONSTRUCTION , LLC	2025-09-12 01:06:51.48	2025-09-12 01:06:51.48
cmfg507c50056ovbouwzy43j4	ARCHER WESTERN CONSTRUCTION , LLC:Archer Western – de Moya Joint Venture	2025-09-12 01:06:51.558	2025-09-12 01:06:51.558
cmfg507eq0057ovboqan0e722	ARCHER WESTERN CONSTRUCTION , LLC:ARCHER WESTERN CONCRETE PLANT	2025-09-12 01:06:51.65	2025-09-12 01:06:51.65
cmfg507gm0058ovboc0nkxzcu	ARCHER WESTERN CONSTRUCTION , LLC:I-95 MATERIAL PRICE SCALATION	2025-09-12 01:06:51.718	2025-09-12 01:06:51.718
cmfg507il0059ovbop1pil244	ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - CONTRACT	2025-09-12 01:06:51.79	2025-09-12 01:06:51.79
cmfg507kl005aovboikgvj2y3	ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK	2025-09-12 01:06:51.862	2025-09-12 01:06:51.862
cmfg507mq005bovboqx2x0vb2	ARCHER WESTERN CONSTRUCTION , LLC:SR836/I395 BRIDGE - CONTRACT	2025-09-12 01:06:51.938	2025-09-12 01:06:51.938
cmfg507oq005covbo1uf30sdy	ARCHER WESTERN CONSTRUCTION , LLC:SR836/I395 BRIDGE - PO	2025-09-12 01:06:52.01	2025-09-12 01:06:52.01
cmfg507qp005dovbowz17kq7k	ARCHIMEDEAN ACADEMY	2025-09-12 01:06:52.082	2025-09-12 01:06:52.082
cmfg507sr005eovbowcyv8tqs	ARDURRA	2025-09-12 01:06:52.156	2025-09-12 01:06:52.156
cmfg507uu005fovboa6sv2ow1	ARELLANO CONSTRUCTION	2025-09-12 01:06:52.23	2025-09-12 01:06:52.23
cmfg507wu005govbognwwv02d	ARIES CONSTRUCTION	2025-09-12 01:06:52.303	2025-09-12 01:06:52.303
cmfg507yu005hovbog3xxhfrl	ARKEST	2025-09-12 01:06:52.374	2025-09-12 01:06:52.374
cmfg5080x005iovboljr0iyd6	ARKI CONSTRUCTION, INC.	2025-09-12 01:06:52.45	2025-09-12 01:06:52.45
cmfg5082z005jovbow4nzeq4j	ARKS DEVELOPMENT	2025-09-12 01:06:52.523	2025-09-12 01:06:52.523
cmfg50850005kovboi5k0lmvu	ARLETT BUILD	2025-09-12 01:06:52.597	2025-09-12 01:06:52.597
cmfg50870005lovbovudi32iy	ARMSTRONG FORD	2025-09-12 01:06:52.668	2025-09-12 01:06:52.668
cmfg5088z005movbomlee5w4l	ARNOLD DIAZ	2025-09-12 01:06:52.74	2025-09-12 01:06:52.74
cmfg508az005novbonm0ogcl0	ART FAIR INC	2025-09-12 01:06:52.811	2025-09-12 01:06:52.811
cmfg508d1005oovbo5jhcg0zt	ART FAIR INC.	2025-09-12 01:06:52.885	2025-09-12 01:06:52.885
cmfg508f5005povbordh29vyj	ART MIAMI LLC	2025-09-12 01:06:52.961	2025-09-12 01:06:52.961
cmfg508h8005qovbokt7yiz79	ARTEK OYAB	2025-09-12 01:06:53.037	2025-09-12 01:06:53.037
cmfg508j8005rovboq0svqq23	ARTEMISA FENCE	2025-09-12 01:06:53.108	2025-09-12 01:06:53.108
cmfg508l8005sovbotejtfbzy	ARTIFEX CORPORATION	2025-09-12 01:06:53.18	2025-09-12 01:06:53.18
cmfg508na005tovbo7wg0ju4n	ARTURO VELANDO	2025-09-12 01:06:53.255	2025-09-12 01:06:53.255
cmfg508pd005uovbo9qkrwutb	AS CONSRUCTION	2025-09-12 01:06:53.33	2025-09-12 01:06:53.33
cmfg508rd005vovbo11dmzihz	AS RECYCLES	2025-09-12 01:06:53.402	2025-09-12 01:06:53.402
cmfg508tc005wovbo0un9pgri	ASPEN HOME OWNERS ASSOCIATION	2025-09-12 01:06:53.472	2025-09-12 01:06:53.472
cmfg508vd005xovbov6ue5quz	ASPER CONSULTING	2025-09-12 01:06:53.545	2025-09-12 01:06:53.545
cmfg508xg005yovbo40ix7kz9	ASPHALT GROUP INC	2025-09-12 01:06:53.621	2025-09-12 01:06:53.621
cmfg508zh005zovboc8icycim	ASPHALT GROUP INC:E1U56	2025-09-12 01:06:53.694	2025-09-12 01:06:53.694
cmfg5092c0060ovbowuqmxoop	ASPHALT GROUP INC:E6N17	2025-09-12 01:06:53.797	2025-09-12 01:06:53.797
cmfg5094c0061ovbon3sv7lru	ASPHALT GROUP INC:E6N17 PO	2025-09-12 01:06:53.868	2025-09-12 01:06:53.868
cmfg5096b0062ovbog0ig0hxp	ASPHALT GROUP, INC	2025-09-12 01:06:53.94	2025-09-12 01:06:53.94
cmfg5098b0063ovbocp049afl	ASPHALT PAVING SPECIALIST	2025-09-12 01:06:54.011	2025-09-12 01:06:54.011
cmfg509ah0064ovboq6gzymj9	ASPHALT PAVING SYSTEMS, INC.	2025-09-12 01:06:54.089	2025-09-12 01:06:54.089
cmfg509cn0065ovboys2y0wkh	ASPIRA OF FLORIDA, INC	2025-09-12 01:06:54.167	2025-09-12 01:06:54.167
cmfg509f30066ovbocmnqc4i2	ASSCIA SERVICES OF FLORIDA	2025-09-12 01:06:54.255	2025-09-12 01:06:54.255
cmfg509h50067ovbomc8lf2q2	ASSOCIATE MACHINE	2025-09-12 01:06:54.329	2025-09-12 01:06:54.329
cmfg509j50068ovboylx8u7zh	ASSOCIATED CRAFTSMEN OF AMERICA, INC	2025-09-12 01:06:54.401	2025-09-12 01:06:54.401
cmfg509l40069ovbopd8j3287	ASSOCIATED SEAL AND COATING	2025-09-12 01:06:54.473	2025-09-12 01:06:54.473
cmfg509n5006aovbojepi20iv	ASTALDI CONSTRUCTION CORP	2025-09-12 01:06:54.546	2025-09-12 01:06:54.546
cmfg509p6006bovbo0qzb4xqj	ASTALDI CONSTRUCTION CORP:BEACHLINE - ORLANDO/WASTON CIVIL	2025-09-12 01:06:54.619	2025-09-12 01:06:54.619
cmfg509r9006covboq2gcjsxj	ASTALDI CONSTRUCTION CORP:NW 25 ST	2025-09-12 01:06:54.694	2025-09-12 01:06:54.694
cmfg509te006dovbople7r6on	ASTALDI CONSTRUCTION CORP:SPANISH RIVER	2025-09-12 01:06:54.77	2025-09-12 01:06:54.77
cmfg509vh006eovbohltdi23o	ASTALDI CONSTRUCTION CORP:SPANISH RIVER PO WORK	2025-09-12 01:06:54.846	2025-09-12 01:06:54.846
cmfg509xd006fovboyih53jqh	ASTRA	2025-09-12 01:06:54.913	2025-09-12 01:06:54.913
cmfg509zz006govbogvpswhmm	ATECO	2025-09-12 01:06:55.008	2025-09-12 01:06:55.008
cmfg50a25006hovbotpmhp635	ATLANTIC ARCHITECTUAL	2025-09-12 01:06:55.085	2025-09-12 01:06:55.085
cmfg50a49006iovboa5ywj7o3	ATLANTIC CIVIL	2025-09-12 01:06:55.161	2025-09-12 01:06:55.161
cmfg50a6m006jovboweqq6uop	ATLANTIC CONSTRUCTION & DEVELOPMENT	2025-09-12 01:06:55.246	2025-09-12 01:06:55.246
cmfg50a8q006kovboy09sil8y	ATLANTIC CRYSTAL CONSTRUCTION	2025-09-12 01:06:55.322	2025-09-12 01:06:55.322
cmfg50aau006lovbopzgkb8kk	ATLAS PACKAGING & DISPLAYS	2025-09-12 01:06:55.399	2025-09-12 01:06:55.399
cmfg50acv006movbo09f8t4ja	ATLAS RAILROAD CONSTRUCTION CO.	2025-09-12 01:06:55.471	2025-09-12 01:06:55.471
cmfg50aeu006novbovvytaygf	AUDIO LOUNGE, LLC.	2025-09-12 01:06:55.543	2025-09-12 01:06:55.543
cmfg50agt006oovbomadnul3m	AUERBACH ASSOCIATES INC.	2025-09-12 01:06:55.613	2025-09-12 01:06:55.613
cmfg50aio006povbohpi60by7	AUGUSTINE SAAVEDRA	2025-09-12 01:06:55.68	2025-09-12 01:06:55.68
cmfg50akt006qovboq4nre9ze	AUM CONSTRUCTION, INC	2025-09-12 01:06:55.757	2025-09-12 01:06:55.757
cmfg50amx006rovbotew8i4yj	AURELIO MATOS-	2025-09-12 01:06:55.834	2025-09-12 01:06:55.834
cmfg50ap0006sovbobn5tdt8b	AUTHENTIC CONSTRUCTION	2025-09-12 01:06:55.908	2025-09-12 01:06:55.908
cmfg50ar0006tovbozud7fjca	AUTO STAR CREDIT CORP.	2025-09-12 01:06:55.98	2025-09-12 01:06:55.98
cmfg50at9006uovbo1do9tmmp	AVANT CONST.	2025-09-12 01:06:56.062	2025-09-12 01:06:56.062
cmfg50avd006vovboiiu02yxp	AVILA GLAZING	2025-09-12 01:06:56.138	2025-09-12 01:06:56.138
cmfg50axi006wovbo575dmerh	AVISON YOUNG	2025-09-12 01:06:56.214	2025-09-12 01:06:56.214
cmfg50azi006xovbojeym18tf	AWL PHASE ENTERPRISES, INC	2025-09-12 01:06:56.286	2025-09-12 01:06:56.286
cmfg50b1i006yovbosuc1yfwu	AWNING WAY PRODUCTION	2025-09-12 01:06:56.358	2025-09-12 01:06:56.358
cmfg50b3m006zovbof8h5538d	B-LINE CONSTRUCTION, INC.	2025-09-12 01:06:56.434	2025-09-12 01:06:56.434
cmfg50b5n0070ovboy0cnkb1f	B-STONE LANDSCAPING	2025-09-12 01:06:56.507	2025-09-12 01:06:56.507
cmfg50b7m0071ovbomz1cgdp7	B & B EQUIPMENT SERVICES, INC	2025-09-12 01:06:56.578	2025-09-12 01:06:56.578
cmfg50b9q0072ovborijv9ijz	B2 CONSTRUCTION MANAGEMENT GROUP.	2025-09-12 01:06:56.655	2025-09-12 01:06:56.655
cmfg50bbq0073ovbo3yyzceex	BACALLALO CONSTRUCTION AND ENGINEERING	2025-09-12 01:06:56.726	2025-09-12 01:06:56.726
cmfg50bdu0074ovboyvatfz5y	BACHILLER IRON WORKS	2025-09-12 01:06:56.802	2025-09-12 01:06:56.802
cmfg50bgu0075ovbo7ts2nu0e	BAHAMAS UPHOLESTRY	2025-09-12 01:06:56.876	2025-09-12 01:06:56.876
cmfg50biv0076ovbocscpo4k1	BAHIA BISCAYNE	2025-09-12 01:06:56.983	2025-09-12 01:06:56.983
cmfg50bkv0077ovbog3b72zfi	BAKER'S BAY GOLF & OCEAN CLUB	2025-09-12 01:06:57.055	2025-09-12 01:06:57.055
cmfg50bmx0078ovborz67e3et	BAL HARBOUR	2025-09-12 01:06:57.129	2025-09-12 01:06:57.129
cmfg50box0079ovbovus6c16i	BALFOUR BEATTY CONSTRUCTION	2025-09-12 01:06:57.201	2025-09-12 01:06:57.201
cmfg50bqw007aovboqorpoamx	BALFOUR BEATTY CONSTRUCTION:SOUTH DADE RANGE ROVER	2025-09-12 01:06:57.272	2025-09-12 01:06:57.272
cmfg50bsw007bovbopus8gepw	BALFOUR BEATTY CONSTRUCTION:TOLL BROTHERS UNIVERSITY	2025-09-12 01:06:57.344	2025-09-12 01:06:57.344
cmfg50buv007covboasb1xw6x	BALL PARK MAINTNANCE, INC.	2025-09-12 01:06:57.416	2025-09-12 01:06:57.416
cmfg50bww007dovboc3vpznoc	BALMORAL CONDOMINIUM ASSOCIATION	2025-09-12 01:06:57.488	2025-09-12 01:06:57.488
cmfg50byw007eovbof9omlh7t	BALTIMORE ORIOLES	2025-09-12 01:06:57.561	2025-09-12 01:06:57.561
cmfg50c11007fovboe1kdpf92	BAPTIST HOSPITAL	2025-09-12 01:06:57.637	2025-09-12 01:06:57.637
cmfg50c2v007govbouhkevcal	BARBARITA	2025-09-12 01:06:57.704	2025-09-12 01:06:57.704
cmfg50c4y007hovbo17p4v8ss	Barcelona Apartments	2025-09-12 01:06:57.778	2025-09-12 01:06:57.778
cmfg50c75007iovbocewarvnq	BASS PRO SHOPS	2025-09-12 01:06:57.857	2025-09-12 01:06:57.857
cmfg50c95007jovbow4qd1k5w	BAXTER CONSTRUCTION	2025-09-12 01:06:57.929	2025-09-12 01:06:57.929
cmfg50cb5007kovboy4wxh41e	BAY HARBOUR INVESTMENT INC	2025-09-12 01:06:58.001	2025-09-12 01:06:58.001
cmfg50cd5007lovbo6u5sfyxw	BAY PARK TOWERS	2025-09-12 01:06:58.073	2025-09-12 01:06:58.073
cmfg50cf8007movboy4nrt0j9	BAY POINT ASSOCIATION	2025-09-12 01:06:58.149	2025-09-12 01:06:58.149
cmfg50chd007novboyago9rsv	BAYHARBOUR 1/ AM DEVELOPERS	2025-09-12 01:06:58.225	2025-09-12 01:06:58.225
cmfg50cjg007oovbouiybpwbh	BAYSHORE CONSTRUCTION GROUP, LLC	2025-09-12 01:06:58.3	2025-09-12 01:06:58.3
cmfg50clw007povbogprlpmge	BAZANJ CONSTRUCTION.	2025-09-12 01:06:58.388	2025-09-12 01:06:58.388
cmfg50cnv007qovbo4oad70ai	BCB	2025-09-12 01:06:58.459	2025-09-12 01:06:58.459
cmfg50cpv007rovbo0olhrlco	BCI	2025-09-12 01:06:58.531	2025-09-12 01:06:58.531
cmfg50crp007sovbopa9rkjv6	BDC CONSTRUCTION	2025-09-12 01:06:58.598	2025-09-12 01:06:58.598
cmfg50ctn007tovbodnusqghi	BE & K BUILDING GROUP	2025-09-12 01:06:58.667	2025-09-12 01:06:58.667
cmfg50cvo007uovbon8wt1xmy	BEACH COLONY CONDO	2025-09-12 01:06:58.741	2025-09-12 01:06:58.741
cmfg50cxq007vovbo94pyxgao	BEACH FRONT REALTY INC.	2025-09-12 01:06:58.815	2025-09-12 01:06:58.815
cmfg50czq007wovboe9kam8r3	BEACON HARBOUR	2025-09-12 01:06:58.886	2025-09-12 01:06:58.886
cmfg50d1q007xovbohioqglcr	BEAUCHAMP CONSTRUCTION CO.	2025-09-12 01:06:58.958	2025-09-12 01:06:58.958
cmfg50d3r007yovbogoyuukdf	BEC GROUP	2025-09-12 01:06:59.031	2025-09-12 01:06:59.031
cmfg50d5q007zovboe8y1ds9c	BECKMAN COULTER	2025-09-12 01:06:59.103	2025-09-12 01:06:59.103
cmfg50d7r0080ovbonaiwgiwg	BELEN ELEMENTARY	2025-09-12 01:06:59.175	2025-09-12 01:06:59.175
cmfg50d9q0081ovboede85n0e	BELLA CONSTRUCTION	2025-09-12 01:06:59.246	2025-09-12 01:06:59.246
cmfg50dbp0082ovbot9vxs4vk	BENTLY COMPANIES	2025-09-12 01:06:59.318	2025-09-12 01:06:59.318
cmfg50ddq0083ovbo99829ont	BERGERON LAND DEVELOPMENT, INC.	2025-09-12 01:06:59.39	2025-09-12 01:06:59.39
cmfg50dfp0084ovbotydeeugm	BERMAN GROUP	2025-09-12 01:06:59.462	2025-09-12 01:06:59.462
cmfg50dhq0085ovboxj5fl5ts	BERNADINO BROTHERS	2025-09-12 01:06:59.534	2025-09-12 01:06:59.534
cmfg50djp0086ovbomtlbjg89	BERNADO CAMPOS PROPERTIES	2025-09-12 01:06:59.605	2025-09-12 01:06:59.605
cmfg50dlp0087ovbot3k25u75	BERNIE	2025-09-12 01:06:59.677	2025-09-12 01:06:59.677
cmfg50dno0088ovbodtoiqz25	BERTLING	2025-09-12 01:06:59.749	2025-09-12 01:06:59.749
cmfg50dpo0089ovbo060vts32	BF GROUP LLC	2025-09-12 01:06:59.82	2025-09-12 01:06:59.82
cmfg50drq008aovboefecwdd9	BG GROUP	2025-09-12 01:06:59.894	2025-09-12 01:06:59.894
cmfg50dtp008bovbo870dhscy	BGW DESIGN	2025-09-12 01:06:59.966	2025-09-12 01:06:59.966
cmfg50dvt008covboh8jatpqs	BGW DESIGN LIMITED INC	2025-09-12 01:07:00.041	2025-09-12 01:07:00.041
cmfg50dz6008dovboearrk6e3	bgw desingn 21200 sw 147ave	2025-09-12 01:07:00.163	2025-09-12 01:07:00.163
cmfg50e1b008eovboorae2k87	BIG D ENGINEERING INC	2025-09-12 01:07:00.24	2025-09-12 01:07:00.24
cmfg50e3b008fovbo0s64m2se	BIG T DEVELOPMENT	2025-09-12 01:07:00.312	2025-09-12 01:07:00.312
cmfg50e5a008govbo670s2xaa	BILL POWELL	2025-09-12 01:07:00.383	2025-09-12 01:07:00.383
cmfg50e7b008hovbojttc8486	BILLMORE CONSTRUCTION	2025-09-12 01:07:00.455	2025-09-12 01:07:00.455
cmfg50e9f008iovbo3xilq2o4	BILTMORE CONSTRUCTION COMPANY CO, INC.	2025-09-12 01:07:00.531	2025-09-12 01:07:00.531
cmfg50ebh008jovbooor5kgu1	BILTMORE CONSTRUCTION COMPANY CO, INC.:FORT ZACHARY TAYLOR - KEY WEST	2025-09-12 01:07:00.605	2025-09-12 01:07:00.605
cmfg50edg008kovbod6xcjhk6	BILZIN SUMBERG	2025-09-12 01:07:00.676	2025-09-12 01:07:00.676
cmfg50efg008lovbo6mzwdp8q	BISCAYNE LANDING	2025-09-12 01:07:00.749	2025-09-12 01:07:00.749
cmfg50ehg008movbor3oyli8y	BJ & K CONSTRUCTION, INC.	2025-09-12 01:07:00.82	2025-09-12 01:07:00.82
cmfg50ejh008novbot8nsgbxw	BLAS ZACCARO	2025-09-12 01:07:00.894	2025-09-12 01:07:00.894
cmfg50ell008oovbo2tl7t2zs	BLDM USA, LLC	2025-09-12 01:07:00.97	2025-09-12 01:07:00.97
cmfg50enm008povbooms9tu8l	BLESSED TRINITY SCHOOL	2025-09-12 01:07:01.042	2025-09-12 01:07:01.042
cmfg50epl008qovboclogdl5e	BLUE HOUSE REPAIR	2025-09-12 01:07:01.113	2025-09-12 01:07:01.113
cmfg50es7008rovbomvlqqrdp	BLUE LAGOON ASSOC.	2025-09-12 01:07:01.208	2025-09-12 01:07:01.208
cmfg50eu9008sovbo2thjalw5	BLUE LEAF LLC	2025-09-12 01:07:01.281	2025-09-12 01:07:01.281
cmfg50ewc008tovbowta9bz8c	BLUE SKY	2025-09-12 01:07:01.357	2025-09-12 01:07:01.357
cmfg50eye008uovbolgigytvw	BLUE STREAK LLC INC	2025-09-12 01:07:01.43	2025-09-12 01:07:01.43
cmfg50f0g008vovboo76d0pah	BLUE WATER ENGINEERING AND DEVELOPMENT-	2025-09-12 01:07:01.504	2025-09-12 01:07:01.504
cmfg50f2f008wovbo927p97v2	BLUEWATER ENGINEERING AND DEVELOPMENT	2025-09-12 01:07:01.576	2025-09-12 01:07:01.576
cmfg50f4i008xovbo0bivdmsb	BMA	2025-09-12 01:07:01.65	2025-09-12 01:07:01.65
cmfg50f6h008yovbotdctb4o3	BOB LIBERO	2025-09-12 01:07:01.721	2025-09-12 01:07:01.721
cmfg50f8l008zovbo9ekbut6j	BOBS BARRICADES	2025-09-12 01:07:01.797	2025-09-12 01:07:01.797
cmfg50fak0090ovbogoez9liw	BOMBARDIER -OPA LOCKA	2025-09-12 01:07:01.869	2025-09-12 01:07:01.869
cmfg50fck0091ovbotl9mivba	BOMBARDIER SERVICE CENTER-	2025-09-12 01:07:01.94	2025-09-12 01:07:01.94
cmfg50fek0092ovbopb0drxlg	BONAVENTURE SPA & RESORT	2025-09-12 01:07:02.012	2025-09-12 01:07:02.012
cmfg50fgk0093ovbomuqx4y6c	BONY	2025-09-12 01:07:02.085	2025-09-12 01:07:02.085
cmfg50fip0094ovbotl61jrrk	BORAN CRAIG BARBER	2025-09-12 01:07:02.161	2025-09-12 01:07:02.161
cmfg50fkt0095ovbo6zy943l6	BOS TRANSPORT	2025-09-12 01:07:02.237	2025-09-12 01:07:02.237
cmfg50fms0096ovbo8krhxg6l	BOULEVARD MANOR NURSING & REHAB CENTER	2025-09-12 01:07:02.309	2025-09-12 01:07:02.309
cmfg50fos0097ovboafqtyy8w	BOUYGUES CIVIL WORKS FLORIDA	2025-09-12 01:07:02.38	2025-09-12 01:07:02.38
cmfg50fqs0098ovboopphk70a	BOVIS LEND LEASE	2025-09-12 01:07:02.453	2025-09-12 01:07:02.453
cmfg50fsy0099ovbok1ffz5ob	BP GAS STATION	2025-09-12 01:07:02.53	2025-09-12 01:07:02.53
cmfg50fux009aovbososxn4z0	BRAD GOLDWIN	2025-09-12 01:07:02.602	2025-09-12 01:07:02.602
cmfg50fx1009bovbob2lyuacc	BRADCO ROOFIMG SUPPLY	2025-09-12 01:07:02.677	2025-09-12 01:07:02.677
cmfg50fz1009covbo901uq6bi	BRADCO ROOFING	2025-09-12 01:07:02.749	2025-09-12 01:07:02.749
cmfg50g10009dovbovz00zbse	BRADCO ROOFING SUPPLY	2025-09-12 01:07:02.821	2025-09-12 01:07:02.821
cmfg50g32009eovboqu5ko8t2	BRADCO SUPPLY	2025-09-12 01:07:02.894	2025-09-12 01:07:02.894
cmfg50g51009fovbo3nl3tnnd	BRANDON DEVELOPMENT ENTERPRISES	2025-09-12 01:07:02.965	2025-09-12 01:07:02.965
cmfg50g72009govbo2qsyrj8r	BRASFIELD & GORRIE COSNTRUCTION	2025-09-12 01:07:03.039	2025-09-12 01:07:03.039
cmfg50g95009hovbonpff6y7r	BREAKSTONE CONSTRUCTION COMP.	2025-09-12 01:07:03.113	2025-09-12 01:07:03.113
cmfg50gbe009iovbo0mwi5h79	BRENDA NIEBORSKY	2025-09-12 01:07:03.194	2025-09-12 01:07:03.194
cmfg50gde009jovboektxmy4t	BRENT	2025-09-12 01:07:03.267	2025-09-12 01:07:03.267
cmfg50gfi009kovbox8rtafvp	BRIAN GROSSMAN	2025-09-12 01:07:03.343	2025-09-12 01:07:03.343
cmfg50ghe009lovbovjk9pk89	BRIAN KREIS	2025-09-12 01:07:03.41	2025-09-12 01:07:03.41
cmfg50gje009movbo34n9hhvn	BRIANA	2025-09-12 01:07:03.482	2025-09-12 01:07:03.482
cmfg50glf009novbou372ro1g	BRICKEL FOREST	2025-09-12 01:07:03.555	2025-09-12 01:07:03.555
cmfg50gnf009oovboayebc9ww	BRIDGE CAPITAL	2025-09-12 01:07:03.627	2025-09-12 01:07:03.627
cmfg50gpf009povbo22j573r1	BRIDGE HOUSE	2025-09-12 01:07:03.699	2025-09-12 01:07:03.699
cmfg50gre009qovboxfrmwxj1	BRIDGERCONWAY LLC	2025-09-12 01:07:03.77	2025-09-12 01:07:03.77
cmfg50gtf009rovbo5go3ld0t	BRIGHT STAR CORP.	2025-09-12 01:07:03.844	2025-09-12 01:07:03.844
cmfg50gvk009sovboylrczkxh	BRINGER	2025-09-12 01:07:03.92	2025-09-12 01:07:03.92
cmfg50gxk009tovbo9wr8drwc	BRODSON CONSTRUCTION, INC.	2025-09-12 01:07:03.992	2025-09-12 01:07:03.992
cmfg50gzx009uovbo8a6e0qnz	BRODSON CONSTRUCTION, INC.:2108 NORTH BAY RD	2025-09-12 01:07:04.078	2025-09-12 01:07:04.078
cmfg50h22009vovboo13aw5dh	BRODSON CONSTRUCTION, INC.:2581 LAKE AVE	2025-09-12 01:07:04.155	2025-09-12 01:07:04.155
cmfg50h41009wovbox4m5cup9	BRODSON CONSTRUCTION, INC.:28 STAR	2025-09-12 01:07:04.225	2025-09-12 01:07:04.225
cmfg50h65009xovboishxxda3	BRODSON LUXURY HOMES	2025-09-12 01:07:04.301	2025-09-12 01:07:04.301
cmfg50h87009yovbo1t2uyv96	BROOKS RANGE CONTRACT SERVICE	2025-09-12 01:07:04.375	2025-09-12 01:07:04.375
cmfg50ha8009zovbo8y5h5rdc	BROWARD - PUBLIC WORKS DEPT.	2025-09-12 01:07:04.448	2025-09-12 01:07:04.448
cmfg50hcc00a0ovbotcr1g1q2	BROWARD INTERNATIONAL COMMERCE CENTER	2025-09-12 01:07:04.525	2025-09-12 01:07:04.525
cmfg50hed00a1ovbow5bpiz2k	BROWARD REGIONAL JUVENILLE DETENTION CENT	2025-09-12 01:07:04.597	2025-09-12 01:07:04.597
cmfg50hgl00a2ovbo4esxefg7	BROWNSVILLE TRANSIT VILLAGE	2025-09-12 01:07:04.678	2025-09-12 01:07:04.678
cmfg50hil00a3ovboupatcvfh	BRYAN GROSMAN, ESQ.	2025-09-12 01:07:04.749	2025-09-12 01:07:04.749
cmfg50hkh00a4ovbopthyb4o5	BRYCOR HOLDINGS LLC	2025-09-12 01:07:04.817	2025-09-12 01:07:04.817
cmfg50hml00a5ovbo58898d6b	BUDGET CONSTRUCTION	2025-09-12 01:07:04.894	2025-09-12 01:07:04.894
cmfg50hoh00a6ovbohi953n9k	BUDGET TRUCK RENTAL	2025-09-12 01:07:04.961	2025-09-12 01:07:04.961
cmfg50hqg00a7ovbodc7vp3ht	BUILD BY OWNER	2025-09-12 01:07:05.032	2025-09-12 01:07:05.032
cmfg50hsf00a8ovbobwxfltit	BUILD WITH NOVA CM	2025-09-12 01:07:05.103	2025-09-12 01:07:05.103
cmfg50huo00a9ovbo0ymy3dcb	BUILDING PLANS, INC	2025-09-12 01:07:05.184	2025-09-12 01:07:05.184
cmfg50hwn00aaovbo04zccvzx	BUILT BY OWNER	2025-09-12 01:07:05.255	2025-09-12 01:07:05.255
cmfg50hyn00abovboo5aesabq	BULK EXPRESS TRANSPORT	2025-09-12 01:07:05.328	2025-09-12 01:07:05.328
cmfg50i0m00acovbovq7mjgzb	BUNNELL FOUNDATION	2025-09-12 01:07:05.399	2025-09-12 01:07:05.399
cmfg50i2n00adovboaach85z2	BURGESS LIMITED PARTNERSHIP	2025-09-12 01:07:05.472	2025-09-12 01:07:05.472
cmfg50i4m00aeovboxd48bbz9	BURKE CONSTRUCTION GROUP, INC.	2025-09-12 01:07:05.543	2025-09-12 01:07:05.543
cmfg50i6n00afovbo3h6jfhd5	BUTTERS CONSTRUCTION AND DEVELOPMENT	2025-09-12 01:07:05.615	2025-09-12 01:07:05.615
cmfg50i8l00agovbomshygqqy	BYRON AT THE BEACH	2025-09-12 01:07:05.686	2025-09-12 01:07:05.686
cmfg50ial00ahovbo8q01f55f	C W CONSTRUCTION, INC.	2025-09-12 01:07:05.758	2025-09-12 01:07:05.758
cmfg50icc00aiovbokd48de6a	C.G.C CONSTRUCT GROPU CORP.	2025-09-12 01:07:05.821	2025-09-12 01:07:05.821
cmfg50iee00ajovboybwgbic9	C.G.C. CONSTRUCTION MANANGEMENT, INC	2025-09-12 01:07:05.894	2025-09-12 01:07:05.894
cmfg50igd00akovborxf4lm6e	C.L ELIAS CONSTRUCTION, INC	2025-09-12 01:07:05.966	2025-09-12 01:07:05.966
cmfg50iid00alovbon60gtwmv	C.S BROTHERS LLC	2025-09-12 01:07:06.037	2025-09-12 01:07:06.037
cmfg50ik900amovbosl1ubf89	C.W.R. CONTRACTING INC.	2025-09-12 01:07:06.105	2025-09-12 01:07:06.105
cmfg50im300anovbov2nsmfts	C3TS STANTEC	2025-09-12 01:07:06.172	2025-09-12 01:07:06.172
cmfg50inz00aoovboygese2h3	CABINET & GRANITE DEPOT	2025-09-12 01:07:06.24	2025-09-12 01:07:06.24
cmfg50ipu00apovboo1xve84v	CABLE CONNECTIONS AND UTILITIES	2025-09-12 01:07:06.307	2025-09-12 01:07:06.307
cmfg50irs00aqovbov09sed9f	CABLE WIZARD	2025-09-12 01:07:06.377	2025-09-12 01:07:06.377
cmfg50ito00arovbo89nx6wge	CAC 6850	2025-09-12 01:07:06.445	2025-09-12 01:07:06.445
cmfg50ivo00asovboa8a3z5oc	CALLEJA PROPERTIES	2025-09-12 01:07:06.516	2025-09-12 01:07:06.516
cmfg50iy400atovbok94mxi3z	CALTON SURPLUS	2025-09-12 01:07:06.604	2025-09-12 01:07:06.604
cmfg50j0f00auovbo6firvgur	CALUSA CAMPGROUND CONDO	2025-09-12 01:07:06.687	2025-09-12 01:07:06.687
cmfg50j2i00avovbobg2g5fj4	CAMCON	2025-09-12 01:07:06.763	2025-09-12 01:07:06.763
cmfg50j4n00awovbog71vqq76	CAMCON GROUP	2025-09-12 01:07:06.839	2025-09-12 01:07:06.839
cmfg50j6n00axovbo583sagio	CAMCON GROUP:BAPTIST HOSPITAL MAIN	2025-09-12 01:07:06.911	2025-09-12 01:07:06.911
cmfg50j8n00ayovboxl99i7x0	CAMCON GROUP:BHSF UCC - TEMP FENCE	2025-09-12 01:07:06.984	2025-09-12 01:07:06.984
cmfg50jan00azovbos8nlqa30	CAMEO APARTMENTS LTD.	2025-09-12 01:07:07.055	2025-09-12 01:07:07.055
cmfg50jcn00b0ovbougk2mnit	CAMILUS HOUSE	2025-09-12 01:07:07.127	2025-09-12 01:07:07.127
cmfg50jem00b1ovbo5o1l3coq	CAMPBELL ARMS APARTMENTS	2025-09-12 01:07:07.199	2025-09-12 01:07:07.199
cmfg50jhk00b2ovbokt0bqf96	CAMPUS CONSTRUCTION	2025-09-12 01:07:07.305	2025-09-12 01:07:07.305
cmfg50jjn00b3ovbof61p6lv7	CAPITAL BAR PROPERTIES	2025-09-12 01:07:07.379	2025-09-12 01:07:07.379
cmfg50jlm00b4ovbooycyrr52	CAPITAL BUILDERS GROUP	2025-09-12 01:07:07.45	2025-09-12 01:07:07.45
cmfg50jnn00b5ovboyd5xhxgw	CAPSOL	2025-09-12 01:07:07.523	2025-09-12 01:07:07.523
cmfg50jpl00b6ovbovxop5461	CAPTAIN HARRYS	2025-09-12 01:07:07.594	2025-09-12 01:07:07.594
cmfg50jsd00b7ovboh1d4uw8a	CARGO INTERNATIONAL	2025-09-12 01:07:07.693	2025-09-12 01:07:07.693
cmfg50ju900b8ovbopkm4ftgz	CARGO VENTURES	2025-09-12 01:07:07.761	2025-09-12 01:07:07.761
cmfg50jw300b9ovbobzr5q2hd	CARIB CONSTRUCTION	2025-09-12 01:07:07.828	2025-09-12 01:07:07.828
cmfg50jy300baovbo1rhp6osp	CARINA MOREE	2025-09-12 01:07:07.9	2025-09-12 01:07:07.9
cmfg50k0400bbovbop0081nbb	CARISLES DICKENS LLC	2025-09-12 01:07:07.972	2025-09-12 01:07:07.972
cmfg50k2l00bcovbom0gk612c	CARIVON CONSTRUCTION	2025-09-12 01:07:08.062	2025-09-12 01:07:08.062
cmfg50k4o00bdovbo2lz9kygc	CARIVON CONSTRUCTION-	2025-09-12 01:07:08.136	2025-09-12 01:07:08.136
cmfg50k6p00beovbo57d11wvk	CARLISLE DEVELOPMENT	2025-09-12 01:07:08.209	2025-09-12 01:07:08.209
cmfg50k8p00bfovbo8h6k42sc	CARLOS	2025-09-12 01:07:08.281	2025-09-12 01:07:08.281
cmfg50kb700bgovbo8wloz5r0	CARLOS R VALLE	2025-09-12 01:07:08.371	2025-09-12 01:07:08.371
cmfg50kd800bhovbonn0plkny	CARLOS CHIRINO	2025-09-12 01:07:08.444	2025-09-12 01:07:08.444
cmfg50kf900biovbocessu6s1	CARLOS CRUZ	2025-09-12 01:07:08.517	2025-09-12 01:07:08.517
cmfg50khd00bjovbo30pa8am0	CARLOS DA CRUZ	2025-09-12 01:07:08.593	2025-09-12 01:07:08.593
cmfg50kjb00bkovbo88e6xstb	CARLOS DUBON	2025-09-12 01:07:08.664	2025-09-12 01:07:08.664
cmfg50klb00blovbozryj56a5	CARLOS LOPEZ	2025-09-12 01:07:08.735	2025-09-12 01:07:08.735
cmfg50knb00bmovbo85vo0956	CARLOS RUIZ	2025-09-12 01:07:08.807	2025-09-12 01:07:08.807
cmfg50kpg00bnovbodyoldksp	CARLYLE DICKENS, LLC	2025-09-12 01:07:08.885	2025-09-12 01:07:08.885
cmfg50krg00boovbo961rr2az	CARMEN RODRIGUEZ	2025-09-12 01:07:08.957	2025-09-12 01:07:08.957
cmfg50ktl00bpovboiwjyyb4o	CARY CONSTRUCTION CORP.	2025-09-12 01:07:09.033	2025-09-12 01:07:09.033
cmfg50kvp00bqovbo00vvs6q1	CAS ENGINEERING CONTRACTORS	2025-09-12 01:07:09.109	2025-09-12 01:07:09.109
cmfg50kxt00brovbok8zt37he	CAST CONSTRUCTION	2025-09-12 01:07:09.185	2025-09-12 01:07:09.185
cmfg50kzu00bsovbo73i5cgba	CASTELLON SERVICES AND DEVELOPMENT ENGI	2025-09-12 01:07:09.258	2025-09-12 01:07:09.258
cmfg50l1t00btovboviwgf1jl	CASTLE GROUP	2025-09-12 01:07:09.329	2025-09-12 01:07:09.329
cmfg50l3t00buovboceorxofs	CATAMOUNT CONSTRUCTION INC	2025-09-12 01:07:09.401	2025-09-12 01:07:09.401
cmfg50l5t00bvovbow4dn1s9s	CAVU PROPERTIES LLP	2025-09-12 01:07:09.473	2025-09-12 01:07:09.473
cmfg50l7s00bwovbo5vjz5yq6	CBRE	2025-09-12 01:07:09.544	2025-09-12 01:07:09.544
cmfg50l9x00bxovbo7usxgr5b	CCD, Magna CM,	2025-09-12 01:07:09.622	2025-09-12 01:07:09.622
cmfg50lbx00byovbobkllmycx	CCK CONSTRUCTION	2025-09-12 01:07:09.693	2025-09-12 01:07:09.693
cmfg50ldx00bzovbon6donck8	CCU	2025-09-12 01:07:09.766	2025-09-12 01:07:09.766
cmfg50lg100c0ovboqv9qj7tl	CDD	2025-09-12 01:07:09.841	2025-09-12 01:07:09.841
cmfg50li100c1ovbofdxgzuxz	CDL SCHOOL	2025-09-12 01:07:09.913	2025-09-12 01:07:09.913
cmfg50lk000c2ovbowiahxrjh	CEASAR DEBECK	2025-09-12 01:07:09.985	2025-09-12 01:07:09.985
cmfg50lm200c3ovbo6wze4edq	CED - ELECTRICAL WHOLESALERS	2025-09-12 01:07:10.059	2025-09-12 01:07:10.059
cmfg50lob00c4ovbokg536zin	CEI CHEROKEE ENTERPRISES, INC	2025-09-12 01:07:10.139	2025-09-12 01:07:10.139
cmfg50lqc00c5ovbo7i465wai	CELTIC CONSTRUCTION INC.	2025-09-12 01:07:10.213	2025-09-12 01:07:10.213
cmfg50lsd00c6ovbo1yc6mdvs	CEMEX CONCRETE	2025-09-12 01:07:10.286	2025-09-12 01:07:10.286
cmfg50lui00c7ovboks4jukk8	CEMEXPRESS LLC	2025-09-12 01:07:10.363	2025-09-12 01:07:10.363
cmfg50lwj00c8ovbon4kna669	CENTERLINE	2025-09-12 01:07:10.435	2025-09-12 01:07:10.435
cmfg50lym00c9ovbo0uvappdp	CENTRAL CIVIL	2025-09-12 01:07:10.511	2025-09-12 01:07:10.511
cmfg50m0p00caovboxq6q2vuu	CENTRAL CIVIL:NDWWTP	2025-09-12 01:07:10.585	2025-09-12 01:07:10.585
cmfg50m2p00cbovboow2jrz7o	CENTRAL CIVIL:UNDERLINE PHASE 3-9	2025-09-12 01:07:10.658	2025-09-12 01:07:10.658
cmfg50m4q00ccovbo9m2k2he5	CENTRAL CIVIL:UNDERLINE PHASE 3-9 PO	2025-09-12 01:07:10.73	2025-09-12 01:07:10.73
cmfg50m6u00cdovbozuom8072	CENTRAL FLORIDA EQUIPMENT	2025-09-12 01:07:10.806	2025-09-12 01:07:10.806
cmfg50m8t00ceovbo60pzndfa	CENTRAL FLORIDA EQUIPMENT:HEFT - CAMPBELL DR	2025-09-12 01:07:10.877	2025-09-12 01:07:10.877
cmfg50mat00cfovbovb7akr1y	CENTRAL FLORIDA EQUIPMENT:HEFT - PO WORK	2025-09-12 01:07:10.949	2025-09-12 01:07:10.949
cmfg50mcx00cgovbor2yqmmyo	CENTRAL FLORIDA EQUIPMENT:MIA AIRPORT CENTRAL BASON	2025-09-12 01:07:11.025	2025-09-12 01:07:11.025
cmfg50mey00chovbotfruq6e1	CENTRAL FLORIDA EQUIPMENT:MIAMI CENTRAL BASE APRON	2025-09-12 01:07:11.098	2025-09-12 01:07:11.098
cmfg50mgx00ciovboxuv2rdfv	CENTRAL FLORIDA EQUIPMENT:NDWWTP S-967	2025-09-12 01:07:11.17	2025-09-12 01:07:11.17
cmfg50mis00cjovbo7hkgzngv	CENTRAL FLORIDA EQUIPMENT:T-6347 SR-7	2025-09-12 01:07:11.237	2025-09-12 01:07:11.237
cmfg50mks00ckovbolh3rj5h0	CENTRAL FLORIDA STEET SIGNS	2025-09-12 01:07:11.309	2025-09-12 01:07:11.309
cmfg50mmx00clovboh9r0t2ed	CENTRAL FLORIDA T6347	2025-09-12 01:07:11.385	2025-09-12 01:07:11.385
cmfg50mox00cmovboaqc3ddj5	CENTRAL PREBYSTERIAN CHUECH	2025-09-12 01:07:11.457	2025-09-12 01:07:11.457
cmfg50mr200cnovbo48t2ervo	CENTRAL TRASPORT	2025-09-12 01:07:11.534	2025-09-12 01:07:11.534
cmfg50mt600coovbo44p6s8ga	CENTRUM PROPERTIES	2025-09-12 01:07:11.61	2025-09-12 01:07:11.61
cmfg50mv600cpovbonhf421sf	CENTURY BUILDERS & ROOFING	2025-09-12 01:07:11.682	2025-09-12 01:07:11.682
cmfg50mx500cqovboet3vakdo	CENTURY INTERNATIONAL	2025-09-12 01:07:11.754	2025-09-12 01:07:11.754
cmfg50mz500crovbodex3vg3m	CENTURY STEEL FABRICATION	2025-09-12 01:07:11.825	2025-09-12 01:07:11.825
cmfg50n1700csovbosdg147b1	CEROS FENCE CORP	2025-09-12 01:07:11.899	2025-09-12 01:07:11.899
cmfg50n4b00ctovbo32s8wv3s	CERTIFIED CONTRACTING GROUP INC	2025-09-12 01:07:12.011	2025-09-12 01:07:12.011
cmfg50n6e00cuovbo1vmejtti	CES CONSULTANTS	2025-09-12 01:07:12.086	2025-09-12 01:07:12.086
cmfg50n8d00cvovbor207sqk9	CESAR NIETO	2025-09-12 01:07:12.158	2025-09-12 01:07:12.158
cmfg50nae00cwovbo8q8l78x3	CEV CONSTRUCTION	2025-09-12 01:07:12.231	2025-09-12 01:07:12.231
cmfg50nce00cxovbonhc2mftm	CFR	2025-09-12 01:07:12.303	2025-09-12 01:07:12.303
cmfg50ned00cyovbo2wddn26t	CG CHASE CONSTRUCTION	2025-09-12 01:07:12.374	2025-09-12 01:07:12.374
cmfg50ngd00czovbot8u3asyr	CG QUALITY WOODWORKS	2025-09-12 01:07:12.446	2025-09-12 01:07:12.446
cmfg50nie00d0ovbo2975i38b	CG SUNNY ISLES, LLC	2025-09-12 01:07:12.518	2025-09-12 01:07:12.518
cmfg50nke00d1ovbojkmw05tt	CHAPMAN PARTNERSHIP	2025-09-12 01:07:12.59	2025-09-12 01:07:12.59
cmfg50nme00d2ovbo5ixbup39	CHARLES GANNAWAY	2025-09-12 01:07:12.662	2025-09-12 01:07:12.662
cmfg50noe00d3ovbol9o2ur5f	CHARLEY TOPPINO & SONS, INC	2025-09-12 01:07:12.734	2025-09-12 01:07:12.734
cmfg50nqe00d4ovboalruvjcd	CHARTER BUS USA-	2025-09-12 01:07:12.806	2025-09-12 01:07:12.806
cmfg50nsd00d5ovbo5zbaepi1	CHARTER REALTY GROUP	2025-09-12 01:07:12.877	2025-09-12 01:07:12.877
cmfg50nud00d6ovbofgxobbwc	CHARTER REALTY GROUP/MIAMI OFFICE	2025-09-12 01:07:12.949	2025-09-12 01:07:12.949
cmfg50nxc00d7ovbot1gpvmkb	CHARTER REALTY/22 AVE APARTMENTS	2025-09-12 01:07:13.056	2025-09-12 01:07:13.056
cmfg50nze00d8ovboad8t8g6u	CHASE	2025-09-12 01:07:13.131	2025-09-12 01:07:13.131
cmfg50o1e00d9ovbo00tihm6y	CHASE CONSTRUCTION	2025-09-12 01:07:13.202	2025-09-12 01:07:13.202
cmfg50o3h00daovbol3zxdp6n	CHASE CONT	2025-09-12 01:07:13.277	2025-09-12 01:07:13.277
cmfg50o5h00dbovbo73qwry4z	CHAZ EQUIPMENT COMPANY	2025-09-12 01:07:13.349	2025-09-12 01:07:13.349
cmfg50o7h00dcovbob58lm7y0	CHC	2025-09-12 01:07:13.421	2025-09-12 01:07:13.421
cmfg50o9g00ddovbo6f8vr9wy	CHELLE CONSTRUCTION	2025-09-12 01:07:13.493	2025-09-12 01:07:13.493
cmfg50obg00deovboxashwr0y	CHENEY BROTHERS, INC	2025-09-12 01:07:13.564	2025-09-12 01:07:13.564
cmfg50odg00dfovbo1tkn0y6q	CHEROKEE ENTERPRISES, INC.	2025-09-12 01:07:13.637	2025-09-12 01:07:13.637
cmfg50ofh00dgovboq0puvrug	CHESAPEAKE BEACH RESORT	2025-09-12 01:07:13.71	2025-09-12 01:07:13.71
cmfg50ohm00dhovbol9uulp3l	CHI	2025-09-12 01:07:13.787	2025-09-12 01:07:13.787
cmfg50ojq00diovbomgfysbpo	CHICAGO PRODUCE	2025-09-12 01:07:13.863	2025-09-12 01:07:13.863
cmfg50olu00djovbov1tkgdnd	chin diesel inc.	2025-09-12 01:07:13.939	2025-09-12 01:07:13.939
cmfg50onu00dkovbo2625fol0	CHRIS YAMRAJ	2025-09-12 01:07:14.011	2025-09-12 01:07:14.011
cmfg50opt00dlovboyd8qiiiw	CHRISTIAN GARCIA	2025-09-12 01:07:14.082	2025-09-12 01:07:14.082
cmfg50ors00dmovbou33lel6p	CIOCCA CONTRACTION, INC.	2025-09-12 01:07:14.153	2025-09-12 01:07:14.153
cmfg50otu00dnovbobqczj6g0	CITY CONSTRUCTION GROUP, INC.	2025-09-12 01:07:14.227	2025-09-12 01:07:14.227
cmfg50ovz00doovbojku44p74	CITY OF BAL HARBOUR	2025-09-12 01:07:14.303	2025-09-12 01:07:14.303
cmfg50oxy00dpovbows1frbff	CITY OF COCONUT CREEK	2025-09-12 01:07:14.375	2025-09-12 01:07:14.375
cmfg50p0300dqovbo7dj0fxjs	CITY OF CORAL GABLES PUBLIC WORKS DEPT.	2025-09-12 01:07:14.451	2025-09-12 01:07:14.451
cmfg50p2600drovboluuf6wek	CITY OF CORAL SPRINGS	2025-09-12 01:07:14.526	2025-09-12 01:07:14.526
cmfg50p4600dsovboux8hf3ij	CITY OF DORAL.	2025-09-12 01:07:14.599	2025-09-12 01:07:14.599
cmfg50p6700dtovboxh7ltvvn	CITY OF FLORIDA CITY	2025-09-12 01:07:14.671	2025-09-12 01:07:14.671
cmfg50p8600duovbo4hrdb9p6	city of forida city	2025-09-12 01:07:14.743	2025-09-12 01:07:14.743
cmfg50pa700dvovbop95618hz	CITY OF FT LAUDERDALE	2025-09-12 01:07:14.815	2025-09-12 01:07:14.815
cmfg50pc600dwovbo3jrx0hyd	CITY OF HIALEAH / STREET DIVISION	2025-09-12 01:07:14.886	2025-09-12 01:07:14.886
cmfg50pe600dxovbosaz2whh5	CITY OF HIALEAH BUILDING DEPT.	2025-09-12 01:07:14.958	2025-09-12 01:07:14.958
cmfg50pg700dyovbo9pmwlfls	City of Hialeah Gardens	2025-09-12 01:07:15.032	2025-09-12 01:07:15.032
cmfg50pi600dzovbovt78kur0	CITY OF HIALEAH MAINTENANCE DEPT	2025-09-12 01:07:15.103	2025-09-12 01:07:15.103
cmfg50pkb00e0ovboz57e5b76	CITY OF HIALEAH/MAINTENANCE DEPARTMENT	2025-09-12 01:07:15.179	2025-09-12 01:07:15.179
cmfg50pma00e1ovbora788mcm	CITY OF HOLLYWOOD	2025-09-12 01:07:15.25	2025-09-12 01:07:15.25
cmfg50po500e2ovboox4os9ya	CITY OF HOLLYWOOD FL	2025-09-12 01:07:15.318	2025-09-12 01:07:15.318
cmfg50pq100e3ovbop237xbca	CITY OF HOMESTEAD POLICE	2025-09-12 01:07:15.385	2025-09-12 01:07:15.385
cmfg50ps200e4ovboaf3misbq	CITY OF HOMESTEAD.	2025-09-12 01:07:15.458	2025-09-12 01:07:15.458
cmfg50pu100e5ovboekjo1ual	CITY OF MIAMI BEACH	2025-09-12 01:07:15.53	2025-09-12 01:07:15.53
cmfg50pw200e6ovbolcvlncb3	CITY OF MIAMI BEACH FLEET	2025-09-12 01:07:15.603	2025-09-12 01:07:15.603
cmfg50py500e7ovboshj6r2j4	CITY OF MIAMI BEACH PROPERTY MANAGEMENT	2025-09-12 01:07:15.677	2025-09-12 01:07:15.677
cmfg50q0400e8ovbort13kg4a	CITY OF MIAMI BEACH PUBLIC WORKS DEP.	2025-09-12 01:07:15.749	2025-09-12 01:07:15.749
cmfg50q2100e9ovbow2ihbqfv	CITY OF MIAMI FL	2025-09-12 01:07:15.817	2025-09-12 01:07:15.817
cmfg50q4100eaovboeten6rom	CITY OF MIAMI SPRINGS	2025-09-12 01:07:15.889	2025-09-12 01:07:15.889
cmfg50q6a00ebovbodo8jo6ju	CITY OF MIRAMAR	2025-09-12 01:07:15.97	2025-09-12 01:07:15.97
cmfg50q8a00ecovbo65uml28j	CITY OF NORTH MIAMI BEACH	2025-09-12 01:07:16.042	2025-09-12 01:07:16.042
cmfg50qa500edovbonqmflc1n	CITY OF NORTH MIAMI BEACH PUBLIC SERVICE	2025-09-12 01:07:16.109	2025-09-12 01:07:16.109
cmfg50qc600eeovbog9oh3gcl	CITY OF OPA LOCKA PUBLIC WORKS	2025-09-12 01:07:16.182	2025-09-12 01:07:16.182
cmfg50qea00efovbodsxtke4u	CITY OF OPA LOCKA STREET DIVISION	2025-09-12 01:07:16.258	2025-09-12 01:07:16.258
cmfg50qga00egovbo9ehac32l	CITY OF PALMETO BAY	2025-09-12 01:07:16.33	2025-09-12 01:07:16.33
cmfg50qim00ehovboplqibrec	CITY OF PEMBROKE PARK	2025-09-12 01:07:16.415	2025-09-12 01:07:16.415
cmfg50qkh00eiovboq94h348l	CITY OF PEMBROKE PINES	2025-09-12 01:07:16.482	2025-09-12 01:07:16.482
cmfg50qmm00ejovboc5kwivml	City of Pembroke Pines Enviromental Dept.	2025-09-12 01:07:16.559	2025-09-12 01:07:16.559
cmfg50qoo00ekovboiolfnngn	CITY OF POMPANO BEACH	2025-09-12 01:07:16.632	2025-09-12 01:07:16.632
cmfg50qqn00elovbo8boaar57	CITY OF SUNNY ISLES BEACH-	2025-09-12 01:07:16.703	2025-09-12 01:07:16.703
cmfg50qsn00emovbozai25q4b	CITY OF WEST PARK	2025-09-12 01:07:16.775	2025-09-12 01:07:16.775
cmfg50quq00enovbob5jzts5x	CITY OFCITY OF DORAL - POLICE DEPARTMENT	2025-09-12 01:07:16.85	2025-09-12 01:07:16.85
cmfg50qwq00eoovbogkr4a190	CITY PARK	2025-09-12 01:07:16.922	2025-09-12 01:07:16.922
cmfg50qyq00epovboed5c40ey	CITYWORKS CONSTRUCTION LLC	2025-09-12 01:07:16.994	2025-09-12 01:07:16.994
cmfg50r0m00eqovbocc0zcmf7	CIVIC CONSTRUCTION COMPANY	2025-09-12 01:07:17.062	2025-09-12 01:07:17.062
cmfg50r2h00erovboihyn8jvz	CIVICA	2025-09-12 01:07:17.129	2025-09-12 01:07:17.129
cmfg50r4h00esovbo7wz7spao	CLARK CONSTRUCTION GROUP, LLC	2025-09-12 01:07:17.202	2025-09-12 01:07:17.202
cmfg50r6h00etovbo3mgvj6ik	CLARO DEVELOPMENT	2025-09-12 01:07:17.273	2025-09-12 01:07:17.273
cmfg50r8g00euovbogwzjat5p	CLEARVIEW CONDO & ASSOC.	2025-09-12 01:07:17.345	2025-09-12 01:07:17.345
cmfg50rae00evovboqyj2x6op	CLEAVELAND CONSTRUCTION INC	2025-09-12 01:07:17.415	2025-09-12 01:07:17.415
cmfg50rce00ewovbohp71q283	CLUB ATLANTIS	2025-09-12 01:07:17.486	2025-09-12 01:07:17.486
cmfg50rei00exovbo6az7ixkl	CMC DESIGN BUILD INC	2025-09-12 01:07:17.563	2025-09-12 01:07:17.563
cmfg50rgn00eyovboyzvzsf9v	CMF INTERNATIONAL	2025-09-12 01:07:17.639	2025-09-12 01:07:17.639
cmfg50rin00ezovbo2749wv5j	COAST LAND CI	2025-09-12 01:07:17.712	2025-09-12 01:07:17.712
cmfg50rko00f0ovbony4htghd	COASTAL CONSTRUCTION	2025-09-12 01:07:17.784	2025-09-12 01:07:17.784
cmfg50rmn00f1ovbo24xvatmo	COASTAL CONTRUCTION	2025-09-12 01:07:17.855	2025-09-12 01:07:17.855
cmfg50rom00f2ovboy0nvacy5	COASTAL HOMES	2025-09-12 01:07:17.927	2025-09-12 01:07:17.927
cmfg50rqn00f3ovboqrdpfal7	COASTAL TOWERS CONDOMINIUM	2025-09-12 01:07:17.999	2025-09-12 01:07:17.999
cmfg50rso00f4ovbo75cdequr	Coastland Construction, Inc.	2025-09-12 01:07:18.072	2025-09-12 01:07:18.072
cmfg50rv600f5ovbokfw5ilx0	Coastland Construction, Inc.:IFC TAMIAMI AIRPORT	2025-09-12 01:07:18.162	2025-09-12 01:07:18.162
cmfg50rxg00f6ovbok33j61wm	Coastland Construction, Inc.:MOSAIQUE AT OPA LOCKA	2025-09-12 01:07:18.245	2025-09-12 01:07:18.245
cmfg50rzs00f7ovbo1h0eq87k	COBALT CONSTRUCTION GROUP	2025-09-12 01:07:18.329	2025-09-12 01:07:18.329
cmfg50s1u00f8ovbovv90m0yb	COINCO INVESMENT CO, INC	2025-09-12 01:07:18.403	2025-09-12 01:07:18.403
cmfg50s3t00f9ovboyh2pcywu	COLASANTI	2025-09-12 01:07:18.473	2025-09-12 01:07:18.473
cmfg50s5t00faovbohu0lartw	COLLEGE PARK TOWERS	2025-09-12 01:07:18.545	2025-09-12 01:07:18.545
cmfg50s7x00fbovbomo16wz61	COLLEN CHANG	2025-09-12 01:07:18.621	2025-09-12 01:07:18.621
cmfg50s9y00fcovbonvzl9s98	COLLIERS RECEIVERSHIP SOLUTIONS	2025-09-12 01:07:18.695	2025-09-12 01:07:18.695
cmfg50sc200fdovbol14k02gd	COLLINS VIEW APARTMENTS.	2025-09-12 01:07:18.77	2025-09-12 01:07:18.77
cmfg50se500feovbo71mn0vrg	COMMUNITY ASPHAULT	2025-09-12 01:07:18.846	2025-09-12 01:07:18.846
cmfg50sg900ffovbokgx84jya	COMMUNITY ASPHAULT:CAC - HEFT	2025-09-12 01:07:18.922	2025-09-12 01:07:18.922
cmfg50si900fgovbote62rfay	COMMUNITY ASPHAULT:CAC 6025	2025-09-12 01:07:18.994	2025-09-12 01:07:18.994
cmfg50sk600fhovborvixn4j0	COMMUNITY ASPHAULT:CAC 6180	2025-09-12 01:07:19.063	2025-09-12 01:07:19.063
cmfg50sm300fiovbo9j8tibbw	COMMUNITY ASPHAULT:CAC 6185	2025-09-12 01:07:19.131	2025-09-12 01:07:19.131
cmfg50so100fjovbo475ojcf0	COMMUNITY ASPHAULT:CAC 6200	2025-09-12 01:07:19.202	2025-09-12 01:07:19.202
cmfg50sq500fkovbocy7mf6ij	COMMUNITY ASPHAULT:CAC 6265	2025-09-12 01:07:19.277	2025-09-12 01:07:19.277
cmfg50ss500flovboiaev6rtm	COMMUNITY ASPHAULT:CAC 6280	2025-09-12 01:07:19.349	2025-09-12 01:07:19.349
cmfg50su900fmovbokg73968p	COMMUNITY ASPHAULT:CAC 6310	2025-09-12 01:07:19.425	2025-09-12 01:07:19.425
cmfg50swa00fnovbo2355x1g2	COMMUNITY ASPHAULT:CAC 6315	2025-09-12 01:07:19.498	2025-09-12 01:07:19.498
cmfg50sya00foovboffqertn0	COMMUNITY ASPHAULT:CAC 6320	2025-09-12 01:07:19.57	2025-09-12 01:07:19.57
cmfg50t0a00fpovboj7s6fbgl	COMMUNITY ASPHAULT:CAC 6345	2025-09-12 01:07:19.642	2025-09-12 01:07:19.642
cmfg50t2i00fqovbo5smdwo0f	COMMUNITY ASPHAULT:CAC 6365	2025-09-12 01:07:19.722	2025-09-12 01:07:19.722
cmfg50t4j00frovbotf8wo4fo	COMMUNITY ASPHAULT:CAC 6370	2025-09-12 01:07:19.795	2025-09-12 01:07:19.795
cmfg50t6j00fsovbo505eajp2	COMMUNITY ASPHAULT:CAC 6372	2025-09-12 01:07:19.867	2025-09-12 01:07:19.867
cmfg50t8e00ftovbo7ojsjvkg	COMMUNITY ASPHAULT:CAC 6395	2025-09-12 01:07:19.934	2025-09-12 01:07:19.934
cmfg50tae00fuovbo5u3u2ej5	COMMUNITY ASPHAULT:CAC 6465	2025-09-12 01:07:20.006	2025-09-12 01:07:20.006
cmfg50tce00fvovbo6vyrdadu	COMMUNITY ASPHAULT:CAC 6500	2025-09-12 01:07:20.079	2025-09-12 01:07:20.079
cmfg50tet00fwovbodb8r6iuj	COMMUNITY ASPHAULT:CAC 6510	2025-09-12 01:07:20.165	2025-09-12 01:07:20.165
cmfg50tgw00fxovbo6lb9s8ww	COMMUNITY ASPHAULT:CAC 6515	2025-09-12 01:07:20.24	2025-09-12 01:07:20.24
cmfg50tj000fyovbojjuqsje2	COMMUNITY ASPHAULT:CAC 6550	2025-09-12 01:07:20.316	2025-09-12 01:07:20.316
cmfg50tl400fzovbofwg2b62g	COMMUNITY ASPHAULT:CAC 6650	2025-09-12 01:07:20.392	2025-09-12 01:07:20.392
cmfg50tn300g0ovbo1706ssli	COMMUNITY ASPHAULT:CAC 6660	2025-09-12 01:07:20.463	2025-09-12 01:07:20.463
cmfg50tp300g1ovbo0rphcm16	COMMUNITY ASPHAULT:CAC 6675	2025-09-12 01:07:20.536	2025-09-12 01:07:20.536
cmfg50tr700g2ovbo8o9g09fk	COMMUNITY ASPHAULT:CAC 6695	2025-09-12 01:07:20.611	2025-09-12 01:07:20.611
cmfg50tt800g3ovbowoll3avy	COMMUNITY ASPHAULT:CAC 6724	2025-09-12 01:07:20.684	2025-09-12 01:07:20.684
cmfg50tvd00g4ovbomuavl0tj	COMMUNITY ASPHAULT:CAC 6726	2025-09-12 01:07:20.761	2025-09-12 01:07:20.761
cmfg50txd00g5ovbo8e0fgyfi	COMMUNITY ASPHAULT:CAC 6735	2025-09-12 01:07:20.833	2025-09-12 01:07:20.833
cmfg50tzh00g6ovboaqlf1wh6	COMMUNITY ASPHAULT:CAC 6737	2025-09-12 01:07:20.909	2025-09-12 01:07:20.909
cmfg50u1h00g7ovbolho10m2z	COMMUNITY ASPHAULT:CAC 6738	2025-09-12 01:07:20.981	2025-09-12 01:07:20.981
cmfg50u3i00g8ovboh2yhv9ds	COMMUNITY ASPHAULT:CAC 6741	2025-09-12 01:07:21.054	2025-09-12 01:07:21.054
cmfg50u5l00g9ovboe76ayxdv	COMMUNITY ASPHAULT:CAC 6805	2025-09-12 01:07:21.13	2025-09-12 01:07:21.13
cmfg50u7l00gaovbo3eeqjr01	COMMUNITY ASPHAULT:CAC 6850	2025-09-12 01:07:21.202	2025-09-12 01:07:21.202
cmfg50u9p00gbovbo2ucox01q	COMMUNITY ASPHAULT:CAC 6913	2025-09-12 01:07:21.278	2025-09-12 01:07:21.278
cmfg50ubo00gcovbo2m619ufn	COMMUNITY ASPHAULT:CAC 6920	2025-09-12 01:07:21.348	2025-09-12 01:07:21.348
cmfg50udp00gdovbobqfrxwnt	COMMUNITY ASPHAULT:CAC 6950	2025-09-12 01:07:21.421	2025-09-12 01:07:21.421
cmfg50ufl00geovborh1xqvoa	COMMUNITY ASPHAULT:CAC HEFT - PO WORK	2025-09-12 01:07:21.489	2025-09-12 01:07:21.489
cmfg50uhl00gfovbo4o3igrgm	COMMUNITY ASPHAULT:CAC6000	2025-09-12 01:07:21.562	2025-09-12 01:07:21.562
cmfg50ujp00ggovbobugrsqyf	COMMUNITY ASPHAULT:E4N84 I75 SEG A&B	2025-09-12 01:07:21.637	2025-09-12 01:07:21.637
cmfg50ulo00ghovbo666gst3y	COMMUNITY ASPHAULT:FDOT T4676 I-75 ALLIGATOR	2025-09-12 01:07:21.709	2025-09-12 01:07:21.709
cmfg50uno00giovbovdkqlsz0	COMMUNITY ASPHAULT:KILLIAN PARKWAY	2025-09-12 01:07:21.781	2025-09-12 01:07:21.781
cmfg50upp00gjovbog33thvq0	COMMUNITY ASPHAULT:T4592	2025-09-12 01:07:21.853	2025-09-12 01:07:21.853
cmfg50url00gkovboeema934z	COMMUNITY ASPHAULT:T4595	2025-09-12 01:07:21.921	2025-09-12 01:07:21.921
cmfg50utk00glovbomosz6v6v	COMMUNITY ASPHAULT:T4595 PO	2025-09-12 01:07:21.992	2025-09-12 01:07:21.992
cmfg50uvk00gmovbosvs6krzw	COMMUNITY ASPHAULT:T6572	2025-09-12 01:07:22.065	2025-09-12 01:07:22.065
cmfg50uxk00gnovbo6h2q1aur	COMMUNITY ASPHAULT:T6572 PO	2025-09-12 01:07:22.136	2025-09-12 01:07:22.136
cmfg50uzj00goovbomjeecs7l	COMMUNITY ASPHAULT:TRANSIT F-510	2025-09-12 01:07:22.208	2025-09-12 01:07:22.208
cmfg50v1o00gpovbov0y8800c	COMMUNITY ASPHAULT:TRANSIT F-510 PO	2025-09-12 01:07:22.285	2025-09-12 01:07:22.285
cmfg50v3o00gqovbocgysj1rl	COMMUNITY ASPHAULT:YARD GATE & FENCE	2025-09-12 01:07:22.357	2025-09-12 01:07:22.357
cmfg50v5r00grovbom38m7u80	COMMUNITY DEVELOPMENT DISTRICT	2025-09-12 01:07:22.432	2025-09-12 01:07:22.432
cmfg50v7n00gsovboup30futj	COMMUNITY/CONDOTTE/ de Moya JV	2025-09-12 01:07:22.5	2025-09-12 01:07:22.5
cmfg50v9n00gtovbo6kfpy314	COMMUNITY/CONDOTTE/ de Moya JV:E6I05 SR 826/I-75	2025-09-12 01:07:22.571	2025-09-12 01:07:22.571
cmfg50vbl00guovbo83zp5gjn	COMMUNITY/CONDOTTE/ de Moya JV:E6I05 SR 826/I-75:CO# 034	2025-09-12 01:07:22.642	2025-09-12 01:07:22.642
cmfg50vdl00gvovbonjd8c87t	COMPLETE HIGHWAY IDENTITY	2025-09-12 01:07:22.714	2025-09-12 01:07:22.714
cmfg50vfl00gwovbok1kbzp4q	COMPLETELY GROUNDED, LLC	2025-09-12 01:07:22.785	2025-09-12 01:07:22.785
cmfg50vhq00gxovbofguarget	COMTECH ENGINEERING, INC.	2025-09-12 01:07:22.863	2025-09-12 01:07:22.863
cmfg50vjq00gyovbouy82rc2r	COMUNIDADA CRISTIANO	2025-09-12 01:07:22.934	2025-09-12 01:07:22.934
cmfg50vlq00gzovbohfa3hh2s	CONALVIAS	2025-09-12 01:07:23.006	2025-09-12 01:07:23.006
cmfg50vnt00h0ovbo14doca3p	CONCONCRETO	2025-09-12 01:07:23.082	2025-09-12 01:07:23.082
cmfg50vpw00h1ovbojuf149on	CONCORD HOSPITALITY DEVELOPMENT DEPT.	2025-09-12 01:07:23.157	2025-09-12 01:07:23.157
cmfg50vs500h2ovbofxeknlyn	CONCRETE PRO	2025-09-12 01:07:23.238	2025-09-12 01:07:23.238
cmfg50vu500h3ovboypsnzaqz	CONCRETE SOLUTION GROUP	2025-09-12 01:07:23.309	2025-09-12 01:07:23.309
cmfg50vw600h4ovboawsfynzh	CONCRETE WORKS & PAVERS, LLC	2025-09-12 01:07:23.382	2025-09-12 01:07:23.382
cmfg50vy600h5ovbokr49pqeo	CONDOTTE AMERICA INC.	2025-09-12 01:07:23.454	2025-09-12 01:07:23.454
cmfg50w0700h6ovboagwswtfh	CONDOTTE AMERICA INC.:874	2025-09-12 01:07:23.528	2025-09-12 01:07:23.528
cmfg50w2h00h7ovboofy3h7wt	CONDOTTE AMERICA INC.:E4W59	2025-09-12 01:07:23.609	2025-09-12 01:07:23.609
cmfg50w4l00h8ovboxr7d5s7z	CONDOTTE AMERICA INC.:E4W59 PO	2025-09-12 01:07:23.685	2025-09-12 01:07:23.685
cmfg50w6y00h9ovbofajuld4k	CONDOTTE AMERICA INC.:E6M86	2025-09-12 01:07:23.771	2025-09-12 01:07:23.771
cmfg50w9200haovboxaz72p2f	CONDOTTE AMERICA INC.:E6M86 - NE 203 ST	2025-09-12 01:07:23.846	2025-09-12 01:07:23.846
cmfg50wb200hbovbo5ab2h76b	CONDOTTE AMERICA INC.:E6M86 PO	2025-09-12 01:07:23.918	2025-09-12 01:07:23.918
cmfg50wd600hcovboll81w14z	CONDOTTE AMERICA INC.:E8M76	2025-09-12 01:07:23.995	2025-09-12 01:07:23.995
cmfg50wfa00hdovboategbig6	CONDOTTE AMERICA INC.:SR-836	2025-09-12 01:07:24.07	2025-09-12 01:07:24.07
cmfg50whm00heovborwwcnzxs	CONE & GRAHAM	2025-09-12 01:07:24.155	2025-09-12 01:07:24.155
cmfg50wjm00hfovbo2mmzqcva	CONEMCO	2025-09-12 01:07:24.226	2025-09-12 01:07:24.226
cmfg50wm100hgovboo2f0t6tg	CONLON CONSTRUCTION	2025-09-12 01:07:24.314	2025-09-12 01:07:24.314
cmfg50wo400hhovboqn8pvc3e	CONSTRUCT CONNECT	2025-09-12 01:07:24.389	2025-09-12 01:07:24.389
cmfg50wq600hiovboz0d63a81	CONSTRUCT GROUP CORP.	2025-09-12 01:07:24.463	2025-09-12 01:07:24.463
cmfg50wsc00hjovbo0aare8s6	CONSTRUCT GROUP CORP.:CR905 BIKE LANES	2025-09-12 01:07:24.541	2025-09-12 01:07:24.541
cmfg50wuf00hkovbo0s5vy2i9	CONSTRUCT GROUP CORP.:I-95 NOISE WALL	2025-09-12 01:07:24.615	2025-09-12 01:07:24.615
cmfg50wwe00hlovboc3tslr7a	CONSTRUCT GROUP CORP.:RICKENBACKER CAUSEWAY TOLL PHASE I	2025-09-12 01:07:24.687	2025-09-12 01:07:24.687
cmfg50x0r00hmovbocez2cam9	CONSTRUCT GROUP CORP.:WINDLEY KEY TRAIL SEGMENT	2025-09-12 01:07:24.844	2025-09-12 01:07:24.844
cmfg50x7a00hnovboxczvsr3a	CONSTRUCTION SOURCE	2025-09-12 01:07:25.079	2025-09-12 01:07:25.079
cmfg50x9a00hoovbodj6elles	CONTENDER BOATS INC	2025-09-12 01:07:25.15	2025-09-12 01:07:25.15
cmfg50xbd00hpovboybu8p988	CONTENGRA CONSTRUCTION CO	2025-09-12 01:07:25.226	2025-09-12 01:07:25.226
cmfg50xde00hqovbo3ffxsoik	CONTEX CONSTRUCTION	2025-09-12 01:07:25.298	2025-09-12 01:07:25.298
cmfg50xfj00hrovbo73p4sfie	CONTEX CONSTRUCTION COMPANY, INC.	2025-09-12 01:07:25.375	2025-09-12 01:07:25.375
cmfg50xhl00hsovbo7k4z41p6	CONTIERRA CONSTRUCTION	2025-09-12 01:07:25.449	2025-09-12 01:07:25.449
cmfg50xjj00htovboslj4x682	CONTINENTAL HEAVY CIVIL CORP	2025-09-12 01:07:25.52	2025-09-12 01:07:25.52
cmfg50xlp00huovbozd4lfj62	COOPER CITY HIGH SCHOOL	2025-09-12 01:07:25.597	2025-09-12 01:07:25.597
cmfg50xno00hvovbo8tbcwha3	COPELAN CONSTRUCTION GROUP	2025-09-12 01:07:25.669	2025-09-12 01:07:25.669
cmfg50xpx00hwovbo3ytl808u	CORAL HAVEN	2025-09-12 01:07:25.749	2025-09-12 01:07:25.749
cmfg50xrx00hxovbohffb9n1m	CORAL REEF PARK	2025-09-12 01:07:25.822	2025-09-12 01:07:25.822
cmfg50xtx00hyovbocwevx0as	CORAL TOWERS	2025-09-12 01:07:25.894	2025-09-12 01:07:25.894
cmfg50xvt00hzovbok9an37yw	CORELAND CONSTRUCTION	2025-09-12 01:07:25.961	2025-09-12 01:07:25.961
cmfg50xxs00i0ovbovyuwm1l2	CORELAND CONSTRUCTION, CORP	2025-09-12 01:07:26.032	2025-09-12 01:07:26.032
cmfg50xzs00i1ovbow2b22cef	CORZO DEVELOPMENT	2025-09-12 01:07:26.104	2025-09-12 01:07:26.104
cmfg50y1s00i2ovbo99jkj94u	COSCAN CONSTRUCTION	2025-09-12 01:07:26.176	2025-09-12 01:07:26.176
cmfg50y3t00i3ovbotnx37b2r	COSTALINA ASSOCIATION	2025-09-12 01:07:26.25	2025-09-12 01:07:26.25
cmfg50y5y00i4ovbo77f8vonz	COUGAR CUTTING INC	2025-09-12 01:07:26.326	2025-09-12 01:07:26.326
cmfg50y8f00i5ovbor5j54ahy	COUNTER INTELLIGENCE TECHNOLOGY INC.	2025-09-12 01:07:26.415	2025-09-12 01:07:26.415
cmfg50yaf00i6ovbojuhyh6g6	COUNTRY BILL'S LANDSCAPING	2025-09-12 01:07:26.487	2025-09-12 01:07:26.487
cmfg50yce00i7ovbo4esj08ak	COUNTRY WALK MASTER ASSOCIATION	2025-09-12 01:07:26.558	2025-09-12 01:07:26.558
cmfg50yef00i8ovborg6ymab1	COURTESY PROPERTY MANAGMENT	2025-09-12 01:07:26.631	2025-09-12 01:07:26.631
cmfg50ygj00i9ovbo5c6n0n3k	COVERINGS ETC.	2025-09-12 01:07:26.707	2025-09-12 01:07:26.707
cmfg50yij00iaovbo9dy6bh1k	CP DEVELOPMENT MANAGEMENT, LLC	2025-09-12 01:07:26.779	2025-09-12 01:07:26.779
cmfg50ykn00ibovbo1c34xvsm	CPF INVESTMENT GROUP	2025-09-12 01:07:26.855	2025-09-12 01:07:26.855
cmfg50ymn00icovboqmud2191	CPGBR1	2025-09-12 01:07:26.927	2025-09-12 01:07:26.927
cmfg50ypv00idovbo233t4ier	CPS PRODUCTS	2025-09-12 01:07:27.008	2025-09-12 01:07:27.008
cmfg50yrw00ieovboy6riidxe	CR MANAGEMENT	2025-09-12 01:07:27.116	2025-09-12 01:07:27.116
cmfg50ytw00ifovbo7dtpqoi6	CRAFT CONSTRUCTION	2025-09-12 01:07:27.188	2025-09-12 01:07:27.188
cmfg50yvv00igovbo8j8z5ajl	CRB	2025-09-12 01:07:27.259	2025-09-12 01:07:27.259
cmfg50yxv00ihovboqcnxfoff	CREIGHTON CONSTRUCTION	2025-09-12 01:07:27.331	2025-09-12 01:07:27.331
cmfg50yzv00iiovbo2bm7a9p3	CRF INVESTMENT	2025-09-12 01:07:27.403	2025-09-12 01:07:27.403
cmfg50z1w00ijovbo4ot85ejd	CRICKET CLUB	2025-09-12 01:07:27.476	2025-09-12 01:07:27.476
cmfg50z4000ikovboohif3lvz	CRISSCROSS CONCRETE CUTTING & DRILLING	2025-09-12 01:07:27.552	2025-09-12 01:07:27.552
cmfg50z6000ilovbo1czlp6l9	CRISTINA PERELLO	2025-09-12 01:07:27.624	2025-09-12 01:07:27.624
cmfg50z7z00imovboyighyk5v	CRISTY ESCOBEDO	2025-09-12 01:07:27.696	2025-09-12 01:07:27.696
cmfg50za000inovbov49fh409	CRITICAL PATH CONSTRUCTION	2025-09-12 01:07:27.768	2025-09-12 01:07:27.768
cmfg50zbz00ioovboq3vu103c	CROOK & CROOK MARINE SUPPLIES	2025-09-12 01:07:27.84	2025-09-12 01:07:27.84
cmfg50ze400ipovbo5b62onqb	CROSS DEVELOPMENT	2025-09-12 01:07:27.916	2025-09-12 01:07:27.916
cmfg50zg400iqovbop6jz2wqx	CROWN PARK CONDOMINIUM ASSOCIATION INC	2025-09-12 01:07:27.988	2025-09-12 01:07:27.988
cmfg50zi400irovbon22b6hw1	CRS ASSOCIATES INC	2025-09-12 01:07:28.06	2025-09-12 01:07:28.06
cmfg50zjz00isovbov92nsiwv	CSD CONSTRUCTION GROUP INC	2025-09-12 01:07:28.128	2025-09-12 01:07:28.128
cmfg50zm500itovbo45q9dtc0	CSI DEERING BAY	2025-09-12 01:07:28.205	2025-09-12 01:07:28.205
cmfg50zo600iuovbo0te6h92i	CSI INTERNATIONAL	2025-09-12 01:07:28.278	2025-09-12 01:07:28.278
cmfg50zqc00ivovbogvhtr53o	CSI/ ANCHOR BAY CLUB CONDOMINIUMS	2025-09-12 01:07:28.356	2025-09-12 01:07:28.356
cmfg50zsf00iwovboun9s9cia	CTS	2025-09-12 01:07:28.431	2025-09-12 01:07:28.431
cmfg50zuf00ixovbo2jqvethf	CTY OF PALMETO	2025-09-12 01:07:28.503	2025-09-12 01:07:28.503
cmfg50zwe00iyovboux6u6kf7	CUMMINGS GENERAL CONTRACTORS	2025-09-12 01:07:28.574	2025-09-12 01:07:28.574
cmfg50zya00izovbom11idjxp	CURRENT BUILDERS	2025-09-12 01:07:28.642	2025-09-12 01:07:28.642
cmfg5100900j0ovbofto26n71	CURTIS PAINTING & WATERPROOFING DBA TOOLE	2025-09-12 01:07:28.714	2025-09-12 01:07:28.714
cmfg5102i00j1ovbonemj7af8	CUTLER BAY APP-	2025-09-12 01:07:28.795	2025-09-12 01:07:28.795
cmfg5104j00j2ovbougne8rlz	CUTLER GLEN APTS.	2025-09-12 01:07:28.867	2025-09-12 01:07:28.867
cmfg5106j00j3ovbozmsjx7ko	CUTLER MANOR	2025-09-12 01:07:28.939	2025-09-12 01:07:28.939
cmfg5108j00j4ovbom6snj65h	CUTLER MEADOW APTS.	2025-09-12 01:07:29.012	2025-09-12 01:07:29.012
cmfg510al00j5ovbo49adoqb8	CUTTING EDGE INDUSTRIES	2025-09-12 01:07:29.086	2025-09-12 01:07:29.086
cmfg510cq00j6ovbo9c2vhb2w	CUTTING EDGE INDUSTRIES:KESTER PARK	2025-09-12 01:07:29.163	2025-09-12 01:07:29.163
cmfg510ew00j7ovbocc0ts330	CYMBAL DEVELOPMENT	2025-09-12 01:07:29.24	2025-09-12 01:07:29.24
cmfg510gw00j8ovbojxpjw79v	CYNAMON BROTHERS	2025-09-12 01:07:29.312	2025-09-12 01:07:29.312
cmfg510iw00j9ovbo8hlf7mu0	CYPRESS ANCHORAGE	2025-09-12 01:07:29.385	2025-09-12 01:07:29.385
cmfg510l000jaovboz6tcqk2h	D. STEPHENSON CONSTRUCTION	2025-09-12 01:07:29.46	2025-09-12 01:07:29.46
cmfg510my00jbovbon24r0k67	D2 CONSTRUCTION, INC.	2025-09-12 01:07:29.531	2025-09-12 01:07:29.531
cmfg510oz00jcovbo80a8tjx5	DACRA	2025-09-12 01:07:29.603	2025-09-12 01:07:29.603
cmfg510r000jdovbozuvjhbdz	DADE CONSTRUCTION CORP	2025-09-12 01:07:29.677	2025-09-12 01:07:29.677
cmfg510t300jeovboxiyzv63u	DADE COUNTY PUBLIC SCHOOLS	2025-09-12 01:07:29.751	2025-09-12 01:07:29.751
cmfg510v800jfovboq5621q35	DADE JUVENILE RESIDENTIAL FACILITY	2025-09-12 01:07:29.829	2025-09-12 01:07:29.829
cmfg510x800jgovboe76to34x	DADELAND CAPRI APARTMENTS	2025-09-12 01:07:29.9	2025-09-12 01:07:29.9
cmfg510z800jhovbok4zutjd6	DAISY RAMALLO	2025-09-12 01:07:29.972	2025-09-12 01:07:29.972
cmfg5111q00jiovbop1b4lbds	DAL GROUP	2025-09-12 01:07:30.063	2025-09-12 01:07:30.063
cmfg5113q00jjovbov5t721ef	DAN LOVALLO	2025-09-12 01:07:30.134	2025-09-12 01:07:30.134
cmfg5115m00jkovbo9pxwqvck	DAN PEREZ	2025-09-12 01:07:30.202	2025-09-12 01:07:30.202
cmfg5117p00jlovboa9jv6am4	DANIA DONUTS	2025-09-12 01:07:30.277	2025-09-12 01:07:30.277
cmfg5119y00jmovbodr9k04cn	DANIEL BURAGLIA	2025-09-12 01:07:30.358	2025-09-12 01:07:30.358
cmfg511c000jnovborqwxg9n1	DANIEL O'CONNELL'S SONS	2025-09-12 01:07:30.433	2025-09-12 01:07:30.433
cmfg511e500joovbo1zwy7xmu	DANIELS FENCE CORP	2025-09-12 01:07:30.509	2025-09-12 01:07:30.509
cmfg511g800jpovboqtyynt5g	DAVID	2025-09-12 01:07:30.584	2025-09-12 01:07:30.584
cmfg511ib00jqovbopjs540i5	DAVID BOLAND, INC	2025-09-12 01:07:30.66	2025-09-12 01:07:30.66
cmfg511kb00jrovbopofrccxh	DAVID FLETCHER	2025-09-12 01:07:30.731	2025-09-12 01:07:30.731
cmfg511ma00jsovbo6zamvopz	DAVID GARDENS	2025-09-12 01:07:30.803	2025-09-12 01:07:30.803
cmfg511of00jtovbou8xrup0f	DAVID LOPEZ	2025-09-12 01:07:30.879	2025-09-12 01:07:30.879
cmfg511ql00juovbouhzjyzaq	DAVID MANCINI & SONS INC.	2025-09-12 01:07:30.958	2025-09-12 01:07:30.958
cmfg511sp00jvovbob8be6m2q	DAVID MARQUEZ	2025-09-12 01:07:31.033	2025-09-12 01:07:31.033
cmfg511uo00jwovbozvxrhnjz	DAVIS COMPANIES	2025-09-12 01:07:31.105	2025-09-12 01:07:31.105
cmfg511wr00jxovbox8e4n8fw	DB ECOLOGICAL SERVICES	2025-09-12 01:07:31.18	2025-09-12 01:07:31.18
cmfg511yt00jyovboqtfimxwt	DBI SERVICES -	2025-09-12 01:07:31.253	2025-09-12 01:07:31.253
cmfg5120s00jzovbowo9gsv0p	DCT COMMERCE CENTER	2025-09-12 01:07:31.325	2025-09-12 01:07:31.325
cmfg5122s00k0ovboifrmc1al	DD FLORIDA CONSTRUCTION LLC	2025-09-12 01:07:31.396	2025-09-12 01:07:31.396
cmfg5124t00k1ovbonl7mcy9u	DDR	2025-09-12 01:07:31.469	2025-09-12 01:07:31.469
cmfg5126s00k2ovbonegjidqy	DE AVILA FENCE INC	2025-09-12 01:07:31.54	2025-09-12 01:07:31.54
cmfg5128t00k3ovboa37fw3hl	DEAN MITCHELL GROUP	2025-09-12 01:07:31.614	2025-09-12 01:07:31.614
cmfg512ay00k4ovbopzy329zp	DEAN PASCUA	2025-09-12 01:07:31.69	2025-09-12 01:07:31.69
cmfg512cy00k5ovbo69wcgvrr	DEAN S. WARHAFT	2025-09-12 01:07:31.763	2025-09-12 01:07:31.763
cmfg512fp00k6ovboh8azolrv	DEANGELIS DIAMOND CONSTRUCTION	2025-09-12 01:07:31.861	2025-09-12 01:07:31.861
cmfg512hm00k7ovbojqllhrtk	DEBI CHIN	2025-09-12 01:07:31.93	2025-09-12 01:07:31.93
cmfg512jm00k8ovbozdirn0ak	DELTA MANAGEMENT SOLUTIONS INC	2025-09-12 01:07:32.002	2025-09-12 01:07:32.002
cmfg512ll00k9ovbogm2v1eko	DEMOLITION MASTERS, INC	2025-09-12 01:07:32.074	2025-09-12 01:07:32.074
cmfg512nl00kaovboo2v1wwq1	DEN MARK	2025-09-12 01:07:32.145	2025-09-12 01:07:32.145
cmfg512pq00kbovbozndrbtzf	DEPLOYED RESOURCES	2025-09-12 01:07:32.222	2025-09-12 01:07:32.222
cmfg512rv00kcovbonae3ldv6	DEROMA	2025-09-12 01:07:32.299	2025-09-12 01:07:32.299
cmfg512tq00kdovbov1qtwma8	DESBUILD INC	2025-09-12 01:07:32.366	2025-09-12 01:07:32.366
cmfg512vt00keovbolwr2bt6h	DESIGN-BUILD CONSTRUCTION INC	2025-09-12 01:07:32.441	2025-09-12 01:07:32.441
cmfg512xt00kfovbom821y5qw	DESIGN CENTER OF THE AMERICA	2025-09-12 01:07:32.514	2025-09-12 01:07:32.514
cmfg512zp00kgovbogj28sz05	DESIGN2FORM	2025-09-12 01:07:32.581	2025-09-12 01:07:32.581
cmfg5131q00khovbo1mwetq0o	DEVELOPERS DIVERSIFIED/OHIO	2025-09-12 01:07:32.655	2025-09-12 01:07:32.655
cmfg5133q00kiovboiyaxa7c2	DEVELOPMENT & COMM. GROUP OF FL, INC.	2025-09-12 01:07:32.727	2025-09-12 01:07:32.727
cmfg5135g00kjovbo4880i3z4	DEVELOPMENT SERVICE SOLUTIONS, LLC	2025-09-12 01:07:32.788	2025-09-12 01:07:32.788
cmfg5137f00kkovbo1tg0mlhp	DEVIN OLLET	2025-09-12 01:07:32.859	2025-09-12 01:07:32.859
cmfg5139k00klovbooncfp41r	DEVON LOBUE	2025-09-12 01:07:32.936	2025-09-12 01:07:32.936
cmfg513bb00kmovboydujyggp	DEZER DEVELOPMENT	2025-09-12 01:07:33	2025-09-12 01:07:33
cmfg513d700knovbosso0s05t	DGARC MANANGEMENT	2025-09-12 01:07:33.068	2025-09-12 01:07:33.068
cmfg513f300koovboirw1ahzt	DHL	2025-09-12 01:07:33.135	2025-09-12 01:07:33.135
cmfg513h200kpovbo6oeldbar	DHS/ICE	2025-09-12 01:07:33.207	2025-09-12 01:07:33.207
cmfg513ix00kqovboghwfjoud	DI POMPEO CONSTRUCTION CORP.	2025-09-12 01:07:33.273	2025-09-12 01:07:33.273
cmfg513kn00krovbo0iptybwc	DIAMOND R FERTILIZER	2025-09-12 01:07:33.336	2025-09-12 01:07:33.336
cmfg513mj00ksovbo34wbh9q7	DIANA ARIAS	2025-09-12 01:07:33.403	2025-09-12 01:07:33.403
cmfg513oj00ktovboqstgkckk	DIANE PURVOS	2025-09-12 01:07:33.476	2025-09-12 01:07:33.476
cmfg513qt00kuovbobnajlmv8	DIEGO ARAMBURU	2025-09-12 01:07:33.557	2025-09-12 01:07:33.557
cmfg513sv00kvovbof2j7btr1	DINAMAR OF MIAMI, INC	2025-09-12 01:07:33.631	2025-09-12 01:07:33.631
cmfg513ur00kwovboz6lz0dvb	DIVERSIFIED REAL ESTATE & MANAG.	2025-09-12 01:07:33.7	2025-09-12 01:07:33.7
cmfg513wn00kxovboroxz50sr	DIVISION III GROUP	2025-09-12 01:07:33.768	2025-09-12 01:07:33.768
cmfg513yk00kyovbozj00jod0	DMAJ BUILDERS, INC	2025-09-12 01:07:33.836	2025-09-12 01:07:33.836
cmfg5140j00kzovbo9jtfcmvy	DODEC,INC	2025-09-12 01:07:33.908	2025-09-12 01:07:33.908
cmfg5142k00l0ovbo7ld0mj4u	DOLCE LIVING HOMES	2025-09-12 01:07:33.98	2025-09-12 01:07:33.98
cmfg5144j00l1ovbo4fe7ppcd	DOMINGO SUAREZ	2025-09-12 01:07:34.051	2025-09-12 01:07:34.051
cmfg5146e00l2ovboaal76x70	DONALD HARRISON	2025-09-12 01:07:34.118	2025-09-12 01:07:34.118
cmfg5148h00l3ovbo1iwk5xtc	DONE AND DUSTED	2025-09-12 01:07:34.194	2025-09-12 01:07:34.194
cmfg514ar00l4ovbonnq45r9e	DORAL ACADEMY HIGH SCHOOL	2025-09-12 01:07:34.275	2025-09-12 01:07:34.275
cmfg514d000l5ovbotb38drmd	DORAL POLICE DEPARTMENT	2025-09-12 01:07:34.356	2025-09-12 01:07:34.356
cmfg514f000l6ovbolenor4lt	DORAL TOOLS & EQUIPMENT	2025-09-12 01:07:34.428	2025-09-12 01:07:34.428
cmfg514gv00l7ovbou451sikm	DOUG COLE	2025-09-12 01:07:34.496	2025-09-12 01:07:34.496
cmfg514jh00l8ovboswh37t5i	DOUG WATT, INC	2025-09-12 01:07:34.589	2025-09-12 01:07:34.589
cmfg514lj00l9ovboh5rnmryl	DOUGLAS N. HIGGINS INC	2025-09-12 01:07:34.663	2025-09-12 01:07:34.663
cmfg514ni00laovbon3c7rnyj	DOUGLAS PLUMBING	2025-09-12 01:07:34.735	2025-09-12 01:07:34.735
cmfg514pw00lbovbox22kabex	DOWNRITE ENGINEERING	2025-09-12 01:07:34.82	2025-09-12 01:07:34.82
cmfg514ru00lcovbot3ygnc5n	DOWNRITE ENGINEERING:BAYWINDS AT HATTERAS	2025-09-12 01:07:34.891	2025-09-12 01:07:34.891
cmfg514tv00ldovbo8sffrx2y	DOWNRITE ENGINEERING:BELLAGIO	2025-09-12 01:07:34.963	2025-09-12 01:07:34.963
cmfg514vs00leovbov8gbpwn1	DOWNRITE ENGINEERING:CHARLESTON COMMONS LIFT STATION	2025-09-12 01:07:35.032	2025-09-12 01:07:35.032
cmfg514y000lfovbowv49qyst	DOWNRITE ENGINEERING:COCONUT PALM PARKING [ 2023-005 ]	2025-09-12 01:07:35.113	2025-09-12 01:07:35.113
cmfg514zw00lgovbo07tun6ki	DOWNRITE ENGINEERING:CORAL SPRINGS	2025-09-12 01:07:35.181	2025-09-12 01:07:35.181
cmfg5151v00lhovbo492hgzm1	DOWNRITE ENGINEERING:COTTAGE GROVE [ 2021-019 ]	2025-09-12 01:07:35.252	2025-09-12 01:07:35.252
cmfg5153w00liovbonatmupu9	DOWNRITE ENGINEERING:CRESTVIEW BIRD ROAD	2025-09-12 01:07:35.324	2025-09-12 01:07:35.324
cmfg5156000ljovbo6pntv1yx	DOWNRITE ENGINEERING:DCT COMMERCE CENTER	2025-09-12 01:07:35.401	2025-09-12 01:07:35.401
cmfg5158d00lkovbowes01qij	DOWNRITE ENGINEERING:DORAL BREEZE 3	2025-09-12 01:07:35.486	2025-09-12 01:07:35.486
cmfg515ad00llovboau4p6d8l	DOWNRITE ENGINEERING:DORAL BREZZE	2025-09-12 01:07:35.557	2025-09-12 01:07:35.557
cmfg515ch00lmovboxqr15aev	DOWNRITE ENGINEERING:DORAL GRANDE	2025-09-12 01:07:35.633	2025-09-12 01:07:35.633
cmfg515eh00lnovbodlabbaxf	DOWNRITE ENGINEERING:DORAL PALMS NORTH	2025-09-12 01:07:35.705	2025-09-12 01:07:35.705
cmfg515gl00loovbobzwveicr	DOWNRITE ENGINEERING:DOWNTOWN DORAL TOWN HOMES	2025-09-12 01:07:35.782	2025-09-12 01:07:35.782
cmfg515iv00lpovbo189anw57	DOWNRITE ENGINEERING:E-TEN [ 2024-054 ]	2025-09-12 01:07:35.863	2025-09-12 01:07:35.863
cmfg515kv00lqovbog640i4fx	DOWNRITE ENGINEERING:FDOT FLAGER STATION	2025-09-12 01:07:35.936	2025-09-12 01:07:35.936
cmfg515mq00lrovboje1tsxml	DOWNRITE ENGINEERING:FLAGLER STATION 5	2025-09-12 01:07:36.002	2025-09-12 01:07:36.002
cmfg515ol00lsovbo0s9njtjj	DOWNRITE ENGINEERING:FLAMINGO VILLAGE LIFT STATION	2025-09-12 01:07:36.069	2025-09-12 01:07:36.069
cmfg515qg00ltovboqu7cc3mk	DOWNRITE ENGINEERING:FLAMINGO VILLAGE NORTH	2025-09-12 01:07:36.136	2025-09-12 01:07:36.136
cmfg515sg00luovbouu427jc7	DOWNRITE ENGINEERING:FLAMINGO VILLAS PHASE II	2025-09-12 01:07:36.208	2025-09-12 01:07:36.208
cmfg515uc00lvovbo6ipgprpu	DOWNRITE ENGINEERING:FOUNTAINBLEU PARK PLAZA LIFT STATION	2025-09-12 01:07:36.277	2025-09-12 01:07:36.277
cmfg515wc00lwovbo51vyb4xi	DOWNRITE ENGINEERING:FREEDOM PARK	2025-09-12 01:07:36.348	2025-09-12 01:07:36.348
cmfg515yc00lxovboyvcagvln	DOWNRITE ENGINEERING:IBIS - LEHIGH ACRES, FL 2024-036	2025-09-12 01:07:36.42	2025-09-12 01:07:36.42
cmfg5161b00lyovbowvtfs49w	DOWNRITE ENGINEERING:INTERLAKEN	2025-09-12 01:07:36.527	2025-09-12 01:07:36.527
cmfg5163y00lzovbou9axejs3	DOWNRITE ENGINEERING:JOB NO. 2017-020	2025-09-12 01:07:36.623	2025-09-12 01:07:36.623
cmfg5169200m0ovbonmroenxg	DOWNRITE ENGINEERING:JOB NO. 2017-021	2025-09-12 01:07:36.807	2025-09-12 01:07:36.807
cmfg516b700m1ovbos2128n1s	DOWNRITE ENGINEERING:JOB#2018-015 NW 122 AVE	2025-09-12 01:07:36.883	2025-09-12 01:07:36.883
cmfg516db00m2ovbonxdgj4l5	DOWNRITE ENGINEERING:KENDAL COMMONS	2025-09-12 01:07:36.96	2025-09-12 01:07:36.96
cmfg516fc00m3ovbo2h7dsyja	DOWNRITE ENGINEERING:LAKESIDE AT DORAL	2025-09-12 01:07:37.032	2025-09-12 01:07:37.032
cmfg516hc00m4ovbom7443sba	DOWNRITE ENGINEERING:LITTLE ABNER TRAILER PARK	2025-09-12 01:07:37.104	2025-09-12 01:07:37.104
cmfg516jf00m5ovbo3rhemq8q	DOWNRITE ENGINEERING:LOXAHATCHEE ROAD	2025-09-12 01:07:37.18	2025-09-12 01:07:37.18
cmfg516lf00m6ovbocgyxa7p4	DOWNRITE ENGINEERING:MIRAMAR TOWN CETER	2025-09-12 01:07:37.252	2025-09-12 01:07:37.252
cmfg516nf00m7ovbow29vpre7	DOWNRITE ENGINEERING:MODERA DADELAND	2025-09-12 01:07:37.323	2025-09-12 01:07:37.323
cmfg516pf00m8ovbokw6v03ke	DOWNRITE ENGINEERING:MODERN DORAL	2025-09-12 01:07:37.395	2025-09-12 01:07:37.395
cmfg516rg00m9ovbos58i4bkp	DOWNRITE ENGINEERING:NOB HILL ROAD IMPROVEMENTS	2025-09-12 01:07:37.469	2025-09-12 01:07:37.469
cmfg516tf00maovbocpxof8n3	DOWNRITE ENGINEERING:NW 170 BRIDGE	2025-09-12 01:07:37.539	2025-09-12 01:07:37.539
cmfg516vh00mbovbop3ernsxz	DOWNRITE ENGINEERING:PALM SPRINGS - TEMP FENCE	2025-09-12 01:07:37.613	2025-09-12 01:07:37.613
cmfg516xi00mcovboj71ebgeu	DOWNRITE ENGINEERING:PEFERED FREEZER	2025-09-12 01:07:37.686	2025-09-12 01:07:37.686
cmfg516zn00mdovboozt6667l	DOWNRITE ENGINEERING:RANCHO GRANDE [ 2025-001 ]	2025-09-12 01:07:37.763	2025-09-12 01:07:37.763
cmfg5171o00meovbovktqstga	DOWNRITE ENGINEERING:RESIDENCE AT KENDALL (OFFSITE)	2025-09-12 01:07:37.836	2025-09-12 01:07:37.836
cmfg5173n00mfovbos5z3x6q0	DOWNRITE ENGINEERING:REST DEPOT DAVIE OFFSITE	2025-09-12 01:07:37.908	2025-09-12 01:07:37.908
cmfg5175o00mgovbooksfvg2j	DOWNRITE ENGINEERING:SABAL PALMS	2025-09-12 01:07:37.981	2025-09-12 01:07:37.981
cmfg5177n00mhovbo2zmivo5v	DOWNRITE ENGINEERING:SALERNO EAST SUB DIVISION [ 2024-056 ]	2025-09-12 01:07:38.052	2025-09-12 01:07:38.052
cmfg5179o00miovbophm3knbb	DOWNRITE ENGINEERING:SANDY KEY RAILING	2025-09-12 01:07:38.124	2025-09-12 01:07:38.124
cmfg517br00mjovbo4mv1bl5c	DOWNRITE ENGINEERING:SAVANNA SOUTH [ 2024-024 ]	2025-09-12 01:07:38.2	2025-09-12 01:07:38.2
cmfg517dw00mkovbou1n4vqz5	DOWNRITE ENGINEERING:SOUTH FL LOGISTICS OFFSITE	2025-09-12 01:07:38.277	2025-09-12 01:07:38.277
cmfg517fw00mlovbo1z58xyu7	DOWNRITE ENGINEERING:SOUTH FLORIDA LOGISTICS ACCESS ROAD	2025-09-12 01:07:38.348	2025-09-12 01:07:38.348
cmfg517hw00mmovbo7tt6ekrk	DOWNRITE ENGINEERING:ST. MORITZ	2025-09-12 01:07:38.421	2025-09-12 01:07:38.421
cmfg517jz00mnovbo4twjjzkp	DOWNRITE ENGINEERING:TRADITION AT KENDALL	2025-09-12 01:07:38.495	2025-09-12 01:07:38.495
cmfg517lz00moovboya7k0wz9	DOWNRITE ENGINEERING:UNIVERSITY DRIVE	2025-09-12 01:07:38.568	2025-09-12 01:07:38.568
cmfg517o000mpovboau1t6crn	DOWNRITE ENGINEERING:VENITIAN PARK WEST	2025-09-12 01:07:38.641	2025-09-12 01:07:38.641
cmfg517q000mqovbot65dx52q	DOWNRITE ENGINEERING:VINTAGE ESTATES	2025-09-12 01:07:38.713	2025-09-12 01:07:38.713
cmfg517s000mrovbo9x216d2s	DOWNRITE ENGINEERING:VISTA LAGO	2025-09-12 01:07:38.784	2025-09-12 01:07:38.784
cmfg517tz00msovbojf3lg6ut	DOWNRITE ENGINEERING:WALMART SW 288 ST	2025-09-12 01:07:38.856	2025-09-12 01:07:38.856
cmfg517w000mtovbo0dhb43xs	DP DEVELOPMENT LLC	2025-09-12 01:07:38.928	2025-09-12 01:07:38.928
cmfg517xz00muovbo7zk226jz	DP DEVELOPMENT LLC:CHEETAH YARD	2025-09-12 01:07:38.999	2025-09-12 01:07:38.999
cmfg517zz00mvovboj4cv45gh	DP DEVELOPMENT LLC:DAVIE RD BRIDGE - 19210	2025-09-12 01:07:39.072	2025-09-12 01:07:39.072
cmfg5181z00mwovbotf5749fx	DP DEVELOPMENT LLC:FLAMINGO GREENWAY	2025-09-12 01:07:39.143	2025-09-12 01:07:39.143
cmfg5184000mxovbo71i9wxlo	DP DEVELOPMENT LLC:HBMD - PROJECT# 2021-1-98 & 2021-2-1-98	2025-09-12 01:07:39.217	2025-09-12 01:07:39.217
cmfg5186300myovboobqb7eck	DP DEVELOPMENT LLC:JOB NO. 23-047	2025-09-12 01:07:39.292	2025-09-12 01:07:39.292
cmfg5188300mzovbo060eowo8	DRAGADOS-BAKER, JV	2025-09-12 01:07:39.363	2025-09-12 01:07:39.363
cmfg518a800n0ovboa4k4se0n	DRAGADOS BAKER	2025-09-12 01:07:39.441	2025-09-12 01:07:39.441
cmfg518c900n1ovbobtzcj7w0	DRAGADOS USA	2025-09-12 01:07:39.513	2025-09-12 01:07:39.513
cmfg518e800n2ovbo0p5hsvwd	DRAGADOS USA:DRAGADOS SEGMEND D	2025-09-12 01:07:39.585	2025-09-12 01:07:39.585
cmfg518g700n3ovbofhu50prz	DRAGADOS USA:DRAGADOS SEGMENT E	2025-09-12 01:07:39.655	2025-09-12 01:07:39.655
cmfg518i600n4ovbo873wccyr	DRAGADOS USA:I-75 SEGMENT E	2025-09-12 01:07:39.727	2025-09-12 01:07:39.727
cmfg518k700n5ovbo5ro6ob4u	DRAGADOS USA:PO I75-027	2025-09-12 01:07:39.8	2025-09-12 01:07:39.8
cmfg518my00n6ovbotd7a3wj1	DRAGADOS USA:SR838/ SUNRISE	2025-09-12 01:07:39.899	2025-09-12 01:07:39.899
cmfg518oz00n7ovbovr1q4qyv	DRAGADOS USA:SUNRISE BRIDGE	2025-09-12 01:07:39.971	2025-09-12 01:07:39.971
cmfg518qy00n8ovbo9grx3640	DRBG.C MANAGMENT LLC	2025-09-12 01:07:40.042	2025-09-12 01:07:40.042
cmfg518t200n9ovbomvvs601r	DS REALTY, INC.	2025-09-12 01:07:40.118	2025-09-12 01:07:40.118
cmfg518v200naovbo753td4ne	DUCT DUDES INC	2025-09-12 01:07:40.19	2025-09-12 01:07:40.19
cmfg518x200nbovbol2fq7ol7	DUFRY INTL OPERATIONS& SERVICES, INC	2025-09-12 01:07:40.262	2025-09-12 01:07:40.262
cmfg518z600ncovboj1yp2fo6	DUGLAS OR PLUMBING	2025-09-12 01:07:40.339	2025-09-12 01:07:40.339
cmfg5191700ndovbo865mwv5n	DUKE REALTY	2025-09-12 01:07:40.411	2025-09-12 01:07:40.411
cmfg5193700neovboxxrle90c	DUKE REALTY:DUKE FENCE	2025-09-12 01:07:40.483	2025-09-12 01:07:40.483
cmfg5195b00nfovboubqbq2ps	DUNN CONSTRUCTION	2025-09-12 01:07:40.559	2025-09-12 01:07:40.559
cmfg5197b00ngovbobeewaohy	DURCON CONSTRUCTION, LLC	2025-09-12 01:07:40.631	2025-09-12 01:07:40.631
cmfg5199b00nhovbo2thmiphs	DUSPUIS POINTE LLC	2025-09-12 01:07:40.703	2025-09-12 01:07:40.703
cmfg519bb00niovbor7mj7unf	DYNAMIC COSTRUCTION GROUP INC	2025-09-12 01:07:40.775	2025-09-12 01:07:40.775
cmfg519df00njovbocvg1tvsg	DYNAMIC TRACKERS CORP	2025-09-12 01:07:40.852	2025-09-12 01:07:40.852
cmfg519g900nkovbozzm0iuqe	E & S LANDSCAPING	2025-09-12 01:07:40.954	2025-09-12 01:07:40.954
cmfg519ig00nlovboyjwwy0db	E B DEVELOPMENT LLC	2025-09-12 01:07:41.032	2025-09-12 01:07:41.032
cmfg519kk00nmovbox48d9r8r	E GOMEZ CONSTRUCTION	2025-09-12 01:07:41.109	2025-09-12 01:07:41.109
cmfg519mk00nnovbodvm85q3n	E GOMEZ CONSTRUCTION INC	2025-09-12 01:07:41.18	2025-09-12 01:07:41.18
cmfg519pn00noovboto6xyfeq	E&M EQUIPMENT CORP	2025-09-12 01:07:41.292	2025-09-12 01:07:41.292
cmfg519rs00npovbo1yejo424	E.L.C.I CONSTRUCTION GROUP, INC	2025-09-12 01:07:41.368	2025-09-12 01:07:41.368
cmfg519ts00nqovbodeqg0r8g	E11EVEN MIAMI	2025-09-12 01:07:41.44	2025-09-12 01:07:41.44
cmfg519vs00nrovbodq69az9i	EAC Consulting, Inc.	2025-09-12 01:07:41.513	2025-09-12 01:07:41.513
cmfg519xr00nsovbob8ifpx7j	EAGLE RECYLYING LLC	2025-09-12 01:07:41.584	2025-09-12 01:07:41.584
cmfg519zv00ntovbo6l7uddkm	EARL HOLDA	2025-09-12 01:07:41.659	2025-09-12 01:07:41.659
cmfg51a1x00nuovbo0jabzx3e	EAST EVERGLADES	2025-09-12 01:07:41.733	2025-09-12 01:07:41.733
cmfg51a3v00nvovbodsni66y1	EAU GALLIE ELECTRIC	2025-09-12 01:07:41.804	2025-09-12 01:07:41.804
cmfg51a5x00nwovbou38eqtb3	EBSARY FOUNDATION COMPANY	2025-09-12 01:07:41.877	2025-09-12 01:07:41.877
cmfg51a7y00nxovbodn3v8yxw	ECO POWER FLORIDA LLC	2025-09-12 01:07:41.951	2025-09-12 01:07:41.951
cmfg51aa400nyovbopryh4s7h	EcoCentric Partners, LLC	2025-09-12 01:07:42.028	2025-09-12 01:07:42.028
cmfg51ad400nzovboofavh3ow	ECONSTRUCTION OF SOUTH FL, INC	2025-09-12 01:07:42.136	2025-09-12 01:07:42.136
cmfg51af400o0ovboe4bkpfxc	ECS	2025-09-12 01:07:42.208	2025-09-12 01:07:42.208
cmfg51ah500o1ovbokt34rlyy	ED'S ISLAND TIME SERVICES	2025-09-12 01:07:42.281	2025-09-12 01:07:42.281
cmfg51aj400o2ovbobxkt3ajp	ED PEREZ	2025-09-12 01:07:42.353	2025-09-12 01:07:42.353
cmfg51al500o3ovbo5bn1zu7q	EDDIE MAXWELL	2025-09-12 01:07:42.425	2025-09-12 01:07:42.425
cmfg51an300o4ovbo7ezk4izs	EDEL INDUSTRAIL CORP	2025-09-12 01:07:42.495	2025-09-12 01:07:42.495
cmfg51ap300o5ovbou6ip4v2k	EDEN ISLES CONDOS	2025-09-12 01:07:42.567	2025-09-12 01:07:42.567
cmfg51ar300o6ovbof0rjz22m	EDGEWATER CONSTRUCTION	2025-09-12 01:07:42.64	2025-09-12 01:07:42.64
cmfg51at500o7ovboqzn7bbwm	EDUARDO HIMENEZ	2025-09-12 01:07:42.713	2025-09-12 01:07:42.713
cmfg51av400o8ovbon8gobch5	EDUARDO R. JIMENEZ	2025-09-12 01:07:42.785	2025-09-12 01:07:42.785
cmfg51ax300o9ovbop9hgf355	EDWARD A. MATSON, INC.	2025-09-12 01:07:42.856	2025-09-12 01:07:42.856
cmfg51az300oaovboojyn7yz8	EEI	2025-09-12 01:07:42.928	2025-09-12 01:07:42.928
cmfg51b1200obovbop9zay4mq	EFFICIENT CONSTRUCTION ENTERPRISE, INC	2025-09-12 01:07:42.999	2025-09-12 01:07:42.999
cmfg51b3000ocovboygy2r8ua	ELENA MOROZOVA	2025-09-12 01:07:43.068	2025-09-12 01:07:43.068
cmfg51b4z00odovboi7iq6s76	ELIEL AVILA	2025-09-12 01:07:43.14	2025-09-12 01:07:43.14
cmfg51b6z00oeovboh7ob35q9	ELIO CIOCCA	2025-09-12 01:07:43.211	2025-09-12 01:07:43.211
cmfg51b9100ofovbop99sxlb4	ELITE RETAIL SERVICES, INC	2025-09-12 01:07:43.286	2025-09-12 01:07:43.286
cmfg51bb200ogovbozzle39pj	ELIZABETH MARTINEZ	2025-09-12 01:07:43.358	2025-09-12 01:07:43.358
cmfg51bd500ohovboljynt3qi	EMERALD CONSTRUCTION CORP	2025-09-12 01:07:43.434	2025-09-12 01:07:43.434
cmfg51bf500oiovbozpy4aen6	EMMA DUDA	2025-09-12 01:07:43.505	2025-09-12 01:07:43.505
cmfg51bha00ojovbofye42hur	EMPIRA GROUP LLC	2025-09-12 01:07:43.583	2025-09-12 01:07:43.583
cmfg51bje00okovboz2y07l3a	EMPIRE RESTORATION & CONSTRUCTION INC	2025-09-12 01:07:43.658	2025-09-12 01:07:43.658
cmfg51blf00olovbo41bim1i7	ENCO LLC	2025-09-12 01:07:43.731	2025-09-12 01:07:43.731
cmfg51bnj00omovbo5fy9v3b3	ENERGY SERVICES SOUTH LLC	2025-09-12 01:07:43.807	2025-09-12 01:07:43.807
cmfg51bpm00onovbohqk9d8be	ENGIEERED ENVIROMENTS, INC	2025-09-12 01:07:43.883	2025-09-12 01:07:43.883
cmfg51brm00ooovbommov5a9f	ENGINE PARTS DEPO	2025-09-12 01:07:43.954	2025-09-12 01:07:43.954
cmfg51btl00opovbovo7wkfsy	ENGINEERING AND CONSULTING	2025-09-12 01:07:44.026	2025-09-12 01:07:44.026
cmfg51bvn00oqovbo02iw2atu	ENTERPRISE ELECTRICAL CONTRACTING	2025-09-12 01:07:44.099	2025-09-12 01:07:44.099
cmfg51bxn00orovboc9mx0a04	ENVIRO-TECH SYSTEMS, INC	2025-09-12 01:07:44.171	2025-09-12 01:07:44.171
cmfg51bzr00osovboeao75hmv	EPIC CONSTRUCTION SOLUTIONS, LLC	2025-09-12 01:07:44.248	2025-09-12 01:07:44.248
cmfg51c1u00otovboisep5bp7	EPIC CONSULTANTS, INC	2025-09-12 01:07:44.323	2025-09-12 01:07:44.323
cmfg51c3v00ouovbog1sk05dj	EQUIPMENT AND TOOL SOLUTION	2025-09-12 01:07:44.395	2025-09-12 01:07:44.395
cmfg51c5z00ovovbojd0mnqha	ER CUSTOMS	2025-09-12 01:07:44.471	2025-09-12 01:07:44.471
cmfg51c7z00owovboel7i1rci	ERE CORP.	2025-09-12 01:07:44.544	2025-09-12 01:07:44.544
cmfg51ca400oxovbog0ixku4q	ERIC ANDERSEN	2025-09-12 01:07:44.62	2025-09-12 01:07:44.62
cmfg51cc300oyovboa0azkjwn	ERIC ROJO - HALLEY ENG	2025-09-12 01:07:44.692	2025-09-12 01:07:44.692
cmfg51ce300ozovbofcwj4w65	ERMINIA MANYA	2025-09-12 01:07:44.763	2025-09-12 01:07:44.763
cmfg51cgh00p0ovboa0hcnlrz	ERMITA DE LA CARIDAD	2025-09-12 01:07:44.85	2025-09-12 01:07:44.85
cmfg51cih00p1ovbo86qjz64u	ERNIE GONZALEZ	2025-09-12 01:07:44.922	2025-09-12 01:07:44.922
cmfg51ckh00p2ovboygmdrm3k	ESTEVEZ TILE & MARBLE	2025-09-12 01:07:44.993	2025-09-12 01:07:44.993
cmfg51cmh00p3ovbohbtifp8d	ESTORIL APTS	2025-09-12 01:07:45.065	2025-09-12 01:07:45.065
cmfg51cog00p4ovboln3e4smt	EVANKOFF CONSTRUCTION	2025-09-12 01:07:45.136	2025-09-12 01:07:45.136
cmfg51cqf00p5ovbo4512xstc	EVERGLADES CONTRACTING	2025-09-12 01:07:45.208	2025-09-12 01:07:45.208
cmfg51csi00p6ovbo8h87n975	EVERGLADES MECHANICAL SERVICE	2025-09-12 01:07:45.282	2025-09-12 01:07:45.282
cmfg51cun00p7ovbo4umjpef7	EVERGLADES PREPATROY ACADEMY	2025-09-12 01:07:45.359	2025-09-12 01:07:45.359
cmfg51cwn00p8ovbobvd0tyyg	EVERGLADES RESTORATION	2025-09-12 01:07:45.431	2025-09-12 01:07:45.431
cmfg51cyn00p9ovbosixdxrot	EVERGREEN NATIONAL INDEMNITY CORP.	2025-09-12 01:07:45.503	2025-09-12 01:07:45.503
cmfg51d0k00paovbozcwdswwq	EXCEL MANAGEMENT ASSOCIATES INC	2025-09-12 01:07:45.573	2025-09-12 01:07:45.573
cmfg51d2m00pbovbo1qwn4yti	EXPRESS CONSOLIDATION SYSTEM	2025-09-12 01:07:45.646	2025-09-12 01:07:45.646
cmfg51d4q00pcovbo2xyl38th	EXPRESS LANDSCAPE-	2025-09-12 01:07:45.722	2025-09-12 01:07:45.722
cmfg51d6y00pdovboclvsc86i	EXTRA SPACE STORAGE-	2025-09-12 01:07:45.802	2025-09-12 01:07:45.802
cmfg51d9600peovboe6iheu49	EXTRA SPACE STORAGE-:0206	2025-09-12 01:07:45.882	2025-09-12 01:07:45.882
cmfg51db900pfovbo2g4ype1m	EXTRA SPACE STORAGE-:0255	2025-09-12 01:07:45.957	2025-09-12 01:07:45.957
cmfg51ddd00pgovbo2t2dgpui	EXTRA SPACE STORAGE-:1424	2025-09-12 01:07:46.033	2025-09-12 01:07:46.033
cmfg51dfd00phovbodtwnmcyt	EXTRA SPACE STORAGE-:1424- Hammocks	2025-09-12 01:07:46.106	2025-09-12 01:07:46.106
cmfg51dhh00piovbok863zcrj	EXTRA SPACE STORAGE-:8133	2025-09-12 01:07:46.181	2025-09-12 01:07:46.181
cmfg51dji00pjovboavoktdqd	EXTRA SPACE STORAGE-:8144	2025-09-12 01:07:46.254	2025-09-12 01:07:46.254
cmfg51dlm00pkovbofnp5nxn8	EXTRA SPACE STORAGE-:ISAREL MARTINEZ	2025-09-12 01:07:46.33	2025-09-12 01:07:46.33
cmfg51dnp00plovbojzsyqlou	EXTRA SPACE STORAGE-:TAMIAMI - SW 8 ST	2025-09-12 01:07:46.405	2025-09-12 01:07:46.405
cmfg51dpt00pmovbo63uickjt	EZFILL	2025-09-12 01:07:46.481	2025-09-12 01:07:46.481
cmfg51drt00pnovboqun4o9pl	f	2025-09-12 01:07:46.553	2025-09-12 01:07:46.553
cmfg51dtt00poovbok5lbpz8s	F.H. PASCHEN, SNNIELSEN, INC	2025-09-12 01:07:46.625	2025-09-12 01:07:46.625
cmfg51dvr00ppovbop7c2f16t	FABIO DELGADO	2025-09-12 01:07:46.696	2025-09-12 01:07:46.696
cmfg51dxs00pqovbo68455jk8	FABULOUS LINEN	2025-09-12 01:07:46.768	2025-09-12 01:07:46.768
cmfg51dzs00provbovmz1rtk5	FACCHINA	2025-09-12 01:07:46.841	2025-09-12 01:07:46.841
cmfg51e1r00psovbolo7iwyd0	FACCHINA CONSTRUCTION	2025-09-12 01:07:46.911	2025-09-12 01:07:46.911
cmfg51e3s00ptovboj12nlri7	FAIR STEAD	2025-09-12 01:07:46.984	2025-09-12 01:07:46.984
cmfg51e5r00puovboatqln7xd	FAITH DELIVERANCE CATHEDRAL	2025-09-12 01:07:47.056	2025-09-12 01:07:47.056
cmfg51e7s00pvovbobf2wm7st	FALCON 6 INFRASTRUCTURE GROUP	2025-09-12 01:07:47.128	2025-09-12 01:07:47.128
cmfg51e9s00pwovbod0ptta0j	FALLEN LEAVES RECOVERY	2025-09-12 01:07:47.2	2025-09-12 01:07:47.2
cmfg51ebx00pxovbod80qo8va	FAMIS	2025-09-12 01:07:47.277	2025-09-12 01:07:47.277
cmfg51edw00pyovbovmvbxs3g	FATHER & SON TRANSMISSION INC.	2025-09-12 01:07:47.348	2025-09-12 01:07:47.348
cmfg51efv00pzovbo7vkrzimv	FAUSTINO GARCIA	2025-09-12 01:07:47.42	2025-09-12 01:07:47.42
cmfg51ehw00q0ovbo9vo0p4vy	FBD CONTRACTING GROUP	2025-09-12 01:07:47.492	2025-09-12 01:07:47.492
cmfg51ejv00q1ovbodqhvg4iu	FCC CITIZEN SERVICES	2025-09-12 01:07:47.563	2025-09-12 01:07:47.563
cmfg51elw00q2ovbojg8yho9s	FCE BUILD	2025-09-12 01:07:47.636	2025-09-12 01:07:47.636
cmfg51enw00q3ovbonn74ic22	FCL BUILDERS	2025-09-12 01:07:47.708	2025-09-12 01:07:47.708
cmfg51epw00q4ovbogk6oqhj1	FCW ECD, LLC	2025-09-12 01:07:47.78	2025-09-12 01:07:47.78
cmfg51erz00q5ovboojgre4ju	FDG HIALEAH LLC	2025-09-12 01:07:47.856	2025-09-12 01:07:47.856
cmfg51eu400q6ovbo0nrx7s98	FDG HIALEAH LLC:S. FL LOGISTICS	2025-09-12 01:07:47.932	2025-09-12 01:07:47.932
cmfg51ew300q7ovboei9eyimy	FDOT LETTINGS	2025-09-12 01:07:48.003	2025-09-12 01:07:48.003
cmfg51ey400q8ovbopidm0ew0	FECC, INC	2025-09-12 01:07:48.076	2025-09-12 01:07:48.076
cmfg51f0400q9ovbopv1jq8g4	Felix Monson	2025-09-12 01:07:48.148	2025-09-12 01:07:48.148
cmfg51f2900qaovboupv2ycpe	FENCE SOLUTIONS	2025-09-12 01:07:48.225	2025-09-12 01:07:48.225
cmfg51f4800qbovbo7u3fcrhp	FERNANDEZ BRENA INTERIOR DESIGN	2025-09-12 01:07:48.296	2025-09-12 01:07:48.296
cmfg51f6700qcovbo5lmalofu	FERREIRA CONSTRUCTION COMPANY	2025-09-12 01:07:48.367	2025-09-12 01:07:48.367
cmfg51f8900qdovbo1kceqsah	FERREIRA CONSTRUCTION COMPANY:2275 SW 27 ST	2025-09-12 01:07:48.441	2025-09-12 01:07:48.441
cmfg51fa900qeovboaslk3iqa	FERREIRA CONSTRUCTION COMPANY:4314-2021-008	2025-09-12 01:07:48.514	2025-09-12 01:07:48.514
cmfg51fc900qfovboeeg8qvky	FERREIRA CONSTRUCTION COMPANY:4360-2022-001	2025-09-12 01:07:48.585	2025-09-12 01:07:48.585
cmfg51feb00qgovbo0j6ggyyk	FERREIRA CONSTRUCTION COMPANY:FCC4495-10410 NW SOUTH RIVER DR	2025-09-12 01:07:48.659	2025-09-12 01:07:48.659
cmfg51fgj00qhovbowduznqub	FERREIRA CONSTRUCTION COMPANY:FPL - SUNRISE CENTRAL	2025-09-12 01:07:48.739	2025-09-12 01:07:48.739
cmfg51fij00qiovbouhuqomzh	FERREIRA CONSTRUCTION COMPANY:Harry Harris Park	2025-09-12 01:07:48.811	2025-09-12 01:07:48.811
cmfg51fkj00qjovbofj6a4lb1	FERREIRA CONSTRUCTION COMPANY:JOB 4460 HOLLYWOOD WOOD	2025-09-12 01:07:48.883	2025-09-12 01:07:48.883
cmfg51fmn00qkovboayqrzic6	FERREIRA CONSTRUCTION COMPANY:NOVEN PHARAMCEUTICALS	2025-09-12 01:07:48.959	2025-09-12 01:07:48.959
cmfg51foo00qlovboge9ujyqc	FERREIRA CONSTRUCTION COMPANY:PROJECT# 4724 - HIALEAH UTILITY RELOCATIO	2025-09-12 01:07:49.032	2025-09-12 01:07:49.032
cmfg51fqo00qmovbo6732zmyn	FERREIRA CONSTRUCTION COMPANY:SALT WATER	2025-09-12 01:07:49.104	2025-09-12 01:07:49.104
cmfg51fsn00qnovboxsnypl8k	FERREIRA CONSTRUCTION COMPANY:T6528 - W 20 ST	2025-09-12 01:07:49.176	2025-09-12 01:07:49.176
cmfg51fup00qoovbo8pcu710b	FERREIRA CONSTRUCTION COMPANY:TWIN LAKES KEY LARGO	2025-09-12 01:07:49.25	2025-09-12 01:07:49.25
cmfg51fwt00qpovbo4rjkt7qy	FERREIRA CONSTRUCTION COMPANY:WASD S888	2025-09-12 01:07:49.326	2025-09-12 01:07:49.326
cmfg51fyt00qqovbo9s3pla3j	FERREIRA POWER SOUTH	2025-09-12 01:07:49.397	2025-09-12 01:07:49.397
cmfg51g0t00qrovboawvfgsq2	FFF PROPERTIES	2025-09-12 01:07:49.47	2025-09-12 01:07:49.47
cmfg51g2y00qsovbo16i5m268	FG CONSTRUCTION LLC	2025-09-12 01:07:49.546	2025-09-12 01:07:49.546
cmfg51g4x00qtovboixc0oq7r	FHP TECTONICS CORP.	2025-09-12 01:07:49.618	2025-09-12 01:07:49.618
cmfg51g7200quovbo6gxh8fc7	FIDI & ALBERT	2025-09-12 01:07:49.694	2025-09-12 01:07:49.694
cmfg51g8y00qvovbob9nhcpdi	FIGUEREDO LANDSCAPING INC	2025-09-12 01:07:49.762	2025-09-12 01:07:49.762
cmfg51gb100qwovbopnzmiiez	FILLING STATION LOFTS	2025-09-12 01:07:49.837	2025-09-12 01:07:49.837
cmfg51gd500qxovbo4ajavjhu	FILTER KING LLC	2025-09-12 01:07:49.914	2025-09-12 01:07:49.914
cmfg51gf600qyovbodohuz0qf	FIRST FLORIDA BUILDERS, LTD.	2025-09-12 01:07:49.986	2025-09-12 01:07:49.986
cmfg51gh600qzovbofsb90y46	FIRST SERVICE RESIDENTIAL	2025-09-12 01:07:50.059	2025-09-12 01:07:50.059
cmfg51gj700r0ovbo7e02bo27	FISHER ISLAND COMMUNITY ASSOC.	2025-09-12 01:07:50.131	2025-09-12 01:07:50.131
cmfg51gl600r1ovbot700isgd	FIU	2025-09-12 01:07:50.203	2025-09-12 01:07:50.203
cmfg51gne00r2ovboq4gggagw	FIU - NORTH CAMPUS	2025-09-12 01:07:50.283	2025-09-12 01:07:50.283
cmfg51gpj00r3ovboncozng4i	FL CARRIER	2025-09-12 01:07:50.359	2025-09-12 01:07:50.359
cmfg51grj00r4ovbo08kz51yv	FL KEY'S AQUA DUCT	2025-09-12 01:07:50.431	2025-09-12 01:07:50.431
cmfg51gto00r5ovboeq2to86x	FLAGER GLOBAL LOGISTICS	2025-09-12 01:07:50.508	2025-09-12 01:07:50.508
cmfg51gvx00r6ovbo00s871l2	FLAGLER DEVELOPMENT-	2025-09-12 01:07:50.589	2025-09-12 01:07:50.589
cmfg51gxw00r7ovbo76zeve21	FLAGLER MAGIC CASINO	2025-09-12 01:07:50.661	2025-09-12 01:07:50.661
cmfg51gzw00r8ovbo6vd3nard	FLAGSTONE PROPERTY GROUP	2025-09-12 01:07:50.732	2025-09-12 01:07:50.732
cmfg51h2000r9ovbokwcxti6t	FLAMINGO	2025-09-12 01:07:50.808	2025-09-12 01:07:50.808
cmfg51h4100raovbo6ldycl7t	FLEX TECHNOLOGY	2025-09-12 01:07:50.881	2025-09-12 01:07:50.881
cmfg51h6100rbovbog6jpziu8	FLORENCIA	2025-09-12 01:07:50.954	2025-09-12 01:07:50.954
cmfg51h8000rcovbok43554pr	Florida's Turnpike Operations Center	2025-09-12 01:07:51.025	2025-09-12 01:07:51.025
cmfg51h9z00rdovboh7oba2f9	FLORIDA 595 TRUCKSTOP	2025-09-12 01:07:51.095	2025-09-12 01:07:51.095
cmfg51hcd00reovbo6l9lca6d	FLORIDA ARMY NATIONAL GUARD	2025-09-12 01:07:51.181	2025-09-12 01:07:51.181
cmfg51hee00rfovboxr3z2ims	FLORIDA BEAUTY FLORA	2025-09-12 01:07:51.254	2025-09-12 01:07:51.254
cmfg51hgi00rgovbobzrl3ew7	FLORIDA BLACK TOP INC	2025-09-12 01:07:51.331	2025-09-12 01:07:51.331
cmfg51hii00rhovbo7m9m064d	FLORIDA CITY GAS	2025-09-12 01:07:51.403	2025-09-12 01:07:51.403
cmfg51hkm00riovbo8dbco5xg	FLORIDA CONSTRUCTION & ENGINEERING, INC.	2025-09-12 01:07:51.478	2025-09-12 01:07:51.478
cmfg51hmr00rjovbodx6uijrd	FLORIDA DEPT OF TRANSPORTATION	2025-09-12 01:07:51.555	2025-09-12 01:07:51.555
cmfg51hoq00rkovbovapellm3	FLORIDA DEPT. OF ENVIRONMENTAL PROTECTION	2025-09-12 01:07:51.626	2025-09-12 01:07:51.626
cmfg51hqq00rlovboy93js69t	FLORIDA DESIGN CONTRACTORS, INC	2025-09-12 01:07:51.699	2025-09-12 01:07:51.699
cmfg51hsr00rmovbouxyn870o	FLORIDA DOG TRACK	2025-09-12 01:07:51.771	2025-09-12 01:07:51.771
cmfg51huq00rnovbobadisyn1	FLORIDA DRAWBRIDGE	2025-09-12 01:07:51.843	2025-09-12 01:07:51.843
cmfg51hwr00roovboimpzbt38	FLORIDA EAST COAST REALTY, LLC	2025-09-12 01:07:51.915	2025-09-12 01:07:51.915
cmfg51hyr00rpovboms3hy87s	FLORIDA EAST COAST REALTY, LLC:T4607	2025-09-12 01:07:51.987	2025-09-12 01:07:51.987
cmfg51i0r00rqovboh0cznxqu	FLORIDA ENGINEERING & DEVELOPMENT CORP.	2025-09-12 01:07:52.059	2025-09-12 01:07:52.059
cmfg51i2q00rrovbo11e67ztf	FLORIDA ENGINEERING & DEVELOPMENT CORP.:CORAL NOOK CIRCLE	2025-09-12 01:07:52.13	2025-09-12 01:07:52.13
cmfg51i4q00rsovbo077r83of	FLORIDA ENGINEERING & DEVELOPMENT CORP.:E4W70	2025-09-12 01:07:52.202	2025-09-12 01:07:52.202
cmfg51i6u00rtovbor8l8qv6p	FLORIDA ENGINEERING & DEVELOPMENT CORP.:NW 11 ST	2025-09-12 01:07:52.278	2025-09-12 01:07:52.278
cmfg51i8u00ruovbotbejtrrt	FLORIDA ENGINEERING & DEVELOPMENT CORP.:T4607	2025-09-12 01:07:52.35	2025-09-12 01:07:52.35
cmfg51iay00rvovbo507jh4go	FLORIDA ENGINEERING & DEVELOPMENT CORP.:T6546	2025-09-12 01:07:52.426	2025-09-12 01:07:52.426
cmfg51id200rwovboec0w89sd	FLORIDA ENGINEERING & DEVELOPMENT CORP.:T6546 PO	2025-09-12 01:07:52.502	2025-09-12 01:07:52.502
cmfg51if300rxovbo1askbva2	FLORIDA ENGINEERING & DEVELOPMENT CORP.:T6548	2025-09-12 01:07:52.575	2025-09-12 01:07:52.575
cmfg51ih300ryovboelaopwhv	FLORIDA ENGINEERING & DEVELOPMENT CORP.:T6570	2025-09-12 01:07:52.647	2025-09-12 01:07:52.647
cmfg51ijf00rzovbojbk7opzy	FLORIDA EXECUTIVE BUILDERS	2025-09-12 01:07:52.731	2025-09-12 01:07:52.731
cmfg51ilf00s0ovbowvry4oco	FLORIDA FRESH	2025-09-12 01:07:52.804	2025-09-12 01:07:52.804
cmfg51ing00s1ovbodv76hrsx	FLORIDA GAS TRANSMISSION	2025-09-12 01:07:52.877	2025-09-12 01:07:52.877
cmfg51ipg00s2ovbo5fmioqpz	FLORIDA INDUSTRIAL WASTE	2025-09-12 01:07:52.949	2025-09-12 01:07:52.949
cmfg51irk00s3ovbof4fr6fg4	FLORIDA INTERNATIONAL ENTERPRISES	2025-09-12 01:07:53.025	2025-09-12 01:07:53.025
cmfg51itk00s4ovbouq13629g	FLORIDA KENNEL	2025-09-12 01:07:53.096	2025-09-12 01:07:53.096
cmfg51ivk00s5ovbod90y65fw	FLORIDA KEY'S AQUADUCT	2025-09-12 01:07:53.168	2025-09-12 01:07:53.168
cmfg51ixl00s6ovbo5xf2ca56	FLORIDA KEYS, AQUEDUCT AUTHORITY	2025-09-12 01:07:53.242	2025-09-12 01:07:53.242
cmfg51izl00s7ovboe8d0km6j	FLORIDA LEMARK	2025-09-12 01:07:53.314	2025-09-12 01:07:53.314
cmfg51j1o00s8ovbo1w0jx212	FLORIDA NET	2025-09-12 01:07:53.388	2025-09-12 01:07:53.388
cmfg51j3t00s9ovbolfx0y4sz	FLORIDA OF ENVIORNMRNTAL PROTECTION	2025-09-12 01:07:53.465	2025-09-12 01:07:53.465
cmfg51j5s00saovbo1kaqk5h5	FLORIDA PAVING & TRUCKING	2025-09-12 01:07:53.536	2025-09-12 01:07:53.536
cmfg51j7r00sbovboy7nm4uej	FLORIDA PROPERTY MANAGEMENT	2025-09-12 01:07:53.608	2025-09-12 01:07:53.608
cmfg51j9t00scovbobj7nzecy	FLORIDA PROPERTY MANAGEMENT SOLUTIONS	2025-09-12 01:07:53.681	2025-09-12 01:07:53.681
cmfg51jbt00sdovbo8a2osxfs	FLORIDA SOL	2025-09-12 01:07:53.753	2025-09-12 01:07:53.753
cmfg51jdt00seovboq3ki3i70	FLORIDA STEVEDORING	2025-09-12 01:07:53.825	2025-09-12 01:07:53.825
cmfg51jfs00sfovbowx3548tz	FLORIDA SUPPLEMENT	2025-09-12 01:07:53.896	2025-09-12 01:07:53.896
cmfg51jhr00sgovbobhdug447	FLORIDA TUBE CORPORATION	2025-09-12 01:07:53.968	2025-09-12 01:07:53.968
cmfg51jjo00shovbobpb0irqa	FLORIDA TURNPIKE	2025-09-12 01:07:54.037	2025-09-12 01:07:54.037
cmfg51jlq00siovbomsgpgcdw	FLORIDA TURNPIKE:E8K71-R1	2025-09-12 01:07:54.11	2025-09-12 01:07:54.11
cmfg51jnq00sjovboumnyf280	FLORIDA TURNPIKE:E8K71-R2	2025-09-12 01:07:54.182	2025-09-12 01:07:54.182
cmfg51jpq00skovbowhc67wj4	FLORIDA TURNPIKE:Job 1	2025-09-12 01:07:54.255	2025-09-12 01:07:54.255
cmfg51jrq00slovbo0m68a37b	FLORIDIAN BUILDERS	2025-09-12 01:07:54.326	2025-09-12 01:07:54.326
cmfg51jtu00smovbogpfho0x2	FLORIDIAN ISLES	2025-09-12 01:07:54.403	2025-09-12 01:07:54.403
cmfg51jvt00snovbopivb6p19	FLOWER AND SERVICES	2025-09-12 01:07:54.474	2025-09-12 01:07:54.474
cmfg51jxx00soovbo2toz16u1	FLOWER CONSTRUCTION	2025-09-12 01:07:54.55	2025-09-12 01:07:54.55
cmfg51jzy00spovboa314g6lx	FLUOR-ASTALDI-MCM	2025-09-12 01:07:54.622	2025-09-12 01:07:54.622
cmfg51k1y00sqovbo0ginlgos	FOCUS MANAGEMENT GROUP	2025-09-12 01:07:54.695	2025-09-12 01:07:54.695
cmfg51k3u00srovboev8oeb05	FONTAINEBLEAU DEVELOPMENT	2025-09-12 01:07:54.763	2025-09-12 01:07:54.763
cmfg51k5y00ssovbo71bmrpmm	FONTAINEBLEAU DEVELOPMENT:1500 BEACH RD	2025-09-12 01:07:54.838	2025-09-12 01:07:54.838
cmfg51k7x00stovboewj16aii	FONTAINEBLEAU DEVELOPMENT:FONTAINEBLEAU CONVENTION CENTER	2025-09-12 01:07:54.91	2025-09-12 01:07:54.91
cmfg51k9y00suovbojlh1iu8b	FONTAINEBLEAU DEVELOPMENT:FOUNTAINBLEAU HANGER #6&7	2025-09-12 01:07:54.983	2025-09-12 01:07:54.983
cmfg51kc300svovbo1n02q1p9	FONTAINEBLEAU DEVELOPMENT:SEA GLASS	2025-09-12 01:07:55.059	2025-09-12 01:07:55.059
cmfg51ke300swovbok2ykv2r5	FONTAINEBLEU AVIATION	2025-09-12 01:07:55.131	2025-09-12 01:07:55.131
cmfg51kg300sxovboprwfikuu	FORBES CONSTRUCTION	2025-09-12 01:07:55.204	2025-09-12 01:07:55.204
cmfg51ki400syovbo7yxyr8wg	FORD ENGINEERS INC	2025-09-12 01:07:55.276	2025-09-12 01:07:55.276
cmfg51kjv00szovboclc6vopi	FORESTAR	2025-09-12 01:07:55.339	2025-09-12 01:07:55.339
cmfg51klq00t0ovbopgsgb6xv	FORGEN	2025-09-12 01:07:55.406	2025-09-12 01:07:55.406
cmfg51knm00t1ovbovy6noiyl	FORT CAPITAL MANAGEMENT	2025-09-12 01:07:55.475	2025-09-12 01:07:55.475
cmfg51kpp00t2ovbo5j4tatqz	FORT LAUDRDALE INTERNATIONAL AIRPORT	2025-09-12 01:07:55.549	2025-09-12 01:07:55.549
cmfg51kro00t3ovbotv3l6opb	FORT PARTNERS	2025-09-12 01:07:55.62	2025-09-12 01:07:55.62
cmfg51ktn00t4ovboh4q85suk	FORTUNE CONSTRUCTION GROUP, INC.	2025-09-12 01:07:55.692	2025-09-12 01:07:55.692
cmfg51kvp00t5ovbotqarloyn	FORTUNE INTERNATIONAL	2025-09-12 01:07:55.766	2025-09-12 01:07:55.766
cmfg51kxl00t6ovbo9ruhah57	FORTUNE OCEAN	2025-09-12 01:07:55.833	2025-09-12 01:07:55.833
cmfg51kzg00t7ovboi97twbud	FOSTER COMPANY	2025-09-12 01:07:55.9	2025-09-12 01:07:55.9
cmfg51l1c00t8ovbo8ulf5siz	FOSTER CONSTRUCTION	2025-09-12 01:07:55.968	2025-09-12 01:07:55.968
cmfg51l3i00t9ovboarbthf7x	FOUNDRY COMMERCIAL	2025-09-12 01:07:56.046	2025-09-12 01:07:56.046
cmfg51l5c00taovborz6ead23	FOUNDRY COMMERICIAL	2025-09-12 01:07:56.113	2025-09-12 01:07:56.113
cmfg51l7a00tbovbogatyle7j	FOUNTAINBLEAU GARDENS CONDO	2025-09-12 01:07:56.182	2025-09-12 01:07:56.182
cmfg51l9a00tcovbop4kldhkh	FOUNTAINBLEAU RESORT & SPA	2025-09-12 01:07:56.255	2025-09-12 01:07:56.255
cmfg51lbb00tdovbowns9d1m5	FOUNTAINEBLEU AVIATION	2025-09-12 01:07:56.327	2025-09-12 01:07:56.327
cmfg51ldf00teovbojtu1dlh5	FOUR SEASONS CONDOMINIUM ASSOCIATION	2025-09-12 01:07:56.403	2025-09-12 01:07:56.403
cmfg51lfj00tfovborimakj4u	FOUR WALL GROUP	2025-09-12 01:07:56.48	2025-09-12 01:07:56.48
cmfg51lho00tgovbo67jurjo9	FRAME ART INC.	2025-09-12 01:07:56.556	2025-09-12 01:07:56.556
cmfg51ljs00thovboioi5d8t0	FRANCOIS FERNANDEZ & LIANED FERNANDEZ	2025-09-12 01:07:56.632	2025-09-12 01:07:56.632
cmfg51llr00tiovbouzzvtvrq	Frank	2025-09-12 01:07:56.704	2025-09-12 01:07:56.704
cmfg51lnx00tjovbo36n9lptz	FRANK ABAY	2025-09-12 01:07:56.781	2025-09-12 01:07:56.781
cmfg51lq400tkovboe4937ohz	FRANK ANDREU	2025-09-12 01:07:56.86	2025-09-12 01:07:56.86
cmfg51ls300tlovboe5plre4k	FRANK FRANCO	2025-09-12 01:07:56.932	2025-09-12 01:07:56.932
cmfg51lu400tmovbo5m7v19oy	FRANK MIRANDA	2025-09-12 01:07:57.004	2025-09-12 01:07:57.004
cmfg51lw400tnovbopodhcu2a	FRANSICO LOPEZ	2025-09-12 01:07:57.077	2025-09-12 01:07:57.077
cmfg51lz600toovbo8kqyffa0	FRED HUNTER'S FUNERAL HOME	2025-09-12 01:07:57.186	2025-09-12 01:07:57.186
cmfg51m1600tpovboujxt371r	FREESTYLE FIGHTING ACADEMY	2025-09-12 01:07:57.259	2025-09-12 01:07:57.259
cmfg51m3600tqovbowjnxsd9c	FRONTIER BUILDING	2025-09-12 01:07:57.331	2025-09-12 01:07:57.331
cmfg51m5600trovboqedlcbsz	FRONTIER DEVELOPMENT-HILEAH , LLC	2025-09-12 01:07:57.403	2025-09-12 01:07:57.403
cmfg51m7900tsovbo2n6i864i	FRYED PROPERTIES	2025-09-12 01:07:57.478	2025-09-12 01:07:57.478
cmfg51m9b00ttovbo2lmgr83p	FULCRUM CONSTRUCTION	2025-09-12 01:07:57.551	2025-09-12 01:07:57.551
cmfg51mb900tuovbo023yxr0e	FULTON LIVING	2025-09-12 01:07:57.622	2025-09-12 01:07:57.622
cmfg51mda00tvovbor67bo95p	G-G FENCE	2025-09-12 01:07:57.694	2025-09-12 01:07:57.694
cmfg51mfb00twovbojvtv8sn8	G. BATISTA & ASSOCIATES	2025-09-12 01:07:57.767	2025-09-12 01:07:57.767
cmfg51mhe00txovboz9jyvyqo	G.C.	2025-09-12 01:07:57.843	2025-09-12 01:07:57.843
cmfg51mje00tyovbo80rcfdd2	G.T. MCDONALD ENTERPRISES, INC	2025-09-12 01:07:57.915	2025-09-12 01:07:57.915
cmfg51mla00tzovboliquuf3g	G7 CONSTRUCTION SERVICES, INC	2025-09-12 01:07:57.983	2025-09-12 01:07:57.983
cmfg51mna00u0ovboav5gkb5i	GALCA CONSTRUCTION CORP.	2025-09-12 01:07:58.054	2025-09-12 01:07:58.054
cmfg51mp600u1ovbo0rhqu18t	GALOWAY CONTRACTORS & BUILDERS.	2025-09-12 01:07:58.122	2025-09-12 01:07:58.122
cmfg51mr200u2ovbog8o7ycbq	GARCIAS RESTUARANT	2025-09-12 01:07:58.19	2025-09-12 01:07:58.19
cmfg51mt300u3ovbo9eylksft	GARDEN ISLAND INSTERNATIONAL LLC	2025-09-12 01:07:58.264	2025-09-12 01:07:58.264
cmfg51mv300u4ovbo4xgmcye5	GARDENSCAPES & SERVICES	2025-09-12 01:07:58.335	2025-09-12 01:07:58.335
cmfg51mx300u5ovbod93v6875	GARMAN SPECIALITY FOOD DISTRIBUTORS	2025-09-12 01:07:58.408	2025-09-12 01:07:58.408
cmfg51mz600u6ovbo218ss1eg	GARNEY CONSTRUCTION	2025-09-12 01:07:58.483	2025-09-12 01:07:58.483
cmfg51n1700u7ovbokfunkkbv	GATES INC	2025-09-12 01:07:58.555	2025-09-12 01:07:58.555
cmfg51n3200u8ovbod5dqupg4	GATEWAY PARK	2025-09-12 01:07:58.622	2025-09-12 01:07:58.622
cmfg51n5400u9ovboek2gs5w4	GATOR AUTOGLASS	2025-09-12 01:07:58.697	2025-09-12 01:07:58.697
cmfg51n7700uaovbocwa96blh	GBS	2025-09-12 01:07:58.771	2025-09-12 01:07:58.771
cmfg51n9600ubovboi675wxyw	GD QUALITY CONSTRUCTION LLC	2025-09-12 01:07:58.843	2025-09-12 01:07:58.843
cmfg51nb600ucovbosm2p09gw	GD SERVICES	2025-09-12 01:07:58.915	2025-09-12 01:07:58.915
cmfg51ndj00udovboe2sm8m1f	GEC ASSOCIATES	2025-09-12 01:07:58.999	2025-09-12 01:07:58.999
cmfg51nfk00ueovbovvujlwam	GECKO GROUP INC.	2025-09-12 01:07:59.073	2025-09-12 01:07:59.073
cmfg51nhm00ufovboban9m9si	GEMA CAMARA	2025-09-12 01:07:59.146	2025-09-12 01:07:59.146
cmfg51njm00ugovbobdg54zhi	GEN ART	2025-09-12 01:07:59.218	2025-09-12 01:07:59.218
cmfg51nlm00uhovbo7hi73ail	GENERAL ASPHALT	2025-09-12 01:07:59.29	2025-09-12 01:07:59.29
cmfg51nnn00uiovbomm53riwc	GENERAL ASPHALT:E4W57	2025-09-12 01:07:59.363	2025-09-12 01:07:59.363
cmfg51npo00ujovbot1d7nxd3	GENERAL ASPHALT:E4W57 PO	2025-09-12 01:07:59.436	2025-09-12 01:07:59.436
cmfg51nrn00ukovboytd42kev	GENERAL ASPHALT:E4X25	2025-09-12 01:07:59.508	2025-09-12 01:07:59.508
cmfg51ntn00ulovbo83qz4mvb	GENERAL ASPHALT:E6L20	2025-09-12 01:07:59.58	2025-09-12 01:07:59.58
cmfg51nvo00umovboe9njrjxy	GENERAL ASPHALT:E6L20 PO	2025-09-12 01:07:59.652	2025-09-12 01:07:59.652
cmfg51nxn00unovbovuihxfsz	GENERAL ASPHALT:E6M92	2025-09-12 01:07:59.724	2025-09-12 01:07:59.724
cmfg51nzn00uoovbot80hiutj	GENERAL ASPHALT:E8T76	2025-09-12 01:07:59.795	2025-09-12 01:07:59.795
cmfg51o1n00upovbo1meswj18	GENERAL ASPHALT:FXE RUNWAY 9-27	2025-09-12 01:07:59.868	2025-09-12 01:07:59.868
cmfg51o3n00uqovbo0dicuv70	GENERAL ASPHALT:INDIAN TRIBE WOODEN FENCE	2025-09-12 01:07:59.94	2025-09-12 01:07:59.94
cmfg51o5o00urovbo8wtndmw8	GENERAL ASPHALT:KROME 4	2025-09-12 01:08:00.013	2025-09-12 01:08:00.013
cmfg51o7v00usovbo4kr6tikt	GENERAL ASPHALT:NE 151 ST	2025-09-12 01:08:00.091	2025-09-12 01:08:00.091
cmfg51o9v00utovbo6e4f288x	GENERAL ASPHALT:NORTH PERRY AIRPORT	2025-09-12 01:08:00.163	2025-09-12 01:08:00.163
cmfg51obw00uuovbovi23evle	GENERAL ASPHALT:SR 968	2025-09-12 01:08:00.237	2025-09-12 01:08:00.237
cmfg51odw00uvovbo9rqr64yk	GENERAL ASPHALT:T4621	2025-09-12 01:08:00.309	2025-09-12 01:08:00.309
cmfg51ofw00uwovbo1w54q7rt	GENERAL ASPHALT:T4669	2025-09-12 01:08:00.381	2025-09-12 01:08:00.381
cmfg51oi000uxovboi77c0h9o	GENERAL ASPHALT:T4679	2025-09-12 01:08:00.456	2025-09-12 01:08:00.456
cmfg51ok000uyovbo6fz7t2bg	GENERAL ASPHALT:T6504	2025-09-12 01:08:00.528	2025-09-12 01:08:00.528
cmfg51olz00uzovbowh0ra8ud	GENERAL ASPHALT:T6513	2025-09-12 01:08:00.6	2025-09-12 01:08:00.6
cmfg51oo000v0ovboryt4d4s1	GENERAL ASPHALT:T6534	2025-09-12 01:08:00.672	2025-09-12 01:08:00.672
cmfg51oqc00v1ovbo7s7j5zzm	GENERAL ASPHALT:T6535	2025-09-12 01:08:00.756	2025-09-12 01:08:00.756
cmfg51osh00v2ovbox9u558q0	GENERAL ASPHALT:T6535:T6535 PO WORK	2025-09-12 01:08:00.834	2025-09-12 01:08:00.834
cmfg51oud00v3ovboe7ox8c4l	GENERAL ASPHALT:T6537	2025-09-12 01:08:00.901	2025-09-12 01:08:00.901
cmfg51owc00v4ovbooygenx9g	GENERAL ASPHALT:T6537 PO	2025-09-12 01:08:00.972	2025-09-12 01:08:00.972
cmfg51oy900v5ovboju2hbmji	GENERAL ASPHALT:T6549	2025-09-12 01:08:01.041	2025-09-12 01:08:01.041
cmfg51p0800v6ovbowv896pwf	GENERAL ASPHALT:T6565	2025-09-12 01:08:01.113	2025-09-12 01:08:01.113
cmfg51p2c00v7ovbornsjqzys	GENERAL ASPHALT:T6565 PO	2025-09-12 01:08:01.189	2025-09-12 01:08:01.189
cmfg51p4c00v8ovbougzllo0t	GENERAL ASPHALT:T6575	2025-09-12 01:08:01.26	2025-09-12 01:08:01.26
cmfg51p6d00v9ovbow82gr7n9	GENERAL ASPHALT:T6575 PO	2025-09-12 01:08:01.333	2025-09-12 01:08:01.333
cmfg51p8d00vaovbowqyr7zxv	GENERAL ASPHALT:T6586	2025-09-12 01:08:01.405	2025-09-12 01:08:01.405
cmfg51pac00vbovbolnuggp4c	GENERAL ASPHALT:T6603	2025-09-12 01:08:01.477	2025-09-12 01:08:01.477
cmfg51pcb00vcovboo7r8w3ec	GENERAL ASPHALT:T6604	2025-09-12 01:08:01.547	2025-09-12 01:08:01.547
cmfg51peb00vdovboo2t71216	GENERAL CONSTRUCTION INC	2025-09-12 01:08:01.619	2025-09-12 01:08:01.619
cmfg51pga00veovboxeuef4iv	GENERAL CONTRACTORS CONST. CO.	2025-09-12 01:08:01.691	2025-09-12 01:08:01.691
cmfg51pid00vfovbosqave2w7	GENERAL LENDING CORP.	2025-09-12 01:08:01.765	2025-09-12 01:08:01.765
cmfg51pkh00vgovbol62ysn2q	GENET PROPERTY GROUP	2025-09-12 01:08:01.841	2025-09-12 01:08:01.841
cmfg51pml00vhovbo7fvnmj7u	GENEVA MANAGEMENT	2025-09-12 01:08:01.918	2025-09-12 01:08:01.918
cmfg51pok00viovboiikgnbr9	GEO CARE	2025-09-12 01:08:01.988	2025-09-12 01:08:01.988
cmfg51pqk00vjovboui8lao0p	GEO SECURE SERVICES	2025-09-12 01:08:02.061	2025-09-12 01:08:02.061
cmfg51psj00vkovboa7hl9q3o	GEODIS WILSON	2025-09-12 01:08:02.132	2025-09-12 01:08:02.132
cmfg51pum00vlovbohmdqmtzo	GEOLOGISTICS	2025-09-12 01:08:02.207	2025-09-12 01:08:02.207
cmfg51pwm00vmovbohlkh8k86	GEORGE'S WELDING SERVICES, INC.	2025-09-12 01:08:02.278	2025-09-12 01:08:02.278
cmfg51pyk00vnovbohp9p63g1	GEORGE FULMER CONSTRUCTION COMPANY INC	2025-09-12 01:08:02.349	2025-09-12 01:08:02.349
cmfg51q0k00voovbonkelois8	GEORGE KOLAM	2025-09-12 01:08:02.421	2025-09-12 01:08:02.421
cmfg51q2n00vpovbo02wtnt0m	GERALDO	2025-09-12 01:08:02.495	2025-09-12 01:08:02.495
cmfg51q4n00vqovbogfv6t7ia	GERRICO APTS	2025-09-12 01:08:02.567	2025-09-12 01:08:02.567
cmfg51q6r00vrovbospae0jcn	GERRITS CONSTRUCTION, INC	2025-09-12 01:08:02.643	2025-09-12 01:08:02.643
cmfg51q8u00vsovbofsdx0vvn	GGI Construction JV	2025-09-12 01:08:02.718	2025-09-12 01:08:02.718
cmfg51qau00vtovbo50oelsmy	GGI Construction JV:T6413	2025-09-12 01:08:02.791	2025-09-12 01:08:02.791
cmfg51qd000vuovbop3bqcwmt	GGI Construction JV:T6413 PO	2025-09-12 01:08:02.868	2025-09-12 01:08:02.868
cmfg51qf000vvovbo0nvt82yt	GILL TRUCKING LLC	2025-09-12 01:08:02.94	2025-09-12 01:08:02.94
cmfg51qgv00vwovbo6dod4x84	GIMROCK CONSTRUCTION, INC.	2025-09-12 01:08:03.007	2025-09-12 01:08:03.007
cmfg51qiz00vxovbofakws915	GINA'S HOUSE	2025-09-12 01:08:03.083	2025-09-12 01:08:03.083
cmfg51qkv00vyovboe87xtarx	GINNY BAKES	2025-09-12 01:08:03.152	2025-09-12 01:08:03.152
cmfg51qmv00vzovbo2oxk1tec	GIRALT ENTERPRISE	2025-09-12 01:08:03.223	2025-09-12 01:08:03.223
cmfg51qp400w0ovbo83foutzd	GL HOMES DBA KENDALL ASSOCIATES	2025-09-12 01:08:03.304	2025-09-12 01:08:03.304
cmfg51qr300w1ovbo839wnrei	GLACIER FARMS	2025-09-12 01:08:03.376	2025-09-12 01:08:03.376
cmfg51qt600w2ovbo61ktaul1	GLENDALE MISSIONARY BAPTIST CHURCH	2025-09-12 01:08:03.45	2025-09-12 01:08:03.45
cmfg51qv600w3ovbohsbw3dzm	GLF CONSTRUCTION	2025-09-12 01:08:03.522	2025-09-12 01:08:03.522
cmfg51qxb00w4ovbob93fueu5	GLOBAL CONSTRUCTION ASSOCIATES, LLC	2025-09-12 01:08:03.6	2025-09-12 01:08:03.6
cmfg51qzg00w5ovboffxr8y2a	GLOBAL PRESTIGE GROUP	2025-09-12 01:08:03.676	2025-09-12 01:08:03.676
cmfg51r1g00w6ovbob68gpeie	GLOBELTECH CONST.	2025-09-12 01:08:03.749	2025-09-12 01:08:03.749
cmfg51r3k00w7ovbo556yd638	GM LLC	2025-09-12 01:08:03.825	2025-09-12 01:08:03.825
cmfg51r5g00w8ovbo992aqytv	GOLD KEY CONSULTANTS	2025-09-12 01:08:03.892	2025-09-12 01:08:03.892
cmfg51r7g00w9ovbohj41l4k0	GOLDCOASTER	2025-09-12 01:08:03.964	2025-09-12 01:08:03.964
cmfg51r9c00waovbocbanrez7	GOLDEN FENCE	2025-09-12 01:08:04.032	2025-09-12 01:08:04.032
cmfg51rbg00wbovbo3yg5km98	GOMES HOLDINGS LLC.	2025-09-12 01:08:04.108	2025-09-12 01:08:04.108
cmfg51rdh00wcovbo3122mhi0	GONZALEZ & SONS EQUIPMENT INC.	2025-09-12 01:08:04.181	2025-09-12 01:08:04.181
cmfg51rff00wdovboh2jnj9ty	GOOD AIR	2025-09-12 01:08:04.251	2025-09-12 01:08:04.251
cmfg51rha00weovbo07dr2lm3	GOVERNOR CONSTRUCTION	2025-09-12 01:08:04.319	2025-09-12 01:08:04.319
cmfg51rje00wfovbod693ch1x	GPE ENGINEERING	2025-09-12 01:08:04.394	2025-09-12 01:08:04.394
cmfg51rlg00wgovboazo7gv53	GPL CONSTRUCTION	2025-09-12 01:08:04.468	2025-09-12 01:08:04.468
cmfg51rnh00whovbo7qki3sgo	GR OPCO LLC	2025-09-12 01:08:04.541	2025-09-12 01:08:04.541
cmfg51rpf00wiovbo00pc8g5t	GRACE & NAEEM UDDIN, INC	2025-09-12 01:08:04.612	2025-09-12 01:08:04.612
cmfg51rrh00wjovbo2govn7u9	GRACE & NAEMM	2025-09-12 01:08:04.686	2025-09-12 01:08:04.686
cmfg51rtm00wkovbopv7r9hsn	GRANITE CONSTRUCTION COMPANY	2025-09-12 01:08:04.762	2025-09-12 01:08:04.762
cmfg51rvl00wlovbokmmt3ham	GRANITE GALLERY	2025-09-12 01:08:04.834	2025-09-12 01:08:04.834
cmfg51rxl00wmovboqmzodar5	GRASSY KEY MARINA	2025-09-12 01:08:04.906	2025-09-12 01:08:04.906
cmfg51rzo00wnovbomf8focqu	GRAY CONSTRUCTION	2025-09-12 01:08:04.981	2025-09-12 01:08:04.981
cmfg51s1n00woovboo1c9w5hv	GRC	2025-09-12 01:08:05.051	2025-09-12 01:08:05.051
cmfg51s3r00wpovbodenujdoo	Great Dane Petroleum Contractors, Inc.	2025-09-12 01:08:05.127	2025-09-12 01:08:05.127
cmfg51s5q00wqovbojhx47ica	GREEN TREE, INC	2025-09-12 01:08:05.198	2025-09-12 01:08:05.198
cmfg51s7y00wrovbof0b845mt	GREENFIELD ANIMAL HOSPITAL	2025-09-12 01:08:05.278	2025-09-12 01:08:05.278
cmfg51sbr00wsovbonma6txr3	GREG UMBAUGH	2025-09-12 01:08:05.415	2025-09-12 01:08:05.415
cmfg51sdr00wtovboomm6ogkd	GREGORIO	2025-09-12 01:08:05.487	2025-09-12 01:08:05.487
cmfg51sfv00wuovbo7i07brrt	GREGORY	2025-09-12 01:08:05.564	2025-09-12 01:08:05.564
cmfg51shw00wvovbo6ke5py5j	GREY PLUMBING	2025-09-12 01:08:05.637	2025-09-12 01:08:05.637
cmfg51sjw00wwovbofm1ih2ex	GRIFFIN POINT	2025-09-12 01:08:05.708	2025-09-12 01:08:05.708
cmfg51slw00wxovboyjb4pq6q	GRIMES CONTRACTING	2025-09-12 01:08:05.78	2025-09-12 01:08:05.78
cmfg51snw00wyovbov6jhvvyu	GROUP II	2025-09-12 01:08:05.852	2025-09-12 01:08:05.852
cmfg51spv00wzovboadbzviw8	GRUBB ELLIS	2025-09-12 01:08:05.923	2025-09-12 01:08:05.923
cmfg51srz00x0ovboyyol6dp9	GRYPHON CONSTRUCTION, LLC	2025-09-12 01:08:06	2025-09-12 01:08:06
cmfg51stz00x1ovbolocx6hmk	GSI RESTORATION	2025-09-12 01:08:06.072	2025-09-12 01:08:06.072
cmfg51svz00x2ovbooq6hvbh8	GSM CAPITAL	2025-09-12 01:08:06.144	2025-09-12 01:08:06.144
cmfg51sxz00x3ovbotj8sghqq	GUADALUPE BREIJO	2025-09-12 01:08:06.216	2025-09-12 01:08:06.216
cmfg51szz00x4ovbodn7p9pyd	GUARDIAN FLEET SERVICES	2025-09-12 01:08:06.287	2025-09-12 01:08:06.287
cmfg51t1z00x5ovbof18uu47r	GUIDO MORFESI	2025-09-12 01:08:06.359	2025-09-12 01:08:06.359
cmfg51t3z00x6ovbose9hq8eh	GUILLERMO DOPICO	2025-09-12 01:08:06.432	2025-09-12 01:08:06.432
cmfg51t6000x7ovbosntqsxnh	GULF BUILDING GROUP	2025-09-12 01:08:06.504	2025-09-12 01:08:06.504
cmfg51t8200x8ovbof6aoma1a	GULFSTREAM PETROLEUM SERVICES, INC.	2025-09-12 01:08:06.579	2025-09-12 01:08:06.579
cmfg51ta600x9ovbopshgj9qc	GULLIVER ACADEMY	2025-09-12 01:08:06.655	2025-09-12 01:08:06.655
cmfg51tc600xaovbo0as5whaj	GUS FONTE	2025-09-12 01:08:06.727	2025-09-12 01:08:06.727
cmfg51te600xbovbozgxyix8d	H-J ASPHAULT	2025-09-12 01:08:06.799	2025-09-12 01:08:06.799
cmfg51tg100xcovbo0sej791b	H & H DEVELOPMENT	2025-09-12 01:08:06.865	2025-09-12 01:08:06.865
cmfg51ti500xdovbo7hi5zx33	H & J CONTRACTING	2025-09-12 01:08:06.941	2025-09-12 01:08:06.941
cmfg51tk500xeovbon8ir1yfz	H & R PAVING, INC.	2025-09-12 01:08:07.013	2025-09-12 01:08:07.013
cmfg51tm600xfovbo9hius7gp	H & R PAVING, INC.:E4T56 SR 7	2025-09-12 01:08:07.086	2025-09-12 01:08:07.086
cmfg51to600xgovborr0ilsu7	H & R PAVING, INC.:Multiple Locations of Guardrail	2025-09-12 01:08:07.158	2025-09-12 01:08:07.158
cmfg51tqa00xhovbo8sqh8j5o	H & R PAVING, INC.:PALMETTO GUARDRAIL	2025-09-12 01:08:07.235	2025-09-12 01:08:07.235
cmfg51tsg00xiovbonwbdmehc	H & R PAVING, INC.:SW 268 ST	2025-09-12 01:08:07.313	2025-09-12 01:08:07.313
cmfg51tul00xjovbowzs66b2h	H & R PAVING, INC.:T6569	2025-09-12 01:08:07.39	2025-09-12 01:08:07.39
cmfg51twk00xkovboz48znjst	H & R PAVING, INC.:T6577	2025-09-12 01:08:07.461	2025-09-12 01:08:07.461
cmfg51typ00xlovbo9cdojfm7	H & R PAVING, INC.:T6577 PO	2025-09-12 01:08:07.537	2025-09-12 01:08:07.537
cmfg51u0t00xmovbol0ytnpkm	H & R PAVING, INC.:T6580	2025-09-12 01:08:07.614	2025-09-12 01:08:07.614
cmfg51u2p00xnovboluro302b	H & R PAVING, INC.:T6580 PO	2025-09-12 01:08:07.682	2025-09-12 01:08:07.682
cmfg51u4p00xoovboprev5o5c	H.A. CONTRACTING CORP	2025-09-12 01:08:07.753	2025-09-12 01:08:07.753
cmfg51u6s00xpovbooc7sb2iz	H.A. CONTRACTING CORP:1241-HA	2025-09-12 01:08:07.829	2025-09-12 01:08:07.829
cmfg51u8s00xqovbodi0u672p	H.A. CONTRACTING CORP:1251-HA	2025-09-12 01:08:07.9	2025-09-12 01:08:07.9
cmfg51uas00xrovbo7dvk10nk	H.A. CONTRACTING CORP:1252-HA	2025-09-12 01:08:07.973	2025-09-12 01:08:07.973
cmfg51uct00xsovboleddzvav	H.A. CONTRACTING CORP:1268-HA	2025-09-12 01:08:08.045	2025-09-12 01:08:08.045
cmfg51uew00xtovboww0honvo	H.A. CONTRACTING CORP:1271-HA	2025-09-12 01:08:08.12	2025-09-12 01:08:08.12
cmfg51ugv00xuovbooaai8a55	H.A. CONTRACTING CORP:1290-HA	2025-09-12 01:08:08.191	2025-09-12 01:08:08.191
cmfg51uir00xvovbo2cvvv1sn	H.A. CONTRACTING CORP:1294-HA	2025-09-12 01:08:08.26	2025-09-12 01:08:08.26
cmfg51ukv00xwovboh6z3b2ek	H.A. CONTRACTING CORP:1303-HA	2025-09-12 01:08:08.335	2025-09-12 01:08:08.335
cmfg51umz00xxovbo12wpmys9	H.A. CONTRACTING CORP:1310-HA	2025-09-12 01:08:08.411	2025-09-12 01:08:08.411
cmfg51up300xyovbowojdhimi	H3 CONTRACTING	2025-09-12 01:08:08.487	2025-09-12 01:08:08.487
cmfg51ur600xzovbomde28kf5	HA-CONTRACTING	2025-09-12 01:08:08.562	2025-09-12 01:08:08.562
cmfg51ut500y0ovbotvdsjak9	HA-CONTRACTING:CHINA GRILL	2025-09-12 01:08:08.634	2025-09-12 01:08:08.634
cmfg51uv500y1ovbojkcykrf5	HA-CONTRACTING:CHRISTA MACULLIE SCHOLL	2025-09-12 01:08:08.706	2025-09-12 01:08:08.706
cmfg51ux800y2ovboby08oune	HA-CONTRACTING:DELRAY CIVIC CTR	2025-09-12 01:08:08.78	2025-09-12 01:08:08.78
cmfg51uza00y3ovbowef2faov	HA-CONTRACTING:GEO BROWARD CENTER	2025-09-12 01:08:08.854	2025-09-12 01:08:08.854
cmfg51v1e00y4ovboz659btf7	HA-CONTRACTING:WOODLAND MIDDLE SCHOOL	2025-09-12 01:08:08.93	2025-09-12 01:08:08.93
cmfg51v3f00y5ovbo8pb8qz56	HA CONTRACTING	2025-09-12 01:08:09.003	2025-09-12 01:08:09.003
cmfg51v5i00y6ovbot561tiy8	HABITAT FOR HUMANITY	2025-09-12 01:08:09.079	2025-09-12 01:08:09.079
cmfg51v7j00y7ovboax7mx14q	HADRIAN TUCK	2025-09-12 01:08:09.151	2025-09-12 01:08:09.151
cmfg51v9e00y8ovbogg70arrt	HAHN CONSTRUCTION	2025-09-12 01:08:09.219	2025-09-12 01:08:09.219
cmfg51vbe00y9ovbohe8op8ln	HAL-TEC NETWORK SERVICE	2025-09-12 01:08:09.291	2025-09-12 01:08:09.291
cmfg51vde00yaovboewis6890	HALLAS CONSTRUCTION	2025-09-12 01:08:09.363	2025-09-12 01:08:09.363
cmfg51vfh00ybovbonzkclynq	HALLEY ENGINEERING CONTRACTORS, INC	2025-09-12 01:08:09.438	2025-09-12 01:08:09.438
cmfg51vhh00ycovbofg9t3kut	HALLEY ENGINEERING CONTRACTORS, INC:BROAD CAUSEWAY	2025-09-12 01:08:09.51	2025-09-12 01:08:09.51
cmfg51vjh00ydovbohumw8fq2	HALLEY ENGINEERING CONTRACTORS, INC:CARD SOUND RD	2025-09-12 01:08:09.582	2025-09-12 01:08:09.582
cmfg51vlj00yeovbo9zm3j1gq	HALLEY ENGINEERING CONTRACTORS, INC:DOLPHIN STATION	2025-09-12 01:08:09.655	2025-09-12 01:08:09.655
cmfg51vni00yfovbonsqs9cdx	HALLEY ENGINEERING CONTRACTORS, INC:E6K31 HEC 1610	2025-09-12 01:08:09.727	2025-09-12 01:08:09.727
cmfg51vpn00ygovbowx2350yt	HALLEY ENGINEERING CONTRACTORS, INC:E6L73 - RAMPS	2025-09-12 01:08:09.804	2025-09-12 01:08:09.804
cmfg51vrq00yhovboz8buvf6t	HALLEY ENGINEERING CONTRACTORS, INC:E8N60-TURNPIKE	2025-09-12 01:08:09.879	2025-09-12 01:08:09.879
cmfg51vtq00yiovbon567s7ui	HALLEY ENGINEERING CONTRACTORS, INC:E8Q93 - TURNPIKE MAINLINE	2025-09-12 01:08:09.951	2025-09-12 01:08:09.951
cmfg51vvr00yjovboqtsyb48r	HALLEY ENGINEERING CONTRACTORS, INC:E8R80	2025-09-12 01:08:10.024	2025-09-12 01:08:10.024
cmfg51vxv00ykovbotful6qr7	HALLEY ENGINEERING CONTRACTORS, INC:E8R80 PO	2025-09-12 01:08:10.099	2025-09-12 01:08:10.099
cmfg51vzz00ylovbo0vx5dd0r	HALLEY ENGINEERING CONTRACTORS, INC:E8R80:E8R80 PO	2025-09-12 01:08:10.176	2025-09-12 01:08:10.176
cmfg51w1z00ymovbopn2hes20	HALLEY ENGINEERING CONTRACTORS, INC:E8T44	2025-09-12 01:08:10.247	2025-09-12 01:08:10.247
cmfg51w4000ynovboh0gi3igp	HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO	2025-09-12 01:08:10.321	2025-09-12 01:08:10.321
cmfg51w6100yoovbo2782j9p5	HALLEY ENGINEERING CONTRACTORS, INC:GRATINY EXPWAY	2025-09-12 01:08:10.393	2025-09-12 01:08:10.393
cmfg51w8100ypovbogw61u220	HALLEY ENGINEERING CONTRACTORS, INC:HEC 1510- SR 826 PALMETTO	2025-09-12 01:08:10.465	2025-09-12 01:08:10.465
cmfg51wa000yqovbod52kgk44	HALLEY ENGINEERING CONTRACTORS, INC:HEC 1809 MDX TOLL MODIFICATION	2025-09-12 01:08:10.536	2025-09-12 01:08:10.536
cmfg51wc000yrovbova3vxv7o	HALLEY ENGINEERING CONTRACTORS, INC:HEFT	2025-09-12 01:08:10.608	2025-09-12 01:08:10.608
cmfg51we600ysovbowxtkpkw9	HALLEY ENGINEERING CONTRACTORS, INC:I-75 MISC CONS.	2025-09-12 01:08:10.687	2025-09-12 01:08:10.687
cmfg51wgb00ytovbo5g20573y	HALLEY ENGINEERING CONTRACTORS, INC:I-75 MISC CONS.:DOLPHIN STATION PARK & RIDE	2025-09-12 01:08:10.763	2025-09-12 01:08:10.763
cmfg51wia00yuovbony26d331	HALLEY ENGINEERING CONTRACTORS, INC:JULIA TUTTLE	2025-09-12 01:08:10.835	2025-09-12 01:08:10.835
cmfg51wk900yvovbo8qeuug1y	HALLEY ENGINEERING CONTRACTORS, INC:KROME III	2025-09-12 01:08:10.905	2025-09-12 01:08:10.905
cmfg51wm900ywovboqvkuzjpw	HALLEY ENGINEERING CONTRACTORS, INC:KROME V	2025-09-12 01:08:10.978	2025-09-12 01:08:10.978
cmfg51wof00yxovbowu46blzx	HALLEY ENGINEERING CONTRACTORS, INC:MDX 836 34	2025-09-12 01:08:11.055	2025-09-12 01:08:11.055
cmfg51wqe00yyovbo53utkqc7	HALLEY ENGINEERING CONTRACTORS, INC:MDX 836 34 PO	2025-09-12 01:08:11.126	2025-09-12 01:08:11.126
cmfg51wse00yzovbonid2qe95	HALLEY ENGINEERING CONTRACTORS, INC:MDX ITB 13-01 - SR-112	2025-09-12 01:08:11.198	2025-09-12 01:08:11.198
cmfg51wui00z0ovboeh0zlzy9	HALLEY ENGINEERING CONTRACTORS, INC:MDX ITB 15-03	2025-09-12 01:08:11.274	2025-09-12 01:08:11.274
cmfg51wwh00z1ovboitvzd5p3	HALLEY ENGINEERING CONTRACTORS, INC:SR-112	2025-09-12 01:08:11.345	2025-09-12 01:08:11.345
cmfg51wyh00z2ovbozna890za	HALLEY ENGINEERING CONTRACTORS, INC:SR-836	2025-09-12 01:08:11.417	2025-09-12 01:08:11.417
cmfg51x0j00z3ovboz9ty8tbw	HALLEY ENGINEERING CONTRACTORS, INC:SW 40 ST	2025-09-12 01:08:11.491	2025-09-12 01:08:11.491
cmfg51x2e00z4ovbosnjpn98r	HALLEY ENGINEERING CONTRACTORS, INC:T- 6424	2025-09-12 01:08:11.558	2025-09-12 01:08:11.558
cmfg51x4e00z5ovboluezqkon	HALLEY ENGINEERING CONTRACTORS, INC:T4622 - KROME AVE	2025-09-12 01:08:11.63	2025-09-12 01:08:11.63
cmfg51x6d00z6ovbo95zdutic	HALLEY ENGINEERING CONTRACTORS, INC:T4624	2025-09-12 01:08:11.701	2025-09-12 01:08:11.701
cmfg51x8d00z7ovbocomaa0ct	HALLEY ENGINEERING CONTRACTORS, INC:T4624 PO	2025-09-12 01:08:11.773	2025-09-12 01:08:11.773
cmfg51xad00z8ovbo06yetnph	HALLEY ENGINEERING CONTRACTORS, INC:T6348 - SW 8 ST AND 107 AVE	2025-09-12 01:08:11.845	2025-09-12 01:08:11.845
cmfg51xca00z9ovbon7kl7xn7	HALLEY ENGINEERING CONTRACTORS, INC:T6377	2025-09-12 01:08:11.915	2025-09-12 01:08:11.915
cmfg51xed00zaovbokn1ajng4	HALLEY ENGINEERING CONTRACTORS, INC:T6382 - NW 87 AVE	2025-09-12 01:08:11.989	2025-09-12 01:08:11.989
cmfg51xgc00zbovbo1uepmyir	HALLEY ENGINEERING CONTRACTORS, INC:T6413	2025-09-12 01:08:12.061	2025-09-12 01:08:12.061
cmfg51xib00zcovbopaua9bky	HALLEY ENGINEERING CONTRACTORS, INC:T6413 PO	2025-09-12 01:08:12.132	2025-09-12 01:08:12.132
cmfg51xld00zdovboogrbskk2	HALLEY ENGINEERING CONTRACTORS, INC:T6415 - CORAL REEF	2025-09-12 01:08:12.241	2025-09-12 01:08:12.241
cmfg51xni00zeovbomb6qcztj	HALLEY ENGINEERING CONTRACTORS, INC:T6420 - US 1	2025-09-12 01:08:12.318	2025-09-12 01:08:12.318
cmfg51xpm00zfovboksokr7bw	HALLEY ENGINEERING CONTRACTORS, INC:T6420 - US 1:T6424 - KROME	2025-09-12 01:08:12.394	2025-09-12 01:08:12.394
cmfg51xro00zgovboffb4lps7	HALLEY ENGINEERING CONTRACTORS, INC:TOWN OF MEDLEY	2025-09-12 01:08:12.468	2025-09-12 01:08:12.468
cmfg51xts00zhovbox7c5xpna	HALLIDAY GROUP	2025-09-12 01:08:12.544	2025-09-12 01:08:12.544
cmfg51xvr00ziovboqceyrif7	HALLORAN CONSTRUCTION	2025-09-12 01:08:12.616	2025-09-12 01:08:12.616
cmfg51xxr00zjovbo4ro847rj	HALTEC	2025-09-12 01:08:12.688	2025-09-12 01:08:12.688
cmfg51xzw00zkovbotlz6huhb	HARALMPOS (BOB) KOUROUKLIS	2025-09-12 01:08:12.765	2025-09-12 01:08:12.765
cmfg51y2100zlovbo887tzc94	HARBOUR BY THE SEA	2025-09-12 01:08:12.842	2025-09-12 01:08:12.842
cmfg51y4400zmovbo83zwjqk4	HARBOUR CONSTRUCTION	2025-09-12 01:08:12.916	2025-09-12 01:08:12.916
cmfg51y6900znovbozeydkogy	HARCON FL	2025-09-12 01:08:12.993	2025-09-12 01:08:12.993
cmfg51y8900zoovbod4lakxo1	HARDING OCEAN APARTMENTS, LLC	2025-09-12 01:08:13.065	2025-09-12 01:08:13.065
cmfg51yad00zpovbompc4e7u9	HAROLD	2025-09-12 01:08:13.142	2025-09-12 01:08:13.142
cmfg51ycc00zqovbo2m7esuco	HAROLD MIR	2025-09-12 01:08:13.213	2025-09-12 01:08:13.213
cmfg51yee00zrovboj9nzz70f	HARTEC GROUP	2025-09-12 01:08:13.286	2025-09-12 01:08:13.286
cmfg51ygi00zsovbowdbebic4	HARY GARCIA	2025-09-12 01:08:13.363	2025-09-12 01:08:13.363
cmfg51yim00ztovbomentolpd	HASKELL	2025-09-12 01:08:13.439	2025-09-12 01:08:13.439
cmfg51ykm00zuovbos1ggkhlw	HAYDAY PROPERTIES	2025-09-12 01:08:13.51	2025-09-12 01:08:13.51
cmfg51yml00zvovbouciil48o	HAYDEN PROFESSIONAL SERVICES INC	2025-09-12 01:08:13.582	2025-09-12 01:08:13.582
cmfg51yom00zwovboblnlpg60	HB ARCO AUTOMOBILE INC	2025-09-12 01:08:13.654	2025-09-12 01:08:13.654
cmfg51yql00zxovbo32thdu6c	HB Mechanical Services Inc	2025-09-12 01:08:13.726	2025-09-12 01:08:13.726
cmfg51ysq00zyovbo14d67lgi	HD&C LLC	2025-09-12 01:08:13.802	2025-09-12 01:08:13.802
cmfg51yuv00zzovboz7oaex1a	HEALTHCARE ENVIORMENTAL SERVICES	2025-09-12 01:08:13.879	2025-09-12 01:08:13.879
cmfg51ywv0100ovbob0eazw1i	HEALTHCARE MANAGEMENT OF AMERICA, INC	2025-09-12 01:08:13.951	2025-09-12 01:08:13.951
cmfg51yyw0101ovbow6i0a8bb	HEART CONSTRUCTION	2025-09-12 01:08:14.024	2025-09-12 01:08:14.024
cmfg51z0v0102ovboo7jz1aqk	HEAVY METAL MIAMI	2025-09-12 01:08:14.095	2025-09-12 01:08:14.095
cmfg51z2t0103ovboo5fu8zgn	HECTOR LOPES	2025-09-12 01:08:14.165	2025-09-12 01:08:14.165
cmfg51z4v0104ovbot8t0gsxr	HELEN HOMES OF WESTON, LLC	2025-09-12 01:08:14.24	2025-09-12 01:08:14.24
cmfg51z6w0105ovbop7kudrqu	HELLER RESIDENCE	2025-09-12 01:08:14.312	2025-09-12 01:08:14.312
cmfg51z910106ovbo3cqutq3l	HELLINGER PENEBARD COMPANIES	2025-09-12 01:08:14.389	2025-09-12 01:08:14.389
cmfg51zb10107ovbolhwon0h2	HENRY QUINTANA REALTY, INC	2025-09-12 01:08:14.461	2025-09-12 01:08:14.461
cmfg51zcw0108ovbo97of68y0	HER	2025-09-12 01:08:14.528	2025-09-12 01:08:14.528
cmfg51zew0109ovbof7kpz0jw	HERNANDEZ & TACORONTE, P.A.	2025-09-12 01:08:14.601	2025-09-12 01:08:14.601
cmfg51zhe010aovboxhdhvy6f	HERNANDEZ CONSTRUCTION	2025-09-12 01:08:14.691	2025-09-12 01:08:14.691
cmfg51zji010bovbo0l37q28i	HERNANDEZ CONSTRUCTION:1515 SW 20 ST - MARINA DEL MAR	2025-09-12 01:08:14.767	2025-09-12 01:08:14.767
cmfg51zlm010covbo0x5m4ihi	HERNANDEZ CONSTRUCTION:1601 NW 136 AVE	2025-09-12 01:08:14.843	2025-09-12 01:08:14.843
cmfg51zno010dovbohkkjp1ia	HERNANDEZ CONSTRUCTION:AVE AVIATION BLDGS	2025-09-12 01:08:14.916	2025-09-12 01:08:14.916
cmfg51zpq010eovbopdz7c28m	HERNANDEZ CONSTRUCTION:AVE BUILDING L-TI-02	2025-09-12 01:08:14.991	2025-09-12 01:08:14.991
cmfg51zrw010fovboq4h94n2i	HERNANDEZ CONSTRUCTION:BP GRATIGNY 65-04590	2025-09-12 01:08:15.069	2025-09-12 01:08:15.069
cmfg51ztw010govbo8npm03zs	HERNANDEZ CONSTRUCTION:BP PORT EVERGLADES	2025-09-12 01:08:15.141	2025-09-12 01:08:15.141
cmfg51zvw010hovbokr1n1wj2	HERNANDEZ CONSTRUCTION:BRIDGE EAST	2025-09-12 01:08:15.213	2025-09-12 01:08:15.213
cmfg51zxy010iovbofk3q6tmc	HERNANDEZ CONSTRUCTION:BRIDGE WEST	2025-09-12 01:08:15.287	2025-09-12 01:08:15.287
cmfg51zzx010jovbo5b9dh83b	HERNANDEZ CONSTRUCTION:CANIK TI 1-105070	2025-09-12 01:08:15.358	2025-09-12 01:08:15.358
cmfg52021010kovborbp4xu5a	HERNANDEZ CONSTRUCTION:CENTURY TI-1-105060	2025-09-12 01:08:15.434	2025-09-12 01:08:15.434
cmfg52046010lovbogdq4qdf7	HERNANDEZ CONSTRUCTION:FLL Building B	2025-09-12 01:08:15.51	2025-09-12 01:08:15.51
cmfg52069010movbowcpj23kc	HERNANDEZ CONSTRUCTION:GRIFFIN POINTE	2025-09-12 01:08:15.586	2025-09-12 01:08:15.586
cmfg5208b010novbo1jnapzng	HERNANDEZ CONSTRUCTION:ITEC FENCE - FORT MYERS	2025-09-12 01:08:15.66	2025-09-12 01:08:15.66
cmfg520a7010oovbozvabdhy6	HERNANDEZ CONSTRUCTION:JOHN DEERE	2025-09-12 01:08:15.727	2025-09-12 01:08:15.727
cmfg520c7010povbo6teeq671	HERNANDEZ CONSTRUCTION:JOHN DEERE - DC WAREHOUSE	2025-09-12 01:08:15.799	2025-09-12 01:08:15.799
cmfg520ea010qovbo7bydvars	HERNANDEZ CONSTRUCTION:SAWGRASS TECH	2025-09-12 01:08:15.874	2025-09-12 01:08:15.874
cmfg520ga010rovbox0dpkue4	HERNANDEZ CONSTRUCTION:SYCAMORE TEMP FENCE	2025-09-12 01:08:15.946	2025-09-12 01:08:15.946
cmfg520i9010sovbof8guhotu	HERNSKI INC	2025-09-12 01:08:16.018	2025-09-12 01:08:16.018
cmfg520ka010tovbol5xj9au0	HERON AT THE HAMMOCKS	2025-09-12 01:08:16.091	2025-09-12 01:08:16.091
cmfg520me010uovboybo2yyql	HERTS RENT A CAR	2025-09-12 01:08:16.166	2025-09-12 01:08:16.166
cmfg520oh010vovbo38o2oeo5	HEW DICKSON	2025-09-12 01:08:16.242	2025-09-12 01:08:16.242
cmfg520qh010wovbo5r138ypt	HG CONSTRUCTION AND DEVELOPMENT	2025-09-12 01:08:16.313	2025-09-12 01:08:16.313
cmfg520sg010xovbox3fgpfmr	HGR CONSTRUCTION INC	2025-09-12 01:08:16.384	2025-09-12 01:08:16.384
cmfg520uh010yovboez2l3kxy	HHH CONSTRUCTION	2025-09-12 01:08:16.457	2025-09-12 01:08:16.457
cmfg520wg010zovbojmhs70pl	HIALEAH BAPTIST CHURCH	2025-09-12 01:08:16.528	2025-09-12 01:08:16.528
cmfg520yk0110ovbo45g0qunl	HIALEAH GARDENS SR. HIGH	2025-09-12 01:08:16.605	2025-09-12 01:08:16.605
cmfg5210l0111ovbo7xbv5hhf	HIALEAH NURSING AND REHAB	2025-09-12 01:08:16.677	2025-09-12 01:08:16.677
cmfg5212l0112ovbos5avx3xt	HIALEAH PARK	2025-09-12 01:08:16.749	2025-09-12 01:08:16.749
cmfg5214l0113ovbod7thonm8	HIALEAH STORAGE	2025-09-12 01:08:16.821	2025-09-12 01:08:16.821
cmfg5216k0114ovboi1bvnsyc	HIALEAH TOMATO AND FRESH PRODUCE	2025-09-12 01:08:16.893	2025-09-12 01:08:16.893
cmfg5218f0115ovbo44akmlc7	HIDALGO CONSTRUCTION	2025-09-12 01:08:16.96	2025-09-12 01:08:16.96
cmfg521ab0116ovbo9ya1hgtl	HIGH TECH AUTO PARTS	2025-09-12 01:08:17.027	2025-09-12 01:08:17.027
cmfg521cg0117ovbots5apcnw	HIGH TECH STRIPPING	2025-09-12 01:08:17.104	2025-09-12 01:08:17.104
cmfg521ek0118ovboy5vjzuvy	HILLCREST EAST	2025-09-12 01:08:17.181	2025-09-12 01:08:17.181
cmfg521gp0119ovbozi4y05gl	HITT CONTRACTING, INC.	2025-09-12 01:08:17.257	2025-09-12 01:08:17.257
cmfg521in011aovbopidzh0vw	HIVE PREP SCHOOL	2025-09-12 01:08:17.328	2025-09-12 01:08:17.328
cmfg521km011bovbo31mwsswx	HODGEN CONSTRUCTION LLC	2025-09-12 01:08:17.398	2025-09-12 01:08:17.398
cmfg521mm011covbomu8w67ak	HODGEN CONSTRUCTION LLC:CHAMPION PORSCHE	2025-09-12 01:08:17.47	2025-09-12 01:08:17.47
cmfg521ou011dovbogfhr5qkl	HOG BACKHOE SERVICE	2025-09-12 01:08:17.551	2025-09-12 01:08:17.551
cmfg521qu011eovbo87a4ku3t	HOGAN BROTHERS CONSTRUCTION CORP.	2025-09-12 01:08:17.622	2025-09-12 01:08:17.622
cmfg521sv011fovboux6blsow	HOLLUB HOMES	2025-09-12 01:08:17.696	2025-09-12 01:08:17.696
cmfg521uw011govbosic5bc8r	HOLLYWOOD BUISNESS PARK	2025-09-12 01:08:17.768	2025-09-12 01:08:17.768
cmfg521x4011hovboc053j88r	HOLLYWOOD UNDERWRITERS	2025-09-12 01:08:17.848	2025-09-12 01:08:17.848
cmfg521zc011iovbo4flqdyrh	HOLT CONTRACTORS	2025-09-12 01:08:17.928	2025-09-12 01:08:17.928
cmfg52216011jovbojh2d54gi	HOME LUMBER INDUSTRIES	2025-09-12 01:08:17.995	2025-09-12 01:08:17.995
cmfg52239011kovbom66cgenm	HOMERO MERMUELO	2025-09-12 01:08:18.069	2025-09-12 01:08:18.069
cmfg52256011lovbopie41hds	HOMESTEAD AIR BASE	2025-09-12 01:08:18.139	2025-09-12 01:08:18.139
cmfg5226w011movbo04ad2peq	HOMESTEAD CONCRETE	2025-09-12 01:08:18.201	2025-09-12 01:08:18.201
cmfg52295011novbodq2e2amb	HOMESTEAD CONCRETE AND DRAINAGE	2025-09-12 01:08:18.281	2025-09-12 01:08:18.281
cmfg522b5011oovbochm9uc44	HOMESTEAD GAS	2025-09-12 01:08:18.353	2025-09-12 01:08:18.353
cmfg522d0011povboy78xagmx	HOMESTEAD HOSPITAL BAPTIST HEALTH	2025-09-12 01:08:18.421	2025-09-12 01:08:18.421
cmfg522f0011qovbodkzdikuf	HOMESTEAD HOUSING AUTHORITY	2025-09-12 01:08:18.492	2025-09-12 01:08:18.492
cmfg522h0011rovboidsevhr5	HOMESTEAD POLICE DEPARTMENT	2025-09-12 01:08:18.564	2025-09-12 01:08:18.564
cmfg522iw011sovboisw3etem	HORIZON CONTRACTORS, INC.	2025-09-12 01:08:18.632	2025-09-12 01:08:18.632
cmfg522kw011tovbo6wu8fs0w	HORIZON CONTRACTORS, INC.:NW 97 AVE	2025-09-12 01:08:18.705	2025-09-12 01:08:18.705
cmfg522mw011uovboca2oizb2	HORIZON CONTRACTORS, INC.:T4551	2025-09-12 01:08:18.777	2025-09-12 01:08:18.777
cmfg522p0011vovboxrseri1y	HORIZON CONTRACTORS, INC.:T4551 PO	2025-09-12 01:08:18.853	2025-09-12 01:08:18.853
cmfg522qz011wovboge7q9286	HORIZON CONTRACTORS, INC.:T6450 - KROME	2025-09-12 01:08:18.923	2025-09-12 01:08:18.923
cmfg522sz011xovborq8fxj6f	HORIZON CONTRACTORS, INC.:US 441	2025-09-12 01:08:18.996	2025-09-12 01:08:18.996
cmfg522v0011yovbo6lzprxpg	HORSEPOWER ELECTRIC, INC.	2025-09-12 01:08:19.068	2025-09-12 01:08:19.068
cmfg522wv011zovbo9y2vwedo	HORUS CONSTRUCTION SERVICES, INC	2025-09-12 01:08:19.135	2025-09-12 01:08:19.135
cmfg522yv0120ovbo9fe1j1xv	HOUSING AUTHORITY OF CITY OF MIAMI BEACH	2025-09-12 01:08:19.208	2025-09-12 01:08:19.208
cmfg5230q0121ovboyxa6768i	HUBBARD CONSTRUCTION	2025-09-12 01:08:19.275	2025-09-12 01:08:19.275
cmfg523310122ovbotp0uey7o	HUBBARD CONSTRUCTION:HUBBARD- EROSION CONTROL	2025-09-12 01:08:19.357	2025-09-12 01:08:19.357
cmfg5234w0123ovbo9p69cr7q	HUBBARD CONSTRUCTION:HUBBARD- GUARDRAIL	2025-09-12 01:08:19.424	2025-09-12 01:08:19.424
cmfg5236w0124ovbonlpl4uzg	HUBBARD CONSTRUCTION:HUBBARD -I95 MAINTENANCE	2025-09-12 01:08:19.497	2025-09-12 01:08:19.497
cmfg5238v0125ovboojcr6yh3	HUBBARD CONSTRUCTION:SR 710	2025-09-12 01:08:19.568	2025-09-12 01:08:19.568
cmfg523as0126ovbox5p8baue	HUFF COMPANIES	2025-09-12 01:08:19.637	2025-09-12 01:08:19.637
cmfg523cs0127ovboxonmvkwx	HUMPTY DUMPY LLC-	2025-09-12 01:08:19.708	2025-09-12 01:08:19.708
cmfg523es0128ovbotrhbma1h	HUNTER CRANE	2025-09-12 01:08:19.781	2025-09-12 01:08:19.781
cmfg523gs0129ovbo3tg6lot9	HURRICANE PROTECTION INDUSTRIES	2025-09-12 01:08:19.852	2025-09-12 01:08:19.852
cmfg523iw012aovbosev5z60p	HY-TECH SOLUTIONS INC	2025-09-12 01:08:19.929	2025-09-12 01:08:19.929
cmfg523kz012bovbozpdfs36q	HYAT BONAVENTURE HOTEL	2025-09-12 01:08:20.003	2025-09-12 01:08:20.003
cmfg523mw012covboqgob0df3	HYDE SHIPPING CORPORATION	2025-09-12 01:08:20.073	2025-09-12 01:08:20.073
cmfg523ot012dovboiplm16k4	HYPOWER HEADQUARTERS	2025-09-12 01:08:20.141	2025-09-12 01:08:20.141
cmfg523r0012eovboty66l9hh	I INSTALL MIAMI LLC	2025-09-12 01:08:20.22	2025-09-12 01:08:20.22
cmfg523t4012fovbo72rq6t6q	I9 TECH	2025-09-12 01:08:20.297	2025-09-12 01:08:20.297
cmfg523v4012govboqflbxigu	IBT CONSTRUCTION, LLC	2025-09-12 01:08:20.368	2025-09-12 01:08:20.368
cmfg523x6012hovbo3kh3xg23	ICMS LLC	2025-09-12 01:08:20.442	2025-09-12 01:08:20.442
cmfg523za012iovbometfkxrp	IDMJI	2025-09-12 01:08:20.519	2025-09-12 01:08:20.519
cmfg5241e012jovbot7bbjd1s	IGELSIA DE DIOS PENTECOSTAL	2025-09-12 01:08:20.594	2025-09-12 01:08:20.594
cmfg5243i012kovbo3brh76wc	IGLESIA CRISTIANA SEGADORES DE VIDA	2025-09-12 01:08:20.67	2025-09-12 01:08:20.67
cmfg5245h012lovbo02vr08vv	IGNACIO	2025-09-12 01:08:20.741	2025-09-12 01:08:20.741
cmfg5247h012movbohsg64d8f	IICON CONTRACTORS CORP.	2025-09-12 01:08:20.814	2025-09-12 01:08:20.814
cmfg5249m012novboy7n46omm	ILLUMINAIR SUPPORT CORP	2025-09-12 01:08:20.891	2025-09-12 01:08:20.891
cmfg524by012oovbo6wbo9a3f	IMAGE FIRST	2025-09-12 01:08:20.975	2025-09-12 01:08:20.975
cmfg524dz012povbo0usp4qvw	IMEC EQUITY GROUP	2025-09-12 01:08:21.048	2025-09-12 01:08:21.048
cmfg524fz012qovbo5griuepy	IMECA	2025-09-12 01:08:21.119	2025-09-12 01:08:21.119
cmfg524i5012rovboc4cty28w	IMMACULATA - LA SALLE HIGH SCHOOL	2025-09-12 01:08:21.197	2025-09-12 01:08:21.197
cmfg524k4012sovbozxdit999	IMPERIAL PARKING	2025-09-12 01:08:21.268	2025-09-12 01:08:21.268
cmfg524m6012tovboo1jd56qq	IMR DEVELOPMENT CORP.	2025-09-12 01:08:21.343	2025-09-12 01:08:21.343
cmfg524oa012uovbo0mognxvi	INDIAN CREEK COUNTRY CLUB	2025-09-12 01:08:21.419	2025-09-12 01:08:21.419
cmfg524qa012vovboutc3nxko	INDIAN HAMMOCK	2025-09-12 01:08:21.49	2025-09-12 01:08:21.49
cmfg524sa012wovbo984fgpn4	INDIAN TRACE ANIMAL HOSPITAL	2025-09-12 01:08:21.563	2025-09-12 01:08:21.563
cmfg524u9012xovbo3c62dn0s	INFINITY CONSTRUCTION	2025-09-12 01:08:21.634	2025-09-12 01:08:21.634
cmfg524we012yovboeudarstk	INFINITY CONSTRUCTION SOLUTIONS	2025-09-12 01:08:21.71	2025-09-12 01:08:21.71
cmfg524ye012zovboj6eh4p4p	INFINTY DEVELOPERS INC	2025-09-12 01:08:21.782	2025-09-12 01:08:21.782
cmfg5250f0130ovboeto1pvx6	INFRASTRUCTURE CORPORATION OF AMERICA	2025-09-12 01:08:21.856	2025-09-12 01:08:21.856
cmfg5252e0131ovboqhpktgyb	INNERSPACE	2025-09-12 01:08:21.926	2025-09-12 01:08:21.926
cmfg5254e0132ovbodw5k9b13	INNOVA ECO BUILDING SYSTEM	2025-09-12 01:08:21.999	2025-09-12 01:08:21.999
cmfg5256d0133ovbo7l4p7q65	INNOVATIVE PROPERTY	2025-09-12 01:08:22.07	2025-09-12 01:08:22.07
cmfg5258d0134ovbo8gpxwffr	INSIGHT FACILITIES MANAGEMENT	2025-09-12 01:08:22.141	2025-09-12 01:08:22.141
cmfg525ah0135ovbotv1w0xtl	INSTITUTE FOR CHILD & FAMILY HEALTH	2025-09-12 01:08:22.218	2025-09-12 01:08:22.218
cmfg525cj0136ovbo3zxpcxoo	INTCOMEX	2025-09-12 01:08:22.292	2025-09-12 01:08:22.292
cmfg525en0137ovboxgdgpx4o	INTEGRA DEVELOPMENT	2025-09-12 01:08:22.367	2025-09-12 01:08:22.367
cmfg525gl0138ovbo6bkp2c1r	INTERCONTINENTAL EXPORT SA	2025-09-12 01:08:22.437	2025-09-12 01:08:22.437
cmfg525im0139ovbo5qqu7sz9	INTERCOUNTY ENGINEERING, INC	2025-09-12 01:08:22.51	2025-09-12 01:08:22.51
cmfg525km013aovbom06n9rdf	INTERNATIONAL DATA DEPOSITORY	2025-09-12 01:08:22.583	2025-09-12 01:08:22.583
cmfg525mr013bovbo5arlhl8u	INTERNATIONAL TOWERS	2025-09-12 01:08:22.659	2025-09-12 01:08:22.659
cmfg525oq013covboj8ijcdmb	INTERSTATE 3 CONSTRUCTION CORPORATION	2025-09-12 01:08:22.731	2025-09-12 01:08:22.731
cmfg525qq013dovbo62jptkc9	INTERSTATE CONSTRUCTION, LLC	2025-09-12 01:08:22.803	2025-09-12 01:08:22.803
cmfg525sq013eovbo07friiiw	INTERSTATE CONSTRUCTION, LLC-	2025-09-12 01:08:22.875	2025-09-12 01:08:22.875
cmfg525uq013fovboffcb3vbe	INTERSTATE CONSTRUCTION, LLC:BRIGHT LINE JOB DELAY	2025-09-12 01:08:22.946	2025-09-12 01:08:22.946
cmfg525wq013govbo9aymisdz	INTERSTATE CONSTRUCTION, LLC:BRIGHTLINE SE DIXIE HWY 20154-02	2025-09-12 01:08:23.019	2025-09-12 01:08:23.019
cmfg525z4013hovbozie2buni	INTERSTATE CONSTRUCTION, LLC:MULTIPLE LOCATIONS OF GUARDRAIL	2025-09-12 01:08:23.105	2025-09-12 01:08:23.105
cmfg52617013iovboi2sz3s00	INTERSTATE CONSTRUCTION, LLC:SE DIXIE HWY - THRIE BEAM 20154-01	2025-09-12 01:08:23.179	2025-09-12 01:08:23.179
cmfg52638013jovbo99asjwhx	IRELA FIGUEROA	2025-09-12 01:08:23.252	2025-09-12 01:08:23.252
cmfg52657013kovbo4wwmpyy4	IRVING GRAU	2025-09-12 01:08:23.323	2025-09-12 01:08:23.323
cmfg52677013lovboioww4op4	ISC CONTRACTING	2025-09-12 01:08:23.395	2025-09-12 01:08:23.395
cmfg52698013movbogcuret2z	ISLAND ASSOCIATES	2025-09-12 01:08:23.468	2025-09-12 01:08:23.468
cmfg526b8013novbogaq3z1ir	ITASCA CONSTRUCTION ASSOCIATES, INC	2025-09-12 01:08:23.54	2025-09-12 01:08:23.54
cmfg526d8013oovbo4gjrnjsl	ITS GILBANE COMPANY	2025-09-12 01:08:23.612	2025-09-12 01:08:23.612
cmfg526f7013povboui4bf020	IVEY DEVELOPMENT-	2025-09-12 01:08:23.683	2025-09-12 01:08:23.683
cmfg526h7013qovbors526kxb	J & M UNDERGROUND	2025-09-12 01:08:23.755	2025-09-12 01:08:23.755
cmfg526j6013rovboycu7u1bh	J &S HOLDINGS INC	2025-09-12 01:08:23.827	2025-09-12 01:08:23.827
cmfg526l7013sovbofjoln30p	J RAYMOND CONSTRUCTION	2025-09-12 01:08:23.899	2025-09-12 01:08:23.899
cmfg526n7013tovbopdb7pomp	J TRADING LLC	2025-09-12 01:08:23.972	2025-09-12 01:08:23.972
cmfg526p6013uovboemfye0rh	J WAKEFIELD BREWING	2025-09-12 01:08:24.043	2025-09-12 01:08:24.043
cmfg526r7013vovbol642g84d	J. CAPPELLETI, INC	2025-09-12 01:08:24.115	2025-09-12 01:08:24.115
cmfg526t7013wovbo10uns9yb	J.R.T. CONSTRUCTION CO.	2025-09-12 01:08:24.187	2025-09-12 01:08:24.187
cmfg526v7013xovbo6nj81s6g	J.RAYMOND CONSTRUCTION CORP.	2025-09-12 01:08:24.26	2025-09-12 01:08:24.26
cmfg526xb013yovbof2qjvyd4	J2 SOLUTIONS	2025-09-12 01:08:24.335	2025-09-12 01:08:24.335
cmfg526zb013zovbo4rgx4t3m	JACK LYONS	2025-09-12 01:08:24.407	2025-09-12 01:08:24.407
cmfg5271b0140ovbott479piz	JACK THOMAS INC.	2025-09-12 01:08:24.479	2025-09-12 01:08:24.479
cmfg527390141ovbo578cndvh	JACKSON LAND DEVELOPMENT	2025-09-12 01:08:24.55	2025-09-12 01:08:24.55
cmfg5275a0142ovboxlw6eqrc	JACKSON MEMORIAL HOSPITAL	2025-09-12 01:08:24.622	2025-09-12 01:08:24.622
cmfg5277b0143ovbo2rff61d1	JACOBS CLASSIC MARKET	2025-09-12 01:08:24.695	2025-09-12 01:08:24.695
cmfg5279g0144ovbo9s2akra9	JADE BEACH CONDOMONIUMS	2025-09-12 01:08:24.772	2025-09-12 01:08:24.772
cmfg527bj0145ovbodyhk9r2m	JADE OCEAN MIAMI	2025-09-12 01:08:24.847	2025-09-12 01:08:24.847
cmfg527dn0146ovbo46dvucrq	JAMES A CUMMINGS, INC	2025-09-12 01:08:24.924	2025-09-12 01:08:24.924
cmfg527fo0147ovbobhmxals3	JAMES A CUMMINGS, INC:BROWARD COUNTY COURT HOUSE	2025-09-12 01:08:24.996	2025-09-12 01:08:24.996
cmfg527hs0148ovbo4id65e5i	JAMES A CUMMINGS, INC:DOLPHIN MALL - DUAL BRAND	2025-09-12 01:08:25.072	2025-09-12 01:08:25.072
cmfg527jt0149ovbo05gn7k2d	JAMES A CUMMINGS, INC:FNU	2025-09-12 01:08:25.145	2025-09-12 01:08:25.145
cmfg527lt014aovboyoeuyaz0	JAMES DOWNRITE CUSTOMER	2025-09-12 01:08:25.218	2025-09-12 01:08:25.218
cmfg527nz014bovbof45mbfef	JAMES NUNI	2025-09-12 01:08:25.296	2025-09-12 01:08:25.296
cmfg527pz014covbota3yqtlz	JANE BUFFINGTON	2025-09-12 01:08:25.368	2025-09-12 01:08:25.368
cmfg527s3014dovbo3fva0cxp	JANET-GEORGE	2025-09-12 01:08:25.444	2025-09-12 01:08:25.444
cmfg527u4014eovbo8u24dczb	JANET BENARD	2025-09-12 01:08:25.516	2025-09-12 01:08:25.516
cmfg527w3014fovbojctaco9l	JASCO CONSTRUCTION MANAGEMENT	2025-09-12 01:08:25.588	2025-09-12 01:08:25.588
cmfg527y4014govbo7k8nzxrc	JASIEL ROJAS	2025-09-12 01:08:25.661	2025-09-12 01:08:25.661
cmfg52804014hovbog0fpz0qt	JAVIER & JACKIE DEL LLANO	2025-09-12 01:08:25.732	2025-09-12 01:08:25.732
cmfg52828014iovbodp4scagf	JAVIER BETETA	2025-09-12 01:08:25.808	2025-09-12 01:08:25.808
cmfg52846014jovbolt5dnwfd	JAVIER GONZALEZ	2025-09-12 01:08:25.879	2025-09-12 01:08:25.879
cmfg52867014kovboudh136ci	JAXI BUILDER, INC	2025-09-12 01:08:25.951	2025-09-12 01:08:25.951
cmfg5288b014lovbotex53lhn	JAXI BUILDER, INC:AIRPORT SITE BULDING	2025-09-12 01:08:26.028	2025-09-12 01:08:26.028
cmfg528ag014movbon1usmaiz	JAXI BUILDER, INC:Cassia	2025-09-12 01:08:26.104	2025-09-12 01:08:26.104
cmfg528ck014novboc4n731om	JAXI BUILDER, INC:CONVENIENT WHOLESALES	2025-09-12 01:08:26.18	2025-09-12 01:08:26.18
cmfg528eo014oovbo0f81yhzv	JAXI BUILDER, INC:CUTLER MANOR II - 11850 SW 216 ST	2025-09-12 01:08:26.257	2025-09-12 01:08:26.257
cmfg528gq014povbo64nt3vm4	JAXI BUILDER, INC:DHL	2025-09-12 01:08:26.33	2025-09-12 01:08:26.33
cmfg528im014qovboyvw7wck3	JAXI BUILDER, INC:EMPIRE BRICKELL	2025-09-12 01:08:26.398	2025-09-12 01:08:26.398
cmfg528km014rovbonlovide4	JAXI BUILDER, INC:LEXUS OF KENDALL	2025-09-12 01:08:26.47	2025-09-12 01:08:26.47
cmfg528mq014sovboah9ek510	JAXI BUILDER, INC:PALMETTO TRADEPORT	2025-09-12 01:08:26.546	2025-09-12 01:08:26.546
cmfg528oq014tovbogsrjf3ye	JAXI BUILDER, INC:PROLOGIC LP BOISE CASCADE	2025-09-12 01:08:26.619	2025-09-12 01:08:26.619
cmfg528qr014uovboans6tyfv	JAXI BUILDER, INC:THE EDGE AT SUNSET	2025-09-12 01:08:26.691	2025-09-12 01:08:26.691
cmfg528sz014vovbo7f8dymhp	JAXI BUILDER, INC:WOODSPRINGS MIRAMAR	2025-09-12 01:08:26.772	2025-09-12 01:08:26.772
cmfg528v3014wovbo7l5upl67	JAY	2025-09-12 01:08:26.847	2025-09-12 01:08:26.847
cmfg528x2014xovbomowd2jf5	JAY LOVE	2025-09-12 01:08:26.919	2025-09-12 01:08:26.919
cmfg528z2014yovbofqv3cqcr	JAY MAYANI	2025-09-12 01:08:26.991	2025-09-12 01:08:26.991
cmfg52914014zovbor00zblhj	JAZSTECK CORP	2025-09-12 01:08:27.064	2025-09-12 01:08:27.064
cmfg529370150ovboehcp2sgf	JBC	2025-09-12 01:08:27.14	2025-09-12 01:08:27.14
cmfg529680151ovbo0w9e0ejg	JC INDUSTRIAL MANUFACTURING CORP.	2025-09-12 01:08:27.214	2025-09-12 01:08:27.214
cmfg5298e0152ovbo4bln7asj	JD'S ASPHALT ENGINEERING	2025-09-12 01:08:27.327	2025-09-12 01:08:27.327
cmfg529ae0153ovbo64it7w6c	JEFF ELLIS MANAGEMENT LLC	2025-09-12 01:08:27.399	2025-09-12 01:08:27.399
cmfg529cf0154ovbofj63ocv2	JEFF PATTERSON	2025-09-12 01:08:27.471	2025-09-12 01:08:27.471
cmfg529eh0155ovbonpbb3r8c	JEFF RYAN	2025-09-12 01:08:27.546	2025-09-12 01:08:27.546
cmfg529gh0156ovbo6tr746jd	JEFFERSON COURT CONDOMINUIMN	2025-09-12 01:08:27.618	2025-09-12 01:08:27.618
cmfg529ij0157ovbogluwr8lw	JEFFREY SAADEH	2025-09-12 01:08:27.691	2025-09-12 01:08:27.691
cmfg529ki0158ovbovt2zo704	JEROME GODIN	2025-09-12 01:08:27.763	2025-09-12 01:08:27.763
cmfg529mi0159ovboe9wkskt5	JESSIE TRICE COMMUNITY HEALTH CENTER	2025-09-12 01:08:27.835	2025-09-12 01:08:27.835
cmfg529oi015aovbo9yxx55jj	JESUS RODRIGUEZ	2025-09-12 01:08:27.906	2025-09-12 01:08:27.906
cmfg529qh015bovbo7rvkyoh1	JEWEL CONSTRUCTION CORP.	2025-09-12 01:08:27.978	2025-09-12 01:08:27.978
cmfg529sv015covbol7dltpb5	JEWISH COMMUNITY SERVICE	2025-09-12 01:08:28.064	2025-09-12 01:08:28.064
cmfg529uv015dovbokcal1mcu	JGB BUILDING	2025-09-12 01:08:28.136	2025-09-12 01:08:28.136
cmfg529x1015eovboulcr79a3	JHON LOMBARDY	2025-09-12 01:08:28.213	2025-09-12 01:08:28.213
cmfg529zg015fovbohrbrimj9	JHON MULVEHILL	2025-09-12 01:08:28.3	2025-09-12 01:08:28.3
cmfg52a1f015govboi7snaakz	JIM KIRK	2025-09-12 01:08:28.372	2025-09-12 01:08:28.372
cmfg52a3f015hovboy1irdzfu	JIMENEZ CONCRETE FINISH, INC	2025-09-12 01:08:28.443	2025-09-12 01:08:28.443
cmfg52a5h015iovbok352byhj	JIMMY	2025-09-12 01:08:28.517	2025-09-12 01:08:28.517
cmfg52a7h015jovbohbcoxj81	JIMMY D	2025-09-12 01:08:28.59	2025-09-12 01:08:28.59
cmfg52a9g015kovboe7lu8btp	JJ PLAZA REALTY	2025-09-12 01:08:28.66	2025-09-12 01:08:28.66
cmfg52abg015lovbo7r8dxfmc	JJR APARTMENTS	2025-09-12 01:08:28.732	2025-09-12 01:08:28.732
cmfg52adg015movboi89xkodf	JLL INDUSTRIAL	2025-09-12 01:08:28.804	2025-09-12 01:08:28.804
cmfg52afh015novboqcl40ft3	JOE	2025-09-12 01:08:28.878	2025-09-12 01:08:28.878
cmfg52ahh015oovboo5e0clh3	JOE DILELO	2025-09-12 01:08:28.95	2025-09-12 01:08:28.95
cmfg52ajh015povbomv7rh8ia	JOE GLICK	2025-09-12 01:08:29.021	2025-09-12 01:08:29.021
cmfg52alk015qovbopf68va6j	JOE HARRIS	2025-09-12 01:08:29.097	2025-09-12 01:08:29.097
cmfg52ank015rovbo78tqy4am	JOE HERRERA	2025-09-12 01:08:29.169	2025-09-12 01:08:29.169
cmfg52app015sovbodm8fored	JOEL ALONSO	2025-09-12 01:08:29.245	2025-09-12 01:08:29.245
cmfg52ars015tovbojljrlmbl	JOEL SHANKMAN	2025-09-12 01:08:29.321	2025-09-12 01:08:29.321
cmfg52atw015uovbodkmu1qai	JOHN - RIVERBEND MARINA	2025-09-12 01:08:29.397	2025-09-12 01:08:29.397
cmfg52avw015vovbou8mg6inq	JOHN BELL CONSTRUCTION	2025-09-12 01:08:29.468	2025-09-12 01:08:29.468
cmfg52axv015wovboj9b5dyq7	JOHN BUTRICO	2025-09-12 01:08:29.54	2025-09-12 01:08:29.54
cmfg52azv015xovboromufnfo	JOHN CHAINY	2025-09-12 01:08:29.612	2025-09-12 01:08:29.612
cmfg52b2e015yovbo8wq99bbi	JOHN FERREIRO	2025-09-12 01:08:29.702	2025-09-12 01:08:29.702
cmfg52b4d015zovbomr5mu2mz	JOHN HAMMEL	2025-09-12 01:08:29.773	2025-09-12 01:08:29.773
cmfg52b6d0160ovboab2eft8l	JOHN M HALL COMPANY	2025-09-12 01:08:29.846	2025-09-12 01:08:29.846
cmfg52b8d0161ovbohmj6vcn9	JOHN MORIARTY & ASSOCIATES	2025-09-12 01:08:29.917	2025-09-12 01:08:29.917
cmfg52bai0162ovbop7jk8kdu	JOHNSON BROS. CORP.	2025-09-12 01:08:29.994	2025-09-12 01:08:29.994
cmfg52bci0163ovboy3rnwr86	JOHNSON CONTROLS	2025-09-12 01:08:30.066	2025-09-12 01:08:30.066
cmfg52bei0164ovboxhrnfyb9	JOHNSON LAUX CONSTRUCTION	2025-09-12 01:08:30.138	2025-09-12 01:08:30.138
cmfg52bgg0165ovbo4k3g1sdb	JOLO FARMS	2025-09-12 01:08:30.208	2025-09-12 01:08:30.208
cmfg52bii0166ovbo0xgvblku	JONES BENITEZ CORPORATION	2025-09-12 01:08:30.282	2025-09-12 01:08:30.282
cmfg52bkh0167ovboh7d7j3u5	JORGE GONZALEZ	2025-09-12 01:08:30.354	2025-09-12 01:08:30.354
cmfg52bmh0168ovbohd137m5s	JORGE MORENO	2025-09-12 01:08:30.426	2025-09-12 01:08:30.426
cmfg52bog0169ovboq7c6e35u	JORGE PEREZ	2025-09-12 01:08:30.497	2025-09-12 01:08:30.497
cmfg52bqg016aovboy345ynm6	JORGE VELAZQUEZ 7001 LLC	2025-09-12 01:08:30.569	2025-09-12 01:08:30.569
cmfg52bsi016bovbogqzt6jv3	JORGE ZULUZA	2025-09-12 01:08:30.642	2025-09-12 01:08:30.642
cmfg52buh016covbovb0qle90	JOSE	2025-09-12 01:08:30.713	2025-09-12 01:08:30.713
cmfg52bwh016dovbo2bsprx1d	JOSE ALAVAREZ	2025-09-12 01:08:30.785	2025-09-12 01:08:30.785
cmfg52byk016eovbo1ryfh1cf	JOSE DELGADO	2025-09-12 01:08:30.861	2025-09-12 01:08:30.861
cmfg52c0l016fovbo93ba73sf	JOSE MARTIN	2025-09-12 01:08:30.933	2025-09-12 01:08:30.933
cmfg52c2k016govbo54322dqc	JOSE MOLINA	2025-09-12 01:08:31.004	2025-09-12 01:08:31.004
cmfg52c4p016hovbooiivxuwf	JOSE RIVERA	2025-09-12 01:08:31.082	2025-09-12 01:08:31.082
cmfg52c6s016iovbodozjg9h1	JOSE VILABOY	2025-09-12 01:08:31.156	2025-09-12 01:08:31.156
cmfg52c8s016jovbo993hymi0	JOSEPH	2025-09-12 01:08:31.228	2025-09-12 01:08:31.228
cmfg52car016kovboduocga3s	JOSH NAVARRO	2025-09-12 01:08:31.299	2025-09-12 01:08:31.299
cmfg52ccr016lovbowk8olefc	JP PARKING LOT MAINTENANCE INC	2025-09-12 01:08:31.371	2025-09-12 01:08:31.371
cmfg52cer016movbo3lidflt2	JRT CONSTRUCTION CO.	2025-09-12 01:08:31.443	2025-09-12 01:08:31.443
cmfg52cgq016novbokw3hgojb	JUAN HERNANDEZ	2025-09-12 01:08:31.515	2025-09-12 01:08:31.515
cmfg52ciq016oovbomvofx4of	JUAN M RESTREPO	2025-09-12 01:08:31.586	2025-09-12 01:08:31.586
cmfg52ckr016povbo9ciy33ix	JUAN MANZANO	2025-09-12 01:08:31.659	2025-09-12 01:08:31.659
cmfg52cmr016qovbogxp0zwgj	JUAN PULLES	2025-09-12 01:08:31.731	2025-09-12 01:08:31.731
cmfg52cov016rovboj9hnai16	JUD KURLANCHEEK	2025-09-12 01:08:31.808	2025-09-12 01:08:31.808
cmfg52cqz016sovbochpmv2ss	JULIO ARRIAGA	2025-09-12 01:08:31.883	2025-09-12 01:08:31.883
cmfg52csz016tovboigoi30pl	JULIO LEGANOA	2025-09-12 01:08:31.955	2025-09-12 01:08:31.955
cmfg52cuz016uovbo87ly7dxe	JULIO LEGENOA	2025-09-12 01:08:32.027	2025-09-12 01:08:32.027
cmfg52cx0016vovbo69ugorqu	JULIO MAGRISSO	2025-09-12 01:08:32.1	2025-09-12 01:08:32.1
cmfg52cyz016wovboft7228s6	JUNE 54 PROPERTIES, LLC	2025-09-12 01:08:32.172	2025-09-12 01:08:32.172
cmfg52d0y016xovbotvog2zty	JUNGLE ISLAND	2025-09-12 01:08:32.243	2025-09-12 01:08:32.243
cmfg52d31016yovbodd4xvzl9	JUPITER CONSTRUCTION	2025-09-12 01:08:32.318	2025-09-12 01:08:32.318
cmfg52d54016zovbo3tvb73u9	JUVENILE DETENTION CENTER FORT MYERS	2025-09-12 01:08:32.392	2025-09-12 01:08:32.392
cmfg52d780170ovbokp66wux5	JVA ENGINEERING CONTRACTOR, INC	2025-09-12 01:08:32.469	2025-09-12 01:08:32.469
cmfg52d980171ovbo31gd7ebk	JVA ENGINEERING CONTRACTOR, INC:ALVA CONCRETE PLANT	2025-09-12 01:08:32.541	2025-09-12 01:08:32.541
cmfg52db80172ovboj7a3giwj	JVA ENGINEERING CONTRACTOR, INC:CITY OF DORAL-NW 102 AVE	2025-09-12 01:08:32.613	2025-09-12 01:08:32.613
cmfg52ddc0173ovbo21gskcda	JVA ENGINEERING CONTRACTOR, INC:E6N47	2025-09-12 01:08:32.688	2025-09-12 01:08:32.688
cmfg52dfl0174ovbokpmyi49y	JVA ENGINEERING CONTRACTOR, INC:E6N47 CORAL WAY ROUNDABOUT	2025-09-12 01:08:32.769	2025-09-12 01:08:32.769
cmfg52dhl0175ovbokc2ferzs	JVA ENGINEERING CONTRACTOR, INC:E6N47 PO	2025-09-12 01:08:32.841	2025-09-12 01:08:32.841
cmfg52djl0176ovbo410s8lay	JVA ENGINEERING CONTRACTOR, INC:E8S87 Sunrise	2025-09-12 01:08:32.913	2025-09-12 01:08:32.913
cmfg52dll0177ovbo2vyitqtm	JVA ENGINEERING CONTRACTOR, INC:LAKE LOWELL	2025-09-12 01:08:32.985	2025-09-12 01:08:32.985
cmfg52dnl0178ovbodua41lzc	JVA ENGINEERING CONTRACTOR, INC:NW 37TH AVE	2025-09-12 01:08:33.057	2025-09-12 01:08:33.057
cmfg52dpl0179ovbobczh2472	JVA ENGINEERING CONTRACTOR, INC:POWERLIND RD	2025-09-12 01:08:33.13	2025-09-12 01:08:33.13
cmfg52drl017aovbokx44l634	JVA ENGINEERING CONTRACTOR, INC:SHORELINE REPAIRS	2025-09-12 01:08:33.201	2025-09-12 01:08:33.201
cmfg52dtu017bovbo18k3znl5	JVA ENGINEERING CONTRACTOR, INC:SW 137 AVE - ROAD IMPROVEMENTS	2025-09-12 01:08:33.282	2025-09-12 01:08:33.282
cmfg52dvy017covboki4qgkfk	JVA ENGINEERING CONTRACTOR, INC:T6452 - US1 AT 112	2025-09-12 01:08:33.358	2025-09-12 01:08:33.358
cmfg52dy1017dovbov693if0s	JVA ENGINEERING CONTRACTOR, INC:T6452 SW 211 ST	2025-09-12 01:08:33.434	2025-09-12 01:08:33.434
cmfg52e01017eovboudqaefqq	JVA ENGINEERING CONTRACTOR, INC:T6474 - SR 7	2025-09-12 01:08:33.505	2025-09-12 01:08:33.505
cmfg52e21017fovboansaf886	JVA ENGINEERING CONTRACTOR, INC:T6564	2025-09-12 01:08:33.577	2025-09-12 01:08:33.577
cmfg52e42017govbosbaijs0p	JW JONES CONTRACTING INC	2025-09-12 01:08:33.65	2025-09-12 01:08:33.65
cmfg52e62017hovbolc13bs6u	JZT UTILITIES INC.	2025-09-12 01:08:33.723	2025-09-12 01:08:33.723
cmfg52e86017iovbonslw21af	K.M.E.C Engineers	2025-09-12 01:08:33.799	2025-09-12 01:08:33.799
cmfg52eaf017jovbo40pa9dju	KAILAS CONTRACTORS	2025-09-12 01:08:33.879	2025-09-12 01:08:33.879
cmfg52ecf017kovbo1ut64qm0	KAMAN INDUSTRIAL TECHONOLOGIES	2025-09-12 01:08:33.951	2025-09-12 01:08:33.951
cmfg52eee017lovbot6259lmm	KAREN SCHEINBERG	2025-09-12 01:08:34.022	2025-09-12 01:08:34.022
cmfg52egf017movboutcqx7ib	KAREN TILDO	2025-09-12 01:08:34.095	2025-09-12 01:08:34.095
cmfg52eij017novbot0g627xg	KARL BRISSON	2025-09-12 01:08:34.172	2025-09-12 01:08:34.172
cmfg52ekj017oovbos2glh2lj	KAST CONSTRUCTION	2025-09-12 01:08:34.243	2025-09-12 01:08:34.243
cmfg52emn017povbo50i46mme	KAST CONSTRUCTION:LEGACY HOTEL	2025-09-12 01:08:34.32	2025-09-12 01:08:34.32
cmfg52eon017qovbo8kgfslye	KAST STONE, INC	2025-09-12 01:08:34.391	2025-09-12 01:08:34.391
cmfg52eqo017rovbok92aw701	KATE ENTERPRISES	2025-09-12 01:08:34.464	2025-09-12 01:08:34.464
cmfg52eso017sovborbyiampa	KATHY GREEN	2025-09-12 01:08:34.536	2025-09-12 01:08:34.536
cmfg52eun017tovbovrf3ibjp	KAUFMAN LYNN CONSTRUCTION	2025-09-12 01:08:34.608	2025-09-12 01:08:34.608
cmfg52ewo017uovbouc9v8chn	KAWA CLUB	2025-09-12 01:08:34.68	2025-09-12 01:08:34.68
cmfg52eyr017vovboqhcd0xuk	KC & INTERIORS, INC.	2025-09-12 01:08:34.755	2025-09-12 01:08:34.755
cmfg52f0r017wovbob7ryqmeh	KEARNS CONSTRUCTION CO.	2025-09-12 01:08:34.827	2025-09-12 01:08:34.827
cmfg52f2s017xovbou5k6hr1v	KEITH DUNN	2025-09-12 01:08:34.9	2025-09-12 01:08:34.9
cmfg52f4s017yovbo5yujuwjn	KELLY ABRAHAM	2025-09-12 01:08:34.972	2025-09-12 01:08:34.972
cmfg52f6v017zovboqsl8s41f	KELLY MAC CONST.HOUSE	2025-09-12 01:08:35.048	2025-09-12 01:08:35.048
cmfg52f930180ovboopocnye2	KELLY TRACTOR	2025-09-12 01:08:35.128	2025-09-12 01:08:35.128
cmfg52fb40181ovboz2ly0akn	kendall crossings	2025-09-12 01:08:35.2	2025-09-12 01:08:35.2
cmfg52fd40182ovbo6qlsbvui	KENDALL GATE	2025-09-12 01:08:35.273	2025-09-12 01:08:35.273
cmfg52ff50183ovbotxkl43p1	KENLAND BEND SOUTH CONDO ASSOCIATION	2025-09-12 01:08:35.345	2025-09-12 01:08:35.345
cmfg52fh40184ovbo7rglzykb	KENNEDY CONTRACTORS	2025-09-12 01:08:35.416	2025-09-12 01:08:35.416
cmfg52fj40185ovbozvqsve7w	KETLY MARCUS	2025-09-12 01:08:35.488	2025-09-12 01:08:35.488
cmfg52fl30186ovboadepzveb	KEVIN AMES	2025-09-12 01:08:35.56	2025-09-12 01:08:35.56
cmfg52fn40187ovbo0go74uua	KEY COLONY HOMEOWNERS ASSOCIATION, INC.	2025-09-12 01:08:35.633	2025-09-12 01:08:35.633
cmfg52fp80188ovboum429u67	KEY RAPS BASEBALL ACADEMY	2025-09-12 01:08:35.709	2025-09-12 01:08:35.709
cmfg52fr90189ovboowilzpcg	KEY WEST MARINA	2025-09-12 01:08:35.781	2025-09-12 01:08:35.781
cmfg52ftd018aovboiaouj4bn	KEYS CONTRACTING SERVICES, INC	2025-09-12 01:08:35.857	2025-09-12 01:08:35.857
cmfg52fvg018bovbowa5ta3z6	KEYSTONE LAKE ASSOCIATION	2025-09-12 01:08:35.932	2025-09-12 01:08:35.932
cmfg52fxg018covbo1bytoh6v	KEYSTONE PROPERTY MANAGMENT	2025-09-12 01:08:36.004	2025-09-12 01:08:36.004
cmfg52fzh018dovboh7reb4bq	KIDZ KORNER DAY CARE	2025-09-12 01:08:36.078	2025-09-12 01:08:36.078
cmfg52g1i018eovbox0sp787n	KIEWIT - WATER FACILITIES SOUTH CO.	2025-09-12 01:08:36.15	2025-09-12 01:08:36.15
cmfg52g3k018fovbo1i2kb9ig	KIEWIT INFRASTRUCTURE GROUP	2025-09-12 01:08:36.225	2025-09-12 01:08:36.225
cmfg52g5l018govbo3v0i9t2u	KIEWIT INFRASTUCTURE SOUTH CO.	2025-09-12 01:08:36.297	2025-09-12 01:08:36.297
cmfg52g7l018hovbo985xwvmc	KIEWIT INFRASTUCTURE SOUTH CO.:S703 PUMP STA.	2025-09-12 01:08:36.369	2025-09-12 01:08:36.369
cmfg52g9k018iovboqsmq9958	KILLIAN GREENS GOLF CLUB	2025-09-12 01:08:36.441	2025-09-12 01:08:36.441
cmfg52gbl018jovbot2y91kxk	KMC CORP	2025-09-12 01:08:36.513	2025-09-12 01:08:36.513
cmfg52gdl018kovbouvq7yyho	KNAPHEIDE TRUCK EQUIPMENT SOUTHEAST	2025-09-12 01:08:36.586	2025-09-12 01:08:36.586
cmfg52gfp018lovbo94w78a2i	KNIGHT PARKING SYSTEMS	2025-09-12 01:08:36.661	2025-09-12 01:08:36.661
cmfg52ghp018movbojdr38j3r	KNL PAINTING	2025-09-12 01:08:36.733	2025-09-12 01:08:36.733
cmfg52gjp018novbopl9gbgox	KOPF Acquisitions, LLC	2025-09-12 01:08:36.805	2025-09-12 01:08:36.805
cmfg52glp018oovbodvj7ui3i	KRISTINE BURGER	2025-09-12 01:08:36.877	2025-09-12 01:08:36.877
cmfg52gv4018povboth092deb	KROLL KONSTRUCTION	2025-09-12 01:08:37.216	2025-09-12 01:08:37.216
cmfg52gx7018qovboygj8wq25	KSN	2025-09-12 01:08:37.291	2025-09-12 01:08:37.291
cmfg52gz8018rovbovh03m02b	KVC CONSTRUCTORS, INC.	2025-09-12 01:08:37.365	2025-09-12 01:08:37.365
cmfg52h1f018sovbokutu7kzf	KW Property Management & Consulting	2025-09-12 01:08:37.444	2025-09-12 01:08:37.444
cmfg52h3f018tovborrfkz54g	KYLE COOK	2025-09-12 01:08:37.515	2025-09-12 01:08:37.515
cmfg52h5i018uovbovzbrddkq	L & C ROYAL MANAGEMENT	2025-09-12 01:08:37.591	2025-09-12 01:08:37.591
cmfg52h7h018vovboaknem3s9	L & C ROYAL MANAGEMENT CORP.	2025-09-12 01:08:37.661	2025-09-12 01:08:37.661
cmfg52h9g018wovboyddbqbth	LA FUENTE CONDO ASSOCIATION	2025-09-12 01:08:37.732	2025-09-12 01:08:37.732
cmfg52hbk018xovbocmaa90bq	LAHOUD & HARDAN ENTERPRISES, INC.	2025-09-12 01:08:37.808	2025-09-12 01:08:37.808
cmfg52hdo018yovbo4pu6o8ox	LAKE PLACID CONDO ASSOCIATION	2025-09-12 01:08:37.884	2025-09-12 01:08:37.884
cmfg52hgj018zovbor1yl57rq	LAKE TERRACE APARTMENTS	2025-09-12 01:08:37.987	2025-09-12 01:08:37.987
cmfg52his0190ovbozfx2i7f8	LAKES BY THE MEADOW	2025-09-12 01:08:38.069	2025-09-12 01:08:38.069
cmfg52hl10191ovboro6udvir	LAMBERT BROS, INC.	2025-09-12 01:08:38.149	2025-09-12 01:08:38.149
cmfg52hn90192ovborjv19el2	LAND CAP	2025-09-12 01:08:38.23	2025-09-12 01:08:38.23
cmfg52hpa0193ovbolto5lv2x	LAND DEVELOPERS CONSORTIUM	2025-09-12 01:08:38.303	2025-09-12 01:08:38.303
cmfg52hrb0194ovbox8llg6ew	LAND ROVER SOUTH DADE-	2025-09-12 01:08:38.375	2025-09-12 01:08:38.375
cmfg52htj0195ovbo98q9w0w9	LANDCASTER LLC	2025-09-12 01:08:38.455	2025-09-12 01:08:38.455
cmfg52hvs0196ovbo0d5fv17x	LANE CONSTRUCTION CORP	2025-09-12 01:08:38.536	2025-09-12 01:08:38.536
cmfg52hxs0197ovboq6exul5k	LANE CONSTRUCTION CORP:E8U08	2025-09-12 01:08:38.609	2025-09-12 01:08:38.609
cmfg52hzv0198ovbo1znor7hq	LANE CONSTRUCTION CORP:E8U08 PO	2025-09-12 01:08:38.684	2025-09-12 01:08:38.684
cmfg52i200199ovboyg2lcsjy	LANIER PARKING SYSTEMS	2025-09-12 01:08:38.761	2025-09-12 01:08:38.761
cmfg52i44019aovbozcycb6mg	LANZO CONSTRUCTION	2025-09-12 01:08:38.836	2025-09-12 01:08:38.836
cmfg52i64019bovboj96omp13	LANZO CONSTRUCTION:NEW PUMP STATION #0301	2025-09-12 01:08:38.909	2025-09-12 01:08:38.909
cmfg52i85019covbo0t25ezf5	LANZO CONSTRUCTION:SW HALLANDALE BEACH	2025-09-12 01:08:38.981	2025-09-12 01:08:38.981
cmfg52ia9019dovbo1ex8n8f2	LAPARKAN TRADING	2025-09-12 01:08:39.058	2025-09-12 01:08:39.058
cmfg52ich019eovbov9sght5w	LARIAN, LLC	2025-09-12 01:08:39.138	2025-09-12 01:08:39.138
cmfg52iem019fovboqt45uvct	LARRY SACKS	2025-09-12 01:08:39.214	2025-09-12 01:08:39.214
cmfg52igw019govbo87x9smh2	LAS BRISAS AT COUNTRY CLUB	2025-09-12 01:08:39.296	2025-09-12 01:08:39.296
cmfg52ij2019hovbor39gb0vr	LAUDERDALE MARINE CENTER	2025-09-12 01:08:39.375	2025-09-12 01:08:39.375
cmfg52il6019iovbo8k94qts5	LAVAJET	2025-09-12 01:08:39.451	2025-09-12 01:08:39.451
cmfg52in9019jovboc2is4z4q	LAYNE CONSTRUCTION	2025-09-12 01:08:39.525	2025-09-12 01:08:39.525
cmfg52ipj019kovbod12hpxcd	LAZARO DELIVERY	2025-09-12 01:08:39.608	2025-09-12 01:08:39.608
cmfg52iro019lovboovndu7cs	LAZARO DOMINGUEZ	2025-09-12 01:08:39.684	2025-09-12 01:08:39.684
cmfg52iu1019movbo692hdr97	LAZARO MORALES	2025-09-12 01:08:39.769	2025-09-12 01:08:39.769
cmfg52iw5019novboe94ojac7	LCCI CONSTRUCTION	2025-09-12 01:08:39.846	2025-09-12 01:08:39.846
cmfg52iya019oovbokxtw36uk	LCK AIA, INC	2025-09-12 01:08:39.923	2025-09-12 01:08:39.923
cmfg52j0a019povbo89jyz1bd	LCK/ AIA, INC	2025-09-12 01:08:39.995	2025-09-12 01:08:39.995
cmfg52j2d019qovboo85cxlu6	LEAD ENGINEERING CONTRACTORS	2025-09-12 01:08:40.07	2025-09-12 01:08:40.07
cmfg52j4d019rovbom8ynvh0s	LEAD ENGINEERING CONTRACTORS:PORT EVERGLADES	2025-09-12 01:08:40.141	2025-09-12 01:08:40.141
cmfg52j6e019sovbogcnn64ln	LEAD ENGINEERING CONTRACTORS:PORT EVERGLADES PO	2025-09-12 01:08:40.214	2025-09-12 01:08:40.214
cmfg52j8k019tovbold3ioli7	LEAD ENGINEERING CONTRACTORS:UNDERLINE PHASE II	2025-09-12 01:08:40.293	2025-09-12 01:08:40.293
cmfg52jak019uovboc3y7s5wl	LEADER CORP.	2025-09-12 01:08:40.364	2025-09-12 01:08:40.364
cmfg52jcl019vovboomja2x3k	LEADEX CORP.	2025-09-12 01:08:40.437	2025-09-12 01:08:40.437
cmfg52jen019wovboydvnyvpl	LEBOLO CONSTRUCTION MANAGEMENT	2025-09-12 01:08:40.511	2025-09-12 01:08:40.511
cmfg52jgs019xovbox1s4845v	LEE CONSTRUCTION GROUP, INC	2025-09-12 01:08:40.588	2025-09-12 01:08:40.588
cmfg52jiw019yovbo3ilz1vpz	LEED CONSTRUCTION GROUP	2025-09-12 01:08:40.664	2025-09-12 01:08:40.664
cmfg52jl0019zovbold4c2u3c	LEGO CONSTRUCTION	2025-09-12 01:08:40.74	2025-09-12 01:08:40.74
cmfg52jn901a0ovbo9xvokwlr	LEGO CONSTRUCTION-	2025-09-12 01:08:40.822	2025-09-12 01:08:40.822
cmfg52jpa01a1ovbotua6qxcs	LEHMAN PROPERTY MANAGEMENT, INC.	2025-09-12 01:08:40.894	2025-09-12 01:08:40.894
cmfg52jrm01a2ovbofrx7olpd	LEMARTEC ENGINEERING & CONSTRUCTION CORP.	2025-09-12 01:08:40.979	2025-09-12 01:08:40.979
cmfg52jtm01a3ovboylc9tqd3	LENNAR	2025-09-12 01:08:41.05	2025-09-12 01:08:41.05
cmfg52jvr01a4ovbouwbb6rjd	LENNOX MIAMI CORP.	2025-09-12 01:08:41.127	2025-09-12 01:08:41.127
cmfg52jxt01a5ovbo4bqllt3e	LEONARDO CARRASCOSA	2025-09-12 01:08:41.201	2025-09-12 01:08:41.201
cmfg52jzy01a6ovbo1azo3lza	LETENDRE BRIAN	2025-09-12 01:08:41.279	2025-09-12 01:08:41.279
cmfg52k2401a7ovbouy3stx1c	LILIANA FONG	2025-09-12 01:08:41.356	2025-09-12 01:08:41.356
cmfg52k4901a8ovbobky8iyjl	LILIANAS DAD HOUSE	2025-09-12 01:08:41.433	2025-09-12 01:08:41.433
cmfg52k6d01a9ovbob301x2ln	LINCOLN WOODS TOWER	2025-09-12 01:08:41.51	2025-09-12 01:08:41.51
cmfg52k8h01aaovbo8w1x4fc1	LINDA MAJUSKAS	2025-09-12 01:08:41.585	2025-09-12 01:08:41.585
cmfg52kak01abovbo7x1ojz7h	LINDA MARIANO	2025-09-12 01:08:41.661	2025-09-12 01:08:41.661
cmfg52kcp01acovbola0ab90y	LINENS OF THE WEEK	2025-09-12 01:08:41.737	2025-09-12 01:08:41.737
cmfg52keq01adovboshksz752	LINK CONSTRUCTION GROUP	2025-09-12 01:08:41.811	2025-09-12 01:08:41.811
cmfg52kgz01aeovbodpfit35m	LINK CONSTRUCTION GROUP:SKY BRIDGE EAST	2025-09-12 01:08:41.892	2025-09-12 01:08:41.892
cmfg52kj301afovbooui206wd	LINK CONSTRUCTION GROUP:SKY BRIDGE EAST PO	2025-09-12 01:08:41.968	2025-09-12 01:08:41.968
cmfg52kl701agovbokfi1hqxx	LINNED GOMEZ	2025-09-12 01:08:42.043	2025-09-12 01:08:42.043
cmfg52kn901ahovbolu434dyq	LITTLE BAY MANOR	2025-09-12 01:08:42.117	2025-09-12 01:08:42.117
cmfg52kp801aiovboeiijzks1	LITTLE RIVER YACHT CLUB	2025-09-12 01:08:42.188	2025-09-12 01:08:42.188
cmfg52ksf01ajovbosxzptyw5	LITZ ENGINEERING INC	2025-09-12 01:08:42.268	2025-09-12 01:08:42.268
cmfg52kuk01akovborr6dv4qi	LM PENZI & SON	2025-09-12 01:08:42.38	2025-09-12 01:08:42.38
cmfg52kwm01alovbouiix1smp	LO TRADING	2025-09-12 01:08:42.455	2025-09-12 01:08:42.455
cmfg52kyo01amovbop04e0q2q	LOCKLIN MSR	2025-09-12 01:08:42.528	2025-09-12 01:08:42.528
cmfg52l0s01anovboarwo54ak	LOMBARDI PROPERTIES	2025-09-12 01:08:42.605	2025-09-12 01:08:42.605
cmfg52l2x01aoovborazzai7y	LOSADO SURVEY SERVICES INC.	2025-09-12 01:08:42.682	2025-09-12 01:08:42.682
cmfg52l4y01apovboyxwfj18o	LOTSPEICH CO. OF FLORIDA INC	2025-09-12 01:08:42.754	2025-09-12 01:08:42.754
cmfg52l7101aqovbod425llio	LOUIS BERGER COMPANY	2025-09-12 01:08:42.83	2025-09-12 01:08:42.83
cmfg52l9501arovbonlysrwr7	LOWELL DUNN	2025-09-12 01:08:42.906	2025-09-12 01:08:42.906
cmfg52lba01asovbo3vsx7iuw	LPS CONTRACTING	2025-09-12 01:08:42.982	2025-09-12 01:08:42.982
cmfg52ldb01atovbo25g9xvwa	LTC RENTAL	2025-09-12 01:08:43.055	2025-09-12 01:08:43.055
cmfg52lfb01auovboe1hrcvzn	LTS	2025-09-12 01:08:43.127	2025-09-12 01:08:43.127
cmfg52lha01avovbo31cgh02d	LUIS ALEXANDER	2025-09-12 01:08:43.198	2025-09-12 01:08:43.198
cmfg52lje01awovboei4ce8rn	LUIS CARRILLO	2025-09-12 01:08:43.275	2025-09-12 01:08:43.275
cmfg52lle01axovbov180bvg4	LUIS RODRIGUEZ	2025-09-12 01:08:43.347	2025-09-12 01:08:43.347
cmfg52lna01ayovboel831h4f	LUISEDA DETSON	2025-09-12 01:08:43.414	2025-09-12 01:08:43.414
cmfg52lpa01azovboqmu537ox	LUKAS METALS CO. INC.	2025-09-12 01:08:43.486	2025-09-12 01:08:43.486
cmfg52lrb01b0ovboti6vzld5	LUNA DEVELOPMENT.	2025-09-12 01:08:43.559	2025-09-12 01:08:43.559
cmfg52lt901b1ovbov6u7ho7o	LUNACON CONSTRUCTION GROUP.	2025-09-12 01:08:43.63	2025-09-12 01:08:43.63
cmfg52lv401b2ovbo1shxtwus	LUXON CONSTRUCTION	2025-09-12 01:08:43.697	2025-09-12 01:08:43.697
cmfg52lx001b3ovboydhaz1mq	LYDEN SPICE	2025-09-12 01:08:43.764	2025-09-12 01:08:43.764
cmfg52lz101b4ovbogmfo9pk1	LYNN WESTALL	2025-09-12 01:08:43.837	2025-09-12 01:08:43.837
cmfg52m0w01b5ovboj7ksn1r5	M & J CONSTRUCTION	2025-09-12 01:08:43.905	2025-09-12 01:08:43.905
cmfg52m2w01b6ovbon6sdkdt8	M & M DORAL INVESTMENTS, LLC	2025-09-12 01:08:43.977	2025-09-12 01:08:43.977
cmfg52m5001b7ovbohojt96ts	MAC CONSTRUCTION	2025-09-12 01:08:44.052	2025-09-12 01:08:44.052
cmfg52m7001b8ovbo410krdl6	MACK'S FISH CAMP	2025-09-12 01:08:44.125	2025-09-12 01:08:44.125
cmfg52m8q01b9ovbom82avil1	MACMILLAN OIL COMPANY OF FLORIDA, INC.	2025-09-12 01:08:44.187	2025-09-12 01:08:44.187
cmfg52mar01baovbogoujz7n0	MACMILLAN OIL COMPANY, LLC	2025-09-12 01:08:44.26	2025-09-12 01:08:44.26
cmfg52mcl01bbovbong2h3zuz	MAD CONSTRUCTION	2025-09-12 01:08:44.326	2025-09-12 01:08:44.326
cmfg52mes01bcovbovigu0fgj	MAESTRE CONSTRUCTION, INC	2025-09-12 01:08:44.405	2025-09-12 01:08:44.405
cmfg52mgp01bdovbov8ycvuf6	MAG CONSTRUCTION	2025-09-12 01:08:44.474	2025-09-12 01:08:44.474
cmfg52miq01beovbol5iy7xno	MAGGIE AGUIAR	2025-09-12 01:08:44.546	2025-09-12 01:08:44.546
cmfg52mkq01bfovbocujfvhx8	MAGIC CITY DEVELOPMENT	2025-09-12 01:08:44.618	2025-09-12 01:08:44.618
cmfg52mmr01bgovboh7qlx9c3	MAGNA CM, INC	2025-09-12 01:08:44.692	2025-09-12 01:08:44.692
cmfg52moq01bhovbou8n4whe3	MAGUEN DAVID LLC	2025-09-12 01:08:44.762	2025-09-12 01:08:44.762
cmfg52mql01biovbof9pydwb2	MAIMI DADE COMMUNITY	2025-09-12 01:08:44.829	2025-09-12 01:08:44.829
cmfg52msg01bjovbo0qh1hfyc	MAJESTIC REALITY	2025-09-12 01:08:44.897	2025-09-12 01:08:44.897
cmfg52mug01bkovbod5mmfn28	MANATEE CONTRACTORS	2025-09-12 01:08:44.969	2025-09-12 01:08:44.969
cmfg52mwi01blovboelkqi6ad	MANNY CASTAÑO	2025-09-12 01:08:45.042	2025-09-12 01:08:45.042
cmfg52myh01bmovbo24rz5rib	MANNY OROL	2025-09-12 01:08:45.114	2025-09-12 01:08:45.114
cmfg52n0801bnovboqmxwf11i	Manolito	2025-09-12 01:08:45.177	2025-09-12 01:08:45.177
cmfg52n2301boovbox3jtlnyk	MANUEL KADRE	2025-09-12 01:08:45.244	2025-09-12 01:08:45.244
cmfg52n4701bpovboeixanid1	MANUEL VALDEZ	2025-09-12 01:08:45.32	2025-09-12 01:08:45.32
cmfg52n6701bqovbo34ietkvr	MAPI DISTRIBUTION SERVICES, INC	2025-09-12 01:08:45.391	2025-09-12 01:08:45.391
cmfg52n8301brovbo8ip8j8b5	MARCDAN INC.	2025-09-12 01:08:45.459	2025-09-12 01:08:45.459
cmfg52na401bsovbo6fjoc8c2	MARCH PROPERTY ACQUISITIONS LLC	2025-09-12 01:08:45.533	2025-09-12 01:08:45.533
cmfg52nc901btovbo16uxo023	MARCOS	2025-09-12 01:08:45.61	2025-09-12 01:08:45.61
cmfg52nea01buovbon9qmz955	MARCOS VALERO.	2025-09-12 01:08:45.682	2025-09-12 01:08:45.682
cmfg52nga01bvovboy7i5d7nv	MARIA	2025-09-12 01:08:45.754	2025-09-12 01:08:45.754
cmfg52ni501bwovbo275h7bqf	MARIA ELENA WOLLBERG	2025-09-12 01:08:45.821	2025-09-12 01:08:45.821
cmfg52nlh01bxovbo1z5x80pv	MARIA GOODIE	2025-09-12 01:08:45.942	2025-09-12 01:08:45.942
cmfg52nnd01byovboedi8ng5o	MARIA RAPIO	2025-09-12 01:08:46.009	2025-09-12 01:08:46.009
cmfg52npd01bzovbol35rlguv	MARILYN	2025-09-12 01:08:46.082	2025-09-12 01:08:46.082
cmfg52nr801c0ovboigb09d5x	MARINE PROPULSION LADERDALE PROPELER	2025-09-12 01:08:46.149	2025-09-12 01:08:46.149
cmfg52nv901c1ovbow6qvltoh	MARIOTTINI CONSTRUCTION	2025-09-12 01:08:46.294	2025-09-12 01:08:46.294
cmfg52nxb01c2ovboxpnw60x9	MARITIME HOMES LLC	2025-09-12 01:08:46.367	2025-09-12 01:08:46.367
cmfg52nz601c3ovbo1j4iwukt	MARK	2025-09-12 01:08:46.434	2025-09-12 01:08:46.434
cmfg52o1601c4ovbolf9ohfqk	MARK BLACKBURN	2025-09-12 01:08:46.506	2025-09-12 01:08:46.506
cmfg52o3701c5ovbop8tce1qb	MARK ECKSTEIN	2025-09-12 01:08:46.58	2025-09-12 01:08:46.58
cmfg52o5801c6ovbo9i815n98	MARKET AMERICAS	2025-09-12 01:08:46.652	2025-09-12 01:08:46.652
cmfg52o7301c7ovbomoh2kf33	Marovi Florida International, Inc.	2025-09-12 01:08:46.719	2025-09-12 01:08:46.719
cmfg52o8y01c8ovbov6qw4i2y	MARQUEZ TRUCKING	2025-09-12 01:08:46.787	2025-09-12 01:08:46.787
cmfg52oaz01c9ovbo3wsxugs5	MARRERO CONSTRUCTION	2025-09-12 01:08:46.86	2025-09-12 01:08:46.86
cmfg52ocz01caovbo56kdkx9i	MARSEILLES 5	2025-09-12 01:08:46.932	2025-09-12 01:08:46.932
cmfg52ofg01cbovboz7zhsxe9	MARTIN STUART LTD	2025-09-12 01:08:47.021	2025-09-12 01:08:47.021
cmfg52ohg01ccovboqzrwzsv5	MASHAN CONTRACTOR, INC	2025-09-12 01:08:47.093	2025-09-12 01:08:47.093
cmfg52ojg01cdovbo04ndu9y3	MASJID UL MUMINEEN	2025-09-12 01:08:47.164	2025-09-12 01:08:47.164
cmfg52olh01ceovbouz6c4m1o	MASON DEVELOPMENT AND CONSTRUCTION	2025-09-12 01:08:47.237	2025-09-12 01:08:47.237
cmfg52ong01cfovbo1ktvrhz9	MASON VITAMINS	2025-09-12 01:08:47.309	2025-09-12 01:08:47.309
cmfg52opg01cgovbolzu6nqkj	MASTEC CIVIL	2025-09-12 01:08:47.38	2025-09-12 01:08:47.38
cmfg52org01chovbobu9p90kf	MASTER BUILDERS DEVELOPMENT GROUP INC.	2025-09-12 01:08:47.453	2025-09-12 01:08:47.453
cmfg52oth01ciovbo5spdheff	MASTER EXCAVATORS, INC.	2025-09-12 01:08:47.525	2025-09-12 01:08:47.525
cmfg52ovg01cjovbogmutj818	MASTER EXCAVATORS, INC.:KROME DETENTION CENTER	2025-09-12 01:08:47.597	2025-09-12 01:08:47.597
cmfg52oxg01ckovbo1qut7pkq	MASTER EXCAVATORS, INC.:PUBLIX AT PINECREST	2025-09-12 01:08:47.669	2025-09-12 01:08:47.669
cmfg52ozg01clovbo3j1yjgeo	MASTER HALCO CORP.	2025-09-12 01:08:47.74	2025-09-12 01:08:47.74
cmfg52p1g01cmovbo2clpf53e	MASTER PAVING ENGINEERING	2025-09-12 01:08:47.812	2025-09-12 01:08:47.812
cmfg52p3j01cnovboegvju35h	MASTER ROAD FINISHERS CORP	2025-09-12 01:08:47.887	2025-09-12 01:08:47.887
cmfg52p5k01coovboqijinpqv	MATER GARDENS	2025-09-12 01:08:47.96	2025-09-12 01:08:47.96
cmfg52p7k01cpovbo7d3vlg61	MATRIX CONSTRUCTION.	2025-09-12 01:08:48.033	2025-09-12 01:08:48.033
cmfg52p9k01cqovbogwiw1301	MATTER MIDDLE SCHOOL	2025-09-12 01:08:48.105	2025-09-12 01:08:48.105
cmfg52pbp01crovbo25docabz	MATTY	2025-09-12 01:08:48.181	2025-09-12 01:08:48.181
cmfg52pdt01csovborl4dv7is	MAURICE SMITH	2025-09-12 01:08:48.257	2025-09-12 01:08:48.257
cmfg52pfs01ctovboxb31p00y	MAURICIO PROVEN	2025-09-12 01:08:48.329	2025-09-12 01:08:48.329
cmfg52phw01cuovboekl04o35	MAURICIOS' COUSIN	2025-09-12 01:08:48.404	2025-09-12 01:08:48.404
cmfg52pk501cvovboniml1tjl	MAX SOUTH CONSTRUCTION	2025-09-12 01:08:48.486	2025-09-12 01:08:48.486
cmfg52pm601cwovbovsmjwbak	MAX SOUTH CONSTRUCTION, INC.	2025-09-12 01:08:48.559	2025-09-12 01:08:48.559
cmfg52pnx01cxovbor52fofvr	MAXIMO SAN JUAN	2025-09-12 01:08:48.621	2025-09-12 01:08:48.621
cmfg52pps01cyovbo68br6dyx	MAY PROPERTY ACCUSITIONS LLC	2025-09-12 01:08:48.688	2025-09-12 01:08:48.688
cmfg52prs01czovbov3u6pf89	MAYFAIR HOME SERVICES LLC	2025-09-12 01:08:48.76	2025-09-12 01:08:48.76
cmfg52ptn01d0ovboh0spt7kd	MAYRA ALVAREZ	2025-09-12 01:08:48.827	2025-09-12 01:08:48.827
cmfg52pvn01d1ovborupqdjzz	MAYTIN ENGINEERING	2025-09-12 01:08:48.9	2025-09-12 01:08:48.9
cmfg52pxn01d2ovboseiuiecd	MB DEVELOPMENT	2025-09-12 01:08:48.972	2025-09-12 01:08:48.972
cmfg52pzr01d3ovboub5nhxrb	MBR CONSTRUCTION	2025-09-12 01:08:49.047	2025-09-12 01:08:49.047
cmfg52q1r01d4ovbo97a2pgzk	McArthur Dairy	2025-09-12 01:08:49.119	2025-09-12 01:08:49.119
cmfg52q3m01d5ovbobsx5cclg	MCCORKLE CONSTRUCTION COMPANY	2025-09-12 01:08:49.187	2025-09-12 01:08:49.187
cmfg52q5o01d6ovboy40upi3b	MCM ENGINEERS AND GENERAL CONTRACTORS	2025-09-12 01:08:49.26	2025-09-12 01:08:49.26
cmfg52q7o01d7ovbo7wykdjn6	MCM ENGINEERS AND GENERAL CONTRACTORS:87TH AVE BRIDGE	2025-09-12 01:08:49.332	2025-09-12 01:08:49.332
cmfg52q9u01d8ovboloau41wz	MCM ENGINEERS AND GENERAL CONTRACTORS:BROWARD BLVD	2025-09-12 01:08:49.41	2025-09-12 01:08:49.41
cmfg52qbu01d9ovbo3cu2ecme	MCM ENGINEERS AND GENERAL CONTRACTORS:HEFT	2025-09-12 01:08:49.482	2025-09-12 01:08:49.482
cmfg52qdy01daovboignja1hg	MCM ENGINEERS AND GENERAL CONTRACTORS:HEFT -PO WORK	2025-09-12 01:08:49.559	2025-09-12 01:08:49.559
cmfg52qg301dbovbobxn0my25	MCM ENGINEERS AND GENERAL CONTRACTORS:HEFT REPAIRS	2025-09-12 01:08:49.636	2025-09-12 01:08:49.636
cmfg52qic01dcovbo27dk8z87	MCM ENGINEERS AND GENERAL CONTRACTORS:HOBIE ISLAND	2025-09-12 01:08:49.716	2025-09-12 01:08:49.716
cmfg52qkh01ddovbo0irmfbcz	MCM ENGINEERS AND GENERAL CONTRACTORS:LEHMAN	2025-09-12 01:08:49.793	2025-09-12 01:08:49.793
cmfg52qmw01deovborl5t86du	MCM ENGINEERS AND GENERAL CONTRACTORS:MCM (FDOT) #E8181	2025-09-12 01:08:49.881	2025-09-12 01:08:49.881
cmfg52qp301dfovbo423wwhnu	MCM ENGINEERS AND GENERAL CONTRACTORS:MCM JOB 09-0631 (MDX)	2025-09-12 01:08:49.959	2025-09-12 01:08:49.959
cmfg52qr301dgovboerv5vqe9	MCM ENGINEERS AND GENERAL CONTRACTORS:NW 36 ST	2025-09-12 01:08:50.031	2025-09-12 01:08:50.031
cmfg52qta01dhovbo4oa6wt4f	MCM ENGINEERS AND GENERAL CONTRACTORS:PEMBROKE RD	2025-09-12 01:08:50.11	2025-09-12 01:08:50.11
cmfg52qvc01diovbo3nszpae2	MCM ENGINEERS AND GENERAL CONTRACTORS:T6278 - NORTH	2025-09-12 01:08:50.184	2025-09-12 01:08:50.184
cmfg52qxf01djovbo356fmroo	MCM ENGINEERS AND GENERAL CONTRACTORS:T6281- SOUTH	2025-09-12 01:08:50.26	2025-09-12 01:08:50.26
cmfg52qzg01dkovbojpxjr3wx	MCM ENGINEERS AND GENERAL CONTRACTORS:T6345	2025-09-12 01:08:50.333	2025-09-12 01:08:50.333
cmfg52r1g01dlovboca8ksole	MCM ENGINEERS AND GENERAL CONTRACTORS:T8281	2025-09-12 01:08:50.404	2025-09-12 01:08:50.404
cmfg52r3j01dmovbo1qio9169	MCM JOB 09-0631	2025-09-12 01:08:50.479	2025-09-12 01:08:50.479
cmfg52r5i01dnovbo9lt3y3l9	McMILLIAN OIL	2025-09-12 01:08:50.551	2025-09-12 01:08:50.551
cmfg52r7k01doovbogo6g76ts	MCO ENVIRONMENTAL INC	2025-09-12 01:08:50.624	2025-09-12 01:08:50.624
cmfg52r9j01dpovboiuezcfry	MD TURBINES	2025-09-12 01:08:50.695	2025-09-12 01:08:50.695
cmfg52rbx01dqovboeslsjc1r	MDS BUILDERS	2025-09-12 01:08:50.781	2025-09-12 01:08:50.781
cmfg52re201drovbo0cc2pkl9	MDX	2025-09-12 01:08:50.858	2025-09-12 01:08:50.858
cmfg52rg601dsovbo7gf98s6c	MDX- WORK ORDER 3	2025-09-12 01:08:50.934	2025-09-12 01:08:50.934
cmfg52ri501dtovboub7590u5	MDX:MDX- WORK ORDER 1(FENCE)	2025-09-12 01:08:51.006	2025-09-12 01:08:51.006
cmfg52rk201duovbou33xq7b6	MDX:MDX- WORK ORDER 2(GUARDRAIL)	2025-09-12 01:08:51.074	2025-09-12 01:08:51.074
cmfg52rm601dvovbov1a7bf0e	MDX:MDX- WORK ORDER 5 (FENCE)	2025-09-12 01:08:51.15	2025-09-12 01:08:51.15
cmfg52ro501dwovboej1m7cu7	MDX:MDX -WORK ORDER #6	2025-09-12 01:08:51.222	2025-09-12 01:08:51.222
cmfg52rq501dxovbo7a5uluny	MDX:MDX WO#1 -2012	2025-09-12 01:08:51.294	2025-09-12 01:08:51.294
cmfg52rs501dyovbolp10g1xw	MDX:MDX WO#3 -2012	2025-09-12 01:08:51.366	2025-09-12 01:08:51.366
cmfg52ru601dzovbonjic4flx	MDX:MDX WO#4-2012 (FENCE)	2025-09-12 01:08:51.438	2025-09-12 01:08:51.438
cmfg52rwa01e0ovbo1gml0a1d	MDX:MDX WORK #5 - 2012	2025-09-12 01:08:51.514	2025-09-12 01:08:51.514
cmfg52rya01e1ovboiy61lj84	MDX:MDX WORK ORDER 3 (FENCE REPLACEMENT)	2025-09-12 01:08:51.586	2025-09-12 01:08:51.586
cmfg52s0e01e2ovbozdhw450k	MDX:MDX WORK ORDER 4 (FENCE)	2025-09-12 01:08:51.662	2025-09-12 01:08:51.662
cmfg52s2901e3ovbodzj1s85o	MDX:WORK ORDER # 2 -2012	2025-09-12 01:08:51.729	2025-09-12 01:08:51.729
cmfg52s4c01e4ovbo0wiaj3ix	ME WORK INC	2025-09-12 01:08:51.805	2025-09-12 01:08:51.805
cmfg52s6i01e5ovboigfgb1lx	MEI ENGINEERING CONTRACTORS	2025-09-12 01:08:51.882	2025-09-12 01:08:51.882
cmfg52s8s01e6ovbopxdtotau	MEISNER MARINE CONST.	2025-09-12 01:08:51.964	2025-09-12 01:08:51.964
cmfg52sau01e7ovbo6lt7m6x4	MELREESE GOLF COARSE	2025-09-12 01:08:52.039	2025-09-12 01:08:52.039
cmfg52sd301e8ovbo4eq0x9wq	MERCEDEZ-BENZ FORT LAUDERDALE	2025-09-12 01:08:52.12	2025-09-12 01:08:52.12
cmfg52sf801e9ovboyjgq4blz	MERRICK INDUSTRIAL	2025-09-12 01:08:52.197	2025-09-12 01:08:52.197
cmfg52sha01eaovbofi940sg4	MESA ELECTRIC SYSTEM CORP	2025-09-12 01:08:52.271	2025-09-12 01:08:52.271
cmfg52sj901ebovbo5apsfj8x	METRO CONSTRUCTION MANAGEMENT	2025-09-12 01:08:52.342	2025-09-12 01:08:52.342
cmfg52sl801ecovbom0qkeet6	METRO CONSULTING AND MANAGEMENT	2025-09-12 01:08:52.413	2025-09-12 01:08:52.413
cmfg52snl01edovbomks918t7	METRO EQUIPMENT SERVICE INC	2025-09-12 01:08:52.497	2025-09-12 01:08:52.497
cmfg52spk01eeovbovrwiq3eu	METRO EXPRESS INC	2025-09-12 01:08:52.568	2025-09-12 01:08:52.568
cmfg52srm01efovbo9a82auf2	METRO LIFE CHURCH	2025-09-12 01:08:52.643	2025-09-12 01:08:52.643
cmfg52stu01egovbo39vkcz4f	MEXAL CORP	2025-09-12 01:08:52.723	2025-09-12 01:08:52.723
cmfg52svz01ehovbopah739e3	MG EAST LLC	2025-09-12 01:08:52.799	2025-09-12 01:08:52.799
cmfg52sy701eiovboalwt9gka	MG EAST LLC-	2025-09-12 01:08:52.88	2025-09-12 01:08:52.88
cmfg52t0701ejovbojcoksqhs	MGM General Contracting, Inc.	2025-09-12 01:08:52.952	2025-09-12 01:08:52.952
cmfg52t2901ekovbobkic5s6z	MIAMI-DADE COUNTY FAIR & EXPOSITIONS, INC	2025-09-12 01:08:53.025	2025-09-12 01:08:53.025
cmfg52t4d01elovbo8c27e39u	MIAMI-DADE COUNTY PUBLIC SCHOOLS	2025-09-12 01:08:53.101	2025-09-12 01:08:53.101
cmfg52t6g01emovbov0el5be6	MIAMI-DADE COUNTY/DESING & CONSTRUCTION	2025-09-12 01:08:53.177	2025-09-12 01:08:53.177
cmfg52t8k01enovbopjfq9ts8	MIAMI-DADE HOUSING	2025-09-12 01:08:53.252	2025-09-12 01:08:53.252
cmfg52tak01eoovbotdpafy7m	MIAMI-DADE PUBLIC HOUSING AGENCY	2025-09-12 01:08:53.325	2025-09-12 01:08:53.325
cmfg52tcl01epovbowzvc0xg4	Miami-Dade Regional Juvenile Detention	2025-09-12 01:08:53.397	2025-09-12 01:08:53.397
cmfg52tel01eqovbo5r5uodq6	MIAMI 7400 WAREHOUSE LLC	2025-09-12 01:08:53.469	2025-09-12 01:08:53.469
cmfg52tgl01erovboumydnd47	MIAMI BEACH CAPITAL IMPROVEMENTS	2025-09-12 01:08:53.541	2025-09-12 01:08:53.541
cmfg52tik01esovboex45d6vt	MIAMI BEACH CONVENTION CENTER	2025-09-12 01:08:53.613	2025-09-12 01:08:53.613
cmfg52tkk01etovboytqs52yg	MIAMI BEACH GOLF CLUB	2025-09-12 01:08:53.684	2025-09-12 01:08:53.684
cmfg52tmk01euovboh10hxyhw	MIAMI BEACH PARKS & RECREATION	2025-09-12 01:08:53.756	2025-09-12 01:08:53.756
cmfg52toj01evovboq2nogmx5	MIAMI BEACH PUBLIC WORKS/SANITATION	2025-09-12 01:08:53.827	2025-09-12 01:08:53.827
cmfg52tqk01ewovbogi8rtaq6	MIAMI BEACH/GREENSPACE MANAGEMENT	2025-09-12 01:08:53.901	2025-09-12 01:08:53.901
cmfg52tsk01exovboyo9cojna	MIAMI BEHAVIORAL CENTER	2025-09-12 01:08:53.972	2025-09-12 01:08:53.972
cmfg52tuo01eyovboemoxdf48	Miami Block 17LLC	2025-09-12 01:08:54.048	2025-09-12 01:08:54.048
cmfg52twr01ezovboz2wuj41h	MIAMI BUILDERS GCI	2025-09-12 01:08:54.123	2025-09-12 01:08:54.123
cmfg52tyr01f0ovbok4bo6fwv	MIAMI DADE COMMUNITY ACTION & HUMAN SERVI	2025-09-12 01:08:54.195	2025-09-12 01:08:54.195
cmfg52u0z01f1ovbokjmzhgu2	MIAMI DADE COUNTY - COMMUNITY	2025-09-12 01:08:54.276	2025-09-12 01:08:54.276
cmfg52u3201f2ovbo71qqc02l	MIAMI DADE COUNTY BUILDING DEPT.	2025-09-12 01:08:54.35	2025-09-12 01:08:54.35
cmfg52u5301f3ovboki2yhsrv	MIAMI DADE COUNTY COMMUNITY & ECONOMIC	2025-09-12 01:08:54.423	2025-09-12 01:08:54.423
cmfg52u7301f4ovbobnarpazd	MIAMI DADE COUNTY MAINTENANCE	2025-09-12 01:08:54.496	2025-09-12 01:08:54.496
cmfg52u9301f5ovboramoxxf2	MIAMI DADE COUNTY PARK,REC & OPEN SPACES	2025-09-12 01:08:54.568	2025-09-12 01:08:54.568
cmfg52ub501f6ovbomxm97k8y	MIAMI DADE COUNTY PARK,REC & OPEN SPACES:GWEN CHERRY - TEMP FENCE EMERGENCY	2025-09-12 01:08:54.641	2025-09-12 01:08:54.641
cmfg52ud601f7ovbo1olnicm1	MIAMI DADE COUNTY PARK,REC & OPEN SPACES:RPQ DOLFEN1 - 18411 NW 24 AVE	2025-09-12 01:08:54.715	2025-09-12 01:08:54.715
cmfg52uf701f8ovboa0sq5734	MIAMI DADE COUNTY PARK,REC & OPEN SPACES:TAMIAMI BASEBALL PARK	2025-09-12 01:08:54.788	2025-09-12 01:08:54.788
cmfg52uhg01f9ovbo0kpmimdo	MIAMI DADE COUNTY PARK,REC & OPEN SPACES:ZOO MIAMI - BLANKET FENCE	2025-09-12 01:08:54.868	2025-09-12 01:08:54.868
cmfg52ujb01faovbo0cu4x0ru	MIAMI DADE COUNTY PARKS & RECREATION DEP	2025-09-12 01:08:54.935	2025-09-12 01:08:54.935
cmfg52ula01fbovbo5tdmqmns	MIAMI DADE COUNTY POLICE DEPARTMENT	2025-09-12 01:08:55.007	2025-09-12 01:08:55.007
cmfg52una01fcovbogtdirbni	MIAMI DADE COUNTY PUBLIC WORKS	2025-09-12 01:08:55.079	2025-09-12 01:08:55.079
cmfg52up401fdovbodgswrgw9	MIAMI DADE COUNTY/ C & R	2025-09-12 01:08:55.145	2025-09-12 01:08:55.145
cmfg52ur901feovbobpsk0fqu	MIAMI DADE EXPRESSWAY AUTHORITY-	2025-09-12 01:08:55.222	2025-09-12 01:08:55.222
cmfg52ut901ffovbojrf8fq1w	MIAMI DADE FIRE RESCUE	2025-09-12 01:08:55.293	2025-09-12 01:08:55.293
cmfg52uv801fgovbohuc5o1ia	MIAMI DADE HOUSING AGENCY	2025-09-12 01:08:55.364	2025-09-12 01:08:55.364
cmfg52ux801fhovbo4i5kl5ys	MIAMI DADE PARKS & RECREATION	2025-09-12 01:08:55.436	2025-09-12 01:08:55.436
cmfg52uz801fiovbovkrftym3	MIAMI DADE PUBLIC WORKS ROAD/BRIDGE	2025-09-12 01:08:55.509	2025-09-12 01:08:55.509
cmfg52v1901fjovbousex6ejv	MIAMI DADE SEAPORT DEPARTMENT	2025-09-12 01:08:55.581	2025-09-12 01:08:55.581
cmfg52v3801fkovbopna85peq	MIAMI DADE SOLID WASTE	2025-09-12 01:08:55.652	2025-09-12 01:08:55.652
cmfg52v5801flovbo832cei71	MIAMI DADE TRANSIT	2025-09-12 01:08:55.725	2025-09-12 01:08:55.725
cmfg52v7701fmovbonopuydmg	MIAMI DADE WATER & SEWER DEPARTMENT	2025-09-12 01:08:55.795	2025-09-12 01:08:55.795
cmfg52v9801fnovbojz6njxka	MIAMI DESIGN DISTRICT ASSOCIATES	2025-09-12 01:08:55.869	2025-09-12 01:08:55.869
cmfg52vbc01foovbor1ueb4n1	MIAMI DESIGN DISTRICT ASSOCIATES:MADONNA NORTH	2025-09-12 01:08:55.945	2025-09-12 01:08:55.945
cmfg52vdd01fpovbois7shl8i	MIAMI HEIGHTS MHP-	2025-09-12 01:08:56.018	2025-09-12 01:08:56.018
cmfg52vfc01fqovbo3xb5541r	MIAMI INTERNATIONAL BOAT SHOW	2025-09-12 01:08:56.089	2025-09-12 01:08:56.089
cmfg52vhl01frovbo3nwps2y8	MIAMI LAKES CONGREGATIONAL CHURCH	2025-09-12 01:08:56.169	2025-09-12 01:08:56.169
cmfg52vjm01fsovbolv8txl9h	MIAMI MANAGEMENT, INC	2025-09-12 01:08:56.243	2025-09-12 01:08:56.243
cmfg52vlm01ftovboz2oqlrnd	MIAMI PURVEYORS	2025-09-12 01:08:56.315	2025-09-12 01:08:56.315
cmfg52vnm01fuovbouwjqr832	MIAMI RESCUE MISSION	2025-09-12 01:08:56.386	2025-09-12 01:08:56.386
cmfg52vpl01fvovboaa3wijht	MIAMI SHORES COUNTRY CLUB	2025-09-12 01:08:56.457	2025-09-12 01:08:56.457
cmfg52vrw01fwovboxv95dvzm	MIAMI SKI CLUB	2025-09-12 01:08:56.541	2025-09-12 01:08:56.541
cmfg52vtx01fxovboori5hqsu	MIAMI SPRING GOLF	2025-09-12 01:08:56.614	2025-09-12 01:08:56.614
cmfg52vvy01fyovbo13l0e5fr	MIAMI TIRE	2025-09-12 01:08:56.687	2025-09-12 01:08:56.687
cmfg52vxz01fzovbofrrwt4gt	MIAMI WASTE PAPER	2025-09-12 01:08:56.759	2025-09-12 01:08:56.759
cmfg52vzy01g0ovboaxj48s5y	MICCOSUKEE TRIBE OF INDIANS OF FLORIDA	2025-09-12 01:08:56.831	2025-09-12 01:08:56.831
cmfg52w1y01g1ovboalamnwzx	MICHAEL BAYAY	2025-09-12 01:08:56.902	2025-09-12 01:08:56.902
cmfg52w3y01g2ovboenysrriv	MICHAEL F CHENOWETH	2025-09-12 01:08:56.974	2025-09-12 01:08:56.974
cmfg52w5y01g3ovbo5mwd2okz	MICHAEL FARKAS	2025-09-12 01:08:57.046	2025-09-12 01:08:57.046
cmfg52w7y01g4ovboomrvsjhl	MICHAEL LOBUE	2025-09-12 01:08:57.119	2025-09-12 01:08:57.119
cmfg52w9y01g5ovborii0ztg2	MICHAEL SAMUELS	2025-09-12 01:08:57.191	2025-09-12 01:08:57.191
cmfg52wbw01g6ovboahyov3pj	MICHAEL WALKER CONSTRUCTION	2025-09-12 01:08:57.261	2025-09-12 01:08:57.261
cmfg52wex01g7ovbo5fouv213	MICHEAL GARDNER	2025-09-12 01:08:57.336	2025-09-12 01:08:57.336
cmfg52wgy01g8ovbo7pkhpk9u	MICHELLE EDELSDEIN	2025-09-12 01:08:57.443	2025-09-12 01:08:57.443
cmfg52wiy01g9ovbo5lyr7dbq	MICHELLE GREGG	2025-09-12 01:08:57.515	2025-09-12 01:08:57.515
cmfg52wkz01gaovbowt4ih25n	MIDASCO LLC	2025-09-12 01:08:57.587	2025-09-12 01:08:57.587
cmfg52wmv01gbovbo8vt260pf	MIDDLESEX PAVING	2025-09-12 01:08:57.656	2025-09-12 01:08:57.656
cmfg52wov01gcovboa5ylvzn6	Midnight Express Towing	2025-09-12 01:08:57.728	2025-09-12 01:08:57.728
cmfg52wqv01gdovbogzbpreta	MIDTOWN EQUITIES	2025-09-12 01:08:57.799	2025-09-12 01:08:57.799
cmfg52wsp01geovbone6x3rus	MIDTOWN PARTNERS	2025-09-12 01:08:57.866	2025-09-12 01:08:57.866
cmfg52wup01gfovboo8ww64gw	MIDTOWN ATHLETIC	2025-09-12 01:08:57.937	2025-09-12 01:08:57.937
cmfg52wwp01ggovbo46t5othb	MIDTOWN MIAMI	2025-09-12 01:08:58.01	2025-09-12 01:08:58.01
cmfg52wyq01ghovboj7k29d33	MIDTOWN MIAMI CDD	2025-09-12 01:08:58.083	2025-09-12 01:08:58.083
cmfg52x0v01giovbotr6b0jta	MIDTOWN OPPORTUNITIES	2025-09-12 01:08:58.16	2025-09-12 01:08:58.16
cmfg52x2w01gjovboajka7t1k	MIDWAY POINTS APARTMENTS	2025-09-12 01:08:58.233	2025-09-12 01:08:58.233
cmfg52x4x01gkovbor48e004n	MIGDALIA ROSA PEREZ	2025-09-12 01:08:58.305	2025-09-12 01:08:58.305
cmfg52x7201glovbo18dxjskl	MIGUEL	2025-09-12 01:08:58.382	2025-09-12 01:08:58.382
cmfg52x9301gmovbo37jjwch3	MIGUEL JIMENEZ	2025-09-12 01:08:58.455	2025-09-12 01:08:58.455
cmfg52xb701gnovbo5ulgzu6u	MIGUEL LOPEZ ASPHALT	2025-09-12 01:08:58.532	2025-09-12 01:08:58.532
cmfg52xdc01goovboii6rkgwg	MIGUEL PACHECO	2025-09-12 01:08:58.609	2025-09-12 01:08:58.609
cmfg52xfc01gpovbo5rp6q0cl	MIKE GARCIA	2025-09-12 01:08:58.68	2025-09-12 01:08:58.68
cmfg52xhc01gqovboqyinofi8	MIKE VALDEZ	2025-09-12 01:08:58.752	2025-09-12 01:08:58.752
cmfg52xjb01grovbo05tunhwx	MILENIUM AUTO REPAIR	2025-09-12 01:08:58.824	2025-09-12 01:08:58.824
cmfg52xlc01gsovborvq32kq5	MILIANI CONSTRUCTION CORP.	2025-09-12 01:08:58.896	2025-09-12 01:08:58.896
cmfg52xnc01gtovbo5mg12zs5	MILLER CONSTRUCTION	2025-09-12 01:08:58.968	2025-09-12 01:08:58.968
cmfg52xpg01guovboltdvrp4t	MILLER CONSTRUCTION:CS PARKING	2025-09-12 01:08:59.044	2025-09-12 01:08:59.044
cmfg52xrf01gvovbog4m622op	MILLER CONSTRUCTION:DFM 9	2025-09-12 01:08:59.116	2025-09-12 01:08:59.116
cmfg52xtf01gwovbos9p2g04d	MILLER CONSTRUCTION:FOUNDRY AVE	2025-09-12 01:08:59.187	2025-09-12 01:08:59.187
cmfg52xve01gxovboygiocgrk	MILLER CONSTRUCTION:MEEK IV	2025-09-12 01:08:59.258	2025-09-12 01:08:59.258
cmfg52xxe01gyovbo32vsqabu	MILLER CONSTRUCTION:TMB 8	2025-09-12 01:08:59.331	2025-09-12 01:08:59.331
cmfg52xzd01gzovbopks3zb6a	MILLER CONSTRUCTION:TMB8 PROJECT J-24-007	2025-09-12 01:08:59.402	2025-09-12 01:08:59.402
cmfg52y1e01h0ovbohztx7m68	MILLER ROAD PLAZA	2025-09-12 01:08:59.475	2025-09-12 01:08:59.475
cmfg52y3e01h1ovbopuln9qde	MILTON GONZALEZ	2025-09-12 01:08:59.546	2025-09-12 01:08:59.546
cmfg52y5d01h2ovbo6pyg6yod	MIMO CONSULTING GROUP	2025-09-12 01:08:59.618	2025-09-12 01:08:59.618
cmfg52y7e01h3ovboqejn8ful	MINDY BROWN	2025-09-12 01:08:59.691	2025-09-12 01:08:59.691
cmfg52y9g01h4ovboueq5hnj1	MIRIAM AND HERMAN TAUBER SCHOOL	2025-09-12 01:08:59.764	2025-09-12 01:08:59.764
cmfg52ybj01h5ovbodw56ugf5	MIRROR AND CLOSETS	2025-09-12 01:08:59.84	2025-09-12 01:08:59.84
cmfg52ydj01h6ovboukuigy2b	MISENER MARINE CONSTRUCTION, INC.	2025-09-12 01:08:59.911	2025-09-12 01:08:59.911
cmfg52yfj01h7ovbo00545ohe	MISION CATOLICA SANTA ANA	2025-09-12 01:08:59.983	2025-09-12 01:08:59.983
cmfg52yhj01h8ovboh5dfc256	MITCHELL ENTERPRISE	2025-09-12 01:09:00.056	2025-09-12 01:09:00.056
cmfg52yjo01h9ovbo3l4p4gwq	MITO PLUMBING	2025-09-12 01:09:00.132	2025-09-12 01:09:00.132
cmfg52yls01haovbo2zom8l30	MJ CONSTRUCTION	2025-09-12 01:09:00.208	2025-09-12 01:09:00.208
cmfg52ynr01hbovbovcok47n9	MJ ENGINEERING	2025-09-12 01:09:00.279	2025-09-12 01:09:00.279
cmfg52ypr01hcovbo8o1mdo9k	MJ ENGINEERING CONTRACTORS	2025-09-12 01:09:00.352	2025-09-12 01:09:00.352
cmfg52yrq01hdovbourzszk6x	MJD CONSTRUCTION	2025-09-12 01:09:00.422	2025-09-12 01:09:00.422
cmfg52yts01heovboj3l3j8s8	MONICA	2025-09-12 01:09:00.496	2025-09-12 01:09:00.496
cmfg52yvr01hfovbomrsqt48n	MONROE COUNTY ENGINEERING SERVICES	2025-09-12 01:09:00.568	2025-09-12 01:09:00.568
cmfg52yxy01hgovboapl1gp2c	MONSIGNOR PACE HIGH SCHOOL	2025-09-12 01:09:00.647	2025-09-12 01:09:00.647
cmfg52yzy01hhovbouou31k2m	MORA UNITED LLC	2025-09-12 01:09:00.719	2025-09-12 01:09:00.719
cmfg52z1y01hiovboy0r59k9n	MORALES MAINTENANCE	2025-09-12 01:09:00.79	2025-09-12 01:09:00.79
cmfg52z4101hjovbob5ox5o7i	MORALES MOVING AND STORAGE	2025-09-12 01:09:00.865	2025-09-12 01:09:00.865
cmfg52z6501hkovbomx3shw6r	MORIARTY	2025-09-12 01:09:00.941	2025-09-12 01:09:00.941
cmfg52z8a01hlovboo6d2w3ue	MORNINGSIDE CIVIC ASSOCIATION	2025-09-12 01:09:01.019	2025-09-12 01:09:01.019
cmfg52zaf01hmovbo9w13mklf	Morrison-Cobalt JV	2025-09-12 01:09:01.096	2025-09-12 01:09:01.096
cmfg52zck01hnovbocrs7mtc5	MOSS & ASSOCIATES	2025-09-12 01:09:01.173	2025-09-12 01:09:01.173
cmfg52zeo01hoovboufsr0iwo	MP PROPERTY MANAGEMENT	2025-09-12 01:09:01.249	2025-09-12 01:09:01.249
cmfg52zgp01hpovbo5ju8sn09	MPH AUTO SALES	2025-09-12 01:09:01.321	2025-09-12 01:09:01.321
cmfg52ziq01hqovbobf97qncr	MR. & MRS. COHEN	2025-09-12 01:09:01.395	2025-09-12 01:09:01.395
cmfg52zku01hrovbo9hp2rtsi	MR. 7 MRS. ULTIMO	2025-09-12 01:09:01.471	2025-09-12 01:09:01.471
cmfg52zmy01hsovbolzczh1ju	MR. JAMES. SLATTERY, PRESIDENT & C.E.EO	2025-09-12 01:09:01.547	2025-09-12 01:09:01.547
cmfg52zp301htovbovegobsz5	MR. LEONEL	2025-09-12 01:09:01.624	2025-09-12 01:09:01.624
cmfg52zr401huovbo2p0tpd23	MR. MANOLO	2025-09-12 01:09:01.696	2025-09-12 01:09:01.696
cmfg52zt301hvovbopt3ec6xq	MR. MARK	2025-09-12 01:09:01.768	2025-09-12 01:09:01.768
cmfg52zv701hwovbol7rgz3g2	MR. MCKINNEY	2025-09-12 01:09:01.844	2025-09-12 01:09:01.844
cmfg52zx701hxovbom1xpsvnd	MR. VENKATA	2025-09-12 01:09:01.915	2025-09-12 01:09:01.915
cmfg52zz701hyovbogpyxe0ly	MR. ZEITSIFFE	2025-09-12 01:09:01.987	2025-09-12 01:09:01.987
cmfg5301801hzovbo021gndon	Mrs. Cabrera	2025-09-12 01:09:02.06	2025-09-12 01:09:02.06
cmfg5303c01i0ovbokip32bwh	Mrs. Jones	2025-09-12 01:09:02.136	2025-09-12 01:09:02.136
cmfg5305c01i1ovboqjofjn0y	MS. GOLDEN	2025-09-12 01:09:02.208	2025-09-12 01:09:02.208
cmfg5307b01i2ovboafj8tg3e	MUD CONCRETE	2025-09-12 01:09:02.28	2025-09-12 01:09:02.28
cmfg5309a01i3ovboqt043o84	MUNICIPAL CONTRACTORS	2025-09-12 01:09:02.351	2025-09-12 01:09:02.351
cmfg530ba01i4ovbo00zzxkbx	MV GROUP	2025-09-12 01:09:02.423	2025-09-12 01:09:02.423
cmfg530dd01i5ovbo1gt2fbyx	MVRT CONSTRUCTION.	2025-09-12 01:09:02.497	2025-09-12 01:09:02.497
cmfg530fc01i6ovbo895131x0	MVRT INC.	2025-09-12 01:09:02.569	2025-09-12 01:09:02.569
cmfg530hf01i7ovbo4ayybrg4	MYSTIC POINT TOWER 600	2025-09-12 01:09:02.644	2025-09-12 01:09:02.644
cmfg530jj01i8ovbo8ewi8aly	N & J CONSTRUCTION	2025-09-12 01:09:02.72	2025-09-12 01:09:02.72
cmfg530lj01i9ovbo170sab1j	N. MIAMI YAMAHA & SEA DOO	2025-09-12 01:09:02.792	2025-09-12 01:09:02.792
cmfg530ng01iaovbouynrd1fy	NAC CONSTRUCTION, INC.	2025-09-12 01:09:02.861	2025-09-12 01:09:02.861
cmfg530pj01ibovbobeaulv7n	NAPA AUTO STORE	2025-09-12 01:09:02.936	2025-09-12 01:09:02.936
cmfg530rk01icovbo2wjzkj1s	NAROCA CONSTRUCTION	2025-09-12 01:09:03.009	2025-09-12 01:09:03.009
cmfg530tn01idovbo9j52ptr8	NATIONAL GROUP	2025-09-12 01:09:03.084	2025-09-12 01:09:03.084
cmfg530vn01ieovbojb6i0bjg	NATIONAL GUARD	2025-09-12 01:09:03.156	2025-09-12 01:09:03.156
cmfg530xn01ifovboeiula73q	NATIONAL TRUCK CENTER	2025-09-12 01:09:03.228	2025-09-12 01:09:03.228
cmfg530zo01igovbo5n19zw5f	NATIVE ENERGY	2025-09-12 01:09:03.3	2025-09-12 01:09:03.3
cmfg5311m01ihovbovhdjkmje	NAZDAR	2025-09-12 01:09:03.37	2025-09-12 01:09:03.37
cmfg5313q01iiovbozwpju9v7	NCI CONSTRUCTION, CO.	2025-09-12 01:09:03.447	2025-09-12 01:09:03.447
cmfg5315q01ijovboftemnmbu	Nearly Natural	2025-09-12 01:09:03.519	2025-09-12 01:09:03.519
cmfg5317q01ikovboahij9vcg	NEENAH ENTERPRISES, INC	2025-09-12 01:09:03.591	2025-09-12 01:09:03.591
cmfg5319t01ilovboggieftqd	NEIL E BAYER	2025-09-12 01:09:03.666	2025-09-12 01:09:03.666
cmfg531bu01imovbowgq7d9l9	NEIL PERELO	2025-09-12 01:09:03.738	2025-09-12 01:09:03.738
cmfg531dt01inovbo9yc7xzvl	NEIL PROVEN	2025-09-12 01:09:03.81	2025-09-12 01:09:03.81
cmfg531fu01ioovboclqz65ih	NELSON	2025-09-12 01:09:03.882	2025-09-12 01:09:03.882
cmfg531ht01ipovbofiuh5xc2	NELSON BLANCO	2025-09-12 01:09:03.954	2025-09-12 01:09:03.954
cmfg531ju01iqovbomhiumunl	NELSON HERNANDEZ	2025-09-12 01:09:04.026	2025-09-12 01:09:04.026
cmfg531lw01irovbod7wf9z1l	NEO LOFTS CONDOMINIUM	2025-09-12 01:09:04.1	2025-09-12 01:09:04.1
cmfg531nz01isovboyuyaxh03	NET-COM SERVICES, INC.	2025-09-12 01:09:04.176	2025-09-12 01:09:04.176
cmfg531pz01itovbolokr95yd	NETS DEPOT INC.	2025-09-12 01:09:04.248	2025-09-12 01:09:04.248
cmfg531ry01iuovbocsonw8ti	NEUCOR CONTSTRUCTION	2025-09-12 01:09:04.319	2025-09-12 01:09:04.319
cmfg531u701ivovbouv0i5tg4	NEUTRALOGISTICS	2025-09-12 01:09:04.399	2025-09-12 01:09:04.399
cmfg531w901iwovboeajp1q82	NEW HIGH GLASS	2025-09-12 01:09:04.474	2025-09-12 01:09:04.474
cmfg531y901ixovbo87hmk6mn	NEW HORIZONS APTS.	2025-09-12 01:09:04.545	2025-09-12 01:09:04.545
cmfg5320901iyovbob3vg6nqc	NEW HORIZONS MASTER ASSOCIATION	2025-09-12 01:09:04.617	2025-09-12 01:09:04.617
cmfg5322401izovbogop2xbgu	NEW IMAGE GENERAL CONSTRUCTION	2025-09-12 01:09:04.685	2025-09-12 01:09:04.685
cmfg5324u01j0ovbowek0mmoy	NEW WORLD SYMPHONY	2025-09-12 01:09:04.783	2025-09-12 01:09:04.783
cmfg5327001j1ovboa0ipfscm	NEWPORT CLARK, LLC	2025-09-12 01:09:04.86	2025-09-12 01:09:04.86
cmfg5329001j2ovbo3bat0rhk	NICHOLSON CONSTRUCTION COMPANY	2025-09-12 01:09:04.933	2025-09-12 01:09:04.933
cmfg532av01j3ovboy1glcbo0	Nicole Carreras	2025-09-12 01:09:04.999	2025-09-12 01:09:04.999
cmfg532cu01j4ovbo4njwtq9u	NIPPON AMERICA	2025-09-12 01:09:05.07	2025-09-12 01:09:05.07
cmfg532ep01j5ovbocm31rkqu	NOB HILL APARTMENT RENTALS	2025-09-12 01:09:05.137	2025-09-12 01:09:05.137
cmfg532gs01j6ovboxaj3p7b7	NORLAND SEVENTH-DAY ADVENTIST CHURCH	2025-09-12 01:09:05.213	2025-09-12 01:09:05.213
cmfg532io01j7ovbottd9fe3g	NORONA LIMITED LLC	2025-09-12 01:09:05.28	2025-09-12 01:09:05.28
cmfg532ko01j8ovboc67r8a8b	NORWOOD COMMERCIAL CONTRACTORS, INC.	2025-09-12 01:09:05.353	2025-09-12 01:09:05.353
cmfg532mo01j9ovboji3jh06w	NOVA CONSTRUCTION	2025-09-12 01:09:05.425	2025-09-12 01:09:05.425
cmfg532on01jaovbo5sh0tem4	NOVA CONSTRUCTION:BARFIELD HYDRAULICS	2025-09-12 01:09:05.496	2025-09-12 01:09:05.496
cmfg532qk01jbovboe1ehehhn	NOVA CONSTRUCTION:V&V WINDOWS EXPANSION	2025-09-12 01:09:05.564	2025-09-12 01:09:05.564
cmfg532sn01jcovbo1h4ujkdp	NPSG BUILT	2025-09-12 01:09:05.639	2025-09-12 01:09:05.639
cmfg532um01jdovboo3t7cb6f	NR INVESTMENTS	2025-09-12 01:09:05.711	2025-09-12 01:09:05.711
cmfg532wn01jeovbooyisolyq	NR MAX MIAMI, LLC	2025-09-12 01:09:05.784	2025-09-12 01:09:05.784
cmfg532yo01jfovbogaob8rba	NR Maxmiami, LLC	2025-09-12 01:09:05.856	2025-09-12 01:09:05.856
cmfg5331101jgovboczgzq8ub	NV2A	2025-09-12 01:09:05.942	2025-09-12 01:09:05.942
cmfg5333101jhovbo09a4mo7b	NV2A-DRAGADOS JV	2025-09-12 01:09:06.014	2025-09-12 01:09:06.014
cmfg5335001jiovbothxyjy7n	NV2A HASKELL	2025-09-12 01:09:06.084	2025-09-12 01:09:06.084
cmfg5337501jjovboxu9jj3s4	NW 112 ST PROPERTIESLLC	2025-09-12 01:09:06.162	2025-09-12 01:09:06.162
cmfg5339501jkovbommaxsrsz	OAC CONSTRUCTION CORP	2025-09-12 01:09:06.233	2025-09-12 01:09:06.233
cmfg533b501jlovboh2c7kfyq	OAK CONSTRUCTION	2025-09-12 01:09:06.306	2025-09-12 01:09:06.306
cmfg533d001jmovbouw7ih3fy	OBP PARTNERS	2025-09-12 01:09:06.372	2025-09-12 01:09:06.372
cmfg533f401jnovbomdvkc3k9	OCEAN BAY CONST.	2025-09-12 01:09:06.449	2025-09-12 01:09:06.449
cmfg533h901joovbocnoiwibi	OCEAN LAKE CONDO	2025-09-12 01:09:06.525	2025-09-12 01:09:06.525
cmfg533j401jpovbo3uzbyx7z	OCEAN MAZDA	2025-09-12 01:09:06.593	2025-09-12 01:09:06.593
cmfg533l801jqovbowrxoj3rt	OCEAN SIDE RESORTS	2025-09-12 01:09:06.669	2025-09-12 01:09:06.669
cmfg533n901jrovbok403484p	OCEAN VIEW	2025-09-12 01:09:06.741	2025-09-12 01:09:06.741
cmfg533p501jsovbodrfazusj	OCEANSIDE EXTENDED CARE CENTER	2025-09-12 01:09:06.809	2025-09-12 01:09:06.809
cmfg533r301jtovbo852h99yo	ODEBRECHT CONST.	2025-09-12 01:09:06.88	2025-09-12 01:09:06.88
cmfg533t301juovbo3wqfqk4f	ODEBRECHT CONST.:ITB-16-01 SR 836 87TH AVE	2025-09-12 01:09:06.952	2025-09-12 01:09:06.952
cmfg533uz01jvovbockbwo3r8	ODEBRECHT CONST.:ITB 14-03 SR-836	2025-09-12 01:09:07.019	2025-09-12 01:09:07.019
cmfg533x401jwovbolpaalm63	ODEBRECHT CONST.:T6220 KROME	2025-09-12 01:09:07.097	2025-09-12 01:09:07.097
cmfg533z601jxovboukgr6li6	ODEBRECHT USA	2025-09-12 01:09:07.17	2025-09-12 01:09:07.17
cmfg5341701jyovbow1f5dws0	ODEBRECHT USA:I-395	2025-09-12 01:09:07.244	2025-09-12 01:09:07.244
cmfg5343c01jzovbo4pk14kgf	OEC ENGINEERING & CONSTRUCTION	2025-09-12 01:09:07.32	2025-09-12 01:09:07.32
cmfg5345g01k0ovbowg7jo59z	OFF THE FRAME CUSTOMS INC	2025-09-12 01:09:07.396	2025-09-12 01:09:07.396
cmfg5347h01k1ovbooutobz98	OFFLEASE ONLY	2025-09-12 01:09:07.469	2025-09-12 01:09:07.469
cmfg5349f01k2ovbopo6afzjv	OHLA	2025-09-12 01:09:07.54	2025-09-12 01:09:07.54
cmfg534bb01k3ovbo21yt0mjy	OHLA:T1902	2025-09-12 01:09:07.607	2025-09-12 01:09:07.607
cmfg534ec01k4ovboqkmp6mr9	OHLA:T4682	2025-09-12 01:09:07.717	2025-09-12 01:09:07.717
cmfg534gb01k5ovbo4gwfgoeo	OHLA:T6581	2025-09-12 01:09:07.788	2025-09-12 01:09:07.788
cmfg534iu01k6ovbouywydm7o	OHLA:T6581 PO	2025-09-12 01:09:07.878	2025-09-12 01:09:07.878
cmfg534kt01k7ovbo6lytn4hk	OJEL BARRIOS	2025-09-12 01:09:07.95	2025-09-12 01:09:07.95
cmfg534mt01k8ovbojhfw3kpq	OKO GROUP, LLC	2025-09-12 01:09:08.021	2025-09-12 01:09:08.021
cmfg534ot01k9ovbooijk0kl3	OLD CASTLE PRECAST	2025-09-12 01:09:08.093	2025-09-12 01:09:08.093
cmfg534qs01kaovboe0bu0zh5	OLETA PARTNERS LLC	2025-09-12 01:09:08.164	2025-09-12 01:09:08.164
cmfg534st01kbovbov32xegsw	OLETA PARTNERS LLC:Parcel C Park	2025-09-12 01:09:08.238	2025-09-12 01:09:08.238
cmfg534uu01kcovbo70o8mpmd	OLETA PARTNERS LLC:VILLA LAGUNA FENCE	2025-09-12 01:09:08.31	2025-09-12 01:09:08.31
cmfg534ww01kdovbotknr1223	OMNI TRANSLOADING	2025-09-12 01:09:08.385	2025-09-12 01:09:08.385
cmfg534yt01keovbonsvkg43c	ON AIR FIRE INSPECTION	2025-09-12 01:09:08.453	2025-09-12 01:09:08.453
cmfg5350t01kfovbot21gcgaz	ONAN BILLAMI	2025-09-12 01:09:08.525	2025-09-12 01:09:08.525
cmfg5352x01kgovbo62bot11z	ONE BAL HARBOUR RESORT & SPA	2025-09-12 01:09:08.601	2025-09-12 01:09:08.601
cmfg5355101khovbo3b3r3od1	ONE MIAMI	2025-09-12 01:09:08.678	2025-09-12 01:09:08.678
cmfg5357101kiovbob126zxoa	ONE WATER MARK	2025-09-12 01:09:08.75	2025-09-12 01:09:08.75
cmfg5359301kjovbonouvdvgd	ONE2PH CONSTRUCTION	2025-09-12 01:09:08.823	2025-09-12 01:09:08.823
cmfg535b601kkovbo601f28fd	ONICX CONSTRUCTION	2025-09-12 01:09:08.898	2025-09-12 01:09:08.898
cmfg535d501klovbowgqz6tfn	ONX INC	2025-09-12 01:09:08.969	2025-09-12 01:09:08.969
cmfg535f601kmovboecoczdio	OPTAMIUS, INC	2025-09-12 01:09:09.043	2025-09-12 01:09:09.043
cmfg535h801knovbomiox7aqr	OPTICAL TEL	2025-09-12 01:09:09.117	2025-09-12 01:09:09.117
cmfg535ja01koovbobk5csddj	OPTIUM MANAGEMENT GROUP INC	2025-09-12 01:09:09.19	2025-09-12 01:09:09.19
cmfg535lg01kpovboe3qi5dzd	ORANGE BLOSSOM	2025-09-12 01:09:09.268	2025-09-12 01:09:09.268
cmfg535nk01kqovbovsx7rzor	ORION MARINE GROUP	2025-09-12 01:09:09.344	2025-09-12 01:09:09.344
cmfg535pk01krovbo15j37qsr	ORION MARINE GROUP:PORT EVERGLADES	2025-09-12 01:09:09.417	2025-09-12 01:09:09.417
cmfg535ro01ksovboofndqtyi	ORION OIL	2025-09-12 01:09:09.493	2025-09-12 01:09:09.493
cmfg535to01ktovbo8opwiyqx	ORSO CONSTRUCTION	2025-09-12 01:09:09.564	2025-09-12 01:09:09.564
cmfg535vr01kuovboqgl1luix	ORTEGA CONSTRUCTION, INC	2025-09-12 01:09:09.64	2025-09-12 01:09:09.64
cmfg535xx01kvovboknsia0uw	OSCAR	2025-09-12 01:09:09.717	2025-09-12 01:09:09.717
cmfg5361101kwovbotnkn8m5y	OSCAR AMAGO	2025-09-12 01:09:09.83	2025-09-12 01:09:09.83
cmfg5363101kxovbo4kb8qq14	OSCAR GONZALEZ	2025-09-12 01:09:09.901	2025-09-12 01:09:09.901
cmfg5365101kyovboz4j9w5yc	OSVALDO GONZALEZ	2025-09-12 01:09:09.974	2025-09-12 01:09:09.974
cmfg5367301kzovboa1bt2ckc	OSVALDO OJITO	2025-09-12 01:09:10.047	2025-09-12 01:09:10.047
cmfg5369201l0ovbovoh2zlhd	OVERHOLT CONSTRUCTION	2025-09-12 01:09:10.119	2025-09-12 01:09:10.119
cmfg536b701l1ovboeb26341u	OVERLAND CARRIERS INC	2025-09-12 01:09:10.195	2025-09-12 01:09:10.195
cmfg536d901l2ovbohykmg427	OVERLAND GENERAL CONTRACTORS CONST. CO.	2025-09-12 01:09:10.27	2025-09-12 01:09:10.27
cmfg536f901l3ovboonwu3fk2	P	2025-09-12 01:09:10.341	2025-09-12 01:09:10.341
cmfg536h801l4ovbophjt8du6	P&I HAULING EXPRESS INC.	2025-09-12 01:09:10.413	2025-09-12 01:09:10.413
cmfg536j301l5ovbo62mi81wn	PABLO J VALDES FL. IRREVOCABLE TRUST	2025-09-12 01:09:10.48	2025-09-12 01:09:10.48
cmfg536l501l6ovbovcj9afqx	PABLO LAGO	2025-09-12 01:09:10.553	2025-09-12 01:09:10.553
cmfg536n601l7ovbowv6nc3c3	PABON ENGINEERING	2025-09-12 01:09:10.626	2025-09-12 01:09:10.626
cmfg536p501l8ovboum9prr68	PACC Company	2025-09-12 01:09:10.698	2025-09-12 01:09:10.698
cmfg536r601l9ovbo8rdf7box	PACC Company:TENOROC BRIDGE GUARDRAIL	2025-09-12 01:09:10.77	2025-09-12 01:09:10.77
cmfg536t601laovboxw498y29	PACIFIC SERVICES & TRADING	2025-09-12 01:09:10.842	2025-09-12 01:09:10.842
cmfg536v601lbovbobv8px5cp	PAHER CONSTRUCTION	2025-09-12 01:09:10.914	2025-09-12 01:09:10.914
cmfg536x501lcovboy3kjrb3n	PALM SPRING MILE ASSOC. LTD	2025-09-12 01:09:10.986	2025-09-12 01:09:10.986
cmfg536z501ldovbo48nokki9	PALMER DEVELOPMENT INC	2025-09-12 01:09:11.057	2025-09-12 01:09:11.057
cmfg5371i01leovbo82onkpeb	PALMER TRINITTY SCHOOL	2025-09-12 01:09:11.142	2025-09-12 01:09:11.142
cmfg5373e01lfovbozu9688o4	PALMERO BAY	2025-09-12 01:09:11.21	2025-09-12 01:09:11.21
cmfg5375j01lgovbog1ayu7qs	PALMETO BAY PARK	2025-09-12 01:09:11.287	2025-09-12 01:09:11.287
cmfg5377m01lhovbozwg87my2	PALMETTO BAY	2025-09-12 01:09:11.362	2025-09-12 01:09:11.362
cmfg5379l01liovboq89161hk	PALMETTO BAY MEDICAL CENTER	2025-09-12 01:09:11.433	2025-09-12 01:09:11.433
cmfg537bl01ljovbo4qvfrp7x	PAM ROSE	2025-09-12 01:09:11.506	2025-09-12 01:09:11.506
cmfg537dn01lkovbokdl0vfgz	PAM SILVERMAN	2025-09-12 01:09:11.58	2025-09-12 01:09:11.58
cmfg537fo01llovbonidex4yl	PAMELA CHESBRO	2025-09-12 01:09:11.653	2025-09-12 01:09:11.653
cmfg537hn01lmovbocr25y27j	PAN AMERICAN COMPANIES	2025-09-12 01:09:11.724	2025-09-12 01:09:11.724
cmfg537js01lnovbow6hgtgmt	PARADISE ENGINEERING CONTRACTORS	2025-09-12 01:09:11.8	2025-09-12 01:09:11.8
cmfg537mw01loovboglipi40w	PARADISE HOMES	2025-09-12 01:09:11.912	2025-09-12 01:09:11.912
cmfg537oz01lpovbo9705scsp	PARAGON CONSTRUCTION	2025-09-12 01:09:11.988	2025-09-12 01:09:11.988
cmfg537r101lqovbof672jhap	PARAGON DEVELOPMENT	2025-09-12 01:09:12.061	2025-09-12 01:09:12.061
cmfg537t401lrovbox6hb5jk0	PARAMOUNT BAY CONSTRUCTION MANAGEMENT	2025-09-12 01:09:12.137	2025-09-12 01:09:12.137
cmfg537v401lsovbo2z58xlmb	PARAMOUNT WORLDWIDE	2025-09-12 01:09:12.208	2025-09-12 01:09:12.208
cmfg537x301ltovbouoljh8cn	PARAMOUNTBAY	2025-09-12 01:09:12.279	2025-09-12 01:09:12.279
cmfg537yy01luovbo8kg425fe	PARK EAST CONSTRUCTION CORP	2025-09-12 01:09:12.346	2025-09-12 01:09:12.346
cmfg5382001lvovbofip48azh	PARK WAY CONSTRUCTION	2025-09-12 01:09:12.456	2025-09-12 01:09:12.456
cmfg5384801lwovbo47nqrfxz	PARKWAY CONSTRUCTION	2025-09-12 01:09:12.537	2025-09-12 01:09:12.537
cmfg5386901lxovbocqy6qdnz	PARSA CORP	2025-09-12 01:09:12.609	2025-09-12 01:09:12.609
cmfg5388701lyovboa1mc22ou	PASSION GROWERS	2025-09-12 01:09:12.679	2025-09-12 01:09:12.679
cmfg538a701lzovbomnw4323e	PAT PABOR	2025-09-12 01:09:12.751	2025-09-12 01:09:12.751
cmfg538c701m0ovboqs75v7qf	PATMAC CONTRACTING	2025-09-12 01:09:12.824	2025-09-12 01:09:12.824
cmfg538e801m1ovbovfdi85xw	PATRIC	2025-09-12 01:09:12.896	2025-09-12 01:09:12.896
cmfg538g701m2ovbofie6qk6y	PATRICK	2025-09-12 01:09:12.968	2025-09-12 01:09:12.968
cmfg538i701m3ovbo52rqsgi6	PATRICK LAFAILLE	2025-09-12 01:09:13.04	2025-09-12 01:09:13.04
cmfg538k701m4ovbo1xeexxnn	PATRICK POWER CORP	2025-09-12 01:09:13.112	2025-09-12 01:09:13.112
cmfg538m701m5ovbols9kbxg9	PAUL CRISTIAN	2025-09-12 01:09:13.183	2025-09-12 01:09:13.183
cmfg538o901m6ovbosopjf2jg	PAUL TOPPINO	2025-09-12 01:09:13.257	2025-09-12 01:09:13.257
cmfg538q801m7ovbood1hv8vs	PAVARINI CONST	2025-09-12 01:09:13.329	2025-09-12 01:09:13.329
cmfg538sb01m8ovbo4tdqizpk	PAVARINI CONSTRUCTION CO.	2025-09-12 01:09:13.403	2025-09-12 01:09:13.403
cmfg538ua01m9ovbozkeyiu42	PAVARINI CONSTRUCTION/360 CONDOS	2025-09-12 01:09:13.475	2025-09-12 01:09:13.475
cmfg538wa01maovbokzx4t1sf	PAVARINI CONSTRUCTION/JADE BEACH	2025-09-12 01:09:13.547	2025-09-12 01:09:13.547
cmfg538ya01mbovbo5x0nqlm9	PAVEMENT STRIPING CORP	2025-09-12 01:09:13.618	2025-09-12 01:09:13.618
cmfg5390c01mcovboah82vxsy	PAVILION GARDENS	2025-09-12 01:09:13.692	2025-09-12 01:09:13.692
cmfg5392g01mdovbokyz3ck2s	PCL CONSTRUCTION	2025-09-12 01:09:13.768	2025-09-12 01:09:13.768
cmfg5394j01meovbollm4kp7q	PEAVY FAMILY INVESTMENTS LLC	2025-09-12 01:09:13.843	2025-09-12 01:09:13.843
cmfg5396j01mfovbovz7eo6hi	PEBBLE BROOK	2025-09-12 01:09:13.916	2025-09-12 01:09:13.916
cmfg5398j01mgovboiqiely8z	PEDRAIL SYSTEMS	2025-09-12 01:09:13.987	2025-09-12 01:09:13.987
cmfg539aj01mhovbos490dgtb	PEDRO GARCIA	2025-09-12 01:09:14.059	2025-09-12 01:09:14.059
cmfg539cj01miovbo3d3zmgtr	PEDRO MEDINA	2025-09-12 01:09:14.132	2025-09-12 01:09:14.132
cmfg539ej01mjovbo4bj5407u	PEDRO REYES	2025-09-12 01:09:14.204	2025-09-12 01:09:14.204
cmfg539gn01mkovboanv6qc5v	PEGASUS CONSTRUCTION MANAGEMENT INC.	2025-09-12 01:09:14.279	2025-09-12 01:09:14.279
cmfg539im01mlovbox37qd38c	PENCO CONSTRUCTION	2025-09-12 01:09:14.351	2025-09-12 01:09:14.351
cmfg539ko01mmovboh3uxaaj0	PENSKE	2025-09-12 01:09:14.425	2025-09-12 01:09:14.425
cmfg539mo01mnovboqgd3wa2b	PERELLO NEIL	2025-09-12 01:09:14.497	2025-09-12 01:09:14.497
cmfg539op01moovbo690y9oie	PERPETUAL ADVANCEMENT ENTERPRISES INC	2025-09-12 01:09:14.569	2025-09-12 01:09:14.569
cmfg539qp01mpovbottcjd3k8	PERRIN INTERNATIONAL SERVICES, INC	2025-09-12 01:09:14.642	2025-09-12 01:09:14.642
cmfg539sq01mqovboqfu6plx6	PERSANT CONSTRUCTION CO. INC-	2025-09-12 01:09:14.714	2025-09-12 01:09:14.714
cmfg539up01mrovbodasg60s9	PERSONS SERVICES CORP.	2025-09-12 01:09:14.786	2025-09-12 01:09:14.786
cmfg539wp01msovbo49q4iv5z	PET MEDICAL CENTERS & PET RESORTS	2025-09-12 01:09:14.857	2025-09-12 01:09:14.857
cmfg539yp01mtovbo9sgu217b	PET RESORT	2025-09-12 01:09:14.929	2025-09-12 01:09:14.929
cmfg53a0p01muovboytxspahy	PETE CRAIMER	2025-09-12 01:09:15.001	2025-09-12 01:09:15.001
cmfg53a2p01mvovbozviqdy2q	PETER DEUTSCH CONSULTANT	2025-09-12 01:09:15.073	2025-09-12 01:09:15.073
cmfg53a4q01mwovbo181gtr43	PETGAR CONSULTING CORP	2025-09-12 01:09:15.146	2025-09-12 01:09:15.146
cmfg53a6p01mxovbo1mihqd3d	PGA DELIVERY SERVICE	2025-09-12 01:09:15.218	2025-09-12 01:09:15.218
cmfg53a8n01myovbom00e6s1f	PHIL HALL	2025-09-12 01:09:15.288	2025-09-12 01:09:15.288
cmfg53aao01mzovboqytbw1jt	PHILIP D. KNAPP	2025-09-12 01:09:15.36	2025-09-12 01:09:15.36
cmfg53acq01n0ovbo0cvmxjxt	PHILLIPS AND JORDAN	2025-09-12 01:09:15.434	2025-09-12 01:09:15.434
cmfg53aep01n1ovbozx23v4jo	PHILLIPS AND JORDAN:L-28 - Fence Contract	2025-09-12 01:09:15.505	2025-09-12 01:09:15.505
cmfg53agt01n2ovbox1qafbrz	PHOENIX BUILDERS	2025-09-12 01:09:15.581	2025-09-12 01:09:15.581
cmfg53aix01n3ovbo64v6lrix	PHOENIX COMETA GROUP	2025-09-12 01:09:15.657	2025-09-12 01:09:15.657
cmfg53akw01n4ovbo7fb56v1g	PHOENIX FENCE CORP	2025-09-12 01:09:15.728	2025-09-12 01:09:15.728
cmfg53amx01n5ovbo1hukf3z7	PHOENIX MANAGEMENT INC	2025-09-12 01:09:15.802	2025-09-12 01:09:15.802
cmfg53aox01n6ovbovbyj8wvg	PIER LENDARO	2025-09-12 01:09:15.874	2025-09-12 01:09:15.874
cmfg53aqx01n7ovbodumfd1wd	PILOT FREIGHT FROWARDING	2025-09-12 01:09:15.946	2025-09-12 01:09:15.946
cmfg53asw01n8ovboy46ui356	PINA TRUCKING	2025-09-12 01:09:16.017	2025-09-12 01:09:16.017
cmfg53auw01n9ovbobifzniql	PINE CREST COVE ACADEMY	2025-09-12 01:09:16.089	2025-09-12 01:09:16.089
cmfg53aww01naovboszergbkj	PINE CREST PREPARTORY SCHOOL	2025-09-12 01:09:16.161	2025-09-12 01:09:16.161
cmfg53ayy01nbovbot70we4lc	PINE GROVE	2025-09-12 01:09:16.234	2025-09-12 01:09:16.234
cmfg53b0z01ncovbo02ootlzr	PINE WOOD VILLAS	2025-09-12 01:09:16.307	2025-09-12 01:09:16.307
cmfg53b3301ndovbohxw15wnx	PINEBROOK APARTMENTS	2025-09-12 01:09:16.383	2025-09-12 01:09:16.383
cmfg53b5301neovbo5blkszl4	PINECREST GROUP	2025-09-12 01:09:16.456	2025-09-12 01:09:16.456
cmfg53b7301nfovbon8veqxu8	PIONEER DEVELOPMENT OF SOUTH FLORIDA	2025-09-12 01:09:16.528	2025-09-12 01:09:16.528
cmfg53b9301ngovbo5gtp3mxt	PIOS & SONS	2025-09-12 01:09:16.6	2025-09-12 01:09:16.6
cmfg53bb301nhovboxkx7vaza	PIRTLE CONSTRUCTION	2025-09-12 01:09:16.671	2025-09-12 01:09:16.671
cmfg53bd201niovbox7w6lfsy	PJ STRIPING	2025-09-12 01:09:16.742	2025-09-12 01:09:16.742
cmfg53bf201njovboy3sa6dym	PLACERES CONSTRUCTION INC	2025-09-12 01:09:16.815	2025-09-12 01:09:16.815
cmfg53bh801nkovbollkzmx4u	PLAZA CONSTRUCTION	2025-09-12 01:09:16.892	2025-09-12 01:09:16.892
cmfg53bj801nlovbo66365630	PLC CONSTRUCTION INC	2025-09-12 01:09:16.964	2025-09-12 01:09:16.964
cmfg53bl601nmovbonyuci6gi	POINTE GROUP	2025-09-12 01:09:17.035	2025-09-12 01:09:17.035
cmfg53bn601nnovboqeeb25is	POJV	2025-09-12 01:09:17.107	2025-09-12 01:09:17.107
cmfg53bp601noovbok0bd4foq	POND CONSTRUCTION INC	2025-09-12 01:09:17.178	2025-09-12 01:09:17.178
cmfg53br301npovboxci7ctjc	PONTIFEX CONSTRUCTION GROUP, INC	2025-09-12 01:09:17.248	2025-09-12 01:09:17.248
cmfg53bt201nqovbo2d0kcpnh	POOL CORP	2025-09-12 01:09:17.318	2025-09-12 01:09:17.318
cmfg53bv301nrovboasmb4u54	POOLE AND KENT CO. OF FLORIDA	2025-09-12 01:09:17.391	2025-09-12 01:09:17.391
cmfg53bx701nsovboox205oza	POOLE AND KENT CO. OF FLORIDA:TS961	2025-09-12 01:09:17.467	2025-09-12 01:09:17.467
cmfg53bz501ntovboezur4i7u	PORSCHE DESGIN TOWER - MIAMI	2025-09-12 01:09:17.538	2025-09-12 01:09:17.538
cmfg53c1501nuovbogr6ob08t	PORT OF MIAMI RIVER TERMINAL CENTER	2025-09-12 01:09:17.609	2025-09-12 01:09:17.609
cmfg53c3601nvovbo0vahx1aj	PORT OF MIAMI/ CRUISE LINE	2025-09-12 01:09:17.683	2025-09-12 01:09:17.683
cmfg53c5601nwovbo47yh0qc5	PORTO FINO LAKES	2025-09-12 01:09:17.754	2025-09-12 01:09:17.754
cmfg53c7601nxovboy9qrsclv	POTATO	2025-09-12 01:09:17.827	2025-09-12 01:09:17.827
cmfg53c9b01nyovboieee1xxy	PPHP	2025-09-12 01:09:17.903	2025-09-12 01:09:17.903
cmfg53cba01nzovbowxu5jars	PRESTIGE ROOFING-	2025-09-12 01:09:17.975	2025-09-12 01:09:17.975
cmfg53cda01o0ovbooe02i78c	PRICE CONSTRUCTION BY DESIGN	2025-09-12 01:09:18.047	2025-09-12 01:09:18.047
cmfg53cfa01o1ovbosd8n7k3w	PRIMMER CONSTRUCTION, LLC	2025-09-12 01:09:18.119	2025-09-12 01:09:18.119
cmfg53chb01o2ovboyuih2zkg	PRINCE CONTRACTING	2025-09-12 01:09:18.191	2025-09-12 01:09:18.191
cmfg53cje01o3ovbotu4ksw2z	PRINCE CONTRACTING:E1V43	2025-09-12 01:09:18.266	2025-09-12 01:09:18.266
cmfg53cle01o4ovbodsbvibtl	PRINCE CONTRACTING:E1W47	2025-09-12 01:09:18.338	2025-09-12 01:09:18.338
cmfg53cnc01o5ovbovo0ztgr6	PRINCE CONTRACTING:E7R31	2025-09-12 01:09:18.409	2025-09-12 01:09:18.409
cmfg53cph01o6ovboqmofb82e	PRINCE CONTRACTING:E7R31 PO	2025-09-12 01:09:18.486	2025-09-12 01:09:18.486
cmfg53cro01o7ovbo48dvlaml	PRINCE CONTRACTING:E7R33	2025-09-12 01:09:18.564	2025-09-12 01:09:18.564
cmfg53ctm01o8ovbooi7gb6vs	PRINCE CONTRACTING:E8T81	2025-09-12 01:09:18.635	2025-09-12 01:09:18.635
cmfg53cvm01o9ovbopvraorfg	PRINCE CONTRACTING:E8T81 PO	2025-09-12 01:09:18.707	2025-09-12 01:09:18.707
cmfg53cxm01oaovbouc3vj8zj	PRINCE CONTRACTING:E8V06	2025-09-12 01:09:18.779	2025-09-12 01:09:18.779
cmfg53czm01obovbokal1od3a	PRINCE CONTRACTING:I-95 EXPRESS LANES 3B	2025-09-12 01:09:18.851	2025-09-12 01:09:18.851
cmfg53d1n01ocovbo07bq98h4	PRINCE CONTRACTING:I-95 EXPRESS LANES 3B:I95 EXPRESS LANES 3B - PO	2025-09-12 01:09:18.923	2025-09-12 01:09:18.923
cmfg53d3q01odovbonyavc6ht	PRINCE CONTRACTING:I-95 EXPRESS LANES PH 3A-2	2025-09-12 01:09:18.999	2025-09-12 01:09:18.999
cmfg53d5r01oeovbo8lhm0ixt	PRINCE CONTRACTING:I-95 EXPRESS LANES PH 3A-2:EROSION CONTROL	2025-09-12 01:09:19.071	2025-09-12 01:09:19.071
cmfg53d7t01ofovbokct01hkx	PRINCE CONTRACTING:PO - I95 EXPRESS LANES 3A	2025-09-12 01:09:19.145	2025-09-12 01:09:19.145
cmfg53d9s01ogovbomp19d35k	PRINCE CONTRACTING:PO WORK I-95 PHASE 3A	2025-09-12 01:09:19.216	2025-09-12 01:09:19.216
cmfg53dbr01ohovboz0cn6tu0	PRINCE LAND, INC	2025-09-12 01:09:19.288	2025-09-12 01:09:19.288
cmfg53ddv01oiovboe10kbvg0	PRINCE SDC	2025-09-12 01:09:19.364	2025-09-12 01:09:19.364
cmfg53dfx01ojovbobgbp6mcb	PRIORITY PIPELINE SERVICES	2025-09-12 01:09:19.437	2025-09-12 01:09:19.437
cmfg53dhx01okovbovrmz03tc	PRISMA LAND DEVELOPMENT	2025-09-12 01:09:19.509	2025-09-12 01:09:19.509
cmfg53djx01olovbod0sez674	PRO-GROUNDS PRODUCTS INC.	2025-09-12 01:09:19.581	2025-09-12 01:09:19.581
cmfg53dlx01omovbo1jxkkbfw	Procacci Development Corporation	2025-09-12 01:09:19.653	2025-09-12 01:09:19.653
cmfg53dnw01onovbohu4sjno0	PROCUREMENT OPERATIONS MIA1	2025-09-12 01:09:19.725	2025-09-12 01:09:19.725
cmfg53dpx01ooovbophw999yv	PRODESA INTERNATIONAL LLC	2025-09-12 01:09:19.797	2025-09-12 01:09:19.797
cmfg53drz01opovbowsgqwzie	PROFESSIONAL ENGINEERING SERVICES LLC	2025-09-12 01:09:19.871	2025-09-12 01:09:19.871
cmfg53dtz01oqovbouba11ypi	PROFITABLE CREATIVE SOLUTIONS	2025-09-12 01:09:19.943	2025-09-12 01:09:19.943
cmfg53dvz01orovbocyni9h0o	PROGRESSIVE INSURANCE	2025-09-12 01:09:20.015	2025-09-12 01:09:20.015
cmfg53dxy01osovbogkk9p199	PROGRESSIVE PIPELINE	2025-09-12 01:09:20.087	2025-09-12 01:09:20.087
cmfg53dzy01otovboa9vz7z19	PROJECT 1 CONSTRUCTION, INC.	2025-09-12 01:09:20.159	2025-09-12 01:09:20.159
cmfg53e2301ouovbo9qsgyxjz	PROJECT DEVELOPMENT GROUP, INC	2025-09-12 01:09:20.236	2025-09-12 01:09:20.236
cmfg53e4501ovovboc9bne9q7	PRONTO WASTE SERVICES	2025-09-12 01:09:20.309	2025-09-12 01:09:20.309
cmfg53e6401owovboa8xpa8p5	PROPERTIES OF ELEGANT DISTINCTION LLC	2025-09-12 01:09:20.381	2025-09-12 01:09:20.381
cmfg53e8501oxovbowvqij9fm	PROTECT VIDEO, INC.	2025-09-12 01:09:20.453	2025-09-12 01:09:20.453
cmfg53ea401oyovbo8fg6n3zv	PROVENTUS HOLDING INC	2025-09-12 01:09:20.525	2025-09-12 01:09:20.525
cmfg53ec501ozovboz83eojlm	PSD HOLDING, LLC.	2025-09-12 01:09:20.597	2025-09-12 01:09:20.597
cmfg53ee401p0ovbobcinh0c8	PSI	2025-09-12 01:09:20.669	2025-09-12 01:09:20.669
cmfg53eg501p1ovbo7g7uzc13	PSN CONTRACTING	2025-09-12 01:09:20.741	2025-09-12 01:09:20.741
cmfg53ei501p2ovboajbvyjia	PUBLIC MOBILE STORAGE	2025-09-12 01:09:20.813	2025-09-12 01:09:20.813
cmfg53ekd01p3ovboc3wssc5a	PUBLIC WORKS AND WASTE MANAGEMENT	2025-09-12 01:09:20.894	2025-09-12 01:09:20.894
cmfg53emh01p4ovbo16pfs9lf	PUMP MASTER, INC	2025-09-12 01:09:20.97	2025-09-12 01:09:20.97
cmfg53eoi01p5ovbo5ldrrap8	PVAF	2025-09-12 01:09:21.043	2025-09-12 01:09:21.043
cmfg53eqk01p6ovbomndhgnnn	PYRAMID CONSTRUCTION	2025-09-12 01:09:21.117	2025-09-12 01:09:21.117
cmfg53esm01p7ovboxjf0xunz	QCP	2025-09-12 01:09:21.191	2025-09-12 01:09:21.191
cmfg53eul01p8ovbo8vljw36z	QMED CORPORATION	2025-09-12 01:09:21.262	2025-09-12 01:09:21.262
cmfg53ewk01p9ovboo7fus0ty	QSF	2025-09-12 01:09:21.333	2025-09-12 01:09:21.333
cmfg53eyk01paovboxw3u0kot	QUALITY CONSTRUCTION PERFORMANCE, INC.	2025-09-12 01:09:21.405	2025-09-12 01:09:21.405
cmfg53f0k01pbovbo9262bg9p	QUALITY PAVING CORP	2025-09-12 01:09:21.476	2025-09-12 01:09:21.476
cmfg53f2k01pcovbozxckm91u	R & D ELECTRIC, INC.	2025-09-12 01:09:21.549	2025-09-12 01:09:21.549
cmfg53f4n01pdovbo24mk2isr	R ADVANCE	2025-09-12 01:09:21.623	2025-09-12 01:09:21.623
cmfg53f6o01peovbosv88p2n0	R&G ENGINEERING INC	2025-09-12 01:09:21.697	2025-09-12 01:09:21.697
cmfg53f8t01pfovbofxnd42o2	R. TARAFA GENERAL CONTRACTOR	2025-09-12 01:09:21.774	2025-09-12 01:09:21.774
cmfg53faw01pgovboqutf8dh4	R.E.T.C INC.	2025-09-12 01:09:21.849	2025-09-12 01:09:21.849
cmfg53fd001phovbo2mz9mxx4	R2R DEMOLITION INC	2025-09-12 01:09:21.924	2025-09-12 01:09:21.924
cmfg53ff401piovbo3xz5tyme	RAFAEL GARCIA	2025-09-12 01:09:22.001	2025-09-12 01:09:22.001
cmfg53fhf01pjovboqs4rg5sd	RAINBOW COMPUTERS CORP.	2025-09-12 01:09:22.084	2025-09-12 01:09:22.084
cmfg53fjj01pkovbo1psd9p92	RAK RISK INC	2025-09-12 01:09:22.159	2025-09-12 01:09:22.159
cmfg53fln01plovboz7ct1uf9	RALPH GONZALEZ	2025-09-12 01:09:22.235	2025-09-12 01:09:22.235
cmfg53fnq01pmovbolk9ovjjd	RALPH VIOLA	2025-09-12 01:09:22.311	2025-09-12 01:09:22.311
cmfg53fqv01pnovbo09rd2x3s	RAM-TECH CONSTRUCTION	2025-09-12 01:09:22.424	2025-09-12 01:09:22.424
cmfg53fsv01poovbo5sobxwui	RANDY FIORENZA	2025-09-12 01:09:22.496	2025-09-12 01:09:22.496
cmfg53fux01ppovbo5q5x0o11	RANGER CONSTRUCTION-SOUTH	2025-09-12 01:09:22.569	2025-09-12 01:09:22.569
cmfg53fwz01pqovbomcm2xrxt	RANGER CONSTRUCTION-SOUTH:SHELTAIR AIR	2025-09-12 01:09:22.643	2025-09-12 01:09:22.643
cmfg53fz301provbodpu27w7q	RANGER CONSTRUCTION INDUSTRIES, INC	2025-09-12 01:09:22.719	2025-09-12 01:09:22.719
cmfg53g1e01psovboo7r7nl0b	RANGER CONSTRUCTION INDUSTRIES, INC.	2025-09-12 01:09:22.802	2025-09-12 01:09:22.802
cmfg53g3i01ptovbo9bvq80jh	RANGER CONSTRUCTION INDUSTRIES, INC:CORAL RIDGE DRIVE	2025-09-12 01:09:22.878	2025-09-12 01:09:22.878
cmfg53g5o01puovbo9so2tx1a	RANGER CONSTRUCTION INDUSTRIES, INC:I-75 SEG D	2025-09-12 01:09:22.956	2025-09-12 01:09:22.956
cmfg53g7q01pvovboy5mpj05q	RANGER CONSTRUCTION INDUSTRIES, INC:RANGER SEG -C	2025-09-12 01:09:23.031	2025-09-12 01:09:23.031
cmfg53g9u01pwovbol0fq2xru	RANGER CONSTRUCTION INDUSTRIES, INC:Runway 10-28 Safety Enhancements	2025-09-12 01:09:23.106	2025-09-12 01:09:23.106
cmfg53gbu01pxovbokp10plq8	RANGER CONSTRUCTION INDUSTRIES, INC:SEG D - PO WORK	2025-09-12 01:09:23.179	2025-09-12 01:09:23.179
cmfg53gdw01pyovbo4uoia2s2	RANK SERVICES	2025-09-12 01:09:23.252	2025-09-12 01:09:23.252
cmfg53gfv01pzovboxqy0xlsb	RAQUEL	2025-09-12 01:09:23.323	2025-09-12 01:09:23.323
cmfg53ghu01q0ovbo46x3agi5	RAY CARPENTER	2025-09-12 01:09:23.395	2025-09-12 01:09:23.395
cmfg53gjt01q1ovbod0jhklmu	RAY PEREZ	2025-09-12 01:09:23.465	2025-09-12 01:09:23.465
cmfg53glt01q2ovbodmab5afv	RAYNEAU CONSTRUCTION & INDUSTRIAL PRODUCT	2025-09-12 01:09:23.537	2025-09-12 01:09:23.537
cmfg53gnu01q3ovbo9hxsww60	RAYTHEON CONSTRUCTION, INC.	2025-09-12 01:09:23.61	2025-09-12 01:09:23.61
cmfg53gpu01q4ovboqxc06g0y	RBC HOLDINGS	2025-09-12 01:09:23.683	2025-09-12 01:09:23.683
cmfg53gru01q5ovboh4a9g97y	RC ALUMINIUM	2025-09-12 01:09:23.754	2025-09-12 01:09:23.754
cmfg53gtu01q6ovbose1y9ye4	RC BUILDERS	2025-09-12 01:09:23.826	2025-09-12 01:09:23.826
cmfg53gvu01q7ovboj8cyraro	RC TRUCK SALES	2025-09-12 01:09:23.898	2025-09-12 01:09:23.898
cmfg53gxt01q8ovbo6f6pp8si	RCC ASSOCIATES	2025-09-12 01:09:23.97	2025-09-12 01:09:23.97
cmfg53gzu01q9ovbor3cy654q	RE CRAWFORD	2025-09-12 01:09:24.042	2025-09-12 01:09:24.042
cmfg53h1u01qaovboi0bnmucj	REAL ESTATE DEVELOPMENT GROUP	2025-09-12 01:09:24.114	2025-09-12 01:09:24.114
cmfg53h3s01qbovbo8jm7ydbf	REAL ESTATE SERVICE, INC	2025-09-12 01:09:24.185	2025-09-12 01:09:24.185
cmfg53h5t01qcovboq0bucx1q	RECHTIEN INTERNATIONAL	2025-09-12 01:09:24.257	2025-09-12 01:09:24.257
cmfg53h7s01qdovbot1mogd7r	RECTENWALD BROTHERS	2025-09-12 01:09:24.329	2025-09-12 01:09:24.329
cmfg53h9s01qeovboqng8ynmz	RED DOT FAIR	2025-09-12 01:09:24.4	2025-09-12 01:09:24.4
cmfg53hbu01qfovbo14g65f0i	REDEVELOPMENT GROUP OF SOUTH FLORIDA, INC	2025-09-12 01:09:24.474	2025-09-12 01:09:24.474
cmfg53hdt01qgovbohtjwo1e9	REGI PARKING LOT INC	2025-09-12 01:09:24.546	2025-09-12 01:09:24.546
cmfg53hfu01qhovbov8oum3hc	REGLA REALPOZO	2025-09-12 01:09:24.618	2025-09-12 01:09:24.618
cmfg53hhx01qiovbok9ozvnow	REMEDIO CORP.	2025-09-12 01:09:24.693	2025-09-12 01:09:24.693
cmfg53hjx01qjovboyqhq3ce8	RENAISSANCE BUILDERS & CONSTRUCTORS INC.	2025-09-12 01:09:24.765	2025-09-12 01:09:24.765
cmfg53hlx01qkovbowwifmlut	RENEW RESTORE	2025-09-12 01:09:24.838	2025-09-12 01:09:24.838
cmfg53hnx01qlovbo5b59bsnf	RENOVATIONS WITH STYLE INC	2025-09-12 01:09:24.909	2025-09-12 01:09:24.909
cmfg53hpx01qmovbo48dsfey3	REPO BOATS DIRECT	2025-09-12 01:09:24.982	2025-09-12 01:09:24.982
cmfg53hrx01qnovbojxs8280e	RET ASSOCIATES	2025-09-12 01:09:25.054	2025-09-12 01:09:25.054
cmfg53htx01qoovboub5dlfl0	RETAIL MAINTENANCE SPECIALISTS	2025-09-12 01:09:25.125	2025-09-12 01:09:25.125
cmfg53hvw01qpovboheh683ap	Reynier Garcia	2025-09-12 01:09:25.197	2025-09-12 01:09:25.197
cmfg53hxy01qqovbojctxtr4m	RG ENGINEERING	2025-09-12 01:09:25.27	2025-09-12 01:09:25.27
cmfg53hzx01qrovbog95nsuam	RG UNDERGROUND	2025-09-12 01:09:25.341	2025-09-12 01:09:25.341
cmfg53i1x01qsovboa0uptlcy	RG UNDERGROUND:PUMP STATION #0150 - DORAL	2025-09-12 01:09:25.413	2025-09-12 01:09:25.413
cmfg53i3v01qtovbo4ynsamsj	RIC-MAN INTERNATIONAL, INC.	2025-09-12 01:09:25.484	2025-09-12 01:09:25.484
cmfg53i5w01quovbo0w5zl254	RICHARD AGUILAR	2025-09-12 01:09:25.556	2025-09-12 01:09:25.556
cmfg53i8301qvovbogxauhg9h	RICHARD GROUP	2025-09-12 01:09:25.635	2025-09-12 01:09:25.635
cmfg53ia301qwovborevt59q5	RICHARD HERNANDEZ	2025-09-12 01:09:25.707	2025-09-12 01:09:25.707
cmfg53icc01qxovboybf6fvma	RICHIE & JULIO	2025-09-12 01:09:25.789	2025-09-12 01:09:25.789
cmfg53ieh01qyovbohuh6u803	RICK AGUILA	2025-09-12 01:09:25.865	2025-09-12 01:09:25.865
cmfg53igh01qzovbols5yfiix	RIDE MARSEILLES	2025-09-12 01:09:25.937	2025-09-12 01:09:25.937
cmfg53iil01r0ovbo011d79mm	RILEA GROUP	2025-09-12 01:09:26.013	2025-09-12 01:09:26.013
cmfg53iko01r1ovbo1l0cwfc6	RITA	2025-09-12 01:09:26.089	2025-09-12 01:09:26.089
cmfg53imo01r2ovboe0t6c278	RIVER LANDING DEVLOPMENT	2025-09-12 01:09:26.161	2025-09-12 01:09:26.161
cmfg53ioq01r3ovboy335aexl	RIVER PROPERTIES INC	2025-09-12 01:09:26.234	2025-09-12 01:09:26.234
cmfg53iqt01r4ovbomusl3nuk	RIVER STONE	2025-09-12 01:09:26.309	2025-09-12 01:09:26.309
cmfg53ist01r5ovbomhx91na8	RIZZANI DE ECCHER USA	2025-09-12 01:09:26.382	2025-09-12 01:09:26.382
cmfg53iuw01r6ovbone5s8l1y	RJR CONSTRUCTION	2025-09-12 01:09:26.456	2025-09-12 01:09:26.456
cmfg53iww01r7ovbohnvaezv3	RJS CONTRACTORS	2025-09-12 01:09:26.528	2025-09-12 01:09:26.528
cmfg53iyy01r8ovboy11h3z83	RMB GENERAL CONTRACTOR	2025-09-12 01:09:26.603	2025-09-12 01:09:26.603
cmfg53j0y01r9ovboo04vmofk	RN BROWN ASSOCIATES	2025-09-12 01:09:26.675	2025-09-12 01:09:26.675
cmfg53j2x01raovbo60oq67kg	ROAD FRIEND INC	2025-09-12 01:09:26.745	2025-09-12 01:09:26.745
cmfg53j4x01rbovboettlnfbe	ROADWAY CONSTRUCTION LLC	2025-09-12 01:09:26.818	2025-09-12 01:09:26.818
cmfg53j6x01rcovbormgonrlv	ROADWAY CONSTRUCTION LLC:SW 216 ST AND 115 AVE	2025-09-12 01:09:26.889	2025-09-12 01:09:26.889
cmfg53j8x01rdovboy3v3g91m	ROADWAY CONSTRUCTION LLC:T-6441	2025-09-12 01:09:26.961	2025-09-12 01:09:26.961
cmfg53jay01reovboxqlukln3	ROADWAY CONSTRUCTION LLC:T4568	2025-09-12 01:09:27.034	2025-09-12 01:09:27.034
cmfg53jd101rfovbokg8u1yla	ROBERT CUCINOTTA	2025-09-12 01:09:27.11	2025-09-12 01:09:27.11
cmfg53jf601rgovboipxg1sli	ROBERT GOMEZ	2025-09-12 01:09:27.186	2025-09-12 01:09:27.186
cmfg53jh601rhovbo51230yz8	ROBERT ROSENFIELD	2025-09-12 01:09:27.258	2025-09-12 01:09:27.258
cmfg53jj501riovbomsd2v5lc	ROBERT RUIZ & ASSOC.	2025-09-12 01:09:27.329	2025-09-12 01:09:27.329
cmfg53jl501rjovbohgchcb2a	ROBERT SHIELD	2025-09-12 01:09:27.401	2025-09-12 01:09:27.401
cmfg53jo601rkovboi79iabjf	ROBERTS ROOFING & SIDING	2025-09-12 01:09:27.51	2025-09-12 01:09:27.51
cmfg53jqb01rlovbocnpj2zlc	ROBINS & MORTON	2025-09-12 01:09:27.587	2025-09-12 01:09:27.587
cmfg53jsd01rmovbojabo1djg	ROBYN JOSEPH	2025-09-12 01:09:27.661	2025-09-12 01:09:27.661
cmfg53jug01rnovbo4v1tvnjl	ROCAL INC	2025-09-12 01:09:27.737	2025-09-12 01:09:27.737
cmfg53jwr01roovboeulvfs3t	ROCK POWER PAVING	2025-09-12 01:09:27.82	2025-09-12 01:09:27.82
cmfg53jyt01rpovbon0muv542	ROCKY ROOFING	2025-09-12 01:09:27.894	2025-09-12 01:09:27.894
cmfg53k0s01rqovbovhdj9kog	RODEWAY INN	2025-09-12 01:09:27.964	2025-09-12 01:09:27.964
cmfg53k2u01rrovboc4ipgosm	ROGAR MANAGMENT&CONSULTING	2025-09-12 01:09:28.038	2025-09-12 01:09:28.038
cmfg53k4z01rsovboy3jkbzv6	ROLANDO GONZALEZ	2025-09-12 01:09:28.116	2025-09-12 01:09:28.116
cmfg53k7301rtovbouzx895il	RON LO ENTERPRISES INC	2025-09-12 01:09:28.191	2025-09-12 01:09:28.191
cmfg53k9101ruovbob93v4yvy	RONDON CONSTRUCTION	2025-09-12 01:09:28.262	2025-09-12 01:09:28.262
cmfg53kb201rvovbo2x0lkzon	RONDON CONSTRUCTION:ATLIS KENDALL	2025-09-12 01:09:28.334	2025-09-12 01:09:28.334
cmfg53kd101rwovbo1v4kwkws	ROQUI ROQUE	2025-09-12 01:09:28.406	2025-09-12 01:09:28.406
cmfg53kf201rxovbo2yibiyyh	ROSA DEL MONTE	2025-09-12 01:09:28.479	2025-09-12 01:09:28.479
cmfg53kh201ryovbos2qfpyg8	ROSS	2025-09-12 01:09:28.551	2025-09-12 01:09:28.551
cmfg53kj201rzovboqqs8v0f6	ROSS FURNITURE LOGISTICS	2025-09-12 01:09:28.622	2025-09-12 01:09:28.622
cmfg53kl401s0ovbougjc88il	ROTHSTAR CONSTRUCTION, INC	2025-09-12 01:09:28.696	2025-09-12 01:09:28.696
cmfg53kn401s1ovbou2sbdm2p	ROURKE CONSTRUCTION	2025-09-12 01:09:28.769	2025-09-12 01:09:28.769
cmfg53kp401s2ovboe7n8zvty	ROURKE CONSTRUCTION:ROURKE-5200-1-07165.0014 (fence over cann	2025-09-12 01:09:28.84	2025-09-12 01:09:28.84
cmfg53kr801s3ovbofaeqjth5	ROURKE CONSTRUCTION:ROURKE 5201-1-07165.0014 (cable)	2025-09-12 01:09:28.916	2025-09-12 01:09:28.916
cmfg53kt701s4ovbopnodljjk	ROY JORGENSEN ASSOCIATE	2025-09-12 01:09:28.988	2025-09-12 01:09:28.988
cmfg53kv801s5ovboj6mplyq3	ROYAL CARRIBBEAN INSURANCE	2025-09-12 01:09:29.061	2025-09-12 01:09:29.061
cmfg53kx501s6ovbojs3d51ys	ROYAL POINCIANA CONDO INC	2025-09-12 01:09:29.129	2025-09-12 01:09:29.129
cmfg53kyz01s7ovbo7biuqwuj	RPC HOLDINGS	2025-09-12 01:09:29.196	2025-09-12 01:09:29.196
cmfg53l1201s8ovbowjbed5vu	RR DORAL VIEW 2 LLC	2025-09-12 01:09:29.27	2025-09-12 01:09:29.27
cmfg53l3101s9ovboplom9ct7	RS ENVIROMENTAL CONSULTING, INC.	2025-09-12 01:09:29.342	2025-09-12 01:09:29.342
cmfg53l5101saovbou8d63f1p	RSR CUSTOM RENOVATIONS & ADDITIONS, INC	2025-09-12 01:09:29.414	2025-09-12 01:09:29.414
cmfg53l7001sbovboi8uebxxr	RUBEN FENCE	2025-09-12 01:09:29.485	2025-09-12 01:09:29.485
cmfg53l9201scovboaiigjz52	RUBIO CONSTRUCTION CONSULTING	2025-09-12 01:09:29.558	2025-09-12 01:09:29.558
cmfg53lb201sdovbosbdnt40s	RUDYS' READY MIX	2025-09-12 01:09:29.63	2025-09-12 01:09:29.63
cmfg53ld101seovbohp8o00bx	RUIZ CONSTRUCTION	2025-09-12 01:09:29.702	2025-09-12 01:09:29.702
cmfg53lf101sfovbo88subpx4	RUSSELL ENGINEERING INC	2025-09-12 01:09:29.773	2025-09-12 01:09:29.773
cmfg53lh501sgovboehjmzgp9	RUSSELL ENGINEERING, INC.	2025-09-12 01:09:29.849	2025-09-12 01:09:29.849
cmfg53ljr01shovbobatexvdv	RUSSELL ENGINEERING, INC.:T-6337	2025-09-12 01:09:29.943	2025-09-12 01:09:29.943
cmfg53llr01siovbolwei13g2	RUSSELL ENGINEERING, INC.:T6338	2025-09-12 01:09:30.015	2025-09-12 01:09:30.015
cmfg53lnr01sjovbo4q4627vv	RUSSELL ENGINEERING, INC.:T6338:T6337	2025-09-12 01:09:30.088	2025-09-12 01:09:30.088
cmfg53lpr01skovboyuemaz7n	RYAN INC	2025-09-12 01:09:30.159	2025-09-12 01:09:30.159
cmfg53lrr01slovbota3x3s8u	RYAN INC:T6547	2025-09-12 01:09:30.231	2025-09-12 01:09:30.231
cmfg53ltw01smovbo6gza3c2l	RYAN INC:T6547:T6547 PO	2025-09-12 01:09:30.308	2025-09-12 01:09:30.308
cmfg53lvw01snovboeqgwhoro	RYCON CONSTRUCTION, INC	2025-09-12 01:09:30.38	2025-09-12 01:09:30.38
cmfg53lxv01soovbo9yynfcuw	RYDER	2025-09-12 01:09:30.451	2025-09-12 01:09:30.451
cmfg53lzv01spovbo3g05b7tb	RYDER PROPERTIES	2025-09-12 01:09:30.524	2025-09-12 01:09:30.524
cmfg53m1v01sqovbotg8y872z	S & L IRONWORK CORP.	2025-09-12 01:09:30.596	2025-09-12 01:09:30.596
cmfg53m3u01srovbo62ait1ib	SA CONSULTING	2025-09-12 01:09:30.667	2025-09-12 01:09:30.667
cmfg53m5u01ssovboo14oyckk	SABASTIAN	2025-09-12 01:09:30.739	2025-09-12 01:09:30.739
cmfg53m7t01stovbo9dm4zxuy	SACYR CONSTRUCTION	2025-09-12 01:09:30.81	2025-09-12 01:09:30.81
cmfg53ma001suovbolog7ipu7	SAFA CONSTRUCTION	2025-09-12 01:09:30.888	2025-09-12 01:09:30.888
cmfg53mbz01svovboofzg4sqw	SAFETY SYSTEMS BARRICADES, CORP	2025-09-12 01:09:30.96	2025-09-12 01:09:30.96
cmfg53mdy01swovboyhpqqqa9	SAGE COLLECTIVE	2025-09-12 01:09:31.031	2025-09-12 01:09:31.031
cmfg53mg001sxovboq9np8fv9	Saint Andrews Greek Orthodox Church	2025-09-12 01:09:31.104	2025-09-12 01:09:31.104
cmfg53mi701syovboydh3t1mx	Sam/Sandie Lo Bue	2025-09-12 01:09:31.184	2025-09-12 01:09:31.184
cmfg53mkc01szovbovsbzlhdc	SAMM CONSTRUCTION SERVICES LLC	2025-09-12 01:09:31.261	2025-09-12 01:09:31.261
cmfg53mmc01t0ovbotpeeiv81	SANCHEZ ARANGO CONSTRUCTION	2025-09-12 01:09:31.332	2025-09-12 01:09:31.332
cmfg53moh01t1ovbo72aji6k7	SANCHEZ ARANGO CONSTRUCTION-	2025-09-12 01:09:31.409	2025-09-12 01:09:31.409
cmfg53mqg01t2ovboz0p4edft	SAUER CONSTRUCTION LLC	2025-09-12 01:09:31.481	2025-09-12 01:09:31.481
cmfg53msp01t3ovbofx49tcgn	SBSX	2025-09-12 01:09:31.562	2025-09-12 01:09:31.562
cmfg53mup01t4ovbofuu87j4i	SC PROPERTY ACQUSITION LLC	2025-09-12 01:09:31.634	2025-09-12 01:09:31.634
cmfg53mwq01t5ovbob532i68g	SCAN GLOBAL LOGISTICS	2025-09-12 01:09:31.706	2025-09-12 01:09:31.706
cmfg53myp01t6ovbobq2rwc3m	SCHWARZ PARTNERS PACKING	2025-09-12 01:09:31.778	2025-09-12 01:09:31.778
cmfg53n0o01t7ovbog0hme501	SCLAD PARK PLACE	2025-09-12 01:09:31.849	2025-09-12 01:09:31.849
cmfg53n2o01t8ovbor09ptxm6	SCOPE ART SHOW	2025-09-12 01:09:31.921	2025-09-12 01:09:31.921
cmfg53n4p01t9ovbompo80o73	SCOPE INTERNATIONAL	2025-09-12 01:09:31.993	2025-09-12 01:09:31.993
cmfg53n7201taovboqn5s6f97	SCORPION TRANSFER	2025-09-12 01:09:32.078	2025-09-12 01:09:32.078
cmfg53n9501tbovbo3ziiq4kt	SCOTT CONSTRUCTION	2025-09-12 01:09:32.153	2025-09-12 01:09:32.153
cmfg53nb001tcovbopvp5ur5j	SCOTT RYAN	2025-09-12 01:09:32.22	2025-09-12 01:09:32.22
cmfg53nd101tdovbo47k2kur0	SEABOARD MARINE LTD	2025-09-12 01:09:32.293	2025-09-12 01:09:32.293
cmfg53nf001teovboztm78qq7	SEACOAST INC	2025-09-12 01:09:32.365	2025-09-12 01:09:32.365
cmfg53nhg01tfovbouwfsft62	SEAGIS PROPERTY GROUP	2025-09-12 01:09:32.452	2025-09-12 01:09:32.452
cmfg53njg01tgovbodfay98aj	SELENIS TECHONOLOGY	2025-09-12 01:09:32.525	2025-09-12 01:09:32.525
cmfg53nlk01thovbo9r66f8cb	SEMA CONSTRUCTION	2025-09-12 01:09:32.6	2025-09-12 01:09:32.6
cmfg53nnt01tiovboin93xhvt	SEMINOLE GAMING	2025-09-12 01:09:32.682	2025-09-12 01:09:32.682
cmfg53nps01tjovbodshhkvmz	SEMINOLE TRIBE OF FLORIDA	2025-09-12 01:09:32.753	2025-09-12 01:09:32.753
cmfg53nrw01tkovbop4g7kuls	SENTURY TIRE	2025-09-12 01:09:32.829	2025-09-12 01:09:32.829
cmfg53ntx01tlovbovk5v1xot	SERENA LAKE	2025-09-12 01:09:32.902	2025-09-12 01:09:32.902
cmfg53nw601tmovbo8n8jthly	SERGIO	2025-09-12 01:09:32.982	2025-09-12 01:09:32.982
cmfg53ny401tnovbotcxwe88p	SETH HELLER	2025-09-12 01:09:33.053	2025-09-12 01:09:33.053
cmfg53o0501toovbotzpr2qif	SEVEN-UP SNAPPLE	2025-09-12 01:09:33.125	2025-09-12 01:09:33.125
cmfg53o2001tpovboc1dea3yw	SEVILLA CONDOS	2025-09-12 01:09:33.192	2025-09-12 01:09:33.192
cmfg53o4301tqovbo2pbwhdv1	SEYON MANEMENT, LLC	2025-09-12 01:09:33.267	2025-09-12 01:09:33.267
cmfg53o6201trovboozpki6so	SF ENTERPRISE OF MIAMI	2025-09-12 01:09:33.339	2025-09-12 01:09:33.339
cmfg53o8501tsovbowcf9wojd	SFM SERVICES, INC.	2025-09-12 01:09:33.414	2025-09-12 01:09:33.414
cmfg53oa501ttovbojw9ac3hw	SGA MANAGEMENT INC	2025-09-12 01:09:33.485	2025-09-12 01:09:33.485
cmfg53oc401tuovbo40kd3jd9	SHAMROCK BUILDING SYSTEMS	2025-09-12 01:09:33.556	2025-09-12 01:09:33.556
cmfg53oe401tvovbo5gatudbr	SHAMUS PAVING	2025-09-12 01:09:33.628	2025-09-12 01:09:33.628
cmfg53og001twovbo2il965nf	SHAMUS PAVING:PALM BEACH LAKE ALLEYWAY	2025-09-12 01:09:33.697	2025-09-12 01:09:33.697
cmfg53oin01txovbofi1pwcts	SHASA ENGINEERING	2025-09-12 01:09:33.791	2025-09-12 01:09:33.791
cmfg53okm01tyovborzeh1jld	Shawn Paite	2025-09-12 01:09:33.863	2025-09-12 01:09:33.863
cmfg53omm01tzovbocyz56v93	SHENANDOAH CONSTRUCTION	2025-09-12 01:09:33.935	2025-09-12 01:09:33.935
cmfg53oom01u0ovboh2t7fcag	SHIRAZ SOOKRALLI	2025-09-12 01:09:34.007	2025-09-12 01:09:34.007
cmfg53oqr01u1ovbokrdpqr3n	SHORELINE FOUNDATION, INC	2025-09-12 01:09:34.084	2025-09-12 01:09:34.084
cmfg53osr01u2ovboxqbvt9n3	SHORES DEVELOPMENT INC	2025-09-12 01:09:34.156	2025-09-12 01:09:34.156
cmfg53our01u3ovbo5ihgy6i2	SHORT BROTHERS CONSTRUCTION, INC	2025-09-12 01:09:34.227	2025-09-12 01:09:34.227
cmfg53owp01u4ovbogzyr47m2	SHUTTER TECH INC	2025-09-12 01:09:34.298	2025-09-12 01:09:34.298
cmfg53oyq01u5ovboyqgfy8aj	SHVO	2025-09-12 01:09:34.37	2025-09-12 01:09:34.37
cmfg53p0i01u6ovbozrssu8hj	SICE	2025-09-12 01:09:34.434	2025-09-12 01:09:34.434
cmfg53p2h01u7ovbohqwemu1t	SIERRA CONSTRUCTION	2025-09-12 01:09:34.506	2025-09-12 01:09:34.506
cmfg53p4i01u8ovboocd9wiib	SIGNAL TECHNOLOGY	2025-09-12 01:09:34.578	2025-09-12 01:09:34.578
cmfg53p6h01u9ovbo3ezlytt5	SIGNAL TECHNOLOGY:E4V96	2025-09-12 01:09:34.649	2025-09-12 01:09:34.649
cmfg53p8701uaovboo8f3fbll	SILVER COAST CONSTRUCTION	2025-09-12 01:09:34.712	2025-09-12 01:09:34.712
cmfg53pa701ubovboj3jjd4wj	SILVER KROME GARDENS INC	2025-09-12 01:09:34.784	2025-09-12 01:09:34.784
cmfg53pc801ucovbo8h4gyujg	SILVER PALM GROWERS	2025-09-12 01:09:34.856	2025-09-12 01:09:34.856
cmfg53pe701udovboyvdnae6p	SILVER PALM NURSERY	2025-09-12 01:09:34.928	2025-09-12 01:09:34.928
cmfg53pfz01ueovbomke02sdj	SILVIA SILBESTRE	2025-09-12 01:09:34.991	2025-09-12 01:09:34.991
cmfg53pi301ufovboi1sidvtg	SIM	2025-09-12 01:09:35.068	2025-09-12 01:09:35.068
cmfg53pjy01ugovboa4g9lyg5	SIM-G TECHNOLOGIES	2025-09-12 01:09:35.134	2025-09-12 01:09:35.134
cmfg53plu01uhovboop4cgxrw	SIMMONS PIPE	2025-09-12 01:09:35.202	2025-09-12 01:09:35.202
cmfg53pnl01uiovbozc5h2sgp	SIMON WATER MAN	2025-09-12 01:09:35.266	2025-09-12 01:09:35.266
cmfg53ppl01ujovbov4q07wys	SK QUALITY CONTRACTOR-	2025-09-12 01:09:35.337	2025-09-12 01:09:35.337
cmfg53psk01ukovboly53j0h6	SKANSKA USA CIVIL SOUTHEAST	2025-09-12 01:09:35.445	2025-09-12 01:09:35.445
cmfg53pug01ulovboo9z086hk	SKIP VANCEL	2025-09-12 01:09:35.512	2025-09-12 01:09:35.512
cmfg53pwb01umovboiame84m1	SKY DEVELOPMENT	2025-09-12 01:09:35.579	2025-09-12 01:09:35.579
cmfg53pyc01unovbo5r1dzksa	SKY LEASE CARGO	2025-09-12 01:09:35.653	2025-09-12 01:09:35.653
cmfg53q0h01uoovbon02isl5w	SKYLINE MANAGEMENT GROUP, INC	2025-09-12 01:09:35.729	2025-09-12 01:09:35.729
cmfg53q2g01upovbopmnp430q	SM PARCEL A LLC	2025-09-12 01:09:35.8	2025-09-12 01:09:35.8
cmfg53q4g01uqovbo3ivl01cu	SM PARECELB LLC	2025-09-12 01:09:35.872	2025-09-12 01:09:35.872
cmfg53q6k01urovbomrmt3lgk	SMART FENCE CORP	2025-09-12 01:09:35.948	2025-09-12 01:09:35.948
cmfg53q8l01usovbok2aq3mbx	SMITH HAMILTON INDUSTRIAL TOOLS	2025-09-12 01:09:36.021	2025-09-12 01:09:36.021
cmfg53qaf01utovbo2n9ms4p8	SMS BUILDERS CORP	2025-09-12 01:09:36.087	2025-09-12 01:09:36.087
cmfg53qck01uuovboilinfhmf	SNAPPER FISH AND CHICKEN	2025-09-12 01:09:36.164	2025-09-12 01:09:36.164
cmfg53qeo01uvovbog4yxnw3j	SOARES DA COSTA	2025-09-12 01:09:36.241	2025-09-12 01:09:36.241
cmfg53qgn01uwovbou1112xxu	SOLARES APARTMENTS	2025-09-12 01:09:36.312	2025-09-12 01:09:36.312
cmfg53qio01uxovbo2l2ig7b0	SOLE MIA PROPERTY OWNERS ASSOCIATION INC	2025-09-12 01:09:36.384	2025-09-12 01:09:36.384
cmfg53qkp01uyovbo4x903q7d	SOLE MIA PROPERTY OWNERS ASSOCIATION INC:DOG PARK	2025-09-12 01:09:36.457	2025-09-12 01:09:36.457
cmfg53qmo01uzovbovzywc9kt	SOLO CONSTRUCTION AND ENGINEERING	2025-09-12 01:09:36.529	2025-09-12 01:09:36.529
cmfg53qok01v0ovbo9u13y2m2	SOLO CONSTRUCTION CORP	2025-09-12 01:09:36.596	2025-09-12 01:09:36.596
cmfg53qqe01v1ovboiiqu4ozj	Solution Construction	2025-09-12 01:09:36.662	2025-09-12 01:09:36.662
cmfg53qs401v2ovbo4w7yszoq	SOLUTION CONSTRUCTION INC	2025-09-12 01:09:36.725	2025-09-12 01:09:36.725
cmfg53qu401v3ovbo4nz2qrnv	SOLUTIONS INC.	2025-09-12 01:09:36.797	2025-09-12 01:09:36.797
cmfg53qw101v4ovbovxaa5m18	SONNIA SILSBY	2025-09-12 01:09:36.865	2025-09-12 01:09:36.865
cmfg53qy201v5ovbotvkxue0i	SORAYA STROUSE	2025-09-12 01:09:36.938	2025-09-12 01:09:36.938
cmfg53r0201v6ovboa5gtmu37	SOS ELECTRICAL CONTRACTORS, INC	2025-09-12 01:09:37.01	2025-09-12 01:09:37.01
cmfg53r2501v7ovbojh9sv9df	SOUTH BROWARD DRAINAGE DISTRICT	2025-09-12 01:09:37.085	2025-09-12 01:09:37.085
cmfg53r4501v8ovbo4vjaylcx	SOUTH EASTERN RECYCLING	2025-09-12 01:09:37.157	2025-09-12 01:09:37.157
cmfg53r6401v9ovbo67kbvgrc	SOUTH FLORIDA CONTAINER TERMINAL	2025-09-12 01:09:37.228	2025-09-12 01:09:37.228
cmfg53r8a01vaovbo5myfye6a	SOUTH FLORIDA CONTAINER TERMINAL-	2025-09-12 01:09:37.306	2025-09-12 01:09:37.306
cmfg53rae01vbovbo5plq6sm1	SOUTH FLORIDA FENCING	2025-09-12 01:09:37.382	2025-09-12 01:09:37.382
cmfg53rce01vcovbom2rqo5qb	SOUTH FLORIDA GRADING	2025-09-12 01:09:37.454	2025-09-12 01:09:37.454
cmfg53ree01vdovbo2k698xbb	SOUTH FLORIDA PROPERTY MANAGEMENT	2025-09-12 01:09:37.526	2025-09-12 01:09:37.526
cmfg53rge01veovboy5ywtpx5	SOUTH FLORIDA REGIONAL TRANSPORTATION	2025-09-12 01:09:37.598	2025-09-12 01:09:37.598
cmfg53rie01vfovboalis4e74	SOUTH FLORIDA WATER MANAGEMENT	2025-09-12 01:09:37.671	2025-09-12 01:09:37.671
cmfg53rke01vgovboeti7t349	SOUTH MIAMI SENIOR HIGH	2025-09-12 01:09:37.743	2025-09-12 01:09:37.743
cmfg53rmi01vhovbosfvu4tid	SOUTH PLANTATION HIGH	2025-09-12 01:09:37.818	2025-09-12 01:09:37.818
cmfg53roh01viovbo24fcbf8q	SOUTH SHORE LEASING	2025-09-12 01:09:37.89	2025-09-12 01:09:37.89
cmfg53rqh01vjovbot8dprayg	SOUTHEAST UNDERGROUND UTILITIES CORP.	2025-09-12 01:09:37.961	2025-09-12 01:09:37.961
cmfg53rsi01vkovboag5ttz8t	SOUTHEASTERN ENGINEERING	2025-09-12 01:09:38.034	2025-09-12 01:09:38.034
cmfg53ruk01vlovbo7rwajzxa	SOUTHEASTERN RECYCLING CORP.	2025-09-12 01:09:38.108	2025-09-12 01:09:38.108
cmfg53rwm01vmovboj2ye1kju	SOUTHERN ASPHALT ENGINEERING, INC	2025-09-12 01:09:38.183	2025-09-12 01:09:38.183
cmfg53s5901vnovbonhw7hgzj	SOUTHERN UNDERGROUND INDUSTRIES	2025-09-12 01:09:38.493	2025-09-12 01:09:38.493
cmfg53s7801voovbok2bl47xl	SOUTHLAND CONSTRUCTION, INC.	2025-09-12 01:09:38.564	2025-09-12 01:09:38.564
cmfg53s9c01vpovbomxg2oolt	SOUTHLAND HOLDINGS	2025-09-12 01:09:38.641	2025-09-12 01:09:38.641
cmfg53sbg01vqovbo0xcuxcsr	SOUTHSHORE COMMUNICATIONS	2025-09-12 01:09:38.717	2025-09-12 01:09:38.717
cmfg53sdp01vrovboa2t612fo	SOUTHWINDS TROPICS	2025-09-12 01:09:38.797	2025-09-12 01:09:38.797
cmfg53sfl01vsovbo4io1erlg	SPANISH BROADCASTING SYSTEM	2025-09-12 01:09:38.866	2025-09-12 01:09:38.866
cmfg53shl01vtovbol3lg159j	SPEARHEAD DEVELOPMENT GROUP, INC.	2025-09-12 01:09:38.937	2025-09-12 01:09:38.937
cmfg53sjq01vuovbog34gfgc5	SPM GROUP INC	2025-09-12 01:09:39.014	2025-09-12 01:09:39.014
cmfg53slu01vvovbo1211ft4j	SQUARE&COMPASS GENERAL CONTRACTORS, INC-	2025-09-12 01:09:39.09	2025-09-12 01:09:39.09
cmfg53snt01vwovboc2t36mzj	ST ANNES NURSING CENTER & RESIDENCE	2025-09-12 01:09:39.161	2025-09-12 01:09:39.161
cmfg53spw01vxovbo7gtnj8vf	ST BONAVENTURE CATHOLIC CHURCH	2025-09-12 01:09:39.237	2025-09-12 01:09:39.237
cmfg53srz01vyovboxwein99c	ST GEORGES LOGISTICS	2025-09-12 01:09:39.311	2025-09-12 01:09:39.311
cmfg53stz01vzovbo3zgsj7ln	ST THIMOTHY CHURCH	2025-09-12 01:09:39.383	2025-09-12 01:09:39.383
cmfg53sw201w0ovboh8acrl3h	STABIL CONCRETE PRODUCTS, LLC	2025-09-12 01:09:39.458	2025-09-12 01:09:39.458
cmfg53sy201w1ovboibkgwein	STANFORD CONSTRUCTION COMPANY	2025-09-12 01:09:39.53	2025-09-12 01:09:39.53
cmfg53t0601w2ovbo5thfx0qo	STANTEC	2025-09-12 01:09:39.606	2025-09-12 01:09:39.606
cmfg53t2601w3ovboqr6gnsqr	STAR BUILDERS OF SOUTH FLORIDA	2025-09-12 01:09:39.679	2025-09-12 01:09:39.679
cmfg53t4601w4ovbomtnq8xvv	STAR PAVING CORP	2025-09-12 01:09:39.75	2025-09-12 01:09:39.75
cmfg53t6f01w5ovbo377n26kc	STAR PAVING CORP:ZOO MIAMI- MISSION EVERGLADES	2025-09-12 01:09:39.831	2025-09-12 01:09:39.831
cmfg53t8e01w6ovbocvufdy7y	STATE CONTRACTING & ENGINEERING CORP.	2025-09-12 01:09:39.903	2025-09-12 01:09:39.903
cmfg53taf01w7ovboez323xyo	STATE FARM INSURANCE	2025-09-12 01:09:39.975	2025-09-12 01:09:39.975
cmfg53tcg01w8ovbo796skynt	STATE SITE DEVELOPMENT	2025-09-12 01:09:40.048	2025-09-12 01:09:40.048
cmfg53tej01w9ovboplvoc46k	STATE WIDE HOMES	2025-09-12 01:09:40.124	2025-09-12 01:09:40.124
cmfg53tgj01waovboyld5br8m	STATEWIDE ELECTRICAL SERVICES, INC	2025-09-12 01:09:40.195	2025-09-12 01:09:40.195
cmfg53tij01wbovbophjke5dy	STEEL & CONCRETE BUILDERS, INC.	2025-09-12 01:09:40.267	2025-09-12 01:09:40.267
cmfg53tkr01wcovboj6iea7jw	STEPHANIE	2025-09-12 01:09:40.348	2025-09-12 01:09:40.348
cmfg53tmv01wdovboit8nxqg2	STEPHEN ROSE	2025-09-12 01:09:40.424	2025-09-12 01:09:40.424
cmfg53tox01weovbo2hl3obtn	STEVEN BUSHA	2025-09-12 01:09:40.497	2025-09-12 01:09:40.497
cmfg53tr101wfovbo77cqfnqm	STEVENS CONSTRUCTION	2025-09-12 01:09:40.573	2025-09-12 01:09:40.573
cmfg53tt001wgovboz0w557vo	STILES	2025-09-12 01:09:40.644	2025-09-12 01:09:40.644
cmfg53tv101whovboviwgfff1	STILES CONSTRUCTION	2025-09-12 01:09:40.717	2025-09-12 01:09:40.717
cmfg53tx001wiovbo18z6q31b	STILES INVEST BUILD MANAGE	2025-09-12 01:09:40.788	2025-09-12 01:09:40.788
cmfg53tz201wjovboaerjup4t	STOBS BROS CONSTRUCTION CO.	2025-09-12 01:09:40.863	2025-09-12 01:09:40.863
cmfg53u1401wkovboso1xqqpp	STONE CONCEPT MIAMI INC	2025-09-12 01:09:40.937	2025-09-12 01:09:40.937
cmfg53u3501wlovbovn7jv5ap	STONE INTERNATIONAL	2025-09-12 01:09:41.009	2025-09-12 01:09:41.009
cmfg53u5501wmovbo625e6ag2	STONE SERVICES GROUP, INC	2025-09-12 01:09:41.081	2025-09-12 01:09:41.081
cmfg53u7d01wnovbo1r7i4asi	STONEHENGE CONSTRUCTION, LLC	2025-09-12 01:09:41.162	2025-09-12 01:09:41.162
cmfg53u9g01woovbo4zqd77dc	STONEHENGE CONSTRUCTION, LLC:CAMP MATACUMBE	2025-09-12 01:09:41.236	2025-09-12 01:09:41.236
cmfg53ubh01wpovbocu7uo078	STONEHENGE CONSTRUCTION, LLC:FRANJO PARK	2025-09-12 01:09:41.31	2025-09-12 01:09:41.31
cmfg53udv01wqovbosn0g0ho6	STONEHENGE CONSTRUCTION, LLC:SILVER BLUFF ELEM	2025-09-12 01:09:41.396	2025-09-12 01:09:41.396
cmfg53ufu01wrovbofkrx67cq	STONEHENGE CONSTRUCTION, LLC:SUNSET ELEMENTARY	2025-09-12 01:09:41.467	2025-09-12 01:09:41.467
cmfg53uhv01wsovbojwamj1lh	STONEHENGE CONSTRUCTION, LLC:T6511	2025-09-12 01:09:41.54	2025-09-12 01:09:41.54
cmfg53uk101wtovboxdhrka2o	STONEHENGE CONSTRUCTION, LLC:T6511 - SR 25/OKEECHOBEE RD	2025-09-12 01:09:41.617	2025-09-12 01:09:41.617
cmfg53um001wuovbog3mo8865	STRAIGHT AHEAD CONSTRUCTION, INC.	2025-09-12 01:09:41.688	2025-09-12 01:09:41.688
cmfg53uo001wvovboxt0jsvab	STRANO BROTHERS LTD	2025-09-12 01:09:41.761	2025-09-12 01:09:41.761
cmfg53uq401wwovboovjfiemy	STRATICON CONSTRUCTION SERVICES	2025-09-12 01:09:41.836	2025-09-12 01:09:41.836
cmfg53us801wxovbo5irnetk3	STRATICON CONSTRUCTION/ TIERRA	2025-09-12 01:09:41.912	2025-09-12 01:09:41.912
cmfg53uu801wyovbohhnq894h	STRATICON COSTRUCTION/MARINERS KEY	2025-09-12 01:09:41.984	2025-09-12 01:09:41.984
cmfg53uw801wzovbonf7jyqi8	STRIPING TECHNOLOGY CORP.	2025-09-12 01:09:42.057	2025-09-12 01:09:42.057
cmfg53uya01x0ovbo5b89xbdh	STRONG FENCE	2025-09-12 01:09:42.131	2025-09-12 01:09:42.131
cmfg53v0b01x1ovbo2l0jctq4	STRUCTURAL GROUP	2025-09-12 01:09:42.203	2025-09-12 01:09:42.203
cmfg53v2a01x2ovbod7zz4l3f	STRUCTURAL TECHNOLOGIES	2025-09-12 01:09:42.275	2025-09-12 01:09:42.275
cmfg53v4d01x3ovboql679y7i	STRUCTURE TECH CORP.	2025-09-12 01:09:42.35	2025-09-12 01:09:42.35
cmfg53v6f01x4ovbod7x3zkc2	SUFFOLK	2025-09-12 01:09:42.423	2025-09-12 01:09:42.423
cmfg53v9g01x5ovbor01lp8jp	SUFFOLK CONSTRUCTION	2025-09-12 01:09:42.498	2025-09-12 01:09:42.498
cmfg53vbh01x6ovbog2flldyv	SUMMIT PROPERTIES	2025-09-12 01:09:42.606	2025-09-12 01:09:42.606
cmfg53vdn01x7ovbokxhy7py6	SUMMITBUSINESS	2025-09-12 01:09:42.683	2025-09-12 01:09:42.683
cmfg53vfi01x8ovbo4gh0lzmj	SUN BELT GENERAL CONTRACTORS, INC	2025-09-12 01:09:42.751	2025-09-12 01:09:42.751
cmfg53vhi01x9ovbokok7n98l	SUN LOGISTICS	2025-09-12 01:09:42.822	2025-09-12 01:09:42.822
cmfg53vjr01xaovbo7givz54l	SUNBEAM	2025-09-12 01:09:42.904	2025-09-12 01:09:42.904
cmfg53vlv01xbovbo3j6r1rer	SUNNY FLORIDA DAIRY	2025-09-12 01:09:42.98	2025-09-12 01:09:42.98
cmfg53vnw01xcovbo8h69crxo	SUNSET HIGH SCHOOL	2025-09-12 01:09:43.053	2025-09-12 01:09:43.053
cmfg53vpw01xdovbooxnkvinb	SUNSHINE KITCHEN	2025-09-12 01:09:43.124	2025-09-12 01:09:43.124
cmfg53vse01xeovbo8ld6n8o6	SUNSHINE WATER CONTROL DISTRICT	2025-09-12 01:09:43.215	2025-09-12 01:09:43.215
cmfg53vug01xfovbowqfjvenn	SUPERIOR - DE MOYA JV	2025-09-12 01:09:43.289	2025-09-12 01:09:43.289
cmfg53vwk01xgovbo0ubqi52q	SUPERIOR CONSTRUCTION	2025-09-12 01:09:43.364	2025-09-12 01:09:43.364
cmfg53vyj01xhovbowj1wz2pd	SUPERIOR ELECTRICAL CONTRACTORS INC	2025-09-12 01:09:43.436	2025-09-12 01:09:43.436
cmfg53w0k01xiovboetr6ywzt	SUPERIOR FENCE	2025-09-12 01:09:43.509	2025-09-12 01:09:43.509
cmfg53w2k01xjovbonsj2za7t	SUPERIOR LANDSCAPE	2025-09-12 01:09:43.581	2025-09-12 01:09:43.581
cmfg53w4k01xkovbo1zmufd68	SUPERIOR LANDSCAPING & LAWN SERVICE, INC	2025-09-12 01:09:43.652	2025-09-12 01:09:43.652
cmfg53w6g01xlovboy0kz52oc	SURF CLUB APARTMENTS INC-	2025-09-12 01:09:43.72	2025-09-12 01:09:43.72
cmfg53w8f01xmovbofv6rpqx8	SURFCOMBER	2025-09-12 01:09:43.791	2025-09-12 01:09:43.791
cmfg53waf01xnovbo4j7r7pv3	SURREAL ENGINEERING	2025-09-12 01:09:43.864	2025-09-12 01:09:43.864
cmfg53wce01xoovbonwpn1krt	SUSAN B ANTHONY RECOVERY CENTER	2025-09-12 01:09:43.934	2025-09-12 01:09:43.934
cmfg53wef01xpovboreopvxbu	SVN SOUTH	2025-09-12 01:09:44.007	2025-09-12 01:09:44.007
cmfg53wgo01xqovbokr6mrk5z	SW 344 ST	2025-09-12 01:09:44.089	2025-09-12 01:09:44.089
cmfg53wiq01xrovbo80g8hpnw	SYNERGY EQUIPMENT-	2025-09-12 01:09:44.163	2025-09-12 01:09:44.163
cmfg53wkr01xsovbonzi5chjd	T & G CONSTRUCTIONS	2025-09-12 01:09:44.235	2025-09-12 01:09:44.235
cmfg53wmv01xtovbo8rmnyu0y	T. ROSCHE CONSULTING , INC.	2025-09-12 01:09:44.312	2025-09-12 01:09:44.312
cmfg53wov01xuovbom2g50k2z	T6575 PO	2025-09-12 01:09:44.384	2025-09-12 01:09:44.384
cmfg53wqw01xvovbop11bbqhs	TACONIC BUILDERS	2025-09-12 01:09:44.457	2025-09-12 01:09:44.457
cmfg53wsv01xwovbocjuoxy9c	TAHOE GROUP	2025-09-12 01:09:44.528	2025-09-12 01:09:44.528
cmfg53wv001xxovborcp9rq59	TARCO PROPERTIES	2025-09-12 01:09:44.605	2025-09-12 01:09:44.605
cmfg53www01xyovboyk43ls4c	TATCO	2025-09-12 01:09:44.672	2025-09-12 01:09:44.672
cmfg53wz901xzovbo4b5eefjl	TATIANA@ALBERT LEON	2025-09-12 01:09:44.757	2025-09-12 01:09:44.757
cmfg53x1901y0ovbon38y830t	TAUBER ACADEMY	2025-09-12 01:09:44.829	2025-09-12 01:09:44.829
cmfg53x3i01y1ovbol90tyyd0	Taylor Mades Construction	2025-09-12 01:09:44.911	2025-09-12 01:09:44.911
cmfg53x5i01y2ovbo8z4ay3qf	TECH AIR	2025-09-12 01:09:44.983	2025-09-12 01:09:44.983
cmfg53x7h01y3ovbov3v6vgnf	TECH DATA	2025-09-12 01:09:45.053	2025-09-12 01:09:45.053
cmfg53x9h01y4ovbo88fvpzom	TECHNO SERVICES, INC./TSI LAVAJET	2025-09-12 01:09:45.126	2025-09-12 01:09:45.126
cmfg53xbh01y5ovbo4pvux1f8	TELUSA	2025-09-12 01:09:45.197	2025-09-12 01:09:45.197
cmfg53xdi01y6ovboq5ahatwm	TEMPO	2025-09-12 01:09:45.271	2025-09-12 01:09:45.271
cmfg53xfi01y7ovbo7fihb2np	TENZER REALTY	2025-09-12 01:09:45.343	2025-09-12 01:09:45.343
cmfg53xhh01y8ovboxf393xy9	TERA LAKES	2025-09-12 01:09:45.414	2025-09-12 01:09:45.414
cmfg53xjg01y9ovbodn3vo056	TERRA A CON DORAL PALMS, LLC	2025-09-12 01:09:45.485	2025-09-12 01:09:45.485
cmfg53xlh01yaovbon6jnvfgk	TERRA GROUP	2025-09-12 01:09:45.557	2025-09-12 01:09:45.557
cmfg53xng01ybovboyy7ydmbv	TERRA GROUP:VINTAGE	2025-09-12 01:09:45.629	2025-09-12 01:09:45.629
cmfg53xph01ycovbo33gqomap	Terra Hyle Contractors	2025-09-12 01:09:45.701	2025-09-12 01:09:45.701
cmfg53xrg01ydovbolng12n2l	TERRA LAKES VILLAS CONDO	2025-09-12 01:09:45.773	2025-09-12 01:09:45.773
cmfg53xth01yeovbovob9qypp	TERRACON CONSTRUCTION	2025-09-12 01:09:45.845	2025-09-12 01:09:45.845
cmfg53xvh01yfovbo7numhbsa	TERRACON CONSTRUCTION:Blackwater Boats PO 2250	2025-09-12 01:09:45.917	2025-09-12 01:09:45.917
cmfg53xxh01ygovbojmx33jas	TERRACON CONSTRUCTION:FLORDA SUPPLEMENT	2025-09-12 01:09:45.989	2025-09-12 01:09:45.989
cmfg53xzh01yhovbolh0dl1sx	TERRACON CONSTRUCTION:FLORIDA SUPPLEMENT	2025-09-12 01:09:46.061	2025-09-12 01:09:46.061
cmfg53y1g01yiovbodqjhi0mu	TERRACON CONSTRUCTION:Job 1	2025-09-12 01:09:46.133	2025-09-12 01:09:46.133
cmfg53y3f01yjovbo7yg77awl	TERRACON CONSTRUCTION:MCC BLDG #2	2025-09-12 01:09:46.204	2025-09-12 01:09:46.204
cmfg53y5f01ykovbomdebpryr	TERRACON CONSTRUCTION:PO# 24-44	2025-09-12 01:09:46.276	2025-09-12 01:09:46.276
cmfg53y7g01ylovboixn2lotm	TERRACON CONSTRUCTION:PO#13-30	2025-09-12 01:09:46.348	2025-09-12 01:09:46.348
cmfg53y9f01ymovboahpaminp	TERRACON CONSTRUCTION:Royal Palm Suite 200 PO 2431	2025-09-12 01:09:46.42	2025-09-12 01:09:46.42
cmfg53ybh01ynovboiv48v970	TERRACON CONSTRUCTION:SENTURY TIRE	2025-09-12 01:09:46.493	2025-09-12 01:09:46.493
cmfg53ydi01yoovborr62bk2a	TERRACON CONSTRUCTION:WALTON & POST	2025-09-12 01:09:46.566	2025-09-12 01:09:46.566
cmfg53yfs01ypovbo70qlo1x8	TERRACON CONSULTANS, INC	2025-09-12 01:09:46.648	2025-09-12 01:09:46.648
cmfg53yhr01yqovbo05jz5lcj	TEXAS AQUATIC	2025-09-12 01:09:46.72	2025-09-12 01:09:46.72
cmfg53yjv01yrovbotxhdxvq4	TGSV	2025-09-12 01:09:46.795	2025-09-12 01:09:46.795
cmfg53ylu01ysovbo24r9qgux	THALLE CONSTRUCTION COMPANY	2025-09-12 01:09:46.867	2025-09-12 01:09:46.867
cmfg53ynu01ytovbo2nolxc3n	THE BERMAN GROUP	2025-09-12 01:09:46.939	2025-09-12 01:09:46.939
cmfg53ypu01yuovbowod57qtc	THE APOLLO COMPANIES	2025-09-12 01:09:47.011	2025-09-12 01:09:47.011
cmfg53yrw01yvovboqeo70vz1	THE BOTANICAL GARDENS AT KONA KAI RESORT	2025-09-12 01:09:47.084	2025-09-12 01:09:47.084
cmfg53ytz01ywovbohet2c95x	THE CGC GROUP AND MEDIA STRUCTURES, LLC	2025-09-12 01:09:47.16	2025-09-12 01:09:47.16
cmfg53yw801yxovbowxgbpudd	THE CLEMENT GROUP, LLC	2025-09-12 01:09:47.24	2025-09-12 01:09:47.24
cmfg53yye01yyovboqfo719v8	THE COMMUNITY DEVELOPMENT DISTRICT	2025-09-12 01:09:47.318	2025-09-12 01:09:47.318
cmfg53z0f01yzovboeei1qaxd	THE COMRAS COMPANY	2025-09-12 01:09:47.391	2025-09-12 01:09:47.391
cmfg53z2i01z0ovbo65x7tn4h	THE CONLAN COMPANY	2025-09-12 01:09:47.467	2025-09-12 01:09:47.467
cmfg53z4m01z1ovbowjn26s5f	THE CONLAN COMPANY:Amazon - DMF1	2025-09-12 01:09:47.542	2025-09-12 01:09:47.542
cmfg53z6l01z2ovbo6r7e3zp8	THE CONLAN COMPANY:DMI 2	2025-09-12 01:09:47.614	2025-09-12 01:09:47.614
cmfg53z8l01z3ovbof81bvaw5	THE CONLAN COMPANY:DMI2 - 15600 NW 15 AVE	2025-09-12 01:09:47.686	2025-09-12 01:09:47.686
cmfg53zap01z4ovbokmosrm1v	THE CONLAN COMPANY:MDC/MDO	2025-09-12 01:09:47.761	2025-09-12 01:09:47.761
cmfg53zcq01z5ovbop6vwqbn3	THE CROSSINGS HOME OWNERS	2025-09-12 01:09:47.834	2025-09-12 01:09:47.834
cmfg53zeq01z6ovboqf95qds8	THE DE MOYA GROUP	2025-09-12 01:09:47.906	2025-09-12 01:09:47.906
cmfg53zgq01z7ovbo6wvm40nj	THE DE MOYA GROUP, INC	2025-09-12 01:09:47.979	2025-09-12 01:09:47.979
cmfg53zit01z8ovbotwjgi4tu	THE ESTATE COMPANIES	2025-09-12 01:09:48.054	2025-09-12 01:09:48.054
cmfg53zkt01z9ovboq5jhcoq8	THE ESTATE COMPANIES-	2025-09-12 01:09:48.125	2025-09-12 01:09:48.125
cmfg53zms01zaovbombwcfdl7	THE FOSTER	2025-09-12 01:09:48.197	2025-09-12 01:09:48.197
cmfg53zot01zbovbo73nfp4y0	THE FOSTER COMPANY	2025-09-12 01:09:48.27	2025-09-12 01:09:48.27
cmfg53zqy01zcovbo4cf2wbhp	THE FOUNTAINS	2025-09-12 01:09:48.346	2025-09-12 01:09:48.346
cmfg53zsx01zdovbomm9w3zk4	THE GARDEN R US NURSERY CORP.	2025-09-12 01:09:48.418	2025-09-12 01:09:48.418
cmfg53zux01zeovbozdpmuoxs	THE GENERATOR SUPERSTORE	2025-09-12 01:09:48.489	2025-09-12 01:09:48.489
cmfg53zwx01zfovboh25r6yx9	THE GEO GROUP INC	2025-09-12 01:09:48.562	2025-09-12 01:09:48.562
cmfg53zyy01zgovbo9ijwwp87	THE GEO GROUP INC:BROWARD TRANC CENTER SECURITY UPGRADES	2025-09-12 01:09:48.634	2025-09-12 01:09:48.634
cmfg5400x01zhovbo7c45g6ce	THE GORMAN GROUP	2025-09-12 01:09:48.706	2025-09-12 01:09:48.706
cmfg5402x01ziovboxc45gk1x	THE GREATER MIAMI SERVICE CORPS	2025-09-12 01:09:48.778	2025-09-12 01:09:48.778
cmfg5404x01zjovbo6vpv7scw	THE HATCH GROUP	2025-09-12 01:09:48.85	2025-09-12 01:09:48.85
cmfg5407201zkovbo0mcunrey	THE HEAT GROUP	2025-09-12 01:09:48.926	2025-09-12 01:09:48.926
cmfg5409601zlovbo96zxmptd	THE INSTITUTE FOR CHILD & FAMILY HEALTH	2025-09-12 01:09:49.003	2025-09-12 01:09:49.003
cmfg540bb01zmovbou5krhapo	THE LANDINGS OF LARGO	2025-09-12 01:09:49.079	2025-09-12 01:09:49.079
cmfg540db01znovbogr810jfr	THE LIDO APTS.	2025-09-12 01:09:49.151	2025-09-12 01:09:49.151
cmfg540fd01zoovbo45tia9eq	THE LOWELL DUNN COMP.	2025-09-12 01:09:49.226	2025-09-12 01:09:49.226
cmfg540he01zpovbomfilk9uf	THE MARINA CLUB	2025-09-12 01:09:49.298	2025-09-12 01:09:49.298
cmfg540je01zqovbo4g2uloyo	THE NORMA CONDOS ASOCIATION	2025-09-12 01:09:49.371	2025-09-12 01:09:49.371
cmfg540lg01zrovboatmr03p5	THE O'CONNEL COMPANIES	2025-09-12 01:09:49.445	2025-09-12 01:09:49.445
cmfg540nj01zsovbod535jlt9	THE PALACE AT WESTON	2025-09-12 01:09:49.52	2025-09-12 01:09:49.52
cmfg540po01ztovbo0jg2thy4	THE POOL SPA BILLARD STORE	2025-09-12 01:09:49.597	2025-09-12 01:09:49.597
cmfg540rr01zuovbozpsbb8f1	THE REDLAND COMPANY	2025-09-12 01:09:49.672	2025-09-12 01:09:49.672
cmfg540tr01zvovbo9bj2q0e7	THE REDLAND COMPANY INC.	2025-09-12 01:09:49.744	2025-09-12 01:09:49.744
cmfg540vu01zwovbo13wbqrdp	THE REDLAND COMPANY:MEDLEY SITE	2025-09-12 01:09:49.818	2025-09-12 01:09:49.818
cmfg540xw01zxovborbpvkilf	THE REGENT BAL HARBOUR	2025-09-12 01:09:49.892	2025-09-12 01:09:49.892
cmfg5410001zyovboal330ssn	THE RELATED GROUP	2025-09-12 01:09:49.969	2025-09-12 01:09:49.969
cmfg5412101zzovbor29z0cui	THE STOUT GROUP, LLC	2025-09-12 01:09:50.041	2025-09-12 01:09:50.041
cmfg541410200ovboee6f8kgl	THE STOUT GROUP, LLC -	2025-09-12 01:09:50.113	2025-09-12 01:09:50.113
cmfg541620201ovbosjuajlvy	THE STOUT GROUP, LLC .	2025-09-12 01:09:50.187	2025-09-12 01:09:50.187
cmfg541850202ovbo58serkaf	THE TOWER GROUP	2025-09-12 01:09:50.261	2025-09-12 01:09:50.261
cmfg541a50203ovbo47mua1nc	THE TOWN OF SURFSIDE	2025-09-12 01:09:50.333	2025-09-12 01:09:50.333
cmfg541c50204ovboclf8ckvq	THE VILLAGE OF NORTH PALM BEACH	2025-09-12 01:09:50.405	2025-09-12 01:09:50.405
cmfg541e80205ovbo68wbc3yz	THOMAS QUIGLEY	2025-09-12 01:09:50.481	2025-09-12 01:09:50.481
cmfg541ga0206ovbo0y3x24w0	THORNTON CONSTRUCTION	2025-09-12 01:09:50.554	2025-09-12 01:09:50.554
cmfg541i90207ovbown4zes44	THORNTON CONSTRUCTION COMP.	2025-09-12 01:09:50.625	2025-09-12 01:09:50.625
cmfg541ka0208ovbomwm3iixq	THORNTON CONSTRUCTION COMP.:Strananhan	2025-09-12 01:09:50.698	2025-09-12 01:09:50.698
cmfg541m90209ovbohhr5i6t6	THREECORE	2025-09-12 01:09:50.769	2025-09-12 01:09:50.769
cmfg541o8020aovboh8b3vb18	THUNDER DEMOLITION INC	2025-09-12 01:09:50.841	2025-09-12 01:09:50.841
cmfg541q7020bovborp9ep0f4	TIL 3601 OWNER LLC-	2025-09-12 01:09:50.912	2025-09-12 01:09:50.912
cmfg541s8020covboqfq9ol9m	TIMUR	2025-09-12 01:09:50.984	2025-09-12 01:09:50.984
cmfg541u9020dovboiqzpb9qw	TITAN INTERIORS	2025-09-12 01:09:51.057	2025-09-12 01:09:51.057
cmfg541w9020eovbozabkkr15	TITAN LUMBER	2025-09-12 01:09:51.129	2025-09-12 01:09:51.129
cmfg541y8020fovbonkoz0kao	TITO VASQUEZ	2025-09-12 01:09:51.2	2025-09-12 01:09:51.2
cmfg54207020govboi4vytox5	TM RESIDENTIAL, LLC	2025-09-12 01:09:51.271	2025-09-12 01:09:51.271
cmfg54227020hovbov99ki5zg	TNXL MIAMI	2025-09-12 01:09:51.343	2025-09-12 01:09:51.343
cmfg54247020iovbo684jzzlj	TOM BRADY	2025-09-12 01:09:51.415	2025-09-12 01:09:51.415
cmfg54277020jovbou65sqso0	TOM ROSCHE	2025-09-12 01:09:51.523	2025-09-12 01:09:51.523
cmfg54298020kovboz70d8ewt	TOM WEEKS	2025-09-12 01:09:51.596	2025-09-12 01:09:51.596
cmfg542ba020lovbogprr47i6	TOMAS GOICOURIA	2025-09-12 01:09:51.67	2025-09-12 01:09:51.67
cmfg542dd020movbok6ckudon	TONY	2025-09-12 01:09:51.746	2025-09-12 01:09:51.746
cmfg542fi020novboe1atk25g	TOOLE CORP.	2025-09-12 01:09:51.823	2025-09-12 01:09:51.823
cmfg542hi020oovboeyx0nosj	TOP NOTCH - GENERAL CONTRACTORS	2025-09-12 01:09:51.894	2025-09-12 01:09:51.894
cmfg542ji020povbomt4h11mz	TORRE CONSTRUCTION	2025-09-12 01:09:51.966	2025-09-12 01:09:51.966
cmfg542lj020qovbob4d0r3ac	TOTAL SAFETY	2025-09-12 01:09:52.039	2025-09-12 01:09:52.039
cmfg542nn020rovboi5wg99ro	TOUCHSTONE EVENT MANAGEMENT	2025-09-12 01:09:52.115	2025-09-12 01:09:52.115
cmfg542pn020sovbo3pbvmi7p	TOWER BUILDERS, INC.	2025-09-12 01:09:52.187	2025-09-12 01:09:52.187
cmfg542rq020tovbo83ypvqcm	TOWER COMMUNICATIONS	2025-09-12 01:09:52.262	2025-09-12 01:09:52.262
cmfg542tq020uovborz9vo50b	TOWER GROUP	2025-09-12 01:09:52.334	2025-09-12 01:09:52.334
cmfg542vq020vovbo2x1p8u34	TOWER MANAGEMENT SERVICES, INC.	2025-09-12 01:09:52.406	2025-09-12 01:09:52.406
cmfg542y2020wovboskjlvj0u	TOWER MRL, INC	2025-09-12 01:09:52.49	2025-09-12 01:09:52.49
cmfg54302020xovbo7wnn3zgh	TOWN OF MEDLEY	2025-09-12 01:09:52.563	2025-09-12 01:09:52.563
cmfg54322020yovboo5764u15	TOWN OF MIAMI LAKES	2025-09-12 01:09:52.634	2025-09-12 01:09:52.634
cmfg54342020zovbol9tpajsn	TRADEWINDS POWER CORP.	2025-09-12 01:09:52.707	2025-09-12 01:09:52.707
cmfg543620210ovboooxflcva	TRAFFIC MANAGEMENT SOLOUTIONS, INC	2025-09-12 01:09:52.778	2025-09-12 01:09:52.778
cmfg543810211ovboshrvqe0r	TRAFFIC MANAGEMENT SOLOUTIONS, INC:E8U74	2025-09-12 01:09:52.849	2025-09-12 01:09:52.849
cmfg543a10212ovbob7b0yhvf	TRAN CONSTRUCTION	2025-09-12 01:09:52.921	2025-09-12 01:09:52.921
cmfg543c00213ovbo400bh0jx	TRANS FLORIDA DEVELOPMENT	2025-09-12 01:09:52.993	2025-09-12 01:09:52.993
cmfg543e70214ovbobb96ivs6	TRANSFIELD SERVICES	2025-09-12 01:09:53.071	2025-09-12 01:09:53.071
cmfg543g60215ovbovfrhdo1p	TRANSGROUP GLOBAL LOGISTICS	2025-09-12 01:09:53.143	2025-09-12 01:09:53.143
cmfg543if0216ovbouevdvc34	TRE LEONI	2025-09-12 01:09:53.224	2025-09-12 01:09:53.224
cmfg543ke0217ovbo9nyk8wfn	TRI-COUNTY DEMOLITION & CONSTRUCTION, LLC	2025-09-12 01:09:53.294	2025-09-12 01:09:53.294
cmfg543me0218ovbo8i2eim7s	TRI -C CONSTRUCTION	2025-09-12 01:09:53.366	2025-09-12 01:09:53.366
cmfg543oe0219ovbog7yeariz	TRI TECH CONSTRUCTION	2025-09-12 01:09:53.438	2025-09-12 01:09:53.438
cmfg543qe021aovbohk45o8m2	TRIDENT TRUCKING	2025-09-12 01:09:53.51	2025-09-12 01:09:53.51
cmfg543se021bovboz2s9n6f7	TRIDENT TRUCKING:LAGUNA CIRCLE	2025-09-12 01:09:53.582	2025-09-12 01:09:53.582
cmfg543ud021covbocrpv9x65	TRINTEC CONSTRUCTION	2025-09-12 01:09:53.654	2025-09-12 01:09:53.654
cmfg543we021dovborp3ff5r2	TRISH HALLIDAY	2025-09-12 01:09:53.726	2025-09-12 01:09:53.726
cmfg543ye021eovbokf0zafuk	TROPIC LANDSCAPING	2025-09-12 01:09:53.798	2025-09-12 01:09:53.798
cmfg5440e021fovbolosrriyp	TROPICAL SHIPPING	2025-09-12 01:09:53.871	2025-09-12 01:09:53.871
cmfg5442e021govbokgbbk7u3	TROPICAL TRAILER-	2025-09-12 01:09:53.942	2025-09-12 01:09:53.942
cmfg5444j021hovbotsf2tyre	TRUCK MAX-	2025-09-12 01:09:54.019	2025-09-12 01:09:54.019
cmfg5446q021iovbot58ul6pq	TRUE CORE BEHAVIORAL	2025-09-12 01:09:54.098	2025-09-12 01:09:54.098
cmfg5448q021jovboiuhcszi3	TRUJILLO & SONS INC.	2025-09-12 01:09:54.171	2025-09-12 01:09:54.171
cmfg544as021kovbo6flretgo	TRUSSCORP INTERNATIONAL INC	2025-09-12 01:09:54.244	2025-09-12 01:09:54.244
cmfg544cr021lovbofypru9k5	TRUST MANAGEMENT SERVICES GROUP	2025-09-12 01:09:54.315	2025-09-12 01:09:54.315
cmfg544en021movbocis7pcwm	TRW CONTRACTING INC.	2025-09-12 01:09:54.383	2025-09-12 01:09:54.383
cmfg544gp021novbowa3hwhkb	TSI LAVAJET CORP	2025-09-12 01:09:54.457	2025-09-12 01:09:54.457
cmfg544ip021oovboqhr16a0h	TUNERS MOTORSPORT	2025-09-12 01:09:54.529	2025-09-12 01:09:54.529
cmfg544ko021povbo948j17s9	TURGO	2025-09-12 01:09:54.6	2025-09-12 01:09:54.6
cmfg544mn021qovboc224ifqa	TURNBERRY ASSOCIATES	2025-09-12 01:09:54.672	2025-09-12 01:09:54.672
cmfg544oo021rovboli7v40uk	TURNBERRY ASSOCIATES:MASTER ASSOCIATION 011	2025-09-12 01:09:54.744	2025-09-12 01:09:54.744
cmfg544qs021sovbo5c8fvytp	TURNBERRY ASSOCIATES:SOLE MIA - PARKING GARAGE AT RENTAL TOWER	2025-09-12 01:09:54.82	2025-09-12 01:09:54.82
cmfg544st021tovbogns9zdee	TURNBERRY ASSOCIATES:SOLE MIA CONTRACT /075	2025-09-12 01:09:54.893	2025-09-12 01:09:54.893
cmfg544ut021uovbodh54gnz7	TURNBERRY ASSOCIATES:SOLE MIA CONTRACT WORK/075	2025-09-12 01:09:54.965	2025-09-12 01:09:54.965
cmfg544wx021vovbo6pl5cokr	TURNBERRY ASSOCIATES:SOLE MIA TOTAL MASS/035	2025-09-12 01:09:55.041	2025-09-12 01:09:55.041
cmfg544z9021wovbo2coipcbw	TURNBERRY CONST. / FOUNTAINBLEAU	2025-09-12 01:09:55.126	2025-09-12 01:09:55.126
cmfg5451e021xovbo2asec9mc	TURNBERRY CONSTRUCTION	2025-09-12 01:09:55.202	2025-09-12 01:09:55.202
cmfg5453g021yovbot1dod6nj	TURNER CONSTRUCTION	2025-09-12 01:09:55.277	2025-09-12 01:09:55.277
cmfg5455h021zovbod9fzzg9q	TUTOR PERINI BUILDING CORP.	2025-09-12 01:09:55.349	2025-09-12 01:09:55.349
cmfg5457o0220ovbohax89r3o	TVM	2025-09-12 01:09:55.428	2025-09-12 01:09:55.428
cmfg5459p0221ovbos3xggbjf	TXS EARTH MOVERS, INC	2025-09-12 01:09:55.501	2025-09-12 01:09:55.501
cmfg545bq0222ovbood279tkf	U.S. AMERICA TILE	2025-09-12 01:09:55.574	2025-09-12 01:09:55.574
cmfg545dq0223ovbotxtoiqvk	U.S. CUSTOMS & BORDER PROTECTION	2025-09-12 01:09:55.646	2025-09-12 01:09:55.646
cmfg545ft0224ovbonbq9s380	U.S. WRECKING DEMOLITION CORP.	2025-09-12 01:09:55.721	2025-09-12 01:09:55.721
cmfg545hs0225ovbodepe5sjt	UAG CONSTRUCTION	2025-09-12 01:09:55.792	2025-09-12 01:09:55.792
cmfg545jt0226ovborxroqskx	UNDERPOWER CORP	2025-09-12 01:09:55.865	2025-09-12 01:09:55.865
cmfg545lt0227ovbo18n27p4d	UNDERPOWER CORP:E6M02 - SR 916	2025-09-12 01:09:55.937	2025-09-12 01:09:55.937
cmfg545nx0228ovbo0s95qn3g	UNICAPITAL ASSET MANAGEMENT GROUP	2025-09-12 01:09:56.014	2025-09-12 01:09:56.014
cmfg545py0229ovboh9xiawgx	UNITE PROPERTY MANAGEMENT	2025-09-12 01:09:56.086	2025-09-12 01:09:56.086
cmfg545rx022aovbo82hvw1r5	UNITECH AIR CO	2025-09-12 01:09:56.158	2025-09-12 01:09:56.158
cmfg545tx022bovbodt7e5hag	UNITECH BUILDERS	2025-09-12 01:09:56.229	2025-09-12 01:09:56.229
cmfg545vx022covbovgi3ovm7	UNITED AUTOMBILE INSURANCE COMPANY	2025-09-12 01:09:56.301	2025-09-12 01:09:56.301
cmfg545xx022dovboaopfgoro	UNITED COMMUNITY	2025-09-12 01:09:56.374	2025-09-12 01:09:56.374
cmfg545zz022eovbo07qenuj7	UNITED FORMING	2025-09-12 01:09:56.447	2025-09-12 01:09:56.447
cmfg54621022fovbohy25qjjx	UNITED RENTALS*	2025-09-12 01:09:56.522	2025-09-12 01:09:56.522
cmfg54641022govbo6nmacmd1	UNITED STATES POSTAL SERVICE	2025-09-12 01:09:56.594	2025-09-12 01:09:56.594
cmfg54662022hovbo80d8zgqx	UNITY WINDOWS & DOORS	2025-09-12 01:09:56.666	2025-09-12 01:09:56.666
cmfg54682022iovborbzsd9j5	UNLIMITED BEDDING SUPPLIES	2025-09-12 01:09:56.738	2025-09-12 01:09:56.738
cmfg546a2022jovbo0u0xd5ux	URBAN 4 DEVELOPMENT CORPORATION	2025-09-12 01:09:56.81	2025-09-12 01:09:56.81
cmfg546c5022kovbo7cgtic5l	URBAN RESOURCE	2025-09-12 01:09:56.885	2025-09-12 01:09:56.885
cmfg546e4022lovboshr3j079	URBANEA MANAGEMENT GROUP.	2025-09-12 01:09:56.957	2025-09-12 01:09:56.957
cmfg546g5022movbopfxsxxad	US ALLIANCE CARGO	2025-09-12 01:09:57.029	2025-09-12 01:09:57.029
cmfg546i4022novbo7f7ojob7	US DEPTARTMENT OF HOMELAND SECURITY	2025-09-12 01:09:57.1	2025-09-12 01:09:57.1
cmfg546k8022oovbo9pjr8fn6	US SOUTH UNDERGROUND UTILITY & PAVING	2025-09-12 01:09:57.177	2025-09-12 01:09:57.177
cmfg546m9022povbogfz1fjkq	USA CONTINENTAL	2025-09-12 01:09:57.25	2025-09-12 01:09:57.25
cmfg546o4022qovboke5vev21	USA TAXI	2025-09-12 01:09:57.316	2025-09-12 01:09:57.316
cmfg546q6022rovbo182b4txs	V C FUELS	2025-09-12 01:09:57.39	2025-09-12 01:09:57.39
cmfg546s5022sovbozob8lk4s	V DOWNTOWN	2025-09-12 01:09:57.462	2025-09-12 01:09:57.462
cmfg546v6022tovboiidh725y	V ENGINEERING AND CONSULTING CORP	2025-09-12 01:09:57.536	2025-09-12 01:09:57.536
cmfg546x6022uovbovkk1mydr	VALLEY CREST	2025-09-12 01:09:57.643	2025-09-12 01:09:57.643
cmfg546z2022vovboou3uei9d	VANGUARD CIVIL ENGINEERING	2025-09-12 01:09:57.71	2025-09-12 01:09:57.71
cmfg5470y022wovbox8toytsb	VANGUARD LOGISTICS SERVICES	2025-09-12 01:09:57.779	2025-09-12 01:09:57.779
cmfg5472y022xovbotf77wbjc	Various Customers	2025-09-12 01:09:57.85	2025-09-12 01:09:57.85
cmfg54757022yovbo3asozkcn	VBC	2025-09-12 01:09:57.932	2025-09-12 01:09:57.932
cmfg5477b022zovbod2o4iz1n	VCA SOUTH DADE ANIMAL HOSPITAL	2025-09-12 01:09:58.007	2025-09-12 01:09:58.007
cmfg5479f0230ovbogr71664p	VEHICLEMAX.NET	2025-09-12 01:09:58.084	2025-09-12 01:09:58.084
cmfg547bi0231ovbov2qe24ys	VELOCITY EXPRESS	2025-09-12 01:09:58.158	2025-09-12 01:09:58.158
cmfg547dh0232ovbotq72vq32	VENEVISION STUDIOS	2025-09-12 01:09:58.229	2025-09-12 01:09:58.229
cmfg547fh0233ovbo9wof2sa7	VERCETTI ENTERPRISES	2025-09-12 01:09:58.302	2025-09-12 01:09:58.302
cmfg547ht0234ovbotk6vqjkj	VERDEX CONSTRUCTION	2025-09-12 01:09:58.385	2025-09-12 01:09:58.385
cmfg547jt0235ovboxugoqxms	VERMEER SOUTHEAST	2025-09-12 01:09:58.458	2025-09-12 01:09:58.458
cmfg547lt0236ovboa6chzmet	VERTEX CONSTRUCTION	2025-09-12 01:09:58.529	2025-09-12 01:09:58.529
cmfg547oe0237ovboud0b94p4	VERTICAL MANAGEMENT, LLC	2025-09-12 01:09:58.623	2025-09-12 01:09:58.623
cmfg547qe0238ovbo4ahzwzj0	VFW E DEPARTMENT OF FLORIDA	2025-09-12 01:09:58.695	2025-09-12 01:09:58.695
cmfg547se0239ovbo0xrwub8u	VG Construction	2025-09-12 01:09:58.766	2025-09-12 01:09:58.766
cmfg547ue023aovbo5d4q2i5q	VIA MANAGEMENT	2025-09-12 01:09:58.839	2025-09-12 01:09:58.839
cmfg547we023bovbozelddh37	VICIEDO INC	2025-09-12 01:09:58.911	2025-09-12 01:09:58.911
cmfg547ye023covbo9dkqcyto	VICTOR M. WELDING CORP.	2025-09-12 01:09:58.983	2025-09-12 01:09:58.983
cmfg5480i023dovboja5wtg85	VICTOR MARIN	2025-09-12 01:09:59.059	2025-09-12 01:09:59.059
cmfg5482j023eovboh54ar4hu	VICTORY CONSTRUCTION GROUP INC	2025-09-12 01:09:59.132	2025-09-12 01:09:59.132
cmfg5484i023fovboikpi1w3s	VICTORY UNLIMITED CONSTRUCTION ,LLC	2025-09-12 01:09:59.203	2025-09-12 01:09:59.203
cmfg5486f023govbok4njk9kc	VILAR - HOYNACK CONSTRUCTION	2025-09-12 01:09:59.271	2025-09-12 01:09:59.271
cmfg5488j023hovboaz1fi2qh	VILLA BAY VISTA	2025-09-12 01:09:59.348	2025-09-12 01:09:59.348
cmfg548an023iovborejes8tn	VILLAGE OF BAL HARBOUR	2025-09-12 01:09:59.424	2025-09-12 01:09:59.424
cmfg548co023jovbouhiyfmeh	VILLAGE OF KEY BISCAYNE	2025-09-12 01:09:59.497	2025-09-12 01:09:59.497
cmfg548ep023kovbo1tmxkpph	VILLAGE OF PALM BAY	2025-09-12 01:09:59.569	2025-09-12 01:09:59.569
cmfg548go023lovbo7zpz87ns	VILLAGE OF PAM BAY	2025-09-12 01:09:59.641	2025-09-12 01:09:59.641
cmfg548ij023movboi4ve4xhy	VILLAGE OF PINECREST	2025-09-12 01:09:59.708	2025-09-12 01:09:59.708
cmfg548ky023novbonlutni1y	VINTAGE ESTATES	2025-09-12 01:09:59.794	2025-09-12 01:09:59.794
cmfg548mx023oovboxglidipk	VIRGNIA FERGUSON	2025-09-12 01:09:59.866	2025-09-12 01:09:59.866
cmfg548ox023povbo4qeeg74u	VITAL PHARMACEUTICAL	2025-09-12 01:09:59.938	2025-09-12 01:09:59.938
cmfg548qy023qovboa1g6xcuu	VIVIAN	2025-09-12 01:10:00.011	2025-09-12 01:10:00.011
cmfg548t1023rovbo42ljg6e8	VOS ENGINEERING	2025-09-12 01:10:00.085	2025-09-12 01:10:00.085
cmfg548uw023sovboleoogoa5	VPR CONSTRUCTION	2025-09-12 01:10:00.153	2025-09-12 01:10:00.153
cmfg548x0023tovboefcoqp9l	VSRE	2025-09-12 01:10:00.229	2025-09-12 01:10:00.229
cmfg548yt023uovbo1duj8q68	VTMI	2025-09-12 01:10:00.293	2025-09-12 01:10:00.293
cmfg54911023vovbodx2v1o6u	VULCAN MATERIALS COMPANY	2025-09-12 01:10:00.373	2025-09-12 01:10:00.373
cmfg5492w023wovbomxbrl2uy	WAGS MANAGEMENT INC.	2025-09-12 01:10:00.441	2025-09-12 01:10:00.441
cmfg54950023xovboec8y4g8v	WALMART STORES EAST LP	2025-09-12 01:10:00.517	2025-09-12 01:10:00.517
cmfg54970023yovbodhcnwqj5	WALSH GROUP NATIONAL BUILDING GROUP	2025-09-12 01:10:00.589	2025-09-12 01:10:00.589
cmfg54991023zovbo1fxuln71	WALTER MCNULTY	2025-09-12 01:10:00.662	2025-09-12 01:10:00.662
cmfg549b00240ovboll2vi7kx	WALTON AND POST	2025-09-12 01:10:00.733	2025-09-12 01:10:00.733
cmfg549d00241ovbonda6ug4a	WARREN HENRY AUTO	2025-09-12 01:10:00.805	2025-09-12 01:10:00.805
cmfg549ev0242ovbox4pddito	WASHINGTON GROUP INTERNATIONAL	2025-09-12 01:10:00.872	2025-09-12 01:10:00.872
cmfg549gr0243ovboqhai8cm6	WATERSIDE APTARTMENT	2025-09-12 01:10:00.94	2025-09-12 01:10:00.94
cmfg549j00244ovbohta1lry4	WATSON CIVIL CONSTRUCTION	2025-09-12 01:10:01.021	2025-09-12 01:10:01.021
cmfg549l30245ovbosx1aivg5	WCI COMMUNITIES, INC	2025-09-12 01:10:01.096	2025-09-12 01:10:01.096
cmfg549nh0246ovbo2v2cymyt	WE LOVE KIDS	2025-09-12 01:10:01.181	2025-09-12 01:10:01.181
cmfg549pg0247ovbon8s1mhkv	WEEKES CONSTRUCTION	2025-09-12 01:10:01.253	2025-09-12 01:10:01.253
cmfg549rc0248ovbojvcd162r	WEEKLEY ASPHALT	2025-09-12 01:10:01.321	2025-09-12 01:10:01.321
cmfg549tc0249ovbo8ur58uag	WEEKLEY ASPHALT:BROWARD PORT	2025-09-12 01:10:01.393	2025-09-12 01:10:01.393
cmfg549vb024aovbof3bpoxk1	WEEKLEY ASPHALT:E4X37	2025-09-12 01:10:01.464	2025-09-12 01:10:01.464
cmfg549xb024bovboz1c4xbnl	WEEKLEY ASPHALT:E6N23	2025-09-12 01:10:01.535	2025-09-12 01:10:01.535
cmfg549za024covbo7985jsys	WEEKLEY ASPHALT:T3515 - MLK BLVD	2025-09-12 01:10:01.607	2025-09-12 01:10:01.607
cmfg54a16024dovbolgqay6ix	WEEKLEY ASPHALT:T4695	2025-09-12 01:10:01.675	2025-09-12 01:10:01.675
cmfg54a36024eovbov0k8my22	WEEKLEY ASPHALT:TECH VILLAGE	2025-09-12 01:10:01.746	2025-09-12 01:10:01.746
cmfg54a56024fovbovcfos3rm	WEEKLEY ASPHALT:TECH VILLAGE PO	2025-09-12 01:10:01.819	2025-09-12 01:10:01.819
cmfg54a75024govbo5fmpst1w	WEEKLEY ASPHALT:WEEKLY ASPHALT WAP-12044	2025-09-12 01:10:01.89	2025-09-12 01:10:01.89
cmfg54a93024hovbolt38vr8q	WEEKS GAS	2025-09-12 01:10:01.96	2025-09-12 01:10:01.96
cmfg54ab3024iovboo4vf6qya	WELDON USA CORP.	2025-09-12 01:10:02.031	2025-09-12 01:10:02.031
cmfg54ad2024jovbovv51hbsw	WESCON CONSTRUCTION, INC.	2025-09-12 01:10:02.103	2025-09-12 01:10:02.103
cmfg54af2024kovbooicm2xn1	WEST CONSTRUCTION	2025-09-12 01:10:02.175	2025-09-12 01:10:02.175
cmfg54agz024lovbosx806tfv	WESTON 55 PLUS MASTER	2025-09-12 01:10:02.244	2025-09-12 01:10:02.244
cmfg54aiz024movbot4jfwa0f	WESTWIND CONTRACTING	2025-09-12 01:10:02.316	2025-09-12 01:10:02.316
cmfg54aky024novbozdljwj26	WHISTLING PINES CREEK	2025-09-12 01:10:02.387	2025-09-12 01:10:02.387
cmfg54an3024oovboi20f9fa8	WHITE ROCK QUARRIES	2025-09-12 01:10:02.464	2025-09-12 01:10:02.464
cmfg54ap7024povbomiw1aa8l	WHITING-TURNER	2025-09-12 01:10:02.539	2025-09-12 01:10:02.539
cmfg54ar8024qovbot2c0iiti	WILDCAT DEMOLITION	2025-09-12 01:10:02.613	2025-09-12 01:10:02.613
cmfg54atc024rovboklav22uo	WILFREDO DIAZ	2025-09-12 01:10:02.689	2025-09-12 01:10:02.689
cmfg54avc024sovbof5nwupa8	WILLIAM SCOTTSMAN	2025-09-12 01:10:02.761	2025-09-12 01:10:02.761
cmfg54axf024tovbonje1ph61	WILLIAMS PAVING CO, INC.	2025-09-12 01:10:02.836	2025-09-12 01:10:02.836
cmfg54azf024uovbo81drabdl	WILLIAMS PAVING CO, INC.:CITY OF DORAL NW 117 AVE FROM NW 50TH ST	2025-09-12 01:10:02.908	2025-09-12 01:10:02.908
cmfg54b1k024vovbobl1bx8hu	WILLIS MARTINEZ	2025-09-12 01:10:02.985	2025-09-12 01:10:02.985
cmfg54b3k024wovbowd3p9e29	WILMEN CONSTRUCTION	2025-09-12 01:10:03.057	2025-09-12 01:10:03.057
cmfg54b5l024xovbot9r3ea5j	WINMAR COASTAL	2025-09-12 01:10:03.129	2025-09-12 01:10:03.129
cmfg54b7k024yovbo5kknwfca	WINMAR COMMERCIAL	2025-09-12 01:10:03.201	2025-09-12 01:10:03.201
cmfg54b9j024zovbosfti2pvc	WINMAR CONSTRUCTION	2025-09-12 01:10:03.272	2025-09-12 01:10:03.272
cmfg54bbk0250ovbojr54i850	WJ MIRANDA CONSTRUCTION, LLC	2025-09-12 01:10:03.344	2025-09-12 01:10:03.344
cmfg54bdi0251ovbo400icoi6	WOMAN DETENTION CENTER	2025-09-12 01:10:03.415	2025-09-12 01:10:03.415
cmfg54bfk0252ovboikfreg27	WOOD CONSTRUCTION	2025-09-12 01:10:03.489	2025-09-12 01:10:03.489
cmfg54bho0253ovbo0h0jzuy7	WOODSIDE APARTMENTS ASSOCIATION, INC	2025-09-12 01:10:03.564	2025-09-12 01:10:03.564
cmfg54bjq0254ovboyhgi796m	WOOLEMS LUXURY BUILDERS	2025-09-12 01:10:03.638	2025-09-12 01:10:03.638
cmfg54bls0255ovbo23re85v6	WORLD FIBER TECHNOLOGIES CORP	2025-09-12 01:10:03.712	2025-09-12 01:10:03.712
cmfg54bnr0256ovbof8wr4g3v	WRANGLER CONSTRUCTION	2025-09-12 01:10:03.783	2025-09-12 01:10:03.783
cmfg54bps0257ovboogckyc6g	WRIGHT CONSTRUCTION GROUP, INC	2025-09-12 01:10:03.857	2025-09-12 01:10:03.857
cmfg54brt0258ovbo12g12r89	WWJD ENGINEERING	2025-09-12 01:10:03.929	2025-09-12 01:10:03.929
cmfg54btt0259ovbonzvw4ghd	WYNWOOD 250 LLC	2025-09-12 01:10:04.001	2025-09-12 01:10:04.001
cmfg54bvw025aovboszxxvibg	XTREME REPTILES	2025-09-12 01:10:04.077	2025-09-12 01:10:04.077
cmfg54bxw025bovbows1d4xf2	Y BEYOND BUSINESS DEVELOPMENT	2025-09-12 01:10:04.149	2025-09-12 01:10:04.149
cmfg54bzy025covbo6ym39w8o	Y GLENZ STRIPING INC	2025-09-12 01:10:04.223	2025-09-12 01:10:04.223
cmfg54c21025dovbo0056wsi8	YACHT HARBOUR	2025-09-12 01:10:04.297	2025-09-12 01:10:04.297
cmfg54c41025eovbo20vi2dff	YC GROUP LLC	2025-09-12 01:10:04.37	2025-09-12 01:10:04.37
cmfg54c62025fovbowbxessd0	YCL MANAGEMENT INC	2025-09-12 01:10:04.442	2025-09-12 01:10:04.442
cmfg54c85025govboda7nqv86	YENNI RODRIGUEZ	2025-09-12 01:10:04.518	2025-09-12 01:10:04.518
cmfg54ca4025hovbot65miz6e	YOLANDA DELGADO	2025-09-12 01:10:04.589	2025-09-12 01:10:04.589
cmfg54ccn025iovbornrfjk9u	YORK LOCK & KEY CO.,INC	2025-09-12 01:10:04.68	2025-09-12 01:10:04.68
cmfg54ceo025jovbory9t21wi	YOUTH SERVICES INTERNATIONAL, INC	2025-09-12 01:10:04.752	2025-09-12 01:10:04.752
cmfg54cgm025kovbow1uk8k1s	YTECH CONSTRUCTION, INC	2025-09-12 01:10:04.823	2025-09-12 01:10:04.823
cmfg54cih025lovbojgjhcz24	YUNY CLARK	2025-09-12 01:10:04.889	2025-09-12 01:10:04.889
cmfg54ckm025movbov59r7kjt	ZAHLENE ENTERPRISE INC	2025-09-12 01:10:04.966	2025-09-12 01:10:04.966
cmfg54cmj025novbo1soh22rc	ZAHLENE ENTERPRISES, INC	2025-09-12 01:10:05.035	2025-09-12 01:10:05.035
cmfg54coi025oovbocxc82hnn	ZEP CONSTRUCTION	2025-09-12 01:10:05.107	2025-09-12 01:10:05.107
cmfg54cqi025povbo1b9fj083	ZERO NINE TECH/CONSTRUCTION	2025-09-12 01:10:05.179	2025-09-12 01:10:05.179
cmfg54csk025qovbo17l152cg	Ziegler Builders	2025-09-12 01:10:05.252	2025-09-12 01:10:05.252
cmfg54cuj025rovbommgyxoku	ZOEY ANGULO	2025-09-12 01:10:05.324	2025-09-12 01:10:05.324
cmfg54cwj025sovborxgrmskd	ZOO FOUNDATION	2025-09-12 01:10:05.396	2025-09-12 01:10:05.396
cmfg54cyi025tovbouqkkndoc	ZURQUI CONSTRUCTION SERVICES	2025-09-12 01:10:05.467	2025-09-12 01:10:05.467
cmfo15whh0000ov4ceqv8s3vg	Halley	2025-09-17 13:41:28.373	2025-09-17 13:41:28.373
cmfo1hwmy0002ov4c7wbfe94h	ACME CONSTRUCTION	2025-09-17 13:50:48.409	2025-09-17 13:50:48.409
cmg0wkwu10002jo04ghosty2a	LTS: ALLIGATOR ALCATRAZ	2025-09-26 13:54:10.87	2025-09-26 13:54:10.87
cmg5b0ax30000l1045hajmf18	LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES	2025-09-29 15:49:08.296	2025-09-29 15:49:08.296
cmg5gi8fa0000ju04f2oou6dq	DOWNRITE ENGINEERING: KEYS GATE	2025-09-29 18:23:02.951	2025-09-29 18:23:02.951
cmg5giljs0001ju04lbi0kz9p	DOWNRITE ENGINEERING:KEYS GATE	2025-09-29 18:23:19.96	2025-09-29 18:23:19.96
\.


--
-- Data for Name: DailyReportSnapshot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DailyReportSnapshot" (id, "reportDate", vendor, "payloadJson", "createdAt") FROM stdin;
cmfg7ls880000ov4oopsp8sat	2025-09-17 00:00:00	\N	{"dateYmd":"2025-09-17","vendor":null,"rows":[{"project":"Master Excavators","invoice":"12108","crew":[],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","notes":"Jaime, Luis, Pedro"},{"project":"OHLA: T4682","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","notes":""},{"project":"Rock Power: Lift Station","invoice":"12063","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","notes":"Adrian, Ramiro and ventura"}]}	2025-09-12 02:19:37.339
cmfg7lt420003ov4ovd8pheet	2025-09-17 00:00:00	\N	{"dateYmd":"2025-09-17","vendor":null,"rows":[{"project":"Master Excavators","invoice":"12108","crew":[],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","notes":"Jaime, Luis, Pedro"},{"project":"OHLA: T4682","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","notes":""},{"project":"Rock Power: Lift Station","invoice":"12063","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","notes":"Adrian, Ramiro and ventura"}]}	2025-09-12 02:19:38.787
cmg10wynf0000ovxoflgx3l1y	2025-09-17 00:00:00	\N	{"dateYmd":"2025-09-17","vendor":null,"rows":[{"project":"Master Excavators","invoice":"12108","crew":[],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","notes":"Jaime, Luis, Pedro"},{"project":"OHLA: T4682","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","notes":""},{"project":"Rock Power: Lift Station","invoice":"12063","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","notes":"Adrian, Ramiro and ventura"}]}	2025-09-26 15:55:31.562
cmg12u3yc0003ovxoedl1chq6	2025-09-26 00:00:00	\N	{"dateYmd":"2025-09-26","vendor":null,"rows":[{"project":"Link Construction: Sky Bridge East","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-O","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Joselin, Fabian, Pichi to be up north for the week"}]}	2025-09-26 16:49:17.7
cmg12v7uc0006ovxoe83d3f0s	2025-09-25 00:00:00	\N	{"dateYmd":"2025-09-25","vendor":null,"rows":[{"project":"Link Construction: Sky Bridge East","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-O","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Joselin, Fabian, Pichi to be up north for the week"}]}	2025-09-26 16:50:09.397
cmg15nfyd0009ovxo4k1l6xp6	2025-09-24 00:00:00	\N	{"dateYmd":"2025-09-24","vendor":null,"rows":[{"project":"Link Construction: Sky Bridge East","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-O","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Joselin, Fabian, Pichi to be up north for the week"}]}	2025-09-26 18:08:05.51
cmg15nm9j000covxo2q9pv1xm	2025-09-23 00:00:00	\N	{"dateYmd":"2025-09-23","vendor":null,"rows":[{"project":"Link Construction: Sky Bridge East","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-O","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Joselin, Fabian, Pichi to be up north for the week"}]}	2025-09-26 18:08:13.687
cmg15nu35000fovxokpzjykbp	2025-09-27 00:00:00	\N	{"dateYmd":"2025-09-27","vendor":null,"rows":[{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-O","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Joselin, Fabian, Pichi to be up north for the week"}]}	2025-09-26 18:08:23.825
cmg15o4xe000iovxo6brjwdex	2025-09-29 00:00:00	\N	{"dateYmd":"2025-09-29","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"12024","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580","invoice":"","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Joselin Aguila","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Joselin, Fabian, Pichi to be up north for the week"}]}	2025-09-26 18:08:37.875
cmg16mvu7000lovxott7hbl70	2025-09-26 00:00:00	\N	{"dateYmd":"2025-09-26","vendor":null,"rows":[{"project":"Link Construction: Sky Bridge East","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-O","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Joselin, Fabian, Pichi to be up north for the week"}]}	2025-09-26 18:35:39.055
cmg16xzh1000oovxo9utldf5x	2025-09-17 00:00:00	\N	{"dateYmd":"2025-09-17","vendor":null,"rows":[{"project":"Downrite: Ocean Gate Village","invoice":"12114","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"9 sections of 20’"},{"project":"Master Excavators","invoice":"12108","crew":[],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Jaime, Luis, Pedro"},{"project":"Nova Construction","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Mosies and Noel"},{"project":"OHLA: T4682","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"Rock Power: Lift Station","invoice":"12063","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Adrian, Ramiro and ventura"}]}	2025-09-26 18:44:16.981
cmg16ydfv000rovxojxga4plu	2025-09-29 00:00:00	\N	{"dateYmd":"2025-09-29","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"12024","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580","invoice":"","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Joselin Aguila","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Joselin, Fabian, Pichi to be up north for the week"}]}	2025-09-26 18:44:35.084
cmg174xc1000uovxof3yszj5v	2025-09-29 00:00:00	\N	{"dateYmd":"2025-09-29","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"12024","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580","invoice":"","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Joselin Aguila","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Joselin, Fabian, Pichi to be up north for the week"}]}	2025-09-26 18:49:40.801
cmg1en7kf0000l104xew7jkc0	2025-09-29 00:00:00	\N	{"dateYmd":"2025-09-29","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"12024","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580","invoice":"","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Joselin Aguila","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Joselin, Fabian, Pichi to be up north for the week"}]}	2025-09-26 22:19:51.184
cmg5hvoua0008ju047wgn8aoh	2025-09-29 00:00:00	\N	{"dateYmd":"2025-09-29","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-O","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-O","crew":["Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"OHLA: 328TH","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Daily","vendor":null,"timeUnit":"Day","shift":"Day","notes":"48' of pipe handrail"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-29 19:01:30.371
cmg5uutqc0000ovngkjj8bvhj	2025-09-29 00:00:00	\N	{"dateYmd":"2025-09-29","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA: 328TH","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Daily","vendor":null,"timeUnit":"Day","shift":"Day","notes":"48' of pipe handrail"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 01:04:45.061
cmg7zwwme0000jv04s3g0ajyh	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 13:01:52.551
cmg5uutqn0001ovng1ryjc259	2025-09-29 00:00:00	\N	{"dateYmd":"2025-09-29","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA: 328TH","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Daily","vendor":null,"timeUnit":"Day","shift":"Day","notes":"48' of pipe handrail"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 01:04:45.071
cmg6fybw60006ovng7a0h1pqu	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 10:55:20.502
cmg6g3zwu0009ovngzrrfrftj	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 10:59:44.911
cmg6g95jd000covng8iaxp6yo	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 11:03:45.482
cmg6gh7qy000fovngx2860oep	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 11:10:01.594
cmg6j9feu0000ov08h7vivjr0	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 12:27:57.127
cmg6k82140000ov8g5qcrmdkj	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 12:54:52.712
cmg6kodrv0003ov8gxaueunpb	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 13:07:34.46
cmg6rxm2k0000ovm4rh6sij22	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 16:30:42.407
cmg6w34ec0003ovm44gqacldu	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 18:26:57.925
cmg6w52710006ovm4l97azsyp	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 18:28:28.381
cmg6wchbd0009ovm4qw27rn21	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 18:34:14.57
cmg6xk1t2000covm40g6umr3w	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 19:08:07.334
cmg6xrirr0000ov8sf7l7mxwb	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 19:13:55.911
cmg72i5y50000ov3sx065ao6o	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 21:26:37.469
cmg766w540000ov5ov99kusue	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 23:09:50.008
cmg77ests0003ov5ol4fms59o	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 23:43:58.576
cmg8av9a50003jo04027e89ar	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 18:08:31.421
cmg77hpmu0006ov5odkypyhp4	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 23:46:14.406
cmg77jrr50009ov5ofdn4d6sm	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 23:47:50.466
cmg77mn6a000cov5og7c7zaqd	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 23:50:04.498
cmg77oy8t000fov5oppf1tsjy	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 23:51:52.103
cmg77rafh000iov5otjn2f2pi	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12095-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"H & R PAVING, INC.:T6580","invoice":"11930-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Fence removal and relocation of panels"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-09-30 23:53:41.262
cmg8qtykq0000lb04xe9dz0lb	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 01:35:24.746
cmg79diny000lov5olia7dkv8	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 00:38:57.982
cmg79ihpu000oov5oh9oddhk4	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 00:42:50.034
cmg79n3zr000rov5odk3atpw1	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 00:46:25.528
cmg79p4gz000uov5o0xvhaidf	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 00:47:59.459
cmg79pndb000xov5o148oy7lm	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 00:48:23.951
cmg7bo7ti0000ovjwgyq2wutg	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 01:43:16.374
cmg7zygo80003jv04nxpq5ps2	2025-09-30 00:00:00	\N	{"dateYmd":"2025-09-30","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12271, 12277","crew":["Jaime Vergara","Luis Penaranda","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"Guardrail repairs \\n\\ninvoice 12271, 12277"},{"project":"DOWNRITE ENGINEERING","invoice":"12124","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"NOVA CONSTRUCTION","invoice":"12127","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"260' lf of temporary fence panels"},{"project":"OHLA 328TH ST","invoice":"12245","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 13:03:05.192
cmg81g5la0000kt046jy9pb0z	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 13:44:50.255
cmg81gd3e0003kt04ft3ru7zf	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 13:44:59.979
cmg8anv5m0000l504psbfrin8	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 18:02:46.523
cmg8aqjq00004k104o5dsjugh	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 18:04:51.673
cmg8aqv0p0007k104gjlac1ds	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 18:05:06.314
cmg8aupdx0000jo04rlc8ijk3	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["alex-nelson","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-01 18:08:05.637
cmg8rr66l0000s9w6biyh1lwi	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 02:01:14.254
cmg8ryp4b0003s9w63z99n9vw	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 02:07:05.388
cmg8rz8rw0006s9w63n3snip9	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 02:07:30.861
cmg8s1sb60009s9w6fm68ztj9	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 02:09:29.49
cmg8s9lsb000cs9w61ydvl153	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 02:15:34.284
cmg8sa7nu000fs9w6eku2scph	2025-10-14 00:00:00	\N	{"dateYmd":"2025-10-14","vendor":null,"rows":[{"project":"AW: I-95 ","invoice":"","crew":[],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"quarter spacing with nested panels and all special post"},{"project":"GGI: T6413","invoice":"","crew":[],"work":"FENCE","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"3 Lift stations\\n82 bollards\\n6’ high type b"},{"project":"OHLA: Joel Blvd","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"In Leigh High Acres"}]}	2025-10-02 02:16:02.634
cmg8sal11000is9w67v1jins8	2025-10-02 00:00:00	\N	{"dateYmd":"2025-10-02","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DP DEVELOPMENT LLC","invoice":"12096","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Adjusted","vendor":null,"timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,000"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 02:16:19.957
cmg8saytj000ls9w6pv8i74sz	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Adjusted","vendor":null,"timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,000"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 02:16:37.832
cmg8sayzt000ns9w6tpmbhd3f	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Adjusted","vendor":null,"timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,000"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 02:16:38.058
cmg9d2p2l0000s9u7gxyitymz	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 11:58:03.885
cmg9d3qmv0003s9u749zlp78r	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 11:58:52.567
cmg9d5swy0006s9u7xalpipk6	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 12:00:28.834
cmg9d7q2k0009s9u77t470r3s	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 12:01:58.461
cmg9e6ay3000cs9u7uqmo1auv	2025-10-02 00:00:00	\N	{"dateYmd":"2025-10-02","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DP DEVELOPMENT LLC","invoice":"12096","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Adjusted","vendor":null,"timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,000"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 12:28:51.82
cmg9e808k000fs9u7qttop36p	2025-10-02 00:00:00	\N	{"dateYmd":"2025-10-02","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DP DEVELOPMENT LLC","invoice":"12096","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Adjusted","vendor":null,"timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,000"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 12:30:11.252
cmg9hm6tz0000ld04ngykqb4v	2025-10-02 00:00:00	\N	{"dateYmd":"2025-10-02","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DP DEVELOPMENT LLC","invoice":"12096","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Adjusted","vendor":null,"timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,000"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 14:05:11.828
cmg9ysmc60000s9p2etxic8z6	2025-10-02 00:00:00	\N	{"dateYmd":"2025-10-02","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DP DEVELOPMENT LLC","invoice":"12096","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Adjusted","vendor":null,"timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,000"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 22:06:05.335
cmg9zkfqp0003s9p209zqns9t	2025-10-02 00:00:00	\N	{"dateYmd":"2025-10-02","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DP DEVELOPMENT LLC","invoice":"12096","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Adjusted","vendor":null,"timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,000"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 22:27:43.153
cmg9zmrls0006s9p26jrdcxa4	2025-10-02 00:00:00	\N	{"dateYmd":"2025-10-02","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"12096","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Adjusted","vendor":null,"timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,000"}]}	2025-10-02 22:29:31.84
cmga0ddp70009s9p20sim8puj	2025-10-02 00:00:00	\N	{"dateYmd":"2025-10-02","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DP DEVELOPMENT LLC","invoice":"12096","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["No"],"payment":"Adjusted","vendor":null,"timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,000"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 22:50:13.531
cmga20iry000cs9p2ha1rqj0r	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 23:36:12.815
cmga2c535000fs9p2lpfloyya	2025-10-01 00:00:00	\N	{"dateYmd":"2025-10-01","vendor":null,"rows":[{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING:KEYS GATE","invoice":"12226-A","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"6 T turn arounds\\n3 sections by truck\\n3 sections special post"},{"project":"General Asphalt: E4X25","invoice":"","crew":[],"work":"GUARDRAIL","payroll":[],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":["Robert Amparo Lloret","Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"INSTALL / REPLACE WINDSCREEN, AND ADD SLOTS FOR WIND TO PASS THROUGH"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-02 23:45:14.946
cmga5gvdy0000ic04brbjszak	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","john-robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","alex-nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 01:12:54.503
cmga5m1qk0000l404s6mxtfqe	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 01:16:56.012
cmga5m2hh0000l104nu50ki3g	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":["Robert Amparo Lloret","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 01:16:56.971
cmgfqp6is0000s93rs0dwusdy	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-06 23:06:04.996
cmgarlfp40000jx04aqpqtbq0	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 11:32:19
cmgarnp620000l804i91nyefn	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 11:34:04.586
cmgaro6tf0003l80496014402	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"11743-L","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 11:34:27.459
cmgarttuc0000l8040c74df10	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"12284","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 11:38:50.566
cmgji8okq0000jl045zadch2r	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Guardrail repairs"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"}]}	2025-10-09 14:20:23.019
cmgarulk40003l804zx5xg3sj	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"12284","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 11:39:26.5
cmgarvvdv0006l80495c2fmu3	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"12284","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 11:40:25.892
cmgashzsw0000s9hc1fv3nvvf	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"12284, 11743-L","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 11:57:38.048
cmgask0370000s9swc17jls3w	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"12284, 11743-L","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-P","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 11:59:11.731
cmgatldu40003s9swcozerw8b	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"12284, 11743-L","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 12:28:15.821
cmgatr91r0006s9swqdzyfroa	2025-10-03 00:00:00	\N	{"dateYmd":"2025-10-03","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"3 Lift Stations"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Fabian Marquez","Jaime Vergara","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"LEAD ENGINEERING CONTRACTORS: PORT EVERGLADES","invoice":"12284, 11743-L","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-Q","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Alex and Crew"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Carlos Manuel Diaz","Daniel Buell Burnette","John Robinson","Joselin Aguila","Nicholas Sieber","Pedro Manes","Robert Gomez","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-03 12:32:49.551
cmgefrndd0000l204stc3derl	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"}]}	2025-10-06 01:12:18.192
cmgefxs740000l7047xbdjvzn	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":null,"timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":null,"timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"}]}	2025-10-06 01:17:04.381
cmgftnmh50000jo04scpkmenf	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 00:28:51.209
cmgefz4k90003l704m6ufjyio	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"}]}	2025-10-06 01:18:07.066
cmgf7mam30000jo04kpfkwpef	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-06 14:11:57.627
cmgffmclf0000la04zw9tmca5	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-06 17:55:57.123
cmgfpv4li0000s9pqeb9z1fas	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-06 22:42:42.823
cmgfq367s0000s9e33c89lxlc	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-06 22:48:58.169
cmgfqfox00007s9e3hmpr8139	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-06 22:58:42.277
cmgfu0rw60000s9cksjsfbh50	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 00:39:04.758
cmgfv55zd0000s92jak0o67gu	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 01:10:29.258
cmgfvw41p0000s9xrg7j2w724	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 01:31:26.461
cmgfwh2uu0000s9v4fx0g8smv	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 01:47:44.695
cmgghdkg70000s92rjt9qqjbw	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:32:52.807
cmginq9u40000kw04io1y6stc	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287,12291","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":"2 repairs are panels and posts 1 repiar is a minor damage to soft stop"},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alexander Ponce"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12116","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-09 00:06:15.629
cmgghdre70003s92rxp75ypuu	2025-10-06 00:00:00	\N	{"dateYmd":"2025-10-06","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12115,12116-A","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"2 T TURN AROUNDS BY HAND"},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret","Oscar Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:33:01.808
cmgghen0c0006s92rffbxft3f	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:33:42.781
cmgghfdxh0009s92rd8gl0dgt	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:34:17.67
cmgghhqux000cs92rc3sasews	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:36:07.738
cmgghkud9000fs92rf3op1iwh	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Robert Amparo Lloret","Jose Santos Diaz"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:38:32.254
cmgghmgnp000is92rt5r02uvr	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:39:47.762
cmgghs9li000ls92r9dfrpmxj	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:44:18.582
cmgghtayi000os92r4mjjmdw3	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:45:07.002
cmgje9x2s0000jp040xtjvtul	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Guardrail repairs"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"}]}	2025-10-09 12:29:22.229
cmgghu397000rs92r4scaf3sp	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:45:43.676
cmggi1awl000us92rerja7lpv	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 11:51:20.182
cmggiek060000jf041aczujvg	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-C","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 12:01:38.502
cmggigfb40000l504ozjqx02j	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-F","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 12:03:05.729
cmgginq6g0003l504toq546yz	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-F","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 12:08:46.406
cmggiof970006l504ggkk0lso	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-F","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 12:09:18.908
cmggir4p00009l504s3m3huno	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 12:11:25.188
cmggir58x0000gw04jg7l26td	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 12:11:25.906
cmggiuy540000jp04wcltiyeo	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-F","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 12:14:23.32
cmggo7q2o0000l204ed1zsufk	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-F","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 14:44:17.468
cmggpoi7n0002l404ztnd899v	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-F","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12126","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 15:25:20.052
cmggrm3o00000s93urhrslnhi	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-F","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12126","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 16:19:27.12
cmggrmb1t0003s93udynzxlxu	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287,12291","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":"2 repairs are panels and posts 1 repiar is a minor damage to soft stop"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING: OCEAN GATE VILLAGE","invoice":"12114","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 16:19:36.689
cmgjfny8g0000jy04wbn4pikf	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Guardrail repairs"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"}]}	2025-10-09 13:08:16.528
cmggs5lp10006s93ugo1xggy4	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-F","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12126","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 16:34:36.949
cmggsj4wb0000s9pxm4ycn56b	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-F","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12126","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-07 16:45:08.364
cmghx1gx50000l404lrxu7h4p	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287,12291,12292","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":"2 repairs are panels and posts 1 repiar is a minor damage to soft stop"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12116","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12126","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-08 11:39:08.393
cmghxr7so0000kz04545dary8	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287,12291,12292","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":"2 repairs are panels and posts 1 repiar is a minor damage to soft stop"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12116","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-08 11:59:09.624
cmghxs3iu0005kz04e12bl9jy	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287,12291,12292","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":"2 repairs are panels and posts 1 repiar is a minor damage to soft stop"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12116","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-08 11:59:50.743
cmghxzyuj0000jy04tjt2nddk	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287,12291,12292","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":"2 repairs are panels and posts 1 repiar is a minor damage to soft stop"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12116","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-08 12:05:57.932
cmghy5jg40003jy040huwxilk	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287,12291,12292","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":"2 repairs are panels and posts 1 repiar is a minor damage to soft stop"},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alexander Ponce"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12116","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-08 12:10:17.906
cmgi9iuxm0002l404072k1gyk	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287,12291","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":"2 repairs are panels and posts 1 repiar is a minor damage to soft stop"},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alexander Ponce"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12116","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-08 17:28:35.098
cmgib4bo20002l704cu2vtb6z	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alexander Ponce"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270","crew":[],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-08 18:13:16.179
cmgji9tax0000kw04sld3qshx	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"12065-A","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Guardrail repairs"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"}]}	2025-10-09 14:21:15.801
cmgjip37j0007jl04lb48eghr	2025-10-07 00:00:00	\N	{"dateYmd":"2025-10-07","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935-F","crew":["Esteban Sanchez","Robert Amparo Lloret","Jose Santos Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Esteban with truck"},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12126","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Fabian Marquez","Joselin Aguila","Carlos Manuel Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"GENERAL ASPHALT:E6M92","invoice":"12290","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"Orion: Port Everglades","invoice":"12034-A","crew":["Yonisbel Fonseca"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"90 LF of removal and 335 LF of install temp fence"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-09 14:33:08.479
cmgjkcrp00000l404vcyzh11n	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"12065-A","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270, 12284,12293","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Guardrail repairs"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"}]}	2025-10-09 15:19:32.916
cmgjkdmt30003l404hykablkf	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"12065-A","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270, 12284,12293","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Guardrail repairs"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"}]}	2025-10-09 15:20:13.24
cmgjlxjfz0000l204qyh2w2n0	2025-10-08 00:00:00	\N	{"dateYmd":"2025-10-08","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12286,12287,12291","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Night","notes":"2 repairs are panels and posts 1 repiar is a minor damage to soft stop"},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12116","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Oscar Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:T6580 PO","invoice":"11999-A","crew":["Esteban Sanchez","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"30' of 8' high with top rail. U shape install with 4 corners tying into existing fence"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-09 16:03:41.616
cmgjm025j0003l204a188g28c	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"12065-A","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270, 12284,12293","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Guardrail repairs"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"}]}	2025-10-09 16:05:39.175
cmgjmjc0l0006l204m33g7au0	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"12065-A","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270, 12284,12293","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Guardrail repairs"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"}]}	2025-10-09 16:20:38.421
cmgjmjizc0009l204dyyjsolr	2025-10-11 00:00:00	\N	{"dateYmd":"2025-10-11","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"SOUTHERN ASPHALT ENGINEERING, INC","invoice":"12129","crew":["Joselin Aguila","Fabian Marquez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":"12129 // 290 LF GUARDRAIL W BUFFER ENDS"}]}	2025-10-09 16:20:47.445
cmgjqet4m0000ld04m3qdbvz7	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"12065-A","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270, 12284,12293","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Guardrail repairs"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"}]}	2025-10-09 18:09:05.782
cmgjqfi6s0003ld04mfhgraww	2025-10-10 00:00:00	\N	{"dateYmd":"2025-10-10","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - CONTRACT WORK","invoice":"10297-Y","crew":["Carlos Manuel Diaz","Jaime Vergara","Luis Penaranda","Pedro Manes","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"392 LF connect to existing and soft stop on either side + 80 lf ,1 parallel , 1 approach transition - Guranteed Fence to Pay Robert Amparo"},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alex Fence"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GENERAL ASPHALT","invoice":"12294","crew":["Joselin Aguila","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Repair P.O work"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"}]}	2025-10-09 18:09:38.261
cmgjwhtjv0000l404y1jpgb7b	2025-10-09 00:00:00	\N	{"dateYmd":"2025-10-09","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alexander Ponce"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12130","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DP DEVELOPMENT LLC","invoice":"12065-A","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"General Asphalt: E4X25","invoice":"11973-A","crew":["Carlos Manuel Diaz","Fabian Marquez","Joselin Aguila","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LANE CONSTRUCTION CORP:E8U08 PO","invoice":"12285,12270, 12284,12293","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil","Alex Nelson"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Guardrail repairs"},{"project":"OHLA: T4682","invoice":"11972-A","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Bullet Rail Double: 133 LF\\nHandrail Aluminum: 14 LF\\n\\nAdjustment for $1,200"}]}	2025-10-09 20:59:23.995
cmgjwjejh0003l4042n0fadxv	2025-10-10 00:00:00	\N	{"dateYmd":"2025-10-10","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - CONTRACT WORK","invoice":"10297-Y","crew":["Carlos Manuel Diaz","Jaime Vergara","Luis Penaranda","Pedro Manes","Robert Amparo Lloret"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"392 LF connect to existing and soft stop on either side + 80 lf ,1 parallel , 1 approach transition - Guranteed Fence to Pay Robert Amparo"},{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289","crew":["Alexander Ponce"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GENERAL ASPHALT","invoice":"12294","crew":["Joselin Aguila","Fabian Marquez"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Repair P.O work"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"}]}	2025-10-09 21:00:37.853
cmgn3u8210000la04qqe31l60	2025-10-13 00:00:00	\N	{"dateYmd":"2025-10-13","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson"],"work":"ATTENUATOR","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"2 attenuators"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"","crew":["Joselin Aguila","Fabian Marquez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-12 02:48:18.503
cmgp32jpf0000l504oxqwxv71	2025-10-13 00:00:00	\N	{"dateYmd":"2025-10-13","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"11530","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson"],"work":"ATTENUATOR","payroll":["No"],"payment":"","vendor":null,"timeUnit":"Day","shift":"Day","notes":"2 attenuators"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Joselin Aguila","Fabian Marquez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-13 12:02:19.588
cmgp35nfh0000kv04yi2objyt	2025-10-13 00:00:00	\N	{"dateYmd":"2025-10-13","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"11530","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson"],"work":"ATTENUATOR","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"2 attenuators"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Joselin Aguila","Fabian Marquez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-13 12:04:44.382
cmgp38roj0003kv04r4y75cpd	2025-10-13 00:00:00	\N	{"dateYmd":"2025-10-13","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"11530","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson"],"work":"ATTENUATOR","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"2 attenuators"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Joselin Aguila","Fabian Marquez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-13 12:07:09.86
cmgppzu7k0000jl04d14957bx	2025-10-13 00:00:00	\N	{"dateYmd":"2025-10-13","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"11530","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson"],"work":"ATTENUATOR","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"2 attenuators"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-13 22:44:04.4
cmgqfs6d70000jr04ref7dk0j	2025-10-13 00:00:00	\N	{"dateYmd":"2025-10-13","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"11530-D","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson"],"work":"ATTENUATOR","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"2 attenuators"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-14 10:45:56.923
cmgqjnzly0000l804uf6wgdt2	2025-10-14 00:00:00	\N	{"dateYmd":"2025-10-14","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"H & R PAVING, INC.","invoice":"11530-D","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"fence install 268th ST"},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"11530-D","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"ATTENUATOR","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"2 attenuators"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-14 12:34:40.007
cmgqjp7op0003l804sy8pu5wv	2025-10-14 00:00:00	\N	{"dateYmd":"2025-10-14","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"H & R PAVING, INC.","invoice":"11530-D","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"fence install 268th ST"},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"11530-D","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"ATTENUATOR","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"2 attenuators"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-14 12:35:37.13
cmgqkkmt50000le044g3q0qu4	2025-10-13 00:00:00	\N	{"dateYmd":"2025-10-13","vendor":null,"rows":[{"project":"CENTRAL CIVIL:NDWWTP","invoice":"11734-A","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez","Gerardo Oliva"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"H & R PAVING, INC.:SW 268 ST","invoice":"11530-D","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"ATTENUATOR","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"2 attenuators"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-14 13:00:03.065
cmgryo4ts0000l404negzxee2	2025-10-15 00:00:00	\N	{"dateYmd":"2025-10-15","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 100 LF"},{"project":"GGI Construction JV:T6413","invoice":"11550-","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413 PO","invoice":"11296","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Top rail on NW 6th AVe"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Noel Venero","Oscar Hernandez","Moises Varela"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-15 12:22:27.185
cmgs08pdp0003l404ve3fsxs8	2025-10-15 00:00:00	\N	{"dateYmd":"2025-10-15","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"GGI Construction JV:T6413","invoice":"11550-","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413 PO","invoice":"11296","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Top rail on NW 6th AVe"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Noel Venero","Oscar Hernandez","Moises Varela"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-15 13:06:26.557
cmgs1sc5z0000l204q3lc750e	2025-10-15 00:00:00	\N	{"dateYmd":"2025-10-15","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"GGI Construction JV:T6413","invoice":"11550-","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413 PO","invoice":"11296","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Top rail on NW 6th AVe"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Noel Venero","Oscar Hernandez","Moises Varela"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-15 13:49:42.166
cmgs22v2o0006l804xxl9so8t	2025-10-15 00:00:00	\N	{"dateYmd":"2025-10-15","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"GGI Construction JV:T6413","invoice":"11550-","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413 PO","invoice":"11296","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Top rail on NW 6th AVe"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Noel Venero","Oscar Hernandez","Moises Varela"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-15 13:57:53.232
cmgs23e7j0009l804kqt0xcha	2025-10-15 00:00:00	\N	{"dateYmd":"2025-10-15","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"GGI Construction JV:T6413","invoice":"11550-","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413 PO","invoice":"11296","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Top rail on NW 6th AVe"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Noel Venero","Oscar Hernandez","Moises Varela"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-15 13:58:18.032
cmgsbsnzh0000s9u1eyhru6rz	2025-10-15 00:00:00	\N	{"dateYmd":"2025-10-15","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"GGI Construction JV:T6413","invoice":"11550-","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413 PO","invoice":"11296","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Top rail on NW 6th AVe"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Noel Venero","Oscar Hernandez","Moises Varela"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-15 18:29:53.645
cmgsbsp7h0003s9u12l64sa26	2025-10-15 00:00:00	\N	{"dateYmd":"2025-10-15","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"GGI Construction JV:T6413","invoice":"11550-","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413 PO","invoice":"11296","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Top rail on NW 6th AVe"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Noel Venero","Oscar Hernandez","Moises Varela"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-15 18:29:55.229
cmgsq95wp0000l404btv7hunw	2025-10-15 00:00:00	\N	{"dateYmd":"2025-10-15","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Moises Varela","Pedro Manes","Noel Venero"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"GGI Construction JV:T6413","invoice":"11550-","crew":["Jony Baquedano Mendoza","Jose Santos Diaz"],"work":"HANDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413 PO","invoice":"11296","crew":["Adrian Ramos","Ramiro Valle"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Top rail on NW 6th AVe"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-16 01:14:37.994
cmgtbctqd0000s9rud14ikd22	2025-10-16 00:00:00	\N	{"dateYmd":"2025-10-16","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Moises Varela","Pedro Manes","Noel Venero"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"OHLA","invoice":"11890","crew":["Adrian Ramos","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-16 11:05:20.737
cmgtbfjjr0003s9rubm35wn1e	2025-10-16 00:00:00	\N	{"dateYmd":"2025-10-16","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Moises Varela","Pedro Manes","Noel Venero"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"OHLA","invoice":"11890","crew":["Adrian Ramos","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Alex Nelson","Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-16 11:07:27.543
cmgtip77u0000l804nngkhfgv	2025-10-16 00:00:00	\N	{"dateYmd":"2025-10-16","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Moises Varela","Pedro Manes","Noel Venero"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"OHLA","invoice":"11890","crew":["Adrian Ramos","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-Z","crew":["Daniel Buell Burnette","John Robinson","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":"Type A"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-16 14:30:55.435
cmgtj14u00003l804hcmkh6vl	2025-10-16 00:00:00	\N	{"dateYmd":"2025-10-16","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Moises Varela","Pedro Manes","Noel Venero"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"OHLA","invoice":"11890","crew":["Adrian Ramos","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-16 14:40:12.216
cmgtj5btz0000l704gg15kg8x	2025-10-16 00:00:00	\N	{"dateYmd":"2025-10-16","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Moises Varela","Pedro Manes","Noel Venero"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"OHLA","invoice":"11890","crew":["Adrian Ramos","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-16 14:43:27.912
cmgtj5ccd0003l70437c77mjw	2025-10-16 00:00:00	\N	{"dateYmd":"2025-10-16","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Moises Varela","Pedro Manes","Noel Venero"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"OHLA","invoice":"11890","crew":["Adrian Ramos","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-16 14:43:28.574
cmgtwzwcy0000jo04u2hcao4h	2025-10-16 00:00:00	\N	{"dateYmd":"2025-10-16","vendor":null,"rows":[{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"General Asphalt: T6604","invoice":"11990","crew":["Jaime Vergara","Luis Penaranda","Moises Varela","Pedro Manes","Noel Venero"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"Double Face approach and double face approach transition, approx. 130 LF"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"OHLA","invoice":"11890","crew":["Adrian Ramos","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Ventura Hernandez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-16 21:11:09.199
cmguw6cv90000js04c8c1te9e	2025-10-17 00:00:00	\N	{"dateYmd":"2025-10-17","vendor":null,"rows":[{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-S","crew":["Alex Fence"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":"Remove and Re-install gates 12' high."}]}	2025-10-17 13:35:57.093
cmguw6dwa0003js04dbllv9p1	2025-10-17 00:00:00	\N	{"dateYmd":"2025-10-17","vendor":null,"rows":[{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"LTS: ALLIGATOR ALCATRAZ","invoice":"12092-S","crew":["Alex Fence"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":"Remove and Re-install gates 12' high."}]}	2025-10-17 13:35:58.427
17d038c0-9c55-44cd-89b4-bb318550ebbc	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Luis Penaranda"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Moises Varela","Noel Venero","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-20 12:45:42.246
b70f09c3-26d8-4a01-90d7-b77875bea243	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Luis Penaranda","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Moises Varela","Noel Venero","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING:LAGUNA CIRCLE","invoice":"12080","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"12135","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-20 14:09:43.288
9eb5804a-509a-4a14-8fda-6526f43960e4	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Luis Penaranda"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Moises Varela","Noel Venero","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-20 13:13:09.171
36f85f81-40dc-4550-abbf-98b43199fef6	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Luis Penaranda"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Moises Varela","Noel Venero","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING","invoice":"","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-20 13:22:13.953
1c42579d-e701-4e5d-a110-a4e969580ad3	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Luis Penaranda"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Moises Varela","Noel Venero","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING","invoice":"12080","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"12135","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-20 13:24:53.268
99554bb4-dd96-4cbe-85a5-496421c5fd88	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Luis Penaranda"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Moises Varela","Noel Venero","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING:LAGUNA CIRCLE","invoice":"12080","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"12135","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-20 13:38:25.539
5382c47a-a33e-4d30-af00-118745495644	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez","Ramiro Valle"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Luis Penaranda"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Moises Varela","Noel Venero","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING:LAGUNA CIRCLE","invoice":"12080","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"12135","crew":["Jaime Vergara","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-20 13:47:26.049
72a2f590-8a4d-489b-88a8-bceade313a59	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Moises Varela","Noel Venero","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING:LAGUNA CIRCLE","invoice":"12080","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"12135","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-20 14:10:05.73
0f208428-7520-4efc-b3e1-7f39e5bf946a	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Moises Varela","Noel Venero","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING:LAGUNA CIRCLE","invoice":"12080","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"12135","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-20 17:02:55.949
b076a9bc-fbd5-431a-939a-511aecd06065	2025-10-21 00:00:00	\N	{"dateYmd":"2025-10-21","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12292","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Moises Varela","Noel Venero","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-21 12:18:29.728
434fdbaf-8ee2-4f39-9d69-4d078de390cd	2025-10-21 00:00:00	\N	{"dateYmd":"2025-10-21","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12292","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-21 12:19:54.621
fa6067b8-03c0-4586-8cd9-3649f673fa74	2025-10-21 00:00:00	\N	{"dateYmd":"2025-10-21","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12292","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"11189-G, 12301","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-21 12:20:58.984
d0ba1069-b10a-44bc-8740-de4541bd7d55	2025-10-21 00:00:00	\N	{"dateYmd":"2025-10-21","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12292","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"11189-G, 12301","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-21 12:39:51.392
8220066d-76eb-46d6-ad0e-cb1524c5b8e5	2025-10-21 00:00:00	\N	{"dateYmd":"2025-10-21","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12292","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"11189-G, 12301","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-21 13:44:06.807
1c418acb-c937-4048-a010-2e79d8a78ca3	2025-10-21 00:00:00	\N	{"dateYmd":"2025-10-21","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12292","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12125","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-F","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"11189-G, 12301","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-21 13:44:06.936
390b65ee-47b7-43cf-b98c-d596fbee0703	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez","Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING:LAGUNA CIRCLE","invoice":"12080","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"12135","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-21 21:30:59.775
198443cb-aa7d-4a93-b867-1861a5399874	2025-10-20 00:00:00	\N	{"dateYmd":"2025-10-20","vendor":null,"rows":[{"project":"ALSTON CONSTRUCTION:SKY HARBOR PHASE II","invoice":"11935","crew":["Adrian Ramos","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret","Ramiro Valle"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez","Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRIDENT TRUCKING:LAGUNA CIRCLE","invoice":"12080","crew":["Fabian Marquez","Joselin Aguila","Robert Gomez"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Approx 20 LF of timber guardrail * Robert should be there due to utilities or review atleast before we go."},{"project":"ZAHLENE ENTERPRISES, INC","invoice":"12135","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"75 LF of guardrail 2 end buffers"}]}	2025-10-21 21:31:15.309
1f462259-8f7c-4d14-82ea-8fcaa7d18636	2025-10-21 00:00:00	\N	{"dateYmd":"2025-10-21","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12292","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"DOWNRITE ENGINEERING","invoice":"12126","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"FERREIRA CONSTRUCTION COMPANY: PS28","invoice":"12064-TEMP","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"TEMP_FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-G","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"11189-G, 12301","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"SOLE MIA PROPERTY OWNERS ASSOCIATION INC","invoice":"12131","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"TEMP FENCE 180 LF AND REMOVAL APPROX 530 LF REMOVAL // ESTEBANS TRUCK"},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117-A","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"}]}	2025-10-21 21:34:14.587
08f8aedb-328e-415c-af7f-44eb06441f4b	2025-10-22 00:00:00	\N	{"dateYmd":"2025-10-22","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289-A","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-G","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"11189-G, 12301","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"OPLH","invoice":"12137-TEMP","crew":["Oscar Hernandez","Esteban Sanchez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Pick up a bundle of 1 5/8\\" top rail and 30 panels"},{"project":"OZINGA","invoice":"12134","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117-A","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"},{"project":"WEEKLEY ASPHALT: T6601","invoice":"","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-22 13:01:23.668
8ddddd74-de85-4ed2-868c-be2f29fe998a	2025-10-22 00:00:00	\N	{"dateYmd":"2025-10-22","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289-A","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-G","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"11189-G, 12301","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"OPLH","invoice":"12137-TEMP","crew":["Oscar Hernandez","Esteban Sanchez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Pick up a bundle of 1 5/8\\" top rail and 30 panels"},{"project":"OZINGA","invoice":"12134","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117-A","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"},{"project":"WEEKLEY ASPHALT: T6601","invoice":"12198","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-22 13:03:39.4
731b5963-e98e-46c3-935a-c2e8ed5213d4	2025-10-22 00:00:00	\N	{"dateYmd":"2025-10-22","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289-A","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-G","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"11189-G, 12301","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"OPLH","invoice":"12137-TEMP","crew":["Oscar Hernandez","Esteban Sanchez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Pick up a bundle of 1 5/8\\" top rail and 30 panels"},{"project":"OZINGA","invoice":"12134","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117-A","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"},{"project":"WEEKLEY ASPHALT: T6601","invoice":"12198","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-22 13:03:39.774
58c0b24c-9e26-4645-9c58-61757d461af0	2025-10-22 00:00:00	\N	{"dateYmd":"2025-10-22","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289-A","crew":["Robert Amparo Lloret","Carlos Manuel Diaz"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-G","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":"1100 lf of type B and 2 heavy duty Gates"},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44 PO","invoice":"11189-G, 12301","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"OHLA:T4682","invoice":"12273","crew":["Jaime Vergara","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"OPLH","invoice":"12137-TEMP","crew":["Oscar Hernandez","Esteban Sanchez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"Pick up a bundle of 1 5/8\\" top rail and 30 panels"},{"project":"OZINGA","invoice":"12134","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING:E8T81","invoice":"11367-AA","crew":["Daniel Buell Burnette","Nicholas Sieber","Troy Sturgil","John Robinson","Alex Nelson"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"CHRIS","timeUnit":"Day","shift":"Day","notes":""},{"project":"TRANS FLORIDA DEVELOPMENT","invoice":"12117-A","crew":["Fabian Marquez","Joselin Aguila","Jose Santos Diaz"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":"700 LF of TL-3 , special post dug by client rest by us, 3 sections"},{"project":"WEEKLEY ASPHALT: T6601","invoice":"12198","crew":["Jaime Vergara","Pedro Manes","Luis Penaranda"],"work":"GUARDRAIL","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-22 15:45:08.155
11ecf152-0621-496a-b448-bac048d608fb	2025-10-23 00:00:00	\N	{"dateYmd":"2025-10-23","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289-B","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413","invoice":"","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-G","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HORIZON CONTRACTORS, INC.:T4551","invoice":"","crew":["Fabian Marquez","Jaime Vergara","Joselin Aguila","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"NV2A","invoice":"11686-O","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"OZINGA","invoice":"12134","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING: SUNTRAX PH 1A","invoice":"12288","crew":["Troy Sturgil","Nicholas Sieber","John Robinson","Daniel Buell Burnette"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-23 15:04:00.733
e6651405-63e2-4d89-bf1b-460d3c37d09e	2025-10-23 00:00:00	\N	{"dateYmd":"2025-10-23","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289-B","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413","invoice":"11550-F","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-G","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HORIZON CONTRACTORS, INC.:T4551","invoice":"11444-F","crew":["Fabian Marquez","Jaime Vergara","Joselin Aguila","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"NV2A","invoice":"11686-O","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"OZINGA","invoice":"12134","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING: SUNTRAX PH 1A","invoice":"12288","crew":["Troy Sturgil","Nicholas Sieber","John Robinson","Daniel Buell Burnette"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-23 15:07:39.951
1d73ce8e-6e68-4347-92b1-5ddd30d951e6	2025-10-23 00:00:00	\N	{"dateYmd":"2025-10-23","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289-B","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413","invoice":"11550-F","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-G","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HORIZON CONTRACTORS, INC.:T4551","invoice":"11444-F","crew":["Fabian Marquez","Jaime Vergara","Joselin Aguila","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"NV2A","invoice":"11686-O","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"OZINGA","invoice":"12134","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING: SUNTRAX PH 1A","invoice":"12288","crew":["Troy Sturgil","Nicholas Sieber","John Robinson","Daniel Buell Burnette"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-23 15:08:19.78
ef097eff-d3a4-4cee-b205-90e755479ebb	2025-10-24 00:00:00	\N	{"dateYmd":"2025-10-24","vendor":null,"rows":[{"project":"ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK","invoice":"12289-B","crew":["Carlos Manuel Diaz","Robert Amparo Lloret"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"GGI Construction JV:T6413","invoice":"11550-F","crew":["Adrian Ramos","Ramiro Valle","Ventura Hernandez"],"work":"FENCE","payroll":["Yes"],"payment":"Adjusted","vendor":"JORGE","timeUnit":"Hour","shift":"Day","notes":""},{"project":"HALLEY ENGINEERING CONTRACTORS, INC:E8T44","invoice":"11189-G","crew":["Yonisbel Fonseca"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"HORIZON CONTRACTORS, INC.:T4551","invoice":"11444-F","crew":["Fabian Marquez","Jaime Vergara","Joselin Aguila","Luis Penaranda","Pedro Manes"],"work":"GUARDRAIL","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""},{"project":"OPLH","invoice":"12137-TEMP","crew":["Esteban Sanchez","Oscar Hernandez"],"work":"TEMP_FENCE","payroll":["No"],"payment":"Daily","vendor":"TONY","timeUnit":"Day","shift":"Day","notes":""},{"project":"OZINGA","invoice":"12134","crew":["Moises Varela","Noel Venero"],"work":"FENCE","payroll":["No"],"payment":"Adjusted","vendor":"TONY","timeUnit":"Hour","shift":"Day","notes":""},{"project":"PRINCE CONTRACTING: SUNTRAX PH 1A","invoice":"12288","crew":["Troy Sturgil","Nicholas Sieber","John Robinson","Daniel Buell Burnette"],"work":"FENCE","payroll":["No"],"payment":"Daily","vendor":"JORGE","timeUnit":"Day","shift":"Day","notes":""}]}	2025-10-26 20:41:41.138
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Employee" (id, name, active, "createdAt", "updatedAt", "defaultSection", "hourlyRate") FROM stdin;
adrian-ramos	Adrian Ramos	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	25.00
carlos-manuel-diaz	Carlos Manuel Diaz	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	17.00
christopher-jones	Christopher Jones	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	28.00
daniel-buell-burnette	Daniel Buell Burnette	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	19.50
edilberto-acuna	Edilberto Acuna	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	25.50
esteban-sanchez	Esteban Sanchez	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	15.00
fabian-marquez	Fabian Marquez	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	25.00
gerardo-oliva	Gerardo Oliva	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	25.00
jaime-vergara	Jaime Vergara	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	28.00
jony-baquedano-mendoza	Jony Baquedano Mendoza	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	31.00
jose-fernandez	Jose Fernandez	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	23.00
jose-santos-diaz	Jose Santos Diaz	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	17.00
joselin-aguila	Joselin Aguila	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	21.50
luis-penaranda	Luis Penaranda	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	19.00
moises-varela	Moises Varela	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	28.00
nicholas-sieber	Nicholas Sieber	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	28.00
noel-venero	Noel Venero	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	18.00
oscar-hernandez	Oscar Hernandez	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	15.00
pedro-manes	Pedro Manes	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	23.00
ramiro-valle	Ramiro Valle	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	15.00
robert-amparo-lloret	Robert Amparo Lloret	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	18.25
robert-gomez	Robert Gomez	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	19.00
troy-sturgil	Troy Sturgil	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	19.00
ventura-hernandez	Ventura Hernandez	t	2025-10-22 23:42:29.728	2025-10-22 23:42:29.728	YARD_SHOP	23.00
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Event" (id, "calendarId", title, description, "allDay", location, employees, "invoiceNumber", type, shift, checklist, "startsAt", "endsAt", "attachmentData", "attachmentName", "attachmentType") FROM stdin;
05ed6a83-78fa-4178-9973-0eb2af9e3673	cme9wqhpe0000ht8sr5o3a6wf	GGI Construction JV:T6413	Invoice: 11550-F\nPayment: Adjusted\nVendor: Jorge\nPayroll: Yes	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["adrian-ramos", "ramiro-valle", "ventura-hernandez"]}	2025-10-23 04:00:00+00	2025-10-25 04:00:00+00	\N	\N	\N
75593bb4-5711-42aa-a5a7-0d87a00e1564	cme9wqhpe0000ht8sr5o3a6wf	ALSTON CONSTRUCTION:SKY HARBOR PHASE II	Payment: Daily\nVendor: Tony\nPayroll: No	t		\N	\N	TEMP_FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["esteban-sanchez", "oscar-hernandez"]}	2025-10-27 04:00:00+00	2025-10-28 04:00:00+00	\N	\N	\N
13f435ae-dd4d-4ea2-a442-70fdeade596e	cme9wqhpe0000ht8sr5o3a6wf	STONEHENGE CONSTRUCTION, LLC: TRAZ POWELL STADIUM	Payment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["adrian-ramos", "ramiro-valle"]}	2025-10-28 04:00:00+00	2025-11-01 04:00:00+00	\N	\N	\N
3ce2efc7-df03-444e-8fef-5e7b759fedad	cme9wqhpe0000ht8sr5o3a6wf	ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK	Invoice: 12289-B\nPayment: Adjusted\nVendor: Jorge\nPayroll: Yes	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["carlos-manuel-diaz", "robert-amparo-lloret"]}	2025-10-22 04:00:00+00	2025-10-25 04:00:00+00	\N	\N	\N
a3714fec-e452-496a-a8bd-865b7ef6fc53	cme9wqhpe0000ht8sr5o3a6wf	NV2A	Invoice: 11686-O\nPayment: Daily\nVendor: Tony\nPayroll: No	t		\N	\N	TEMP_FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["esteban-sanchez", "oscar-hernandez"]}	2025-10-23 04:00:00+00	2025-10-24 04:00:00+00	\N	\N	\N
ab51c901-0d91-4d0c-b1dd-d18373d76af1	cme9wqhpe0000ht8sr5o3a6wf	PRINCE CONTRACTING: SUNTRAX PH 1A	Invoice: 12288\nPayment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["troy-sturgil", "nicholas-sieber", "john-robinson", "daniel-buell-burnette"]}	2025-10-23 04:00:00+00	2025-10-25 04:00:00+00	\N	\N	\N
eadd889b-b5b4-4652-8654-2b44e7188803	cme9wqhpe0000ht8sr5o3a6wf	HORIZON CONTRACTORS, INC.:T4551	Invoice: 11444-F\nPayment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	GUARDRAIL	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["fabian-marquez", "jaime-vergara", "joselin-aguila", "luis-penaranda", "pedro-manes", "carlos-manuel-diaz"]}	2025-10-27 04:00:00+00	2025-10-30 04:00:00+00	\N	\N	\N
b07f06eb-b038-4ca2-b0d6-45f623741d49	cme9wqhpe0000ht8sr5o3a6wf	PRINCE CONTRACTING:E8T81	Invoice: 11367-AA\nPayment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["alex-nelson", "john-robinson", "nicholas-sieber", "troy-sturgil", "daniel-buell-burnette"]}	2025-10-20 04:00:00+00	2025-10-23 04:00:00+00	\N	\N	\N
1ce9c70a-b3ea-44d7-97b2-bdc2da95374a	cme9wqhpe0000ht8sr5o3a6wf	HORIZON CONTRACTORS, INC.:T4551	Invoice: 11444-F\nPayment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	GUARDRAIL	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["fabian-marquez", "jaime-vergara", "joselin-aguila", "luis-penaranda", "pedro-manes"]}	2025-10-23 04:00:00+00	2025-10-25 04:00:00+00	\N	\N	\N
158f700f-167e-468f-abbd-e47f9c044340	cme9wqhpe0000ht8sr5o3a6wf	SOLE MIA PROPERTY OWNERS ASSOCIATION INC	Payment: Daily\nVendor: Tony\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["esteban-sanchez", "oscar-hernandez"]}	2025-10-21 04:00:00+00	2025-10-22 04:00:00+00	\N	\N	\N
11ba272a-8ef5-4a9d-9e73-d6e35229d1cb	cme9wqhpe0000ht8sr5o3a6wf	ALSTON CONSTRUCTION:SKY HARBOR PHASE II	Payment: Daily\nVendor: Tony\nPayroll: No	t		\N	\N	TEMP_FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["adrian-ramos", "ventura-hernandez"]}	2025-10-20 04:00:00+00	2025-10-21 04:00:00+00	\N	\N	\N
dfd122ff-a49a-406b-b5b7-41e05b72e3f0	cme9wqhpe0000ht8sr5o3a6wf	FERREIRA CONSTRUCTION COMPANY	Payment: Adjusted\nVendor: Tony\nPayroll: No	t		\N	\N	TEMP_FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["robert-amparo-lloret", "carlos-manuel-diaz", "ramiro-valle"]}	2025-10-20 04:00:00+00	2025-10-21 04:00:00+00	\N	\N	\N
6f4f37bd-9344-43e7-86b1-ede533077ec6	cme9wqhpe0000ht8sr5o3a6wf	FERREIRA CONSTRUCTION COMPANY	Payment: Adjusted\nVendor: Tony\nPayroll: No	t		\N	\N	TEMP_FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["robert-amparo-lloret", "carlos-manuel-diaz"]}	2025-10-21 04:00:00+00	2025-10-22 04:00:00+00	\N	\N	\N
c7ffb7a3-ae82-4059-a7e9-7617576dda96	cme9wqhpe0000ht8sr5o3a6wf	OPLH	Invoice: 12137-TEMP\nPayment: Daily\nVendor: Tony\nPayroll: No	t		\N	\N	TEMP_FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["esteban-sanchez", "oscar-hernandez"]}	2025-10-22 04:00:00+00	2025-10-23 04:00:00+00	\N	\N	\N
a5cf98b2-0ad5-46b1-bff0-45c10f0ec479	cme9wqhpe0000ht8sr5o3a6wf	OPLH	Invoice: 12137-TEMP\nPayment: Daily\nVendor: Tony\nPayroll: No	t		\N	\N	TEMP_FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["esteban-sanchez", "oscar-hernandez"]}	2025-10-24 04:00:00+00	2025-10-25 04:00:00+00	\N	\N	\N
e43ed2dc-196d-49b3-92a8-b17f7b064e31	cme9wqhpe0000ht8sr5o3a6wf	OZINGA	Invoice: 12134\nPayment: Adjusted\nVendor: Tony\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["moises-varela", "noel-venero"]}	2025-10-22 04:00:00+00	2025-10-25 04:00:00+00	\N	\N	\N
ba7b5196-fcd7-4912-ac19-3de7ec3d8b9b	cme9wqhpe0000ht8sr5o3a6wf	HALLEY ENGINEERING CONTRACTORS, INC:E8T44	Invoice: 11189-G\nPayment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["yonisbel-fonseca"]}	2025-10-20 04:00:00+00	2025-10-25 04:00:00+00	\N	\N	\N
2d6dd91d-2622-474d-9047-05eb875213f8	cme9wqhpe0000ht8sr5o3a6wf	ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - CONTRACT	Invoice: 12292-A\nPayment: Adjusted\nVendor: Jorge\nPayroll: Yes	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["moises-varela", "noel-venero"]}	2025-10-27 04:00:00+00	2025-10-31 04:00:00+00	\N	\N	\N
38280f7d-c1c6-4180-9463-5811ed690753	cme9wqhpe0000ht8sr5o3a6wf	WEEKLEY ASPHALT: T6601	Payment: Daily\nVendor: Jorge\nPayroll: Yes	t		\N	\N	GUARDRAIL	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["pedro-manes", "jaime-vergara", "luis-penaranda"]}	2025-10-22 04:00:00+00	2025-10-23 04:00:00+00	\N	\N	\N
f90a032e-5912-48c5-ac85-ecfec828c01e	cme9wqhpe0000ht8sr5o3a6wf	OHLA:T4682	Payment: Daily\nVendor: Jorge\nPayroll: Yes	t		\N	\N	GUARDRAIL	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["luis-penaranda", "pedro-manes", "jaime-vergara"]}	2025-10-22 04:00:00+00	2025-10-23 04:00:00+00	\N	\N	\N
77ea3e2d-ff6f-4faa-8285-2c211b780bdc	cme9wqhpe0000ht8sr5o3a6wf	ARCHER WESTERN CONSTRUCTION , LLC:I95 EXPRESS LANES PH 3C - PO WORK	Invoice: 12292\nPayment: Daily\nVendor: Jorge\nPayroll: Yes	t		\N	\N	GUARDRAIL	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["jaime-vergara", "luis-penaranda", "pedro-manes"]}	2025-10-21 04:00:00+00	2025-10-22 04:00:00+00	\N	\N	\N
98b19583-e1f3-4451-a04a-8f1e4000acd5	cme9wqhpe0000ht8sr5o3a6wf	GGI Construction JV:T6413	Invoice: 11550-F\nPayment: Adjusted\nVendor: Jorge\nPayroll: Yes	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["adrian-ramos", "ramiro-valle"]}	2025-10-27 04:00:00+00	2025-10-29 04:00:00+00	\N	\N	\N
501a234a-c262-4199-b93a-129e4d1be7d9	cme9wqhpe0000ht8sr5o3a6wf	PRINCE CONTRACTING: SUNTRAX PH 1A	Invoice: 12288\nPayment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["troy-sturgil", "nicholas-sieber", "john-robinson", "daniel-buell-burnette"]}	2025-10-27 04:00:00+00	2025-10-28 04:00:00+00	\N	\N	\N
649f76b2-27a4-475c-96ae-275946117bb6	cme9wqhpe0000ht8sr5o3a6wf	TRANS FLORIDA DEVELOPMENT	Payment: Daily\nVendor: Tony\nPayroll: No	t		\N	\N	GUARDRAIL	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["fabian-marquez", "joselin-aguila"]}	2025-10-21 04:00:00+00	2025-10-23 04:00:00+00	\N	\N	\N
42447280-aef5-4d3c-b70c-e4d3114ffe06	cme9wqhpe0000ht8sr5o3a6wf	TRIDENT TRUCKING	Payment: Daily\nVendor: Tony\nPayroll: No	t		\N	\N	GUARDRAIL	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["joselin-aguila", "fabian-marquez"]}	2025-10-20 04:00:00+00	2025-10-21 04:00:00+00	\N	\N	\N
c8886847-b897-4571-9e50-02267ef19e5c	cme9wqhpe0000ht8sr5o3a6wf	GENERAL ASPHALT:T6604	Payment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	GUARDRAIL	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": []}	2025-10-29 04:00:00+00	2025-10-30 04:00:00+00	\N	\N	\N
32104ef3-c75b-4fc3-ae5c-86a2e86f63e8	cme9wqhpe0000ht8sr5o3a6wf	HALLEY ENGINEERING CONTRACTORS, INC:E8T44	Invoice: 11189-G\nPayment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["yonisbel-fonseca"]}	2025-10-27 04:00:00+00	2025-11-01 04:00:00+00	\N	\N	\N
732a7d00-2f09-40e3-9430-9526719d85ca	cme9wqhpe0000ht8sr5o3a6wf	PRINCE CONTRACTING: SUNTRAX PH 1A	Invoice: 12288\nPayment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["troy-sturgil", "nicholas-sieber", "john-robinson", "daniel-buell-burnette", "robert-amparo-lloret", "ventura-hernandez"]}	2025-10-28 04:00:00+00	2025-10-29 04:00:00+00	\N	\N	\N
e22d98eb-ca0a-4295-8519-b51e382e1f3d	cme9wqhpe0000ht8sr5o3a6wf	PRINCE CONTRACTING: SUNTRAX PH 1A	Invoice: 12288\nPayment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["troy-sturgil", "nicholas-sieber", "john-robinson", "daniel-buell-burnette"]}	2025-10-29 04:00:00+00	2025-11-01 04:00:00+00	\N	\N	\N
cmeipcfw20001l204ec76pn4c	cme9wqhpe0000ht8sr5o3a6wf	NV2A	Fonseca\nEsteban and Oscar	t	\N	\N	\N	TEMP_FENCE	\N	{"employees": ["esteban-sanchez", "oscar-hernandez", "adrian-ramos"]}	2025-08-18 04:00:00+00	2025-08-23 04:00:00+00	\N	\N	\N
cmeh19bcv0005hte8yhz270s9	cme9wqhpe0000ht8sr5o3a6wf	Downrite	Robert and Carlos	t	\N	\N	\N	TEMP_FENCE	\N	{"employees": ["carlos-manuel-diaz", "robert-amparo-lloret", "robert-gomez"]}	2025-08-18 04:00:00+00	2025-08-23 04:00:00+00	\N	\N	\N
cmeh19rdy0007hte8dx6lxbce	cme9wqhpe0000ht8sr5o3a6wf	Horse Power Eletric 	\N	t	\N	\N	\N	GUARDRAIL	\N	null	2025-08-18 04:00:00+00	2025-08-23 04:00:00+00	\N	\N	\N
cmeh18s9y0003hte8pq8mnzzn	cme9wqhpe0000ht8sr5o3a6wf	Central Civil: NDWWTP	\N	t	\N	\N	\N	FENCE	\N	null	2025-08-18 04:00:00+00	2025-08-23 04:00:00+00	\N	\N	\N
cmeihiuym0001js043gfrl7bd	cme9wqhpe0000ht8sr5o3a6wf	AW: I-95 	Moises to do fence repair	t	\N	\N	\N	FENCE	\N	{"employees": ["moises-varela"]}	2025-08-19 04:00:00+00	2025-08-20 04:00:00+00	\N	\N	\N
cmelyiefq0001ii04kkl8o1go	cme9wqhpe0000ht8sr5o3a6wf	AW: I-95 & Downrite	Joselin	t	\N	\N	\N	GUARDRAIL	\N	{"employees": ["joselin-aguila"]}	2025-08-22 04:00:00+00	2025-08-23 04:00:00+00	\N	\N	\N
cmelyhkl80001ju043q91jozd	cme9wqhpe0000ht8sr5o3a6wf	H & R: 268th St	Moises and Noel	t	\N	\N	\N	FENCE	\N	{"employees": ["moises-varela", "noel-venero"]}	2025-08-22 04:00:00+00	2025-08-23 04:00:00+00	\N	\N	\N
cmerau87m0001kz043fbqfub0	cme9wqhpe0000ht8sr5o3a6wf	Horse Power Eletric 	\N	t	\N	\N	\N	GUARDRAIL	\N	null	2025-08-25 04:00:00+00	2025-08-26 04:00:00+00	\N	\N	\N
cmeiq6gbc0001lg04b6ckewdu	cme9wqhpe0000ht8sr5o3a6wf	Lead Engineering: Port Everglades	Fonseca 	t	\N	\N	\N	FENCE	\N	{"employees": ["adrian-ramos"]}	2025-08-25 04:00:00+00	2025-08-29 04:00:00+00	\N	\N	\N
cmehc7cnv0003ju04hhj7x6kx	cme9wqhpe0000ht8sr5o3a6wf	Trident Trucking	Robert G., Joselin, and Fabian	t	\N	\N	\N	GUARDRAIL	\N	{"employees": ["robert-gomez", "fabian-marquez", "joselin-aguila", "robert-amparo-lloret"]}	2025-08-25 04:00:00+00	2025-08-30 04:00:00+00	\N	\N	\N
cmehc6khm0001ju04n7nhxipg	cme9wqhpe0000ht8sr5o3a6wf	Ranger Construction: Boca Airport	Invoice 12210\nAlex Fence	t	\N	\N	\N	FENCE	\N	null	2025-08-25 04:00:00+00	2025-08-27 04:00:00+00	\N	\N	\N
cmeiqpvfk0003l804opcw0ah0	cme9wqhpe0000ht8sr5o3a6wf	Coral Gables Temp Fence	Moises and Noel	t	\N	\N	\N	TEMP_FENCE	\N	{"employees": ["moises-varela", "noel-venero"]}	2025-08-25 04:00:00+00	2025-08-28 04:00:00+00	\N	\N	\N
cmeraw4g50003kz04bfr088ji	cme9wqhpe0000ht8sr5o3a6wf	AW: Bridge	\N	t	\N	\N	\N	GUARDRAIL	\N	null	2025-08-26 04:00:00+00	2025-08-27 04:00:00+00	\N	\N	\N
cmerds1i00001l40402pnidy9	cme9wqhpe0000ht8sr5o3a6wf	NV2A	Robert A.	t	\N	\N	\N	FENCE	\N	{"employees": ["robert-amparo-lloret", "robert-gomez"]}	2025-08-26 04:00:00+00	2025-08-28 04:00:00+00	\N	\N	\N
cmesv13el0001l404c9bf29w3	cme9wqhpe0000ht8sr5o3a6wf	LTS: Alligator Alcatraz	\N	t	\N	\N	\N	FENCE	\N	null	2025-08-27 04:00:00+00	2025-08-28 04:00:00+00	\N	\N	\N
cmerb29hu0005kz0440etxk58	cme9wqhpe0000ht8sr5o3a6wf	Downrite	\N	t	\N	\N	\N	GUARDRAIL	\N	null	2025-08-27 04:00:00+00	2025-08-28 04:00:00+00	\N	\N	\N
cmehcdwvh0009ju04hzkx5rx7	cme9wqhpe0000ht8sr5o3a6wf	Central Civil: Underline 3-9 Fence Repair	Invoice 12250\nJony Welder\nWednesday Jose cant go find replacement	t	\N	\N	\N	FENCE	\N	{"employees": ["jony-baquedano-mendoza", "jose-fernandez", "jose-santos-diaz"]}	2025-08-28 04:00:00+00	2025-08-30 04:00:00+00	\N	\N	\N
cmelqbck90003jr04c7g39eas	cme9wqhpe0000ht8sr5o3a6wf	Labor Day	\N	t	\N	\N	\N	\N	\N	null	2025-09-01 04:00:00+00	2025-09-02 04:00:00+00	\N	\N	\N
cmevjx8ia0001jr04n9pqxzk6	cme9wqhpe0000ht8sr5o3a6wf	Alston Construction: Sky Harbour	Esteban	t	\N	\N	\N	TEMP_FENCE	\N	{"employees": ["esteban-sanchez"]}	2025-09-02 04:00:00+00	2025-09-03 04:00:00+00	\N	\N	\N
cmekbo3gf0001ie04zcjq5aj3	cme9wqhpe0000ht8sr5o3a6wf	AW: I-95 	quarter spacing with nested panels and all special post	t	\N	\N	\N	GUARDRAIL	\N	null	2025-09-02 04:00:00+00	2025-09-05 04:00:00+00	\N	\N	\N
cmehftdh20001l104555w0owu	cme9wqhpe0000ht8sr5o3a6wf	Master Excavators	Check if ready	t	\N	\N	\N	GUARDRAIL	\N	null	2025-09-02 04:00:00+00	2025-09-04 04:00:00+00	\N	\N	\N
cmehc8nqz0005ju0499rap729	cme9wqhpe0000ht8sr5o3a6wf	General Asphalt: E4X25	Invoice 11973-A	t	\N	\N	\N	GUARDRAIL	\N	null	2025-09-02 04:00:00+00	2025-09-03 04:00:00+00	\N	\N	\N
cmeiqkswb0001l80405gqwquo	cme9wqhpe0000ht8sr5o3a6wf	Solemia/Oleta	1,200 with screen\n\nMoises and Noel	t	\N	\N	\N	FENCE	\N	{"employees": ["moises-varela", "noel-venero"]}	2025-09-02 04:00:00+00	2025-09-06 04:00:00+00	\N	\N	\N
cmer2d4qs0001l7040de7p1t2	cme9wqhpe0000ht8sr5o3a6wf	DP Development	Jony, Jose, and Flaco for Friday with bobcat	t	\N	\N	\N	FENCE	\N	{"employees": ["jony-baquedano-mendoza", "jose-fernandez", "jose-santos-diaz"]}	2025-09-02 04:00:00+00	2025-09-04 04:00:00+00	\N	\N	\N
cmeiqh9hh0001l804s21l6lzg	cme9wqhpe0000ht8sr5o3a6wf	Jaxi *Not confirmed*	7 temp gates\nAdrian	t	\N	\N	\N	TEMP_FENCE	\N	{"employees": ["adrian-ramos"]}	2025-09-03 04:00:00+00	2025-09-05 04:00:00+00	\N	\N	\N
cmek9uxm80001kz04luqbzc94	cme9wqhpe0000ht8sr5o3a6wf	GGI: T6413	GATE POST	t	\N	\N	\N	FENCE	\N	null	2025-09-04 04:00:00+00	2025-09-05 04:00:00+00	\N	\N	\N
cmelh7r970001l5042gwveap9	cme9wqhpe0000ht8sr5o3a6wf	OHLA: T4682	\N	t	\N	\N	\N	GUARDRAIL	\N	null	2025-09-08 04:00:00+00	2025-09-10 04:00:00+00	\N	\N	\N
cmelh8ptu0003l5043kmq6ay1	cme9wqhpe0000ht8sr5o3a6wf	OHLA: T4682	Bullet Rail Double: 153 LF\nHandrail Aluminum: 14 LF 	t	\N	\N	\N	HANDRAIL	\N	null	2025-09-08 04:00:00+00	2025-09-11 04:00:00+00	\N	\N	\N
cmehc95af0007ju04fv35x4p1	cme9wqhpe0000ht8sr5o3a6wf	Halley Engineering: T6413	3 Lift stations\n82 Bollards intotal\nConfirm with Justin\nInvoice	t	\N	\N	\N	FENCE	\N	null	2025-09-15 04:00:00+00	2025-09-20 04:00:00+00	\N	\N	\N
cmevk9lv40001l204fsqbzlvb	cme9wqhpe0000ht8sr5o3a6wf	OHLA: Joel Blvd	150 removal\n150 install\n2 parallels	t	\N	\N	\N	GUARDRAIL	\N	null	2025-09-15 04:00:00+00	2025-09-17 04:00:00+00	\N	\N	\N
cmeubu39i0001jr043y690ly2	cme9wqhpe0000ht8sr5o3a6wf	Halley Engineering E8T44	\N	t	\N	\N	\N	FENCE	\N	null	2025-09-15 04:00:00+00	2025-09-20 04:00:00+00	\N	\N	\N
cmevdf5aq0001le04jf3gcw1x	cme9wqhpe0000ht8sr5o3a6wf	Halley Engineering: T6413	Lubravich\nConfirm with Justin\nInvoice	t	\N	\N	\N	FENCE	\N	null	2025-09-15 04:00:00+00	2025-09-20 04:00:00+00	\N	\N	\N
2d6e544e-85ce-4c16-b2e8-98b322fc89fc	cme9wqhpe0000ht8sr5o3a6wf	DOWNRITE ENGINEERING	Payment: Adjusted\nVendor: Tony\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["moises-varela", "noel-venero"]}	2025-10-21 04:00:00+00	2025-10-22 04:00:00+00	\N	\N	\N
6c02802c-4f44-4723-9c88-20e466b63c8e	cme9wqhpe0000ht8sr5o3a6wf	SOLE MIA PROPERTY OWNERS ASSOCIATION INC	Payment: Daily\nVendor: Tony\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["esteban-sanchez", "oscar-hernandez"]}	2025-10-20 04:00:00+00	2025-10-21 04:00:00+00	\N	\N	\N
caf946db-1822-4446-89d0-1b20ecddffec	cme9wqhpe0000ht8sr5o3a6wf	HALLEY ENGINEERING CONTRACTORS, INC:E8T44	Invoice: 11189-G, 12301\nPayment: Daily\nVendor: Jorge\nPayroll: No	t		\N	\N	FENCE	DAY	{"locate": {"ticket": "", "expires": "", "contacted": false, "requested": ""}, "subtasks": [], "employees": ["adrian-ramos", "ventura-hernandez", "ramiro-valle"]}	2025-10-21 04:00:00+00	2025-10-23 04:00:00+00	\N	\N	\N
cmek35hv30001ii04ipd83fyu	cme9wqhpe0000ht8sr5o3a6wf	OHLA: Joel Blvd	Payroll: No\nIn Leigh High Acres	t		\N	\N	GUARDRAIL	\N	{"employees": ["adrian-ramos", "ventura-hernandez", "ramiro-valle"]}	2025-11-17 05:00:00+00	2025-11-20 05:00:00+00	\N	\N	\N
\.


--
-- Data for Name: EventAssignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EventAssignment" (id, "eventId", "employeeId", "dayOverride", hours, note, "createdAt", "updatedAt") FROM stdin;
cmeipcfw20001l204ec76pn4c-esteban-sanchez	cmeipcfw20001l204ec76pn4c	esteban-sanchez	\N	\N	\N	2025-10-22 23:42:33.139	2025-10-22 23:42:33.139
cmeipcfw20001l204ec76pn4c-oscar-hernandez	cmeipcfw20001l204ec76pn4c	oscar-hernandez	\N	\N	\N	2025-10-22 23:42:33.722	2025-10-22 23:42:33.722
cmeipcfw20001l204ec76pn4c-adrian-ramos	cmeipcfw20001l204ec76pn4c	adrian-ramos	\N	\N	\N	2025-10-22 23:42:34.027	2025-10-22 23:42:34.027
cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	cmeh19bcv0005hte8yhz270s9	carlos-manuel-diaz	\N	\N	\N	2025-10-22 23:42:34.346	2025-10-22 23:42:34.346
cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	cmeh19bcv0005hte8yhz270s9	robert-amparo-lloret	\N	\N	\N	2025-10-22 23:42:34.676	2025-10-22 23:42:34.676
cmeh19bcv0005hte8yhz270s9-robert-gomez	cmeh19bcv0005hte8yhz270s9	robert-gomez	\N	\N	\N	2025-10-22 23:42:34.879	2025-10-22 23:42:34.879
cmeihiuym0001js043gfrl7bd-moises-varela	cmeihiuym0001js043gfrl7bd	moises-varela	\N	\N	\N	2025-10-22 23:42:35.354	2025-10-22 23:42:35.354
cmelyiefq0001ii04kkl8o1go-joselin-aguila	cmelyiefq0001ii04kkl8o1go	joselin-aguila	\N	\N	\N	2025-10-22 23:42:35.721	2025-10-22 23:42:35.721
cmelyhkl80001ju043q91jozd-moises-varela	cmelyhkl80001ju043q91jozd	moises-varela	\N	\N	\N	2025-10-22 23:42:36.018	2025-10-22 23:42:36.018
cmelyhkl80001ju043q91jozd-noel-venero	cmelyhkl80001ju043q91jozd	noel-venero	\N	\N	\N	2025-10-22 23:42:36.291	2025-10-22 23:42:36.291
cmeiq6gbc0001lg04b6ckewdu-adrian-ramos	cmeiq6gbc0001lg04b6ckewdu	adrian-ramos	\N	\N	\N	2025-10-22 23:42:36.622	2025-10-22 23:42:36.622
cmehc7cnv0003ju04hhj7x6kx-robert-gomez	cmehc7cnv0003ju04hhj7x6kx	robert-gomez	\N	\N	\N	2025-10-22 23:42:36.932	2025-10-22 23:42:36.932
cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	cmehc7cnv0003ju04hhj7x6kx	fabian-marquez	\N	\N	\N	2025-10-22 23:42:37.256	2025-10-22 23:42:37.256
cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	cmehc7cnv0003ju04hhj7x6kx	joselin-aguila	\N	\N	\N	2025-10-22 23:42:37.455	2025-10-22 23:42:37.455
cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	cmehc7cnv0003ju04hhj7x6kx	robert-amparo-lloret	\N	\N	\N	2025-10-22 23:42:37.782	2025-10-22 23:42:37.782
cmeiqpvfk0003l804opcw0ah0-moises-varela	cmeiqpvfk0003l804opcw0ah0	moises-varela	\N	\N	\N	2025-10-22 23:42:38.115	2025-10-22 23:42:38.115
cmeiqpvfk0003l804opcw0ah0-noel-venero	cmeiqpvfk0003l804opcw0ah0	noel-venero	\N	\N	\N	2025-10-22 23:42:38.384	2025-10-22 23:42:38.384
cmerds1i00001l40402pnidy9-robert-amparo-lloret	cmerds1i00001l40402pnidy9	robert-amparo-lloret	\N	\N	\N	2025-10-22 23:42:38.831	2025-10-22 23:42:38.831
cmerds1i00001l40402pnidy9-robert-gomez	cmerds1i00001l40402pnidy9	robert-gomez	\N	\N	\N	2025-10-22 23:42:39.025	2025-10-22 23:42:39.025
cmehcdwvh0009ju04hzkx5rx7-jony-baquedano-mendoza	cmehcdwvh0009ju04hzkx5rx7	jony-baquedano-mendoza	\N	\N	\N	2025-10-22 23:42:39.483	2025-10-22 23:42:39.483
cmehcdwvh0009ju04hzkx5rx7-jose-fernandez	cmehcdwvh0009ju04hzkx5rx7	jose-fernandez	\N	\N	\N	2025-10-22 23:42:39.771	2025-10-22 23:42:39.771
cmehcdwvh0009ju04hzkx5rx7-jose-santos-diaz	cmehcdwvh0009ju04hzkx5rx7	jose-santos-diaz	\N	\N	\N	2025-10-22 23:42:40.036	2025-10-22 23:42:40.036
cmevjx8ia0001jr04n9pqxzk6-esteban-sanchez	cmevjx8ia0001jr04n9pqxzk6	esteban-sanchez	\N	\N	\N	2025-10-22 23:42:40.446	2025-10-22 23:42:40.446
cmeiqkswb0001l80405gqwquo-moises-varela	cmeiqkswb0001l80405gqwquo	moises-varela	\N	\N	\N	2025-10-22 23:42:41.096	2025-10-22 23:42:41.096
cmeiqkswb0001l80405gqwquo-noel-venero	cmeiqkswb0001l80405gqwquo	noel-venero	\N	\N	\N	2025-10-22 23:42:41.452	2025-10-22 23:42:41.452
cmer2d4qs0001l7040de7p1t2-jony-baquedano-mendoza	cmer2d4qs0001l7040de7p1t2	jony-baquedano-mendoza	\N	\N	\N	2025-10-22 23:42:41.785	2025-10-22 23:42:41.785
cmer2d4qs0001l7040de7p1t2-jose-fernandez	cmer2d4qs0001l7040de7p1t2	jose-fernandez	\N	\N	\N	2025-10-22 23:42:42.052	2025-10-22 23:42:42.052
cmer2d4qs0001l7040de7p1t2-jose-santos-diaz	cmer2d4qs0001l7040de7p1t2	jose-santos-diaz	\N	\N	\N	2025-10-22 23:42:42.539	2025-10-22 23:42:42.539
cmeiqh9hh0001l804s21l6lzg-adrian-ramos	cmeiqh9hh0001l804s21l6lzg	adrian-ramos	\N	\N	\N	2025-10-22 23:42:42.833	2025-10-22 23:42:42.833
cmek35hv30001ii04ipd83fyu-adrian-ramos	cmek35hv30001ii04ipd83fyu	adrian-ramos	\N	\N	\N	2025-10-22 23:42:43.599	2025-10-22 23:42:43.599
cmek35hv30001ii04ipd83fyu-ventura-hernandez	cmek35hv30001ii04ipd83fyu	ventura-hernandez	\N	\N	\N	2025-10-22 23:42:43.921	2025-10-22 23:42:43.921
cmek35hv30001ii04ipd83fyu-ramiro-valle	cmek35hv30001ii04ipd83fyu	ramiro-valle	\N	\N	\N	2025-10-22 23:42:44.185	2025-10-22 23:42:44.185
\.


--
-- Data for Name: EventQuantity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EventQuantity" (id, "eventId", "payItemId", quantity, "stationFrom", "stationTo", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Holiday; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Holiday" (id, date, "localName", name, "countryCode", regions, types, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: HourlyRate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."HourlyRate" (id, "employeeId", "effectiveDate", rate, "createdAt") FROM stdin;
cmh2n1o6j0001s97fop3yvw46	adrian-ramos	2025-01-01	25.00	2025-10-22 23:42:31.3
cmh2n1o6j0003s97fc4bgctug	carlos-manuel-diaz	2025-01-01	17.00	2025-10-22 23:42:31.3
cmh2n1o6j0005s97frr9smotp	christopher-jones	2025-01-01	28.00	2025-10-22 23:42:31.3
cmh2n1o6j0007s97fsrjqgb1a	daniel-buell-burnette	2025-01-01	19.50	2025-10-22 23:42:31.3
cmh2n1o6j0009s97f85tj142a	edilberto-acuna	2025-01-01	25.50	2025-10-22 23:42:31.3
cmh2n1o6j000bs97fwm2bu89w	esteban-sanchez	2025-01-01	15.00	2025-10-22 23:42:31.3
cmh2n1o6j000ds97fg0ryobau	fabian-marquez	2025-01-01	25.00	2025-10-22 23:42:31.3
cmh2n1o6k000fs97fuewq53od	gerardo-oliva	2025-01-01	25.00	2025-10-22 23:42:31.3
cmh2n1o6k000hs97fbfeqzsjg	jaime-vergara	2025-01-01	28.00	2025-10-22 23:42:31.3
cmh2n1o6k000js97fj9hgp1ut	jony-baquedano-mendoza	2025-01-01	31.00	2025-10-22 23:42:31.3
cmh2n1o6k000ls97fx2qyogtt	jose-fernandez	2025-01-01	23.00	2025-10-22 23:42:31.3
cmh2n1o6k000ns97f4qo2zcab	jose-santos-diaz	2025-01-01	17.00	2025-10-22 23:42:31.3
cmh2n1o6k000ps97fpv2xt8xn	joselin-aguila	2025-01-01	21.50	2025-10-22 23:42:31.3
cmh2n1o6k000rs97f02i98f0b	luis-penaranda	2025-01-01	19.00	2025-10-22 23:42:31.3
cmh2n1o6k000ts97f2pj1pqix	moises-varela	2025-01-01	28.00	2025-10-22 23:42:31.3
cmh2n1o6k000vs97fx98x2vax	nicholas-sieber	2025-01-01	28.00	2025-10-22 23:42:31.3
cmh2n1o6k000xs97fln6tkxeq	noel-venero	2025-01-01	18.00	2025-10-22 23:42:31.3
cmh2n1o6k000zs97fwv803ccy	oscar-hernandez	2025-01-01	15.00	2025-10-22 23:42:31.3
cmh2n1o6k0011s97ffsll83hl	pedro-manes	2025-01-01	23.00	2025-10-22 23:42:31.3
cmh2n1o6k0013s97f470lf3y8	ramiro-valle	2025-01-01	15.00	2025-10-22 23:42:31.3
cmh2n1o6k0015s97fpfc9m4sz	robert-amparo-lloret	2025-01-01	18.25	2025-10-22 23:42:31.3
cmh2n1o6k0017s97fle4j607g	robert-gomez	2025-01-01	19.00	2025-10-22 23:42:31.3
cmh2n1o6k0019s97fybzofmzd	troy-sturgil	2025-01-01	19.00	2025-10-22 23:42:31.3
cmh2n1o6k001bs97f4rzcwh8v	ventura-hernandez	2025-01-01	23.00	2025-10-22 23:42:31.3
\.


--
-- Data for Name: InventoryCategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryCategory" (id, name, slug, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: InventoryCheckout; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryCheckout" (id, "itemId", qty, "fromLocationId", "toEmployeeId", "toEventId", "toLocationId", "dueAt", "checkedOutById", "checkedOutAt", status, "closedAt") FROM stdin;
\.


--
-- Data for Name: InventoryItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryItem" (id, sku, name, description, unit, "isConsumable", "minStock", barcode, "categoryId", "defaultLocationId", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: InventoryLedger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryLedger" (id, "itemId", "deltaQty", "fromLocationId", "toLocationId", reason, "refType", "refId", "actorId", at, notes) FROM stdin;
\.


--
-- Data for Name: InventoryLocation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryLocation" (id, name, code, "isTruck", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: InventoryReservation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryReservation" (id, "itemId", "eventId", qty, "neededAt", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: InventoryReturn; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryReturn" (id, "checkoutId", qty, "toLocationId", condition, notes, "photoUrl", "checkedInById", "checkedInAt") FROM stdin;
\.


--
-- Data for Name: InventoryStock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryStock" (id, "itemId", "locationId", qty, "updatedAt") FROM stdin;
\.


--
-- Data for Name: InventoryTransfer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryTransfer" (id, "itemId", "fromLocationId", "toLocationId", qty, status, "requestedAt", "fulfilledAt", notes) FROM stdin;
\.


--
-- Data for Name: LaborDaily; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LaborDaily" (id, "jobId", "jobName", day, "eventId", "eventTitle", "employeeId", "employeeName", "assignmentId", "hoursDecimal", "regularHours", "overtimeHours", "rateUsd", "regularCostUsd", "overtimeCostUsd", "totalCostUsd", note, "createdAt", "updatedAt") FROM stdin;
2025-08-18-cmeipcfw20001l204ec76pn4c-esteban-sanchez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-18	cmeipcfw20001l204ec76pn4c	NV2A	esteban-sanchez	Esteban Sanchez	cmeipcfw20001l204ec76pn4c-esteban-sanchez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-18-cmeipcfw20001l204ec76pn4c-oscar-hernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-18	cmeipcfw20001l204ec76pn4c	NV2A	oscar-hernandez	Oscar Hernandez	cmeipcfw20001l204ec76pn4c-oscar-hernandez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-18-cmeipcfw20001l204ec76pn4c-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-18	cmeipcfw20001l204ec76pn4c	NV2A	adrian-ramos	Adrian Ramos	cmeipcfw20001l204ec76pn4c-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-19-cmeipcfw20001l204ec76pn4c-esteban-sanchez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-19	cmeipcfw20001l204ec76pn4c	NV2A	esteban-sanchez	Esteban Sanchez	cmeipcfw20001l204ec76pn4c-esteban-sanchez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-19-cmeipcfw20001l204ec76pn4c-oscar-hernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-19	cmeipcfw20001l204ec76pn4c	NV2A	oscar-hernandez	Oscar Hernandez	cmeipcfw20001l204ec76pn4c-oscar-hernandez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-19-cmeipcfw20001l204ec76pn4c-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-19	cmeipcfw20001l204ec76pn4c	NV2A	adrian-ramos	Adrian Ramos	cmeipcfw20001l204ec76pn4c-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-20-cmeipcfw20001l204ec76pn4c-esteban-sanchez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-20	cmeipcfw20001l204ec76pn4c	NV2A	esteban-sanchez	Esteban Sanchez	cmeipcfw20001l204ec76pn4c-esteban-sanchez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-20-cmeipcfw20001l204ec76pn4c-oscar-hernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-20	cmeipcfw20001l204ec76pn4c	NV2A	oscar-hernandez	Oscar Hernandez	cmeipcfw20001l204ec76pn4c-oscar-hernandez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-20-cmeipcfw20001l204ec76pn4c-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-20	cmeipcfw20001l204ec76pn4c	NV2A	adrian-ramos	Adrian Ramos	cmeipcfw20001l204ec76pn4c-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-21-cmeipcfw20001l204ec76pn4c-esteban-sanchez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-21	cmeipcfw20001l204ec76pn4c	NV2A	esteban-sanchez	Esteban Sanchez	cmeipcfw20001l204ec76pn4c-esteban-sanchez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-21-cmeipcfw20001l204ec76pn4c-oscar-hernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-21	cmeipcfw20001l204ec76pn4c	NV2A	oscar-hernandez	Oscar Hernandez	cmeipcfw20001l204ec76pn4c-oscar-hernandez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-21-cmeipcfw20001l204ec76pn4c-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-21	cmeipcfw20001l204ec76pn4c	NV2A	adrian-ramos	Adrian Ramos	cmeipcfw20001l204ec76pn4c-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-22-cmeipcfw20001l204ec76pn4c-esteban-sanchez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-22	cmeipcfw20001l204ec76pn4c	NV2A	esteban-sanchez	Esteban Sanchez	cmeipcfw20001l204ec76pn4c-esteban-sanchez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:42:55.732	2025-10-22 23:42:55.732
2025-08-22-cmeipcfw20001l204ec76pn4c-oscar-hernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-22	cmeipcfw20001l204ec76pn4c	NV2A	oscar-hernandez	Oscar Hernandez	cmeipcfw20001l204ec76pn4c-oscar-hernandez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-22-cmeipcfw20001l204ec76pn4c-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-22	cmeipcfw20001l204ec76pn4c	NV2A	adrian-ramos	Adrian Ramos	cmeipcfw20001l204ec76pn4c-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-18-cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-18	cmeh19bcv0005hte8yhz270s9	Downrite	carlos-manuel-diaz	Carlos Manuel Diaz	cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	8.00	8.00	0.00	17.00	136.00	0.00	136.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-18-cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-18	cmeh19bcv0005hte8yhz270s9	Downrite	robert-amparo-lloret	Robert Amparo Lloret	cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-18-cmeh19bcv0005hte8yhz270s9-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-18	cmeh19bcv0005hte8yhz270s9	Downrite	robert-gomez	Robert Gomez	cmeh19bcv0005hte8yhz270s9-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-19-cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-19	cmeh19bcv0005hte8yhz270s9	Downrite	carlos-manuel-diaz	Carlos Manuel Diaz	cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	8.00	8.00	0.00	17.00	136.00	0.00	136.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-19-cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-19	cmeh19bcv0005hte8yhz270s9	Downrite	robert-amparo-lloret	Robert Amparo Lloret	cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-19-cmeh19bcv0005hte8yhz270s9-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-19	cmeh19bcv0005hte8yhz270s9	Downrite	robert-gomez	Robert Gomez	cmeh19bcv0005hte8yhz270s9-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-20-cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-20	cmeh19bcv0005hte8yhz270s9	Downrite	carlos-manuel-diaz	Carlos Manuel Diaz	cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	8.00	8.00	0.00	17.00	136.00	0.00	136.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-20-cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-20	cmeh19bcv0005hte8yhz270s9	Downrite	robert-amparo-lloret	Robert Amparo Lloret	cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-20-cmeh19bcv0005hte8yhz270s9-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-20	cmeh19bcv0005hte8yhz270s9	Downrite	robert-gomez	Robert Gomez	cmeh19bcv0005hte8yhz270s9-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-21-cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-21	cmeh19bcv0005hte8yhz270s9	Downrite	carlos-manuel-diaz	Carlos Manuel Diaz	cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	8.00	8.00	0.00	17.00	136.00	0.00	136.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-21-cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-21	cmeh19bcv0005hte8yhz270s9	Downrite	robert-amparo-lloret	Robert Amparo Lloret	cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-21-cmeh19bcv0005hte8yhz270s9-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-21	cmeh19bcv0005hte8yhz270s9	Downrite	robert-gomez	Robert Gomez	cmeh19bcv0005hte8yhz270s9-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-22-cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-22	cmeh19bcv0005hte8yhz270s9	Downrite	carlos-manuel-diaz	Carlos Manuel Diaz	cmeh19bcv0005hte8yhz270s9-carlos-manuel-diaz	8.00	8.00	0.00	17.00	136.00	0.00	136.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-22-cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-22	cmeh19bcv0005hte8yhz270s9	Downrite	robert-amparo-lloret	Robert Amparo Lloret	cmeh19bcv0005hte8yhz270s9-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-22-cmeh19bcv0005hte8yhz270s9-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-22	cmeh19bcv0005hte8yhz270s9	Downrite	robert-gomez	Robert Gomez	cmeh19bcv0005hte8yhz270s9-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.733	2025-10-22 23:42:55.733
2025-08-19-cmeihiuym0001js043gfrl7bd-moises-varela	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-19	cmeihiuym0001js043gfrl7bd	AW: I-95 	moises-varela	Moises Varela	cmeihiuym0001js043gfrl7bd-moises-varela	8.00	8.00	0.00	28.00	224.00	0.00	224.00	\N	2025-10-22 23:42:55.734	2025-10-22 23:42:55.734
2025-08-22-cmelyiefq0001ii04kkl8o1go-joselin-aguila	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-22	cmelyiefq0001ii04kkl8o1go	AW: I-95 & Downrite	joselin-aguila	Joselin Aguila	cmelyiefq0001ii04kkl8o1go-joselin-aguila	8.00	8.00	0.00	21.50	172.00	0.00	172.00	\N	2025-10-22 23:42:55.734	2025-10-22 23:42:55.734
2025-08-22-cmelyhkl80001ju043q91jozd-moises-varela	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-22	cmelyhkl80001ju043q91jozd	H & R: 268th St	moises-varela	Moises Varela	cmelyhkl80001ju043q91jozd-moises-varela	8.00	8.00	0.00	28.00	224.00	0.00	224.00	\N	2025-10-22 23:42:55.734	2025-10-22 23:42:55.734
2025-08-22-cmelyhkl80001ju043q91jozd-noel-venero	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-22	cmelyhkl80001ju043q91jozd	H & R: 268th St	noel-venero	Noel Venero	cmelyhkl80001ju043q91jozd-noel-venero	8.00	8.00	0.00	18.00	144.00	0.00	144.00	\N	2025-10-22 23:42:55.734	2025-10-22 23:42:55.734
2025-08-25-cmeiq6gbc0001lg04b6ckewdu-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-25	cmeiq6gbc0001lg04b6ckewdu	Lead Engineering: Port Everglades	adrian-ramos	Adrian Ramos	cmeiq6gbc0001lg04b6ckewdu-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.734	2025-10-22 23:42:55.734
2025-08-26-cmeiq6gbc0001lg04b6ckewdu-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-26	cmeiq6gbc0001lg04b6ckewdu	Lead Engineering: Port Everglades	adrian-ramos	Adrian Ramos	cmeiq6gbc0001lg04b6ckewdu-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.734	2025-10-22 23:42:55.734
2025-08-27-cmeiq6gbc0001lg04b6ckewdu-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-27	cmeiq6gbc0001lg04b6ckewdu	Lead Engineering: Port Everglades	adrian-ramos	Adrian Ramos	cmeiq6gbc0001lg04b6ckewdu-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.734	2025-10-22 23:42:55.734
2025-08-28-cmeiq6gbc0001lg04b6ckewdu-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-28	cmeiq6gbc0001lg04b6ckewdu	Lead Engineering: Port Everglades	adrian-ramos	Adrian Ramos	cmeiq6gbc0001lg04b6ckewdu-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.734	2025-10-22 23:42:55.734
2025-08-25-cmehc7cnv0003ju04hhj7x6kx-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-25	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	robert-gomez	Robert Gomez	cmehc7cnv0003ju04hhj7x6kx-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-25-cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-25	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	fabian-marquez	Fabian Marquez	cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-25-cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-25	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	joselin-aguila	Joselin Aguila	cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	8.00	8.00	0.00	21.50	172.00	0.00	172.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-25-cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-25	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	robert-amparo-lloret	Robert Amparo Lloret	cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-26-cmehc7cnv0003ju04hhj7x6kx-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-26	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	robert-gomez	Robert Gomez	cmehc7cnv0003ju04hhj7x6kx-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-26-cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-26	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	fabian-marquez	Fabian Marquez	cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-26-cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-26	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	joselin-aguila	Joselin Aguila	cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	8.00	8.00	0.00	21.50	172.00	0.00	172.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-26-cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-26	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	robert-amparo-lloret	Robert Amparo Lloret	cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-27-cmehc7cnv0003ju04hhj7x6kx-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-27	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	robert-gomez	Robert Gomez	cmehc7cnv0003ju04hhj7x6kx-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-27-cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-27	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	fabian-marquez	Fabian Marquez	cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-27-cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-27	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	joselin-aguila	Joselin Aguila	cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	8.00	8.00	0.00	21.50	172.00	0.00	172.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-27-cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-27	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	robert-amparo-lloret	Robert Amparo Lloret	cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-28-cmehc7cnv0003ju04hhj7x6kx-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-28	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	robert-gomez	Robert Gomez	cmehc7cnv0003ju04hhj7x6kx-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-28-cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-28	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	fabian-marquez	Fabian Marquez	cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-28-cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-28	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	joselin-aguila	Joselin Aguila	cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	8.00	8.00	0.00	21.50	172.00	0.00	172.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-28-cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-28	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	robert-amparo-lloret	Robert Amparo Lloret	cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-29-cmehc7cnv0003ju04hhj7x6kx-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-29	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	robert-gomez	Robert Gomez	cmehc7cnv0003ju04hhj7x6kx-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-29-cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-29	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	fabian-marquez	Fabian Marquez	cmehc7cnv0003ju04hhj7x6kx-fabian-marquez	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-29-cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-29	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	joselin-aguila	Joselin Aguila	cmehc7cnv0003ju04hhj7x6kx-joselin-aguila	8.00	8.00	0.00	21.50	172.00	0.00	172.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-29-cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-29	cmehc7cnv0003ju04hhj7x6kx	Trident Trucking	robert-amparo-lloret	Robert Amparo Lloret	cmehc7cnv0003ju04hhj7x6kx-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-25-cmeiqpvfk0003l804opcw0ah0-moises-varela	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-25	cmeiqpvfk0003l804opcw0ah0	Coral Gables Temp Fence	moises-varela	Moises Varela	cmeiqpvfk0003l804opcw0ah0-moises-varela	8.00	8.00	0.00	28.00	224.00	0.00	224.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-25-cmeiqpvfk0003l804opcw0ah0-noel-venero	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-25	cmeiqpvfk0003l804opcw0ah0	Coral Gables Temp Fence	noel-venero	Noel Venero	cmeiqpvfk0003l804opcw0ah0-noel-venero	8.00	8.00	0.00	18.00	144.00	0.00	144.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-26-cmeiqpvfk0003l804opcw0ah0-moises-varela	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-26	cmeiqpvfk0003l804opcw0ah0	Coral Gables Temp Fence	moises-varela	Moises Varela	cmeiqpvfk0003l804opcw0ah0-moises-varela	8.00	8.00	0.00	28.00	224.00	0.00	224.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-26-cmeiqpvfk0003l804opcw0ah0-noel-venero	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-26	cmeiqpvfk0003l804opcw0ah0	Coral Gables Temp Fence	noel-venero	Noel Venero	cmeiqpvfk0003l804opcw0ah0-noel-venero	8.00	8.00	0.00	18.00	144.00	0.00	144.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-27-cmeiqpvfk0003l804opcw0ah0-moises-varela	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-27	cmeiqpvfk0003l804opcw0ah0	Coral Gables Temp Fence	moises-varela	Moises Varela	cmeiqpvfk0003l804opcw0ah0-moises-varela	8.00	8.00	0.00	28.00	224.00	0.00	224.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-27-cmeiqpvfk0003l804opcw0ah0-noel-venero	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-27	cmeiqpvfk0003l804opcw0ah0	Coral Gables Temp Fence	noel-venero	Noel Venero	cmeiqpvfk0003l804opcw0ah0-noel-venero	8.00	8.00	0.00	18.00	144.00	0.00	144.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-26-cmerds1i00001l40402pnidy9-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-26	cmerds1i00001l40402pnidy9	NV2A	robert-amparo-lloret	Robert Amparo Lloret	cmerds1i00001l40402pnidy9-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-26-cmerds1i00001l40402pnidy9-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-26	cmerds1i00001l40402pnidy9	NV2A	robert-gomez	Robert Gomez	cmerds1i00001l40402pnidy9-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-27-cmerds1i00001l40402pnidy9-robert-amparo-lloret	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-27	cmerds1i00001l40402pnidy9	NV2A	robert-amparo-lloret	Robert Amparo Lloret	cmerds1i00001l40402pnidy9-robert-amparo-lloret	8.00	8.00	0.00	18.25	146.00	0.00	146.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-27-cmerds1i00001l40402pnidy9-robert-gomez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-27	cmerds1i00001l40402pnidy9	NV2A	robert-gomez	Robert Gomez	cmerds1i00001l40402pnidy9-robert-gomez	8.00	8.00	0.00	19.00	152.00	0.00	152.00	\N	2025-10-22 23:42:55.735	2025-10-22 23:42:55.735
2025-08-28-cmehcdwvh0009ju04hzkx5rx7-jony-baquedano-mendoza	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-28	cmehcdwvh0009ju04hzkx5rx7	Central Civil: Underline 3-9 Fence Repair	jony-baquedano-mendoza	Jony Baquedano Mendoza	cmehcdwvh0009ju04hzkx5rx7-jony-baquedano-mendoza	8.00	8.00	0.00	31.00	248.00	0.00	248.00	\N	2025-10-22 23:42:55.736	2025-10-22 23:42:55.736
2025-08-28-cmehcdwvh0009ju04hzkx5rx7-jose-fernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-28	cmehcdwvh0009ju04hzkx5rx7	Central Civil: Underline 3-9 Fence Repair	jose-fernandez	Jose Fernandez	cmehcdwvh0009ju04hzkx5rx7-jose-fernandez	8.00	8.00	0.00	23.00	184.00	0.00	184.00	\N	2025-10-22 23:42:55.736	2025-10-22 23:42:55.736
2025-08-28-cmehcdwvh0009ju04hzkx5rx7-jose-santos-diaz	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-28	cmehcdwvh0009ju04hzkx5rx7	Central Civil: Underline 3-9 Fence Repair	jose-santos-diaz	Jose Santos Diaz	cmehcdwvh0009ju04hzkx5rx7-jose-santos-diaz	8.00	8.00	0.00	17.00	136.00	0.00	136.00	\N	2025-10-22 23:42:55.736	2025-10-22 23:42:55.736
2025-08-29-cmehcdwvh0009ju04hzkx5rx7-jony-baquedano-mendoza	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-29	cmehcdwvh0009ju04hzkx5rx7	Central Civil: Underline 3-9 Fence Repair	jony-baquedano-mendoza	Jony Baquedano Mendoza	cmehcdwvh0009ju04hzkx5rx7-jony-baquedano-mendoza	8.00	8.00	0.00	31.00	248.00	0.00	248.00	\N	2025-10-22 23:42:55.736	2025-10-22 23:42:55.736
2025-08-29-cmehcdwvh0009ju04hzkx5rx7-jose-fernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-29	cmehcdwvh0009ju04hzkx5rx7	Central Civil: Underline 3-9 Fence Repair	jose-fernandez	Jose Fernandez	cmehcdwvh0009ju04hzkx5rx7-jose-fernandez	8.00	8.00	0.00	23.00	184.00	0.00	184.00	\N	2025-10-22 23:42:55.736	2025-10-22 23:42:55.736
2025-08-29-cmehcdwvh0009ju04hzkx5rx7-jose-santos-diaz	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-08-29	cmehcdwvh0009ju04hzkx5rx7	Central Civil: Underline 3-9 Fence Repair	jose-santos-diaz	Jose Santos Diaz	cmehcdwvh0009ju04hzkx5rx7-jose-santos-diaz	8.00	8.00	0.00	17.00	136.00	0.00	136.00	\N	2025-10-22 23:42:55.736	2025-10-22 23:42:55.736
2025-09-02-cmevjx8ia0001jr04n9pqxzk6-esteban-sanchez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-02	cmevjx8ia0001jr04n9pqxzk6	Alston Construction: Sky Harbour	esteban-sanchez	Esteban Sanchez	cmevjx8ia0001jr04n9pqxzk6-esteban-sanchez	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-22 23:49:59.064	2025-10-22 23:49:59.064
2025-09-02-cmeiqkswb0001l80405gqwquo-moises-varela	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-02	cmeiqkswb0001l80405gqwquo	Solemia/Oleta	moises-varela	Moises Varela	cmeiqkswb0001l80405gqwquo-moises-varela	8.00	8.00	0.00	28.00	224.00	0.00	224.00	\N	2025-10-22 23:49:59.064	2025-10-22 23:49:59.064
2025-09-02-cmeiqkswb0001l80405gqwquo-noel-venero	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-02	cmeiqkswb0001l80405gqwquo	Solemia/Oleta	noel-venero	Noel Venero	cmeiqkswb0001l80405gqwquo-noel-venero	8.00	8.00	0.00	18.00	144.00	0.00	144.00	\N	2025-10-22 23:49:59.064	2025-10-22 23:49:59.064
2025-09-03-cmeiqkswb0001l80405gqwquo-moises-varela	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-03	cmeiqkswb0001l80405gqwquo	Solemia/Oleta	moises-varela	Moises Varela	cmeiqkswb0001l80405gqwquo-moises-varela	8.00	8.00	0.00	28.00	224.00	0.00	224.00	\N	2025-10-22 23:49:59.064	2025-10-22 23:49:59.064
2025-09-03-cmeiqkswb0001l80405gqwquo-noel-venero	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-03	cmeiqkswb0001l80405gqwquo	Solemia/Oleta	noel-venero	Noel Venero	cmeiqkswb0001l80405gqwquo-noel-venero	8.00	8.00	0.00	18.00	144.00	0.00	144.00	\N	2025-10-22 23:49:59.064	2025-10-22 23:49:59.064
2025-09-04-cmeiqkswb0001l80405gqwquo-moises-varela	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-04	cmeiqkswb0001l80405gqwquo	Solemia/Oleta	moises-varela	Moises Varela	cmeiqkswb0001l80405gqwquo-moises-varela	8.00	8.00	0.00	28.00	224.00	0.00	224.00	\N	2025-10-22 23:49:59.064	2025-10-22 23:49:59.064
2025-09-04-cmeiqkswb0001l80405gqwquo-noel-venero	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-04	cmeiqkswb0001l80405gqwquo	Solemia/Oleta	noel-venero	Noel Venero	cmeiqkswb0001l80405gqwquo-noel-venero	8.00	8.00	0.00	18.00	144.00	0.00	144.00	\N	2025-10-22 23:49:59.064	2025-10-22 23:49:59.065
2025-09-05-cmeiqkswb0001l80405gqwquo-moises-varela	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-05	cmeiqkswb0001l80405gqwquo	Solemia/Oleta	moises-varela	Moises Varela	cmeiqkswb0001l80405gqwquo-moises-varela	8.00	8.00	0.00	28.00	224.00	0.00	224.00	\N	2025-10-22 23:49:59.065	2025-10-22 23:49:59.065
2025-09-05-cmeiqkswb0001l80405gqwquo-noel-venero	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-05	cmeiqkswb0001l80405gqwquo	Solemia/Oleta	noel-venero	Noel Venero	cmeiqkswb0001l80405gqwquo-noel-venero	8.00	8.00	0.00	18.00	144.00	0.00	144.00	\N	2025-10-22 23:49:59.065	2025-10-22 23:49:59.065
2025-09-02-cmer2d4qs0001l7040de7p1t2-jony-baquedano-mendoza	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-02	cmer2d4qs0001l7040de7p1t2	DP Development	jony-baquedano-mendoza	Jony Baquedano Mendoza	cmer2d4qs0001l7040de7p1t2-jony-baquedano-mendoza	8.00	8.00	0.00	31.00	248.00	0.00	248.00	\N	2025-10-22 23:49:59.065	2025-10-22 23:49:59.065
2025-09-02-cmer2d4qs0001l7040de7p1t2-jose-fernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-02	cmer2d4qs0001l7040de7p1t2	DP Development	jose-fernandez	Jose Fernandez	cmer2d4qs0001l7040de7p1t2-jose-fernandez	8.00	8.00	0.00	23.00	184.00	0.00	184.00	\N	2025-10-22 23:49:59.065	2025-10-22 23:49:59.065
2025-09-02-cmer2d4qs0001l7040de7p1t2-jose-santos-diaz	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-02	cmer2d4qs0001l7040de7p1t2	DP Development	jose-santos-diaz	Jose Santos Diaz	cmer2d4qs0001l7040de7p1t2-jose-santos-diaz	8.00	8.00	0.00	17.00	136.00	0.00	136.00	\N	2025-10-22 23:49:59.065	2025-10-22 23:49:59.065
2025-09-03-cmer2d4qs0001l7040de7p1t2-jony-baquedano-mendoza	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-03	cmer2d4qs0001l7040de7p1t2	DP Development	jony-baquedano-mendoza	Jony Baquedano Mendoza	cmer2d4qs0001l7040de7p1t2-jony-baquedano-mendoza	8.00	8.00	0.00	31.00	248.00	0.00	248.00	\N	2025-10-22 23:49:59.065	2025-10-22 23:49:59.065
2025-09-03-cmer2d4qs0001l7040de7p1t2-jose-fernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-03	cmer2d4qs0001l7040de7p1t2	DP Development	jose-fernandez	Jose Fernandez	cmer2d4qs0001l7040de7p1t2-jose-fernandez	8.00	8.00	0.00	23.00	184.00	0.00	184.00	\N	2025-10-22 23:49:59.065	2025-10-22 23:49:59.065
2025-09-03-cmer2d4qs0001l7040de7p1t2-jose-santos-diaz	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-03	cmer2d4qs0001l7040de7p1t2	DP Development	jose-santos-diaz	Jose Santos Diaz	cmer2d4qs0001l7040de7p1t2-jose-santos-diaz	8.00	8.00	0.00	17.00	136.00	0.00	136.00	\N	2025-10-22 23:49:59.065	2025-10-22 23:49:59.065
2025-09-03-cmeiqh9hh0001l804s21l6lzg-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-03	cmeiqh9hh0001l804s21l6lzg	Jaxi *Not confirmed*	adrian-ramos	Adrian Ramos	cmeiqh9hh0001l804s21l6lzg-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:49:59.065	2025-10-22 23:49:59.065
2025-09-04-cmeiqh9hh0001l804s21l6lzg-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-09-04	cmeiqh9hh0001l804s21l6lzg	Jaxi *Not confirmed*	adrian-ramos	Adrian Ramos	cmeiqh9hh0001l804s21l6lzg-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-22 23:49:59.065	2025-10-22 23:49:59.065
2025-10-13-cmek35hv30001ii04ipd83fyu-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-10-13	cmek35hv30001ii04ipd83fyu	OHLA: Joel Blvd	adrian-ramos	Adrian Ramos	cmek35hv30001ii04ipd83fyu-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-23 18:19:45.774	2025-10-23 18:19:45.774
2025-10-13-cmek35hv30001ii04ipd83fyu-ventura-hernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-10-13	cmek35hv30001ii04ipd83fyu	OHLA: Joel Blvd	ventura-hernandez	Ventura Hernandez	cmek35hv30001ii04ipd83fyu-ventura-hernandez	8.00	8.00	0.00	23.00	184.00	0.00	184.00	\N	2025-10-23 18:19:45.774	2025-10-23 18:19:45.774
2025-10-13-cmek35hv30001ii04ipd83fyu-ramiro-valle	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-10-13	cmek35hv30001ii04ipd83fyu	OHLA: Joel Blvd	ramiro-valle	Ramiro Valle	cmek35hv30001ii04ipd83fyu-ramiro-valle	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-23 18:19:45.774	2025-10-23 18:19:45.774
2025-10-14-cmek35hv30001ii04ipd83fyu-adrian-ramos	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-10-14	cmek35hv30001ii04ipd83fyu	OHLA: Joel Blvd	adrian-ramos	Adrian Ramos	cmek35hv30001ii04ipd83fyu-adrian-ramos	8.00	8.00	0.00	25.00	200.00	0.00	200.00	\N	2025-10-23 18:19:45.774	2025-10-23 18:19:45.774
2025-10-14-cmek35hv30001ii04ipd83fyu-ventura-hernandez	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-10-14	cmek35hv30001ii04ipd83fyu	OHLA: Joel Blvd	ventura-hernandez	Ventura Hernandez	cmek35hv30001ii04ipd83fyu-ventura-hernandez	8.00	8.00	0.00	23.00	184.00	0.00	184.00	\N	2025-10-23 18:19:45.774	2025-10-23 18:19:45.774
2025-10-14-cmek35hv30001ii04ipd83fyu-ramiro-valle	cme9wqhpe0000ht8sr5o3a6wf	Primary Calendar	2025-10-14	cmek35hv30001ii04ipd83fyu	OHLA: Joel Blvd	ramiro-valle	Ramiro Valle	cmek35hv30001ii04ipd83fyu-ramiro-valle	8.00	8.00	0.00	15.00	120.00	0.00	120.00	\N	2025-10-23 18:19:45.774	2025-10-23 18:19:45.774
\.


--
-- Data for Name: PayItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayItem" (id, number, description, unit, "createdAt", "updatedAt") FROM stdin;
cmgedc0ru003ds94hh5584xj4	550-10820	FENCING MESH SECURITY FENCE 10.1-12.0	LF	2025-10-06 00:04:09.835	2025-10-06 00:04:09.835
cmgedc0tv003es94hf8wmt3h3	550-10918	FENCING SPECIAL TYPE 0.0-5.0 RESET EXISTING	LF	2025-10-06 00:04:09.908	2025-10-06 00:04:09.908
cmgedc0w4003fs94hjmaaa0az	550-10929	FENCING SPECIAL TYPE 5.1-6.0 SPECIAL FEATURES	LF	2025-10-06 00:04:09.989	2025-10-06 00:04:09.989
cmgdwls2a0004s947afp3zq27	515-11	PIPE HANDRAIL - GUIDERAIL STEEL	LF	2025-10-05 16:15:51.635	2025-10-05 16:15:51.635
cmgdwls5v0005s947che2x2ly	515-12	PIPE HANDRAIL - GUIDERAIL ALUMINUM	LF	2025-10-05 16:15:51.764	2025-10-05 16:15:51.764
cmgdwls830006s947or0xyu1b	515-141	PIPE HANDRAIL - GUIDERAIL RELOCATE STEEL	LF	2025-10-05 16:15:51.843	2025-10-05 16:15:51.843
cmgdwlsaf0007s947iwg1n912	515-1-42	PIPE HANDRAIL - GUIDERAIL RELOCATE ALUMINUM	LF	2025-10-05 16:15:51.927	2025-10-05 16:15:51.927
cmgdwlscr0008s947jsm3zrxh	515-1-100	PIPE HANDRAIL INSTALL ONLY- MAINTENANCE USE ONLY	LF	2025-10-05 16:15:52.011	2025-10-05 16:15:52.011
cmgdwlsf70009s947auwkn9fn	515-2-111	PEDESTRIAN / BICYCLE RAILING NS 42" TYPE 1	LF	2025-10-05 16:15:52.099	2025-10-05 16:15:52.099
cmgdwlshj000as947kfcaboxl	515-2-211	PEDESTRIAN / BICYCLE RAILING STEEL 42" TYPE 1	LF	2025-10-05 16:15:52.183	2025-10-05 16:15:52.183
cmgdwlsjz000bs947e8mlzgr1	515-2-212	PEDESTRIAN / BICYCLE RAILING STEEL 42" TYPE 2	LF	2025-10-05 16:15:52.271	2025-10-05 16:15:52.271
cmgdwlsm7000cs9476yfb33mi	515-2-213	PEDESTRIAN / BICYCLE RAILING STEEL 42" TYPE 3	LF	2025-10-05 16:15:52.351	2025-10-05 16:15:52.351
cmgdwlsom000ds9471xdozsxe	515-2-215	PEDESTRIAN / BICYCLE RAILING STEEL 42" TYPE 5	LF	2025-10-05 16:15:52.438	2025-10-05 16:15:52.438
cmgdwlsqz000es94752pshk0o	515-2-221	PEDESTRIAN / BICYCLE RAILING STEEL ONLY 54" TYPE 1	LF	2025-10-05 16:15:52.523	2025-10-05 16:15:52.523
cmgdwlst7000fs947gzfrzr7z	515-2-231	PEDESTRIAN / BICYCLE RAILING STEEL ONLY 48" TYPE 1	LF	2025-10-05 16:15:52.603	2025-10-05 16:15:52.603
cmgdwlsvj000gs947car06ypx	515-2-311	PEDESTRIAN / BICYCLE RAILING ALUMINUM ONLY 42" TYPE 1	LF	2025-10-05 16:15:52.687	2025-10-05 16:15:52.687
cmgdwlsxv000hs947rrpa9wpw	515-2-312	PEDESTRIAN / BICYCLE RAILING ALUMINUM 42" TYPE 2	LF	2025-10-05 16:15:52.771	2025-10-05 16:15:52.771
cmgdwlt0d000is947fboa5jzg	515-2-313	PEDESTRIAN / BICYCLE RAILING ALUMINUM 42" TYPE 3	LF	2025-10-05 16:15:52.861	2025-10-05 16:15:52.861
cmgdwlt2y000js947ofkaxv1e	515-2-314	PEDESTRIAN / BICYCLE RAILING ALUMINUM 42" TYPE 4	LF	2025-10-05 16:15:52.955	2025-10-05 16:15:52.955
cmgdwlt5b000ks947qpsnlfj0	515-2-321	PEDESTRIAN / BICYCLE RAILING ALUMINUM ONLY54" TYPE 1	LF	2025-10-05 16:15:53.04	2025-10-05 16:15:53.04
cmgdwlt7j000ls947qgxvt1sh	515-2-331	PEDESTRIAN / BICYCLE RAILING ALUMINUM ONLY 48" TYPE 1 PICKET INFILL	LF	2025-10-05 16:15:53.119	2025-10-05 16:15:53.119
cmgdwlt9v000ms947hrv9evrj	515-2-411	PEDESTRIAN / BICYCLE RAILING SPECIAL MATERIALS- WEATHERING STEEL 42" TYPE 1	LF	2025-10-05 16:15:53.203	2025-10-05 16:15:53.203
cmgdwltck000ns947wjbd534z	515-2-500	PEDESTRIAN / BICYCLE RAILING RELOCATE	LF	2025-10-05 16:15:53.3	2025-10-05 16:15:53.3
cmgdwltey000os947gni7wxwh	515-2-600	PEDESTRIAN / BICYCLE RAILING REPLACE INFILL PANEL	EA	2025-10-05 16:15:53.387	2025-10-05 16:15:53.387
cmgdwlthj000ps9470zf7vg6m	515-2-601	PEDESTRIAN / BICYCLE RAILING POWDER COAT REPLACEMENT PANEL	EA	2025-10-05 16:15:53.48	2025-10-05 16:15:53.48
cmgdwltjr000qs9472ffmfgq9	515-2-703	PEDESTRIAN/ BICYCLE RAILING ALUMINUM MODIFIED 30" TYPE 1	LF	2025-10-05 16:15:53.559	2025-10-05 16:15:53.559
cmgdwltm3000rs947edr07ddb	515-2-710	PEDESTRIAN / BICYCLE RAILING STEEL CUSTOM INFILL PANELS	LF	2025-10-05 16:15:53.643	2025-10-05 16:15:53.643
cmgdwltoj000ss947rilktt41	515-2-720	PEDESTRIAN / BICYCLE RAILING ALUMINUM CUSTOM INFILL PANELS	LF	2025-10-05 16:15:53.731	2025-10-05 16:15:53.731
cmgdwltqz000ts947mly7j0c4	515-3-1	PIPE HANDRAIL- RETROFIT TO EXISTING RAILING STEEL	LF	2025-10-05 16:15:53.82	2025-10-05 16:15:53.82
cmgdwltt8000us947eseay69u	515-3-2	PIPE HANDRAIL- RETROFIT TO EXISTING RAILING ALUMINUM	LF	2025-10-05 16:15:53.9	2025-10-05 16:15:53.9
cmgdwltvn000vs947wvct0amy	515-4-1	BULLET RAIL SINGLE RAIL	LF	2025-10-05 16:15:53.987	2025-10-05 16:15:53.987
cmgdwltxx000ws947eld04y3b	515-4-2	BULLET RAIL DOUBLE RAIL	LF	2025-10-05 16:15:54.069	2025-10-05 16:15:54.069
cmgdwlu03000xs947ji2n8ep0	515-4-42	BULLET RAIL RELOCATE- DOUBLE RAIL	LF	2025-10-05 16:15:54.147	2025-10-05 16:15:54.147
cmgdwlu2k000ys94742zz4zu0	515-20100	PEDESTRIAN / BICYCLE RAILING METAL STANCHIONS WITH CHAIN GUARD	EA	2025-10-05 16:15:54.236	2025-10-05 16:15:54.236
cmgdws3nm000zs9470vce7y31	536-1-0	GUARDRAIL -ROADWAY GENERAL/LOW SPEED TL-2	LF	2025-10-05 16:20:46.594	2025-10-05 16:20:46.594
cmgdws3ra0010s947byhqajpx	536-1-1	GUARDRAIL -ROADWAY GENERAL TL-3	LF	2025-10-05 16:20:46.727	2025-10-05 16:20:46.727
cmgdws3tq0011s947frjk0an5	536-1-3	GUARDRAIL- ROADWAY DOUBLE FACE	LF	2025-10-05 16:20:46.814	2025-10-05 16:20:46.814
cmgdws3w60012s947tiadiwlb	536-1-13	GUARDRAIL ROADWAY INSTALL ONLY- MATERIALS AVAILABLE AT FDOT MAINTENANCE YARD	LF	2025-10-05 16:20:46.903	2025-10-05 16:20:46.903
cmgdws3ym0013s94750u9zn6i	536-5-1	RUB RAIL FOR GUARDRAIL SINGLE SIDED RUB RAIL	LF	2025-10-05 16:20:46.99	2025-10-05 16:20:46.99
cmgdws4110014s9472nume3we	536-5-2	RUB RAIL FOR GUARDRAIL DOUBLE SIDED RUB RAIL	LF	2025-10-05 16:20:47.078	2025-10-05 16:20:47.078
cmgdws46e0015s9475t8xulqt	536-6	PIPE RAIL FOR GUARDRAIL	LF	2025-10-05 16:20:47.27	2025-10-05 16:20:47.27
cmgdws48u0016s9474924c65v	536-7-1	SPECIAL GUARDRAIL POST- DEEP POST FOR SLOPE BREAK CONDITION- TIMBER OR STEEL	EA	2025-10-05 16:20:47.358	2025-10-05 16:20:47.358
cmgdws4b90017s947h855elmg	536-7-2	SPECIAL GUARDRAIL POST- SPECIAL STEEL POST FOR CONCRETE STRUCTURE MOUNT	EA	2025-10-05 16:20:47.446	2025-10-05 16:20:47.446
cmgdws4dy0018s947zm7ezi3o	536-7-3	SPECIAL GUARDRAIL POST- ENCASED POST FOR SHALLOW MOUNT	EA	2025-10-05 16:20:47.543	2025-10-05 16:20:47.543
cmgdws4ge0019s9475wai3lqh	536-7-4	SPECIAL GUARDRAIL POST- FRANGIBLE LEAVE-OUT FOR MOUNTING THROUGH CONCRETE SURFACE	EA	2025-10-05 16:20:47.63	2025-10-05 16:20:47.63
cmgdws4ja001as947abgt5esb	536-73	GUARDRAIL REMOVAL	LF	2025-10-05 16:20:47.734	2025-10-05 16:20:47.734
cmgdws4ls001bs947tlzm1icn	536-83-1	GUARDRAIL POST REPLACEMENT REGULAR (MAINTENANCE USE ONLY)	EA	2025-10-05 16:20:47.824	2025-10-05 16:20:47.824
cmgdws4oa001cs947eiu01zxr	536-8-111	GUARDRAIL TRANSITION CONNECTION TO RIGID BARRIER F&I- INDEX 536-001 APPROACH TL-2	EA	2025-10-05 16:20:47.914	2025-10-05 16:20:47.914
cmgdws4qt001ds947ij6m5tlu	536-8-112	GUARDRAIL TRANSITION CONNECTION TO RIGID BARRIER F&I- INDEX 536-001 APPROACH TL-3	EA	2025-10-05 16:20:48.006	2025-10-05 16:20:48.006
cmgdws4t9001es947zm8gmc08	536-8-113	GUARDRAIL TRANSITION CONNECTION TO RIGID BARRIER F&I- INDEX 536-001 TRAILING	EA	2025-10-05 16:20:48.094	2025-10-05 16:20:48.094
cmgdws4w5001fs947pfvg3vbr	536-8-122	GUARDRAIL TRANSITION CONNECTION TO RIGID BARRIER F&I- INDEX 536-002 APPROACH TL-3	EA	2025-10-05 16:20:48.198	2025-10-05 16:20:48.198
cmgdws4yp001gs947sylmsd6a	536-8-123	GUARDRAIL TRANSITION CONNECTION TO RIGID BARRIER F&I- INDEX 536-002 TRAILING	EA	2025-10-05 16:20:48.29	2025-10-05 16:20:48.29
cmgdws516001hs947zusi5f72	536-85-20	GUARDRAIL END TREATMENT- TRAILING ANCHORAGE	EA	2025-10-05 16:20:48.379	2025-10-05 16:20:48.379
cmgdws53m001is947vj4nogz5	536-85-24	GUARDRAIL END TREATMENT- PARALLEL APPROACH TERMINAL	EA	2025-10-05 16:20:48.466	2025-10-05 16:20:48.466
cmgdws561001js947j7j6amzb	536-85-26	GUARDRAIL END TREATMENT- TYPE CRT	EA	2025-10-05 16:20:48.554	2025-10-05 16:20:48.554
cmgdws58i001ks947eryngxj2	536-85-27	GUARDRAIL END TREATMENT- DOUBLE FACE APPROACH TERMINAL	EA	2025-10-05 16:20:48.643	2025-10-05 16:20:48.643
cmgdws5b5001ls9478braw6r4	536-85-29	GUARDRAIL END TREATMENT- DOUBLE FACE TRAILING ANCHORAGE	EA	2025-10-05 16:20:48.738	2025-10-05 16:20:48.738
cmgdwy30a001ms947a85k0iw9	544-2-1	CRASH CUSHION TL-2 NARROW	EA	2025-10-05 16:25:25.691	2025-10-05 16:25:58.998
cmgdwy36d001ns947avrsdtdz	544-2-2	CRASH CUSHION TL-2 WIDE	EA	2025-10-05 16:25:25.909	2025-10-05 16:25:59.134
cmgdwy38l001os947vlpnlw72	544-3-1	CRASH CUSHION TL-3 NARROW	EA	2025-10-05 16:25:25.989	2025-10-05 16:25:59.22
cmgdwy3b3001ps947anoulgpk	544-3-2	CRASH CUSHION TL-3 WIDE	EA	2025-10-05 16:25:26.079	2025-10-05 16:25:59.311
cmgedc0hx0038s94h4o9sztcv	550-10410	FENCING WOOD FENCE 0.0-5.0	LF	2025-10-06 00:04:09.477	2025-10-06 00:04:09.477
cmgedc0jw0039s94h7vz5i4j3	550-10418	FENCING WOOD FENCE 0.0-5.0 RESET EXISTING	LF	2025-10-06 00:04:09.549	2025-10-06 00:04:09.549
cmgedc0ls003as94hbzpkjllx	550-10420	FENCING WOOD FENCE 5.1-6.0	LF	2025-10-06 00:04:09.617	2025-10-06 00:04:09.617
cmgedc0nu003bs94hpt2b5i6t	550-10510	FENCING TUBULAR METAL PIPE 0.0-5.0	LF	2025-10-06 00:04:09.69	2025-10-06 00:04:09.69
cmgedc0pt003cs94hpgdfdzoz	550-10620	FENCING VINYL FENCE 5.1-6.0	LF	2025-10-06 00:04:09.761	2025-10-06 00:04:09.761
cmgedc0yc003gs94hohyzgd1k	550-10938	FENCING SPECIAL TYPE 6.1-7.0 RESET EXISTING	LF	2025-10-06 00:04:10.069	2025-10-06 00:04:10.069
cmgedc10c003hs94hf13tmc0v	550-10948	FENCING SPECIAL TYPE 7.1-8.0 RESET EXISTING	LF	2025-10-06 00:04:10.141	2025-10-06 00:04:10.141
cmgedc12c003is94hcpr4z2cy	550-60111	FENCE GATE TYPE A SINGLE 0-6.0 OPENING	EA	2025-10-06 00:04:10.212	2025-10-06 00:04:10.212
cmgedc14a003js94hr75ubayk	550-60112	FENCE GATE TYPE A SINGLE 6.1-12.0 OPENING	EA	2025-10-06 00:04:10.282	2025-10-06 00:04:10.282
cmgedc16d003ks94hanaa5uza	550-60122	FENCE GATE TYPE A DOUBLE 6.1-12.0 OPENING	EA	2025-10-06 00:04:10.358	2025-10-06 00:04:10.358
cmgedc18j003ls94had5cc9wz	550-60123	FENCE GATE TYPE A DOUBLE 12.1-18.0 OPENING	EA	2025-10-06 00:04:10.435	2025-10-06 00:04:10.435
cmgedc1al003ms94h4phhg4gf	550-60124	FENCE GATE TYPE A DOUBLE 18.1-20.0 OPENING	EA	2025-10-06 00:04:10.509	2025-10-06 00:04:10.509
cmgedc1cv003ns94hyzu7m3gy	550-60125	FENCE GATE TYPE A DOUBLE 20.1-24.0 OPENING	EA	2025-10-06 00:04:10.592	2025-10-06 00:04:10.592
cmgedbxqs001ws94hzxm3xu2p	550-10-119	FENCING TYPE A 0.0-5.0 SPECIAL FEATURES	LF	2025-10-06 00:04:05.909	2025-10-06 00:15:16.352
cmgedbxss001xs94h9pn1vj4a	550-10-120	FENCING TYPE A 5.1-6.0 STANDARD	LF	2025-10-06 00:04:05.98	2025-10-06 00:15:17.86
cmgedbxut001ys94hazpwdcxv	550-10-128	FENCING TYPE A 5.1-6.0 RESET EXISTING	LF	2025-10-06 00:04:06.054	2025-10-06 00:15:21.244
cmgedbxwv001zs94hdgismrv6	550-10-130	FENCING TYPE A 6.1-7.0 STANDARD	LF	2025-10-06 00:04:06.127	2025-10-06 00:15:23.799
cmgedbxz80020s94hdfqg9ds9	550-10-140	FENCING TYPE A 7.1-8.0 STANDARD	LF	2025-10-06 00:04:06.212	2025-10-06 00:15:24.731
cmgedby170021s94hhq29bxbd	550-10-148	FENCING TYPE A 7.1-8.0 RESET EXISTING	LF	2025-10-06 00:04:06.284	2025-10-06 00:15:25.718
cmgedby3c0022s94h4exsbigq	550-10-149	FENCING TYPE A 7.1-8.0 SPECIAL FEATURES	LF	2025-10-06 00:04:06.361	2025-10-06 00:15:26.836
cmgedby5b0023s94haz8zzkmk	550-10-150	FENCING TYPE A 8.1-10.0 STANDARD	LF	2025-10-06 00:04:06.431	2025-10-06 00:15:27.721
cmgedby7b0024s94hercz61al	550-10-158	FENCING TYPE A 8.1-10.0 RESET EXISTING	LF	2025-10-06 00:04:06.503	2025-10-06 00:15:29.898
cmgedby9f0025s94hdndjbfww	550-10-159	FENCING TYPE A 8.1-10.0 SPECIAL FEATURES	LF	2025-10-06 00:04:06.579	2025-10-06 00:15:31.698
cmgedbybj0026s94hk90av5xy	550-10-169	FENCING TYPE A 10.1-12.0 SPECIAL FEATURES	LF	2025-10-06 00:04:06.655	2025-10-06 00:15:32.566
cmgedbydo0027s94hhaqgffv7	550-10-210	FENCING TYPE B 0.0-5.0 STANDARD FEATURES	LF	2025-10-06 00:04:06.732	2025-10-06 00:15:33.313
cmgedbyfo0028s94h45qssuzg	550-10-212	FENCING TYPE B 0.0-5.0 WITH VINYL COATING	LF	2025-10-06 00:04:06.804	2025-10-06 00:15:35.567
cmgedbyhy0029s94h0gb43rdw	550-10-218	FENCING TYPE B 0.0-5.0 RESET EXISTING	LF	2025-10-06 00:04:06.886	2025-10-06 00:15:37.229
cmgedbyjy002as94hlox1zxbp	550-10-219	FENCING TYPE B 0.0-5.0 SPECIAL FEATURES	LF	2025-10-06 00:04:06.959	2025-10-06 00:15:38.117
cmgedbym0002bs94h2av8iv55	550-10-220	FENCING TYPE B 5.1-6.0 STANDARD	LF	2025-10-06 00:04:07.032	2025-10-06 00:15:38.898
cmgedbynz002cs94hc1myqmx6	550-10-221	FENCING TYPE B 5.1-6.0 WITH BARB WIRE ATTACHMENT	LF	2025-10-06 00:04:07.104	2025-10-06 00:15:39.819
cmgedbypz002ds94hflr39a5g	550-10-222	FENCING TYPE B 5.1-6.0 WITH VINYL COATING	LF	2025-10-06 00:04:07.176	2025-10-06 00:15:40.708
cmgedbyry002es94hrf6wz3rt	550-10-228	FENCING TYPE B 5.1-6.0 RESET EXISTING	LF	2025-10-06 00:04:07.246	2025-10-06 00:15:42.623
cmgedbyty002fs94h66t7xzaw	550-10-229	FENCING TYPE B 5.1-6.0 SPECIAL FEATURES	LF	2025-10-06 00:04:07.319	2025-10-06 00:15:43.797
cmgedbyvy002gs94hz4w66pqn	550-10-230	FENCING TYPE B 6.1-7.0 STANDARD	LF	2025-10-06 00:04:07.39	2025-10-06 00:15:46.091
cmgedbyzu002is94hyp6swdb5	550-10-232	FENCING TYPE B 6.1-7.0 WITH VINYL COATING	LF	2025-10-06 00:04:07.53	2025-10-06 00:15:48.597
cmgedbz1u002js94hjhjt4aby	550-10-236	FENCING TYPE B 6.1-7.0 WITH VINYL COATING AND BARBED WIRE ATTACHMENT	LF	2025-10-06 00:04:07.602	2025-10-06 00:15:49.961
cmgedbz3t002ks94h48gofjjv	550-10-238	FENCING TYPE B 6.1-7.0 RESET EXISTING	LF	2025-10-06 00:04:07.673	2025-10-06 00:15:52.547
cmgedbz5t002ls94hjszf2vv4	550-10-240	FENCING TYPE B 7.1-8.0 STANDARD	LF	2025-10-06 00:04:07.745	2025-10-06 00:15:55.215
cmgedbz7u002ms94hj0a2c0l9	550-10-241	FENCING TYPE B 7.1-8.0 WITH BARBED WIRE	LF	2025-10-06 00:04:07.818	2025-10-06 00:15:57.01
cmgedbz9u002ns94hqita3n6a	550-10-242	FENCING TYPE B 7.1-8.0 VINYL COATING	LF	2025-10-06 00:04:07.891	2025-10-06 00:15:57.797
cmgedbzbu002os94h0nb0wgge	550-10-248	FENCING TYPE B 7.1-8.0 RESET EXISTING	LF	2025-10-06 00:04:07.962	2025-10-06 00:15:59.464
cmgedbzdt002ps94hyq8tcevb	550-10-250	FENCING TYPE B 8.1-10.0 STANDARD FEATURES	LF	2025-10-06 00:04:08.034	2025-10-06 00:16:00.131
cmgedbzfs002qs94humy36lri	550-10-251	FENCING TYPE B 8.1-10.0 WITH BARBED WIRE ATTACHMENT	LF	2025-10-06 00:04:08.105	2025-10-06 00:16:01.098
cmgedbzho002rs94hitiu1kls	550-10-252	FENCING TYPE B 8.1-10.0 VINYL COATING	LF	2025-10-06 00:04:08.173	2025-10-06 00:16:01.95
cmgedbzjo002ss94hxg5arozz	550-10-256	FENCING TYPE B 8.1-10.0 WITH VINYL COATING AND BARBED WIRE ATTACHMENT	LF	2025-10-06 00:04:08.244	2025-10-06 00:16:02.729
cmgedbzlt002ts94hsjpz0u7j	550-10-258	FENCING TYPE B 8.1-10.0 RESET EXISTING	LF	2025-10-06 00:04:08.321	2025-10-06 00:16:06.095
cmgedbznt002us94hurzrfeo8	550-10-259	FENCING TYPE B 8.1-10.0 SPECIAL FEATURES	LF	2025-10-06 00:04:08.393	2025-10-06 00:16:07.914
cmgedbzq1002vs94h5zrrc0ex	550-10-266	FENCING TYPE B 10.1-12.0 WITH VINYL COATING AND BARBED WIRE ATTACHMENT	LF	2025-10-06 00:04:08.474	2025-10-06 00:16:08.65
cmgedbzs2002ws94h0vdrtpgf	550-10-269	FENCING TYPE B 10.1-12.0 SPECIAL FEATURES	LF	2025-10-06 00:04:08.546	2025-10-06 00:16:10.054
cmgedbzua002xs94hartly863	550-10-315	FENCING TYPE R 0.0-5.0 VERTICAL	LF	2025-10-06 00:04:08.626	2025-10-06 00:16:11.383
cmgedbzwh002ys94hrxp16adh	550-10-325	FENCING TYPE R 5.1-6.0 VERTICAL	LF	2025-10-06 00:04:08.705	2025-10-06 00:16:12.257
cmgedbzyg002zs94h1asymlly	550-10-333	FENCING TYPE R 6.1-7.0 FULL ENCLOSURE	LF	2025-10-06 00:04:08.776	2025-10-06 00:16:13.016
cmgedc01m0030s94h2w2pss27	550-10-334	FENCING TYPE R 6.1-7.0 PARTIAL ENCLOSURE	LF	2025-10-06 00:04:08.89	2025-10-06 00:16:19.356
cmgedc03m0031s94h25efcep2	550-10-335	FENCING TYPE R 6.1-7.0 VERTICAL	LF	2025-10-06 00:04:08.962	2025-10-06 00:16:20.071
cmgedc05l0032s94hz2pwwpg8	550-10-343	FENCING TYPE R 7.1-8.0 FULL ENCLOSURE	LF	2025-10-06 00:04:09.033	2025-10-06 00:16:21.785
cmgedc07l0033s94hmhvtpjqh	550-10-344	FENCING TYPE R 7.1-8.0 PARTIAL ENCLOSURE	LF	2025-10-06 00:04:09.105	2025-10-06 00:16:23.876
cmgedc09k0034s94hi7770aq4	550-10-353	FENCING TYPE R 8.1-10.0 FULL ENCLOSURE	LF	2025-10-06 00:04:09.176	2025-10-06 00:16:24.895
cmgedc0bu0035s94hthcb1enq	550-10-354	FENCING TYPE R 8.1-10.0 PARTIAL ENCLOSURE	LF	2025-10-06 00:04:09.258	2025-10-06 00:16:25.63
cmgedc0dy0036s94hsu8yuq19	550-10-355	FENCING TYPE R 8.1-10.0 VERTICAL	LF	2025-10-06 00:04:09.334	2025-10-06 00:16:26.389
cmgedc1eu003os94h81ptvihl	550-60126	FENCE GATE TYPE A DOUBLE 24.1-30.0 OPENING	EA	2025-10-06 00:04:10.663	2025-10-06 00:04:10.663
cmgedc1gv003ps94hakb5zdfa	550-60127	FENCE GATE TYPE A DOUBLE GREATER THAN 30 OPENING	EA	2025-10-06 00:04:10.735	2025-10-06 00:04:10.735
cmgedc1iu003qs94hqipjrwnb	550-60132	FENCE GATE TYPE A SLIDING/CANTILEVER 6.1-12.0 OPENING	EA	2025-10-06 00:04:10.806	2025-10-06 00:04:10.806
cmgedc1l1003rs94hi1pg4n1w	550-60133	FENCE GATE TYPE A SLIDING/CANTILEVER 12.1-18.0 OPENING	EA	2025-10-06 00:04:10.885	2025-10-06 00:04:10.885
cmgedc1n7003ss94h71h7ok5x	550-60134	FENCE GATE TYPE A SLIDING/CANTILEVER 18.1-20.0 OPENING	EA	2025-10-06 00:04:10.963	2025-10-06 00:04:10.963
cmgedc1p8003ts94he29pe2tb	550-60135	FENCE GATE TYPE A SLIDING/CANTILEVER 20.1-24.0 OPENING	EA	2025-10-06 00:04:11.036	2025-10-06 00:04:11.036
cmgedc1r9003us94hzd2eq3lm	550-60211	FENCE GATE TYPE B SINGLE 0-6.0 OPENING	EA	2025-10-06 00:04:11.11	2025-10-06 00:04:11.11
cmgedc1t8003vs94h68ucgcxq	550-60212	FENCE GATE TYPE B SINGLE 6.1-12.0 OPENING	EA	2025-10-06 00:04:11.181	2025-10-06 00:04:11.181
cmgedc1va003ws94hagori5m6	550-60213	FENCE GATE TYPE B SINGLE 12.1-18.0 OPENING	EA	2025-10-06 00:04:11.255	2025-10-06 00:04:11.255
cmgedc1xi003xs94hk03q1krb	550-60214	FENCE GATE TYPE B SINGLE 18.1-20.0 OPENING	EA	2025-10-06 00:04:11.335	2025-10-06 00:04:11.335
cmgedc1zi003ys94hy3f0eeps	550-60215	FENCE GATE TYPE B SINGLE 20.1-24.0 OPENING	EA	2025-10-06 00:04:11.406	2025-10-06 00:04:11.406
cmgedc21i003zs94he9ph2gil	550-60221	FENCE GATE TYPE B DOUBLE 0-6.0 OPENING	EA	2025-10-06 00:04:11.478	2025-10-06 00:04:11.478
cmgedc23r0040s94hplxr8mao	550-60222	FENCE GATE TYPE B DOUBLE 6.1-12.0 OPENING	EA	2025-10-06 00:04:11.56	2025-10-06 00:04:11.56
cmgedc2610041s94hmydt75ds	550-60223	FENCE GATE TYPE B DOUBLE 12.1-18.0 OPENING	EA	2025-10-06 00:04:11.641	2025-10-06 00:04:11.641
cmgedc2800042s94hu5f5hoz3	550-60224	FENCE GATE TYPE B DOUBLE 18.1-20.0 OPENING	EA	2025-10-06 00:04:11.713	2025-10-06 00:04:11.713
cmgedc2a50043s94h3eal4jlz	550-60225	FENCE GATE TYPE B DOUBLE 20.1-24.0 OPENING	EA	2025-10-06 00:04:11.789	2025-10-06 00:04:11.789
cmgedc2c80044s94h8x1ef5nt	550-60226	FENCE GATE TYPE B DOUBLE 24.1-30.0 OPENING	EA	2025-10-06 00:04:11.864	2025-10-06 00:04:11.864
cmgedc2e70045s94habue01hx	550-60227	FENCE GATE TYPE B DOUBLE GREATER THAN 30 OPENING	EA	2025-10-06 00:04:11.935	2025-10-06 00:04:11.935
cmgedc2g60046s94hc5z1hn85	550-60232	FENCE GATE TYPE B SLIDING/CANTILEVER 6.1-12.0 OPENING	EA	2025-10-06 00:04:12.007	2025-10-06 00:04:12.007
cmgedbxlq001us94hvtwz2gpg	550-10-110	FENCING TYPE A 0.0-5.0 STANDARD	LF	2025-10-06 00:04:05.727	2025-10-06 00:15:14.935
cmgedbxos001vs94hbphfutc8	550-10-118	FENCING TYPE A 0.0-5.0 RESET EXISTING	LF	2025-10-06 00:04:05.836	2025-10-06 00:15:15.452
cmgedbyxy002hs94htxet98d4	550-10-231	FENCING TYPE B 6.1-7.0 WITH BARB WIRE ATTACHMENT	LF	2025-10-06 00:04:07.463	2025-10-06 00:15:47.709
cmgedc0fy0037s94hqvcvjgmg	550-10-363	FENCING TYPE R GREATER THAN 10.0 FULL ENCLOSURE	LF	2025-10-06 00:04:09.406	2025-10-06 00:17:01.853
\.


--
-- Data for Name: Placement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Placement" (id, "employeeId", "dayKey", placement, "createdAt", "updatedAt") FROM stdin;
cmh3k3tqq0001jr042e7cbod8	gerardo-oliva	2025-10-23	FREE	2025-10-23 15:07:59.183	2025-10-23 15:07:59.183
cmh3k3y6v0001jr04x5f46bjq	gerardo-oliva	2025-10-24	FREE	2025-10-23 15:08:04.95	2025-10-23 15:08:04.95
\.


--
-- Data for Name: PurchaseOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PurchaseOrder" (id, "poNumber", project, vendor, status, "expectedOn", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReportFile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReportFile" (id, kind, "reportDate", "weekStart", "weekEnd", vendor, "blobUrl", bytes, "createdAt") FROM stdin;
cmfg7lsbq0001ov4oyrftn7bz	DAILY_PDF	2025-09-17 00:00:00	\N	\N	\N	/api/reports/tmp/57dc77be1aca2415a38674164211356c?name=daily-2025-09-17.pdf	61726	2025-09-12 02:19:37.767
cmfg7lsei0002ov4o7q44hptj	DAILY_XLSX	2025-09-17 00:00:00	\N	\N	\N	/api/reports/tmp/9d000b68ed353bc4a84c6c8f4aac56a4?name=daily-2025-09-17.xlsx	7031	2025-09-12 02:19:37.866
cmfg7lt5c0004ov4o538r4qz8	DAILY_PDF	2025-09-17 00:00:00	\N	\N	\N	/api/reports/tmp/e322287a60c9ca07b4bb6e876d9b209f?name=daily-2025-09-17.pdf	61646	2025-09-12 02:19:38.832
cmfg7lt6g0005ov4ou2zjdofe	DAILY_XLSX	2025-09-17 00:00:00	\N	\N	\N	/api/reports/tmp/079f6c2a6070a3542a54b511f286a7ff?name=daily-2025-09-17.xlsx	7031	2025-09-12 02:19:38.873
cmg10wypz0001ovxo4pq2p1wz	DAILY_PDF	2025-09-17 00:00:00	\N	\N	\N	/api/reports/tmp/mg10wynb-7xmx297p?name=daily-2025-09-17.pdf	2016	2025-09-26 15:55:31.655
cmg10wysb0002ovxor0471qp7	DAILY_XLSX	2025-09-17 00:00:00	\N	\N	\N	/api/reports/tmp/mg10wynb-71e8y5tl?name=daily-2025-09-17.xlsx	6933	2025-09-26 15:55:31.739
cmg12u40g0004ovxo6f9i90e2	DAILY_PDF	2025-09-26 00:00:00	\N	\N	\N	/api/reports/tmp/mg12u3xx-8vok7c8d?name=daily-2025-09-26.pdf	2116	2025-09-26 16:49:17.776
cmg12u48f0005ovxoy24fuuha	DAILY_XLSX	2025-09-26 00:00:00	\N	\N	\N	/api/reports/tmp/mg12u3y2-6uizjs37?name=daily-2025-09-26.xlsx	7017	2025-09-26 16:49:18.063
cmg12v7w40007ovxoqn198boo	DAILY_PDF	2025-09-25 00:00:00	\N	\N	\N	/api/reports/tmp/mg12v7tv-91qus6tr?name=daily-2025-09-25.pdf	2120	2025-09-26 16:50:09.461
cmg12v82o0008ovxotl1ugpep	DAILY_XLSX	2025-09-25 00:00:00	\N	\N	\N	/api/reports/tmp/mg12v7u5-da7nmqsd?name=daily-2025-09-25.xlsx	7017	2025-09-26 16:50:09.697
cmg15ng0l000aovxo85is7d1z	DAILY_PDF	2025-09-24 00:00:00	\N	\N	\N	/api/reports/tmp/mg15nfxy-dgw9umqq?name=daily-2025-09-24.pdf	2121	2025-09-26 18:08:05.589
cmg15ng75000bovxovq0b1g05	DAILY_XLSX	2025-09-24 00:00:00	\N	\N	\N	/api/reports/tmp/mg15nfy8-zetjvy4a?name=daily-2025-09-24.xlsx	7017	2025-09-26 18:08:05.825
cmg15nman000dovxous2nf6fg	DAILY_PDF	2025-09-23 00:00:00	\N	\N	\N	/api/reports/tmp/mg15nm94-rylpo9q3?name=daily-2025-09-23.pdf	2118	2025-09-26 18:08:13.728
cmg15nmbp000eovxo9hscynvp	DAILY_XLSX	2025-09-23 00:00:00	\N	\N	\N	/api/reports/tmp/mg15nm9d-t9pfbs0a?name=daily-2025-09-23.xlsx	7017	2025-09-26 18:08:13.765
cmg15nu4e000govxohnjb895y	DAILY_PDF	2025-09-27 00:00:00	\N	\N	\N	/api/reports/tmp/mg15nu2q-44o0nsd8?name=daily-2025-09-27.pdf	1837	2025-09-26 18:08:23.87
cmg15nuay000hovxo2dvl27gq	DAILY_XLSX	2025-09-27 00:00:00	\N	\N	\N	/api/reports/tmp/mg15nu2z-o1dnjsfk?name=daily-2025-09-27.xlsx	6952	2025-09-26 18:08:24.106
cmg15o4yg000jovxoygdn76dl	DAILY_PDF	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg15o4wz-4xcf13wl?name=daily-2025-09-29.pdf	3246	2025-09-26 18:08:37.913
cmg15o54u000kovxoi6q7mnry	DAILY_XLSX	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg15o4x7-kjgoril9?name=daily-2025-09-29.xlsx	7224	2025-09-26 18:08:38.143
cmg16mvvx000movxobarqglqc	DAILY_PDF	2025-09-26 00:00:00	\N	\N	\N	/api/reports/tmp/mg16mvto-yzbul3c3?name=daily-2025-09-26.pdf	2118	2025-09-26 18:35:39.117
cmg16mw2t000novxollfxfnjq	DAILY_XLSX	2025-09-26 00:00:00	\N	\N	\N	/api/reports/tmp/mg16mvtx-n8fnq1cy?name=daily-2025-09-26.xlsx	7017	2025-09-26 18:35:39.365
cmg16xzj9000povxopo80f402	DAILY_PDF	2025-09-17 00:00:00	\N	\N	\N	/api/reports/tmp/mg16xzgm-73962fyj?name=daily-2025-09-17.pdf	2909	2025-09-26 18:44:17.061
cmg16xzpv000qovxotjwz5k2z	DAILY_XLSX	2025-09-17 00:00:00	\N	\N	\N	/api/reports/tmp/mg16xzgv-crn0wuga?name=daily-2025-09-17.xlsx	7078	2025-09-26 18:44:17.3
cmg16ydgz000sovxo8j0edlhp	DAILY_PDF	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg16ydfg-my80l6tk?name=daily-2025-09-29.pdf	3246	2025-09-26 18:44:35.123
cmg16ydhx000tovxo5unvdk1z	DAILY_XLSX	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg16ydfp-v1tgv56o?name=daily-2025-09-29.xlsx	7224	2025-09-26 18:44:35.157
cmg174xdt000vovxox5f8blow	DAILY_PDF	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg174xbl-i56gr17z?name=daily-2025-09-29.pdf	3376	2025-09-26 18:49:40.865
cmg174xl8000wovxo0tqplbsh	DAILY_XLSX	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg174xbv-c0w5msri?name=daily-2025-09-29.xlsx	7224	2025-09-26 18:49:41.133
cmg1en7lo0001l104a1qd4afz	DAILY_PDF	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg1en7ke-12zcyp5h?name=daily-2025-09-29.pdf	3376	2025-09-26 22:19:51.229
cmg1en7md0002l104ragw1gqb	DAILY_XLSX	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg1en7ke-tfum8iwo?name=daily-2025-09-29.xlsx	7224	2025-09-26 22:19:51.253
cmg5hvowp0009ju0455ckne8q	DAILY_PDF	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg5hvotq-wysv2qn1?name=daily-2025-09-29.pdf	5554	2025-09-29 19:01:30.457
cmg5hvox9000aju04j82dlat9	DAILY_XLSX	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg5hvotq-ccujjwle?name=daily-2025-09-29.xlsx	7640	2025-09-29 19:01:30.477
cmg5uuu0b0003ovng6c46gewr	DAILY_PDF	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg5uutqg-rn1uvy6r?name=daily-2025-09-29.pdf	5786	2025-09-30 01:04:45.419
cmg5uuu0a0002ovngbl327y56	DAILY_PDF	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg5uutp2-h8mm5lz7?name=daily-2025-09-29.pdf	5786	2025-09-30 01:04:45.418
cmg5uuu4g0004ovngvaagzqp9	DAILY_XLSX	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg5uutqj-vwgh7wjg?name=daily-2025-09-29.xlsx	7716	2025-09-30 01:04:45.568
cmg5uuu4g0005ovngk4r26w7l	DAILY_XLSX	2025-09-29 00:00:00	\N	\N	\N	/api/reports/tmp/mg5uutp7-a5n5wjm3?name=daily-2025-09-29.xlsx	7716	2025-09-30 01:04:45.569
cmg6fyc2a0007ovng7dpnjyes	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6fybve-87lj9u95?name=daily-2025-09-30.pdf	6405	2025-09-30 10:55:20.722
cmg6fyc4x0008ovngqm61hful	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6fybvi-zxboiz0z?name=daily-2025-09-30.xlsx	7828	2025-09-30 10:55:20.817
cmg6g4048000aovngo41945ta	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6g3zwk-m27jhwkc?name=daily-2025-09-30.pdf	6405	2025-09-30 10:59:45.176
cmg6g4064000bovngxtnepc44	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6g3zwp-0myvn5zg?name=daily-2025-09-30.xlsx	7828	2025-09-30 10:59:45.245
cmg6g95lb000dovngi1xk8dte	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6g95j0-hyd14fkn?name=daily-2025-09-30.pdf	6404	2025-09-30 11:03:45.552
cmg6g95uf000eovngi1pai8a5	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6g95j4-scc84bhl?name=daily-2025-09-30.xlsx	7828	2025-09-30 11:03:45.879
cmg6gh7y8000govngaa8mv0nr	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6gh7qn-x1tocn8n?name=daily-2025-09-30.pdf	6424	2025-09-30 11:10:01.857
cmg6gh82v000hovngr2mx9g5c	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6gh7qs-160eegvy?name=daily-2025-09-30.xlsx	7832	2025-09-30 11:10:02.024
cmg6j9fnr0001ov08zub29e8x	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6j9fei-3nx0d3qj?name=daily-2025-09-30.pdf	6425	2025-09-30 12:27:57.447
cmg6j9fq20002ov08eu35smb9	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6j9fem-tax7fypp?name=daily-2025-09-30.xlsx	7833	2025-09-30 12:27:57.53
cmg6k82900001ov8g7pld99y3	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6k81zw-hmosmhs2?name=daily-2025-09-30.pdf	63872	2025-09-30 12:54:53.029
cmg6k82e50002ov8grimlsv7b	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6k8200-i2nfi6p7?name=daily-2025-09-30.xlsx	7833	2025-09-30 12:54:53.214
cmg6kodz30004ov8gunj51ysd	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6kodrm-h9n1smq1?name=daily-2025-09-30.pdf	63872	2025-09-30 13:07:34.719
cmg6koe1b0005ov8gxsdcfp6i	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6kodrp-dbnxexi1?name=daily-2025-09-30.xlsx	7832	2025-09-30 13:07:34.799
cmg6rxm560001ovm4e2i6beym	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6rxm1q-bb6qtpx2?name=daily-2025-09-30.pdf	87878	2025-09-30 16:30:42.522
cmg6rxm9l0002ovm45g5utgou	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6rxm1t-x5o8xqw3?name=daily-2025-09-30.xlsx	7833	2025-09-30 16:30:42.682
cmg6w34m00004ovm4hl51md7j	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6w34e5-w1fcmzhr?name=daily-2025-09-30.pdf	124784	2025-09-30 18:26:58.2
cmg6w34pz0005ovm4w6dzugr4	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6w34e8-755vzfdu?name=daily-2025-09-30.xlsx	8023	2025-09-30 18:26:58.343
cmg6w52980007ovm41ktgqiyb	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6w526q-0nuovqrt?name=daily-2025-09-30.pdf	124784	2025-09-30 18:28:28.461
cmg6w52iz0008ovm4ywg9ucrb	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6w526v-l3hov6s6?name=daily-2025-09-30.xlsx	8022	2025-09-30 18:28:28.811
cmg6wchlh000aovm4b9vtykqn	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6wchb4-ruua5bu5?name=daily-2025-09-30.pdf	120878	2025-09-30 18:34:14.933
cmg6wchqf000bovm4ocuimot4	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6wchb9-jt31c6dy?name=daily-2025-09-30.xlsx	7959	2025-09-30 18:34:15.112
cmg6xk1v9000dovm4jyazch9g	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6xk1sq-yuklhsdv?name=daily-2025-09-30.pdf	128167	2025-09-30 19:08:07.414
cmg6xk23n000eovm4kjm2kcm3	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6xk1sv-f3fq3yz6?name=daily-2025-09-30.xlsx	7959	2025-09-30 19:08:07.715
cmg6xriu70001ov8sf7s9xtv2	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6xrirg-a4cs5v4l?name=daily-2025-09-30.pdf	128167	2025-09-30 19:13:55.999
cmg6xrixq0002ov8sth78hvvo	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg6xrirk-v6t05krs?name=daily-2025-09-30.xlsx	7959	2025-09-30 19:13:56.126
cmg72i66w0001ov3sl14ttzmd	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg72i5xs-ale0hty6?name=daily-2025-09-30.pdf	128167	2025-09-30 21:26:37.784
cmg72i6ds0002ov3scx7gjssv	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg72i5xy-59lvk35z?name=daily-2025-09-30.xlsx	7959	2025-09-30 21:26:38.032
cmg766wbd0001ov5o9mjmjbvs	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg766w4w-ui45kzm6?name=daily-2025-09-30.pdf	68821	2025-09-30 23:09:50.234
cmg766wit0002ov5oj265eoxs	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg766w4z-3lrs3ykr?name=daily-2025-09-30.xlsx	7959	2025-09-30 23:09:50.501
cmg77et2c0004ov5o8f6invo7	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77esth-dfp42hg8?name=daily-2025-09-30.pdf	78248	2025-09-30 23:43:58.884
cmg77ete20005ov5o2kka0z8n	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77estl-ipaxm58a?name=daily-2025-09-30.xlsx	7959	2025-09-30 23:43:59.307
cmg77hpur0007ov5oiszl69nj	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77hpmh-e0pc0oh6?name=daily-2025-09-30.pdf	78343	2025-09-30 23:46:14.692
cmg77hpzu0008ov5ob52k105w	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77hpmm-k8xvd3v0?name=daily-2025-09-30.xlsx	7959	2025-09-30 23:46:14.875
cmg77jrsm000aov5o086qxow6	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77jrqw-mttkh1op?name=daily-2025-09-30.pdf	78408	2025-09-30 23:47:50.519
cmg77jrz2000bov5oiyd33dnh	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77jrr0-1x3hu5ey?name=daily-2025-09-30.xlsx	7959	2025-09-30 23:47:50.75
cmg77mn7i000dov5o5syccpq5	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77mn5v-12wgw3yi?name=daily-2025-09-30.pdf	78343	2025-09-30 23:50:04.542
cmg77mnen000eov5oh85vl2yc	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77mn61-qg8rnrji?name=daily-2025-09-30.xlsx	7959	2025-09-30 23:50:04.8
cmg77oyel000gov5ocqu9c7c9	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77oy73-838zx9o3?name=daily-2025-09-30.pdf	78343	2025-09-30 23:51:52.365
cmg77oynv000hov5orwfceaac	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77oy75-8ecebxzb?name=daily-2025-09-30.xlsx	7959	2025-09-30 23:51:52.699
cmg77raov000jov5ody6jw8jd	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77raf7-xm2jidwe?name=daily-2025-09-30.pdf	78245	2025-09-30 23:53:41.599
cmg77rau4000kov5ow7b9yyu4	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg77rafb-dpsp1qpy?name=daily-2025-09-30.xlsx	7959	2025-09-30 23:53:41.788
cmg79dixr000mov5o9mtewpls	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg79dinl-a1pf0hiv?name=daily-2025-09-30.pdf	72173	2025-10-01 00:38:58.335
cmg79dj7w000nov5oypz18dco	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg79dinr-w6tzypfl?name=daily-2025-09-30.xlsx	7817	2025-10-01 00:38:58.7
cmg79ihy6000pov5otdla1uql	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg79ihpk-5esmitys?name=daily-2025-09-30.pdf	52943	2025-10-01 00:42:50.334
cmg79ii00000qov5owy47ka9i	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg79ihpo-oxrvgcvx?name=daily-2025-09-30.xlsx	7152	2025-10-01 00:42:50.4
cmg79n465000sov5owps5mhye	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg79n3zi-xkm0mq0q?name=daily-2025-09-30.pdf	72173	2025-10-01 00:46:25.757
cmg79n4dr000tov5ovu3swint	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg79n3zl-9hyc5fph?name=daily-2025-09-30.xlsx	7817	2025-10-01 00:46:26.031
cmg79p4ie000vov5orkiu02ev	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg79p4go-kjwmanky?name=daily-2025-09-30.pdf	72173	2025-10-01 00:47:59.51
cmg79p4pu000wov5o5l5syi1t	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg79p4gt-0t72kmce?name=daily-2025-09-30.xlsx	7818	2025-10-01 00:47:59.778
cmg79pnek000yov5o93stpaxs	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg79pnd1-mutj7pw2?name=daily-2025-10-01.pdf	60500	2025-10-01 00:48:23.996
cmg79pnm2000zov5o99g2osti	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg79pnd5-7g8tz1ge?name=daily-2025-10-01.xlsx	7541	2025-10-01 00:48:24.266
cmg7bo81y0001ovjw398p1raz	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg7bo7t9-0gpqhy72?name=daily-2025-09-30.pdf	69629	2025-10-01 01:43:16.679
cmg7bo8640002ovjwagxusjzv	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg7bo7tc-3w6i1f8g?name=daily-2025-09-30.xlsx	7817	2025-10-01 01:43:16.828
cmg7zwwmx0001jv04yeei9cq7	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg7zwwls-uas862mw?name=daily-2025-10-01.pdf	47086	2025-10-01 13:01:52.569
cmg7zwwni0002jv04d2blvioc	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg7zwwmb-x5s0o2ux?name=daily-2025-10-01.xlsx	7541	2025-10-01 13:01:52.59
cmg7zygoj0004jv04ee9x7o4h	DAILY_PDF	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg7zygni-w1y74w27?name=daily-2025-09-30.pdf	55943	2025-10-01 13:03:05.204
cmg7zygoo0005jv04jjpt170r	DAILY_XLSX	2025-09-30 00:00:00	\N	\N	\N	/api/reports/tmp/mg7zygo6-e0t5z99j?name=daily-2025-09-30.xlsx	7817	2025-10-01 13:03:05.208
cmg81g5ln0001kt04yt9k8w9v	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg81g5kh-yxetc3vf?name=daily-2025-10-01.pdf	47086	2025-10-01 13:44:50.267
cmg81g5lv0002kt041l5gzkts	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg81g5kz-02cyys11?name=daily-2025-10-01.xlsx	7542	2025-10-01 13:44:50.276
cmg81gd3k0004kt043h3gdoh5	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg81gd3d-mtyf5apv?name=daily-2025-10-01.pdf	47086	2025-10-01 13:44:59.984
cmg81gd3v0005kt04gm786mc5	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg81gd3d-jpn3xtvc?name=daily-2025-10-01.xlsx	7542	2025-10-01 13:44:59.995
cmg8anv700001l504evgibimw	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8anv51-rsiirdyw?name=daily-2025-10-01.pdf	52571	2025-10-01 18:02:46.573
cmg8anv7j0002l504m7lm6uim	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8anv5k-4hvb0qpi?name=daily-2025-10-01.xlsx	7618	2025-10-01 18:02:46.592
cmg8aqjqg0005k104apds27od	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8aqjpy-ixmml4ws?name=daily-2025-10-01.pdf	49965	2025-10-01 18:04:51.688
cmg8aqjqo0006k104vqs94y75	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8aqjpy-dc24x2nq?name=daily-2025-10-01.xlsx	7564	2025-10-01 18:04:51.697
cmg8aqv140008k104ox95b7d6	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8aqv0o-d30tetcn?name=daily-2025-10-01.pdf	52762	2025-10-01 18:05:06.328
cmg8aqv1a0009k104lhwzu585	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8aqv0p-jfadvlej?name=daily-2025-10-01.xlsx	7630	2025-10-01 18:05:06.334
cmg8aupe70001jo04fb2znoky	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8aupd8-j0g5a410?name=daily-2025-10-01.pdf	52762	2025-10-01 18:08:05.647
cmg8aupf20002jo04gk7q70u6	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8aupdu-i0gbs08c?name=daily-2025-10-01.xlsx	7630	2025-10-01 18:08:05.678
cmg8av9af0004jo04tt3ri6tv	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8av9a4-gogk750z?name=daily-2025-10-01.pdf	52751	2025-10-01 18:08:31.431
cmg8av9ao0005jo042klzuamz	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8av9a4-mkge21r4?name=daily-2025-10-01.xlsx	7630	2025-10-01 18:08:31.44
cmg8qtyl80001lb04avu1dhi3	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8qtykd-jifwkknw?name=daily-2025-10-01.pdf	52751	2025-10-02 01:35:24.765
cmg8qtylt0002lb04gdkdyiox	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8qtyko-bcz8ys50?name=daily-2025-10-01.xlsx	7630	2025-10-02 01:35:24.785
cmg8rr6c40001s9w6eixyrtxf	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8rr66k-7agfc0td?name=daily-2025-10-01.pdf	113634	2025-10-02 02:01:14.452
cmg8rr6eq0002s9w6xqaqa6m3	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8rr66k-na5dl4xw?name=daily-2025-10-01.xlsx	7630	2025-10-02 02:01:14.547
cmg8ryp780004s9w6d1ysxbhg	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8ryp4a-ndwkb4ea?name=daily-2025-10-01.pdf	113620	2025-10-02 02:07:05.492
cmg8ryp9q0005s9w6n48s972b	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8ryp4b-na27xqfk?name=daily-2025-10-01.xlsx	7630	2025-10-02 02:07:05.583
cmg8rz8wk0007s9w6wdcieqv6	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8rz8rv-tpi5ncu2?name=daily-2025-10-01.pdf	113620	2025-10-02 02:07:31.029
cmg8rz8yz0008s9w6qkf2njor	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8rz8rw-mq0hd78p?name=daily-2025-10-01.xlsx	7629	2025-10-02 02:07:31.115
cmg8s1sce000as9w665gsu821	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8s1sb5-x143jldu?name=daily-2025-10-01.pdf	113620	2025-10-02 02:09:29.534
cmg8s1sdu000bs9w6ikpzqxko	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8s1sb5-riqgnb65?name=daily-2025-10-01.xlsx	7630	2025-10-02 02:09:29.586
cmg8s9lxm000ds9w6c9xemm03	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8s9lsb-ha6qjqop?name=daily-2025-10-01.pdf	113620	2025-10-02 02:15:34.474
cmg8s9m24000es9w6o5ct159f	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg8s9lsb-q8czs699?name=daily-2025-10-01.xlsx	7630	2025-10-02 02:15:34.637
cmg8sa7qm000gs9w6adeq7kud	DAILY_PDF	2025-10-14 00:00:00	\N	\N	\N	/api/reports/tmp/mg8sa7nt-gspfmnxk?name=daily-2025-10-14.pdf	43283	2025-10-02 02:16:02.735
cmg8sa7rs000hs9w6qjjrw4kt	DAILY_XLSX	2025-10-14 00:00:00	\N	\N	\N	/api/reports/tmp/mg8sa7nt-cghkmcb3?name=daily-2025-10-14.xlsx	6950	2025-10-02 02:16:02.776
cmg8sal2r000js9w64l2ikjxh	DAILY_PDF	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg8sal10-3rlf8y7f?name=daily-2025-10-02.pdf	109982	2025-10-02 02:16:20.019
cmg8sal49000ks9w6sdiec5p5	DAILY_XLSX	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg8sal10-usf56kut?name=daily-2025-10-02.xlsx	7569	2025-10-02 02:16:20.073
cmg8sayye000ms9w6nbb3vx1c	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mg8sayti-suwf1rpn?name=daily-2025-10-03.pdf	96013	2025-10-02 02:16:38.006
cmg8saz18000os9w6hgek43zc	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mg8saytj-5phb0et4?name=daily-2025-10-03.xlsx	7359	2025-10-02 02:16:38.108
cmg8saz1b000ps9w65sfrw20a	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mg8sayzs-3o8vmvb9?name=daily-2025-10-03.pdf	96013	2025-10-02 02:16:38.112
cmg8saz2s000qs9w6g8o9cl9u	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mg8sayzt-bs3ylnni?name=daily-2025-10-03.xlsx	7359	2025-10-02 02:16:38.164
cmg9d2p5k0001s9u782m6qo5p	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg9d2p2j-7t8wbvie?name=daily-2025-10-01.pdf	110815	2025-10-02 11:58:03.993
cmg9d2pc20002s9u76ojy3fma	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg9d2p2k-68yvmnyw?name=daily-2025-10-01.xlsx	7563	2025-10-02 11:58:04.227
cmg9d3qor0004s9u7279cek7f	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg9d3qmu-c2tozfh6?name=daily-2025-10-01.pdf	110815	2025-10-02 11:58:52.635
cmg9d3qpv0005s9u7b4jixo75	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg9d3qmu-si4slbwo?name=daily-2025-10-01.xlsx	7563	2025-10-02 11:58:52.676
cmg9d5t190007s9u7guyx5aj0	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg9d5swx-uqq1d0xt?name=daily-2025-10-01.pdf	110815	2025-10-02 12:00:28.99
cmg9d5t3k0008s9u73w4rjsgi	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg9d5swy-cf321y8k?name=daily-2025-10-01.xlsx	7563	2025-10-02 12:00:29.073
cmg9d7q69000as9u72dgj1wu7	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg9d7q2j-kirul70c?name=daily-2025-10-01.pdf	110815	2025-10-02 12:01:58.593
cmg9d7q8f000bs9u7sxyqz3na	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mg9d7q2j-1xgfaesk?name=daily-2025-10-01.xlsx	7563	2025-10-02 12:01:58.671
cmg9e6b1m000ds9u7r8qeoozk	DAILY_PDF	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9e6ay2-ept093h1?name=daily-2025-10-02.pdf	126368	2025-10-02 12:28:51.947
cmg9e6b5y000es9u7tqnxnei1	DAILY_XLSX	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9e6ay3-u9pfehtu?name=daily-2025-10-02.xlsx	7569	2025-10-02 12:28:52.103
cmg9e80a5000gs9u7xz28khp8	DAILY_PDF	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9e808j-9g4bgbtq?name=daily-2025-10-02.pdf	125505	2025-10-02 12:30:11.31
cmg9e80co000hs9u72a2vyf3c	DAILY_XLSX	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9e808j-9l096epx?name=daily-2025-10-02.xlsx	7569	2025-10-02 12:30:11.4
cmg9hm6vd0001ld04be201fnf	DAILY_PDF	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9hm6tf-eo5lum8m?name=daily-2025-10-02.pdf	49816	2025-10-02 14:05:11.881
cmg9hm6w20002ld04smvczeiv	DAILY_XLSX	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9hm6tt-vpq4nxaa?name=daily-2025-10-02.xlsx	7569	2025-10-02 14:05:11.907
cmg9ysmrk0001s9p2xqhf8l5m	DAILY_PDF	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9ysmc5-gtmizzoq?name=daily-2025-10-02.pdf	125941	2025-10-02 22:06:05.889
cmg9ysn370002s9p2snjqlpgt	DAILY_XLSX	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9ysmc5-ue3td7u9?name=daily-2025-10-02.xlsx	7569	2025-10-02 22:06:06.307
cmg9zkfuf0004s9p2je7rutgy	DAILY_PDF	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9zkfqo-oaenl2u6?name=daily-2025-10-02.pdf	125918	2025-10-02 22:27:43.288
cmg9zkg200005s9p20fc12oss	DAILY_XLSX	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9zkfqo-d2a438c1?name=daily-2025-10-02.xlsx	7564	2025-10-02 22:27:43.56
cmg9zmro20007s9p23gyo1lnd	DAILY_PDF	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9zmrlr-6tepo7a2?name=daily-2025-10-02.pdf	113123	2025-10-02 22:29:31.922
cmg9zmrqq0008s9p2xf1bw197	DAILY_XLSX	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mg9zmrlr-wurdtwkm?name=daily-2025-10-02.xlsx	7171	2025-10-02 22:29:32.019
cmga0ddsn000as9p2ewq25893	DAILY_PDF	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mga0ddp5-cdgophkz?name=daily-2025-10-02.pdf	125918	2025-10-02 22:50:13.655
cmga0ddur000bs9p244jlbyk2	DAILY_XLSX	2025-10-02 00:00:00	\N	\N	\N	/api/reports/tmp/mga0ddp6-xq8vzgh4?name=daily-2025-10-02.xlsx	7564	2025-10-02 22:50:13.731
cmga20ivn000ds9p2j01s0ufn	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mga20irx-gyc4xai4?name=daily-2025-10-01.pdf	126437	2025-10-02 23:36:12.948
cmga20ixq000es9p2bzqy60uc	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mga20iry-qlidjpbp?name=daily-2025-10-01.xlsx	7560	2025-10-02 23:36:13.023
cmga2c55n000gs9p2clwnkol6	DAILY_PDF	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mga2c534-k57h9uyv?name=daily-2025-10-01.pdf	126437	2025-10-02 23:45:15.036
cmga2c57o000hs9p2nu5djeuk	DAILY_XLSX	2025-10-01 00:00:00	\N	\N	\N	/api/reports/tmp/mga2c535-dxkbgh73?name=daily-2025-10-01.xlsx	7561	2025-10-02 23:45:15.108
cmga5gvfh0001ic04ez78wlpt	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mga5gvdv-j5gvpx8k?name=daily-2025-10-03.pdf	43957	2025-10-03 01:12:54.558
cmga5gvfy0002ic04akvyvib1	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mga5gvdw-7vmlvxca?name=daily-2025-10-03.xlsx	7329	2025-10-03 01:12:54.575
cmga5m1qt0001l40400c8q4oo	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mga5m1qh-y04kbiuk?name=daily-2025-10-03.pdf	52289	2025-10-03 01:16:56.021
cmga5m1r10002l40472rpxpji	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mga5m1qh-47mcy2o4?name=daily-2025-10-03.xlsx	7326	2025-10-03 01:16:56.029
cmga5m2hq0001l104xtqkp20x	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mga5m2h3-kkez8y12?name=daily-2025-10-03.pdf	52289	2025-10-03 01:16:56.99
cmga5m2i30002l1045ht94rnj	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mga5m2h4-ciq7ethv?name=daily-2025-10-03.xlsx	7326	2025-10-03 01:16:57.003
cmgarlfqv0001jx04uxbc0dl0	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgarlfot-ibn8v4nf?name=daily-2025-10-03.pdf	55034	2025-10-03 11:32:19.064
cmgarlfrc0002jx04xx9yoqzn	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgarlfou-p7g7kg9f?name=daily-2025-10-03.xlsx	7415	2025-10-03 11:32:19.081
cmgarnp6k0001l8040wlzodjg	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgarnp5z-9jwt4xji?name=daily-2025-10-03.pdf	55034	2025-10-03 11:34:04.604
cmgarnp6z0002l804ygrh6xkm	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgarnp5z-zidd53le?name=daily-2025-10-03.xlsx	7415	2025-10-03 11:34:04.62
cmgaro6u00004l804oqebubqx	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgaro6t7-j004o6eb?name=daily-2025-10-03.pdf	52208	2025-10-03 11:34:27.48
cmgaro6u40005l804qx20iixq	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgaro6t7-4htnmcns?name=daily-2025-10-03.xlsx	7359	2025-10-03 11:34:27.485
cmgarttun0001l804u82c7dfy	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgartttu-0zrfrz3c?name=daily-2025-10-03.pdf	55501	2025-10-03 11:38:50.591
cmgarttuw0002l804w8pealj9	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgartttv-yit6rsig?name=daily-2025-10-03.xlsx	7446	2025-10-03 11:38:50.601
cmgarulkp0004l804ms7lhvws	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgaruljs-rjk30z6v?name=daily-2025-10-03.pdf	55522	2025-10-03 11:39:26.521
cmgarulkv0005l804aphtnkih	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgaruljs-g70p9qjl?name=daily-2025-10-03.xlsx	7456	2025-10-03 11:39:26.527
cmgarvve20007l8040acuw4ih	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgarvvdu-t6zvkk5c?name=daily-2025-10-03.pdf	55101	2025-10-03 11:40:25.898
cmgarvve80008l804l503usbr	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgarvvdv-2so7hqlj?name=daily-2025-10-03.xlsx	7457	2025-10-03 11:40:25.904
cmgashzw00001s9hc7l4hwfaa	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgashzsu-4qz0rh32?name=daily-2025-10-03.pdf	121739	2025-10-03 11:57:38.16
cmgashzy90002s9hc75jtpdtx	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgashzsv-yh4oufqr?name=daily-2025-10-03.xlsx	7468	2025-10-03 11:57:38.241
cmgask05s0001s9swk5xtaa1k	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgask036-ddgm3hzd?name=daily-2025-10-03.pdf	121739	2025-10-03 11:59:11.825
cmgask07q0002s9swwnk2kpng	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgask036-zm3rgauv?name=daily-2025-10-03.xlsx	7467	2025-10-03 11:59:11.895
cmgatldyy0004s9swp2o5e75x	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgatldu3-mbx64v95?name=daily-2025-10-03.pdf	122383	2025-10-03 12:28:15.995
cmgatle0z0005s9swz8rtxkuv	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgatldu4-tou4ytjr?name=daily-2025-10-03.xlsx	7473	2025-10-03 12:28:16.068
cmgatr93r0007s9swmetzhx6f	DAILY_PDF	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgatr91p-9wz11qcm?name=daily-2025-10-03.pdf	122383	2025-10-03 12:32:49.623
cmgatr95y0008s9swzypoexdn	DAILY_XLSX	2025-10-03 00:00:00	\N	\N	\N	/api/reports/tmp/mgatr91q-60prwvbf?name=daily-2025-10-03.xlsx	7474	2025-10-03 12:32:49.702
cmgefrndw0001l204kib51bjj	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgefrnd0-llvqv261?name=daily-2025-10-06.pdf	55648	2025-10-06 01:12:18.213
cmgefrneb0002l204tbw6jxza	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgefrnd0-7pgh9c1g?name=daily-2025-10-06.xlsx	7379	2025-10-06 01:12:18.228
cmgefxs7d0001l7040s3m9xjx	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgefxs6l-mdmtoaw3?name=daily-2025-10-06.pdf	55693	2025-10-06 01:17:04.393
cmgefxs7m0002l704dn7cgab5	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgefxs6z-4ljnrmlc?name=daily-2025-10-06.xlsx	7385	2025-10-06 01:17:04.402
cmgefz4ko0004l7046vnfg8mj	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgefz4k6-w0l1myg4?name=daily-2025-10-06.pdf	55771	2025-10-06 01:18:07.08
cmgefz4ks0005l704wn5olf4d	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgefz4k7-8vh3s6h0?name=daily-2025-10-06.xlsx	7382	2025-10-06 01:18:07.085
cmgf7manj0001jo04vvhoyklv	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgf7malh-jvn5mb3l?name=daily-2025-10-06.pdf	62083	2025-10-06 14:11:57.679
cmgf7maoa0002jo04s8owu5p7	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgf7mali-xhst3zjj?name=daily-2025-10-06.xlsx	7608	2025-10-06 14:11:57.707
cmgffmclr0001la048cpp17py	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgffmclc-yhxa7qm5?name=daily-2025-10-06.pdf	75904	2025-10-06 17:55:57.135
cmgffmcly0002la04903hpdg5	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgffmcld-xlhqgles?name=daily-2025-10-06.xlsx	7853	2025-10-06 17:55:57.143
cmgfpv4pb0001s9pq0u04jcik	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfpv4lh-fefi0i0g?name=daily-2025-10-06.pdf	142385	2025-10-06 22:42:42.96
cmgfpv4sr0002s9pq1yv4j9u6	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfpv4lh-sq2eo2um?name=daily-2025-10-06.xlsx	7852	2025-10-06 22:42:43.083
cmgfq36fs0001s9e3qo5e3gke	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfq367r-yzgjz577?name=daily-2025-10-06.pdf	142385	2025-10-06 22:48:58.456
cmgfq36o00002s9e3j6mxcktb	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfq367r-5lisy3mp?name=daily-2025-10-06.xlsx	7853	2025-10-06 22:48:58.753
cmgfqfp140008s9e3gsqj7nz0	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfqfox0-pw2x64gi?name=daily-2025-10-06.pdf	139627	2025-10-06 22:58:42.424
cmgfqfp3h0009s9e3jvbezsn3	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfqfox0-6anc8kpz?name=daily-2025-10-06.xlsx	7810	2025-10-06 22:58:42.51
cmgfqp6lk0001s93rh68x9gsr	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfqp6ir-uzb7d29o?name=daily-2025-10-06.pdf	139627	2025-10-06 23:06:05.096
cmgfqp6ny0002s93rvtqyltt7	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfqp6ir-st4bdjls?name=daily-2025-10-06.xlsx	7810	2025-10-06 23:06:05.182
cmgftnmhr0001jo04zfvdkskp	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgftnmh2-ejcgag6x?name=daily-2025-10-06.pdf	73095	2025-10-07 00:28:51.232
cmgftnmi70002jo04oi3opszn	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgftnmh2-gerr620e?name=daily-2025-10-06.xlsx	7809	2025-10-07 00:28:51.248
cmgfu0rz00001s9ckzdmz0szy	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfu0rw4-fcn9chd3?name=daily-2025-10-06.pdf	139627	2025-10-07 00:39:04.86
cmgfu0s1n0002s9ck3279gav0	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfu0rw5-jbolht5d?name=daily-2025-10-06.xlsx	7809	2025-10-07 00:39:04.956
cmgfv562f0001s92jnztlwc32	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfv55zc-7qdy3ody?name=daily-2025-10-06.pdf	139627	2025-10-07 01:10:29.367
cmgfv564t0002s92jbig233e3	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfv55zc-s4zm8xqw?name=daily-2025-10-06.xlsx	7809	2025-10-07 01:10:29.454
cmgfvw4930001s9xrrhpltg6y	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfvw41o-3resqzdj?name=daily-2025-10-06.pdf	139627	2025-10-07 01:31:26.727
cmgfvw4hb0002s9xrmrxh59qk	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfvw41o-yaczw34d?name=daily-2025-10-06.xlsx	7809	2025-10-07 01:31:27.024
cmgfwh2xl0001s9v4w5220071	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfwh2ut-xoi8swdw?name=daily-2025-10-06.pdf	139597	2025-10-07 01:47:44.794
cmgfwh2zy0002s9v49r72bz1l	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgfwh2ut-z41i2c1c?name=daily-2025-10-06.xlsx	7807	2025-10-07 01:47:44.879
cmgghdkii0001s92r9wdjcokt	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghdkg6-1jnvr6ix?name=daily-2025-10-07.pdf	127661	2025-10-07 11:32:52.89
cmgghdkky0002s92roh80mvpz	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghdkg6-u8r3ns26?name=daily-2025-10-07.xlsx	7447	2025-10-07 11:32:52.979
cmgghdrg10004s92rmz037ygt	DAILY_PDF	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgghdre6-unh90hzt?name=daily-2025-10-06.pdf	127727	2025-10-07 11:33:01.873
cmgghdri20005s92rk7isuoe9	DAILY_XLSX	2025-10-06 00:00:00	\N	\N	\N	/api/reports/tmp/mgghdre7-qtfpjjta?name=daily-2025-10-06.xlsx	7517	2025-10-07 11:33:01.913
cmgghen1d0007s92rkim594wc	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghen0b-hu8qduri?name=daily-2025-10-07.pdf	127661	2025-10-07 11:33:42.817
cmgghen2d0008s92rvlse31hm	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghen0c-b6sfdee3?name=daily-2025-10-07.xlsx	7447	2025-10-07 11:33:42.853
cmgghfdz5000as92rxmsk5p10	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mgghfdxh-rl8dlfkr?name=daily-2025-10-08.pdf	129348	2025-10-07 11:34:17.729
cmgghfe07000bs92rm7l2p2kb	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mgghfdxh-cs0m98wt?name=daily-2025-10-08.xlsx	7486	2025-10-07 11:34:17.767
cmgghhqwp000ds92r72ujahhw	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mgghhquw-fnkt1dz4?name=daily-2025-10-08.pdf	129369	2025-10-07 11:36:07.801
cmgghhqz5000es92rku2e8gvs	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mgghhqux-h4tygqcp?name=daily-2025-10-08.xlsx	7500	2025-10-07 11:36:07.89
cmgghkuex000gs92rrgw97isb	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mgghkud9-ezfoegro?name=daily-2025-10-08.pdf	130179	2025-10-07 11:38:32.314
cmgghkugu000hs92r1l03jc5w	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mgghkud9-62x36lb6?name=daily-2025-10-08.xlsx	7501	2025-10-07 11:38:32.383
cmgghmgqg000js92rge6tcg5f	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghmgmo-dgkojpef?name=daily-2025-10-07.pdf	132314	2025-10-07 11:39:47.896
cmgghmgsj000ks92rlo19jiru	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghmgmp-qbeb41i2?name=daily-2025-10-07.xlsx	7590	2025-10-07 11:39:47.972
cmgghs9nf000ms92rbek94p7r	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghs9lh-8s7jxu42?name=daily-2025-10-07.pdf	128283	2025-10-07 11:44:18.651
cmgghs9pd000ns92r92kqiu02	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghs9lh-xjjr7j7j?name=daily-2025-10-07.xlsx	7477	2025-10-07 11:44:18.721
cmgghtb0o000ps92r7c44vtqq	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghtayh-dmsmnoaf?name=daily-2025-10-07.pdf	128148	2025-10-07 11:45:07.08
cmgghtb2y000qs92r33ny1e4f	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghtayh-ulaczb9z?name=daily-2025-10-07.xlsx	7480	2025-10-07 11:45:07.163
cmgghu3b4000ss92rhju674ct	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghu396-3t9ybueb?name=daily-2025-10-07.pdf	127745	2025-10-07 11:45:43.744
cmgghu3c9000ts92rdhjnhuf8	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgghu397-efsav84d?name=daily-2025-10-07.xlsx	7503	2025-10-07 11:45:43.786
cmggi1aya000vs92r38loii9c	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggi1awl-1092zvvj?name=daily-2025-10-07.pdf	127755	2025-10-07 11:51:20.242
cmggi1b0h000ws92rpe2oo98u	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggi1awl-xd6k6633?name=daily-2025-10-07.xlsx	7513	2025-10-07 11:51:20.322
cmggiek0v0001jf04b5qscx2y	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggiejzo-rsjavi21?name=daily-2025-10-07.pdf	58585	2025-10-07 12:01:38.528
cmggiek1f0002jf04g5io1pzz	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggiek03-pix6b5hu?name=daily-2025-10-07.xlsx	7513	2025-10-07 12:01:38.547
cmggigfbk0001l504ju5lagd8	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggigfb1-v3d8gspw?name=daily-2025-10-07.pdf	58590	2025-10-07 12:03:05.744
cmggigfbx0002l504dauoam2n	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggigfb1-ml4px28o?name=daily-2025-10-07.xlsx	7513	2025-10-07 12:03:05.758
cmgginq6o0004l504gx2kdcwt	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgginq5u-2i3mscu3?name=daily-2025-10-07.pdf	58590	2025-10-07 12:08:46.416
cmgginq6y0005l504lhz49vf0	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgginq6d-4v9ubfkb?name=daily-2025-10-07.xlsx	7514	2025-10-07 12:08:46.426
cmggiof9d0007l504jnri4ki3	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggiof96-hjzag1kf?name=daily-2025-10-07.pdf	58590	2025-10-07 12:09:18.913
cmggiof9i0008l504qwejtjej	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggiof96-kejxa2do?name=daily-2025-10-07.xlsx	7514	2025-10-07 12:09:18.919
cmggir4p4000al504v4oir786	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mggir4oz-p1te32yw?name=daily-2025-10-08.pdf	64972	2025-10-07 12:11:25.192
cmggir4p8000bl504bj08q4ky	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mggir4oz-6gvdlu4v?name=daily-2025-10-08.xlsx	7700	2025-10-07 12:11:25.196
cmggir5920001gw04xc78zs9d	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mggir58v-10tp2kc3?name=daily-2025-10-08.pdf	64972	2025-10-07 12:11:25.91
cmggir5960002gw04oeyr4phf	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mggir58v-iuoo07gj?name=daily-2025-10-08.xlsx	7700	2025-10-07 12:11:25.914
cmggiuy5i0001jp04936ww4cv	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggiuy4x-wnuj04gy?name=daily-2025-10-07.pdf	58590	2025-10-07 12:14:23.334
cmggiuy5o0002jp04p2wkjc7g	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggiuy4y-n0amznrb?name=daily-2025-10-07.xlsx	7513	2025-10-07 12:14:23.34
cmggo7q2x0001l2047r04cw5q	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggo7q22-yzxkr9kv?name=daily-2025-10-07.pdf	58590	2025-10-07 14:44:17.481
cmggo7q370002l204drq79qwo	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggo7q23-kse22m4p?name=daily-2025-10-07.xlsx	7514	2025-10-07 14:44:17.491
cmggpoi7v0003l4049rnx31uh	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggpoi7d-qqohx1bu?name=daily-2025-10-07.pdf	58585	2025-10-07 15:25:20.06
cmggpoi8c0004l404trewfpvi	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggpoi7e-ih8t1eyd?name=daily-2025-10-07.xlsx	7510	2025-10-07 15:25:20.077
cmggrm3uo0001s93u4xkcq4p2	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggrm3nz-36owfdol?name=daily-2025-10-07.pdf	127748	2025-10-07 16:19:27.361
cmggrm4350002s93umlnxl3di	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggrm3nz-0dipy3j1?name=daily-2025-10-07.xlsx	7510	2025-10-07 16:19:27.665
cmggrmb3g0004s93u4389bbi3	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mggrmb1s-j81uslxl?name=daily-2025-10-08.pdf	136040	2025-10-07 16:19:36.749
cmggrmb5s0005s93u66ciglvu	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mggrmb1s-uazal0m5?name=daily-2025-10-08.xlsx	7753	2025-10-07 16:19:36.833
cmggs5lr20007s93ucwzlckt4	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggs5loz-uh072p2q?name=daily-2025-10-07.pdf	127748	2025-10-07 16:34:37.023
cmggs5lu50008s93ufitzkflf	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggs5lp0-zbr7ybtj?name=daily-2025-10-07.xlsx	7510	2025-10-07 16:34:37.133
cmggsj4yc0001s9pxt4clbkbg	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggsj4wa-1y4qwmr9?name=daily-2025-10-07.pdf	127748	2025-10-07 16:45:08.436
cmggsj50k0002s9pxfud5i9k2	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mggsj4wb-ix9ie9mc?name=daily-2025-10-07.xlsx	7510	2025-10-07 16:45:08.516
cmghx1gxd0001l4048262iz29	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mghx1gwl-703yl0j2?name=daily-2025-10-08.pdf	59505	2025-10-08 11:39:08.401
cmghx1gxk0002l404v2qptk2v	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mghx1gx3-22pfebmi?name=daily-2025-10-08.xlsx	7571	2025-10-08 11:39:08.408
cmghxr7sw0001kz04jdo0sjt0	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mghxr7s1-mrs2mxgn?name=daily-2025-10-08.pdf	55686	2025-10-08 11:59:09.633
cmghxr7t50002kz04lwvnt9x1	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mghxr7sc-hp0w5xq7?name=daily-2025-10-08.xlsx	7565	2025-10-08 11:59:09.641
cmghxs3iz0006kz04be0ecu1o	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mghxs3hx-qum2ei2e?name=daily-2025-10-08.pdf	55722	2025-10-08 11:59:50.748
cmghxs3j30007kz04xlmeoek5	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mghxs3iu-bv8n86l9?name=daily-2025-10-08.xlsx	7566	2025-10-08 11:59:50.752
cmghxzyup0001jy04fve2zo2q	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mghxzyu3-hd5yg6ga?name=daily-2025-10-08.pdf	55722	2025-10-08 12:05:57.937
cmghxzyuv0002jy048x863h2a	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mghxzyu3-ftb4z5z6?name=daily-2025-10-08.xlsx	7567	2025-10-08 12:05:57.944
cmghy5jgl0004jy04mbglv1uw	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mghy5jfh-c7sdiveh?name=daily-2025-10-08.pdf	58483	2025-10-08 12:10:17.925
cmghy5jgs0005jy04t6m4xrg2	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mghy5jg0-940fqt2n?name=daily-2025-10-08.xlsx	7619	2025-10-08 12:10:17.932
cmgi9iuy60003l404u1urv1xd	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mgi9iuxf-2yhy29t6?name=daily-2025-10-08.pdf	61233	2025-10-08 17:28:35.118
cmgi9iuyc0004l404gh6vpu9x	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mgi9iuxg-877n7g1h?name=daily-2025-10-08.xlsx	7700	2025-10-08 17:28:35.125
cmgib4bo90003l704eg6vxgb0	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgib4bnz-hds3uobq?name=daily-2025-10-09.pdf	66955	2025-10-08 18:13:16.186
cmgib4bon0004l70468oum2yk	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgib4bo0-w2trdlb9?name=daily-2025-10-09.xlsx	7760	2025-10-08 18:13:16.199
cmginq9up0001kw042r3tjiit	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mginq9tt-gyv9dm7t?name=daily-2025-10-08.pdf	61224	2025-10-09 00:06:15.65
cmginq9v80002kw0469audsl8	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mginq9tt-rp72hk0c?name=daily-2025-10-08.xlsx	7694	2025-10-09 00:06:15.669
cmgje9x3n0001jp04iunz1vmd	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgje9x2q-wr9749v3?name=daily-2025-10-09.pdf	59127	2025-10-09 12:29:22.259
cmgje9x4e0002jp04lhl9ggqb	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgje9x2q-h3q3hzf0?name=daily-2025-10-09.xlsx	7609	2025-10-09 12:29:22.286
cmgjfnya00001jy044ztpfx9q	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjfny8d-9sin7fx8?name=daily-2025-10-09.pdf	59520	2025-10-09 13:08:16.585
cmgjfnya90002jy040hfwxuti	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjfny8e-vqpg96ms?name=daily-2025-10-09.xlsx	7596	2025-10-09 13:08:16.594
cmgji8olc0001jl045uby6t5r	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgji8okc-6551xagd?name=daily-2025-10-09.pdf	59520	2025-10-09 14:20:23.04
cmgji8olk0002jl04eu6cyesc	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgji8okd-9hxdk667?name=daily-2025-10-09.xlsx	7596	2025-10-09 14:20:23.048
cmgji9tc90001kw04p06j3lwl	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgji9tav-6xmw9jcw?name=daily-2025-10-09.pdf	59450	2025-10-09 14:21:15.849
cmgji9tck0002kw04uk9iv49g	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgji9tav-9fpnrp0y?name=daily-2025-10-09.xlsx	7600	2025-10-09 14:21:15.86
cmgjip37u0008jl04yeriddzq	DAILY_PDF	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgjip379-46924a3r?name=daily-2025-10-07.pdf	58564	2025-10-09 14:33:08.49
cmgjip3810009jl04ahb0sod2	DAILY_XLSX	2025-10-07 00:00:00	\N	\N	\N	/api/reports/tmp/mgjip37a-5kvhpw90?name=daily-2025-10-07.xlsx	7502	2025-10-09 14:33:08.498
cmgjkcrpa0001l4043h7m9zep	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjkcrop-fkrp5hyn?name=daily-2025-10-09.pdf	61506	2025-10-09 15:19:32.927
cmgjkcrq70002l404dxfonata	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjkcroq-r1331f1g?name=daily-2025-10-09.xlsx	7606	2025-10-09 15:19:32.936
cmgjkdmtl0004l404njn758qe	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjkdmsi-s0z6xm6m?name=daily-2025-10-09.pdf	61506	2025-10-09 15:20:13.257
cmgjkdmto0005l404c2sbhn9m	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjkdmt2-4avr7roj?name=daily-2025-10-09.xlsx	7605	2025-10-09 15:20:13.261
cmgjlxjgo0001l204pzkaijfa	DAILY_PDF	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mgjlxjfw-dba8vp87?name=daily-2025-10-08.pdf	61219	2025-10-09 16:03:41.64
cmgjlxjh60002l204knaynrl1	DAILY_XLSX	2025-10-08 00:00:00	\N	\N	\N	/api/reports/tmp/mgjlxjfw-uyz9nzhi?name=daily-2025-10-08.xlsx	7727	2025-10-09 16:03:41.659
cmgjm025x0004l204ud4ia9i1	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjm025f-v0nzjb1b?name=daily-2025-10-09.pdf	61506	2025-10-09 16:05:39.189
cmgjm02620005l204rktpo3s9	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjm025i-v5vd1kqm?name=daily-2025-10-09.xlsx	7606	2025-10-09 16:05:39.194
cmgjmjc0z0007l204m2ff3fh9	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjmjc0k-yhsxyye4?name=daily-2025-10-09.pdf	61506	2025-10-09 16:20:38.436
cmgjmjc1j0008l204sewz3gqj	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjmjc0k-qaai4vzi?name=daily-2025-10-09.xlsx	7606	2025-10-09 16:20:38.456
cmgjmjizh000al2040tqhg4w1	DAILY_PDF	2025-10-11 00:00:00	\N	\N	\N	/api/reports/tmp/mgjmjiyo-z3unr032?name=daily-2025-10-11.pdf	46670	2025-10-09 16:20:47.453
cmgjmjizm000bl204niiyltxi	DAILY_XLSX	2025-10-11 00:00:00	\N	\N	\N	/api/reports/tmp/mgjmjiyo-838vmapz?name=daily-2025-10-11.xlsx	7076	2025-10-09 16:20:47.459
cmgjqet520001ld04xqn8jtfb	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjqet4k-jyphc6ac?name=daily-2025-10-09.pdf	59474	2025-10-09 18:09:05.798
cmgjqet5k0002ld04kjjwfa3e	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjqet4k-q3cervtv?name=daily-2025-10-09.xlsx	7606	2025-10-09 18:09:05.817
cmgjqfi780004ld04ea9w32r4	DAILY_PDF	2025-10-10 00:00:00	\N	\N	\N	/api/reports/tmp/mgjqfi6r-jwy1bowt?name=daily-2025-10-10.pdf	59088	2025-10-09 18:09:38.276
cmgjqfi7c0005ld041j67abao	DAILY_XLSX	2025-10-10 00:00:00	\N	\N	\N	/api/reports/tmp/mgjqfi6s-c9bcrdzd?name=daily-2025-10-10.xlsx	7716	2025-10-09 18:09:38.281
cmgjwhtke0001l40482pr1x1q	DAILY_PDF	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjwhtjg-1tfjk9p8?name=daily-2025-10-09.pdf	58649	2025-10-09 20:59:24.014
cmgjwhtkv0002l404csn2zsvl	DAILY_XLSX	2025-10-09 00:00:00	\N	\N	\N	/api/reports/tmp/mgjwhtjt-d1lwfsjj?name=daily-2025-10-09.xlsx	7621	2025-10-09 20:59:24.031
cmgjwjejk0004l404enlk9ldy	DAILY_PDF	2025-10-10 00:00:00	\N	\N	\N	/api/reports/tmp/mgjwjeil-ip929zm5?name=daily-2025-10-10.pdf	56197	2025-10-09 21:00:37.857
cmgjwjejo0005l404cncejvo9	DAILY_XLSX	2025-10-10 00:00:00	\N	\N	\N	/api/reports/tmp/mgjwjej6-ws3r134w?name=daily-2025-10-10.xlsx	7591	2025-10-09 21:00:37.861
cmgn3u82m0001la04ubggpdr6	DAILY_PDF	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgn3u81x-x85s5t25?name=daily-2025-10-13.pdf	61537	2025-10-12 02:48:18.526
cmgn3u8320002la0485sudluw	DAILY_XLSX	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgn3u81x-pawe44yj?name=daily-2025-10-13.xlsx	7659	2025-10-12 02:48:18.543
cmgp32jq50001l504zwza55dr	DAILY_PDF	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgp32jpd-w91z5far?name=daily-2025-10-13.pdf	61548	2025-10-13 12:02:19.613
cmgp32jqp0002l504tuepg5p1	DAILY_XLSX	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgp32jpe-mk3zpljz?name=daily-2025-10-13.xlsx	7670	2025-10-13 12:02:19.633
cmgp35nfr0001kv04lurs8xho	DAILY_PDF	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgp35nf3-tcvetaw8?name=daily-2025-10-13.pdf	62010	2025-10-13 12:04:44.391
cmgp35ng20002kv04f8p9tv6h	DAILY_XLSX	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgp35nf4-n19d1kfz?name=daily-2025-10-13.xlsx	7688	2025-10-13 12:04:44.402
cmgp38ron0004kv04u26u2xq3	DAILY_PDF	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgp38rof-sknz69vk?name=daily-2025-10-13.pdf	62010	2025-10-13 12:07:09.864
cmgp38ror0005kv0441vfdv3e	DAILY_XLSX	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgp38roi-pt0pjrmr?name=daily-2025-10-13.xlsx	7687	2025-10-13 12:07:09.868
cmgppzu820001jl04ainy5a8l	DAILY_PDF	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgppzu7h-wr6ypmff?name=daily-2025-10-13.pdf	62041	2025-10-13 22:44:04.419
cmgppzu870002jl040oobeare	DAILY_XLSX	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgppzu7i-d8p3amo1?name=daily-2025-10-13.xlsx	7692	2025-10-13 22:44:04.424
cmgqfs6dk0001jr041c83y0vh	DAILY_PDF	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgqfs6d5-vboruyyd?name=daily-2025-10-13.pdf	62047	2025-10-14 10:45:56.936
cmgqfs6dp0002jr04tjnt0zyi	DAILY_XLSX	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgqfs6d5-526vf8e3?name=daily-2025-10-13.xlsx	7693	2025-10-14 10:45:56.942
cmgqjnzm60001l804ypdehb3k	DAILY_PDF	2025-10-14 00:00:00	\N	\N	\N	/api/reports/tmp/mgqjnzlv-aa6wh8oo?name=daily-2025-10-14.pdf	59598	2025-10-14 12:34:40.014
cmgqjnzmf0002l804tmppr3ok	DAILY_XLSX	2025-10-14 00:00:00	\N	\N	\N	/api/reports/tmp/mgqjnzlw-xe7n9goc?name=daily-2025-10-14.xlsx	7668	2025-10-14 12:34:40.024
cmgqjp7p60004l80471bmds81	DAILY_PDF	2025-10-14 00:00:00	\N	\N	\N	/api/reports/tmp/mgqjp7o6-88q927zk?name=daily-2025-10-14.pdf	59599	2025-10-14 12:35:37.147
cmgqjp7pb0005l8042qvmicrw	DAILY_XLSX	2025-10-14 00:00:00	\N	\N	\N	/api/reports/tmp/mgqjp7oo-pa1txbd8?name=daily-2025-10-14.xlsx	7668	2025-10-14 12:35:37.151
cmgqkkmti0001le04iypqrufr	DAILY_PDF	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgqkkmt1-mvac3me9?name=daily-2025-10-13.pdf	62444	2025-10-14 13:00:03.078
cmgqkkmtn0002le043s1wv0fc	DAILY_XLSX	2025-10-13 00:00:00	\N	\N	\N	/api/reports/tmp/mgqkkmt2-ezv6mesy?name=daily-2025-10-13.xlsx	7677	2025-10-14 13:00:03.083
cmgryo4uf0001l404ae66guvg	DAILY_PDF	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgryo4ta-71aj7t1d?name=daily-2025-10-15.pdf	61303	2025-10-15 12:22:27.208
cmgryo4ux0002l404umym9k95	DAILY_XLSX	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgryo4ta-btycr345?name=daily-2025-10-15.xlsx	7731	2025-10-15 12:22:27.226
cmgs08pdx0004l404ig8umjlk	DAILY_PDF	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgs08pdn-0imsps20?name=daily-2025-10-15.pdf	61227	2025-10-15 13:06:26.566
cmgs08pe20005l404byhxdc4c	DAILY_XLSX	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgs08pdo-iu6nhidn?name=daily-2025-10-15.xlsx	7733	2025-10-15 13:06:26.571
cmgs1sc6j0001l204sccryzwu	DAILY_PDF	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgs1sc5r-7gc6ajky?name=daily-2025-10-15.pdf	61223	2025-10-15 13:49:42.187
cmgs1sc6s0002l204vuk12jy6	DAILY_XLSX	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgs1sc5s-n9qnr34s?name=daily-2025-10-15.xlsx	7724	2025-10-15 13:49:42.196
cmgs22v350007l804sfbhhkmi	DAILY_PDF	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgs22v2m-jz278npe?name=daily-2025-10-15.pdf	58764	2025-10-15 13:57:53.25
cmgs22v3b0008l804mm9eduxv	DAILY_XLSX	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgs22v2m-xnkqp2zp?name=daily-2025-10-15.xlsx	7715	2025-10-15 13:57:53.255
cmgs23e7z000al804hx65vcbl	DAILY_PDF	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgs23e6u-rits1pkf?name=daily-2025-10-15.pdf	59192	2025-10-15 13:58:18.048
cmgs23e83000bl804qnjkxlh5	DAILY_XLSX	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgs23e7i-6pdjfft2?name=daily-2025-10-15.xlsx	7715	2025-10-15 13:58:18.051
cmgsbso1h0001s9u1i62orjd9	DAILY_PDF	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgsbsnzf-5q7gnk6m?name=daily-2025-10-15.pdf	129957	2025-10-15 18:29:53.717
cmgsbso3d0002s9u14l8rkzx5	DAILY_XLSX	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgsbsnzg-e5bkf1nx?name=daily-2025-10-15.xlsx	7715	2025-10-15 18:29:53.785
cmgsbsp9m0004s9u1pc1iwe5b	DAILY_PDF	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgsbsp7g-wjote104?name=daily-2025-10-15.pdf	129957	2025-10-15 18:29:55.307
cmgsbspbr0005s9u1myspgr3s	DAILY_XLSX	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgsbsp7g-pmgwaoq0?name=daily-2025-10-15.xlsx	7715	2025-10-15 18:29:55.384
cmgsq95y10001l4048g7esbet	DAILY_PDF	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgsq95w7-tplk8yzy?name=daily-2025-10-15.pdf	61132	2025-10-16 01:14:38.042
cmgsq95yc0002l404m2fng01o	DAILY_XLSX	2025-10-15 00:00:00	\N	\N	\N	/api/reports/tmp/mgsq95wo-dbwvxu8x?name=daily-2025-10-15.xlsx	7716	2025-10-16 01:14:38.052
cmgtbctsk0001s9rur1slsxog	DAILY_PDF	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtbctpb-w3bb500d?name=daily-2025-10-16.pdf	129023	2025-10-16 11:05:20.853
cmgtbctus0002s9ru340sx0vc	DAILY_XLSX	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtbctpc-vi3n5rb7?name=daily-2025-10-16.xlsx	7615	2025-10-16 11:05:20.933
cmgtbfjkt0004s9ruh9nrza0f	DAILY_PDF	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtbfjjq-nytqjxet?name=daily-2025-10-16.pdf	129023	2025-10-16 11:07:27.582
cmgtbfjls0005s9rux5om6v19	DAILY_XLSX	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtbfjjq-x3v53wzi?name=daily-2025-10-16.xlsx	7615	2025-10-16 11:07:27.617
cmgtip78f0001l804id0pt755	DAILY_PDF	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtip77f-1cmnso6k?name=daily-2025-10-16.pdf	59362	2025-10-16 14:30:55.456
cmgtip78n0002l804p5z0vpfh	DAILY_XLSX	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtip77g-ay7eqnqm?name=daily-2025-10-16.xlsx	7607	2025-10-16 14:30:55.464
cmgtj14u60004l804garpqpiv	DAILY_PDF	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtj14tj-64062nuu?name=daily-2025-10-16.pdf	55005	2025-10-16 14:40:12.223
cmgtj14um0005l804u2hb0bnh	DAILY_XLSX	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtj14tz-k64r6uxf?name=daily-2025-10-16.xlsx	7495	2025-10-16 14:40:12.238
cmgtj5buk0001l704kown6vod	DAILY_PDF	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtj5btp-4bxuowdj?name=daily-2025-10-16.pdf	55011	2025-10-16 14:43:27.932
cmgtj5bup0002l704cf1t2ccr	DAILY_XLSX	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtj5btq-hhswsj9f?name=daily-2025-10-16.xlsx	7496	2025-10-16 14:43:27.938
cmgtj5cch0004l7044ybcj8lm	DAILY_PDF	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtj5ccc-rhfy81ml?name=daily-2025-10-16.pdf	55011	2025-10-16 14:43:28.577
cmgtj5cck0005l704pv9oixgz	DAILY_XLSX	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtj5ccc-j4wctqcp?name=daily-2025-10-16.xlsx	7496	2025-10-16 14:43:28.58
cmgtwzwdk0001jo0433qbahxt	DAILY_PDF	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtwzwcq-hgytam49?name=daily-2025-10-16.pdf	52420	2025-10-16 21:11:09.225
cmgtwzwe40002jo04kunoy1eo	DAILY_XLSX	2025-10-16 00:00:00	\N	\N	\N	/api/reports/tmp/mgtwzwcs-5uxk9v1d?name=daily-2025-10-16.xlsx	7495	2025-10-16 21:11:09.244
cmguw6cw20001js047aqx1z7k	DAILY_PDF	2025-10-17 00:00:00	\N	\N	\N	/api/reports/tmp/mguw6cv6-mri9rr79?name=daily-2025-10-17.pdf	48338	2025-10-17 13:35:57.122
cmguw6cxu0002js04zk28wi6f	DAILY_XLSX	2025-10-17 00:00:00	\N	\N	\N	/api/reports/tmp/mguw6cv7-o46x65gh?name=daily-2025-10-17.xlsx	6959	2025-10-17 13:35:57.15
cmguw6dwh0004js04z1796nz5	DAILY_PDF	2025-10-17 00:00:00	\N	\N	\N	/api/reports/tmp/mguw6dw9-3bk9zp7p?name=daily-2025-10-17.pdf	48338	2025-10-17 13:35:58.433
cmguw6dws0005js04rtxedxwz	DAILY_XLSX	2025-10-17 00:00:00	\N	\N	\N	/api/reports/tmp/mguw6dwa-j5r9oghd?name=daily-2025-10-17.xlsx	6959	2025-10-17 13:35:58.444
c98c0696-b69a-4465-98d3-fb688b8edb25	DAILY_PDF	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz5oldd-smuq93jx?name=daily-2025-10-20.pdf	120445	2025-10-20 13:13:09.249
0975aa62-fd0b-43a8-b0b9-b391eaf06287	DAILY_XLSX	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz5olde-qtw3gp3y?name=daily-2025-10-20.xlsx	7500	2025-10-20 13:13:09.335
468021a5-c697-462a-b659-7c099ced3892	DAILY_PDF	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz609q7-0kh9yqal?name=daily-2025-10-20.pdf	125333	2025-10-20 13:22:14.024
ebbe2663-fe46-41cd-8ffb-6bf765fc696a	DAILY_XLSX	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz609q7-uyi6iru4?name=daily-2025-10-20.xlsx	7603	2025-10-20 13:22:14.088
3cfaf32a-07ae-4f5a-be6a-9bae43d01bb5	DAILY_PDF	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz63onn-208l0yp7?name=daily-2025-10-20.pdf	125495	2025-10-20 13:24:53.33
0b31e4eb-7c48-4637-8b33-9d1064907c85	DAILY_XLSX	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz63onn-12fz3jpu?name=daily-2025-10-20.xlsx	7632	2025-10-20 13:24:53.392
24bfb1e0-d3e3-45af-ac73-fdd491425b76	DAILY_PDF	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz6l3eq-hzi7qvti?name=daily-2025-10-20.pdf	125957	2025-10-20 13:38:25.613
bb447151-2d9a-4164-a247-fb5e961264e0	DAILY_XLSX	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz6l3eq-wlxza4n0?name=daily-2025-10-20.xlsx	7647	2025-10-20 13:38:25.689
242f85f4-8fc4-4087-a761-ec3cc3389f9a	DAILY_PDF	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz6woft-n7cnd3po?name=daily-2025-10-20.pdf	58883	2025-10-20 13:47:26.058
5709e0d1-cbda-4b3b-9dea-19ea013a6858	DAILY_XLSX	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz6wogt-o5zui87l?name=daily-2025-10-20.xlsx	7648	2025-10-20 13:47:26.065
507165bd-2a86-4ab1-b355-419e53eec18f	DAILY_PDF	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz7pc9w-uhmir0bo?name=daily-2025-10-20.pdf	58896	2025-10-20 14:09:43.297
31f56f58-e7a3-4a55-94de-de9a9907e010	DAILY_XLSX	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz7pca3-lkxnd8v8?name=daily-2025-10-20.xlsx	7654	2025-10-20 14:09:43.305
1474aa15-f07d-4e22-bf8f-ebcd316aae88	DAILY_PDF	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz7ptl9-46dxp3de?name=daily-2025-10-20.pdf	58876	2025-10-20 14:10:05.738
cb6a4bbb-f410-4cb9-821d-b294406b4d9e	DAILY_XLSX	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgz7ptls-p5cbt1vy?name=daily-2025-10-20.xlsx	7649	2025-10-20 14:10:05.751
e6bfdec2-8064-427e-8775-594151e0041e	DAILY_PDF	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgzdw3b3-bbanajzd?name=daily-2025-10-20.pdf	55727	2025-10-20 17:02:55.998
57ea80fd-bcf3-4811-b657-4994a43b81dd	DAILY_XLSX	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mgzdw3bf-5hmp6m7r?name=daily-2025-10-20.xlsx	7524	2025-10-20 17:02:56.014
2c79a00f-417c-45bc-beb4-edeb977feed8	DAILY_PDF	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0j65ln-e8mr1yd2?name=daily-2025-10-21.pdf	58151	2025-10-21 12:18:29.748
2324ca11-5aae-49af-b4a7-8f7440d195c1	DAILY_XLSX	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0j65lp-i0i1w7aq?name=daily-2025-10-21.xlsx	7661	2025-10-21 12:18:29.769
a207579e-d002-4a7a-9000-e2a589305f90	DAILY_PDF	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0j7z3j-2sisbte4?name=daily-2025-10-21.pdf	61904	2025-10-21 12:19:54.627
36bff467-d028-4edd-b7c9-24e80b526a49	DAILY_XLSX	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0j7z3k-y8erq354?name=daily-2025-10-21.xlsx	7658	2025-10-21 12:19:54.644
a18eebee-4300-414c-aa23-a727aac124c9	DAILY_PDF	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0j9crr-ztj15ws0?name=daily-2025-10-21.pdf	61848	2025-10-21 12:20:58.992
5e1b5be9-f9c1-48c5-bfbe-8eaff4e161a1	DAILY_XLSX	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0j9crr-zgewk58m?name=daily-2025-10-21.xlsx	7665	2025-10-21 12:20:59.005
cb84cd49-e013-4494-9b79-e751b8e7bc33	DAILY_PDF	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0jxmj0-0i2rxhbh?name=daily-2025-10-21.pdf	61846	2025-10-21 12:39:51.4
3372a7c1-bb71-4483-bbd6-1b6c818a4989	DAILY_XLSX	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0jxmjh-7ye8irhr?name=daily-2025-10-21.xlsx	7668	2025-10-21 12:39:51.407
e1501ea1-d947-4573-9a7f-84f34cb9463d	DAILY_PDF	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0m89du-n1jy6ygo?name=daily-2025-10-21.pdf	52964	2025-10-21 13:44:06.82
e6cd9f88-9253-4ae8-a37c-c6bcca212810	DAILY_XLSX	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0m89ec-pvjvitri?name=daily-2025-10-21.xlsx	7669	2025-10-21 13:44:06.86
53d8f134-a3ae-4120-8244-7a99e2f2cf58	DAILY_PDF	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0m89hi-fzfxvw7c?name=daily-2025-10-21.pdf	52964	2025-10-21 13:44:06.944
9e9da93e-5eab-47ee-bc30-808e76ad04f7	DAILY_XLSX	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh0m89hx-eau3w5nd?name=daily-2025-10-21.xlsx	7669	2025-10-21 13:44:06.952
5a902fbc-e7fb-435e-ae19-52adef37ec92	DAILY_PDF	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mh12wocb-b2e4couz?name=daily-2025-10-20.pdf	55348	2025-10-21 21:30:59.794
5e309762-a40a-4443-98d3-45c5db297b9e	DAILY_XLSX	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mh12wocc-hp0509qh?name=daily-2025-10-20.xlsx	7525	2025-10-21 21:30:59.817
73e7fb6e-1ed5-41bb-a669-ffcf52241a09	DAILY_PDF	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mh12x0bm-rixp2fgk?name=daily-2025-10-20.pdf	55348	2025-10-21 21:31:16.024
a9e245d0-3e50-4296-9eb9-4d9d38c78569	DAILY_XLSX	2025-10-20 00:00:00	\N	\N	\N	/api/reports/tmp/mh12x0bv-5dnqlgvf?name=daily-2025-10-20.xlsx	7524	2025-10-21 21:31:16.029
499fb09b-b339-4832-81c5-cd06a6d53041	DAILY_PDF	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh130unr-ulhebeaj?name=daily-2025-10-21.pdf	61853	2025-10-21 21:34:14.595
e770292b-2e5c-463d-9edc-ff65f5ece2ca	DAILY_XLSX	2025-10-21 00:00:00	\N	\N	\N	/api/reports/tmp/mh130unr-vdbgdr5g?name=daily-2025-10-21.xlsx	7665	2025-10-21 21:34:14.602
bb845025-f878-4eda-ad74-0790bf5756fe	DAILY_PDF	2025-10-22 00:00:00	\N	\N	\N	/api/reports/tmp/mh2056bv-7m6cpz09?name=daily-2025-10-22.pdf	61812	2025-10-22 13:01:23.703
61794c2b-b2f1-400f-ac7f-6a812c48054d	DAILY_XLSX	2025-10-22 00:00:00	\N	\N	\N	/api/reports/tmp/mh2056c1-ugdgobhy?name=daily-2025-10-22.xlsx	7637	2025-10-22 13:01:23.733
7e52b295-9c56-4092-9f78-706d3e73e9bf	DAILY_PDF	2025-10-22 00:00:00	\N	\N	\N	/api/reports/tmp/mh20831h-zpl5smnv?name=daily-2025-10-22.pdf	61756	2025-10-22 13:03:39.407
e1e3c147-e3b3-4c89-91cb-f6e0895f74c5	DAILY_XLSX	2025-10-22 00:00:00	\N	\N	\N	/api/reports/tmp/mh20832f-0ur1z7l1?name=daily-2025-10-22.xlsx	7640	2025-10-22 13:03:39.42
eb2dc3e9-9aa2-4d08-9a31-af8ac3f104de	DAILY_PDF	2025-10-22 00:00:00	\N	\N	\N	/api/reports/tmp/mh2083cs-whv58x37?name=daily-2025-10-22.pdf	61756	2025-10-22 13:03:39.782
2d429640-349e-4c50-bee5-fba3f4d882e8	DAILY_XLSX	2025-10-22 00:00:00	\N	\N	\N	/api/reports/tmp/mh2083cs-s505ywrg?name=daily-2025-10-22.xlsx	7640	2025-10-22 13:03:39.796
3ae123ec-f1bc-4522-8cfc-bb6fafc8f493	DAILY_PDF	2025-10-22 00:00:00	\N	\N	\N	/api/reports/tmp/mh25zqya-kdml1nlk?name=daily-2025-10-22.pdf	64495	2025-10-22 15:45:08.217
b1723682-72a8-4bb1-81d5-9c3059f86b1f	DAILY_XLSX	2025-10-22 00:00:00	\N	\N	\N	/api/reports/tmp/mh25zqyh-3r46h53b?name=daily-2025-10-22.xlsx	7708	2025-10-22 15:45:08.236
160931d7-bfd4-4347-95b5-5cf874a78fa5	DAILY_PDF	2025-10-23 00:00:00	\N	\N	\N	/api/reports/tmp/mh3jyppp-l75njlvo?name=daily-2025-10-23.pdf	55423	2025-10-23 15:04:00.752
579adcfb-0cb6-471d-88f3-9f7354ffea8c	DAILY_XLSX	2025-10-23 00:00:00	\N	\N	\N	/api/reports/tmp/mh3jypq9-a3gdf9ey?name=daily-2025-10-23.xlsx	7409	2025-10-23 15:04:00.782
1b1162b9-8a88-4e26-ad30-15edeb4a99b1	DAILY_PDF	2025-10-23 00:00:00	\N	\N	\N	/api/reports/tmp/mh3k3ewb-x68lhy3t?name=daily-2025-10-23.pdf	55460	2025-10-23 15:07:39.972
0de87ac6-ded7-4d2f-8477-749340ad7ccd	DAILY_XLSX	2025-10-23 00:00:00	\N	\N	\N	/api/reports/tmp/mh3k3ewd-dy0wzims?name=daily-2025-10-23.xlsx	7417	2025-10-23 15:07:39.98
b7470f95-4dc4-4245-b21c-aaa59c970bd8	DAILY_PDF	2025-10-23 00:00:00	\N	\N	\N	/api/reports/tmp/mh3k49m3-odg63jak?name=daily-2025-10-23.pdf	55437	2025-10-23 15:08:19.789
1dbbbb60-4e85-44c5-9130-2e820c7a7c23	DAILY_XLSX	2025-10-23 00:00:00	\N	\N	\N	/api/reports/tmp/mh3k49mh-pvjg2wp8?name=daily-2025-10-23.xlsx	7417	2025-10-23 15:08:19.797
434f7b44-2767-4fdc-a48b-da71189fa641	DAILY_PDF	2025-10-24 00:00:00	\N	\N	\N	/api/reports/tmp/mh86cirj-hio9ywny?name=daily-2025-10-24.pdf	55252	2025-10-26 20:41:41.165
6b4912da-915b-4692-9e43-558f5bc15b66	DAILY_XLSX	2025-10-24 00:00:00	\N	\N	\N	/api/reports/tmp/mh86cirz-gchl8bpl?name=daily-2025-10-24.xlsx	7417	2025-10-26 20:41:41.184
\.


--
-- Data for Name: Rfi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Rfi" (id, project, subject, "assignedTo", status, "dueDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ShareToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ShareToken" (id, "calendarId", role, "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Todo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Todo" (id, "calendarId", title, notes, done, type, "createdAt") FROM stdin;
\.


--
-- Data for Name: UserSetting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserSetting" (id, "userId", "showHolidays", "countryCode", "useIcs", "icsUrl") FROM stdin;
\.


--
-- Data for Name: Vehicle; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Vehicle" (id, unit, status, location, "nextServiceOn", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WeeklyReportRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WeeklyReportRequest" (id, "weekStart", "weekEnd", vendor, status, "createdAt", "finishedAt", "errorText") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
903c84b7-37ca-484d-ae15-1c462456787a	a86eaff91b90eefa0cc23c383aec482e71dafb984d5436199ed076664a7b6600	2025-09-05 16:50:14.061903+00	20250829131044_init	\N	\N	2025-09-05 16:50:13.873768+00	1
c941ee47-214d-44bd-860e-ec8aac53e4df	26e679b98de005a7f1878aa5db098159dcd9b3d6c1cf791ade7830b16c0dbb3c	2025-10-05 15:04:13.997472+00	20250923094500_pay_items_quantities	\N	\N	2025-10-05 15:04:13.60485+00	1
b4796c94-332f-428d-bc2f-8f236fccf02c	23cdf859b3f8a81a0fb6ec5c932ec00f071f22b5eee9f717c93de760142cb269	2025-09-05 16:50:28.593439+00	20250905165028_add_invoice_number_and_employees_to_event	\N	\N	2025-09-05 16:50:28.426699+00	1
d9dd6f43-8fca-4917-a44d-bfd3137f14ac	b0d25142ae0ecaa1aa88a239ad0e8dcb184fbdc75228ff36c3283281689be5a2	2025-09-12 00:39:28.053261+00	20250911193000_add_customer	\N	\N	2025-09-12 00:39:27.801369+00	1
0f4081ec-5b18-4783-8632-5ca24ec21937	2b2c4a02ac7d3c67ea9fb61d0464195915c395a7ff439686d00aeee5b2cdfa68	2025-09-12 02:00:57.900299+00	20250912013000_reports	\N	\N	2025-09-12 02:00:57.566707+00	1
c273b33d-2fc7-4e28-bfbb-56e5c79c4bd2	6e299b2c469320e52bd8b62af3176b88e0d776b978d2bc72a84616ccc81022d3	2025-10-06 10:15:08.189123+00	20251001000000_fdot_cutoffs	\N	\N	2025-10-06 10:15:07.776194+00	1
652e7fc9-f2fd-4868-ada8-c36ddc584891	962d11c68d0be1a208f336fe6e14403ff46e052378425fd241a27b50f3decafd	2025-09-12 02:13:41.580276+00	20250912020500_event_add_checklist_shift	\N	\N	2025-09-12 02:13:41.355962+00	1
8bbae6c4-0e0f-4568-b545-5284adf75ea1	a2ecf75d2d94666f7ccde1ce16c445c8fca14cc7d25960e7d9f57d0fac7de3c7	2025-09-12 02:15:28.635177+00	20250912022000_event_add_starts_ends	\N	\N	2025-09-12 02:15:28.337005+00	1
dca7ea63-7fa5-4ddb-99f4-82a76f5103ce	b0e0cde64f48676aa39a65cc82d81591b34ad4a577892a5437f353710bc84317	\N	20250920143342_event_canonical_times	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250920143342_event_canonical_times\n\nDatabase error code: 42601\n\nDatabase error:\nERROR: syntax error at or near "﻿"\n\nPosition:\n[1m  0[0m\n[1m  1[1;31m ﻿-- Align Event table to canonical startsAt/endsAt columns[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42601), message: "syntax error at or near \\"\\u{feff}\\"", detail: None, hint: None, position: Some(Original(1)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("scan.l"), line: Some(1244), routine: Some("scanner_yyerror") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250920143342_event_canonical_times"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250920143342_event_canonical_times"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-09-21 19:32:36.05711+00	2025-09-21 19:21:18.245867+00	0
d9a00090-f669-4a5c-a628-b8eef65d826b	d959070fce7aa42d83049a27e10ab8b74d9062574dda2dad16fd7da9c8e019e5	2025-10-07 11:53:14.327106+00	20251006000000_event_timestamptz	\N	\N	2025-10-07 11:53:13.942212+00	1
17b2b1f1-5e1e-423c-869a-fb761e8cd2b1	2cfdbb3fad6a2a32bf1843143351842f50138c2e4f99676b33ce727cb4193e01	2025-09-21 19:32:42.337944+00	20250920143342_event_canonical_times	\N	\N	2025-09-21 19:32:42.007938+00	1
499462b0-f11c-4405-9ecd-529219144a3b	609bc946fefa4e111270aa19dde903d122ebae511f08c8f0f076e19b261b46a7	2025-10-12 19:34:59.049688+00	20251010150000_inventory_core	\N	\N	2025-10-12 19:34:58.59318+00	1
653482d5-a9b0-4034-b84f-e9c64219dc82	30181c391205118e9cd8f9a441c35a027a912197f390e5a1ee9a6eb98be8a643	2025-10-13 15:31:43.348553+00	20251015120000_operational_records	\N	\N	2025-10-13 15:31:43.068054+00	1
a214be3a-bf2d-4c79-b0c4-30a5354cd6d0	d73a840466aab680ccaa3b2c409f919a6cf9fdf8ce4da1f4889b55b36f4382ea	2025-10-22 21:11:22.196833+00	20251025090000_finance_labor	\N	\N	2025-10-22 21:11:21.787141+00	1
\.


--
-- Data for Name: fdot_cutoffs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fdot_cutoffs (id, year, cutoff_date, label, created_by, created_at, updated_at) FROM stdin;
cmgf3pret0000if04rgsquhen	2025	2025-01-19 00:00:00	\N	\N	2025-10-06 12:22:40.901	2025-10-06 12:22:40.901
cmgf3prgi0001if04mbc99lyl	2025	2025-02-16 00:00:00	\N	\N	2025-10-06 12:22:40.963	2025-10-06 12:22:40.963
cmgf3prgn0002if047fbsrp5h	2025	2025-03-16 00:00:00	\N	\N	2025-10-06 12:22:40.967	2025-10-06 12:22:40.967
cmgf3prgq0003if040uogvko5	2025	2025-04-13 00:00:00	2nd Sunday	\N	2025-10-06 12:22:40.971	2025-10-06 12:22:40.971
cmgf3prgu0004if04d13t8vmq	2025	2025-05-18 00:00:00	\N	\N	2025-10-06 12:22:40.974	2025-10-06 12:22:40.974
cmgf3prgy0005if04x91qekd5	2025	2025-06-08 00:00:00	2nd Sunday	\N	2025-10-06 12:22:40.978	2025-10-06 12:22:40.978
cmgf3prh10006if04gspj911r	2025	2025-07-13 00:00:00	2nd Sunday	\N	2025-10-06 12:22:40.982	2025-10-06 12:22:40.982
cmgf3prh60007if04t68ia3kp	2025	2025-08-17 00:00:00	\N	\N	2025-10-06 12:22:40.986	2025-10-06 12:22:40.986
cmgf3prha0008if04hw6l2l1w	2025	2025-09-21 00:00:00	\N	\N	2025-10-06 12:22:40.99	2025-10-06 12:22:40.99
cmgf3prhd0009if04khk76033	2025	2025-10-19 00:00:00	\N	\N	2025-10-06 12:22:40.994	2025-10-06 12:22:40.994
cmgf3prhh000aif049nz6vizv	2025	2025-11-16 00:00:00	\N	\N	2025-10-06 12:22:40.998	2025-10-06 12:22:40.998
cmgf3prhm000bif04cl8ih38g	2025	2025-12-14 00:00:00	2nd Sunday	\N	2025-10-06 12:22:41.002	2025-10-06 12:22:41.002
\.


--
-- Name: users_sync users_sync_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.users_sync
    ADD CONSTRAINT users_sync_pkey PRIMARY KEY (id);


--
-- Name: Calendar Calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Calendar"
    ADD CONSTRAINT "Calendar_pkey" PRIMARY KEY (id);


--
-- Name: Certification Certification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Certification"
    ADD CONSTRAINT "Certification_pkey" PRIMARY KEY (id);


--
-- Name: ChangeOrder ChangeOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeOrder"
    ADD CONSTRAINT "ChangeOrder_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: DailyReportSnapshot DailyReportSnapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DailyReportSnapshot"
    ADD CONSTRAINT "DailyReportSnapshot_pkey" PRIMARY KEY (id);


--
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY (id);


--
-- Name: EventAssignment EventAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EventAssignment"
    ADD CONSTRAINT "EventAssignment_pkey" PRIMARY KEY (id);


--
-- Name: EventQuantity EventQuantity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EventQuantity"
    ADD CONSTRAINT "EventQuantity_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: Holiday Holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_pkey" PRIMARY KEY (id);


--
-- Name: HourlyRate HourlyRate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HourlyRate"
    ADD CONSTRAINT "HourlyRate_pkey" PRIMARY KEY (id);


--
-- Name: InventoryCategory InventoryCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryCategory"
    ADD CONSTRAINT "InventoryCategory_pkey" PRIMARY KEY (id);


--
-- Name: InventoryCheckout InventoryCheckout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryCheckout"
    ADD CONSTRAINT "InventoryCheckout_pkey" PRIMARY KEY (id);


--
-- Name: InventoryItem InventoryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryItem"
    ADD CONSTRAINT "InventoryItem_pkey" PRIMARY KEY (id);


--
-- Name: InventoryLedger InventoryLedger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryLedger"
    ADD CONSTRAINT "InventoryLedger_pkey" PRIMARY KEY (id);


--
-- Name: InventoryLocation InventoryLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryLocation"
    ADD CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY (id);


--
-- Name: InventoryReservation InventoryReservation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryReservation"
    ADD CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY (id);


--
-- Name: InventoryReturn InventoryReturn_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryReturn"
    ADD CONSTRAINT "InventoryReturn_pkey" PRIMARY KEY (id);


--
-- Name: InventoryStock InventoryStock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryStock"
    ADD CONSTRAINT "InventoryStock_pkey" PRIMARY KEY (id);


--
-- Name: InventoryTransfer InventoryTransfer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryTransfer"
    ADD CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY (id);


--
-- Name: LaborDaily LaborDaily_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LaborDaily"
    ADD CONSTRAINT "LaborDaily_pkey" PRIMARY KEY (id);


--
-- Name: PayItem PayItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayItem"
    ADD CONSTRAINT "PayItem_pkey" PRIMARY KEY (id);


--
-- Name: Placement Placement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Placement"
    ADD CONSTRAINT "Placement_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrder PurchaseOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY (id);


--
-- Name: ReportFile ReportFile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportFile"
    ADD CONSTRAINT "ReportFile_pkey" PRIMARY KEY (id);


--
-- Name: Rfi Rfi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rfi"
    ADD CONSTRAINT "Rfi_pkey" PRIMARY KEY (id);


--
-- Name: ShareToken ShareToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShareToken"
    ADD CONSTRAINT "ShareToken_pkey" PRIMARY KEY (id);


--
-- Name: Todo Todo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Todo"
    ADD CONSTRAINT "Todo_pkey" PRIMARY KEY (id);


--
-- Name: UserSetting UserSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSetting"
    ADD CONSTRAINT "UserSetting_pkey" PRIMARY KEY (id);


--
-- Name: Vehicle Vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_pkey" PRIMARY KEY (id);


--
-- Name: WeeklyReportRequest WeeklyReportRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyReportRequest"
    ADD CONSTRAINT "WeeklyReportRequest_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: fdot_cutoffs fdot_cutoffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fdot_cutoffs
    ADD CONSTRAINT fdot_cutoffs_pkey PRIMARY KEY (id);


--
-- Name: users_sync_deleted_at_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX users_sync_deleted_at_idx ON neon_auth.users_sync USING btree (deleted_at);


--
-- Name: Certification_status_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Certification_status_expires_idx" ON public."Certification" USING btree (status, "expiresOn");


--
-- Name: ChangeOrder_project_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChangeOrder_project_status_idx" ON public."ChangeOrder" USING btree (project, status);


--
-- Name: Customer_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Customer_name_key" ON public."Customer" USING btree (name);


--
-- Name: DailyReportSnapshot_reportDate_vendor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DailyReportSnapshot_reportDate_vendor_idx" ON public."DailyReportSnapshot" USING btree ("reportDate", vendor);


--
-- Name: EventAssignment_employee_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EventAssignment_employee_day_idx" ON public."EventAssignment" USING btree ("employeeId", "dayOverride");


--
-- Name: EventAssignment_event_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EventAssignment_event_day_idx" ON public."EventAssignment" USING btree ("eventId", "dayOverride");


--
-- Name: EventAssignment_event_employee_day_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EventAssignment_event_employee_day_key" ON public."EventAssignment" USING btree ("eventId", "employeeId", "dayOverride");


--
-- Name: EventQuantity_eventId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EventQuantity_eventId_idx" ON public."EventQuantity" USING btree ("eventId");


--
-- Name: EventQuantity_payItemId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EventQuantity_payItemId_idx" ON public."EventQuantity" USING btree ("payItemId");


--
-- Name: Event_calendarId_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Event_calendarId_startsAt_idx" ON public."Event" USING btree ("calendarId", "startsAt");


--
-- Name: Event_endsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Event_endsAt_idx" ON public."Event" USING btree ("endsAt");


--
-- Name: Holiday_date_countryCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Holiday_date_countryCode_key" ON public."Holiday" USING btree (date, "countryCode");


--
-- Name: HourlyRate_effective_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HourlyRate_effective_idx" ON public."HourlyRate" USING btree ("effectiveDate");


--
-- Name: HourlyRate_employee_effective_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "HourlyRate_employee_effective_date_key" ON public."HourlyRate" USING btree ("employeeId", "effectiveDate");


--
-- Name: InventoryCategory_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "InventoryCategory_slug_key" ON public."InventoryCategory" USING btree (slug);


--
-- Name: InventoryCheckout_itemId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryCheckout_itemId_idx" ON public."InventoryCheckout" USING btree ("itemId");


--
-- Name: InventoryCheckout_toEventId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryCheckout_toEventId_idx" ON public."InventoryCheckout" USING btree ("toEventId");


--
-- Name: InventoryItem_barcode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "InventoryItem_barcode_key" ON public."InventoryItem" USING btree (barcode);


--
-- Name: InventoryItem_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryItem_name_idx" ON public."InventoryItem" USING btree (name);


--
-- Name: InventoryItem_sku_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "InventoryItem_sku_key" ON public."InventoryItem" USING btree (sku);


--
-- Name: InventoryLedger_itemId_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryLedger_itemId_at_idx" ON public."InventoryLedger" USING btree ("itemId", at);


--
-- Name: InventoryLocation_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "InventoryLocation_code_key" ON public."InventoryLocation" USING btree (code);


--
-- Name: InventoryReservation_eventId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryReservation_eventId_idx" ON public."InventoryReservation" USING btree ("eventId");


--
-- Name: InventoryReservation_itemId_neededAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryReservation_itemId_neededAt_idx" ON public."InventoryReservation" USING btree ("itemId", "neededAt");


--
-- Name: InventoryReturn_checkoutId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryReturn_checkoutId_idx" ON public."InventoryReturn" USING btree ("checkoutId");


--
-- Name: InventoryStock_itemId_locationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "InventoryStock_itemId_locationId_key" ON public."InventoryStock" USING btree ("itemId", "locationId");


--
-- Name: InventoryStock_locationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryStock_locationId_idx" ON public."InventoryStock" USING btree ("locationId");


--
-- Name: InventoryTransfer_itemId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryTransfer_itemId_idx" ON public."InventoryTransfer" USING btree ("itemId");


--
-- Name: InventoryTransfer_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryTransfer_status_idx" ON public."InventoryTransfer" USING btree (status);


--
-- Name: LaborDaily_employee_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LaborDaily_employee_day_idx" ON public."LaborDaily" USING btree ("employeeId", day);


--
-- Name: LaborDaily_job_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LaborDaily_job_day_idx" ON public."LaborDaily" USING btree ("jobId", day);


--
-- Name: LaborDaily_unique_row; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LaborDaily_unique_row" ON public."LaborDaily" USING btree (day, "eventId", "employeeId");


--
-- Name: PayItem_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PayItem_number_key" ON public."PayItem" USING btree (number);


--
-- Name: Placement_dayKey_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Placement_dayKey_idx" ON public."Placement" USING btree ("dayKey");


--
-- Name: Placement_employeeId_dayKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Placement_employeeId_dayKey_key" ON public."Placement" USING btree ("employeeId", "dayKey");


--
-- Name: Placement_placement_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Placement_placement_idx" ON public."Placement" USING btree (placement);


--
-- Name: PurchaseOrder_poNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON public."PurchaseOrder" USING btree ("poNumber");


--
-- Name: PurchaseOrder_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PurchaseOrder_status_idx" ON public."PurchaseOrder" USING btree (status);


--
-- Name: ReportFile_reportDate_vendor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportFile_reportDate_vendor_idx" ON public."ReportFile" USING btree ("reportDate", vendor);


--
-- Name: ReportFile_week_vendor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportFile_week_vendor_idx" ON public."ReportFile" USING btree ("weekStart", "weekEnd", vendor);


--
-- Name: Rfi_project_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Rfi_project_status_idx" ON public."Rfi" USING btree (project, status);


--
-- Name: Todo_calendarId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Todo_calendarId_createdAt_idx" ON public."Todo" USING btree ("calendarId", "createdAt");


--
-- Name: UserSetting_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserSetting_userId_key" ON public."UserSetting" USING btree ("userId");


--
-- Name: Vehicle_nextService_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Vehicle_nextService_idx" ON public."Vehicle" USING btree ("nextServiceOn");


--
-- Name: Vehicle_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Vehicle_status_idx" ON public."Vehicle" USING btree (status);


--
-- Name: WeeklyReportRequest_week_vendor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WeeklyReportRequest_week_vendor_idx" ON public."WeeklyReportRequest" USING btree ("weekStart", "weekEnd", vendor);


--
-- Name: fdot_cutoffs_year_cutoff_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX fdot_cutoffs_year_cutoff_date_key ON public.fdot_cutoffs USING btree (year, cutoff_date);


--
-- Name: EventAssignment EventAssignment_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EventAssignment"
    ADD CONSTRAINT "EventAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventAssignment EventAssignment_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EventAssignment"
    ADD CONSTRAINT "EventAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventQuantity EventQuantity_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EventQuantity"
    ADD CONSTRAINT "EventQuantity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventQuantity EventQuantity_payItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EventQuantity"
    ADD CONSTRAINT "EventQuantity_payItemId_fkey" FOREIGN KEY ("payItemId") REFERENCES public."PayItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Event Event_calendarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES public."Calendar"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HourlyRate HourlyRate_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HourlyRate"
    ADD CONSTRAINT "HourlyRate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InventoryCheckout InventoryCheckout_fromLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryCheckout"
    ADD CONSTRAINT "InventoryCheckout_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES public."InventoryLocation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryCheckout InventoryCheckout_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryCheckout"
    ADD CONSTRAINT "InventoryCheckout_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public."InventoryItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryCheckout InventoryCheckout_toEventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryCheckout"
    ADD CONSTRAINT "InventoryCheckout_toEventId_fkey" FOREIGN KEY ("toEventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryCheckout InventoryCheckout_toLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryCheckout"
    ADD CONSTRAINT "InventoryCheckout_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES public."InventoryLocation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryItem InventoryItem_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryItem"
    ADD CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."InventoryCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryItem InventoryItem_defaultLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryItem"
    ADD CONSTRAINT "InventoryItem_defaultLocationId_fkey" FOREIGN KEY ("defaultLocationId") REFERENCES public."InventoryLocation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryLedger InventoryLedger_fromLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryLedger"
    ADD CONSTRAINT "InventoryLedger_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES public."InventoryLocation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryLedger InventoryLedger_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryLedger"
    ADD CONSTRAINT "InventoryLedger_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public."InventoryItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryLedger InventoryLedger_toLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryLedger"
    ADD CONSTRAINT "InventoryLedger_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES public."InventoryLocation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryReservation InventoryReservation_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryReservation"
    ADD CONSTRAINT "InventoryReservation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryReservation InventoryReservation_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryReservation"
    ADD CONSTRAINT "InventoryReservation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public."InventoryItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryReturn InventoryReturn_checkoutId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryReturn"
    ADD CONSTRAINT "InventoryReturn_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES public."InventoryCheckout"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryReturn InventoryReturn_toLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryReturn"
    ADD CONSTRAINT "InventoryReturn_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES public."InventoryLocation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryStock InventoryStock_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryStock"
    ADD CONSTRAINT "InventoryStock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public."InventoryItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryStock InventoryStock_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryStock"
    ADD CONSTRAINT "InventoryStock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."InventoryLocation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryTransfer InventoryTransfer_fromLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryTransfer"
    ADD CONSTRAINT "InventoryTransfer_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES public."InventoryLocation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryTransfer InventoryTransfer_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryTransfer"
    ADD CONSTRAINT "InventoryTransfer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public."InventoryItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryTransfer InventoryTransfer_toLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryTransfer"
    ADD CONSTRAINT "InventoryTransfer_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES public."InventoryLocation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LaborDaily LaborDaily_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LaborDaily"
    ADD CONSTRAINT "LaborDaily_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE;


--
-- Name: LaborDaily LaborDaily_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LaborDaily"
    ADD CONSTRAINT "LaborDaily_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Placement Placement_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Placement"
    ADD CONSTRAINT "Placement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShareToken ShareToken_calendarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShareToken"
    ADD CONSTRAINT "ShareToken_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES public."Calendar"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Todo Todo_calendarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Todo"
    ADD CONSTRAINT "Todo_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES public."Calendar"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dcuZCdqHC0tR695ochtll3VM9hL8ZPD0NRf08588Ux1BrpqL0cvebIQqGVErW0e

