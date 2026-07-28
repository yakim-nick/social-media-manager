import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import EmptyState from '../EmptyState.svelte';

describe('EmptyState', () => {
  it('renders title', () => {
    render(EmptyState, { props: { title: 'No items' } });
    expect(screen.getByText('No items')).toBeTruthy();
  });

  it('renders description when provided', () => {
    render(EmptyState, { props: { description: 'There are no items yet.' } });
    expect(screen.getByText('There are no items yet.')).toBeTruthy();
  });

  it('does not render description when not provided', () => {
    const { container } = render(EmptyState, { props: { title: 'Empty' } });
    const descriptions = container.querySelectorAll('p');
    expect(descriptions.length).toBe(0);
  });

  it('renders action button when actionLabel is provided', () => {
    render(EmptyState, { props: { actionLabel: 'Create New' } });
    expect(screen.getByText('Create New')).toBeTruthy();
  });

  it('does not render action button without actionLabel', () => {
    render(EmptyState, { props: { title: 'Empty' } });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders with different icon types', () => {
    const { container } = render(EmptyState, { props: { icon: 'search' } });
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
