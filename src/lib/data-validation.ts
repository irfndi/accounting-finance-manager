/**
 * Data Validation Service
 * Proactive validation, anomaly detection, and intelligent warnings for financial data
 */

import type { D1Database } from '@cloudflare/workers-types';

// Warning types
export type WarningType = 'critical' | 'warning' | 'info' | 'opportunity';
export type WarningCategory = 
  | 'missing_field'
  | 'duplicate'
  | 'anomaly'
  | 'balance_error'
  | 'date_error'
  | 'category_mismatch'
  | 'vendor_error'
  | 'amount_unreasonable'
  | 'compliance'
  | 'optimization';

export interface ValidationWarning {
  id: string;
  entityId: string;
  importId?: string;
  transactionId?: string;
  warningType: WarningType;
  category: WarningCategory;
  title: string;
  description: string;
  suggestedAction?: string;
  status: 'active' | 'dismissed' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'error' | 'warning';
}

export interface TransactionValidation {
  transactionId: string;
  isValid: boolean;
  hasAnomalies: boolean;
  hasDuplicates: boolean;
  missingFields: string[];
  warnings: ValidationWarning[];
}

export interface ValidationRule {
  id: string;
  entityId: string;
  ruleType: 'required_field' | 'range' | 'format' | 'custom';
  field: string;
  condition: string; // JSON string
  message: string;
  severity: WarningType;
  isActive: boolean;
}

/**
 * Data Validation Service Class
 */
export class DataValidationService {
  constructor(private db: D1Database) {}

  /**
   * Create a validation warning
   */
  async createWarning(warning: Omit<ValidationWarning, 'id' | 'createdAt'>): Promise<ValidationWarning> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO validation_warnings 
         (id, entity_id, import_id, transaction_id, warning_type, category, title, description, suggested_action, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        warning.entityId,
        warning.importId || null,
        warning.transactionId || null,
        warning.warningType,
        warning.category,
        warning.title,
        warning.description,
        warning.suggestedAction || null,
        warning.status,
        now
      )
      .run();

    return {
      id,
      ...warning,
      createdAt: new Date(now)
    };
  }

  /**
   * Get warnings by entity
   */
  async getWarnings(
    entityId: string,
    filters?: {
      status?: ValidationWarning['status'];
      type?: WarningType;
      category?: WarningCategory;
      limit?: number;
      offset?: number;
    }
  ): Promise<ValidationWarning[]> {
    const conditions: string[] = ['entity_id = ?'];
    const params: any[] = [entityId];

    if (filters?.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters?.type) {
      conditions.push('warning_type = ?');
      params.push(filters.type);
    }

    if (filters?.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const query = `
      SELECT * FROM validation_warnings 
      WHERE ${conditions.join(' AND ')} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const results = await this.db.prepare(query).bind(...params).all();

    return results.results.map((row) => this.mapWarningRow(row));
  }

  /**
   * Update warning status
   */
  async updateWarningStatus(
    warningId: string,
    status: 'active' | 'dismissed' | 'resolved'
  ): Promise<void> {
    const updates = ['status = ?'];
    const params: (string | number)[] = [status];

    if (status === 'resolved' || status === 'dismissed') {
      updates.push('resolved_at = ?');
      params.push(new Date().toISOString());
    }

    params.push(warningId);

    await this.db
      .prepare(`UPDATE validation_warnings SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();
  }

  /**
   * Validate transaction data
   */
  async validateTransaction(
    transaction: any,
    historicalData?: any[]
  ): Promise<TransactionValidation> {
    const warnings: ValidationWarning[] = [];
    const missingFields: string[] = [];

    // Check required fields
    const requiredFields = ['date', 'description', 'amount'];
    for (const field of requiredFields) {
      if (!transaction[field]) {
        missingFields.push(field);
        warnings.push(await this.createWarning({
          entityId: transaction.entityId,
          transactionId: transaction.id,
          warningType: 'critical',
          category: 'missing_field',
          title: `Missing required field: ${field}`,
          description: `The transaction is missing the required field "${field}". This must be provided before saving.`,
          suggestedAction: `Please provide a value for ${field}`,
          status: 'active'
        }));
      }
    }

    // Check for anomalies using historical data
    let hasAnomalies = false;
    if (historicalData && historicalData.length > 0) {
      const anomalyCheck = this.detectAnomalies(transaction, historicalData);
      if (anomalyCheck.isAnomaly) {
        hasAnomalies = true;
        warnings.push(await this.createWarning({
          entityId: transaction.entityId,
          transactionId: transaction.id,
          warningType: 'warning',
          category: 'anomaly',
          title: anomalyCheck.title,
          description: anomalyCheck.description,
          suggestedAction: anomalyCheck.suggestedAction,
          status: 'active',
          metadata: { confidence: anomalyCheck.confidence }
        }));
      }
    }

    // Check for potential duplicates
    let hasDuplicates = false;
    const duplicateCheck = await this.checkDuplicates(transaction);
    if (duplicateCheck.isDuplicate) {
      hasDuplicates = true;
      warnings.push(await this.createWarning({
        entityId: transaction.entityId,
        transactionId: transaction.id,
        warningType: 'warning',
        category: 'duplicate',
        title: 'Potential duplicate transaction',
        description: duplicateCheck.message,
        suggestedAction: 'Review the similar transaction and confirm this is not a duplicate',
        status: 'active',
        metadata: { similarTransactionId: duplicateCheck.similarTransactionId }
      }));
    }

    // Validate amount reasonableness
    if (transaction.amount) {
      const amount = Math.abs(Number(transaction.amount));
      if (amount === 0) {
        warnings.push(await this.createWarning({
          entityId: transaction.entityId,
          transactionId: transaction.id,
          warningType: 'warning',
          category: 'amount_unreasonable',
          title: 'Zero amount transaction',
          description: 'This transaction has an amount of zero, which is unusual.',
          suggestedAction: 'Verify the amount is correct',
          status: 'active'
        }));
      } else if (amount > 1000000000) {
        // 1 billion threshold
        warnings.push(await this.createWarning({
          entityId: transaction.entityId,
          transactionId: transaction.id,
          warningType: 'warning',
          category: 'amount_unreasonable',
          title: 'Unusually large amount',
          description: `The amount (${amount.toLocaleString()}) is unusually large. Please verify.`,
          suggestedAction: 'Double-check the amount and decimal placement',
          status: 'active'
        }));
      }
    }

    // Validate date
    if (transaction.date) {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      if (transactionDate < oneYearAgo) {
        warnings.push(await this.createWarning({
          entityId: transaction.entityId,
          transactionId: transaction.id,
          warningType: 'info',
          category: 'date_error',
          title: 'Old transaction date',
          description: 'This transaction date is more than one year in the past.',
          suggestedAction: 'Verify the date is correct',
          status: 'active'
        }));
      }

      if (transactionDate > oneYearFuture) {
        warnings.push(await this.createWarning({
          entityId: transaction.entityId,
          transactionId: transaction.id,
          warningType: 'warning',
          category: 'date_error',
          title: 'Future transaction date',
          description: 'This transaction date is more than one year in the future.',
          suggestedAction: 'Verify the date is correct',
          status: 'active'
        }));
      }
    }

    return {
      transactionId: transaction.id,
      isValid: missingFields.length === 0,
      hasAnomalies,
      hasDuplicates,
      missingFields,
      warnings
    };
  }

  /**
   * Detect anomalies using statistical analysis
   */
  private detectAnomalies(
    transaction: any,
    historicalData: any[]
  ): {
    isAnomaly: boolean;
    title: string;
    description: string;
    suggestedAction: string;
    confidence: number;
  } {
    // Calculate statistics for historical amounts
    const amounts = historicalData.map(t => Math.abs(Number(t.amount))).filter(a => !isNaN(a));
    
    if (amounts.length < 3) {
      return {
        isAnomaly: false,
        title: '',
        description: '',
        suggestedAction: '',
        confidence: 0
      };
    }

    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    const currentAmount = Math.abs(Number(transaction.amount));

    // Check if current amount is > 3 standard deviations from mean (99.7% confidence interval)
    const zScore = (currentAmount - mean) / stdDev;
    const isAnomaly = Math.abs(zScore) > 3;

    if (isAnomaly) {
      const percentDiff = ((currentAmount - mean) / mean) * 100;
      return {
        isAnomaly: true,
        title: 'Unusual transaction amount',
        description: `This amount (${currentAmount.toLocaleString()}) is ${Math.abs(percentDiff).toFixed(0)}% ${
          currentAmount > mean ? 'higher' : 'lower'
        } than your typical transactions (avg: ${mean.toLocaleString()}). This could indicate a data entry error or a genuinely unusual transaction.`,
        suggestedAction: 'Review the amount and verify it is correct',
        confidence: Math.min(Math.abs(zScore) / 5, 1) // Normalize to 0-1
      };
    }

    return {
      isAnomaly: false,
      title: '',
      description: '',
      suggestedAction: '',
      confidence: 0
    };
  }

  /**
   * Check for duplicate transactions
   */
  private async checkDuplicates(transaction: any): Promise<{
    isDuplicate: boolean;
    message: string;
    similarTransactionId?: string;
  }> {
    // Look for similar transactions within 7 days
    const transactionDate = new Date(transaction.date);
    const startDate = new Date(transactionDate);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(transactionDate);
    endDate.setDate(endDate.getDate() + 7);

    const query = `
      SELECT id, description, amount, transaction_date 
      FROM transactions 
      WHERE entity_id = ? 
        AND ABS(amount - ?) < 0.01
        AND transaction_date BETWEEN ? AND ?
        AND id != ?
      LIMIT 5
    `;

    const results = await this.db
      .prepare(query)
      .bind(
        transaction.entityId,
        Math.abs(Number(transaction.amount)),
        startDate.toISOString(),
        endDate.toISOString(),
        transaction.id || ''
      )
      .all();

    if (results.results.length > 0) {
      // Check description similarity
      const similar = results.results.find((row) => {
        const similarity = this.calculateSimilarity(
          String(transaction.description).toLowerCase(),
          String(row.description).toLowerCase()
        );
        return similarity > 0.8;
      });

      if (similar) {
        return {
          isDuplicate: true,
          message: `A similar transaction exists: "${similar.description}" on ${new Date(similar.transaction_date as string).toLocaleDateString()}`,
          similarTransactionId: similar.id as string
        };
      }
    }

    return {
      isDuplicate: false,
      message: ''
    };
  }

  /**
   * Calculate string similarity (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(str1, str2);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
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
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Map database row to ValidationWarning
   */
  private mapWarningRow(row: any): ValidationWarning {
    return {
      id: row.id as string,
      entityId: row.entity_id as string,
      importId: row.import_id as string | undefined,
      transactionId: row.transaction_id as string | undefined,
      warningType: row.warning_type as WarningType,
      category: row.category as WarningCategory,
      title: row.title as string,
      description: row.description as string,
      suggestedAction: row.suggested_action as string | undefined,
      status: row.status as ValidationWarning['status'],
      createdAt: new Date(row.created_at as string),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined
    };
  }
}

/**
 * Validate required fields for a given data type
 */
export function validateRequiredFields(
  data: Record<string, any>,
  dataType: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  const requiredFieldsMap: Record<string, string[]> = {
    transaction: ['date', 'description', 'amount', 'accountId'],
    account: ['code', 'name', 'type'],
    vendor: ['name'],
    customer: ['name'],
    invoice: ['number', 'date', 'amount'],
    payment: ['date', 'amount', 'method']
  };

  const requiredFields = requiredFieldsMap[dataType] || [];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({
        field,
        message: `Required field "${field}" is missing or empty`,
        severity: 'critical'
      });
    }
  }

  return errors;
}

/**
 * Validate data format
 */
export function validateDataFormat(
  data: Record<string, any>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate date fields
  const dateFields = ['date', 'dueDate', 'createdAt', 'updatedAt'];
  for (const field of dateFields) {
    if (data[field] && isNaN(Date.parse(data[field]))) {
      errors.push({
        field,
        message: `Invalid date format for "${field}"`,
        severity: 'error'
      });
    }
  }

  // Validate numeric fields
  const numericFields = ['amount', 'quantity', 'price', 'total'];
  for (const field of numericFields) {
    if (data[field] !== undefined && isNaN(Number(data[field]))) {
      errors.push({
        field,
        message: `Invalid numeric value for "${field}"`,
        severity: 'error'
      });
    }
  }

  // Validate email fields
  if (data.email && !isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      severity: 'error'
    });
  }

  return errors;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
