<script>
  import { onMount } from 'svelte';
  import { user } from '../stores/auth.js';
  import { api } from '../utils/api.js';
  import { fetchAccounts, connectAccount, disconnectAccount, accounts, accountsLoading } from '../stores/accounts.js';
  import { addNotification } from '../stores/ui.js';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';
  import EmptyState from '../components/EmptyState.svelte';
  import Modal from '../components/Modal.svelte';

  // Profile form state.
  let profileName = '';
  let profileEmail = '';
  let profileSaving = false;

  // Password form state.
  let currentPassword = '';
  let newPassword = '';
  let confirmNewPassword = '';
  let passwordSaving = false;
  let passwordError = '';

  // Connect-account modal state.
  let connectModalOpen = false;
  let platform = 'facebook';
  let connectData = '';
  let connecting = false;

  // Disconnect confirmation modal state.
  let disconnectModalOpen = false;
  let disconnectId = null;

  // Pre-fill the profile form from the current user.
  $: if ($user) {
    profileName = $user.name || '';
    profileEmail = $user.email || '';
  }

  onMount(() => {
    fetchAccounts().catch((err) => {
      addNotification('error', err.message || 'Failed to load accounts');
    });
  });

  /** Save the profile name. */
  async function saveProfile() {
    if (!profileName.trim()) {
      addNotification('error', 'Name is required');
      return;
    }
    profileSaving = true;
    try {
      const data = await api.put('/auth/profile', { name: profileName.trim() });
      user.set(data.user || data);
      addNotification('success', 'Profile updated');
    } catch (err) {
      addNotification('error', err.message || 'Failed to update profile');
    } finally {
      profileSaving = false;
    }
  }

  /** Change the password after validating the form. */
  async function changePassword() {
    passwordError = '';
    if (!currentPassword || !newPassword) {
      passwordError = 'All fields are required.';
      return;
    }
    if (newPassword.length < 6) {
      passwordError = 'New password must be at least 6 characters.';
      return;
    }
    if (newPassword !== confirmNewPassword) {
      passwordError = 'Passwords do not match.';
      return;
    }
    passwordSaving = true;
    try {
      await api.put('/auth/password', {
        currentPassword,
        newPassword,
      });
      addNotification('success', 'Password changed');
      currentPassword = '';
      newPassword = '';
      confirmNewPassword = '';
    } catch (err) {
      passwordError = err.message || 'Failed to change password';
    } finally {
      passwordSaving = false;
    }
  }

  /** Connect a new account using the platform-specific credential. */
  async function handleConnectAccount() {
    if (!connectData.trim()) {
      addNotification('error', 'Please provide the required connection data');
      return;
    }
    connecting = true;
    try {
      const payload = { platform };
      if (platform === 'facebook' || platform === 'instagram') {
        payload.accessToken = connectData.trim();
      } else {
        payload.apiKey = connectData.trim();
      }
      await connectAccount(payload);
      addNotification('success', `Connected ${platform} account`);
      connectModalOpen = false;
      connectData = '';
      fetchAccounts();
    } catch (err) {
      addNotification('error', err.message || 'Failed to connect account');
    } finally {
      connecting = false;
    }
  }

  /** Disconnect the account selected in the confirmation modal. */
  async function handleDisconnectAccount() {
    if (!disconnectId) return;
    try {
      await disconnectAccount(disconnectId);
      addNotification('success', 'Account disconnected');
      disconnectModalOpen = false;
      disconnectId = null;
    } catch (err) {
      addNotification('error', err.message || 'Failed to disconnect account');
    }
  }

  /** Open the disconnect confirmation modal for an account. */
  function promptDisconnect(event) {
    disconnectId = event.id || event.currentTarget?.dataset?.id;
    disconnectModalOpen = true;
  }
</script>

<div class="max-w-3xl mx-auto space-y-6">
  <h2 class="text-xl font-bold text-gray-900">Settings</h2>

  <!-- Profile -->
  <div class="card p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
    <div class="space-y-4">
      <div>
        <label for="profile-name" class="label">Name</label>
        <input id="profile-name" type="text" class="input" bind:value={profileName} />
      </div>
      <div>
        <label for="profile-email" class="label">Email</label>
        <input id="profile-email" type="email" class="input" bind:value={profileEmail} disabled />
        <p class="mt-1 text-xs text-gray-400">Email cannot be changed</p>
      </div>
      <div class="flex justify-end">
        <button class="btn-primary" on:click={saveProfile} disabled={profileSaving}>
          {profileSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  </div>

  <!-- Change password -->
  <div class="card p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
    {#if passwordError}
      <div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">
        {passwordError}
      </div>
    {/if}
    <div class="space-y-4">
      <div>
        <label for="current-password" class="label">Current Password</label>
        <input id="current-password" type="password" class="input" bind:value={currentPassword} autocomplete="current-password" />
      </div>
      <div>
        <label for="new-password" class="label">New Password</label>
        <input id="new-password" type="password" class="input" bind:value={newPassword} autocomplete="new-password" placeholder="Min. 6 characters" />
      </div>
      <div>
        <label for="confirm-new-password" class="label">Confirm New Password</label>
        <input id="confirm-new-password" type="password" class="input" bind:value={confirmNewPassword} autocomplete="new-password" />
      </div>
      <div class="flex justify-end">
        <button class="btn-primary" on:click={changePassword} disabled={passwordSaving}>
          {passwordSaving ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  </div>

  <!-- Connected accounts -->
  <div class="card p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Connected Accounts</h3>
      <button class="btn-secondary text-sm" on:click={() => connectModalOpen = true}>
        <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Connect
      </button>
    </div>

    {#if $accountsLoading}
      <LoadingSpinner />
    {:else if $accounts.length === 0}
      <EmptyState
        title="No accounts connected"
        description="Connect your social media accounts to start posting."
        actionLabel="Connect Account"
        on:action={() => connectModalOpen = true}
      />
    {:else}
      <div class="space-y-3">
        {#each $accounts as account (account.id || account._id)}
          {@const accountId = account.id || account._id}
          <div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                {(account.platform || account.type || '?')[0].toUpperCase()}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{account.name || account.username || 'Unknown'}</p>
                <p class="text-xs text-gray-500">{account.platform || account.type || 'Social'}</p>
                {#if account.profileUrl}
                  <a href={account.profileUrl} target="_blank" rel="noopener noreferrer" class="text-xs text-primary-600 hover:underline">View profile</a>
                {/if}
              </div>
            </div>
            <button
              class="btn-ghost text-sm text-red-600 hover:text-red-700"
              data-id={accountId}
              on:click={promptDisconnect}
            >
              Disconnect
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Connect account modal -->
<Modal
  open={connectModalOpen}
  title="Connect Account"
  on:close={() => { connectModalOpen = false; connectData = ''; }}
>
  <div class="space-y-4">
    <div>
      <label for="platform-select" class="label">Platform</label>
      <select id="platform-select" class="input" bind:value={platform}>
        <option value="facebook">Facebook</option>
        <option value="instagram">Instagram</option>
        <option value="twitter">Twitter / X</option>
        <option value="linkedin">LinkedIn</option>
        <option value="tiktok">TikTok</option>
      </select>
    </div>
    <div>
      <label for="connect-data" class="label">
        {platform === 'facebook' || platform === 'instagram' ? 'Access Token' : 'API Key'}
      </label>
      <input
        id="connect-data"
        type="text"
        class="input"
        placeholder={platform === 'facebook' || platform === 'instagram' ? 'Paste your access token...' : 'Paste your API key...'}
        bind:value={connectData}
      />
    </div>
  </div>
  <div slot="footer">
    <button class="btn-secondary" on:click={() => { connectModalOpen = false; connectData = ''; }}>Cancel</button>
    <button class="btn-primary" on:click={handleConnectAccount} disabled={connecting || !connectData.trim()}>
      {connecting ? 'Connecting...' : 'Connect'}
    </button>
  </div>
</Modal>

<!-- Disconnect confirmation modal -->
<Modal
  open={disconnectModalOpen}
  title="Disconnect Account"
  on:close={() => { disconnectModalOpen = false; disconnectId = null; }}
>
  <p class="text-sm text-gray-600">Are you sure you want to disconnect this account? You can reconnect it later.</p>
  <div slot="footer">
    <button class="btn-secondary" on:click={() => { disconnectModalOpen = false; disconnectId = null; }}>Cancel</button>
    <button class="btn-danger" on:click={handleDisconnectAccount}>Disconnect</button>
  </div>
</Modal>