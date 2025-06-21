/**
 * Vectorize Service
 * Handles document embeddings and semantic search using Cloudflare Vectorize
 */
import type { Vectorize, Ai } from '@cloudflare/workers-types';
export interface VectorizeConfig {
    vectorize: Vectorize;
    ai?: Ai;
    embeddingModel?: string;
    maxTextLength?: number;
    chunkSize?: number;
    chunkOverlap?: number;
}
export interface EmbeddingMetadata {
    fileId: string;
    text: string;
    timestamp: string;
    mimeType?: string;
    fileName?: string;
    userId?: string;
    tags?: string[];
    chunkIndex?: number;
    totalChunks?: number;
    [key: string]: any;
}
export interface SearchOptions {
    topK?: number;
    threshold?: number;
    filter?: Record<string, any>;
    returnMetadata?: boolean;
    includeValues?: boolean;
}
export interface SearchResult {
    id: string;
    score: number;
    metadata?: EmbeddingMetadata;
    values?: number[] | Float32Array | Float64Array;
}
export interface SearchResponse {
    matches: SearchResult[];
    query: string;
    totalMatches: number;
    threshold: number;
    processingTime: number;
}
export declare class VectorizeService {
    private vectorize;
    private ai?;
    private embeddingModel;
    private maxTextLength;
    private chunkSize;
    private chunkOverlap;
    constructor(config: VectorizeConfig);
    /**
     * Generate embeddings for a document and store in Vectorize
     */
    embedDocument(fileId: string, text: string, metadata?: Partial<EmbeddingMetadata>): Promise<{
        success: boolean;
        chunksCreated: number;
        error?: string;
    }>;
    /**
     * Perform semantic search using text query
     */
    searchByText(query: string, options?: SearchOptions): Promise<SearchResponse>;
    /**
     * Perform semantic search using vector embeddings
     */
    searchByVector(vector: number[], options?: SearchOptions): Promise<SearchResponse>;
    /**
     * Delete embeddings for a document
     */
    deleteDocument(fileId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get document embeddings by file ID
     */
    getDocumentEmbeddings(fileId: string): Promise<SearchResult[]>;
    /**
     * Split text into chunks for better embedding quality
     */
    private splitTextIntoChunks;
    /**
     * Get service statistics
     */
    getStats(): Promise<{
        totalVectors: number;
        indexSize: string;
        lastUpdated: string;
    }>;
}
/**
 * Factory function to create VectorizeService
 */
export declare function createVectorizeService(config: VectorizeConfig): VectorizeService;
//# sourceMappingURL=vectorize-service.d.ts.map