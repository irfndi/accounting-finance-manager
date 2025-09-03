# Finance Manager API Documentation

## Overview

The Finance Manager API provides a comprehensive RESTful interface for managing financial data, including accounts, transactions, budgets, reports, and more. The API is built with Cloudflare Workers, Hono framework, and follows REST principles.

**Base URL:** `https://api.yourdomain.com/api`

**Authentication:** JWT Bearer Token (Authorization: Bearer <token>)

**Content-Type:** application/json

## API Structure

The API is organized into the following modules:

- **Authentication** (`/api/auth`) - User authentication and session management
- **Accounts** (`/api/accounts`) - Chart of accounts management
- **Categories** (`/api/categories`) - Transaction categories management
- **Budgets** (`/api/budgets`) - Budget planning and tracking
- **Categorization** (`/api/categorization`) - AI-powered transaction categorization
- **Notifications** (`/api/notifications`) - Email notifications and alerts
- **Transactions** (`/api/transactions`) - Financial transaction management
- **Reports** (`/api/reports`) - Financial reporting
- **Uploads** (`/api/uploads`) - File upload and document management
- **Vectorize** (`/api/vectorize`) - Document embeddings and semantic search

## Authentication

All API endpoints (except registration and login) require authentication via JWT bearer token.

### Headers
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

## API Endpoints

### 1. Authentication (`/api/auth`)

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "company": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Corp",
    "isActive": true,
    "emailVerified": false
  },
  "message": "User registered successfully"
}
```

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

#### POST `/api/auth/logout`
Invalidate current session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/profile`
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Corp",
    "isActive": true,
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-01T12:00:00Z"
  }
}
```

#### PUT `/api/auth/profile`
Update user profile.

**Request Body:**
```json
{
  "name": "John Smith",
  "company": "New Company"
}
```

#### PUT `/api/auth/password`
Change user password.

**Request Body:**
```json
{
  "currentPassword": "currentPassword",
  "newPassword": "newSecurePassword123"
}
```

#### GET `/api/auth/validate`
Validate current JWT token.

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "user_id",
      "email": "user@example.com"
    }
  }
}
```

### 2. Accounts (`/api/accounts`)

#### GET `/api/accounts`
List all accounts with filtering options.

**Query Parameters:**
- `type` (optional): Filter by account type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- `active` (optional): Filter by active status (true/false)
- `parent` (optional): Filter by parent account ID
- `entityId` (optional): Filter by entity ID

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": 1,
        "code": "1000",
        "name": "Cash",
        "type": "ASSET",
        "description": "Primary cash account",
        "normalBalance": "DEBIT",
        "currentBalance": 10000.00,
        "isActive": true,
        "allowTransactions": true,
        "accountingInfo": {
          "canHaveChildren": true,
          "expectedNormalBalance": "DEBIT",
          "isBalanceSheet": true,
          "isIncomeStatement": false
        }
      }
    ],
    "count": 1,
    "filters": {
      "type": "ASSET",
      "active": "true"
    }
  }
}
```

#### GET `/api/accounts/:id`
Get specific account by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "account": {
      "id": 1,
      "code": "1000",
      "name": "Cash",
      "type": "ASSET",
      "description": "Primary cash account",
      "normalBalance": "DEBIT",
      "currentBalance": 10000.00,
      "isActive": true,
      "children": [],
      "accountingInfo": {
        "canHaveChildren": true,
        "expectedNormalBalance": "DEBIT",
        "isBalanceSheet": true,
        "isIncomeStatement": false,
        "hasChildren": false,
        "childrenCount": 0
      }
    }
  }
}
```

#### POST `/api/accounts`
Create new account.

**Request Body:**
```json
{
  "code": "1010",
  "name": "Petty Cash",
  "description": "Small cash expenses",
  "type": "ASSET",
  "normalBalance": "DEBIT",
  "isActive": true,
  "allowTransactions": true
}
```

#### PUT `/api/accounts/:id`
Update existing account.

**Request Body:**
```json
{
  "name": "Petty Cash Fund",
  "description": "Updated description"
}
```

#### DELETE `/api/accounts/:id`
Delete account (only if no transactions exist).

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### 3. Categories (`/api/categories`)

#### GET `/api/categories`
List all categories with filtering.

**Query Parameters:**
- `parentId` (optional): Filter by parent category ID
- `type` (optional): Filter by category type (INCOME, EXPENSE, TRANSFER)
- `active` (optional): Filter by active status (true/false)
- `includeStats` (optional): Include category statistics (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Food & Dining",
        "type": "EXPENSE",
        "description": "Food and dining expenses",
        "color": "#FF5733",
        "icon": "🍔",
        "isActive": true,
        "allowSubcategories": true,
        "defaultBudgetAmount": 500.00,
        "budgetPeriod": "monthly"
      }
    ]
  }
}
```

#### GET `/api/categories/tree`
Get hierarchical category tree.

**Response:**
```json
{
  "success": true,
  "data": {
    "tree": [
      {
        "id": 1,
        "name": "Expenses",
        "type": "EXPENSE",
        "children": [
          {
            "id": 2,
            "name": "Food & Dining",
            "type": "EXPENSE",
            "children": []
          }
        ]
      }
    ]
  }
}
```

#### GET `/api/categories/:id`
Get specific category with details.

**Response:**
```json
{
  "success": true,
  "data": {
    "category": {
      "id": 1,
      "name": "Food & Dining",
      "type": "EXPENSE",
      "description": "Food and dining expenses",
      "children": [],
      "stats": [
        {
          "period": "2024-01",
          "totalAmount": 450.00,
          "transactionCount": 25
        }
      ]
    }
  }
}
```

#### POST `/api/categories`
Create new category.

**Request Body:**
```json
{
  "name": "Transportation",
  "description": "Transportation expenses",
  "type": "EXPENSE",
  "color": "#3498db",
  "icon": "🚗",
  "defaultBudgetAmount": 300.00,
  "budgetPeriod": "monthly"
}
```

#### PUT `/api/categories/:id`
Update category.

**Request Body:**
```json
{
  "name": "Transport & Fuel",
  "color": "#2980b9"
}
```

#### DELETE `/api/categories/:id`
Delete category (only if no subcategories or transactions exist).

### 4. Budgets (`/api/budgets`)

#### GET `/api/budgets/periods`
List budget periods.

**Query Parameters:**
- `type` (optional): Filter by period type (monthly, quarterly, yearly)
- `fiscalYear` (optional): Filter by fiscal year
- `active` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Q1 2024",
      "type": "quarterly",
      "startDate": "2024-01-01",
      "endDate": "2024-03-31",
      "fiscalYear": 2024,
      "isActive": true
    }
  ]
}
```

#### POST `/api/budgets/periods`
Create new budget period.

**Request Body:**
```json
{
  "name": "Q2 2024",
  "type": "quarterly",
  "startDate": "2024-04-01",
  "endDate": "2024-06-30",
  "fiscalYear": 2024,
  "description": "Second quarter budget"
}
```

#### GET `/api/budgets`
List budgets with filtering.

**Query Parameters:**
- `periodId` (optional): Filter by budget period ID
- `categoryId` (optional): Filter by category ID
- `status` (optional): Filter by status (draft, active, locked, archived)
- `includeAllocations` (optional): Include budget allocations (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "budget": {
        "id": 1,
        "name": "Monthly Expenses",
        "periodId": 1,
        "plannedAmount": 2000.00,
        "status": "active",
        "budgetType": "EXPENSE"
      },
      "period": {
        "id": 1,
        "name": "January 2024",
        "type": "monthly"
      }
    }
  ]
}
```

#### GET `/api/budgets/:id`
Get specific budget with details.

**Response:**
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": 1,
      "name": "Monthly Expenses",
      "plannedAmount": 2000.00,
      "status": "active"
    },
    "allocations": [
      {
        "allocation": {
          "id": 1,
          "allocatedAmount": 500.00,
          "allocatedPercent": 25.0
        },
        "category": {
          "id": 1,
          "name": "Food & Dining"
        }
      }
    ],
    "revisions": []
  }
}
```

#### POST `/api/budgets`
Create new budget.

**Request Body:**
```json
{
  "periodId": 1,
  "name": "Marketing Budget",
  "description": "Monthly marketing expenses",
  "totalAmount": 1000.00,
  "status": "draft",
  "budgetType": "EXPENSE"
}
```

#### PUT `/api/budgets/:id`
Update budget.

**Request Body:**
```json
{
  "name": "Updated Marketing Budget",
  "totalAmount": 1200.00,
  "status": "active"
}
```

#### POST `/api/budgets/:id/allocations`
Create budget allocation.

**Request Body:**
```json
{
  "categoryId": 1,
  "allocatedAmount": 500.00,
  "allocatedPercent": 50.0,
  "description": "Food and dining allocation"
}
```

#### GET `/api/budgets/summary`
Get budget summary and analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "budgetSummary": [
      {
        "totalBudgets": 5,
        "totalAmount": 5000.00,
        "status": "active"
      }
    ],
    "allocationSummary": [
      {
        "totalAllocations": 10,
        "totalAllocated": 5000.00,
        "categoryId": 1
      }
    ]
  }
}
```

### 5. Categorization (`/api/categorization`)

#### POST `/api/categorization/suggest`
Generate AI-powered categorization suggestion.

**Request Body:**
```json
{
  "description": "Starbucks coffee",
  "amount": 5.50,
  "merchant": "Starbucks",
  "existingCategories": ["Food & Dining", "Coffee", "Restaurants"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestionId": "cat_1640995200000_abc123",
    "category": "Food & Dining",
    "subcategory": "Coffee",
    "accountId": "1",
    "confidence": 0.95,
    "requiresApproval": false
  }
}
```

#### GET `/api/categorization/pending`
Get pending categorization suggestions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_1640995200000_abc123",
      "description": "Starbucks coffee",
      "amount": 5.50,
      "suggestedCategory": "Food & Dining",
      "confidence": 0.95,
      "timestamp": 1640995200000,
      "status": "pending"
    }
  ]
}
```

#### POST `/api/categorization/approve`
Approve or reject categorization suggestion.

**Request Body:**
```json
{
  "suggestionId": "cat_1640995200000_abc123",
  "approved": true,
  "accountId": "1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestionId": "cat_1640995200000_abc123",
    "status": "approved",
    "category": "Food & Dining",
    "accountId": "1"
  }
}
```

#### GET `/api/categorization/history`
Get categorization history and analytics.

**Query Parameters:**
- `limit` (optional): Maximum number of results (default: 50)
- `status` (optional): Filter by status (approved, rejected, pending)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [...],
    "analytics": {
      "total": 100,
      "approved": 85,
      "rejected": 10,
      "pending": 5,
      "averageConfidence": 0.92,
      "topCategories": [
        {"category": "Food & Dining", "count": 25},
        {"category": "Transportation", "count": 15}
      ]
    }
  }
}
```

#### DELETE `/api/categorization/suggestion/:id`
Delete categorization suggestion.

### 6. Notifications (`/api/notifications`)

#### POST `/api/notifications/send`
Send single email notification.

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Transaction Alert",
  "body": "A new transaction has been recorded",
  "isHtml": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

#### POST `/api/notifications/send-bulk`
Send bulk email notifications.

**Request Body:**
```json
{
  "recipients": [
    {
      "email": "user1@example.com",
      "personalizations": {
        "name": "John Doe"
      }
    },
    {
      "email": "user2@example.com",
      "personalizations": {
        "name": "Jane Smith"
      }
    }
  ],
  "template": {
    "subject": "Monthly Report - {{name}}",
    "htmlBody": "<h1>Hello {{name}}</h1><p>Here's your monthly report</p>"
  },
  "from": "noreply@yourdomain.com",
  "fromName": "Finance Manager"
}
```

**Response:**
```json
{
  "success": true,
  "totalSent": 2,
  "totalFailed": 0,
  "results": [
    {
      "email": "user1@example.com",
      "success": true,
      "messageId": "msg_id_1"
    },
    {
      "email": "user2@example.com",
      "success": true,
      "messageId": "msg_id_2"
    }
  ]
}
```

#### POST `/api/notifications/send-template/:templateType`
Send predefined email template.

**Available Template Types:**
- `transaction-alert`
- `budget-warning`
- `monthly-report`
- `account-activity`

**Request Body:**
```json
{
  "to": "user@example.com",
  "data": {
    "transaction": {
      "type": "expense",
      "amount": 25.50,
      "date": "2024-01-01",
      "description": "Lunch"
    },
    "account": {
      "name": "Checking Account"
    }
  }
}
```

#### GET `/api/notifications/templates`
Get available email templates.

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "name": "transaction-alert",
      "description": "Notification for new transactions"
    },
    {
      "name": "budget-warning",
      "description": "Alert when budget thresholds are exceeded"
    },
    {
      "name": "monthly-report",
      "description": "Comprehensive monthly financial summary"
    }
  ]
}
```

#### POST `/api/notifications/send-template`
Send template-based email.

**Request Body:**
```json
{
  "to": "user@example.com",
  "template": "transaction-alert",
  "data": {
    "date": "2024-01-01",
    "description": "Grocery shopping",
    "amount": "$85.50",
    "account": "Checking Account",
    "category": "Food & Dining"
  }
}
```

#### POST `/api/notifications/test`
Test email configuration.

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

### 7. Transactions (`/api/transactions`)

#### GET `/api/transactions`
List transactions with filtering and pagination.

**Query Parameters:**
- `accountId` (optional): Filter by account ID
- `categoryId` (optional): Filter by category ID
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `type` (optional): Filter by transaction type (income, expense, transfer)
- `status` (optional): Filter by status (pending, posted, void)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "description": "Grocery shopping",
        "amount": 85.50,
        "type": "expense",
        "date": "2024-01-01",
        "accountId": 1,
        "categoryId": 1,
        "status": "posted",
        "reference": "INV-001",
        "metadata": {
          "merchant": "Whole Foods",
          "location": "New York"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### GET `/api/transactions/:id`
Get specific transaction by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "txn_123",
      "description": "Grocery shopping",
      "amount": 85.50,
      "type": "expense",
      "date": "2024-01-01",
      "accountId": 1,
      "categoryId": 1,
      "status": "posted",
      "reference": "INV-001",
      "journalEntries": [
        {
          "id": "je_123",
          "accountId": 1,
          "debitAmount": 85.50,
          "creditAmount": 0.00
        },
        {
          "id": "je_124",
          "accountId": 2,
          "debitAmount": 0.00,
          "creditAmount": 85.50
        }
      ]
    }
  }
}
```

#### POST `/api/transactions`
Create new transaction with double-entry bookkeeping.

**Request Body:**
```json
{
  "description": "Grocery shopping",
  "amount": 85.50,
  "type": "expense",
  "date": "2024-01-01",
  "accountId": 1,
  "categoryId": 1,
  "reference": "INV-001",
  "metadata": {
    "merchant": "Whole Foods",
    "location": "New York"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "txn_123",
      "description": "Grocery shopping",
      "amount": 85.50,
      "type": "expense",
      "status": "posted",
      "journalEntries": [
        {
          "id": "je_123",
          "accountId": 1,
          "debitAmount": 85.50,
          "creditAmount": 0.00
        },
        {
          "id": "je_124",
          "accountId": 2,
          "debitAmount": 0.00,
          "creditAmount": 85.50
        }
      ]
    },
    "message": "Transaction created successfully"
  }
}
```

#### PUT `/api/transactions/:id`
Update existing transaction.

**Request Body:**
```json
{
  "description": "Updated grocery shopping",
  "amount": 90.00,
  "categoryId": 2
}
```

#### DELETE `/api/transactions/:id`
Delete transaction (only if not posted).

### 8. Reports (`/api/reports`)

#### GET `/api/reports/trial-balance`
Generate trial balance report.

**Query Parameters:**
- `asOfDate` (optional): Report as of date (ISO format, default: today)
- `format` (optional): Export format (json, csv, pdf, excel)

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {
      "title": "Trial Balance",
      "asOfDate": "2024-01-01",
      "generatedAt": "2024-01-01T12:00:00Z",
      "accounts": [
        {
          "id": 1,
          "code": "1000",
          "name": "Cash",
          "type": "ASSET",
          "normalBalance": "DEBIT",
          "debitBalance": 10000.00,
          "creditBalance": 0.00,
          "netBalance": 10000.00
        }
      ],
      "totals": {
        "totalDebits": 50000.00,
        "totalCredits": 50000.00,
        "isBalanced": true
      }
    }
  }
}
```

#### GET `/api/reports/balance-sheet`
Generate balance sheet report.

**Query Parameters:**
- `asOfDate` (optional): Report as of date (ISO format, default: today)
- "format" (optional): Export format (json, csv, pdf, excel)

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {
      "title": "Balance Sheet",
      "asOfDate": "2024-01-01",
      "generatedAt": "2024-01-01T12:00:00Z",
      "assets": {
        "total": 100000.00,
        "accounts": [...]
      },
      "liabilities": {
        "total": 40000.00,
        "accounts": [...]
      },
      "equity": {
        "total": 60000.00,
        "accounts": [...]
      },
      "totals": {
        "totalAssets": 100000.00,
        "totalLiabilitiesAndEquity": 100000.00,
        "isBalanced": true
      }
    }
  }
}
```

#### GET `/api/reports/income-statement`
Generate income statement (P&L) report.

**Query Parameters:**
- `startDate` (optional): Report start date (ISO format)
- `endDate` (optional): Report end date (ISO format)
- `format` (optional): Export format (json, csv, pdf, excel)

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {
      "title": "Income Statement",
      "period": "January 2024",
      "generatedAt": "2024-01-01T12:00:00Z",
      "revenue": {
        "total": 15000.00,
        "accounts": [...]
      },
      "expenses": {
        "total": 8000.00,
        "accounts": [...]
      },
      "netIncome": {
        "amount": 7000.00,
        "percentage": 46.67
      }
    }
  }
}
```

#### GET `/api/reports/cash-flow`
Generate cash flow statement.

**Query Parameters:**
- `startDate` (optional): Report start date (ISO format)
- `endDate` (optional): Report end date (ISO format)
- `format` (optional): Export format (json, csv, pdf, excel)

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {
      "title": "Cash Flow Statement",
      "period": "January 2024",
      "generatedAt": "2024-01-01T12:00:00Z",
      "operatingActivities": {
        "netIncome": 7000.00,
        "adjustments": 2000.00,
        "netCashFromOperations": 9000.00
      },
      "investingActivities": {
        "netCashFromInvesting": -5000.00
      },
      "financingActivities": {
        "netCashFromFinancing": -2000.00
      },
      "netChangeInCash": 2000.00
    }
  }
}
```

#### GET `/api/reports/general-ledger`
Generate general ledger report.

**Query Parameters:**
- `accountId` (optional): Filter by account ID
- `startDate` (optional): Report start date (ISO format)
- `endDate` (optional): Report end date (ISO format)
- `format` (optional): Export format (json, csv, pdf, excel)

### 9. Uploads (`/api/uploads`)

#### POST `/api/uploads`
Upload file with OCR processing.

**Request:** Multipart form data
- `file`: File to upload
- `metadata` (optional): JSON metadata string

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_123",
    "filename": "receipt.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-01-01T12:00:00Z",
    "url": "https://storage.example.com/file_123",
    "ocrData": {
      "text": "Whole Foods Market\n123 Main St\nTotal: $85.50",
      "structuredData": {
        "merchant": "Whole Foods Market",
        "amount": 85.50,
        "date": "2024-01-01",
        "items": [...]
      }
    }
  }
}
```

#### GET `/api/uploads`
List uploaded files with filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `type` (optional): Filter by file type
- `startDate` (optional): Filter by upload start date
- `endDate` (optional): Filter by upload end date

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "fileId": "file_123",
        "filename": "receipt.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg",
        "uploadedAt": "2024-01-01T12:00:00Z",
        "url": "https://storage.example.com/file_123",
        "hasOcrData": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### GET `/api/uploads/:fileId`
Download file by ID.

**Response:** File download with appropriate headers.

#### GET `/api/uploads/:fileId/metadata`
Get file metadata.

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_123",
    "filename": "receipt.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-01-01T12:00:00Z",
    "url": "https://storage.example.com/file_123",
    "metadata": {
      "uploadSource": "web",
      "tags": ["receipt", "grocery"]
    },
    "ocrData": {
      "text": "Whole Foods Market\n123 Main St\nTotal: $85.50",
      "structuredData": {
        "merchant": "Whole Foods Market",
        "amount": 85.50,
        "date": "2024-01-01"
      }
    }
  }
}
```

#### POST `/api/uploads/:fileId/ocr`
Process OCR for uploaded file.

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_123",
    "ocrData": {
      "text": "Whole Foods Market\n123 Main St\nTotal: $85.50",
      "structuredData": {
        "merchant": "Whole Foods Market",
        "amount": 85.50,
        "date": "2024-01-01",
        "confidence": 0.95
      }
    },
    "processingTime": 2500
  }
}
```

#### DELETE `/api/uploads/:fileId`
Delete uploaded file.

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### 10. Vectorize (`/api/vectorize`)

#### POST `/api/vectorize/search`
Perform semantic search across documents.

**Request Body:**
```json
{
  "query": "restaurant receipts from January",
  "topK": 10,
  "threshold": 0.7,
  "filter": {
    "fileType": "receipt"
  },
  "includeChunks": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "restaurant receipts from January",
    "results": [
      {
        "fileId": "file_123",
        "filename": "restaurant_receipt.jpg",
        "similarity": 0.92,
        "matchedText": "Restaurant Name\nJanuary 15, 2024\nTotal: $45.00",
        "ocrData": {...}
      }
    ],
    "totalMatches": 5,
    "threshold": 0.7,
    "processingTime": 1500
  }
}
```

#### POST `/api/vectorize/embed`
Generate embeddings for text content.

**Request Body:**
```json
{
  "fileId": "file_123",
  "text": "Whole Foods Market receipt for groceries",
  "metadata": {
    "source": "ocr",
    "confidence": 0.95
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_123",
    "chunksCreated": 1,
    "textLength": 42
  }
}
```

#### GET `/api/vectorize/document/:fileId`
Get embeddings for a specific document.

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_123",
    "embeddings": [
      {
        "id": "file_123_chunk_0",
        "score": 0.95,
        "metadata": {
          "text": "Whole Foods Market receipt",
          "chunkIndex": 0,
          "totalChunks": 1
        }
      }
    ],
    "totalChunks": 1
  }
}
```

#### DELETE `/api/vectorize/document/:fileId`
Delete embeddings for a specific document.

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_123",
    "deleted": true
  }
}
```

#### GET `/api/vectorize/stats`
Get vectorize service statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 100,
    "totalEmbeddings": 250,
    "averageDocumentSize": 1500,
    "lastUpdated": "2024-01-01T12:00:00Z"
  }
}
```

## Error Handling

The API uses standard HTTP status codes and provides detailed error information:

### Common Error Codes

- `400 Bad Request` - Invalid request parameters or validation errors
- `401 Unauthorized` - Authentication required or invalid token
- `403 Forbidden` - User lacks permission for the requested resource
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Request validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Detailed error message",
  "details": {
    "field": "Specific error details"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General requests:** 100 requests per minute
- **File uploads:** 10 requests per minute
- **OCR processing:** 5 requests per minute
- **AI categorization:** 20 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

The API supports webhooks for real-time notifications:

### Webhook Events

- `transaction.created` - New transaction created
- `transaction.updated` - Transaction updated
- `transaction.deleted` - Transaction deleted
- `budget.exceeded` - Budget limit exceeded
- `account.low_balance` - Account balance below threshold

### Webhook Setup

Contact your administrator to configure webhook endpoints for your account.

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install finance-manager-sdk
```

```typescript
import { FinanceManagerClient } from 'finance-manager-sdk';

const client = new FinanceManagerClient({
  baseURL: 'https://api.yourdomain.com/api',
  token: 'your-jwt-token'
});

// Create transaction
const transaction = await client.transactions.create({
  description: 'Grocery shopping',
  amount: 85.50,
  type: 'expense',
  accountId: 1,
  categoryId: 1
});
```

### Python

```bash
pip install finance-manager-sdk
```

```python
from finance_manager import FinanceManagerClient

client = FinanceManagerClient(
    base_url='https://api.yourdomain.com/api',
    token='your-jwt-token'
)

# Create transaction
transaction = client.transactions.create(
    description='Grocery shopping',
    amount=85.50,
    type='expense',
    account_id=1,
    category_id=1
)
```

## Best Practices

### Authentication
- Store JWT tokens securely
- Refresh tokens before expiration
- Use environment variables for API keys

### Error Handling
- Implement retry logic for rate limits
- Handle validation errors gracefully
- Log errors for debugging

### Performance
- Use pagination for large datasets
- Filter results to reduce payload size
- Cache frequently accessed data

### Security
- Use HTTPS for all requests
- Validate input data
- Sanitize user-generated content

## Support

For API support and questions:

- **Documentation:** [API Documentation](https://docs.yourdomain.com/api)
- **Support Email:** support@yourdomain.com
- **Status Page:** [API Status](https://status.yourdomain.com)

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial API release
- Core authentication and user management
- Transaction management with double-entry bookkeeping
- Account and category management
- Budget planning and tracking
- Financial reporting
- File upload and OCR processing
- AI-powered categorization
- Vector search capabilities

---

*This documentation is for version 1.0.0 of the Finance Manager API.*