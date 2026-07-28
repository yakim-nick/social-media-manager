import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatusBadge from '../StatusBadge.svelte';

describe('StatusBadge', () => {
  it('renders draft status', () => {
    render(StatusBadge, { props: { status: 'draft' } });
    expect(screen.getByText('Draft')).toBeTruthy();
  });

  it('renders published status', () => {
    render(StatusBadge, { props: { status: 'published' } });
    expect(screen.getByText('Published')).toBeTruthy();
  });

  it('renders scheduled status', () => {
    render(StatusBadge, { props: { status: 'scheduled' } });
    expect(screen.getByText('Scheduled')).toBeTruthy();
  });

  it('renders failed status', () => {
    render(StatusBadge, { props: { status: 'failed' } });
    expect(screen.getByText('Failed')).toBeTruthy();
  });

  it('defaults to Draft for unknown status', () => {
    render(StatusBadge, { props: { status: 'unknown' } });
    expect(screen.getByText('Draft')).toBeTruthy();
  });

  it('handles case-insensitive status', () => {
    render(StatusBadge, { props: { status: 'PUBLISHED' } });
    expect(screen.getByText('Published')).toBeTruthy();
  });
});
