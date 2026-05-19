/**
 * Phase 15: Artifacts & Live Updates Test Suite
 *
 * Tests for Phase 13 (Artifact Management) and Phase 14 (Live Updates)
 * frontend components and hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// ─── useArtifacts Hook Tests ────────────────────────────────────────

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useArtifacts Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should fetch artifacts on mount', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 'a1', type: 'resume', name: 'Resume 1', content: 'abc', created_at: '2026-01-01' },
      ]),
    });

    const { useArtifacts } = await import('../../lib/hooks/use-artifacts');
    const { result } = renderHook(() => useArtifacts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.artifacts).toHaveLength(1);
    expect(result.current.artifacts[0].name).toBe('Resume 1');
  });

  it('should filter by type when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ([]),
    });

    const { useArtifacts } = await import('../../lib/hooks/use-artifacts');
    renderHook(() => useArtifacts({ type: 'cover_letter' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('type=cover_letter');
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    const { useArtifacts } = await import('../../lib/hooks/use-artifacts');
    const { result } = renderHook(() => useArtifacts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.artifacts).toHaveLength(0);
  });

  it('should delete an artifact', async () => {
    // First call: fetch list
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        { id: 'a1', type: 'resume', name: 'R1', content: 'x', created_at: '2026-01-01' },
      ]),
    });

    const { useArtifacts } = await import('../../lib/hooks/use-artifacts');
    const { result } = renderHook(() => useArtifacts());

    await waitFor(() => {
      expect(result.current.artifacts).toHaveLength(1);
    });

    // Mock delete call
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'deleted' }) });
    // Mock refetch after delete
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([]),
    });

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.deleteArtifact('a1');
    });

    expect(deleteResult).toBe(true);
  });
});

// ─── Data Isolation Tests ────────────────────────────────────────

describe('API Route Data Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('artifacts route should reject unauthenticated requests', async () => {
    // Mock no session
    vi.doMock('next-auth', () => ({
      getServerSession: vi.fn().mockResolvedValue(null),
    }));

    const { GET } = await import('../../app/api/artifacts/route');

    const request = new Request('http://localhost:3000/api/artifacts');
    const response = await GET(request as any);

    expect(response.status).toBe(401);
  });
});

// ─── useMissions Auto-Polling Tests ───────────────────────────────────

describe('useMissions Auto-Polling (Phase 14)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not poll when all missions are completed', async () => {
    const { agentClient } = await import('../../lib/api/agent-client');

    (agentClient.listMissions as any) = vi.fn().mockResolvedValue({
      missions: [
        { mission_id: 'm1', status: 'completed', progress: 100, events: [], artifacts: [] },
      ],
      total: 1,
    });

    const { useMissions } = await import('../../lib/hooks/use-missions');
    renderHook(() => useMissions());

    // Wait for initial load
    await vi.advanceTimersByTimeAsync(100);

    const initialCallCount = (agentClient.listMissions as any).mock.calls.length;

    // Advance by 10 seconds — no additional polls should happen
    await vi.advanceTimersByTimeAsync(10000);

    const finalCallCount = (agentClient.listMissions as any).mock.calls.length;

    // Should not have polled again since all missions are terminal
    expect(finalCallCount).toBe(initialCallCount);
  });
});

// ─── Component Render Tests ──────────────────────────────────────

describe('MissionTimeline Component', () => {
  it('should export MissionTimeline', async () => {
    const mod = await import('../../components/dashboard/mission-timeline');
    expect(mod.MissionTimeline).toBeDefined();
  });
});

describe('LiveStatusBadge Component', () => {
  it('should export LiveStatusBadge', async () => {
    const mod = await import('../../components/dashboard/live-status-badge');
    expect(mod.LiveStatusBadge).toBeDefined();
  });
});

describe('ArtifactCard Component', () => {
  it('should export ArtifactCard', async () => {
    const mod = await import('../../components/dashboard/artifact-card');
    expect(mod.ArtifactCard).toBeDefined();
  });
});

describe('ArtifactPreview Component', () => {
  it('should export ArtifactPreview', async () => {
    const mod = await import('../../components/dashboard/artifact-preview');
    expect(mod.ArtifactPreview).toBeDefined();
  });
});
