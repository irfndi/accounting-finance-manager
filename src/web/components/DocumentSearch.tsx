/**
 * Document Search Component
 * Provides semantic search interface for documents
 */

import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface SearchResult {
  id: string;
  fileName: string;
  mimeType: string;
  similarity: number;
  matchedText: string;
  uploadedAt: string;
  chunkInfo?: {
    chunkIndex: number;
    totalChunks: number;
    chunkId: string;
  };
}

interface SearchResponse {
  success: boolean;
  data?: {
    query: string;
    results: SearchResult[];
    totalMatches: number;
    processingTime: number;
    threshold: number;
    includeChunks: boolean;
  };
  error?: string;
}

interface DocumentSearchProps {
  className?: string;
}

export function DocumentSearch({ className = '' }: DocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchStats, setSearchStats] = useState<{
    totalMatches: number;
    processingTime: number;
  } | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSearchStats(null);

    try {
      const response = await fetch('/api/vectorize/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('finance_manager_token') || ''}`,
        },
        body: JSON.stringify({
          query: query.trim(),
          topK: 10,
          threshold: 0.7
        }),
      });

      const data: SearchResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      if (data.data) {
        setResults(data.data.results || []);
        setSearchStats({
          totalMatches: data.data.totalMatches || 0,
          processingTime: data.data.processingTime || 0
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`document-search ${className}`}>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Document Search</h2>
            <p className="text-gray-600 mb-4">
              Search through your documents using natural language queries
            </p>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search for documents... (e.g., 'invoices from last month', 'tax documents')"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || !query.trim()}
              className="px-6"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Search Stats */}
          {searchStats && (
            <div className="text-sm text-gray-600">
              Found {searchStats.totalMatches} results in {searchStats.processingTime}ms
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Search Results</h3>
              {results.map((result) => (
                <Card key={result.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {result.fileName || result.id}
                        </h4>
                        {result.mimeType && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {result.mimeType}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-700">
                          {formatScore(result.similarity)}% match
                        </div>
                        {result.uploadedAt && (
                          <div className="text-xs text-gray-500">
                            {formatTimestamp(result.uploadedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {result.matchedText && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {truncateText(result.matchedText)}
                      </p>
                    )}
                    
                    {result.chunkInfo && (
                      <div className="text-xs text-gray-500">
                        Chunk {result.chunkInfo.chunkIndex + 1} of {result.chunkInfo.totalChunks}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && results.length === 0 && searchStats && (
            <div className="text-center py-8 text-gray-500">
              <p>No documents found matching your search.</p>
              <p className="text-sm mt-1">Try using different keywords or phrases.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default DocumentSearch;