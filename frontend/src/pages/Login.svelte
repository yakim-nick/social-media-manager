<script>
  import { login, authLoading, authError } from '../stores/auth.js';
  import { addNotification } from '../stores/ui.js';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';

  let email = '';
  let password = '';
  let error = '';
  let submitted = false;

  $: if ($authError) {
    error = $authError;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    submitted = true;

    if (!email.trim() || !password.trim()) {
      error = 'Please fill in all fields.';
      return;
    }

    error = '';
    try {
      await login(email.trim(), password);
      addNotification('success', 'Welcome back!');
      window.location.hash = '#/dashboard';
    } catch (err) {
      error = err.message || 'Login failed. Please try again.';
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white text-xl font-bold">
        S
      </div>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">Social Manager</h1>
      <p class="mt-1 text-sm text-gray-500">Sign in to your account</p>
    </div>

    <div class="card p-6">
      <form on:submit={handleSubmit} novalidate>
        {#if error}
          <div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        {/if}

        <div class="space-y-4">
          <div>
            <label for="email" class="label">Email</label>
            <input
              id="email"
              type="email"
              class="input {submitted && !email.trim() ? 'border-red-300' : ''}"
              placeholder="you@example.com"
              bind:value={email}
              autocomplete="email"
              required
            />
            {#if submitted && !email.trim()}
              <p class="mt-1 text-xs text-red-600">Email is required</p>
            {/if}
          </div>

          <div>
            <label for="password" class="label">Password</label>
            <input
              id="password"
              type="password"
              class="input {submitted && !password.trim() ? 'border-red-300' : ''}"
              placeholder="Enter your password"
              bind:value={password}
              autocomplete="current-password"
              required
            />
            {#if submitted && !password.trim()}
              <p class="mt-1 text-xs text-red-600">Password is required</p>
            {/if}
          </div>
        </div>

        <button
          type="submit"
          class="btn-primary mt-6 w-full"
          disabled={$authLoading}
        >
          {#if $authLoading}
            <LoadingSpinner size="sm" color="white" />
            <span class="ml-2">Signing in...</span>
          {:else}
            Sign in
          {/if}
        </button>
      </form>
    </div>

    <p class="mt-6 text-center text-sm text-gray-500">
      Don't have an account?
      <a href="#/register" class="font-medium text-primary-600 hover:text-primary-500">Create one</a>
    </p>
  </div>
</div>
