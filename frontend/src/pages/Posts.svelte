<script>
  import { onMount } from 'svelte';
  import { fetchPosts, deletePost, schedulePost, publishPost, posts, postsLoading, postsError, postsPagination } from '../stores/posts.js';
  import { addNotification } from '../stores/ui.js';
  import PostCard from '../components/PostCard.svelte';
  import Pagination from '../components/Pagination.svelte';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';
  import EmptyState from '../components/EmptyState.svelte';
  import Modal from '../components/Modal.svelte';

  // List filters and pagination state.
  let filterStatus = '';
  let sortBy = 'createdAt';
  let sortOrder = 'desc';
  let page = 1;
  let limit = 10;

  // Delete confirmation modal state.
  let deleteModalOpen = false;
  let selectedPostId = null;

  // Schedule modal state.
  let scheduleModalOpen = false;
  let scheduleDate = '';
  let scheduleTime = '';

  onMount(() => {
    loadPosts();
  });

  /** Fetch the current page of posts using the active filters. */
  async function loadPosts() {
    try {
      await fetchPosts({
        status: filterStatus || undefined,
        sort: sortBy,
        order: sortOrder,
        page,
        limit,
      });
    } catch (err) {
      addNotification('error', err.message || 'Failed to load posts');
    }
  }

  // Reset to the first page and reload whenever the filters change.
  $: if (filterStatus !== undefined || sortBy) {
    page = 1;
    loadPosts();
  }

  /** Delete the post selected in the confirmation modal. */
  async function handleDeleteConfirm() {
    if (!selectedPostId) return;
    try {
      await deletePost(selectedPostId);
      addNotification('success', 'Post deleted');
      deleteModalOpen = false;
      selectedPostId = null;
      loadPosts();
    } catch (err) {
      addNotification('error', err.message || 'Failed to delete post');
    }
  }

  /** Open the delete confirmation modal for a post. */
  function promptDelete(event) {
    selectedPostId = event.detail.id;
    deleteModalOpen = true;
  }

  /** Open the schedule modal for a post. */
  function promptSchedule(event) {
    selectedPostId = event.detail.id;
    scheduleModalOpen = true;
  }

  /** Schedule the post selected in the modal at the chosen date/time. */
  async function handleScheduleConfirm() {
    if (!selectedPostId || !scheduleDate) return;
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime || '00:00'}`).toISOString();
      await schedulePost(selectedPostId, scheduledAt);
      addNotification('success', 'Post scheduled');
      scheduleModalOpen = false;
      selectedPostId = null;
      scheduleDate = '';
      scheduleTime = '';
      loadPosts();
    } catch (err) {
      addNotification('error', err.message || 'Failed to schedule post');
    }
  }

  /** Publish a post immediately. */
  async function handlePublish(event) {
    try {
      await publishPost(event.detail.id);
      addNotification('success', 'Post published!');
      loadPosts();
    } catch (err) {
      addNotification('error', err.message || 'Failed to publish post');
    }
  }

  /** Navigate to the post editor for a post. */
  function handleEdit(event) {
    window.location.hash = `#/posts/edit/${event.detail.id}`;
  }

  /** Load a different page of results. */
  function handlePageChange(event) {
    page = event.detail;
    loadPosts();
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <h2 class="text-xl font-bold text-gray-900">Posts</h2>
    <a href="#/posts/new" class="btn-primary">
      <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      New Post
    </a>
  </div>

  <!-- Filters -->
  <div class="flex flex-col sm:flex-row gap-3">
    <div class="flex items-center gap-2">
      <label for="status-filter" class="text-sm text-gray-600">Status:</label>
      <select
        id="status-filter"
        class="input w-auto"
        bind:value={filterStatus}
      >
        <option value="">All</option>
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
        <option value="published">Published</option>
        <option value="failed">Failed</option>
      </select>
    </div>
    <div class="flex items-center gap-2">
      <label for="sort-by" class="text-sm text-gray-600">Sort:</label>
      <select
        id="sort-by"
        class="input w-auto"
        bind:value={sortBy}
      >
        <option value="createdAt">Created</option>
        <option value="scheduledAt">Scheduled</option>
        <option value="status">Status</option>
      </select>
      <button
        class="btn-ghost p-2"
        on:click={() => sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'}
        aria-label="Toggle sort order"
      >
        {#if sortOrder === 'desc'}
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        {:else}
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- Posts list -->
  {#if $postsLoading}
    <div class="py-20">
      <LoadingSpinner size="lg" />
    </div>
  {:else if $postsError}
    <div class="card p-6 text-center">
      <p class="text-red-600">{$postsError}</p>
      <button class="btn-secondary mt-4" on:click={loadPosts}>Retry</button>
    </div>
  {:else if $posts.length === 0}
    <EmptyState
      title="No posts found"
      description={filterStatus ? `No posts with status "${filterStatus}".` : 'Create your first post to get started.'}
      actionLabel="Create Post"
      on:action={() => window.location.hash = '#/posts/new'}
    />
  {:else}
    <div class="space-y-3">
      {#each $posts as post (post.id || post._id)}
        <PostCard
          {post}
          on:edit={handleEdit}
          on:delete={promptDelete}
          on:publish={handlePublish}
          on:schedule={promptSchedule}
        />
      {/each}
    </div>

    <Pagination
      page={$postsPagination.page}
      totalPages={$postsPagination.totalPages}
      total={$postsPagination.total}
      on:pageChange={handlePageChange}
    />
  {/if}
</div>

<!-- Delete confirmation modal -->
<Modal
  open={deleteModalOpen}
  title="Delete Post"
  on:close={() => { deleteModalOpen = false; selectedPostId = null; }}
>
  <p class="text-sm text-gray-600">Are you sure you want to delete this post? This action cannot be undone.</p>
  <div slot="footer">
    <button class="btn-secondary" on:click={() => { deleteModalOpen = false; selectedPostId = null; }}>Cancel</button>
    <button class="btn-danger" on:click={handleDeleteConfirm}>Delete</button>
  </div>
</Modal>

<!-- Schedule modal -->
<Modal
  open={scheduleModalOpen}
  title="Schedule Post"
  on:close={() => { scheduleModalOpen = false; selectedPostId = null; scheduleDate = ''; scheduleTime = ''; }}
>
  <div class="space-y-4">
    <div>
      <label for="schedule-date" class="label">Date</label>
      <input
        id="schedule-date"
        type="date"
        class="input"
        bind:value={scheduleDate}
        required
      />
    </div>
    <div>
      <label for="schedule-time" class="label">Time (optional)</label>
      <input
        id="schedule-time"
        type="time"
        class="input"
        bind:value={scheduleTime}
      />
    </div>
  </div>
  <div slot="footer">
    <button class="btn-secondary" on:click={() => { scheduleModalOpen = false; selectedPostId = null; scheduleDate = ''; scheduleTime = ''; }}>Cancel</button>
    <button class="btn-primary" disabled={!scheduleDate} on:click={handleScheduleConfirm}>Schedule</button>
  </div>
</Modal>