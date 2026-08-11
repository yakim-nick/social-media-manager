<script>
  import { createEventDispatcher } from 'svelte';
  import StatusBadge from './StatusBadge.svelte';

  /**
   * Card summarizing a single post with contextual actions.
   * @prop {object} post - Post record.
   * @prop {boolean} compact - Whether to use the compact layout.
   * @event edit - Dispatched with `{ id }` for draft posts.
   * @event publish - Dispatched with `{ id }` for scheduled posts.
   * @event delete - Dispatched with `{ id }` for draft/scheduled posts.
   */
  export let post = {};
  export let compact = false;

  const dispatch = createEventDispatcher();

  $: id = post.id || post._id;
  $: contentPreview = post.content
    ? (post.content.length > 120 ? post.content.substring(0, 120) + '...' : post.content)
    : '(No content)';
  $: createdAt = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '';
  $: scheduledAt = post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : null;
  $: accountNames = post.accounts
    ? (Array.isArray(post.accounts) ? post.accounts.map((account) => account.name || account).join(', ') : '')
    : '';
</script>

<div class="card p-4 {compact ? 'py-3' : ''}">
  <div class="flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <StatusBadge status={post.status} />
        {#if scheduledAt}
          <span class="text-xs text-gray-500">Scheduled: {scheduledAt}</span>
        {/if}
      </div>
      <p class="text-sm text-gray-900 whitespace-pre-wrap break-words">{contentPreview}</p>
      {#if accountNames}
        <p class="mt-1 text-xs text-gray-500">Accounts: {accountNames}</p>
      {/if}
      {#if createdAt}
        <p class="mt-1 text-xs text-gray-400">Created: {createdAt}</p>
      {/if}
    </div>

    <div class="flex items-center gap-1 shrink-0">
      {#if post.status === 'draft'}
        <button class="btn-ghost px-2 py-1 text-xs" on:click={() => dispatch('edit', { id })} aria-label="Edit">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      {/if}
      {#if post.status === 'scheduled'}
        <button class="btn-ghost px-2 py-1 text-xs text-green-600" on:click={() => dispatch('publish', { id })} aria-label="Publish now">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      {/if}
      {#if post.status === 'draft' || post.status === 'scheduled'}
        <button class="btn-ghost px-2 py-1 text-xs text-red-500" on:click={() => dispatch('delete', { id })} aria-label="Delete">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      {/if}
    </div>
  </div>
</div>