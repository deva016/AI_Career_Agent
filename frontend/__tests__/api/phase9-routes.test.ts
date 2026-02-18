/**
 * Phase 9 API Routes - Comprehensive Test Suite
 * 
 * Tests for /api/applications, /api/linkedin, /api/artifacts, /api/settings
 * Covering edge cases, error handling, and corner cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Applications routes
import { GET as GET_APPS, POST as POST_APP } from '@/app/api/applications/route';
import { GET as GET_APP_BY_ID, PATCH as PATCH_APP } from '@/app/api/applications/[id]/route';

// LinkedIn routes
import { GET as GET_LINKEDIN, POST as POST_LINKEDIN } from '@/app/api/linkedin/route';
import { PATCH as PATCH_LINKEDIN, DELETE as DELETE_LINKEDIN } from '@/app/api/linkedin/[id]/route';

// Artifacts routes
import { GET as GET_ARTIFACTS } from '@/app/api/artifacts/route';
import { GET as GET_ARTIFACT_BY_ID } from '@/app/api/artifacts/[id]/route';

// Settings routes
import { GET as GET_SETTINGS, PATCH as PATCH_SETTINGS, POST as POST_KB } from '@/app/api/settings/route';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

const { getServerSession } = await import('next-auth');

describe('Applications API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('GET /api/applications', () => {
    it('should return 401 for unauthenticated users', async () => {
      (getServerSession as any).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/applications');
      const response = await GET_APPS(request);
      expect(response.status).toBe(401);
    });

    it('should list applications with filtering', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ applications: [] }),
      });

      const request = new NextRequest('http://localhost:3000/api/applications?status=submitted&limit=20');
      const response = await GET_APPS(request);
      
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=submitted'),
        expect.any(Object)
      );
    });

    it('should handle pagination parameters', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ applications: [], total: 100 }),
      });

      const request = new NextRequest('http://localhost:3000/api/applications?limit=10&offset=20');
      await GET_APPS(request);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=20'),
        expect.any(Object)
      );
    });
  });

  describe('POST /api/applications', () => {
    it('should create application successfully', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      const mockApp = { id: 'app-123', job_id: 'job-123', status: 'draft' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockApp,
      });

      const request = new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: JSON.stringify({ job_id: 'job-123' }),
      });
      const response = await POST_APP(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('app-123');
    });

    it('should handle validation errors', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'job_id is required' }),
      });

      const request = new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST_APP(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toContain('job_id');
    });
  });

  describe('PATCH /api/applications/[id]', () => {
    it('should update application status', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'app-123', status: 'submitted' }),
      });

      const request = new NextRequest('http://localhost:3000/api/applications/app-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'submitted' }),
      });
      const response = await PATCH_APP(request, { params: Promise.resolve({ id: 'app-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('submitted');
    });

    it('should handle invalid status transitions', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid status transition' }),
      });

      const request = new NextRequest('http://localhost:3000/api/applications/app-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'invalid' }),
      });
      const response = await PATCH_APP(request, { params: Promise.resolve({ id: 'app-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid status');
    });
  });
});

describe('LinkedIn API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('GET /api/linkedin', () => {
    it('should list posts with status filter', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ posts: [] }),
      });

      const request = new NextRequest('http://localhost:3000/api/linkedin?status=published');
      const response = await GET_LINKEDIN(request);
      
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=published'),
        expect.any(Object)
      );
    });

    it('should default to draft status', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ posts: [] }),
      });

      const request = new NextRequest('http://localhost:3000/api/linkedin');
      await GET_LINKEDIN(request);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=draft'),
        expect.any(Object)
      );
    });
  });

  describe('POST /api/linkedin (Generate)', () => {
    it('should generate LinkedIn post', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      const mockPost = { id: 'post-123', content: 'Test post', status: 'draft' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPost,
      });

      const request = new NextRequest('http://localhost:3000/api/linkedin', {
        method: 'POST',
        body: JSON.stringify({ topic: 'career growth', tone: 'professional' }),
      });
      const response = await POST_LINKEDIN(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('post-123');
    });

    it('should handle generation errors', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'LLM service unavailable' }),
      });

      const request = new NextRequest('http://localhost:3000/api/linkedin', {
        method: 'POST',
        body: JSON.stringify({ topic: 'test' }),
      });
      const response = await POST_LINKEDIN(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('LLM service');
    });
  });

  describe('DELETE /api/linkedin/[id]', () => {
    it('should delete post successfully', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const request = new NextRequest('http://localhost:3000/api/linkedin/post-123', {
        method: 'DELETE',
      });
      const response = await DELETE_LINKEDIN(request, { params: Promise.resolve({ id: 'post-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle deletion of published post', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Cannot delete published posts' }),
      });

      const request = new NextRequest('http://localhost:3000/api/linkedin/post-123', {
        method: 'DELETE',
      });
      const response = await DELETE_LINKEDIN(request, { params: Promise.resolve({ id: 'post-123' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Cannot delete');
    });
  });
});

describe('Artifacts API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('GET /api/artifacts', () => {
    it('should list artifacts with filters', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ artifacts: [] }),
      });

      const request = new NextRequest('http://localhost:3000/api/artifacts?type=resume&mission_id=m123');
      const response = await GET_ARTIFACTS(request);
      
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=resume'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('mission_id=m123'),
        expect.any(Object)
      );
    });
  });

  describe('GET /api/artifacts/[id] (Download)', () => {
    it('should stream file download', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      
      const mockContent = 'file content';
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(mockContent));
          controller.close();
        },
      });

      const mockResponse = {
        ok: true,
        body: mockStream,
        headers: new Headers({
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="resume.pdf"',
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/artifacts/artifact-123');
      const response = await GET_ARTIFACT_BY_ID(request, { params: Promise.resolve({ id: 'artifact-123' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/pdf');
      expect(response.headers.get('content-disposition')).toContain('resume.pdf');
    });

    it('should handle missing artifact', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Artifact not found' }),
      });

      const request = new NextRequest('http://localhost:3000/api/artifacts/invalid');
      const response = await GET_ARTIFACT_BY_ID(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });
});

describe('Settings API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('GET /api/settings', () => {
    it('should fetch user settings', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      const mockSettings = {
        target_roles: ['Software Engineer'],
        target_locations: ['Remote'],
        model_mode: 'fast',
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockSettings,
      });

      const request = new NextRequest('http://localhost:3000/api/settings');
      const response = await GET_SETTINGS(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.target_roles).toBeDefined();
    });
  });

  describe('PATCH /api/settings', () => {
    it('should update settings', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      const updatedSettings = {
        target_roles: ['Senior Engineer', 'Tech Lead'],
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => updatedSettings,
      });

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ target_roles: ['Senior Engineer', 'Tech Lead'] }),
      });
      const response = await PATCH_SETTINGS(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.target_roles).toHaveLength(2);
    });

    it('should validate settings fields', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'Invalid model_mode value' }),
      });

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ model_mode: 'invalid' }),
      });
      const response = await PATCH_SETTINGS(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toContain('Invalid');
    });
  });

  describe('POST /api/settings (Update KB)', () => {
    it('should update knowledge base', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      const kbUpdate = {
        question: 'Years of experience?',
        answer: '5 years',
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify(kbUpdate),
      });
      const response = await POST_KB(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle KB validation errors', async () => {
      (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Both question and answer required' }),
      });

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        body: JSON.stringify({ question: 'Test?' }),
      });
      const response = await POST_KB(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });
});

describe('Cross-Route Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should handle backend timeout uniformly', async () => {
    (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
    (global.fetch as any).mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );

    const routes = [
      GET_APPS(new NextRequest('http://localhost:3000/api/applications')),
      GET_LINKEDIN(new NextRequest('http://localhost:3000/api/linkedin')),
      GET_ARTIFACTS(new NextRequest('http://localhost:3000/api/artifacts')),
      GET_SETTINGS(new NextRequest('http://localhost:3000/api/settings')),
    ];

    const responses = await Promise.all(routes);
    
    responses.forEach(response => {
      expect(response.status).toBe(500);
    });
  });

  it('should handle rate limiting uniformly', async () => {
    (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ detail: 'Rate limit exceeded' }),
    });

    const request = new NextRequest('http://localhost:3000/api/applications');
    const response = await GET_APPS(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Rate limit');
  });

  it('should handle malformed JSON in request body', async () => {
    (getServerSession as any).mockResolvedValue({ user: { email: 'test@example.com' } });

    // Create request with invalid JSON
    const request = new NextRequest('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{',
    });

    // The route catches the JSON parse error and returns 500
    const response = await POST_APP(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
