<script>
  import { fly } from 'svelte/transition';
  import { user } from '../stores/auth.js';
  import { sidebarOpen } from '../stores/ui.js';

  /**
   * Main navigation sidebar with mobile overlay.
   * @prop {string} currentRoute - Active route path (for highlighting).
   */
  export let currentRoute = '';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/posts', label: 'Posts', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
    { path: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { path: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  $: shopName = $user?.shop?.name || $user?.shopName || 'My Shop';

  /** Whether the given nav path matches the current route. */
  function isActive(path) {
    return currentRoute.startsWith(path);
  }

  /** Close the sidebar (used on mobile after navigation). */
  function closeMobile() {
    sidebarOpen.set(false);
  }
</script>

<!-- Mobile overlay -->
{#if $sidebarOpen}
  <div
    class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    on:click={closeMobile}
    on:keydown={(e) => e.key === 'Escape' && closeMobile()}
    role="presentation"
    transition:fly={{ duration: 200, opacity: 0 }}
  ></div>
{/if}

<!-- Sidebar -->
<aside
  class="fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto { $sidebarOpen ? 'translate-x-0' : '-translate-x-full' }"
  role="navigation"
  aria-label="Main navigation"
>
  <div class="flex h-full flex-col">
    <!-- Logo / Shop name -->
    <div class="flex items-center justify-between px-6 py-5 border-b border-gray-200">
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-bold">
          S
        </div>
        <span class="font-semibold text-gray-900 truncate">{shopName}</span>
      </div>
      <button
        class="btn-ghost p-1 lg:hidden"
        on:click={closeMobile}
        aria-label="Close sidebar"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Nav items -->
    <nav class="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin">
      {#each navItems as item}
        <a
          href="#{item.path}"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {isActive(item.path) ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}"
          on:click={closeMobile}
        >
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
          </svg>
          {item.label}
        </a>
      {/each}
    </nav>

    <!-- User info at bottom -->
    <div class="border-t border-gray-200 px-6 py-4">
      <p class="text-sm font-medium text-gray-900 truncate">{$user?.name || 'User'}</p>
      <p class="text-xs text-gray-500 truncate">{$user?.email || ''}</p>
    </div>
  </div>
</aside>