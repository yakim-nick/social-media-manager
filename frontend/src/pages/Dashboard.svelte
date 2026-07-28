<script>
  import { onMount } from 'svelte';
  import { user } from '../stores/auth.js';
  import { fetchPosts, posts, postsLoading } from '../stores/posts.js';
  import { fetchAccounts, accounts, accountsLoading } from '../stores/accounts.js';
  import { addNotification } from '../stores/ui.js';
  import PostCard from '../components/PostCard.svelte';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';
  import EmptyState from '../components/EmptyState.svelte';

  let loading = true;
  let stats = {
    totalPosts: 0,
    publishedPosts: 0,
    scheduledPosts: 0,
    draftPosts: 0,
    accountsConnected: 0,
  };

  $: if ($posts && $accounts) {
    stats = {
      totalPosts: $posts.length,
      publishedPosts: $posts.filter((p) => p.status === 'published').length,
      scheduledPosts: $posts.filter((p) => p.status === 'scheduled').length,
      draftPosts: $posts.filter((p) => p.status === 'draft').length,
      accountsConnected: $accounts.length,
    };
  }

  onMount(async () => {
    try {
      await Promise.all([
        fetchPosts({ limit: 5 }),
        fetchAccounts(),
      ]);
    } catch (err) {
      addNotification('error', err.message || 'Failed to load dashboard data');
    } finally {
      loading = false;
    }
  });

  $: recentPosts = $posts?.slice(0, 5) || [];

  function handleEditPost(e) {
    window.location.hash = `#/posts/edit/${e.detail.id}`;
  }

  function handleDeletePost(e) {
    // delegate to Posts page via redirect
    window.location.hash = '#/posts';
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold text-gray-900">Dashboard</h2>
    <div class="flex items-center gap-2">
      <a href="#/posts/new" class="btn-primary text-sm">
        <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Post
      </a>
    </div>
  </div>

  {#if loading}
    <div class="py-20">
      <LoadingSpinner size="lg" />
    </div>
  {:else}
    <!-- Stats cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-gray-500">Total Posts</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">Published</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{stats.publishedPosts}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">Scheduled</p>
        <p class="mt-1 text-2xl font-bold text-yellow-600">{stats.scheduledPosts}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">Accounts</p>
        <p class="mt-1 text-2xl font-bold text-primary-600">{stats.accountsConnected}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Recent posts -->
      <div class="card">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">Recent Posts</h3>
          <a href="#/posts" class="text-sm font-medium text-primary-600 hover:text-primary-500">View all</a>
        </div>
        <div class="p-4 space-y-3">
          {#if recentPosts.length === 0}
            <EmptyState
              title="No posts yet"
              description="Create your first post to get started."
              actionLabel="Create Post"
              on:action={() => window.location.hash = '#/posts/new'}
            />
          {:else}
            {#each recentPosts as post (post.id || post._id)}
              <PostCard {post} compact on:edit={handleEditPost} on:delete={handleDeletePost} />
            {/each}
          {/if}
        </div>
      </div>

      <!-- Connected accounts -->
      <div class="card">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">Connected Accounts</h3>
          <a href="#/settings" class="text-sm font-medium text-primary-600 hover:text-primary-500">Manage</a>
        </div>
        <div class="p-4">
          {#if $accounts.length === 0}
            <EmptyState
              title="No accounts connected"
              description="Connect your social media accounts to start posting."
              actionLabel="Connect Account"
              on:action={() => window.location.hash = '#/settings'}
            />
          {:else}
            <div class="space-y-3">
              {#each $accounts as account (account.id || account._id)}
                <div class="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                    {(account.platform || account.type || '?')[0].toUpperCase()}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{account.name || account.username || 'Unknown'}</p>
                    <p class="text-xs text-gray-500">{account.platform || account.type || 'Social'}</p>
                  </div>
                  <span class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Connected
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
