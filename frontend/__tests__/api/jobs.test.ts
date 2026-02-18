/**
 * Jobs API Route Tests
 * 
 * Tests for /api/jobs endpoints covering:
 * - Authentication
 * - List/search jobs
 * - Create job
 * - Get specific job
 * - Delete job
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/jobs/route';
import { GET as GET_BY_ID, DELETE } from '@/app/api/jobs/[id]/route';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock auth config
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

const { getServerSession } = await import('next-auth');

describe('Jobs API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('GET /api/jobs', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should fetch jobs successfully with default params', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0 }),
      });

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ jobs: [], total: 0 });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });

    it('should handle status filter parameter', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0 }),
      });

      const request = new NextRequest('http://localhost:3000/api/jobs?status=active&limit=10');
      const response = await GET(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
    });

    it('should handle backend service errors', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Database error' }),
      });

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });

    it('should handle network failures', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle malformed backend responses', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Unknown error');
    });
  });

  describe('POST /api/jobs', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Job' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should create job successfully', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      const mockJob = { id: 'job-123', title: 'Software Engineer' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockJob,
      });

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify({ title: 'Software Engineer' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockJob);
    });

    it('should handle validation errors', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'Missing required field: title' }),
      });

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toContain('Missing required field');
    });
  });

  describe('GET /api/jobs/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/jobs/job-123');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'job-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should fetch job by ID successfully', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      const mockJob = { id: 'job-123', title: 'Software Engineer' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockJob,
      });

      const request = new NextRequest('http://localhost:3000/api/jobs/job-123');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'job-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockJob);
    });

    it('should handle job not found', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Job not found' }),
      });

      const request = new NextRequest('http://localhost:3000/api/jobs/invalid-id');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Job not found');
    });

    it('should handle invalid ID format', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid ID format' }),
      });

      const request = new NextRequest('http://localhost:3000/api/jobs/@@invalid@@');
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: '@@invalid@@' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid ID format');
    });
  });

  describe('DELETE /api/jobs/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/jobs/job-123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'job-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should delete job successfully', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const request = new NextRequest('http://localhost:3000/api/jobs/job-123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'job-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle deletion of non-existent job', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Job not found' }),
      });

      const request = new NextRequest('http://localhost:3000/api/jobs/invalid-id', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Job not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long query parameters', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0 }),
      });

      const longStatus = 'a'.repeat(10000);
      const request = new NextRequest(`http://localhost:3000/api/jobs?status=${longStatus}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should handle special characters in parameters', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0 }),
      });

      const request = new NextRequest('http://localhost:3000/api/jobs?status=%20%3C%3E%26');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should handle concurrent requests', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0 }),
      });

      const requests = Array(10).fill(null).map(() => 
        GET(new NextRequest('http://localhost:3000/api/jobs'))
      );

      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
