<script>
  import { onMount } from 'svelte';
  import { api } from '../utils/api.js';
  import { createPost, updatePost, fetchPosts } from '../stores/posts.js';
  import { fetchAccounts, accounts, accountsLoading } from '../stores/accounts.js';
  import { addNotification } from '../stores/ui.js';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';
  import FileUpload from '../components/FileUpload.svelte';

  export let params = {};

  let isEdit = false;
  let postId = null;
  let loading = true;
  let saving = false;

  let content = '';
  let selectedAccounts = [];
  let status = 'draft';
  let scheduledAt = '';
  let scheduledTime = '';
  let uploadedFiles = [];
  let error = '';
  let submitted = false;

  onMount(async () => {
    try {
      await fetchAccounts();

      if (params.id) {
        isEdit = true;
        postId = params.id;
        const data = await api.get(`/posts/${postId}`);
        const post = data.post || data;
        content = post.content || '';
        status = post.status || 'draft';
        if (post.accounts) {
          selectedAccounts = post.accounts.map((a) => a.id || a._id || a);
        }
        if (post.scheduledAt) {
          const d = new Date(post.scheduledAt);
          scheduledAt = d.toISOString().split('T')[0];
          scheduledTime = d.toTimeString().split(':').slice(0, 2).join(':');
        }
      }
    } catch (err) {
      addNotification('error', err.message || 'Failed to load post data');
      error = err.message;
    } finally {
      loading = false;
    }
  });

  function validate() {
    const errors = [];
    if (!content.trim()) errors.push('Post content is required.');
    if (selectedAccounts.length === 0) errors.push('Select at least one account to post to.');
    return errors;
  }

  async function save(statusOverride) {
    submitted = true;
    const targetStatus = statusOverride || status;

    const errors = validate();
    if (errors.length > 0) {
      error = errors.join(' ');
      return;
    }
    error = '';
    saving = true;

    const payload = {
      content: content.trim(),
      accounts: selectedAccounts,
      status: targetStatus,
    };

    if (scheduledAt) {
      payload.scheduledAt = new Date(`${scheduledAt}T${scheduledTime || '00:00'}`).toISOString();
    }

    try {
      if (isEdit) {
        await updatePost(postId, payload);
        addNotification('success', 'Post updated');
      } else {
        await createPost(payload);
        addNotification('success', 'Post created');
      }

      // Upload files if any
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        for (const file of uploadedFiles) {
          formData.append('files', file);
        }
        try {
          await api.upload(`/posts/${isEdit ? postId : 'latest'}/media`, formData);
        } catch {
          addNotification('warning', 'Post saved but file upload failed');
        }
      }

      window.location.hash = '#/posts';
    } catch (err) {
      error = err.message || 'Failed to save post';
      addNotification('error', error);
    } finally {
      saving = false;
    }
  }

  function toggleAccount(accountId) {
    if (selectedAccounts.includes(accountId)) {
      selectedAccounts = selectedAccounts.filter((id) => id !== accountId);
    } else {
      selectedAccounts = [...selectedAccounts, accountId];
    }
  }

  function handleFilesChange(e) {
    const files = e.detail.files;
    uploadedFiles = Array.isArray(files) ? files : (files ? [files] : []);
  }
</script>

<div class="max-w-3xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold text-gray-900">
      {isEdit ? 'Edit Post' : 'New Post'}
    </h2>
    <a href="#/posts" class="btn-ghost text-sm">Cancel</a>
  </div>

  {#if loading}
    <div class="py-20">
      <LoadingSpinner size="lg" />
    </div>
  {:else}
    <div class="card p-6">
      {#if error}
        <div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      {/if}

      <div class="space-y-6">
        <!-- Content area -->
        <div>
          <label for="content" class="label">Content</label>
          <textarea
            id="content"
            class="input min-h-[200px] resize-y"
            placeholder="What would you like to share?"
            bind:value={content}
            required
          ></textarea>
          {#if submitted && !content.trim()}
            <p class="mt-1 text-xs text-red-600">Content is required</p>
          {/if}
          <p class="mt-1 text-xs text-gray-400 text-right">{content.length} characters</p>
        </div>

        <!-- Media upload -->
        <div>
          <span class="label">Media</span>
          <FileUpload
            accept="image/*,video/*"
            multiple
            on:filesChange={handleFilesChange}
          />
        </div>

        <!-- Account selection -->
        <div>
          <span class="label">Post to</span>
          {#if $accountsLoading}
            <LoadingSpinner size="sm" />
          {:else if $accounts.length === 0}
            <p class="text-sm text-gray-500">
              No accounts connected.
              <a href="#/settings" class="text-primary-600 font-medium">Connect one now</a>.
            </p>
          {:else}
            <div class="space-y-2">
              {#each $accounts as account (account.id || account._id)}
                {@const accountId = account.id || account._id}
                <label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 {selectedAccounts.includes(accountId) ? 'border-primary-300 bg-primary-50' : ''}">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={selectedAccounts.includes(accountId)}
                    on:change={() => toggleAccount(accountId)}
                  />
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                    {(account.platform || account.type || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{account.name || account.username || 'Unknown'}</p>
                    <p class="text-xs text-gray-500">{account.platform || account.type || 'Social'}</p>
                  </div>
                </label>
              {/each}
            </div>
            {#if submitted && selectedAccounts.length === 0}
              <p class="mt-1 text-xs text-red-600">Select at least one account</p>
            {/if}
          {/if}
        </div>

        <!-- Schedule -->
        <div>
          <span class="label">Schedule (optional)</span>
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1">
              <input
                type="date"
                class="input"
                bind:value={scheduledAt}
              />
            </div>
            <div class="flex-1">
              <input
                type="time"
                class="input"
                bind:value={scheduledTime}
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-200 pt-6">
        <button
          class="btn-secondary"
          on:click={() => save('draft')}
          disabled={saving}
        >
          {#if saving && status === 'draft'}
            <LoadingSpinner size="sm" color="gray" />
            <span class="ml-2">Saving...</span>
          {:else}
            Save as Draft
          {/if}
        </button>

        {#if scheduledAt}
          <button
            class="btn-primary"
            on:click={() => save('scheduled')}
            disabled={saving}
          >
            {#if saving && status === 'scheduled'}
              <LoadingSpinner size="sm" color="white" />
              <span class="ml-2">Scheduling...</span>
            {:else}
              Schedule
            {/if}
          </button>
        {/if}

        <button
          class="bg-green-600 text-white btn hover:bg-green-700 focus:ring-green-500"
          on:click={() => save('published')}
          disabled={saving}
        >
          {#if saving && status === 'published'}
            <LoadingSpinner size="sm" color="white" />
            <span class="ml-2">Publishing...</span>
          {:else}
            Publish Now
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
