import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Raw Documents - Stores extracted text from uploaded documents for OCR processing
 * Links uploaded files in R2 storage with their extracted text content
 */
export const rawDocs = sqliteTable("raw_docs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // File identification
  fileId: text("file_id").notNull().unique(), // UUID from R2 storage filename
  originalName: text("original_name").notNull(), // Original filename
  mimeType: text("mime_type").notNull(), // File MIME type
  fileSize: integer("file_size").notNull(), // File size in bytes
  
  // R2 storage reference
  r2Key: text("r2_key").notNull(), // Full R2 object key
  r2Bucket: text("r2_bucket").notNull().default("FINANCE_MANAGER_DOCUMENTS"),
  
  // OCR processing results
  extractedText: text("extracted_text"), // Full OCR extracted text
  textLength: integer("text_length").default(0), // Length of extracted text
  ocrConfidence: real("ocr_confidence"), // OCR confidence score (0-1)
  ocrProcessingTime: real("ocr_processing_time"), // Processing time in milliseconds
  
  // Processing status
  ocrStatus: text("ocr_status").notNull().default("PENDING"), // PENDING, PROCESSING, COMPLETED, FAILED
  ocrErrorMessage: text("ocr_error_message"), // Error details if processing failed
  ocrProcessedAt: integer("ocr_processed_at", { mode: "timestamp" }), // When OCR was completed
  
  // Document classification
  documentType: text("document_type"), // AUTO-DETECTED, RECEIPT, INVOICE, STATEMENT, etc.
  category: text("category"), // Business category classification
  tags: text("tags"), // JSON array of tags for document categorization
  
  // LLM processing results
  structuredData: text("structured_data"), // JSON structured data extracted by LLM
  llmConfidence: real("llm_confidence"), // LLM classification confidence score (0-1)
  llmProcessedAt: integer("llm_processed_at", { mode: "timestamp" }), // When LLM processing was completed
  
  // File metadata
  uploadedBy: text("uploaded_by").notNull(), // User ID who uploaded the file
  description: text("description"), // User-provided description
  
  // Search optimization
  searchableText: text("searchable_text"), // Processed text for search (normalized, keywords)
  
  // Multi-entity support
  entityId: text("entity_id"), // For multi-company accounting
  
  // Audit fields
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
});

// OCR Status enum
export const OCRStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING", 
  COMPLETED: "COMPLETED",
  FAILED: "FAILED"
} as const;

// Document Type enum
export const DocumentType = {
  AUTO_DETECTED: "AUTO_DETECTED",
  RECEIPT: "RECEIPT",
  INVOICE: "INVOICE", 
  BANK_STATEMENT: "BANK_STATEMENT",
  CONTRACT: "CONTRACT",
  REPORT: "REPORT",
  OTHER: "OTHER"
} as const;

// Schema validation
export const insertRawDocSchema = createInsertSchema(rawDocs, {
  fileId: z.string().min(1).max(50),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().positive(),
  ocrStatus: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
  ocrConfidence: z.number().min(0).max(1).optional(),
  uploadedBy: z.string().min(1)
});

export const selectRawDocSchema = createSelectSchema(rawDocs);

export const updateRawDocSchema = insertRawDocSchema.partial().omit({ 
  id: true, 
  fileId: true, 
  createdAt: true,
  createdBy: true
});

// Types
export type RawDoc = typeof rawDocs.$inferSelect;
export type NewRawDoc = typeof rawDocs.$inferInsert;
export type UpdateRawDoc = z.infer<typeof updateRawDocSchema>;