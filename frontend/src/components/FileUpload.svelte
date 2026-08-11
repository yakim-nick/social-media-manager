<script>
  import { createEventDispatcher } from 'svelte';

  /**
   * Drag-and-drop file uploader with size validation and previews.
   * @prop {string} accept - Accepted MIME types (passed to the file input).
   * @prop {number} maxSize - Maximum file size in bytes.
   * @prop {boolean} multiple - Whether multiple files may be selected.
   * @event filesChange - Dispatched with `{ files }` (array when multiple,
   *   single file or null otherwise).
   */
  export let accept = 'image/*';
  export let maxSize = 10 * 1024 * 1024; // 10 MB
  export let multiple = false;

  const dispatch = createEventDispatcher();

  let dragOver = false;
  let files = [];
  let error = '';

  /** Highlight the drop zone while dragging over it. */
  function handleDragOver(event) {
    event.preventDefault();
    dragOver = true;
  }

  /** Remove the drop-zone highlight when leaving it. */
  function handleDragLeave() {
    dragOver = false;
  }

  /** Accept files dropped onto the drop zone. */
  function handleDrop(event) {
    event.preventDefault();
    dragOver = false;
    const droppedFiles = Array.from(event.dataTransfer.files);
    processFiles(droppedFiles);
  }

  /** Accept files chosen via the file input. */
  function handleFileSelect(event) {
    const selectedFiles = Array.from(event.target.files);
    processFiles(selectedFiles);
  }

  /**
   * Validate and store newly selected files, rejecting any that exceed the
   * maximum size, then notify the parent.
   * @param {File[]} newFiles - Files to add.
   */
  function processFiles(newFiles) {
    error = '';
    const validFiles = [];
    for (const file of newFiles) {
      if (file.size > maxSize) {
        error = `"${file.name}" exceeds the maximum file size of ${Math.round(maxSize / 1024 / 1024)}MB.`;
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;

    if (multiple) {
      files = [...files, ...validFiles];
    } else {
      files = [validFiles[0]];
    }
    dispatch('filesChange', { files: multiple ? files : files[0] });
  }

  /** Remove a file by index and notify the parent. */
  function removeFile(index) {
    files = files.filter((_, i) => i !== index);
    dispatch('filesChange', { files: multiple ? files : files[0] || null });
  }

  /** Format a byte count as a human-readable size string. */
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /** Create an object URL preview for image files (null for others). */
  function getFilePreviewUrl(file) {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  }

  $: previewUrls = files.map((file) => getFilePreviewUrl(file));
</script>

<div
  class="relative rounded-lg border-2 border-dashed p-6 transition-colors {dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}"
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  role="button"
  tabindex="0"
  aria-label="Upload files"
>
  <input
    type="file"
    accept={accept}
    multiple={multiple}
    class="absolute inset-0 opacity-0 cursor-pointer"
    on:change={handleFileSelect}
  />

  {#if files.length === 0}
    <div class="text-center">
      <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p class="mt-2 text-sm text-gray-600">
        <span class="font-medium text-primary-600">Click to upload</span> or drag and drop
      </p>
      <p class="mt-1 text-xs text-gray-500">
        {accept === 'image/*' ? 'PNG, JPG, GIF up to ' : ''}{Math.round(maxSize / 1024 / 1024)}MB
      </p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each files as file, i}
        <div class="flex items-center gap-3 rounded-md bg-gray-50 p-2">
          {#if previewUrls[i]}
            <img src={previewUrls[i]} alt={file.name} class="h-10 w-10 rounded object-cover" />
          {:else}
            <div class="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-gray-500">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          {/if}
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p class="text-xs text-gray-500">{formatSize(file.size)}</p>
          </div>
          <button
            class="btn-ghost p-1 text-gray-400 hover:text-red-500"
            on:click|stopPropagation={() => removeFile(i)}
            aria-label="Remove file"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/each}
      {#if multiple}
        <div class="text-center">
          <label class="text-sm font-medium text-primary-600 cursor-pointer hover:text-primary-700">
            Add more files
            <input type="file" accept={accept} multiple class="hidden" on:change={handleFileSelect} />
          </label>
        </div>
      {/if}
    </div>
  {/if}
</div>

{#if error}
  <p class="mt-2 text-sm text-red-600">{error}</p>
{/if}