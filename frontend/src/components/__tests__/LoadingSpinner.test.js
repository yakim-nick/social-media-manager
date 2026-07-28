import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import LoadingSpinner from '../LoadingSpinner.svelte';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { container } = render(LoadingSpinner);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toBeTruthy();
    expect(spinner.className).toContain('animate-spin');
  });

  it('renders with custom size', () => {
    const { container } = render(LoadingSpinner, { props: { size: 'lg' } });
    const spinner = container.querySelector('[role="status"]');
    expect(spinner.className).toContain('h-12');
  });

  it('renders with custom color', () => {
    const { container } = render(LoadingSpinner, { props: { color: 'white' } });
    const spinner = container.querySelector('[role="status"]');
    expect(spinner.className).toContain('border-white/30');
  });

  it('has accessible label', () => {
    render(LoadingSpinner);
    const srLabel = document.querySelector('.sr-only');
    expect(srLabel).toBeTruthy();
    expect(srLabel.textContent).toBe('Loading...');
  });
});
