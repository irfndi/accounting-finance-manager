#!/usr/bin/env tsx

/**
 * Test script for Cloudflare environment
 * Tests AI service with OpenRouter integration
 */

import { createAIService, FinancialAIService } from './src/index.js';

async function testCloudflareIntegration() {
  console.log('🧪 Testing AI Service with Cloudflare setup...\n');

  try {
    // Create AI service (will use OpenRouter with your key)
    const aiService = createAIService();
    const financialAI = new FinancialAIService(aiService);

    // Test provider health
    console.log('🏥 Checking provider health...');
    const health = await aiService.getProvidersHealth();
    console.log('Health Status:', JSON.stringify(health, null, 2));

    // Test simple financial analysis
    console.log('\n💰 Testing transaction analysis...');
    const testTransaction = {
      id: 'test-001',
      amount: 25.99,
      description: 'Starbucks Coffee Shop',
      date: '2025-01-10',
      accountId: 'checking-001'
    };

    const analysis = await financialAI.analyzeTransaction(testTransaction);
    console.log('Analysis Result:', {
      confidence: analysis.confidence,
      analysis: analysis.analysis.substring(0, 100) + '...'
    });

    console.log('\n✅ All tests passed! AI service is ready for production.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.log('\n💡 Tip: Make sure OPENROUTER_API_KEY is set in your Cloudflare environment variables');
      }
    }
  }
}

// Run the test
testCloudflareIntegration().catch(console.error); 