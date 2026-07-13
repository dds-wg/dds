<script lang="ts" module>
  import type { HTMLAttributes } from "svelte/elements";

  export type CardRootProps = HTMLAttributes<HTMLElement> & {
    href?: string;
    class?: string;
  };
</script>

<script lang="ts">
  import { cn } from "../../../utils.js";

  let {
    class: className,
    href,
    children,
    ...rest
  }: CardRootProps = $props();
</script>

<svelte:element
  this={href ? "a" : "div"}
  href={href}
  class={cn(
    "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
    href &&
      "block transition-colors hover:border-primary hover:no-underline",
    className,
  )}
  {...rest}
>
  {@render children?.()}
</svelte:element>
