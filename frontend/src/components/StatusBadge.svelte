<script>
  export let status = 'draft';

  const badges = {
    draft: { label: 'Draft', class: 'bg-gray-100 text-gray-700' },
    scheduled: { label: 'Scheduled', class: 'bg-yellow-100 text-yellow-800' },
    published: { label: 'Published', class: 'bg-green-100 text-green-800' },
    failed: { label: 'Failed', class: 'bg-red-100 text-red-800' },
    pending: { label: 'Pending', class: 'bg-blue-100 text-blue-800' },
  };

  $: badge = badges[status?.toLowerCase()] || badges.draft;
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {badge.class}">
  {badge.label}
</span>
