# Financial Data Assistant - Product Requirements Document

## Executive Summary

The Financial Data Assistant is an intelligent, user-friendly system designed to help beginners, startups, small businesses, and enterprises manage their financial data with confidence. It combines multi-format data ingestion, intelligent validation, standardization, and powerful insight generation to create a comprehensive financial management experience.

## Core Objectives

### 1. User Experience First
- Design interactions for users without accounting expertise
- Use plain language instead of jargon
- Provide learning-by-doing experiences
- Make the platform intuitive and approachable

### 2. Data Quality & Standardization
- Accept data from Excel/CSV uploads, manual UI input, and API integrations
- Intelligently restructure non-standard formats into standardized financial structures
- Validate all incoming data against standard formats (GL, AP, AR, Inventory, Payroll)
- Flag missing required fields with contextual guidance
- Suggest corrections for common errors
- Maintain full audit trail of transformations

### 3. Intelligent Warnings & Guidance
- Detect and flag unusual patterns (revenue spikes, duplicate entries, anomalies)
- Provide contextual warnings before data commit
- Offer actionable recommendations
- Include educational tooltips
- Use progressive enforcement (warn first, enforce only where necessary)

### 4. Insight Generation
- Generate real-time dashboards with key metrics
- Identify trends and anomalies automatically
- Forecast cash flow, revenue, expenses
- Highlight top opportunities and risks
- Segment data by cost center, project, or custom dimensions
- Provide actionable recommendations

### 5. Seamless Integration
- Support marketplace integrations (tax tools, payroll, CRM, etc.)
- Provide clear data mapping and sync status
- Handle integration errors gracefully
- Suggest relevant integrations based on user profile

## Technical Requirements

### Feature 1: Multi-Format Data Ingestion Engine

**Description**: Accept and process financial data from multiple sources with intelligent format detection and mapping.

**Requirements**:
- Support Excel (.xlsx, .xls), CSV, and JSON uploads
- Automatic column detection and mapping
- Preview functionality before import
- Batch processing for large files
- Progress tracking for uploads
- Support for common spreadsheet structures
- Handle merged cells, headers, and metadata

**API Endpoints**:
- POST /api/data/upload - Upload file
- POST /api/data/preview - Preview file structure
- POST /api/data/import - Confirm and import data
- GET /api/data/import/{id} - Track import status

**Data Models**:
```typescript
interface DataUpload {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  detectedFormat: string;
  rowCount: number;
  columnMappings: ColumnMapping[];
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  dataType: string;
  sampleValues: string[];
}
```

### Feature 2: Intelligent Data Restructuring & Standardization

**Description**: Transform non-standard data formats into standardized financial structures.

**Requirements**:
- Recognize common non-standard formats
- Map to standard structures (GL, AP, AR, Inventory, Payroll)
- Suggest missing fields
- Auto-fill based on historical patterns
- Preserve original data in audit trail
- Support custom field mapping rules
- Handle multi-currency data

**Supported Standard Formats**:
- General Ledger (GL)
- Accounts Payable (AP)
- Accounts Receivable (AR)
- Inventory
- Payroll
- Budget
- Project Accounting

### Feature 3: Smart Validation & Warning System

**Description**: Proactively detect issues, inconsistencies, and potential problems.

**Requirements**:
- Real-time validation during data entry
- Missing field detection
- Duplicate detection
- Anomaly detection (3σ outliers)
- Balance validation
- Date range validation
- Category consistency checking
- Vendor/customer validation
- Amount reasonableness checks

**Warning Types**:
- 🚨 **Critical**: Must be resolved before saving
- ⚠️ **Warning**: Should be reviewed but can proceed
- ℹ️ **Info**: Helpful suggestion or tip
- ✨ **Opportunity**: Potential optimization

**API Endpoints**:
- POST /api/validation/check - Validate data
- GET /api/warnings - List active warnings
- PUT /api/warnings/{id}/dismiss - Dismiss warning
- POST /api/validation/rules - Create custom validation rule

### Feature 4: Insight Generation Engine

**Description**: Generate real-time financial insights, forecasts, and recommendations.

**Requirements**:
- Real-time dashboard metrics
- Cash flow forecasting (30/60/90 days)
- Revenue trend analysis
- Expense categorization analysis
- Vendor concentration risk analysis
- Budget vs actual comparison
- KPI tracking
- Anomaly highlighting
- Actionable recommendations

**Key Metrics**:
- Revenue (current + growth rate)
- Expenses (current + categories)
- Net Profit
- Burn Rate
- Cash Position
- Days Cash Remaining
- Quick Ratio
- Current Ratio
- Debt-to-Equity Ratio

**API Endpoints**:
- GET /api/insights/dashboard - Main dashboard data
- GET /api/insights/forecast - Cash flow forecast
- GET /api/insights/trends - Trend analysis
- GET /api/insights/recommendations - AI recommendations
- GET /api/insights/anomalies - Detected anomalies

### Feature 5: Interactive User Experience Layer

**Description**: Beginner-friendly UI with learning features and progressive disclosure.

**Requirements**:
- Plain language throughout
- Contextual help tooltips
- Inline validation messages
- Progress indicators
- Smart defaults
- Example data
- Guided workflows
- "Learn More" expandable sections
- 2-minute tutorial videos
- Searchable help center

**UI Components**:
- Data upload wizard
- Smart form with auto-suggestions
- Warning modal with action buttons
- Insight cards with drill-down
- Onboarding checklist
- Interactive dashboard
- Customizable widgets

### Feature 6: Integration Marketplace Framework

**Description**: Extensible plugin system for third-party integrations.

**Requirements**:
- OAuth 2.0 support
- API key management
- Webhook endpoints
- Data mapping configuration
- Sync status dashboard
- Error handling and retry logic
- Integration catalog
- Review and rating system

**Integration Types**:
- Tax software (e.g., Indonesian tax tools)
- Payroll systems
- Banking APIs
- CRM systems
- E-commerce platforms
- Payment gateways

**API Endpoints**:
- GET /api/integrations - List available integrations
- POST /api/integrations/{id}/connect - Connect integration
- GET /api/integrations/{id}/status - Check sync status
- POST /api/integrations/{id}/sync - Trigger manual sync
- DELETE /api/integrations/{id}/disconnect - Disconnect

### Feature 7: Tiered Feature System

**Description**: Implement 4-tier SaaS model with progressive feature access.

**Tiers**:

1. **Free (Starter)**:
   - Manual data entry (100 transactions/month)
   - Basic standardization (GL, AP, AR only)
   - Simple warnings (missing fields only)
   - Read-only demo dashboards
   - No integrations

2. **Pro (Small Business)**:
   - Excel uploads (500 transactions/month)
   - Full standardization (add Inventory, Payroll, Projects)
   - Smart warnings (anomalies, best practices)
   - Basic insights (dashboards, trend analysis)
   - 2 integrations (limited sync)

3. **Business (Growing Company)**:
   - Unlimited uploads & entries
   - All data types + custom dimensions
   - Proactive insights (forecasting, anomalies, recommendations)
   - Unlimited integrations
   - API access
   - Priority support

4. **Enterprise (Large Organization)**:
   - Everything in Business +
   - Multi-entity consolidation
   - Advanced compliance (audit trails, RBAC)
   - Custom integrations & data models
   - Dedicated support & training
   - SLA guarantees

## Technical Architecture

### Stack
- Frontend: Astro 5 + React 19 + Tailwind CSS + Radix UI
- Backend: Cloudflare Workers + Hono
- Database: Cloudflare D1 (SQLite)
- Storage: Cloudflare R2
- AI: Cloudflare AI + OpenRouter
- ORM: Drizzle
- File Parsing: xlsx, papaparse
- Validation: Zod

### Database Schema Additions

```sql
-- Data imports tracking
CREATE TABLE data_imports (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL,
  detected_format TEXT,
  row_count INTEGER,
  imported_count INTEGER,
  error_count INTEGER,
  created_at DATETIME NOT NULL,
  completed_at DATETIME,
  metadata TEXT -- JSON
);

-- Column mapping configurations
CREATE TABLE column_mappings (
  id TEXT PRIMARY KEY,
  import_id TEXT NOT NULL,
  source_column TEXT NOT NULL,
  target_field TEXT NOT NULL,
  confidence REAL NOT NULL,
  data_type TEXT NOT NULL,
  transformation TEXT, -- JSON rules
  created_at DATETIME NOT NULL,
  FOREIGN KEY (import_id) REFERENCES data_imports(id)
);

-- Validation warnings
CREATE TABLE validation_warnings (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  import_id TEXT,
  transaction_id TEXT,
  warning_type TEXT NOT NULL, -- 'critical', 'warning', 'info', 'opportunity'
  category TEXT NOT NULL, -- 'missing_field', 'duplicate', 'anomaly', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_action TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'dismissed', 'resolved'
  created_at DATETIME NOT NULL,
  resolved_at DATETIME
);

-- Insights cache
CREATE TABLE insights_cache (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON
  generated_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_entity_type (entity_id, insight_type)
);

-- Integration configurations
CREATE TABLE integrations (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  integration_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'connected', 'error', 'disconnected'
  config TEXT NOT NULL, -- JSON encrypted config
  last_sync_at DATETIME,
  next_sync_at DATETIME,
  error_message TEXT,
  created_at DATETIME NOT NULL
);

-- User tier tracking
CREATE TABLE user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL, -- 'free', 'pro', 'business', 'enterprise'
  status TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  expires_at DATETIME,
  transaction_limit INTEGER,
  transaction_count INTEGER DEFAULT 0,
  integration_limit INTEGER
);
```

### AI Prompts

**Data Mapping Prompt**:
```text
You are a financial data mapping expert. Analyze the provided column headers and sample data to map them to standard financial fields.

Column headers: [...]
Sample data: [...]

Standard fields: date, description, amount, category, vendor, account_code, debit, credit, currency

Respond with JSON:
{
  "mappings": [
    {"source": "column_name", "target": "standard_field", "confidence": 0.95}
  ],
  "warnings": ["Any ambiguities or issues"],
  "suggestions": ["Recommended improvements"]
}
```

**Anomaly Detection Prompt**:
```text
You are a financial analyst. Analyze this transaction for anomalies compared to historical patterns.

Transaction: [...]
Historical stats: [...]

Detect:
- Unusual amounts (>3σ from mean)
- Unexpected categories
- Duplicate risks
- Missing required fields
- Compliance issues

Respond with JSON:
{
  "is_anomaly": boolean,
  "anomaly_type": "string",
  "confidence": 0.0-1.0,
  "explanation": "string",
  "suggested_action": "string"
}
```

**Insight Generation Prompt**:
```text
You are a financial advisor. Analyze the financial data and provide actionable insights.

Data summary: [...]
Time period: [...]
Previous period comparison: [...]

Generate:
- Top 3 opportunities
- Top 3 risks
- Key trends
- Recommendations

Respond with JSON:
{
  "opportunities": [...],
  "risks": [...],
  "trends": [...],
  "recommendations": [...]
}
```

## Success Metrics

### Data Quality
- % of imported data requiring zero manual correction: >90%
- % of auto-detected column mappings that are correct: >95%
- Average time to import 100 transactions: <30 seconds

### User Experience
- NPS score: >50
- % of users completing first import: >80%
- Average time to first successful import: <5 minutes

### Validation & Warnings
- % of warnings acted upon by users: >60%
- False positive rate: <10%
- Critical error prevention rate: >95%

### Insights
- % of users accessing insights weekly: >70%
- Average insights viewed per session: >5
- % of recommendations acted upon: >40%

### Business
- Free-to-paid conversion rate: >10%
- Monthly churn rate: <5%
- Average revenue per user (ARPU): increasing

## Implementation Priority

### Phase 1: MVP (Current Sprint)
1. Data ingestion engine (Excel/CSV upload)
2. Column mapping with AI suggestions
3. Basic validation system
4. Simple dashboard with key metrics

### Phase 2: Enhanced Validation
1. Anomaly detection
2. Duplicate detection
3. Smart warnings system
4. Educational tooltips

### Phase 3: Insights & Intelligence
1. Cash flow forecasting
2. Trend analysis
3. Recommendation engine
4. Advanced dashboards

### Phase 4: Integrations
1. Integration framework
2. First 3 integrations (Indonesian tax, bank, payroll)
3. Marketplace UI

### Phase 5: Enterprise Features
1. Multi-entity support
2. Advanced RBAC
3. Custom data models
4. SLA guarantees

## Constraints & Assumptions

### Technical Constraints
- Cloudflare Workers: 50ms CPU time per request
- D1 database: 25GB storage limit
- R2 storage: Unlimited but paid
- File upload limit: 100MB per file

### Assumptions
- Users primarily use Excel/CSV for financial data
- Indonesian market is primary target
- Users prefer guided experience over full control
- Monthly subscription model acceptable
- Mobile-first design not required initially

## Open Questions

1. Should we support Google Sheets direct integration?
2. What file size limits are acceptable?
3. How many simultaneous imports should we support?
4. Should we support scheduled imports?
5. What level of customization should Free tier get?

## Appendix

### Example Use Cases

#### Use Case 1: Small Business Owner
- Uploads monthly expense Excel file
- System detects columns, suggests mappings
- Flags 3 missing GL codes
- Suggests codes based on vendor names
- Imports 47 expenses
- Dashboard shows spending spike in "Travel"
- Recommends reviewing vendor concentration

#### Use Case 2: Startup Founder
- Manually enters transactions
- Real-time validation warns of unusual amount
- System suggests category based on description
- Dashboard forecasts 18 months runway
- Highlights growing payroll trend
- Recommends diversifying revenue

#### Use Case 3: Enterprise Accountant
- Imports multi-entity consolidated data
- Maps custom fields to standard format
- Reviews anomalies detected by AI
- Approves batch of transactions
- Generates compliance reports
- Exports to tax software integration
