# `@dds/ui`

Shared Tailwind v4 theme and Svelte 5 components for the three DDS reference apps so they look like
siblings of each other.

## Usage in a SvelteKit app

In your app's `src/app.css`:

```css
@import "@dds/ui/theme.css";
```

Tailwind v4 reads the `@theme` block from `@dds/ui/theme.css` and exposes utilities like
`bg-dds-surface`, `text-dds-text-muted`, `border-dds-border`, `rounded-dds-md`.

Then in components:

```svelte
<script lang="ts">
  import { Header, Card, Button } from "@dds/ui";
</script>

<Header title="DDS Polis" nav={[{ href: "/", label: "Polls" }]} />

<Card title="Climate Assembly" description="An open consultation">
  <Button onclick={() => /* ... */}>Join</Button>
</Card>
```

## Components

| Component | Purpose |
| --- | --- |
| `Header` | Top nav bar with sign-in / sign-out |
| `Card` | Surface container with optional title, description, footer, and link wrapping |
| `Button` | Themed button with primary/secondary/ghost/danger variants |
| `Spinner` | Inline loading indicator |
| `EmptyState` | Empty-list placeholder with optional CTA |
