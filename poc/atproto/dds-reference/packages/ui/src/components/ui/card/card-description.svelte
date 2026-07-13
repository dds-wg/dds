<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../../utils.js";

  let {
    class: className,
    children,
    ...rest
  }: HTMLAttributes<HTMLParagraphElement> & { class?: string } = $props();
</script>

<p class={cn("text-sm text-muted-foreground", className)} {...rest}>
  {@render children?.()}
</p>
