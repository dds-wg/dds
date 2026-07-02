// shadcn-svelte primitives (namespace exports)
export * as Card from "./components/ui/card/index.js";
export * as Badge from "./components/ui/badge/index.js";
export * as Alert from "./components/ui/alert/index.js";

// Single-component primitives
export { Button, buttonVariants } from "./components/ui/button/index.js";
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
} from "./components/ui/button/index.js";

export { Skeleton } from "./components/ui/skeleton/index.js";
export { Separator } from "./components/ui/separator/index.js";
export type { SeparatorProps } from "./components/ui/separator/index.js";

// Composed DDS components
export { default as Header } from "./components/Header.svelte";
export { default as Spinner } from "./components/Spinner.svelte";
export { default as EmptyState } from "./components/EmptyState.svelte";
export { default as ProjectPicker } from "./components/ProjectPicker.svelte";
export type { PickerProject } from "./components/ProjectPicker.svelte";

// Utilities
export { cn } from "./utils.js";
