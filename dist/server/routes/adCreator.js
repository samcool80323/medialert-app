"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adCreatorRouter = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const init_1 = require("../database/init");
const complianceAnalyzer_1 = require("../services/complianceAnalyzer");
exports.adCreatorRouter = express_1.default.Router();
// Validation schemas
const checkComplianceSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Content cannot be empty').max(10000, 'Content too long'),
    sessionId: zod_1.z.string().min(1, 'Session ID required'),
});
// Check ad content for compliance
exports.adCreatorRouter.post('/check', async (req, res) => {
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
        const analyzer = new complianceAnalyzer_1.ComplianceAnalyzer();
        const violations = await analyzer.analyzeAdContent(content);
        // Generate compliant version
        const compliantContent = await analyzer.generateCompliantContent(content, violations);
        // Save draft to database
        const result = await (0, init_1.dbRun)(`INSERT INTO ad_drafts (session_id, original_content, compliant_content, violations_detected, status) VALUES ($1, $2, $3, $4, $5)`, [sessionId, content, compliantContent, JSON.stringify(violations), 'checked']);
        const draft = {
            id: result.lastID,
            sessionId,
            originalContent: content,
            compliantContent,
            violationsDetected: violations,
            status: 'checked',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        };
        const response = {
            draft,
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error checking compliance:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to check compliance',
        });
    }
});
// Get drafts by session
exports.adCreatorRouter.get('/session/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const drafts = await (0, init_1.dbAll)(`SELECT * FROM ad_drafts
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT 10`, [sessionId]);
        const formattedDrafts = drafts.map(draft => ({
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
    }
    catch (error) {
        console.error('Error getting drafts:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve drafts',
        });
    }
});
// Get specific draft
exports.adCreatorRouter.get('/:draftId', async (req, res) => {
    try {
        const draftId = parseInt(req.params.draftId);
        if (isNaN(draftId)) {
            return res.status(400).json({
                error: 'Invalid Draft ID',
                message: 'Draft ID must be a number',
            });
        }
        const draft = await (0, init_1.dbGet)('SELECT * FROM ad_drafts WHERE id = $1', [draftId]);
        if (!draft) {
            return res.status(404).json({
                error: 'Draft Not Found',
                message: 'No draft found with the provided ID',
            });
        }
        const formattedDraft = {
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
    }
    catch (error) {
        console.error('Error getting draft:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve draft',
        });
    }
});
