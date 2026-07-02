<script lang="ts">
  import { page } from "$app/stores";
  import { Card, Button, Spinner, EmptyState, Alert, Badge } from "@dds/ui";
  import { auth } from "$lib/auth.svelte";
  import { indexer } from "$lib/indexer";
  import { COLLECTIONS } from "@dds/client";

  type StatementRow = {
    uri: string;
    cid: string;
    text: string;
    authorDid: string;
  };

  let project = $state<{
    uri: string;
    name: string;
    description?: string;
    phases: Array<{ name: string; status: string; order?: number }>;
  } | null>(null);
  let projectError = $state<string | null>(null);
  let loadingProject = $state(false);

  let allStatements = $state<StatementRow[]>([]);
  let votedRkeys = $state<Set<string>>(new Set());
  let currentIndex = $state(0);
  let loadingStatements = $state(false);

  let newStatementText = $state("");
  let submittingStatement = $state(false);
  let voteError = $state<string | null>(null);

  const repo = $derived($page.params.repo ?? "");
  const rkey = $derived($page.params.rkey ?? "");
  const uri = $derived(`at://${decodeURIComponent(repo)}/${COLLECTIONS.project}/${decodeURIComponent(rkey)}`);

  const unseenStatements = $derived(
    allStatements.filter((s) => !votedRkeys.has(extractRkey(s.uri))),
  );
  const currentStatement = $derived(
    unseenStatements.length > 0 ? unseenStatements[currentIndex % unseenStatements.length] : null,
  );

  function extractRkey(u: string) {
    const parts = u.replace("at://", "").split("/");
    return parts[2] ?? "";
  }

  async function loadProject() {
    if (!auth.client) return;
    loadingProject = true;
    try {
      const res = await auth.client.getRecord(uri);
      const value = res.value as Record<string, unknown>;
      project = {
        uri: res.uri,
        name: String(value.name ?? "(untitled)"),
        description: typeof value.description === "string" ? value.description : undefined,
        phases: Array.isArray(value.phases)
          ? (value.phases as Array<Record<string, unknown>>).map((p) => ({
              name: String(p.name ?? ""),
              status: String(p.status ?? ""),
              order: typeof p.order === "number" ? p.order : undefined,
            }))
          : [],
      };
    } catch (err) {
      projectError = err instanceof Error ? err.message : String(err);
    } finally {
      loadingProject = false;
    }
  }

  async function loadStatements({ initial = false }: { initial?: boolean } = {}) {
    if (!auth.client || !project) return;
    if (initial) loadingStatements = true;
    try {
      const phaseName = project.phases[0]?.name ?? "Ideation";
      const records = await indexer.listStatements({ project: uri, phase: phaseName });
      const existingUris = new Set(allStatements.map((s) => s.uri));
      const newRows: StatementRow[] = [];
      for (const r of records) {
        if (existingUris.has(r.uri)) continue;
        const value = (r.value ?? {}) as Record<string, unknown>;
        const author = (value.author ?? {}) as Record<string, unknown>;
        newRows.push({
          uri: r.uri,
          cid: r.cid,
          text: String(value.text ?? ""),
          authorDid: typeof author.did === "string" ? author.did : r.did,
        });
      }
      if (newRows.length > 0) {
        shuffleInPlace(newRows);
        allStatements = [...allStatements, ...newRows];
      }

      if (auth.userDid) {
        const votes = await auth.client.listVotes({ limit: 100 });
        const merged = new Set(votedRkeys);
        let changed = false;
        for (const v of votes.records) {
          const val = v.value as Record<string, unknown>;
          const target = (val.target ?? {}) as Record<string, unknown>;
          if (typeof target.uri === "string") {
            const k = extractRkey(target.uri);
            if (!merged.has(k)) {
              merged.add(k);
              changed = true;
            }
          }
        }
        if (changed) votedRkeys = merged;
      }
    } finally {
      if (initial) loadingStatements = false;
    }
  }

  function shuffleInPlace<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
  }

  async function submitStatement() {
    if (!auth.client || !newStatementText.trim()) return;
    submittingStatement = true;
    try {
      await auth.client.createStatement({
        text: newStatementText.trim(),
        step: { project: { uri, cid: "" }, phase: project?.phases[0]?.name ?? "Ideation" },
      });
      newStatementText = "";
      await loadStatements({ initial: false });
    } catch (err) {
      voteError = err instanceof Error ? err.message : String(err);
    } finally {
      submittingStatement = false;
    }
  }

  async function vote(value: -1 | 0 | 1) {
    if (!auth.client || !currentStatement) return;
    voteError = null;
    try {
      await auth.client.createOrdinalVote({
        target: { uri: currentStatement.uri, cid: currentStatement.cid },
        value,
        step: { project: { uri, cid: "" }, phase: project?.phases[0]?.name ?? "Ideation" },
      });
      votedRkeys = new Set([...votedRkeys, extractRkey(currentStatement.uri)]);
      currentIndex += 1;
    } catch (err) {
      voteError = err instanceof Error ? err.message : String(err);
    }
  }

  function copyShareUrl() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  }

  $effect(() => {
    if (auth.signedIn && !project) {
      loadProject().then(() => {
        indexer.backfillProject(uri).catch(() => {
          /* indexer may be offline; statements still try */
        });
        loadStatements({ initial: true });
      });
    }
  });

  $effect(() => {
    if (!auth.signedIn || !project) return;
    const timer = window.setInterval(() => {
      loadStatements({ initial: false }).catch(() => {
        /* indexer may have hiccuped; next tick will retry */
      });
    }, 5000);
    return () => window.clearInterval(timer);
  });
</script>

{#if !auth.signedIn}
  <EmptyState title="Sign in to view this poll" />
{:else if loadingProject && !project}
  <Spinner label="Loading poll..." />
{:else if projectError}
  <Alert.Root variant="destructive">
    <Alert.Description>{projectError}</Alert.Description>
  </Alert.Root>
{:else if project}
  <div class="flex items-start justify-between mb-6 gap-4">
    <div>
      <h1 class="text-2xl font-semibold">{project.name}</h1>
      {#if project.description}
        <p class="text-muted-foreground mt-1">{project.description}</p>
      {/if}
      <div class="flex gap-2 mt-3 flex-wrap">
        {#each project.phases as phase (phase.name)}
          <Badge.Root variant="secondary">
            {phase.name} · {phase.status}
          </Badge.Root>
        {/each}
      </div>
    </div>
    <Button variant="secondary" size="sm" onclick={copyShareUrl}>
      Copy share link
    </Button>
  </div>

  <section class="grid lg:grid-cols-2 gap-6">
    <Card.Root>
      <Card.Header>
        <Card.Title>Vote on statements</Card.Title>
      </Card.Header>
      <Card.Content>
        {#if loadingStatements}
          <Spinner label="Loading statements..." />
        {:else if !currentStatement}
          <EmptyState
            title="No more statements"
            description="You've voted on every statement in this poll. Add one of your own."
          />
        {:else}
          <p class="text-base mb-6">{currentStatement.text}</p>
          <p class="text-xs text-muted-foreground mb-4">
            — {currentStatement.authorDid}
          </p>
          <div class="flex gap-2">
            <Button variant="destructive" onclick={() => vote(-1)}>Disagree</Button>
            <Button variant="secondary" onclick={() => vote(0)}>Pass</Button>
            <Button onclick={() => vote(1)}>Agree</Button>
          </div>
          {#if voteError}
            <Alert.Root variant="destructive" class="mt-3">
              <Alert.Description>{voteError}</Alert.Description>
            </Alert.Root>
          {/if}
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Add a statement</Card.Title>
      </Card.Header>
      <Card.Content>
        <textarea
          class="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
          rows={4}
          placeholder="A claim you'd want others to react to..."
          bind:value={newStatementText}
        ></textarea>
        <div class="mt-3">
          <Button
            disabled={submittingStatement || !newStatementText.trim()}
            onclick={submitStatement}
          >
            {submittingStatement ? "Submitting…" : "Submit statement"}
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  </section>
{/if}
