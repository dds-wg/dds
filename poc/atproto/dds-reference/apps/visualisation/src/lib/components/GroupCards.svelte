<script lang="ts">
  import { Card } from "@dds/ui";
  import type { GroupRow } from "../report.svelte";

  interface Props {
    groups: GroupRow[];
    totalVoters: number;
  }

  let { groups, totalVoters }: Props = $props();
</script>

<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-{Math.min(groups.length, 4)}">
  {#each groups as g (g.uri)}
    {@const pct = totalVoters > 0 ? Math.round((g.memberDids.length / totalVoters) * 100) : 0}
    <Card.Root>
      <Card.Header>
        <Card.Title>{g.name}</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-3xl font-semibold mb-1">
          {pct}<span class="text-base text-muted-foreground">%</span>
        </div>
        <p class="text-xs text-muted-foreground">{g.memberDids.length} participants</p>
      </Card.Content>
    </Card.Root>
  {/each}
</div>
