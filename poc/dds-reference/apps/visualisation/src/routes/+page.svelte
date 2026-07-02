<script lang="ts">
  import { Card, EmptyState, Button } from "@dds/ui";
  import { visualisations } from "$lib/store.svelte";
</script>

<h1 class="text-2xl font-semibold mb-6">Reports</h1>

{#if visualisations.items.length === 0}
  <EmptyState
    title="No reports yet"
    description="Create one by pasting a project AT-URI."
  >
    {#snippet action()}
      <Button href="/new">New report</Button>
    {/snippet}
  </EmptyState>
{:else}
  <div class="grid gap-3">
    {#each visualisations.items as v (v.id)}
      <Card.Root href={`/v/${v.id}`}>
        <Card.Header>
          <Card.Title>{v.title}</Card.Title>
          <Card.Description>
            {v.projectUri} · phase: {v.phase}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <p class="text-xs text-muted-foreground">
            Created {new Date(v.createdAt).toLocaleString()}
          </p>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
{/if}
