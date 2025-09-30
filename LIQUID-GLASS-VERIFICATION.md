# Liquid Glass Verification

Generate before/after screenshots (light/dark × comfortable/compact) for:
- Home, Calendar, Event Modal, Customers, Employees, Reports

Run Axe on main screens; zero critical issues.

Map TARGET items to changed files:
- Tokens → tokens.css, tailwind.config.ts
- Primitives → components/ui/*
- Patterns → components/patterns/*
- Calendar polish → styles/calendar.css or CalendarEventChip pattern

CI Guards
- Script to fail on raw hex/rgb and non-token spacing/typography
- Script to fail on multiple icon packs
- Test prefers-reduced-motion behavior

Visual snapshots
- Header, Card, Button states, Input, Table row, Event chip

