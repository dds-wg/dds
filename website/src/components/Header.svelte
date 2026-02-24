<script>
	let menuOpen = $state(false);

	function handleKeydown(event) {
		if (event.key === 'Escape' && menuOpen) {
			menuOpen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
	<div class="mx-auto flex max-w-5xl items-center px-4 py-3">
		<!-- Logo + desktop nav grouped on the left -->
		<a href="/" class="flex items-center gap-2">
			<svg
				width="28"
				height="28"
				viewBox="0 0 32 32"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<line x1="8" y1="8" x2="24" y2="8" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" />
				<line x1="24" y1="8" x2="24" y2="24" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" />
				<line x1="24" y1="24" x2="8" y2="24" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" />
				<line x1="8" y1="24" x2="8" y2="8" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" />
				<circle cx="8" cy="8" r="3" fill="#818cf8" />
				<circle cx="8" cy="8" r="1.4" fill="#ffffff" />
				<circle cx="24" cy="8" r="3" fill="#818cf8" />
				<circle cx="24" cy="8" r="1.4" fill="#ffffff" />
				<circle cx="24" cy="24" r="3" fill="#818cf8" />
				<circle cx="24" cy="24" r="1.4" fill="#ffffff" />
				<circle cx="8" cy="24" r="3" fill="#818cf8" />
				<circle cx="8" cy="24" r="1.4" fill="#ffffff" />
			</svg>
			<span class="text-xl font-bold text-indigo-950">DDS</span>
		</a>

		<nav class="ml-8 hidden items-center gap-6 md:flex">
			<a href="/spec/0001-dds-protocol/" class="text-sm text-gray-700 hover:text-gray-900">Spec</a>
			<a href="/blog/" class="text-sm text-gray-700 hover:text-gray-900">Blog</a>
			<a
				href="https://github.com/dds-wg/dds"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-gray-700 hover:text-gray-900"
			>
				GitHub
			</a>
		</nav>

		<!-- Discussion link (pushed to right on desktop) -->
		<a
			href="https://github.com/dds-wg/dds/issues/new"
			target="_blank"
			rel="noopener noreferrer"
			class="ml-auto hidden rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 md:block"
		>
			Open a Discussion &rarr;
		</a>

		<!-- Mobile hamburger (pushed to right) -->
		<button
			class="ml-auto flex items-center justify-center md:hidden"
			onclick={() => (menuOpen = !menuOpen)}
			aria-label="Toggle menu"
			aria-expanded={menuOpen}
		>
			{#if menuOpen}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-gray-700"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-gray-700"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			{/if}
		</button>
	</div>

	<!-- Mobile dropdown panel -->
	{#if menuOpen}
		<nav class="border-t border-gray-200 px-4 py-2 md:hidden">
			<a
				href="/spec/0001-dds-protocol/"
				class="block rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
				onclick={() => (menuOpen = false)}
			>
				Spec
			</a>
			<a
				href="/blog/"
				class="block rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
				onclick={() => (menuOpen = false)}
			>
				Blog
			</a>
			<a
				href="https://github.com/dds-wg/dds"
				target="_blank"
				rel="noopener noreferrer"
				class="block rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
				onclick={() => (menuOpen = false)}
			>
				GitHub
			</a>
		</nav>
	{/if}
</header>
