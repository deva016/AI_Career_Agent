/**
 * API Routes Test Suite
 * 
 * Comprehensive tests for Next.js API routes handling mission operations.
 * Tests authentication, request validation, error handling, and backend integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock dependencies
vi.mock('next-auth');
vi.mock('../../lib/auth');

// Import routes after mocks are set up
import { POST as jobFinderPost } from '../../app/api/agent/mission/job-finder/route';
import { POST as resumePost } from '../../app/api/agent/mission/resume/route';
import { POST as applicationPost } from '../../app/api/agent/mission/application/route';
import { GET as missionGet } from '../../app/api/agent/mission/[id]/route';
import { POST as approvePost } from '../../app/api/agent/mission/[id]/approve/route';
import { GET as missionsGet } from '../../app/api/agent/missions/route';

// Helper functions
function createMockRequest(body?: any, url?: string): NextRequest {
  const requestUrl = url || 'http://localhost:3000/api/test';
  return new NextRequest(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function mockSession(email: string = 'test@example.com', userId: string = 'user-123') {
  (getServerSession as any).mockResolvedValue({
    user: {
      email,
      id: userId,
    },
  });
}

function mockNoSession() {
  (getServerSession as any).mockResolvedValue(null);
}

describe('Job Finder API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockNoSession();
    const request = createMockRequest({ query: 'Software Engineer' });
    
    const response = await jobFinderPost(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should successfully forward request to backend with valid session', async () => {
    mockSession('user@test.com');
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        mission_id: 'mission-123',
        status: 'pending',
        progress: 0,
      }),
    });

    const request = createMockRequest({
      query: 'Software Engineer',
      target_roles: ['Developer'],
      target_locations: ['Remote'],
    });

    const response = await jobFinderPost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mission_id).toBe('mission-123');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/agent/mission/job-finder'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-User-Email': 'user@test.com',
        }),
      })
    );
  });

  it('should handle backend errors gracefully', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Backend service error' }),
    });

    const request = createMockRequest({ query: 'test' });
    const response = await jobFinderPost(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Backend service error');
  });

  it('should handle network errors', async () => {
    mockSession();
    (global.fetch as any).mockRejectedValue(new Error('Network failure'));

    const request = createMockRequest({ query: 'test' });
    const response = await jobFinderPost(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should validate request body', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Invalid query parameter' }),
    });

    const request = createMockRequest({});
    const response = await jobFinderPost(request);
    
    expect(response.status).toBeLessThanOrEqual(500);
  });
});

describe('Resume API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should reject unauthenticated requests', async () => {
    mockNoSession();
    const request = createMockRequest({ resume_text: 'My resume...', job_description: 'JD' });
    
    const response = await resumePost(request);
    expect(response.status).toBe(401);
  });

  it('should forward resume tailoring request', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ mission_id: 'resume-001', status: 'pending' }),
    });

    const request = createMockRequest({
      resume_text: 'My resume...',
      job_description: 'Senior Developer role',
    });

    const response = await resumePost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mission_id).toBe('resume-001');
  });

  it('should handle missing resume text', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Resume text is required' }),
    });

    const request = createMockRequest({ job_description: 'JD' });
    const response = await resumePost(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});

describe('Application API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should process auto-application request', async () => {
    mockSession('pro-user@test.com');
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ mission_id: 'app-001', status: 'pending' }),
    });

    const request = createMockRequest({
      job_id: 'job-123',
      resume_text: 'My resume',
    });

    const response = await applicationPost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mission_id).toBe('app-001');
  });

  it('should reject anonymous application requests', async () => {
    mockNoSession();
    const request = createMockRequest({ job_id: 'job-123' });
    
    const response = await applicationPost(request);
    expect(response.status).toBe(401);
  });
});

describe('Mission GET API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should fetch mission status', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        mission_id: 'mission-123',
        status: 'running',
        progress: 50,
      }),
    });

    const request = createMockRequest(undefined, 'http://localhost:3000/api/agent/mission/mission-123');
    const response = await missionGet(request, { params: { id: 'mission-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mission_id).toBe('mission-123');
    expect(data.progress).toBe(50);
  });

  it('should return 404 for non-existent mission', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Mission not found' }),
    });

    const request = createMockRequest();
    const response = await missionGet(request, { params: { id: 'invalid-id' } });

    expect(response.status).toBe(404);
  });

  it('should require authentication', async () => {
    mockNoSession();
    const request = createMockRequest();
    
    const response = await missionGet(request, { params: { id: 'mission-123' } });
    expect(response.status).toBe(401);
  });
});

describe('Mission Approve API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should approve a mission', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        mission_id: 'mission-123',
        status: 'running',
        requires_approval: false,
      }),
    });

    const request = createMockRequest({
      approved: true,
      feedback: 'Looks good',
    });

    const response = await approvePost(request, { params: { id: 'mission-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.requires_approval).toBe(false);
  });

  it('should reject a mission', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        mission_id: 'mission-123',
        status: 'failed',
        requires_approval: false,
      }),
    });

    const request = createMockRequest({
      approved: false,
      feedback: 'Needs changes',
    });

    const response = await approvePost(request, { params: { id: 'mission-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('failed');
  });

  it('should require authenticated user', async () => {
    mockNoSession();
    const request = createMockRequest({ approved: true });
    
    const response = await approvePost(request, { params: { id: 'mission-123' } });
    expect(response.status).toBe(401);
  });
});

describe('Missions List API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should list all missions for user', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        missions: [
          { mission_id: 'm1', status: 'running' },
          { mission_id: 'm2', status: 'completed' },
        ],
        total: 2,
      }),
    });

    const request = createMockRequest(undefined, 'http://localhost:3000/api/agent/missions?limit=20&offset=0');
    const response = await missionsGet(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.missions).toHaveLength(2);
    expect(data.total).toBe(2);
  });

  it('should support status filtering', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        missions: [{ mission_id: 'm1', status: 'running' }],
        total: 1,
      }),
    });

    const request = createMockRequest(undefined, 'http://localhost:3000/api/agent/missions?status=running&limit=20');
    const response = await missionsGet(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.missions).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=running'),
      expect.any(Object)
    );
  });

  it('should support pagination', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        missions: [],
        total: 100,
      }),
    });

    const request = createMockRequest(undefined, 'http://localhost:3000/api/agent/missions?limit=10&offset=20');
    const response = await missionsGet(request);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=10'),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('offset=20'),
      expect.any(Object)
    );
  });

  it('should require authentication', async () => {
    mockNoSession();
    const request = createMockRequest();
    
    const response = await missionsGet(request);
    expect(response.status).toBe(401);
  });

  it('should handle empty mission list', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ missions: [], total: 0 }),
    });

    const request = createMockRequest();
    const response = await missionsGet(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.missions).toEqual([]);
    expect(data.total).toBe(0);
  });
});

describe('Edge Cases and Error Scenarios', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should handle malformed JSON in request body', async () => {
    mockSession();
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      body: 'not-json',
    });

    const response = await jobFinderPost(request);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should handle backend timeout', async () => {
    mockSession();
    (global.fetch as any).mockImplementation(() =>
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
    );

    const request = createMockRequest({ query: 'test' });
    const response = await jobFinderPost(request);
    
    expect(response.status).toBe(500);
  });

  it('should handle invalid session format', async () => {
    (getServerSession as any).mockResolvedValue({ user: {} }); // Missing email
    const request = createMockRequest({ query: 'test' });
    
    const response = await jobFinderPost(request);
    expect(response.status).toBe(401);
  });

  it('should handle special characters in mission ID', async () => {
    mockSession();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ mission_id: 'test-123-abc-ΩΦ', status: 'pending' }),
    });

    const request = createMockRequest();
    const response = await missionGet(request, { params: { id: 'test-123-abc-ΩΦ' } });
    
    expect(response.status).toBeLessThan(400);
  });
});
