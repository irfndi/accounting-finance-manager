"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRawDocSchema = exports.selectRawDocSchema = exports.insertRawDocSchema = exports.DocumentType = exports.OCRStatus = exports.rawDocs = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
/**
 * Raw Documents - Stores extracted text from uploaded documents for OCR processing
 * Links uploaded files in R2 storage with their extracted text content
 */
exports.rawDocs = (0, sqlite_core_1.sqliteTable)("raw_docs", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    // File identification
    fileId: (0, sqlite_core_1.text)("file_id").notNull().unique(), // UUID from R2 storage filename
    originalName: (0, sqlite_core_1.text)("original_name").notNull(), // Original filename
    mimeType: (0, sqlite_core_1.text)("mime_type").notNull(), // File MIME type
    fileSize: (0, sqlite_core_1.integer)("file_size").notNull(), // File size in bytes
    // R2 storage reference
    r2Key: (0, sqlite_core_1.text)("r2_key").notNull(), // Full R2 object key
    r2Bucket: (0, sqlite_core_1.text)("r2_bucket").notNull().default("FINANCE_MANAGER_DOCUMENTS"),
    // OCR processing results
    extractedText: (0, sqlite_core_1.text)("extracted_text"), // Full OCR extracted text
    textLength: (0, sqlite_core_1.integer)("text_length").default(0), // Length of extracted text
    ocrConfidence: (0, sqlite_core_1.real)("ocr_confidence"), // OCR confidence score (0-1)
    ocrProcessingTime: (0, sqlite_core_1.real)("ocr_processing_time"), // Processing time in milliseconds
    // Processing status
    ocrStatus: (0, sqlite_core_1.text)("ocr_status").notNull().default("PENDING"), // PENDING, PROCESSING, COMPLETED, FAILED
    ocrErrorMessage: (0, sqlite_core_1.text)("ocr_error_message"), // Error details if processing failed
    ocrProcessedAt: (0, sqlite_core_1.integer)("ocr_processed_at", { mode: "timestamp" }), // When OCR was completed
    // Document classification
    documentType: (0, sqlite_core_1.text)("document_type"), // AUTO-DETECTED, RECEIPT, INVOICE, STATEMENT, etc.
    category: (0, sqlite_core_1.text)("category"), // Business category classification
    tags: (0, sqlite_core_1.text)("tags"), // JSON array of tags for document categorization
    // LLM processing results
    structuredData: (0, sqlite_core_1.text)("structured_data"), // JSON structured data extracted by LLM
    llmConfidence: (0, sqlite_core_1.real)("llm_confidence"), // LLM classification confidence score (0-1)
    llmProcessedAt: (0, sqlite_core_1.integer)("llm_processed_at", { mode: "timestamp" }), // When LLM processing was completed
    // File metadata
    uploadedBy: (0, sqlite_core_1.text)("uploaded_by").notNull(), // User ID who uploaded the file
    description: (0, sqlite_core_1.text)("description"), // User-provided description
    // Search optimization
    searchableText: (0, sqlite_core_1.text)("searchable_text"), // Processed text for search (normalized, keywords)
    // Multi-entity support
    entityId: (0, sqlite_core_1.text)("entity_id"), // For multi-company accounting
    // Audit fields
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: (0, sqlite_core_1.integer)("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    createdBy: (0, sqlite_core_1.text)("created_by"),
    updatedBy: (0, sqlite_core_1.text)("updated_by"),
});
// OCR Status enum
exports.OCRStatus = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED"
};
// Document Type enum
exports.DocumentType = {
    AUTO_DETECTED: "AUTO_DETECTED",
    RECEIPT: "RECEIPT",
    INVOICE: "INVOICE",
    BANK_STATEMENT: "BANK_STATEMENT",
    CONTRACT: "CONTRACT",
    REPORT: "REPORT",
    OTHER: "OTHER"
};
// Schema validation
exports.insertRawDocSchema = (0, drizzle_zod_1.createInsertSchema)(exports.rawDocs, {
    fileId: zod_1.z.string().min(1).max(50),
    originalName: zod_1.z.string().min(1).max(255),
    mimeType: zod_1.z.string().min(1).max(100),
    fileSize: zod_1.z.number().positive(),
    ocrStatus: zod_1.z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
    ocrConfidence: zod_1.z.number().min(0).max(1).optional(),
    uploadedBy: zod_1.z.string().min(1)
});
exports.selectRawDocSchema = (0, drizzle_zod_1.createSelectSchema)(exports.rawDocs);
exports.updateRawDocSchema = exports.insertRawDocSchema.partial().omit({
    id: true,
    fileId: true,
    createdAt: true,
    createdBy: true
});
