<script lang="ts" module>
  /**
   * Lightweight schema the picker needs. Both consumer apps shape their `listProjects()`
   * response into this before passing it in.
   */
  export interface PickerProject {
    uri: string;
    cid: string;
    name: string;
    description?: string;
    phases: Array<{ name: string; status: string }>;
  }
</script>

<script lang="ts">
  import { AlertCircle } from "lucide-svelte";
  import * as Card from "./ui/card/index.js";
  import * as Alert from "./ui/alert/index.js";
  import { Button } from "./ui/button/index.js";
  import Spinner from "./Spinner.svelte";

  interface Props {
    projects: PickerProject[];
    loading?: boolean;
    error?: string | null;
    /** AT-URI + phase of the currently selected entry, so we can highlight it. */
    selected?: { uri: string; phase: string } | null;
    onSelect: (project: PickerProject, phase: string) => void;
  }

  let {
    projects,
    loading = false,
    error = null,
    selected = null,
    onSelect,
  }: Props = $props();
</script>

{#if loading}
  <Spinner label="Loading your projects…" />
{:else if error}
  <Alert.Root variant="destructive">
    <AlertCircle />
    <Alert.Description>{error}</Alert.Description>
  </Alert.Root>
{:else if projects.length === 0}
  <p class="text-sm text-muted-foreground">
    No DDS projects found in your repo yet. Create one via the polis interface,
    or paste a URI below.
  </p>
{:else}
  <div class="grid gap-2">
    {#each projects as p (p.uri)}
      <Card.Root class="p-3">
        <div class="font-medium text-foreground">{p.name}</div>
        {#if p.description}
          <div class="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {p.description}
          </div>
        {/if}
        <div class="flex gap-1 mt-2 flex-wrap">
          {#each p.phases as phase (phase.name)}
            {@const isSelected =
              selected !== null &&
              selected.uri === p.uri &&
              selected.phase === phase.name}
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              class="h-7 px-2 text-xs"
              onclick={() => onSelect(p, phase.name)}
            >
              {phase.name}
              {#if phase.status !== "active"}
                <span class="opacity-60">· {phase.status}</span>
              {/if}
            </Button>
          {/each}
        </div>
      </Card.Root>
    {/each}
  </div>
{/if}
