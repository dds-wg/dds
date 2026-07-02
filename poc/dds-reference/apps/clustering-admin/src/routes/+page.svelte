<script lang="ts">
  import { onMount } from "svelte";
  import { Card, Button, Spinner, EmptyState, Alert, Badge } from "@dds/ui";
  import { api, type AnalysisView } from "$lib/api";

  let analyses = $state<AnalysisView[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  async function load() {
    loading = true;
    errorMsg = null;
    try {
      analyses = await api.list();
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function setStatus(a: AnalysisView, status: "active" | "paused" | "ended") {
    try {
      await api.update(a.id, { status });
      await load();
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    }
  }

  async function triggerRun(a: AnalysisView) {
    try {
      await api.run(a.id);
      await load();
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    }
  }

  async function updateThreshold(a: AnalysisView, value: number) {
    if (Number.isNaN(value) || value < 1) return;
    try {
      await api.update(a.id, { rerun_threshold: value });
      await load();
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    }
  }

  onMount(load);
</script>

<h1 class="text-2xl font-semibold mb-6">Active analyses</h1>

{#if errorMsg}
  <Alert.Root variant="destructive" class="mb-4">
    <Alert.Description>{errorMsg}</Alert.Description>
  </Alert.Root>
{/if}

{#if loading}
  <Spinner label="Loading..." />
{:else if analyses.length === 0}
  <EmptyState
    title="No analyses yet"
    description="Create one from /new (or via POST /api/analyses)."
  >
    {#snippet action()}
      <Button href="/new">New analysis</Button>
    {/snippet}
  </EmptyState>
{:else}
  <div class="grid gap-3">
    {#each analyses as a (a.id)}
      <Card.Root>
        <Card.Header>
          <Card.Title>
            {a.phase} · {a.project_uri.split("/").slice(-1)[0]}
          </Card.Title>
          <Card.Description class="break-all">{a.project_uri}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="flex flex-wrap gap-2 mb-3">
            <Badge.Root variant="secondary">status: {a.status}</Badge.Root>
            <Badge.Root variant="secondary">
              {a.statement_count} statements · {a.vote_count} votes
            </Badge.Root>
            <Badge.Root variant="secondary">
              new events: {a.new_events_since_run}/{a.rerun_threshold}
            </Badge.Root>
            {#if a.last_run_at}
              <Badge.Root variant="secondary">
                last run: {new Date(a.last_run_at).toLocaleString()}
              </Badge.Root>
            {/if}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="flex items-center gap-1 text-sm">
              <span class="text-muted-foreground">Rerun every</span>
              <input
                type="number"
                min={1}
                max={10000}
                value={a.rerun_threshold}
                class="bg-background border border-input rounded-md px-2 py-1 w-20 text-sm"
                onchange={(e) => updateThreshold(a, Number((e.target as HTMLInputElement).value))}
              />
              <span class="text-muted-foreground">new events</span>
            </label>
            <Button size="sm" onclick={() => triggerRun(a)}>Run now</Button>
            {#if a.status === "active"}
              <Button size="sm" variant="secondary" onclick={() => setStatus(a, "paused")}>
                Pause
              </Button>
              <Button size="sm" variant="destructive" onclick={() => setStatus(a, "ended")}>
                End
              </Button>
            {:else if a.status === "paused"}
              <Button size="sm" onclick={() => setStatus(a, "active")}>Resume</Button>
              <Button size="sm" variant="destructive" onclick={() => setStatus(a, "ended")}>
                End
              </Button>
            {/if}
            <a class="text-sm ml-auto" href={`/a/${a.id}`}>Details →</a>
          </div>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
{/if}
