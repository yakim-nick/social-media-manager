<script>
  import { register, authLoading, authError } from '../stores/auth.js';
  import { addNotification } from '../stores/ui.js';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';

  let name = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let shopName = '';
  let error = '';
  let submitted = false;

  $: if ($authError) {
    error = $authError;
  }

  function validate() {
    const errors = [];
    if (!name.trim()) errors.push('Name is required.');
    if (!email.trim()) errors.push('Email is required.');
    if (!password.trim()) errors.push('Password is required.');
    if (password.length < 6) errors.push('Password must be at least 6 characters.');
    if (password !== confirmPassword) errors.push('Passwords do not match.');
    if (!shopName.trim()) errors.push('Shop name is required.');
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    submitted = true;

    const errors = validate();
    if (errors.length > 0) {
      error = errors.join(' ');
      return;
    }

    error = '';
    try {
      await register(email.trim(), password, name.trim(), shopName.trim());
      addNotification('success', 'Account created successfully!');
      window.location.hash = '#/dashboard';
    } catch (err) {
      error = err.message || 'Registration failed. Please try again.';
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white text-xl font-bold">
        S
      </div>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">Create your account</h1>
      <p class="mt-1 text-sm text-gray-500">Set up your shop and start managing your social media</p>
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
            <label for="name" class="label">Your Name</label>
            <input
              id="name"
              type="text"
              class="input"
              placeholder="Jane Doe"
              bind:value={name}
              autocomplete="name"
              required
            />
            {#if submitted && !name.trim()}
              <p class="mt-1 text-xs text-red-600">Name is required</p>
            {/if}
          </div>

          <div>
            <label for="email" class="label">Email</label>
            <input
              id="email"
              type="email"
              class="input"
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
              class="input"
              placeholder="Min. 6 characters"
              bind:value={password}
              autocomplete="new-password"
              required
            />
            {#if submitted && !password.trim()}
              <p class="mt-1 text-xs text-red-600">Password is required</p>
            {/if}
          </div>

          <div>
            <label for="confirmPassword" class="label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              class="input"
              placeholder="Repeat your password"
              bind:value={confirmPassword}
              autocomplete="new-password"
              required
            />
            {#if submitted && password !== confirmPassword}
              <p class="mt-1 text-xs text-red-600">Passwords do not match</p>
            {/if}
          </div>

          <div>
            <label for="shopName" class="label">Shop Name</label>
            <input
              id="shopName"
              type="text"
              class="input"
              placeholder="My Awesome Shop"
              bind:value={shopName}
              required
            />
            {#if submitted && !shopName.trim()}
              <p class="mt-1 text-xs text-red-600">Shop name is required</p>
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
            <span class="ml-2">Creating account...</span>
          {:else}
            Create account
          {/if}
        </button>
      </form>
    </div>

    <p class="mt-6 text-center text-sm text-gray-500">
      Already have an account?
      <a href="#/login" class="font-medium text-primary-600 hover:text-primary-500">Sign in</a>
    </p>
  </div>
</div>
