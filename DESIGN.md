# Ghost Design Guide

This document outlines the visual design system for Ghost, a personal dashboard application with a "ghost in the machine" aesthetic.

## Design Philosophy

Ghost uses a **cyberpunk/hologram aesthetic** - dark backgrounds with cyan accents that suggest a digital entity living within the system. The visual language draws from:

- Circuit boards and PCB traces
- Holographic displays and HUD interfaces
- Subtle scan lines and digital artifacts
- The idea of an AI "ghost" inhabiting the machine

## Color Palette

### Base Colors (Dark Theme)

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-bg` | `#0a0f10` | Page background (with cyan undertone) |
| `--color-surface` | `#0f1719` | Cards, panels, elevated surfaces |
| `--color-surface-hover` | `#141d20` | Surface hover state |
| `--color-border` | `#1e2d30` | Default borders |
| `--color-border-hover` | `#2a4045` | Border hover state |

### Text Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-text` | `#e5eaeb` | Primary text |
| `--color-text-muted` | `#6b8589` | Secondary/muted text |

### Accent Colors (Cyan/Hologram)

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-accent` | `#06b6d4` | Primary accent (buttons, links, highlights) |
| `--color-accent-hover` | `#22d3ee` | Lighter accent for hover states |
| `--color-accent-muted` | `#0e7490` | Darker accent for subtle elements |

### Effect Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-glow` | `rgba(6, 182, 212, 0.15)` | Subtle glow effects |
| `--color-glow-strong` | `rgba(6, 182, 212, 0.25)` | Stronger glow effects |

## Visual Elements

### Background

The app uses a **subtle circuit board pattern** (`/static/circuit-pattern.svg`) tiled across the background. The pattern is intentionally very faint - it adds texture without being distracting.

### Circuit Pulse Animation

A signature effect: cyan "data pulses" occasionally travel through circuit-like paths across the screen.

- **Automatic pulses**: Fire every 15-30 seconds from random center positions
- **Manual trigger**: Clicking the ghost icon on the home page triggers a pulse from that location
- **Animation**: Pulses travel along generated PCB-style paths toward screen edges
- **Duration**: 1.5-2.5 seconds per pulse
- **Component**: `src/lib/components/CircuitPulse.svelte`

### Custom Cursors

Two custom cursor states reinforce the hologram aesthetic:

| Cursor | File | Usage |
|--------|------|-------|
| Default | `/static/cursor.svg` | Arrow pointer with cyan outline |
| Pointer | `/static/cursor-pointer.svg` | Filled cyan arrow for clickable elements |

Both cursors use the same shape with hotspot at `4, 2` (arrow tip) to prevent jumping when transitioning between states.

### Glow Effects

Interactive cards use a subtle cyan glow on hover:

```css
.hover-glow:hover {
  box-shadow: 0 0 20px var(--color-glow), 0 0 40px var(--color-glow);
}
```

## Icons

### App Icon (Favicon)

The main Ghost icon (`/static/favicon.svg`) is a **holographic eye** design:

- HUD-style corner brackets
- Concentric rings suggesting depth
- Horizontal scan lines
- Cyan gradient color scheme
- Conveys "the machine is watching/aware"

### Feature Icons

Each micro-app has a matching hologram-style icon:

| Icon | File | Description |
|------|------|-------------|
| Fitness | `/static/icon-fitness.svg` | Barbell with circuit-style treatment |
| Tasks | `/static/icon-tasks.svg` | Clipboard with checkboxes |

**Icon Design Guidelines:**

- Use the hologram color gradient (`#67e8f9` → `#06b6d4` → `#0e7490`)
- Semi-transparent fills with solid strokes
- Include subtle scan lines where appropriate
- Keep recognizable at 24x24px (nav) and 32x32px (page headers)

## Typography

- **Font family**: System UI stack (`system-ui, -apple-system, sans-serif`)
- **Headings**: Bold weight, standard text color
- **Body**: Regular weight, standard or muted text color
- **Small text**: Use `--color-text-muted` for de-emphasized content

## Component Patterns

### Cards

```html
<div class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
  <!-- Card content -->
</div>
```

For interactive cards, add hover effects:

```html
<a class="block p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg
         hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)]
         hover-glow transition-all">
  <!-- Card content -->
</a>
```

### Page Headers

Each app page includes its icon in the header:

```html
<h1 class="text-2xl font-bold flex items-center gap-3">
  <img src="/icon-{app}.svg" alt="" class="w-8 h-8" />
  App Title
</h1>
```

### Buttons

Primary buttons use the accent color. All interactive elements have smooth transitions:

```css
a, button, input, [role="button"] {
  transition: all 0.15s ease;
}
```

## Animation Guidelines

- **Transitions**: 150ms ease for hover/focus states
- **Transforms**: Use `scale` for click feedback (e.g., `hover:scale-110 active:scale-95`)
- **Opacity**: Fade effects for appearing/disappearing elements
- **Circuit pulses**: Longer duration (1.5-2.5s) for ambient background effects

## Accessibility Notes

- Custom cursors have fallbacks (`default`, `pointer`, `text`)
- Color contrast maintained for text readability
- Interactive elements have visible focus states
- Animations don't interfere with content consumption

## File Reference

| File | Purpose |
|------|---------|
| `src/app.css` | Global styles and CSS variables |
| `static/favicon.svg` | Main app icon (holographic eye) |
| `static/favicon-eye-hologram.svg` | Same as above (named reference) |
| `static/icon-fitness.svg` | Fitness app icon |
| `static/icon-tasks.svg` | Tasks app icon |
| `static/circuit-pattern.svg` | Background pattern |
| `static/cursor.svg` | Default cursor |
| `static/cursor-pointer.svg` | Pointer cursor |
| `src/lib/components/CircuitPulse.svelte` | Animated pulse effect |
