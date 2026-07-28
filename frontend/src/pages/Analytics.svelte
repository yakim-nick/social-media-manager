<script>
  import { onMount } from 'svelte';
  import { fetchAnalytics, analyticsData, analyticsLoading, analyticsError } from '../stores/analytics.js';
  import { fetchAccounts, accounts } from '../stores/accounts.js';
  import { addNotification } from '../stores/ui.js';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';
  import EmptyState from '../components/EmptyState.svelte';

  let startDate = '';
  let endDate = '';
  let selectedAccountId = '';

  const metrics = [
    { key: 'followers', label: 'Followers', color: 'bg-blue-500' },
    { key: 'likes', label: 'Likes', color: 'bg-pink-500' },
    { key: 'comments', label: 'Comments', color: 'bg-green-500' },
    { key: 'shares', label: 'Shares', color: 'bg-purple-500' },
    { key: 'impressions', label: 'Impressions', color: 'bg-yellow-500' },
    { key: 'reach', label: 'Reach', color: 'bg-indigo-500' },
  ];

  onMount(async () => {
    try {
      await fetchAccounts();
      // Set default date range to last 30 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
      loadAnalytics();
    } catch (err) {
      addNotification('error', 'Failed to initialize analytics');
    }
  });

  async function loadAnalytics() {
    try {
      await fetchAnalytics({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        accountId: selectedAccountId || undefined,
      });
    } catch (err) {
      addNotification('error', err.message || 'Failed to load analytics');
    }
  }

  $: data = $analyticsData?.metrics || $analyticsData?.data || null;
  $: maxValue = data ? Math.max(...metrics.map((m) => data[m.key] || 0), 1) : 1;

  function getPercentage(value) {
    return Math.max(0, Math.min(100, ((value || 0) / maxValue) * 100));
  }
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-gray-900">Analytics</h2>

  <!-- Filters -->
  <div class="card p-4">
    <div class="flex flex-col sm:flex-row gap-4 items-end">
      <div>
        <label for="start-date" class="label">Start Date</label>
        <input
          id="start-date"
          type="date"
          class="input"
          bind:value={startDate}
        />
      </div>
      <div>
        <label for="end-date" class="label">End Date</label>
        <input
          id="end-date"
          type="date"
          class="input"
          bind:value={endDate}
        />
      </div>
      <div>
        <label for="account-filter" class="label">Account</label>
        <select
          id="account-filter"
          class="input"
          bind:value={selectedAccountId}
        >
          <option value="">All Accounts</option>
          {#each $accounts as account (account.id || account._id)}
            <option value={account.id || account._id}>
              {account.name || account.username || account.platform || 'Unknown'}
            </option>
          {/each}
        </select>
      </div>
      <button class="btn-primary" on:click={loadAnalytics}>Apply</button>
    </div>
  </div>

  <!-- Analytics data -->
  {#if $analyticsLoading}
    <div class="py-20">
      <LoadingSpinner size="lg" />
    </div>
  {:else if $analyticsError}
    <div class="card p-6 text-center">
      <p class="text-red-600">{$analyticsError}</p>
      <button class="btn-secondary mt-4" on:click={loadAnalytics}>Retry</button>
    </div>
  {:else if !data}
    <EmptyState
      title="No analytics data"
      description="Select a date range and account to view your analytics."
    />
  {:else}
    <div class="grid gap-4">
      {#each metrics as metric}
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">{metric.label}</span>
            <span class="text-lg font-bold text-gray-900">{(data[metric.key] || 0).toLocaleString()}</span>
          </div>
          <div class="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              class="h-full rounded-full {metric.color} transition-all duration-500"
              style="width: {getPercentage(data[metric.key])}%"
            ></div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Summary row -->
    <div class="card p-4">
      <h3 class="text-sm font-medium text-gray-700 mb-3">Summary</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {#each metrics as metric}
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-900">{(data[metric.key] || 0).toLocaleString()}</p>
            <p class="text-xs text-gray-500">{metric.label}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
