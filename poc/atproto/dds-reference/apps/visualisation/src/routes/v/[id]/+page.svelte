<script lang="ts">
  import { page } from "$app/stores";
  import { Card, Spinner, EmptyState, Button, Alert } from "@dds/ui";
  import { visualisations } from "$lib/store.svelte";
  import { auth } from "$lib/auth.svelte";
  import { ReportData } from "$lib/report.svelte";
  import StatementBars from "$lib/components/StatementBars.svelte";
  import GroupCards from "$lib/components/GroupCards.svelte";

  const id = $derived($page.params.id ?? "");
  const v = $derived(visualisations.find(id));

  let report = $state<ReportData | null>(null);

  $effect(() => {
    if (!v) {
      report = null;
      return;
    }
    const apiUrl = v.clusteringApiUrl;
    if (
      !report ||
      report.projectUri !== v.projectUri ||
      report.phase !== v.phase ||
      report.clusteringApiUrl !== apiUrl
    ) {
      report = new ReportData(v.projectUri, v.phase, apiUrl);
    }
  });

  $effect(() => {
    if (report && auth.signedIn) {
      report.load({ initial: true });
    }
  });

  $effect(() => {
    if (!report || !auth.signedIn) return;
    const r = report;
    const timer = window.setInterval(() => {
      r.load({ initial: false }).catch(() => {
        /* indexer may have hiccuped; next tick will retry */
      });
    }, 5000);
    return () => window.clearInterval(timer);
  });

  const statementRows = $derived(
    report
      ? report.statements.map((s) => {
          const v = report!.votes.filter((vt) => vt.targetUri === s.uri);
          const agree = v.filter((vt) => vt.value > 0).length;
          const disagree = v.filter((vt) => vt.value < 0).length;
          const pass = v.filter((vt) => vt.value === 0).length;
          const gic = report!.metrics.find(
            (m) => m.subjectUri === s.uri && m.metricType === "groupInformedConsensus",
          );
          return {
            statementUri: s.uri,
            text: s.text,
            agree,
            disagree,
            pass,
            gic: typeof gic?.value === "number" ? gic.value : null,
          };
        })
      : [],
  );

  const sortedByConsensus = $derived(
    [...statementRows].sort((a, b) => (b.gic ?? -Infinity) - (a.gic ?? -Infinity)),
  );

  const voterCount = $derived(
    report ? new Set(report.votes.map((v) => v.voterDid)).size : 0,
  );
</script>

{#if !v}
  <EmptyState title="Report not found" description="It may have been removed from this browser." />
{:else if !auth.signedIn}
  <EmptyState title="Sign in to load data" description="The viewer fetches statements and votes from the project's PDS." />
{:else if report?.loading && report.statements.length === 0}
  <Spinner label="Loading report data..." />
{:else if report?.error}
  <Alert.Root variant="destructive">
    <Alert.Description>{report.error}</Alert.Description>
  </Alert.Root>
{:else if report}
  <div class="flex items-baseline justify-between mb-6">
    <div>
      <h1 class="text-2xl font-semibold">{v.title}</h1>
      <p class="text-sm text-muted-foreground break-all">
        {v.projectUri} · phase: {v.phase}
      </p>
      {#if report.groupSource === "clustering-server"}
        <p class="text-xs text-dds-text-subtle mt-1">
          Groups + metrics from clustering server
          {#if report.latestRunAt}
            · last run {new Date(report.latestRunAt).toLocaleString()}
          {/if}
        </p>
      {:else if report.groupSource === "indexer"}
        <p class="text-xs text-dds-text-subtle mt-1">Groups + metrics from indexer</p>
      {/if}
    </div>
    <div class="flex gap-2">
      <Button size="sm" variant="secondary" onclick={() => report?.load()}>
        Refresh
      </Button>
    </div>
  </div>

  <section class="mb-8 grid gap-3 md:grid-cols-4">
    <Card.Root>
      <Card.Header><Card.Title>Participants</Card.Title></Card.Header>
      <Card.Content><p class="text-3xl">{voterCount}</p></Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header><Card.Title>Statements</Card.Title></Card.Header>
      <Card.Content><p class="text-3xl">{report.statements.length}</p></Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header><Card.Title>Votes</Card.Title></Card.Header>
      <Card.Content><p class="text-3xl">{report.votes.length}</p></Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header><Card.Title>Groups</Card.Title></Card.Header>
      <Card.Content><p class="text-3xl">{report.groups.length}</p></Card.Content>
    </Card.Root>
  </section>

  {#if report.groups.length > 0}
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-3">Opinion groups</h2>
      <GroupCards groups={report.groups} totalVoters={voterCount} />
    </section>
  {/if}

  <section>
    <h2 class="text-lg font-semibold mb-3">Statements by consensus</h2>
    {#if statementRows.length === 0}
      <p class="text-sm text-muted-foreground">No statements yet.</p>
    {:else}
      <Card.Root>
        <Card.Content class="pt-6">
          <StatementBars rows={sortedByConsensus} />
        </Card.Content>
      </Card.Root>
    {/if}
  </section>
{/if}
