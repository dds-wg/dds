<script lang="ts">
  import { Loader2 } from "lucide-svelte";
  import { cn } from "../utils.js";

  interface Props {
    size?: "sm" | "md" | "lg";
    label?: string;
    class?: string;
  }

  let { size = "md", label, class: className }: Props = $props();

  const dims: Record<NonNullable<Props["size"]>, string> = {
    sm: "size-3",
    md: "size-5",
    lg: "size-8",
  };
</script>

<div
  class={cn("inline-flex items-center gap-2 text-muted-foreground", className)}
  role="status"
  aria-live="polite"
>
  <Loader2 class={cn("animate-spin", dims[size])} />
  {#if label}
    <span class="text-sm">{label}</span>
  {/if}
</div>
