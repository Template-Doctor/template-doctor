import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import { genericWorkflowRouter } from '../generic-workflow';
import * as workflowService from '../../services/workflow-service';
import { getAllWorkflowConfigs } from '../../services/workflow-config-loader';

// Note: This test file requires 'supertest' package for API testing
// Install with: npm install -D supertest @types/supertest

// Mock dependencies
vi.mock('../../services/workflow-service');
vi.mock('../../services/workflow-config-loader');
vi.mock('../../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { login: 'testuser', id: 123 };
    next();
  },
}));

// TODO: Install supertest package to enable these API tests
// npm install -D supertest @types/supertest
describe.skip('Generic Workflow API (requires supertest)', () => {
  let app: Express;
  let mockWorkflowService: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v4', genericWorkflowRouter);

    mockWorkflowService = {
      triggerWorkflow: vi.fn(),
      getWorkflowRun: vi.fn(),
      cancelWorkflow: vi.fn(),
      downloadArtifact: vi.fn(),
      getJobLogs: vi.fn(),
    };

    (WorkflowService as any).mockImplementation(() => mockWorkflowService);

    (loadWorkflowConfigs as any).mockResolvedValue([
      {
        id: 'test-workflow',
        name: 'Test Workflow',
        workflowFile: 'test.yml',
        streamLogs: true,
        customParser: 'json',
      },
    ]);
  });

  describe('GET /api/v4/workflows', () => {
    it('should return list of workflow configurations', async () => {
      const response = await request(app).get('/api/v4/workflows');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: 'test-workflow',
          name: 'Test Workflow',
          workflowFile: 'test.yml',
          streamLogs: true,
          customParser: 'json',
        },
      ]);
    });

    it('should return 500 if loading configs fails', async () => {
      (loadWorkflowConfigs as any).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/v4/workflows');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v4/workflows/:id', () => {
    it('should return specific workflow configuration', async () => {
      const response = await request(app).get('/api/v4/workflows/test-workflow');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 'test-workflow',
        name: 'Test Workflow',
      });
    });

    it('should return 404 if workflow not found', async () => {
      const response = await request(app).get('/api/v4/workflows/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Workflow nonexistent not found');
    });
  });

  describe('POST /api/v4/workflow-execute', () => {
    it('should trigger workflow execution', async () => {
      mockWorkflowService.triggerWorkflow.mockResolvedValue(undefined);
      mockWorkflowService.getWorkflowRun.mockResolvedValue({
        id: 123456,
        status: 'queued',
        conclusion: null,
        html_url: 'https://github.com/owner/repo/actions/runs/123456',
      });

      const response = await request(app)
        .post('/api/v4/workflow-execute')
        .send({
          workflowId: 'test-workflow',
          owner: 'testowner',
          repo: 'testrepo',
          inputs: {
            target_url: 'https://github.com/testowner/testrepo',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        workflowId: 'test-workflow',
        status: 'queued',
      });
      expect(mockWorkflowService.triggerWorkflow).toHaveBeenCalled();
    });

    it('should return 400 if required fields missing', async () => {
      const response = await request(app)
        .post('/api/v4/workflow-execute')
        .send({
          workflowId: 'test-workflow',
          // Missing owner and repo
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 if workflow config not found', async () => {
      const response = await request(app)
        .post('/api/v4/workflow-execute')
        .send({
          workflowId: 'nonexistent',
          owner: 'testowner',
          repo: 'testrepo',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle workflow trigger errors', async () => {
      mockWorkflowService.triggerWorkflow.mockRejectedValue(
        new Error('GitHub API error')
      );

      const response = await request(app)
        .post('/api/v4/workflow-execute')
        .send({
          workflowId: 'test-workflow',
          owner: 'testowner',
          repo: 'testrepo',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v4/workflow-status', () => {
    it('should return workflow run status', async () => {
      mockWorkflowService.getWorkflowRun.mockResolvedValue({
        id: 123456,
        status: 'completed',
        conclusion: 'success',
        html_url: 'https://github.com/owner/repo/actions/runs/123456',
      });

      mockWorkflowService.getJobLogs.mockResolvedValue([
        {
          id: 1,
          name: 'Build',
          status: 'completed',
          conclusion: 'success',
        },
      ]);

      const response = await request(app)
        .get('/api/v4/workflow-status')
        .query({
          workflowId: 'test-workflow',
          owner: 'testowner',
          repo: 'testrepo',
          runId: 'test-run-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'completed',
        conclusion: 'success',
        jobs: expect.any(Array),
      });
    });

    it('should return 404 if workflow run not found', async () => {
      mockWorkflowService.getWorkflowRun.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v4/workflow-status')
        .query({
          workflowId: 'test-workflow',
          owner: 'testowner',
          repo: 'testrepo',
          runId: 'nonexistent',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should include artifacts when workflow completed', async () => {
      mockWorkflowService.getWorkflowRun.mockResolvedValue({
        id: 123456,
        status: 'completed',
        conclusion: 'success',
        html_url: 'https://github.com/owner/repo/actions/runs/123456',
      });

      mockWorkflowService.downloadArtifact.mockResolvedValue(
        Buffer.from(JSON.stringify({ result: 'success' }))
      );

      const response = await request(app)
        .get('/api/v4/workflow-status')
        .query({
          workflowId: 'test-workflow',
          owner: 'testowner',
          repo: 'testrepo',
          runId: 'test-run-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result');
    });
  });

  describe('POST /api/v4/workflow-cancel', () => {
    it('should cancel running workflow', async () => {
      mockWorkflowService.getWorkflowRun.mockResolvedValue({
        id: 123456,
        status: 'in_progress',
      });

      mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v4/workflow-cancel')
        .send({
          workflowId: 'test-workflow',
          owner: 'testowner',
          repo: 'testrepo',
          runId: 'test-run-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Workflow cancelled',
      });
      expect(mockWorkflowService.cancelWorkflow).toHaveBeenCalledWith(
        'testowner',
        'testrepo',
        123456
      );
    });

    it('should return 404 if workflow run not found', async () => {
      mockWorkflowService.getWorkflowRun.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v4/workflow-cancel')
        .send({
          workflowId: 'test-workflow',
          owner: 'testowner',
          repo: 'testrepo',
          runId: 'nonexistent',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle cancellation errors', async () => {
      mockWorkflowService.getWorkflowRun.mockResolvedValue({
        id: 123456,
        status: 'in_progress',
      });

      mockWorkflowService.cancelWorkflow.mockRejectedValue(
        new Error('Already completed')
      );

      const response = await request(app)
        .post('/api/v4/workflow-cancel')
        .send({
          workflowId: 'test-workflow',
          owner: 'testowner',
          repo: 'testrepo',
          runId: 'test-run-123',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
