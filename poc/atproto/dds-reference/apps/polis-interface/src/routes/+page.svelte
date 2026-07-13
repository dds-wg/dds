<script lang="ts">
  import { onMount } from "svelte";
  import { Card, EmptyState, Spinner, Button, Alert, Badge } from "@dds/ui";
  import { auth } from "$lib/auth.svelte";

  interface ProjectRow {
    uri: string;
    cid: string;
    repo: string;
    rkey: string;
    name: string;
    description?: string;
    phases: Array<{ name: string; status: string }>;
  }

  let projects = $state<ProjectRow[]>([]);
  let loading = $state(false);
  let errorMsg = $state<string | null>(null);

  async function load() {
    if (!auth.client) return;
    loading = true;
    errorMsg = null;
    try {
      const res = await auth.client.listProjects();
      projects = res.records.map((r) => {
        const value = (r.value ?? {}) as Record<string, unknown>;
        const parts = r.uri.replace("at://", "").split("/");
        return {
          uri: r.uri,
          cid: r.cid,
          repo: parts[0] ?? "",
          rkey: parts[2] ?? "",
          name: typeof value.name === "string" ? value.name : "(untitled)",
          description: typeof value.description === "string" ? value.description : undefined,
          phases: Array.isArray(value.phases)
            ? (value.phases as Array<Record<string, unknown>>).map((p) => ({
                name: String(p.name ?? ""),
                status: String(p.status ?? ""),
              }))
            : [],
        };
      });
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (auth.signedIn) load();
  });

  onMount(() => {
    if (auth.signedIn) load();
  });
</script>

<h1 class="text-2xl font-semibold mb-6">Polls</h1>

{#if !auth.initialized}
  <Spinner label="Loading session..." />
{:else if !auth.signedIn}
  <EmptyState
    title="Sign in to see your polls"
    description="DDS Polis stores polls in your Bluesky PDS. Sign in to view and create them."
  />
{:else if loading}
  <Spinner label="Loading projects..." />
{:else if errorMsg}
  <Alert.Root variant="destructive">
    <Alert.Description>{errorMsg}</Alert.Description>
  </Alert.Root>
{:else if projects.length === 0}
  <EmptyState title="No polls yet" description="Create one to get started.">
    {#snippet action()}
      <Button href="/new">Create poll</Button>
    {/snippet}
  </EmptyState>
{:else}
  <div class="grid gap-3">
    {#each projects as p (p.uri)}
      <Card.Root
        href={`/p/${encodeURIComponent(p.repo)}/${encodeURIComponent(p.rkey)}`}
      >
        <Card.Header>
          <Card.Title>{p.name}</Card.Title>
          {#if p.description}
            <Card.Description>{p.description}</Card.Description>
          {/if}
        </Card.Header>
        <Card.Content>
          <div class="flex gap-2 flex-wrap">
            {#each p.phases as phase (phase.name)}
              <Badge.Root variant="secondary">
                {phase.name} · {phase.status}
              </Badge.Root>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
{/if}
