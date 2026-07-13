<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../../utils.js";

  let {
    class: className,
    children,
    ...rest
  }: HTMLAttributes<HTMLDivElement> & { class?: string } = $props();
</script>

<div class={cn("p-6 pt-0", className)} {...rest}>
  {@render children?.()}
</div>
