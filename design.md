# Design — NFT Sweep Depth

A locked visual system for the routed analytics app. Business logic, API routes,
watchlist persistence, and read-only behavior remain outside this document.

## Genre

Atmospheric technical terminal, restrained for an institutional analytics product.

## Macrostructure family

- App pages: `08 Photographic`, adapted so real NFT artwork anchors collection identity while data remains the primary working surface.
- Utility pages: the same measurement grid without a decorative image requirement.
- Content pages: compact technical document rhythm.

## Theme

- `--color-paper`: `oklch(13% 0.014 248)`
- `--color-paper-2`: `oklch(17% 0.014 248)`
- `--color-ink`: `oklch(95% 0.008 220)`
- `--color-ink-2`: `oklch(84% 0.01 225)`
- `--color-rule`: `oklch(28% 0.016 242)`
- `--color-accent`: `oklch(76% 0.14 190)`
- `--color-focus`: `oklch(80% 0.13 190)`

NFT artwork supplies visual color. The interface itself uses one cyan signal accent,
plus semantic success, warning, and danger colors only where data requires them.

## Typography

- Display and body: Geist, roman, 400/700.
- Data and addresses: IBM Plex Mono, 400/600.
- Display tracking: `0`; large headings stay compact rather than heroic.
- All numeric tables use tabular figures.

## Spacing

Four-point named scale in `tokens.css`. Layouts use semantic tokens and keep touch
targets at least 44 px.

## Motion

- Market values interpolate slowly enough to remain readable.
- Analyze uses a functional loading indicator.
- Theme switching is immediate.
- Reduced motion removes spatial animation and keeps state changes visible.

## Microinteractions stance

- Visible focus rings appear instantly.
- Hover and press use one restrained signal each.
- Tooltips are supplemental; essential values also appear on focus or inline.
- Successful local actions are silent because the result is visible.

## CTA voice

- Primary: restrained signal fill, 6 px radius, explicit verb.
- Secondary: ruled outline, same height and radius.
- Icon-only controls include an accessible name and tooltip.

## Per-page allowances

- Real NFT artwork may be prominent on dashboard watchlist and collection identity.
- App sections do not use generated decoration, glass, or ambient gradients.
- Charts and tables may use semantic color when it communicates data.

## What pages MUST share

- Top market strip and workspace navigation.
- Accent placement, font pairing, control geometry, and focus behavior.
- Unframed page bands separated by rules; cards are reserved for repeated records.
- Dark and light themes with the same hue anchors.

## What pages MAY differ on

- The size of the collection artwork.
- Desktop column proportions based on the page's dominant task.
- Table-to-stacked-row behavior on mobile.

## Exports

### tokens.css

The canonical CSS token export is stored in `tokens.css` at the project root.

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(13% 0.014 248);
  --color-ink: oklch(95% 0.008 220);
  --color-accent: oklch(76% 0.14 190);
  --font-display: var(--font-geist);
  --font-body: var(--font-geist);
  --font-mono: var(--font-plex-mono);
  --spacing-md: 1rem;
  --text-md: 1.125rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

The reusable DTCG export is stored in `tokens.json` at the project root.

### shadcn/ui CSS variables

```css
:root {
  --background: 0.13 0.014 248;
  --foreground: 0.95 0.008 220;
  --primary: 0.76 0.14 190;
  --primary-foreground: 0.13 0.02 220;
  --muted: 0.205 0.015 248;
  --muted-foreground: 0.67 0.014 235;
  --border: 0.28 0.016 242;
  --input: 0.28 0.016 242;
  --ring: 0.80 0.13 190;
  --radius: 0.375rem;
}
```
