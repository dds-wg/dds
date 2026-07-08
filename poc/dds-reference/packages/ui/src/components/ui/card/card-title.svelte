<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../../utils.js";

  let {
    class: className,
    children,
    ...rest
  }: HTMLAttributes<HTMLHeadingElement> & { class?: string } = $props();
</script>

<h3
  class={cn("text-base font-semibold leading-none tracking-tight", className)}
  {...rest}
>
  {@render children?.()}
</h3>
