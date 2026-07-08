<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../utils.js";

  interface Props {
    title: string;
    description?: string;
    action?: Snippet;
    class?: string;
  }

  let { title, description, action, class: className }: Props = $props();
</script>

<div
  class={cn(
    "flex flex-col items-center justify-center text-center py-12 px-6",
    className,
  )}
>
  <h3 class="text-lg font-semibold mb-1 text-foreground">{title}</h3>
  {#if description}
    <p class="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
  {/if}
  {@render action?.()}
</div>
