# Liquid Glass Design Tokens (Spec)

Typography
- Font stack: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui
- Scale: 12, 14, 16, 20, 24, 32
- Weights: 400/500/600
- Body line-height: 1.45

Spacing
- 8-pt grid. Inner: 8/12/16. Sections: 24/32.

Radii
- Controls/Cards: 12
- Sheets/Drawers: 16
- Pills: full

Shadows
- level-1: subtle ambient + short drop
- level-2: hover add
- level-3: modal deep soft

Glass Surfaces
- glass/surface: translucency 92–96%, subtle inner highlight, hairline border
- glass/elevated: +1–2% opacity
- glass/hairline: light/dark variants
- glass/blur: 8 / 12 / 16 (backdrop-filter)
- glass/highlight: inner gradient 0–2% white

Color Roles
- fg/primary, fg/muted, bg/canvas, glass/surface, glass/elevated, border/hairline
- accent/400 / 500 / 600
- danger / warn / success
- ring: 2px outside, accent/400

Motion
- Hover: 150–180ms; Open/Close: 220–260ms
- Easing: cubic-bezier(.2,.8,.2,1)
- Springs: reserved for micro-interactions (light scale/opacity)
- Respect prefers-reduced-motion: disable springy effects

Breakpoints
- sm 640, md 768, lg 1024, xl 1280

Density
- Comfortable: control 44, row 44
- Compact: control 36, row 32

Implementation
- CSS variables defined in src/styles/tokens.css
- Tailwind extensions in tailwind.config.ts
- Primitives in src/components/ui with glass variants

