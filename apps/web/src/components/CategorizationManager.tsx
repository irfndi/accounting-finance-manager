import React, { useState, useEffect } from 'react';
import { aiClient, type CategorizationSuggestion } from '../lib/ai-client';

interface CategorizationManagerProps {
  onSuggestionApproved?: (suggestion: CategorizationSuggestion) => void;
  className?: string;
}

export default function CategorizationManager({ 
  onSuggestionApproved, 
  className = '' 
}: CategorizationManagerProps) {
  const [suggestions, setSuggestions] = useState<CategorizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Load pending suggestions
  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await aiClient.getPendingSuggestions();
      if (response.success && response.suggestions) {
        setSuggestions(response.suggestions);
      } else {
        setError(response.error || 'Failed to load suggestions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion approval
  const handleApprove = async (suggestion: CategorizationSuggestion) => {
    setProcessingIds(prev => new Set(prev).add(suggestion.id));
    
    try {
      const response = await aiClient.approveSuggestion(suggestion.id);
      if (response.success) {
        // Remove from pending list
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        
        // Notify parent component
        onSuggestionApproved?.(suggestion);
        
        // Show success feedback
        setError(null);
      } else {
        setError(response.error || 'Failed to approve suggestion');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }
  };

  // Handle suggestion rejection
  const handleReject = async (suggestion: CategorizationSuggestion) => {
    setProcessingIds(prev => new Set(prev).add(suggestion.id));
    
    try {
      const response = await aiClient.rejectSuggestion(suggestion.id);
      if (response.success) {
        // Remove from pending list
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        setError(null);
      } else {
        setError(response.error || 'Failed to reject suggestion');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }
  };

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && suggestions.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">🎯</div>
          <p className="text-gray-600">No pending categorization suggestions</p>
          <button
            onClick={loadSuggestions}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Categorization Suggestions ({suggestions.length})
        </h3>
        <button
          onClick={loadSuggestions}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {suggestions.map((suggestion) => {
          const isProcessing = processingIds.has(suggestion.id);
          
          return (
            <div
              key={suggestion.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {suggestion.description}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatAmount(suggestion.amount)}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-600">Suggested Category:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {suggestion.suggestedCategory}
                      </span>
                      <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                        {formatConfidence(suggestion.confidence)}
                      </span>
                    </div>
                    
                    {suggestion.reasoning && (
                      <p className="text-xs text-gray-500 mt-1">
                        {suggestion.reasoning}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Created: {new Date(suggestion.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(suggestion)}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? '...' : '✓ Approve'}
                  </button>
                  
                  <button
                    onClick={() => handleReject(suggestion)}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? '...' : '✗ Reject'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}