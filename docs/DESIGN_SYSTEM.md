# Quiz Platform Design System

## Direction

The frontend uses **Copper Ledger**: warm, precise, and editorial, like a trusted assessment workspace. It is designed to make guest quiz-taking calm, admin authoring efficient, and super-admin oversight easy to scan.

The primary typeface is self-hosted IBM Plex Sans. IBM Plex Mono is used for route labels, role labels, token names, and other technical values. Both are local package assets, so the interface does not depend on a remote font request.

## Tokens

Tokens live in `frontend/src/styles/tokens.css`. Components consume Tailwind semantic utilities such as `bg-background`, `bg-surface`, `text-text`, `text-text-muted`, `bg-primary`, and `ring-focus-ring`. Components must not contain literal color values.

### Light theme

| Role | Value |
|---|---|
| background | `#F5F3EF` |
| surface | `#FFFFFF` |
| surface-raised | `#ECE7E1` |
| border | `#8E8980` |
| text | `#262522` |
| text-muted | `#5E5A55` |
| primary | `#994B27` |
| primary-contrast | `#FFFFFF` |
| success | `#2D6A4F` |
| warning | `#805A10` |
| danger | `#A13A32` |
| info | `#2F5D70` |
| focus-ring | `#8C4A24` |

### Dark theme

| Role | Value |
|---|---|
| background | `#1F1D1A` |
| surface | `#2A2824` |
| surface-raised | `#35312C` |
| border | `#A8A096` |
| text | `#F5F3EF` |
| text-muted | `#C4BDB4` |
| primary | `#D98254` |
| primary-contrast | `#241A14` |
| success | `#69B58A` |
| warning | `#E2B85B` |
| danger | `#E27F77` |
| info | `#7FB4C2` |
| focus-ring | `#E2A37F` |

### Type and layout

- Display: `36px / 1.1`
- Title: `28px / 1.2`
- Heading: `20px / 1.3`
- Body: `16px / 1.5`
- Small: `14px / 1.45`
- Label: `12px / 1.3`
- Spacing uses a 4px base unit.
- Radius values are 4px, 8px, and 12px.
- Shadows are limited to subtle, raised, and overlay levels.
- Motion uses 150ms fast and 200ms standard transitions with a standard easing curve.
- Reduced-motion users receive effectively disabled transitions and animations.

### Contrast measurements

Measured with the WCAG relative-luminance formula against the token pairs used by the interface:

| Pair | Light | Dark |
|---|---:|---:|
| text / background | 13.83:1 | 15.17:1 |
| text-muted / background | 6.17:1 | 9.04:1 |
| primary / primary-contrast | 6.19:1 | 5.90:1 |

These exceed the 4.5:1 text target. Borders and focus indicators use stronger semantic values intended for the 3:1 UI boundary target.

## Themes

`ThemeProvider` initializes from the operating system preference, then applies a manual light/dark choice. The choice is stored under `quiz_platform_theme` through guarded `localStorage` access. The `ThemeToggle` is available in auth, guest, admin, super-admin, and design-system shells.

## Components

### Button

Use `primary` for the main action, `secondary` for a parallel action, `ghost` for low-emphasis navigation or utility actions, and `danger` for destructive actions. Buttons expose loading and disabled states, have a minimum 40px touch target, support optional Lucide icons, and always show a visible focus ring.

### Input

Use a visible label for every field. Use `helperText` for concise guidance and `error` for validation feedback. The component connects labels, helper text, and errors through accessible IDs and supports disabled, focus, and error states.

### Card

Use cards only for individual repeated items, dialogs, forms, and genuinely framed tools. Do not place page sections inside nested cards.

### Spinner and Skeleton

Use `Spinner` for an active operation and `Skeleton` for a layout-preserving loading state. Both expose an accessible status label.

### Badge

Use badges for compact status or classification. Available variants are neutral, success, warning, danger, and info. Pair color with text and, where useful, an icon.

### EmptyState

Use an icon, a short title, one sentence of explanation, and one next action. Empty states should make the next useful step obvious without becoming marketing copy.

### PageHeader

Use `PageHeader` for workspace screens. It supports an eyebrow, title, description, and action group, with responsive stacking on narrow screens.

### Toast

Use the hand-written toast provider for short-lived feedback. Toast variants are info, success, warning, and error. Every variant has text and an icon; color is never the only signal.

### Dialog

Use the native `dialog` component for focused decisions and confirmations. It traps Tab focus, closes on Escape, provides a labelled close button, and must not be used for routine page content.

## Layouts

- **AuthLayout:** quiet access header, no gradient, and a responsive information-plus-form composition.
- **AdminLayout:** productivity workspace with question, quiz, and report navigation.
- **SuperAdminLayout:** platform-control workspace with a distinct information accent and admin-account navigation.
- **GuestLayout:** minimal centered frame with no account navigation.

Desktop workspaces use a fixed sidebar. Mobile workspaces use a top bar and a drawer. The public guest route remains free of authentication guards.

## Do

- Use semantic tokens instead of literal colors.
- Pair status color with text or an icon.
- Keep keyboard focus visible on every interactive element.
- Use Lucide icons for familiar actions and provide labels or tooltips for icon-only controls.
- Keep touch targets at least 40px.
- Keep guest flows calm and distraction-free.
- Keep admin and super-admin screens dense, structured, and easy to scan.
- Render user-provided text as text, never raw HTML.

## Do not

- Do not add gradients, glassmorphism, or decorative blobs.
- Do not use pure black on pure white.
- Do not use color as the only status signal.
- Do not add shadows to every element.
- Do not create nested cards for page sections.
- Do not use emoji as interface icons.
- Do not add a second font family without a documented reason.
- Do not put API calls inside presentational components.

## Verification surface

Open `/design-system` to inspect both themes, semantic color roles, type scale, spacing, radii, shadows, motion notes, and all shared component states. The page is intentionally a visual QA surface and does not call the API or change authentication behavior.
