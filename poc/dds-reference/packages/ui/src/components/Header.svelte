<script lang="ts">
  import { Button } from "./ui/button/index.js";

  interface NavItem {
    href: string;
    label: string;
  }

  interface Props {
    title?: string;
    subtitle?: string;
    nav?: NavItem[];
    user?: { handle?: string; did?: string } | null;
    onSignIn?: () => void;
    onSignOut?: () => void;
  }

  let {
    title = "DDS",
    subtitle,
    nav = [],
    user = null,
    onSignIn,
    onSignOut,
  }: Props = $props();
</script>

<header
  class="border-b border-border bg-card px-6 py-4 flex items-center gap-6"
>
  <a href="/" class="no-underline text-foreground hover:no-underline">
    <div class="flex flex-col">
      <span class="text-lg font-semibold tracking-tight">{title}</span>
      {#if subtitle}
        <span class="text-xs text-muted-foreground">{subtitle}</span>
      {/if}
    </div>
  </a>

  <nav class="flex items-center gap-4 flex-1">
    {#each nav as item (item.href)}
      <a
        href={item.href}
        class="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline hover:no-underline"
      >
        {item.label}
      </a>
    {/each}
  </nav>

  <div class="flex items-center gap-3">
    {#if user}
      <span class="text-sm text-muted-foreground">
        {user.handle ?? user.did ?? "signed in"}
      </span>
      <Button variant="outline" size="sm" onclick={onSignOut}>Sign out</Button>
    {:else}
      <Button variant="default" size="sm" onclick={onSignIn}>
        Sign in with Bluesky
      </Button>
    {/if}
  </div>
</header>
