/**
 * Data Ingestion Service
 * Handles multi-format data uploads (Excel, CSV, JSON) with intelligent parsing and validation
 */

import type { D1Database } from '@cloudflare/workers-types';

// File upload types
export interface DataUpload {
  id: string;
  entityId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'pending' | 'processing' | 'previewing' | 'completed' | 'failed';
  detectedFormat?: string;
  rowCount?: number;
  importedCount?: number;
  errorCount?: number;
  columnMappings?: ColumnMapping[];
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: string[];
  transformation?: string; // JSON string of transformation rules
}

export interface FilePreview {
  headers: string[];
  sampleRows: any[][];
  rowCount: number;
  detectedFormat: string;
  suggestedMappings: ColumnMapping[];
  warnings: string[];
}

export interface ImportResult {
  uploadId: string;
  status: 'success' | 'partial' | 'failed';
  importedCount: number;
  errorCount: number;
  warnings: string[];
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  column?: string;
  message: string;
  severity: 'error' | 'warning';
}

// Standard financial format types
export type StandardFormat = 
  | 'general-ledger' 
  | 'accounts-payable' 
  | 'accounts-receivable' 
  | 'inventory' 
  | 'payroll' 
  | 'budget' 
  | 'project-accounting';

// Standard field mappings for each format
export const STANDARD_FORMATS: Record<StandardFormat, string[]> = {
  'general-ledger': ['date', 'accountCode', 'accountName', 'description', 'debit', 'credit', 'reference', 'currency'],
  'accounts-payable': ['date', 'vendorId', 'vendorName', 'invoiceNumber', 'dueDate', 'amount', 'paid', 'category'],
  'accounts-receivable': ['date', 'customerId', 'customerName', 'invoiceNumber', 'dueDate', 'amount', 'paid', 'terms'],
  'inventory': ['itemCode', 'itemName', 'quantity', 'unitPrice', 'totalValue', 'location', 'category'],
  'payroll': ['employeeId', 'employeeName', 'period', 'grossPay', 'deductions', 'netPay', 'taxWithheld'],
  'budget': ['accountCode', 'accountName', 'period', 'budgetedAmount', 'actualAmount', 'variance'],
  'project-accounting': ['projectCode', 'projectName', 'date', 'description', 'amount', 'category', 'billable']
};

/**
 * Data Ingestion Service Class
 */
export class DataIngestionService {
  constructor(private db: D1Database) {}

  /**
   * Create a new data upload record
   */
  async createUpload(
    entityId: string,
    userId: string,
    fileName: string,
    fileSize: number,
    fileType: string
  ): Promise<DataUpload> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO data_imports 
         (id, entity_id, user_id, file_name, file_size, file_type, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, entityId, userId, fileName, fileSize, fileType, 'pending', now)
      .run();

    return {
      id,
      entityId,
      userId,
      fileName,
      fileSize,
      fileType,
      status: 'pending',
      createdAt: new Date(now)
    };
  }

  /**
   * Update upload status
   */
  async updateUploadStatus(
    uploadId: string,
    status: DataUpload['status'],
    additional?: Partial<DataUpload>
  ): Promise<void> {
    const updates: string[] = ['status = ?'];
    const values: any[] = [status];

    if (additional) {
      if (additional.detectedFormat) {
        updates.push('detected_format = ?');
        values.push(additional.detectedFormat);
      }
      if (additional.rowCount !== undefined) {
        updates.push('row_count = ?');
        values.push(additional.rowCount);
      }
      if (additional.importedCount !== undefined) {
        updates.push('imported_count = ?');
        values.push(additional.importedCount);
      }
      if (additional.errorCount !== undefined) {
        updates.push('error_count = ?');
        values.push(additional.errorCount);
      }
      if (status === 'completed' || status === 'failed') {
        updates.push('completed_at = ?');
        values.push(new Date().toISOString());
      }
      if (additional.metadata) {
        updates.push('metadata = ?');
        values.push(JSON.stringify(additional.metadata));
      }
    }

    values.push(uploadId);

    await this.db
      .prepare(`UPDATE data_imports SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  /**
   * Save column mappings
   */
  async saveColumnMappings(uploadId: string, mappings: ColumnMapping[]): Promise<void> {
    const stmt = this.db.prepare(
      `INSERT INTO column_mappings 
       (id, import_id, source_column, target_field, confidence, data_type, transformation, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const mapping of mappings) {
      await stmt.bind(
        crypto.randomUUID(),
        uploadId,
        mapping.sourceColumn,
        mapping.targetField,
        mapping.confidence,
        mapping.dataType,
        mapping.transformation || null,
        new Date().toISOString()
      ).run();
    }
  }

  /**
   * Get upload by ID
   */
  async getUpload(uploadId: string): Promise<DataUpload | null> {
    const result = await this.db
      .prepare('SELECT * FROM data_imports WHERE id = ?')
      .bind(uploadId)
      .first();

    if (!result) return null;

    return {
      id: result.id as string,
      entityId: result.entity_id as string,
      userId: result.user_id as string,
      fileName: result.file_name as string,
      fileSize: result.file_size as number,
      fileType: result.file_type as string,
      status: result.status as DataUpload['status'],
      detectedFormat: result.detected_format as string | undefined,
      rowCount: result.row_count as number | undefined,
      importedCount: result.imported_count as number | undefined,
      errorCount: result.error_count as number | undefined,
      createdAt: new Date(result.created_at as string),
      completedAt: result.completed_at ? new Date(result.completed_at as string) : undefined,
      metadata: result.metadata ? JSON.parse(result.metadata as string) : undefined
    };
  }

  /**
   * Get column mappings for an upload
   */
  async getColumnMappings(uploadId: string): Promise<ColumnMapping[]> {
    const results = await this.db
      .prepare('SELECT * FROM column_mappings WHERE import_id = ? ORDER BY created_at')
      .bind(uploadId)
      .all();

    return results.results.map((row) => ({
      sourceColumn: row.source_column as string,
      targetField: row.target_field as string,
      confidence: row.confidence as number,
      dataType: row.data_type as ColumnMapping['dataType'],
      sampleValues: [], // Not stored in DB
      transformation: row.transformation as string | undefined
    }));
  }

  /**
   * List uploads for an entity
   */
  async listUploads(entityId: string, limit = 50, offset = 0): Promise<DataUpload[]> {
    const results = await this.db
      .prepare(
        `SELECT * FROM data_imports 
         WHERE entity_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`
      )
      .bind(entityId, limit, offset)
      .all();

    return results.results.map((row) => ({
      id: row.id as string,
      entityId: row.entity_id as string,
      userId: row.user_id as string,
      fileName: row.file_name as string,
      fileSize: row.file_size as number,
      fileType: row.file_type as string,
      status: row.status as DataUpload['status'],
      detectedFormat: row.detected_format as string | undefined,
      rowCount: row.row_count as number | undefined,
      importedCount: row.imported_count as number | undefined,
      errorCount: row.error_count as number | undefined,
      createdAt: new Date(row.created_at as string),
      completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined
    }));
  }
}

/**
 * Detect standard format from headers
 */
export function detectStandardFormat(headers: string[]): {
  format: StandardFormat | null;
  confidence: number;
} {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  let bestMatch: { format: StandardFormat | null; score: number } = { format: null, score: 0 };

  for (const [format, standardFields] of Object.entries(STANDARD_FORMATS)) {
    const normalizedFields = standardFields.map(f => f.toLowerCase());
    
    // Count matching fields
    let matches = 0;
    for (const header of normalizedHeaders) {
      for (const field of normalizedFields) {
        if (header.includes(field) || field.includes(header) || isSimilar(header, field)) {
          matches++;
          break;
        }
      }
    }

    const score = matches / standardFields.length;
    
    if (score > bestMatch.score) {
      bestMatch = { format: format as StandardFormat, score };
    }
  }

  // Require at least 50% match to consider it a format match
  if (bestMatch.score >= 0.5) {
    return { format: bestMatch.format, confidence: bestMatch.score };
  }

  return { format: null, confidence: 0 };
}

/**
 * Check if two strings are similar (simple Levenshtein-like comparison)
 */
function isSimilar(str1: string, str2: string, threshold = 0.7): boolean {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return true;
  
  // Simple contains check
  if (longer.includes(shorter) || shorter.includes(longer)) return true;
  
  // Calculate similarity ratio
  const editDistance = calculateEditDistance(str1, str2);
  const similarity = (longer.length - editDistance) / longer.length;
  
  return similarity >= threshold;
}

/**
 * Calculate edit distance between two strings
 */
function calculateEditDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Suggest field mappings based on headers
 */
export function suggestColumnMappings(
  headers: string[],
  sampleData: any[][],
  targetFormat: StandardFormat
): ColumnMapping[] {
  const standardFields = STANDARD_FORMATS[targetFormat];
  const mappings: ColumnMapping[] = [];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim();
    
    // Find best matching standard field
    let bestMatch: { field: string; confidence: number } | null = null;
    
    for (const field of standardFields) {
      const fieldLower = field.toLowerCase();
      
      // Direct match
      if (header === fieldLower) {
        bestMatch = { field, confidence: 1.0 };
        break;
      }
      
      // Contains match
      if (header.includes(fieldLower) || fieldLower.includes(header)) {
        const confidence = Math.min(header.length, fieldLower.length) / Math.max(header.length, fieldLower.length);
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { field, confidence: 0.9 * confidence };
        }
      }
      
      // Similar match
      if (isSimilar(header, fieldLower, 0.6)) {
        const confidence = 0.7;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { field, confidence };
        }
      }
    }

    if (bestMatch && bestMatch.confidence > 0.5) {
      // Get sample values from the column
      const sampleValues = sampleData.slice(0, 5).map(row => String(row[i] || '')).filter(v => v);
      
      // Detect data type from sample values
      const dataType = detectDataType(sampleValues);

      mappings.push({
        sourceColumn: headers[i],
        targetField: bestMatch.field,
        confidence: bestMatch.confidence,
        dataType,
        sampleValues
      });
    }
  }

  return mappings;
}

/**
 * Detect data type from sample values
 */
function detectDataType(sampleValues: string[]): ColumnMapping['dataType'] {
  if (sampleValues.length === 0) return 'string';

  const allNumbers = sampleValues.every(v => !isNaN(Number(v)) && v.trim() !== '');
  if (allNumbers) return 'number';

  const allDates = sampleValues.every(v => !isNaN(Date.parse(v)));
  if (allDates) return 'date';

  const allBooleans = sampleValues.every(v => 
    ['true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase())
  );
  if (allBooleans) return 'boolean';

  return 'string';
}
