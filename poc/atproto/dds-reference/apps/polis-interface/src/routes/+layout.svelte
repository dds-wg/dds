<script lang="ts">
  import "../app.css";
  import { onMount, type Snippet } from "svelte";
  import { goto } from "$app/navigation";
  import { Header, Alert } from "@dds/ui";
  import { auth } from "$lib/auth.svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
  let signInHandle = $state("");

  onMount(() => {
    auth.init();
  });

  async function onSignIn() {
    const handle = signInHandle || prompt("Bluesky handle (e.g. alice.bsky.social):") || "";
    if (handle) await auth.signIn(handle);
  }

  async function onSignOut() {
    await auth.signOut();
    goto("/");
  }
</script>

<div class="min-h-screen flex flex-col">
  <Header
    title="DDS Polis"
    subtitle="reference implementation"
    nav={[
      { href: "/", label: "Polls" },
      { href: "/new", label: "Create poll" },
    ]}
    user={auth.signedIn ? { did: auth.userDid ?? undefined } : null}
    {onSignIn}
    {onSignOut}
  />

  <main class="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
    {#if auth.error}
      <Alert.Root variant="destructive" class="mb-4">
        <Alert.Description>Auth error: {auth.error}</Alert.Description>
      </Alert.Root>
    {/if}
    {@render children()}
  </main>
</div>
