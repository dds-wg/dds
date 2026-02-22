<script>
	let menuOpen = $state(false);
</script>

<header class="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
	<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
		<a href="/" class="flex items-center gap-2">
			<svg
				width="28"
				height="28"
				viewBox="0 0 32 32"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<line x1="16" y1="6" x2="7" y2="21" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" />
				<line x1="16" y1="6" x2="25" y2="21" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" />
				<line x1="7" y1="21" x2="25" y2="21" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" />
				<circle cx="16" cy="6" r="3" fill="#818cf8" />
				<circle cx="16" cy="6" r="1.4" fill="#ffffff" />
				<circle cx="7" cy="21" r="3" fill="#818cf8" />
				<circle cx="7" cy="21" r="1.4" fill="#ffffff" />
				<circle cx="25" cy="21" r="3" fill="#818cf8" />
				<circle cx="25" cy="21" r="1.4" fill="#ffffff" />
			</svg>
			<span class="text-xl font-bold text-indigo-950">DDS</span>
		</a>

		<!-- Desktop nav -->
		<nav class="hidden items-center gap-6 md:flex">
			<a href="/spec/0001-dds-protocol" class="text-sm text-gray-700 hover:text-gray-900">Spec</a>
			<a href="/blog" class="text-sm text-gray-700 hover:text-gray-900">Blog</a>
			<a
				href="https://github.com/dds-wg/dds"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-gray-700 hover:text-gray-900"
			>
				GitHub
			</a>
		</nav>

		<!-- Mobile hamburger button -->
		<button
			class="flex items-center justify-center md:hidden"
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

	<!-- Mobile menu -->
	{#if menuOpen}
		<nav class="border-t border-gray-200 px-4 py-2 md:hidden">
			<a href="/spec/0001-dds-protocol" class="block py-2 text-sm text-gray-700 hover:text-gray-900">Spec</a>
			<a href="/blog" class="block py-2 text-sm text-gray-700 hover:text-gray-900">Blog</a>
			<a
				href="https://github.com/dds-wg/dds"
				target="_blank"
				rel="noopener noreferrer"
				class="block py-2 text-sm text-gray-700 hover:text-gray-900"
			>
				GitHub
			</a>
		</nav>
	{/if}
</header>
