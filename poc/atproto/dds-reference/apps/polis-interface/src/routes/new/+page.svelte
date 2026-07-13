<script lang="ts">
  import { goto } from "$app/navigation";
  import { Card, Button, Spinner, Alert } from "@dds/ui";
  import { auth } from "$lib/auth.svelte";

  let name = $state("");
  let description = $state("");
  let firstPhaseName = $state("Ideation");
  let creating = $state(false);
  let errorMsg = $state<string | null>(null);

  async function create() {
    if (!auth.client || !name) return;
    creating = true;
    errorMsg = null;
    try {
      const res = await auth.client.createProject({
        name,
        description: description || undefined,
        phases: [
          {
            name: firstPhaseName,
            order: 0,
            status: "active",
            allowedSubjects: ["statement", "vote"],
            participation: { mode: "open" },
          },
        ],
      });
      const parts = res.uri.replace("at://", "").split("/");
      const repo = parts[0] ?? "";
      const rkey = parts[2] ?? "";
      goto(`/p/${encodeURIComponent(repo)}/${encodeURIComponent(rkey)}`);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
    } finally {
      creating = false;
    }
  }
</script>

<h1 class="text-2xl font-semibold mb-6">Create poll</h1>

{#if !auth.signedIn}
  <p class="text-muted-foreground">Sign in first.</p>
{:else}
  <Card.Root>
    <Card.Content class="pt-6">
      <div class="grid gap-4">
        <label class="grid gap-1">
          <span class="text-sm text-muted-foreground">Name</span>
          <input
            class="bg-background border border-input rounded-md px-3 py-2 text-sm"
            bind:value={name}
            placeholder="Climate Assembly 2026"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-sm text-muted-foreground">Description</span>
          <textarea
            class="bg-background border border-input rounded-md px-3 py-2 text-sm"
            bind:value={description}
            rows={3}
            placeholder="What is this poll about?"
          ></textarea>
        </label>

        <label class="grid gap-1">
          <span class="text-sm text-muted-foreground">Initial phase name</span>
          <input
            class="bg-background border border-input rounded-md px-3 py-2 text-sm"
            bind:value={firstPhaseName}
          />
        </label>

        {#if errorMsg}
          <Alert.Root variant="destructive">
            <Alert.Description>{errorMsg}</Alert.Description>
          </Alert.Root>
        {/if}

        <div class="flex gap-2">
          <Button disabled={creating || !name} onclick={create}>
            {creating ? "Creating…" : "Create poll"}
          </Button>
          {#if creating}<Spinner size="sm" />{/if}
        </div>
      </div>
    </Card.Content>
  </Card.Root>
{/if}
