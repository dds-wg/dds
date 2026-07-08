<script lang="ts" module>
  import type { HTMLAttributes } from "svelte/elements";
  import { type VariantProps, tv } from "tailwind-variants";

  export const alertVariants = tv({
    base: "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
  export type AlertProps = HTMLAttributes<HTMLDivElement> & {
    variant?: AlertVariant;
    class?: string;
  };
</script>

<script lang="ts">
  import { cn } from "../../../utils.js";

  let {
    variant = "default",
    class: className,
    children,
    ...rest
  }: AlertProps = $props();
</script>

<div role="alert" class={cn(alertVariants({ variant }), className)} {...rest}>
  {@render children?.()}
</div>
