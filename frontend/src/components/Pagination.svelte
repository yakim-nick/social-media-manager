<script>
  import { createEventDispatcher } from 'svelte';

  export let page = 1;
  export let totalPages = 1;
  export let total = 0;

  const dispatch = createEventDispatcher();

  $: hasPrev = page > 1;
  $: hasNext = page < totalPages;
  $: pages = getPageNumbers();

  function getPageNumbers() {
    const range = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }

  function goTo(p) {
    if (p >= 1 && p <= totalPages && p !== page) {
      dispatch('pageChange', p);
    }
  }

  function handlePrev() {
    if (hasPrev) goTo(page - 1);
  }

  function handleNext() {
    if (hasNext) goTo(page + 1);
  }
</script>

{#if totalPages > 1}
  <nav class="flex items-center justify-between gap-4" aria-label="Pagination">
    <p class="text-sm text-gray-600">
      Page {page} of {totalPages}
      {#if total > 0}
        <span class="text-gray-400">({total} total)</span>
      {/if}
    </p>
    <div class="flex items-center gap-1">
      <button
        class="btn-ghost px-2 py-1 text-sm"
        disabled={!hasPrev}
        on:click={handlePrev}
        aria-label="Previous page"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {#each pages as p}
        <button
          class="btn-ghost min-w-[2rem] px-2 py-1 text-sm rounded-md {p === page ? 'bg-primary-100 text-primary-700 font-semibold' : ''}"
          on:click={() => goTo(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      {/each}

      <button
        class="btn-ghost px-2 py-1 text-sm"
        disabled={!hasNext}
        on:click={handleNext}
        aria-label="Next page"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </nav>
{/if}
