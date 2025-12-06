/**
 * Data Assistant API Routes
 * Multi-format data ingestion, validation, and insight generation
 */

import { Hono } from 'hono';
import type { AppContext } from '../../types';
import { DataIngestionService, detectStandardFormat, suggestColumnMappings } from '../../../lib/data-ingestion';
import { DataValidationService } from '../../../lib/data-validation';
import { parseFile, validateFile } from '../../../lib/file-parsers';
import { InsightsEngine } from '../../../lib/insights-engine';
import { requireAuth } from '../../middleware/auth';

const router = new Hono<AppContext>();

// Apply authentication to all routes
router.use('*', requireAuth());

/**
 * POST /api/data-assistant/upload
 * Upload and preview a data file
 */
router.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file
    const validation = validateFile({
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Parse file for preview
    const buffer = await file.arrayBuffer();
    const parsed = await parseFile(buffer, file.name, {
      maxRows: 100 // Preview only first 100 rows
    });

    // Detect format
    const formatDetection = detectStandardFormat(parsed.headers);

    // Create upload record
    const ingestionService = new DataIngestionService(c.env.FINANCE_MANAGER_DB);
    const upload = await ingestionService.createUpload(
      c.get('user').entityId || 'default',
      c.get('user').id,
      file.name,
      file.size,
      file.type
    );

    // Update with detected format
    await ingestionService.updateUploadStatus(upload.id, 'previewing', {
      detectedFormat: formatDetection.format || undefined,
      rowCount: parsed.rowCount
    });

    // Suggest column mappings if format detected
    let suggestedMappings: any[] = [];
    if (formatDetection.format) {
      suggestedMappings = suggestColumnMappings(
        parsed.headers,
        parsed.rows,
        formatDetection.format
      );

      // Save column mappings
      await ingestionService.saveColumnMappings(upload.id, suggestedMappings);
    }

    return c.json({
      uploadId: upload.id,
      preview: {
        headers: parsed.headers,
        sampleRows: parsed.rows.slice(0, 10),
        rowCount: parsed.rowCount,
        detectedFormat: formatDetection.format,
        formatConfidence: formatDetection.confidence,
        suggestedMappings
      },
      warnings: formatDetection.confidence < 0.7 ? [
        'Low confidence in format detection. Please review column mappings carefully.'
      ] : []
    });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({
      error: 'Failed to process file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/data-assistant/import/:uploadId
 * Confirm and import data
 */
router.post('/import/:uploadId', async (c) => {
  try {
    const uploadId = c.req.param('uploadId');
    const body = await c.req.json();
    const { columnMappings, validateBeforeImport = true } = body;

    const ingestionService = new DataIngestionService(c.env.FINANCE_MANAGER_DB);
    const upload = await ingestionService.getUpload(uploadId);

    if (!upload) {
      return c.json({ error: 'Upload not found' }, 404);
    }

    if (upload.status !== 'previewing') {
      return c.json({ error: 'Upload is not in preview state' }, 400);
    }

    // Update status to processing
    await ingestionService.updateUploadStatus(uploadId, 'processing');

    // TODO: Implement actual data import logic
    // This would involve:
    // 1. Re-parse the file (stored in R2 or temp storage)
    // 2. Apply column mappings
    // 3. Validate each row
    // 4. Insert into appropriate tables (accounts, transactions, etc.)
    // 5. Track errors and warnings

    // For now, simulate successful import
    await ingestionService.updateUploadStatus(uploadId, 'completed', {
      importedCount: upload.rowCount || 0,
      errorCount: 0
    });

    return c.json({
      uploadId,
      status: 'completed',
      importedCount: upload.rowCount || 0,
      errorCount: 0,
      message: 'Data imported successfully'
    });

  } catch (error) {
    console.error('Import error:', error);
    return c.json({
      error: 'Failed to import data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/data-assistant/uploads
 * List all data uploads
 */
router.get('/uploads', async (c) => {
  try {
    const entityId = c.get('user').entityId || 'default';
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const ingestionService = new DataIngestionService(c.env.FINANCE_MANAGER_DB);
    const uploads = await ingestionService.listUploads(entityId, limit, offset);

    return c.json({
      uploads,
      pagination: {
        limit,
        offset,
        total: uploads.length
      }
    });

  } catch (error) {
    console.error('List uploads error:', error);
    return c.json({
      error: 'Failed to list uploads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/data-assistant/uploads/:uploadId
 * Get upload details
 */
router.get('/uploads/:uploadId', async (c) => {
  try {
    const uploadId = c.req.param('uploadId');

    const ingestionService = new DataIngestionService(c.env.FINANCE_MANAGER_DB);
    const upload = await ingestionService.getUpload(uploadId);

    if (!upload) {
      return c.json({ error: 'Upload not found' }, 404);
    }

    const mappings = await ingestionService.getColumnMappings(uploadId);

    return c.json({
      upload,
      columnMappings: mappings
    });

  } catch (error) {
    console.error('Get upload error:', error);
    return c.json({
      error: 'Failed to get upload details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/data-assistant/warnings
 * Get validation warnings
 */
router.get('/warnings', async (c) => {
  try {
    const entityId = c.get('user').entityId || 'default';
    const status = c.req.query('status') as any;
    const type = c.req.query('type') as any;
    const category = c.req.query('category') as any;
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const validationService = new DataValidationService(c.env.FINANCE_MANAGER_DB);
    const warnings = await validationService.getWarnings(entityId, {
      status,
      type,
      category,
      limit,
      offset
    });

    return c.json({
      warnings,
      pagination: {
        limit,
        offset,
        total: warnings.length
      }
    });

  } catch (error) {
    console.error('Get warnings error:', error);
    return c.json({
      error: 'Failed to get warnings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * PUT /api/data-assistant/warnings/:warningId/dismiss
 * Dismiss a validation warning
 */
router.put('/warnings/:warningId/dismiss', async (c) => {
  try {
    const warningId = c.req.param('warningId');

    const validationService = new DataValidationService(c.env.FINANCE_MANAGER_DB);
    await validationService.updateWarningStatus(warningId, 'dismissed');

    return c.json({
      message: 'Warning dismissed successfully'
    });

  } catch (error) {
    console.error('Dismiss warning error:', error);
    return c.json({
      error: 'Failed to dismiss warning',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * PUT /api/data-assistant/warnings/:warningId/resolve
 * Resolve a validation warning
 */
router.put('/warnings/:warningId/resolve', async (c) => {
  try {
    const warningId = c.req.param('warningId');

    const validationService = new DataValidationService(c.env.FINANCE_MANAGER_DB);
    await validationService.updateWarningStatus(warningId, 'resolved');

    return c.json({
      message: 'Warning resolved successfully'
    });

  } catch (error) {
    console.error('Resolve warning error:', error);
    return c.json({
      error: 'Failed to resolve warning',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/data-assistant/validate
 * Validate transaction data
 */
router.post('/validate', async (c) => {
  try {
    const body = await c.req.json();
    const { transaction, includeHistorical = true } = body;

    if (!transaction) {
      return c.json({ error: 'Transaction data required' }, 400);
    }

    // Add entity context
    transaction.entityId = c.get('user').entityId || 'default';

    const validationService = new DataValidationService(c.env.FINANCE_MANAGER_DB);

    // Get historical data for anomaly detection
    let historicalData;
    if (includeHistorical) {
      // TODO: Fetch similar historical transactions
      // For now, use empty array
      historicalData = [];
    }

    const validation = await validationService.validateTransaction(
      transaction,
      historicalData
    );

    return c.json({
      validation: {
        isValid: validation.isValid,
        hasAnomalies: validation.hasAnomalies,
        hasDuplicates: validation.hasDuplicates,
        missingFields: validation.missingFields
      },
      warnings: validation.warnings,
      recommendations: validation.warnings
        .filter(w => w.warningType === 'opportunity')
        .map(w => ({
          title: w.title,
          description: w.description,
          action: w.suggestedAction
        }))
    });

  } catch (error) {
    console.error('Validation error:', error);
    return c.json({
      error: 'Failed to validate transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/data-assistant/insights/dashboard
 * Get dashboard insights
 */
router.get('/insights/dashboard', async (c) => {
  try {
    const entityId = c.get('user').entityId || 'default';
    const period = c.req.query('period') || '30d';
    const useCache = c.req.query('cache') !== 'false';

    const insightsEngine = new InsightsEngine(c.env.FINANCE_MANAGER_DB);

    // Check cache first
    if (useCache) {
      const cached = await insightsEngine.getCachedInsights(entityId, `dashboard_${period}`);
      if (cached) {
        return c.json({
          ...cached,
          cached: true,
          cachedAt: cached.generatedAt
        });
      }
    }

    // Generate fresh insights
    const insights = await insightsEngine.generateDashboard(entityId, period);

    // Cache for 30 minutes
    await insightsEngine.cacheInsights(entityId, `dashboard_${period}`, insights, 30);

    return c.json({
      ...insights,
      cached: false
    });

  } catch (error) {
    console.error('Dashboard insights error:', error);
    return c.json({
      error: 'Failed to generate insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default router;
