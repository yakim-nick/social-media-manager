<script>
  import { slide } from 'svelte/transition';
  import { user, isAuthenticated, logout } from '../stores/auth.js';
  import { sidebarOpen, addNotification } from '../stores/ui.js';
  import Sidebar from './Sidebar.svelte';
  import Notification from './Notification.svelte';

  /** @type {{ currentRoute: string }} */
  export let currentRoute = '';

  let showUserMenu = false;

  async function handleLogout() {
    showUserMenu = false;
    try {
      await logout();
      addNotification('success', 'Logged out successfully');
    } catch {
      addNotification('error', 'Failed to log out');
    }
  }

  function closeUserMenu() {
    showUserMenu = false;
  }
</script>

<svelte:window on:click={closeUserMenu} />

<div class="flex h-screen overflow-hidden bg-gray-50">
  <Sidebar {currentRoute} />

  <!-- Main content -->
  <div class="flex flex-1 flex-col overflow-hidden lg:ml-0">
    <!-- Top bar -->
    <header class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6 shrink-0">
      <div class="flex items-center gap-3">
        <button
          class="btn-ghost p-1 lg:hidden"
          on:click={() => sidebarOpen.set(true)}
          aria-label="Open sidebar"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 class="text-lg font-semibold text-gray-900 hidden sm:block">
          Social Manager
        </h1>
      </div>

      <div class="flex items-center gap-3">
        {#if $isAuthenticated}
          <div class="relative">
            <button
              class="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors"
              on:click|stopPropagation={() => showUserMenu = !showUserMenu}
              aria-label="User menu"
              aria-haspopup="true"
              aria-expanded={showUserMenu}
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-medium">
                {($user?.name || 'U')[0].toUpperCase()}
              </div>
              <span class="text-sm font-medium text-gray-700 hidden sm:block">{$user?.name || 'User'}</span>
              <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {#if showUserMenu}
              <div
                class="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-30"
                transition:slide={{ duration: 150 }}
                role="menu"
              >
                <a
                  href="#/settings"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  role="menuitem"
                  on:click={() => showUserMenu = false}
                >
                  Settings
                </a>
                <button
                  class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  role="menuitem"
                  on:click={handleLogout}
                >
                  Log out
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1 overflow-y-auto p-4 lg:p-6">
      <slot />
    </main>
  </div>
</div>

<Notification />

<style>
  :global(body) {
    margin: 0;
  }
</style>
