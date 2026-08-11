<script>
  import { createEventDispatcher } from 'svelte';

  /**
   * Empty-state placeholder with optional description and action button.
   * @prop {string} title - Heading text.
   * @prop {string} description - Optional supporting text.
   * @prop {string} actionLabel - Optional action button label.
   * @prop {string} icon - Icon variant: 'empty' | 'error' | 'search'.
   * @event action - Dispatched when the action button is clicked.
   */
  export let title = 'Nothing here yet';
  export let description = '';
  export let actionLabel = '';
  export let icon = 'empty';

  const dispatch = createEventDispatcher();

  /** SVG icon paths per variant. */
  const icons = {
    empty: {
      path: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
    },
    error: {
      path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
    },
    search: {
      path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    },
  };

  $: currentIcon = icons[icon] || icons.empty;
</script>

<div class="flex flex-col items-center justify-center py-12 text-center">
  <svg class="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={currentIcon.path} />
  </svg>
  <h3 class="text-lg font-medium text-gray-900">{title}</h3>
  {#if description}
    <p class="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>
  {/if}
  {#if actionLabel}
    <button class="btn-primary mt-4" on:click={() => dispatch('action')}>
      {actionLabel}
    </button>
  {/if}
</div>