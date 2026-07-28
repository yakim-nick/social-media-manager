<script>
  export let size = 'md';
  export let color = 'primary';

  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const colorClasses = {
    primary: 'border-primary-200 border-t-primary-600',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-600',
  };

  $: classes = `animate-spin rounded-full ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.primary}`;
</script>

<div class="flex items-center justify-center">
  <div class={classes} role="status">
    <span class="sr-only">Loading...</span>
  </div>
</div>

<style>
  .border-3 {
    border-width: 3px;
  }
</style>
