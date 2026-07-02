<script lang="ts" module>
  import { Separator as SeparatorPrimitive } from "bits-ui";

  export type SeparatorProps = SeparatorPrimitive.RootProps & {
    class?: string;
  };
</script>

<script lang="ts">
  import { cn } from "../../../utils.js";

  let {
    class: className,
    orientation = "horizontal",
    decorative = true,
    ...rest
  }: SeparatorProps = $props();
</script>

<SeparatorPrimitive.Root
  class={cn(
    "shrink-0 bg-border",
    orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
    className,
  )}
  {orientation}
  {decorative}
  {...rest}
/>
