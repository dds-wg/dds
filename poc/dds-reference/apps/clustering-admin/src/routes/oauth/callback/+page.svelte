<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { Spinner, Alert } from "@dds/ui";
  import { auth } from "$lib/auth.svelte";

  let errorMsg = $state<string | null>(null);
  onMount(async () => {
    try {
      await auth.init();
      goto("/");
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    }
  });
</script>

<div class="flex flex-col items-center py-12">
  {#if errorMsg}
    <Alert.Root variant="destructive" class="max-w-md">
      <Alert.Description>{errorMsg}</Alert.Description>
    </Alert.Root>
  {:else}
    <Spinner size="lg" label="Completing sign-in..." />
  {/if}
</div>
