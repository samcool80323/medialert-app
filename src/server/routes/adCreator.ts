import express from 'express';
import { z } from 'zod';
import { dbRun, dbGet, dbAll } from '../database/init';
import { ComplianceAnalyzer } from '../services/complianceAnalyzer';
import { CheckComplianceRequest, CheckComplianceResponse, AdDraft } from '../../shared/types';

export const adCreatorRouter = express.Router();

// Validation schemas
const checkComplianceSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(10000, 'Content too long'),
  sessionId: z.string().min(1, 'Session ID required'),
});

// Check ad content for compliance
adCreatorRouter.post('/check', async (req, res) => {
  try {
    // Validate request
    const validation = checkComplianceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { content, sessionId } = validation.data;

    // Analyze content with AI
    const analyzer = new ComplianceAnalyzer();
    const violations = await analyzer.analyzeAdContent(content);

    // Generate compliant version
    const compliantContent = await analyzer.generateCompliantContent(content, violations);

    // Save draft to database
    const result = await dbRun(
      `INSERT INTO ad_drafts (session_id, original_content, compliant_content, violations_detected, status) VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, content, compliantContent, JSON.stringify(violations), 'checked']
    );

    const draft: AdDraft = {
      id: result.lastID,
      sessionId,
      originalContent: content,
      compliantContent,
      violationsDetected: violations,
      status: 'checked',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    const response: CheckComplianceResponse = {
      draft,
    };

    res.json(response);
  } catch (error) {
    console.error('Error checking compliance:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check compliance',
    });
  }
});

// Get drafts by session
adCreatorRouter.get('/session/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    const drafts = await dbAll(
      `SELECT * FROM ad_drafts
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [sessionId]
    );

    const formattedDrafts: AdDraft[] = drafts.map(draft => ({
      id: draft.id,
      sessionId: draft.session_id,
      originalContent: draft.original_content,
      compliantContent: draft.compliant_content,
      violationsDetected: JSON.parse(draft.violations_detected || '[]'),
      status: draft.status,
      createdAt: draft.created_at,
      expiresAt: draft.expires_at,
    }));

    res.json({ drafts: formattedDrafts });
  } catch (error) {
    console.error('Error getting drafts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve drafts',
    });
  }
});

// Get specific draft
adCreatorRouter.get('/:draftId', async (req, res) => {
  try {
    const draftId = parseInt(req.params.draftId);
    if (isNaN(draftId)) {
      return res.status(400).json({
        error: 'Invalid Draft ID',
        message: 'Draft ID must be a number',
      });
    }

    const draft = await dbGet(
      'SELECT * FROM ad_drafts WHERE id = $1',
      [draftId]
    );

    if (!draft) {
      return res.status(404).json({
        error: 'Draft Not Found',
        message: 'No draft found with the provided ID',
      });
    }

    const formattedDraft: AdDraft = {
      id: draft.id,
      sessionId: draft.session_id,
      originalContent: draft.original_content,
      compliantContent: draft.compliant_content,
      violationsDetected: JSON.parse(draft.violations_detected || '[]'),
      status: draft.status,
      createdAt: draft.created_at,
      expiresAt: draft.expires_at,
    };

    res.json({ draft: formattedDraft });
  } catch (error) {
    console.error('Error getting draft:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve draft',
    });
  }
});