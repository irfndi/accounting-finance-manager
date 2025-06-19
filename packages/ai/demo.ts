#!/usr/bin/env tsx

/**
 * Finance Manager AI Service Demo
 * 
 * This demo showcases the AI service capabilities including:
 * - Provider health checking
 * - Transaction analysis
 * - Expense categorization
 * - Financial insights
 * - Document classification
 * - Error handling
 * 
 * To run: npx tsx demo.ts
 */

import { createAIService, FinancialAIService } from './src/index.js';

async function main() {
  console.log('🚀 Finance Manager AI Service Demo\n');

  try {
    // Create AI service with automatic provider selection
    console.log('📡 Creating AI service...');
    const aiService = createAIService();
    
    // Check provider health
    console.log('🏥 Checking provider health...');
    const health = await aiService.getProvidersHealth();
    console.log('Health status:', JSON.stringify(health, null, 2));

    // Create financial AI service
    const financialAI = new FinancialAIService(aiService);

    // Demo 1: Expense Categorization
    console.log('\n💰 Demo 1: Expense Categorization');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const expenseCategories = [
      { description: 'Coffee meeting with potential client', amount: 25.50, merchant: 'Starbucks' },
      { description: 'New laptops for development team', amount: 2499.99, merchant: 'Apple Store' },
      { description: 'Monthly software subscription', amount: 99.00, merchant: 'Adobe' },
      { description: 'Flight to industry conference', amount: 450.00, merchant: 'Delta Airlines' }
    ];

    for (const expense of expenseCategories) {
      try {
        console.log(`\n📝 Categorizing: "${expense.description}" ($${expense.amount})`);
        const category = await financialAI.categorizeExpense(
          expense.description,
          expense.amount,
          expense.merchant
        );
        console.log(`   Category: ${category.category}`);
        if (category.subcategory) {
          console.log(`   Subcategory: ${category.subcategory}`);
        }
        console.log(`   Confidence: ${(category.confidence * 100).toFixed(1)}%`);
      } catch (error) {
        console.error(`   ❌ Failed to categorize: ${error}`);
      }
    }

    // Demo 2: Transaction Analysis
    console.log('\n📊 Demo 2: Transaction Analysis');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const sampleTransaction = {
      id: 'TXN-001',
      date: '2024-01-15',
      description: 'Office equipment purchase',
      entries: [
        {
          id: 'E1',
          accountId: 1500, // Equipment account
          accountName: 'Office Equipment',
          description: 'Purchased desk and chairs',
          debitAmount: 1200,
          creditAmount: 0
        },
        {
          id: 'E2',
          accountId: 1000, // Cash account
          accountName: 'Cash',
          description: 'Payment for equipment',
          debitAmount: 0,
          creditAmount: 1200
        }
      ]
    };

    try {
      console.log('\n🔍 Analyzing transaction...');
      const analysis = await financialAI.analyzeTransaction(sampleTransaction as any);
      console.log(`Analysis: ${analysis.analysis}`);
      console.log(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      
      if (analysis.suggestions.length > 0) {
        console.log('\n💡 Suggestions:');
        analysis.suggestions.forEach((suggestion, i) => {
          console.log(`   ${i + 1}. ${suggestion}`);
        });
      }

      if (analysis.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        analysis.warnings.forEach((warning, i) => {
          console.log(`   ${i + 1}. ${warning}`);
        });
      }
    } catch (error) {
      console.error(`❌ Failed to analyze transaction: ${error}`);
    }

    // Demo 3: Financial Insights
    console.log('\n📈 Demo 3: Financial Insights');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const financialData = {
      timeframe: 'Q1 2024',
      context: 'Small tech startup financial review',
      transactions: [
        { category: 'Revenue', amount: 50000 },
        { category: 'Payroll', amount: -25000 },
        { category: 'Office Rent', amount: -3000 },
        { category: 'Marketing', amount: -8000 },
        { category: 'Equipment', amount: -2000 }
      ]
    };

    try {
      console.log('\n🧠 Generating financial insights...');
      const insights = await financialAI.generateInsights(financialData);
      console.log(`\n📋 Analysis:\n${insights.analysis}`);
      
      if (insights.suggestions.length > 0) {
        console.log('\n💡 Recommendations:');
        insights.suggestions.forEach((suggestion, i) => {
          console.log(`   ${i + 1}. ${suggestion}`);
        });
      }
    } catch (error) {
      console.error(`❌ Failed to generate insights: ${error}`);
    }

    // Demo 4: Document Classification
    console.log('\n📄 Demo 4: Document Classification');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const documentSamples = [
      {
        name: 'Receipt',
        text: `TARGET
Store #1234
123 Main St, Anytown
Date: 01/15/2024
Time: 14:30

Office Supplies    $25.99
Tax               $2.08
TOTAL            $28.07

VISA ****1234     $28.07
Thank you!`
      },
      {
        name: 'Invoice',
        text: `INVOICE
ABC Software Solutions
Invoice #: INV-2024-001
Date: January 15, 2024
Due: February 14, 2024

Bill To:
XYZ Company
456 Business Ave

Description        Qty    Rate      Amount
Web Development     40    $125.00   $5,000.00
Consulting          8     $150.00   $1,200.00

Subtotal:                           $6,200.00
Tax (8.5%):                          $527.00
TOTAL:                              $6,727.00`
      }
    ];

    for (const doc of documentSamples) {
      try {
        console.log(`\n📝 Classifying ${doc.name}...`);
        const classification = await financialAI.classifyDocument({
          text: doc.text,
          confidence: 0.95
        });
        
        console.log(`   Type: ${classification.type}`);
        if (classification.subtype) {
          console.log(`   Subtype: ${classification.subtype}`);
        }
        console.log(`   Confidence: ${(classification.confidence * 100).toFixed(1)}%`);
        
        if (classification.extractedFields && Object.keys(classification.extractedFields).length > 0) {
          console.log('   Extracted fields:', JSON.stringify(classification.extractedFields, null, 4));
        }
      } catch (error) {
        console.error(`   ❌ Failed to classify ${doc.name}: ${error}`);
      }
    }

    // Demo 5: Transaction Entry Generation
    console.log('\n⚖️  Demo 5: Transaction Entry Generation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const sampleAccounts = [
      { id: 1000, code: '1000', name: 'Cash', type: 'ASSET' },
      { id: 1001, code: '1001', name: 'Accounts Receivable', type: 'ASSET' },
      { id: 2000, code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
      { id: 5000, code: '5000', name: 'Office Supplies Expense', type: 'EXPENSE' },
      { id: 5001, code: '5001', name: 'Travel Expense', type: 'EXPENSE' },
      { id: 4000, code: '4000', name: 'Revenue', type: 'REVENUE' }
    ];

    const transactionDescriptions = [
      { description: 'Purchased office supplies with cash', amount: 150.00 },
      { description: 'Received payment from customer', amount: 2500.00 },
      { description: 'Paid business travel expenses', amount: 450.00 }
    ];

    for (const txn of transactionDescriptions) {
      try {
        console.log(`\n📝 Generating entries for: "${txn.description}" ($${txn.amount})`);
        const entries = await financialAI.generateTransactionEntries(
          txn.description,
          txn.amount,
          sampleAccounts as any[]
        );
        
        if (entries.length > 0) {
          console.log('   Generated entries:');
          entries.forEach((entry, i) => {
            const account = sampleAccounts.find(a => a.id === entry.accountId);
            console.log(`     ${i + 1}. ${account?.name || 'Unknown Account'}`);
            if (entry.debitAmount > 0) {
              console.log(`        Debit: $${entry.debitAmount.toFixed(2)}`);
            }
            if (entry.creditAmount > 0) {
              console.log(`        Credit: $${entry.creditAmount.toFixed(2)}`);
            }
          });
          
          // Verify balance
          const totalDebits = entries.reduce((sum, e) => sum + (e.debitAmount || 0), 0);
          const totalCredits = entries.reduce((sum, e) => sum + (e.creditAmount || 0), 0);
          const balanced = Math.abs(totalDebits - totalCredits) < 0.01;
          console.log(`   ✓ Balanced: ${balanced ? 'Yes' : 'No'} (Debits: $${totalDebits.toFixed(2)}, Credits: $${totalCredits.toFixed(2)})`);
        } else {
          console.log('   ⚠️  No entries generated');
        }
      } catch (error) {
        console.error(`   ❌ Failed to generate entries: ${error}`);
      }
    }

    console.log('\n✅ Demo completed successfully!');
    console.log('\n💡 Tips:');
    console.log('   • Set OPENROUTER_API_KEY for production-grade results');
    console.log('   • Use Cloudflare AI for cost-effective development');
    console.log('   • Always validate AI responses in financial contexts');
    console.log('   • Monitor provider health in production deployments');

  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 