# Finance Manager AI Package

A comprehensive AI service package for the Finance Manager application, providing unified access to multiple AI providers with automatic fallback, retry logic, and finance-specific functionality.

## Features

- 🚀 **Multiple AI Providers**: Support for OpenRouter and Cloudflare AI
- 🔄 **Automatic Fallback**: Seamlessly switches between providers if one fails
- 🔁 **Retry Logic**: Intelligent retry with exponential backoff
- 💰 **Finance-Specific**: Specialized methods for financial operations
- 🧪 **Fully Tested**: Comprehensive test coverage
- 🛡️ **Type Safe**: Full TypeScript support
- ⚡ **High Performance**: Optimized for production use

## Installation

```bash
npm install @finance-manager/ai
```

## Quick Start

```typescript
import { createAIService, FinancialAIService } from '@finance-manager/ai';

// Create AI service with automatic provider selection
const aiService = createAIService();

// Create specialized financial AI service
const financialAI = new FinancialAIService(aiService);

// Analyze a transaction
const analysis = await financialAI.analyzeTransaction(transaction);
console.log(analysis);

// Categorize an expense
const category = await financialAI.categorizeExpense(
  'Office supplies from Staples',
  25.99,
  'Staples'
);
console.log(category); // { category: 'Office Supplies', confidence: 0.95 }
```

## Configuration

### Environment Variables

Set these environment variables to enable different AI providers:

```bash
# OpenRouter (recommended for production)
OPENROUTER_API_KEY=your_openrouter_api_key

# Cloudflare AI (free tier available)
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### Custom Configuration

```typescript
import { createAIService } from '@finance-manager/ai';

const aiService = createAIService({
  primary: {
    provider: 'openrouter',
    modelId: 'anthropic/claude-3.5-sonnet',
    apiKey: 'your-api-key',
    maxTokens: 4096,
    temperature: 0.1
  },
  fallback: {
    provider: 'cloudflare',
    modelId: '@cf/meta/llama-2-7b-chat-int8',
    maxTokens: 2048,
    temperature: 0.1
  }
});
```

## API Reference

### Core AI Service

#### `createAIService(config?)`

Creates a new AI service instance with automatic provider selection and fallback.

```typescript
const aiService = createAIService({
  primary: {
    provider: 'openrouter',
    modelId: 'gpt-4',
    apiKey: 'your-key'
  }
});
```

#### `aiService.generateText(messages, options?)`

Generate text using AI with automatic fallback and retry.

```typescript
const response = await aiService.generateText([
  { role: 'user', content: 'Analyze this financial data...' }
]);
console.log(response.content);
```

#### `aiService.generateStream(messages, options?)`

Generate streaming text responses.

```typescript
for await (const chunk of aiService.generateStream(messages)) {
  if (chunk.done) break;
  console.log(chunk.delta);
}
```

#### `aiService.getProvidersHealth()`

Check the health status of all configured providers.

```typescript
const health = await aiService.getProvidersHealth();
console.log(health); // { openrouter: { available: true }, cloudflare: { available: false, error: '...' } }
```

### Financial AI Service

#### `new FinancialAIService(aiService)`

Creates a specialized financial AI service.

```typescript
const financialAI = new FinancialAIService(aiService);
```

#### `analyzeTransaction(transaction)`

Analyze a financial transaction for accuracy and compliance.

```typescript
const analysis = await financialAI.analyzeTransaction({
  id: '123',
  date: '2024-01-15',
  description: 'Office supplies',
  entries: [...]
});

console.log(analysis);
// {
//   analysis: 'Transaction appears complete and follows double-entry principles...',
//   confidence: 0.92,
//   suggestions: ['Add receipt attachment'],
//   warnings: []
// }
```

#### `categorizeExpense(description, amount, merchant?, categories?)`

Automatically categorize expenses using AI.

```typescript
const category = await financialAI.categorizeExpense(
  'Lunch with client at restaurant',
  45.67,
  'The Bistro',
  ['Meals & Entertainment', 'Travel', 'Office Supplies']
);

console.log(category);
// {
//   category: 'Meals & Entertainment',
//   subcategory: 'Client Meetings',
//   confidence: 0.94
// }
```

#### `generateInsights(data)`

Generate financial insights and recommendations.

```typescript
const insights = await financialAI.generateInsights({
  transactions: recentTransactions,
  accounts: chartOfAccounts,
  timeframe: 'Q1 2024',
  context: 'Small business quarterly review'
});

console.log(insights.analysis);
console.log(insights.suggestions);
```

#### `checkCompliance(data, regulations?)`

Check financial data for compliance issues.

```typescript
const compliance = await financialAI.checkCompliance(
  transactionData,
  ['SOX', 'GAAP', 'Tax Code']
);

console.log(compliance.warnings); // Potential compliance issues
```

#### `generateReportSummary(reportData, reportType)`

Generate executive summaries for financial reports.

```typescript
const summary = await financialAI.generateReportSummary(
  balanceSheetData,
  'balance_sheet'
);

console.log(summary); // Executive summary of the balance sheet
```

#### `classifyDocument(ocrResult)`

Classify financial documents from OCR results.

```typescript
const classification = await financialAI.classifyDocument({
  text: 'RECEIPT\nTarget Store...',
  confidence: 0.95
});

console.log(classification);
// {
//   type: 'receipt',
//   confidence: 0.92,
//   subtype: 'retail_purchase',
//   extractedFields: { merchant: 'Target', amount: 45.67 }
// }
```

#### `extractDocumentData(ocrResult, documentType?)`

Extract structured data from financial documents.

```typescript
const extractedData = await financialAI.extractDocumentData(
  ocrResult,
  'invoice'
);

console.log(extractedData);
// {
//   vendor: 'ABC Supplies Inc.',
//   date: '2024-01-15',
//   totalAmount: 156.78,
//   lineItems: [...],
//   taxAmount: 12.54
// }
```

#### `generateTransactionEntries(description, amount, accounts)`

Generate double-entry transaction entries from natural language.

```typescript
const entries = await financialAI.generateTransactionEntries(
  'Purchased office supplies with company credit card',
  120.50,
  availableAccounts
);

console.log(entries);
// [
//   { accountId: 1001, description: 'Office supplies', debitAmount: 120.50, creditAmount: 0 },
//   { accountId: 2001, description: 'Credit card payment', debitAmount: 0, creditAmount: 120.50 }
// ]
```

## Supported AI Providers

### OpenRouter

- **Best for**: Production use, latest models, high accuracy
- **Models**: GPT-4, Claude 3.5, Gemini Flash, and more
- **Cost**: Pay-per-use pricing
- **Setup**: Requires API key from [OpenRouter](https://openrouter.ai)

```typescript
{
  provider: 'openrouter',
  modelId: 'anthropic/claude-3.5-sonnet',
  apiKey: 'your-openrouter-key'
}
```

### Cloudflare AI

- **Best for**: Development, cost-conscious deployments, Cloudflare Workers
- **Models**: Llama 2, Gemma, Code Llama
- **Cost**: Generous free tier, then affordable pricing
- **Setup**: Works in Cloudflare Workers or with API token

```typescript
{
  provider: 'cloudflare',
  modelId: '@cf/meta/llama-2-7b-chat-int8',
  accountId: 'your-account-id',
  apiToken: 'your-api-token'
}
```

## Error Handling

The AI service includes comprehensive error handling:

```typescript
import { AIServiceError, AIProviderError, AIRateLimitError } from '@finance-manager/ai';

try {
  const response = await aiService.generateText(messages);
} catch (error) {
  if (error instanceof AIRateLimitError) {
    console.log(`Rate limited. Retry after: ${error.retryAfter}ms`);
  } else if (error instanceof AIProviderError) {
    console.log(`Provider ${error.provider} failed: ${error.message}`);
  } else if (error instanceof AIServiceError) {
    console.log(`Service error: ${error.message}`);
  }
}
```

## Best Practices

### 1. Use Fallback Providers

Always configure a fallback provider for production deployments:

```typescript
const aiService = createAIService({
  primary: {
    provider: 'openrouter',
    modelId: 'anthropic/claude-3.5-sonnet',
    apiKey: process.env.OPENROUTER_API_KEY
  },
  fallback: {
    provider: 'cloudflare',
    modelId: '@cf/meta/llama-2-7b-chat-int8'
  }
});
```

### 2. Monitor Provider Health

Regularly check provider health in production:

```typescript
const health = await aiService.getProvidersHealth();
if (!health.primary?.available) {
  console.warn('Primary AI provider is unavailable');
}
```

### 3. Handle Rate Limits Gracefully

Implement proper rate limit handling:

```typescript
async function generateWithRetry(messages: AIMessage[], maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await aiService.generateText(messages);
    } catch (error) {
      if (error instanceof AIRateLimitError && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, error.retryAfter || 1000));
        continue;
      }
      throw error;
    }
  }
}
```

### 4. Use Appropriate Temperatures

- **Financial Analysis**: 0.05-0.1 (very low for accuracy)
- **Categorization**: 0.1 (low for consistency)
- **Insights**: 0.2-0.3 (medium for creativity)
- **Report Summaries**: 0.2 (balanced)

### 5. Validate AI Responses

Always validate AI responses in financial contexts:

```typescript
const analysis = await financialAI.analyzeTransaction(transaction);

if (analysis.confidence < 0.8) {
  console.warn('Low confidence analysis, manual review recommended');
}

if (analysis.warnings.length > 0) {
  console.log('Potential issues found:', analysis.warnings);
}
```

## Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 