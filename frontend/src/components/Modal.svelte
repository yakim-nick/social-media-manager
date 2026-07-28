<script>
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let title = '';

  const dispatch = createEventDispatcher();

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      dispatch('close');
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      dispatch('close');
    }
  }

  $: if (open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-40 bg-black/50"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="presentation"
  ></div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
    role="dialog"
    aria-modal="true"
    aria-label={title}
  >
    <div class="card w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto">
      {#if title}
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            class="btn-ghost p-1"
            on:click={() => dispatch('close')}
            aria-label="Close modal"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/if}
      <div class="px-6 py-4">
        <slot />
      </div>
      {#if $$slots.footer}
        <div class="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}
