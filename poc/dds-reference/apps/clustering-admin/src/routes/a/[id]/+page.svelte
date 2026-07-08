<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { Card, Spinner, Button, Alert } from "@dds/ui";
  import { api, type AnalysisView, type RunResultView } from "$lib/api";

  let analysis = $state<AnalysisView | null>(null);
  let runs = $state<RunResultView[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);
  let infoMsg = $state<string | null>(null);
  let triggering = $state(false);
  let backfilling = $state(false);

  const id = $derived(Number($page.params.id ?? "0"));

  async function load() {
    loading = true;
    errorMsg = null;
    try {
      [analysis, runs] = await Promise.all([api.get(id), api.runs(id)]);
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function runNow() {
    triggering = true;
    errorMsg = null;
    try {
      await api.run(id);
      await load();
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      triggering = false;
    }
  }

  async function backfill() {
    backfilling = true;
    errorMsg = null;
    infoMsg = null;
    try {
      const res = await api.backfill(id);
      infoMsg = `Backfill complete: ${res.added} new records added.`;
      await load();
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      backfilling = false;
    }
  }

  onMount(load);
</script>

<div class="mb-4">
  <a href="/" class="text-sm">← back to analyses</a>
</div>

{#if loading}
  <Spinner label="Loading..." />
{:else if errorMsg}
  <Alert.Root variant="destructive">
    <Alert.Description>{errorMsg}</Alert.Description>
  </Alert.Root>
{:else if analysis}
  <h1 class="text-2xl font-semibold mb-2">Analysis #{analysis.id}</h1>
  <p class="text-sm text-muted-foreground break-all mb-6">
    {analysis.project_uri} · phase: {analysis.phase}
  </p>

  {#if infoMsg}
    <Alert.Root class="mb-4 border-dds-success/50 text-dds-success">
      <Alert.Description>{infoMsg}</Alert.Description>
    </Alert.Root>
  {/if}

  <div class="grid gap-3 mb-6 md:grid-cols-3">
    <Card.Root>
      <Card.Header>
        <Card.Title>Status</Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-2xl">{analysis.status}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title>Inputs</Card.Title>
      </Card.Header>
      <Card.Content>
        <p>{analysis.statement_count} statements · {analysis.vote_count} votes</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title>Rerun threshold</Card.Title>
      </Card.Header>
      <Card.Content>
        <p>{analysis.new_events_since_run} / {analysis.rerun_threshold} new events</p>
      </Card.Content>
    </Card.Root>
  </div>

  <div class="flex gap-2 mb-8">
    <Button disabled={triggering} onclick={runNow}>
      {triggering ? "Running…" : "Run now"}
    </Button>
    <Button variant="secondary" disabled={backfilling} onclick={backfill}>
      {backfilling ? "Backfilling…" : "Backfill from PDS"}
    </Button>
  </div>

  <h2 class="text-lg font-semibold mb-3">Recent runs</h2>
  {#if runs.length === 0}
    <p class="text-sm text-muted-foreground">No runs yet.</p>
  {:else}
    <div class="grid gap-3">
      {#each runs as r (r.id)}
        <Card.Root>
          <Card.Header>
            <Card.Title>Run {r.id}</Card.Title>
            <Card.Description>
              {new Date(r.completed_at).toLocaleString()}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <p class="text-sm">
              {r.group_count} groups · {r.voter_count} voters · {r.vote_count} votes · {r.statement_count} statements
            </p>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
{/if}
