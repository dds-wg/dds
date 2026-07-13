<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    Card,
    Button,
    EmptyState,
    ProjectPicker,
    Alert,
    type PickerProject,
  } from "@dds/ui";
  import { api } from "$lib/api";
  import { auth } from "$lib/auth.svelte";

  let ownerDid = $derived(auth.userDid ?? "");
  let projectUri = $state("");
  let projectCid = $state("");
  let phase = $state("");
  let threshold = $state(10);
  let manualMode = $state(false);
  let errorMsg = $state<string | null>(null);
  let creating = $state(false);

  let projects = $state<PickerProject[]>([]);
  let loadingProjects = $state(false);
  let projectsError = $state<string | null>(null);

  $effect(() => {
    if (auth.signedIn) loadProjects();
  });

  async function loadProjects() {
    if (!auth.client) return;
    loadingProjects = true;
    projectsError = null;
    try {
      const res = await auth.client.listProjects();
      projects = res.records.map((r) => {
        const value = (r.value ?? {}) as Record<string, unknown>;
        return {
          uri: r.uri,
          cid: r.cid,
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
    } catch (e) {
      projectsError = e instanceof Error ? e.message : String(e);
    } finally {
      loadingProjects = false;
    }
  }

  function pick(p: PickerProject, phaseName: string) {
    projectUri = p.uri;
    projectCid = p.cid;
    phase = phaseName;
  }

  async function create() {
    if (!ownerDid || !projectUri || !phase) return;
    creating = true;
    errorMsg = null;
    try {
      const a = await api.create({
        owner_did: ownerDid,
        project_uri: projectUri,
        project_cid: projectCid,
        phase,
        rerun_threshold: threshold,
      });
      goto(`/a/${a.id}`);
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      creating = false;
    }
  }

  onMount(() => {
    if (auth.signedIn) loadProjects();
  });
</script>

<h1 class="text-2xl font-semibold mb-6">New analysis</h1>

{#if !auth.signedIn}
  <EmptyState
    title="Sign in first"
    description="The analysis will be owned by your Bluesky DID. Sign in via the header."
  />
{:else}
  <div class="grid gap-4">
    <Card.Root>
      <Card.Header>
        <Card.Title>Pick a project step to analyse</Card.Title>
      </Card.Header>
      <Card.Content>
        <ProjectPicker
          {projects}
          loading={loadingProjects}
          error={projectsError}
          selected={projectUri ? { uri: projectUri, phase } : null}
          onSelect={pick}
        />
        <div class="mt-3 text-xs">
          <button
            type="button"
            class="text-muted-foreground hover:text-primary transition-colors"
            onclick={() => (manualMode = !manualMode)}
          >
            {manualMode ? "Hide manual entry" : "Or paste a project URI from another user…"}
          </button>
        </div>
      </Card.Content>
    </Card.Root>

    {#if manualMode}
      <Card.Root>
        <Card.Header>
          <Card.Title>Manual entry</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="grid gap-3">
            <label class="grid gap-1">
              <span class="text-sm text-muted-foreground">Project URI</span>
              <input
                class="bg-background border border-input rounded-md px-3 py-2 text-sm"
                bind:value={projectUri}
                placeholder="at://did:plc:.../org.dds-wg.v1.project/..."
              />
            </label>
            <label class="grid gap-1">
              <span class="text-sm text-muted-foreground">Project CID</span>
              <input
                class="bg-background border border-input rounded-md px-3 py-2 text-sm"
                bind:value={projectCid}
              />
            </label>
            <label class="grid gap-1">
              <span class="text-sm text-muted-foreground">Phase</span>
              <input
                class="bg-background border border-input rounded-md px-3 py-2 text-sm"
                bind:value={phase}
              />
            </label>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}

    <Card.Root>
      <Card.Header>
        <Card.Title>Analysis settings</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="text-sm text-muted-foreground">Owner DID</span>
            <input
              class="bg-background border border-input rounded-md px-3 py-2 text-sm opacity-70"
              value={ownerDid}
              readonly
            />
          </label>
          <label class="grid gap-1">
            <span class="text-sm text-muted-foreground">Rerun threshold (new events)</span>
            <input
              type="number"
              min={1}
              max={10000}
              class="bg-background border border-input rounded-md px-3 py-2 text-sm"
              bind:value={threshold}
            />
          </label>
          {#if projectUri && phase}
            <p class="text-xs text-muted-foreground">
              Selected: <span class="font-mono">{projectUri.split("/").slice(-1)[0]}</span> · {phase}
            </p>
          {/if}
          {#if errorMsg}
            <Alert.Root variant="destructive">
              <Alert.Description>{errorMsg}</Alert.Description>
            </Alert.Root>
          {/if}
          <Button disabled={creating || !projectUri || !phase} onclick={create}>
            {creating ? "Creating…" : "Create analysis"}
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
{/if}
