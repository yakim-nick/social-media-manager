<script>
  import { onMount } from 'svelte';
  import { isAuthenticated, user, checkAuth } from './stores/auth.js';
  import Layout from './components/Layout.svelte';
  import LoadingSpinner from './components/LoadingSpinner.svelte';
  import Login from './pages/Login.svelte';
  import Register from './pages/Register.svelte';
  import Dashboard from './pages/Dashboard.svelte';
  import Posts from './pages/Posts.svelte';
  import PostEditor from './pages/PostEditor.svelte';
  import Analytics from './pages/Analytics.svelte';
  import Settings from './pages/Settings.svelte';

  let currentRoute = '';
  let routeParams = {};
  let checkingAuth = true;

  function parseHash() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const parts = hash.split('/').filter(Boolean);

    let path = '/' + parts[0];
    const params = {};

    if (parts[0] === 'posts' && parts[1] === 'edit' && parts[2]) {
      path = '/posts/edit';
      params.id = parts[2];
    } else if (parts[0] === 'posts' && parts[1] === 'new') {
      path = '/posts/new';
    } else if (parts[0] === 'posts' && parts[1]) {
      path = '/posts/edit';
      params.id = parts[1];
    }

    return { path, params };
  }

  function handleHashChange() {
    const parsed = parseHash();
    currentRoute = parsed.path;
    routeParams = parsed.params;
  }

  onMount(async () => {
    await checkAuth();
    checkingAuth = false;

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  });

  $: isAuth = $isAuthenticated;

  $: {
    // Redirect to dashboard on login if already authenticated
    if (!checkingAuth && isAuth && (currentRoute === '/login' || currentRoute === '/register')) {
      currentRoute = '/dashboard';
      window.location.hash = '#/dashboard';
    }
  }
</script>

{#if checkingAuth}
  <div class="flex h-screen items-center justify-center bg-gray-50">
    <div class="text-center">
      <LoadingSpinner size="lg" />
      <p class="mt-4 text-sm text-gray-500">Loading...</p>
    </div>
  </div>
{:else if !isAuth}
  {#if currentRoute === '/register'}
    <Register />
  {:else}
    <Login />
  {/if}
{:else}
  <Layout {currentRoute}>
    {#if currentRoute === '/dashboard' || currentRoute === '/'}
      <Dashboard />
    {:else if currentRoute === '/posts'}
      <Posts />
    {:else if currentRoute === '/posts/new' || currentRoute === '/posts/edit'}
      <PostEditor params={routeParams} />
    {:else if currentRoute === '/analytics'}
      <Analytics />
    {:else if currentRoute === '/settings'}
      <Settings />
    {:else}
      <div class="flex flex-col items-center justify-center py-20">
        <h2 class="text-xl font-bold text-gray-900">Page Not Found</h2>
        <p class="mt-2 text-gray-500">The page you're looking for doesn't exist.</p>
        <a href="#/dashboard" class="btn-primary mt-4">Go to Dashboard</a>
      </div>
    {/if}
  </Layout>
{/if}
