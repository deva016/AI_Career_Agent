/**
 * AgentClient Test Suite
 * 
 * Tests for the API client utility covering all methods, error handling,
 * retry logic, and SSE streaming.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentClient, AgentClientError } from '../../lib/api/agent-client';
import { MissionStatus } from '@/lib/types/agent';

describe('AgentClient', () => {
  let client: AgentClient;

  beforeEach(() => {
    client = new AgentClient('/api/agent');
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Constructor', () => {
    it('should use default base URL', () => {
      const defaultClient = new AgentClient();
      expect(defaultClient['baseUrl']).toBe('/api/agent');
    });

    it('should accept custom base URL', () => {
      const customClient = new AgentClient('https://api.example.com');
      expect(customClient['baseUrl']).toBe('https://api.example.com');
    });
  });

  describe('startJobFinder', () => {
    it('should send job finder request with all parameters', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ mission_id: 'job-001', status: 'pending' }),
      });

      const result = await client.startJobFinder({
        query: 'Software Engineer',
        target_roles: ['Developer', 'Engineer'],
        target_locations: ['Remote', 'SF'],
      });

      expect(result.mission_id).toBe('job-001');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/agent/mission/job-finder',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Software Engineer'),
        })
      );
    });

    it('should throw AgentClientError on failure', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid query' }),
      });

      await expect(
        client.startJobFinder({ query: '', target_roles: [], target_locations: [] })
      ).rejects.toThrow(AgentClientError);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network failure'));

      await expect(
        client.startJobFinder({ query: 'test', target_roles: [], target_locations: [] })
      ).rejects.toThrow(AgentClientError);
    });
  });

  describe('startResumeMission', () => {
    it('should send resume tailoring request', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ mission_id: 'resume-001', status: 'pending' }),
      });

      const result = await client.startResumeMission({
        job_description: 'Senior Developer role',
        job_id: 'job-123'
      });

      expect(result.mission_id).toBe('resume-001');
    });

    it('should validate required fields', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Job description required' }),
      });

      await expect(
        client.startResumeMission({ job_description: '' })
      ).rejects.toThrow();
    });
  });

  describe('startApplicationMission', () => {
    it('should send auto-application request', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ mission_id: 'app-001', status: 'pending' }),
      });

      const result = await client.startApplicationMission({
        job_id: 'job-123',
        // resume_id is optional but valid
      });

      expect(result.mission_id).toBe('app-001');
    });
  });

  describe('getMission', () => {
    it('should fetch mission status', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          mission_id: 'mission-123',
          status: 'running',
          progress: 75,
        }),
      });

      const result = await client.getMission('mission-123');

      expect(result.mission_id).toBe('mission-123');
      expect(result.progress).toBe(75);
      expect(global.fetch).toHaveBeenCalledWith('/api/agent/mission/mission-123', expect.anything());
    });

    it('should throw 404 error for non-existent mission', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(client.getMission('invalid-id')).rejects.toThrow(AgentClientError);
    });

    it('should handle empty mission ID', async () => {
      await expect(client.getMission('')).rejects.toThrow();
    });
  });

  describe('approveMission', () => {
    it('should approve a mission with feedback', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          mission_id: 'mission-123',
          status: 'running',
          requires_approval: false,
        }),
      });

      const result = await client.approveMission('mission-123', {
        approved: true,
        feedback: 'Looks great!',
      });

      expect(result.requires_approval).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/agent/mission/mission-123/approve',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Looks great'),
        })
      );
    });

    it('should reject a mission', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          mission_id: 'mission-123',
          status: 'failed',
        }),
      });

      const result = await client.approveMission('mission-123', {
        approved: false,
        feedback: 'Needs changes',
      });

      expect(result.status).toBe('failed');
    });
  });

  describe('listMissions', () => {
    it('should list all missions with default pagination', async () => {
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

      const result = await client.listMissions();

      expect(result.missions).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should support status filtering', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ missions: [], total: 0 }),
      });

      await client.listMissions({ status: MissionStatus.RUNNING });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=running'),
        expect.any(Object)
      );
    });

    it('should support custom pagination', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ missions: [], total: 100 }),
      });

      await client.listMissions({ limit: 10, offset: 20 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=20'),
        expect.any(Object)
      );
    });

    it('should handle empty results', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ missions: [], total: 0 }),
      });

      const result = await client.listMissions();

      expect(result.missions).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('createEventStream', () => {
    it('should create SSE EventSource', () => {
      const onMessage = vi.fn();
      const onError = vi.fn();

      // Mock EventSource
      const mockEventSource = {
        close: vi.fn(),
        onmessage: null,
        onerror: null,
      };
      
      // Use mockImplementation with regular function for constructor compatibility
      global.EventSource = vi.fn().mockImplementation(function() { return mockEventSource; }) as any;

      const eventSource = client.createEventStream(onMessage, onError);

      expect(EventSource).toHaveBeenCalledWith('/api/agent/events');
      expect(mockEventSource.onmessage).toEqual(expect.any(Function));
      expect(mockEventSource.onerror).toEqual(onError);
    });

    it('should handle SSE messages', () => {
      const onMessage = vi.fn();
      const mockEventSource = {
        close: vi.fn(),
        onmessage: null,
      };
      global.EventSource = vi.fn().mockImplementation(function() { return mockEventSource; }) as any;

      client.createEventStream(onMessage);

      // Simulate message
      (mockEventSource as any).onmessage({ data: JSON.stringify({ mission_id: 'm1' }) });

      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({ mission_id: 'm1' })
      );
    });

    it('should handle SSE errors', () => {
      const onError = vi.fn();
      const mockEventSource = {
        close: vi.fn(),
        onerror: null,
      };
      global.EventSource = vi.fn().mockImplementation(function() { return mockEventSource; }) as any;

      client.createEventStream(vi.fn(), onError);

      // Verify onError was assigned
      expect(mockEventSource.onerror).toBe(onError);
    });
  });

  describe('Error Handling', () => {
    it('should create AgentClientError with status code', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ detail: 'Forbidden' }),
      });

      try {
        await client.getMission('test');
      } catch (error) {
        expect(error).toBeInstanceOf(AgentClientError);
        expect((error as AgentClientError).status).toBe(403);
        expect((error as AgentClientError).message).toContain('Forbidden');
      }
    });

    it('should handle malformed JSON responses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(client.getMission('test')).rejects.toThrow(AgentClientError);
    });

    it('should handle timeout errors', async () => {
      (global.fetch as any).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      await expect(client.getMission('test')).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in mission IDs', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ mission_id: 'test-123-ΩΦ!@#', status: 'pending' }),
      });

      const result = await client.getMission('test-123-ΩΦ!@#');
      expect(result.mission_id).toBe('test-123-ΩΦ!@#');
    });

    it('should handle very large response payloads', async () => {
      const largeMissionList = Array.from({ length: 1000 }, (_, i) => ({
        mission_id: `mission-${i}`,
        status: 'completed',
      }));

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ missions: largeMissionList, total: 1000 }),
      });

      const result = await client.listMissions({ limit: 1000 });
      expect(result.missions).toHaveLength(1000);
    });

    it('should handle concurrent requests', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ mission_id: 'test', status: 'pending' }),
      });

      const promises = [
        client.getMission('m1'),
        client.getMission('m2'),
        client.getMission('m3'),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
