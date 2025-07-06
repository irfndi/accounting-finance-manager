/**
 * Vectorize Service
 * Handles document embeddings and semantic search using Cloudflare Vectorize
 */

import type { Vectorize, Ai } from '@cloudflare/workers-types';
import { AIServiceError } from '../types.js';

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
  returnValues?: boolean;
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

export class VectorizeService {
  private vectorize: Vectorize;
  private ai?: Ai;
  private embeddingModel: string;
  private maxTextLength: number;
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(config: VectorizeConfig) {
    this.vectorize = config.vectorize;
    this.ai = config.ai;
    this.embeddingModel = config.embeddingModel || '@cf/baai/bge-base-en-v1.5';
    this.maxTextLength = config.maxTextLength || 8000;
    this.chunkSize = config.chunkSize || 1000;
    this.chunkOverlap = config.chunkOverlap || 200;
  }

  /**
   * Generate embeddings for a document and store in Vectorize
   */
  async embedDocument(
    fileId: string,
    text: string,
    metadata: Partial<EmbeddingMetadata> = {}
  ): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
    try {
      if (!text || text.trim().length === 0) {
        return { success: false, chunksCreated: 0, error: 'No text content to embed' };
      }

      // Truncate text if too long
      const processedText = text.length > this.maxTextLength 
        ? text.substring(0, this.maxTextLength)
        : text;

      // Split text into chunks for better embedding quality
      const chunks = this.splitTextIntoChunks(processedText);
      const vectors = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = chunks.length > 1 ? `${fileId}_chunk_${i}` : fileId;
        
        if (!this.ai) {
          throw new AIServiceError('AI binding is required for embedding generation', 'AI_NOT_CONFIGURED');
        }

        // Generate embedding for this chunk
        const embeddingResponse = await this.ai.run(this.embeddingModel as any, {
          text: [chunk]
        }) as { shape: number[]; data: number[][] };

        if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
          throw new AIServiceError(`Failed to generate embedding for chunk ${i}`, 'EMBEDDING_FAILED');
        }

        const vectorData = {
          id: chunkId,
          values: embeddingResponse.data[0], // Vector values are required
          metadata: {
            fileId,
            text: chunk.substring(0, 1000), // Store first 1000 chars for search preview
            timestamp: new Date().toISOString(),
            chunkIndex: i,
            totalChunks: chunks.length,
            ...metadata
          } as EmbeddingMetadata
        };

        vectors.push(vectorData);
      }

      // Insert vectors into Vectorize
      await this.vectorize.insert(vectors);
      
      // console.log(`✅ Generated embeddings for document ${fileId} (${chunks.length} chunks)`);
      return { success: true, chunksCreated: chunks.length };
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      console.error('Failed to generate embeddings:', error);
      return { 
        success: false, 
        chunksCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown embedding error' 
      };
    }
  }

  /**
   * Perform semantic search using text query
   */
  async searchByText(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new AIServiceError('Search query is required', 'INVALID_QUERY');
      }

      if (!this.ai) {
        throw new AIServiceError('AI binding is required for text-to-vector conversion', 'AI_NOT_CONFIGURED');
      }

      const {
        topK = 10,
        threshold = 0.7,
        filter,
        returnMetadata = true,
        includeValues = false
      } = options;

      // Convert text to vector using Workers AI
      const embeddingResponse = await this.ai.run(this.embeddingModel as any, {
        text: [query]
      }) as { shape: number[]; data: number[][] };

      if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
        throw new AIServiceError('Failed to generate embedding for query', 'EMBEDDING_FAILED');
      }

      const queryVector = embeddingResponse.data[0];

      // Query Vectorize with the generated vector
      const searchResults = await this.vectorize.query(queryVector, {
        topK,
        returnMetadata,
        returnValues: includeValues,
        filter
      });

      // Filter results by similarity threshold
      const filteredMatches = searchResults.matches
        .filter(match => match.score >= threshold)
        .map(match => ({
          id: match.id,
          score: match.score,
          metadata: match.metadata as EmbeddingMetadata,
          values: match.values as number[] | Float32Array | Float64Array | undefined
        }));

      const processingTime = Date.now() - startTime;

      return {
        matches: filteredMatches,
        query,
        totalMatches: filteredMatches.length,
        threshold,
        processingTime
      };
    } catch (error) {
      console.error('Semantic search error:', error);
      
      throw new AIServiceError(
        `Failed to perform semantic search: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEARCH_FAILED',
        'vectorize'
      );
    }
  }

  /**
   * Perform semantic search using vector embeddings
   */
  async searchByVector(
    vector: number[],
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      if (!vector || !Array.isArray(vector) || vector.length === 0) {
        throw new AIServiceError('Search vector is required', 'INVALID_VECTOR');
      }

      const {
        topK = 10,
        threshold = 0.7,
        filter,
        returnMetadata = true,
        includeValues = false
      } = options;

      const searchResults = await this.vectorize.query(vector, {
        topK,
        returnMetadata,
        returnValues: includeValues,
        filter
      });

      // Filter results by similarity threshold
      const filteredMatches = searchResults.matches
        .filter(match => match.score >= threshold)
        .map(match => ({
          id: match.id,
          score: match.score,
          metadata: match.metadata as EmbeddingMetadata,
          values: match.values as number[] | Float32Array | Float64Array | undefined
        }));

      const processingTime = Date.now() - startTime;

      return {
        matches: filteredMatches,
        query: '[Vector Query]',
        totalMatches: filteredMatches.length,
        threshold,
        processingTime
      };
    } catch (error) {
      console.error('Vector search error:', error);
      
      throw new AIServiceError(
        `Failed to perform vector search: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEARCH_FAILED',
        'vectorize'
      );
    }
  }

  /**
   * Delete embeddings for a document
   */
  async deleteDocument(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete all chunks for this document
      // Note: Vectorize doesn't have a direct delete by metadata filter,
      // so we need to delete by specific IDs
      await this.vectorize.deleteByIds([fileId]);
      
      // Also try to delete potential chunks
      const chunkIds = [];
      for (let i = 0; i < 50; i++) { // Assume max 50 chunks
        chunkIds.push(`${fileId}_chunk_${i}`);
      }
      
      try {
        await this.vectorize.deleteByIds(chunkIds);
      } catch {
        // Ignore errors for non-existent chunk IDs
      }
      
      // console.log(`✅ Deleted embeddings for document ${fileId}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete embeddings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown deletion error' 
      };
    }
  }

  /**
   * Get document embeddings by file ID
   */
  async getDocumentEmbeddings(fileId: string): Promise<SearchResult[]> {
    try {
      // Search for all chunks of this document
      const results = await this.vectorize.query([0], {
        topK: 1000, // Large number to get all chunks
        returnMetadata: true,
        filter: { fileId }
      });

      return results.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata as EmbeddingMetadata,
        values: match.values as number[] | Float32Array | Float64Array | undefined
      }));
    } catch (error) {
      console.error('Failed to get document embeddings:', error);
      return [];
    }
  }

  /**
   * Split text into chunks for better embedding quality
   */
  private splitTextIntoChunks(text: string): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + this.chunkSize;
      
      // If not the last chunk, try to break at a sentence or word boundary
      if (end < text.length) {
        // Look for sentence boundary
        const sentenceEnd = text.lastIndexOf('.', end);
        const questionEnd = text.lastIndexOf('?', end);
        const exclamationEnd = text.lastIndexOf('!', end);
        
        const sentenceBoundary = Math.max(sentenceEnd, questionEnd, exclamationEnd);
        
        if (sentenceBoundary > start + this.chunkSize * 0.5) {
          end = sentenceBoundary + 1;
        } else {
          // Look for word boundary
          const wordBoundary = text.lastIndexOf(' ', end);
          if (wordBoundary > start + this.chunkSize * 0.5) {
            end = wordBoundary;
          }
        }
      }

      chunks.push(text.substring(start, end).trim());
      start = end - this.chunkOverlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    totalVectors: number;
    indexSize: string;
    lastUpdated: string;
  }> {
    try {
      // Note: Vectorize doesn't provide direct stats API
      // This is a placeholder for future implementation
      return {
        totalVectors: 0,
        indexSize: 'Unknown',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get vectorize stats:', error);
      return {
        totalVectors: 0,
        indexSize: 'Error',
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

/**
 * Factory function to create VectorizeService
 */
export function createVectorizeService(config: VectorizeConfig): VectorizeService {
  return new VectorizeService(config);
}