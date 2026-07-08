<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../../utils.js";

  let {
    class: className,
    children,
    ...rest
  }: HTMLAttributes<HTMLHeadingElement> & { class?: string } = $props();
</script>

<h5
  class={cn("mb-1 font-medium leading-none tracking-tight", className)}
  {...rest}
>
  {@render children?.()}
</h5>
