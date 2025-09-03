# Finance Manager - API Documentation

## Overview

The Finance Manager API is built on Cloudflare Workers using the Hono framework. It provides a comprehensive set of endpoints for managing financial data, user authentication, and document processing.

**Base URL**: `https://finance-manager.irfandimarsya.workers.dev`  
**API Version**: v1  
**Content-Type**: `application/json`

## Authentication

### Magic Link Authentication

The API uses magic link authentication with JWT tokens for session management.

#### Request Magic Link

```http
POST /api/auth/magic-link
Content-Type: application/json

{
  "email": "user@company.com",
  "redirectUrl": "/dashboard"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Magic link sent to your email"
}
```

#### Verify Magic Link

```http
GET /api/auth/verify?token=<magic_link_token>
```

**Response**:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@company.com",
    "name": "John Doe"
  }
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

**Response**:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Authorization Header

For protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Core API Endpoints

### Health Check

#### Get System Health

```http
GET /health
```

**Response**:

```json
{
  "status": "healthy",
  "environment": "production",
  "timestamp": "2024-12-20T10:30:00Z",
  "worker": "finance-manager",
  "version": "1.0.0"
}
```

### User Management

#### Get Current User

```http
GET /api/user/profile
Authorization: Bearer <jwt_token>
```

**Response**:

```json
{
  "id": "user-uuid",
  "email": "user@company.com",
  "name": "John Doe",
  "entities": [
    {
      "id": "entity-uuid",
      "name": "Acme Corp",
      "role": "admin",
      "currency": "USD"
    }
  ],
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-12-20T10:30:00Z"
}
```

#### Update User Profile

```http
PUT /api/user/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Smith",
  "preferences": {
    "timezone": "America/New_York",
    "dateFormat": "MM/DD/YYYY"
  }
}
```

### Entity Management

#### List Entities

```http
GET /api/entities
Authorization: Bearer <jwt_token>
```

**Response**:

```json
{
  "entities": [
    {
      "id": "entity-uuid",
      "name": "Acme Corp",
      "currency": "USD",
      "role": "admin",
      "settings": {
        "fiscalYearStart": "01-01",
        "accountingMethod": "accrual"
      },
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ]
}
```

#### Create Entity

```http
POST /api/entities
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "New Company LLC",
  "currency": "USD",
  "settings": {
    "fiscalYearStart": "01-01",
    "accountingMethod": "accrual"
  }
}
```

### Chart of Accounts

#### List Accounts

```http
GET /api/accounts?entityId=<entity-uuid>
Authorization: Bearer <jwt_token>
```

**Query Parameters**:

- `entityId` (required): Entity UUID
- `type` (optional): Filter by account type (asset, liability, equity, revenue, expense)
- `active` (optional): Filter by active status (true/false)
- `parentId` (optional): Filter by parent account

**Response**:

```json
{
  "accounts": [
    {
      "id": "account-uuid",
      "code": "1000",
      "name": "Cash",
      "type": "asset",
      "parentId": null,
      "isActive": true,
      "balance": {
        "debit": "15000.00",
        "credit": "0.00",
        "net": "15000.00"
      },
      "children": [
        {
          "id": "sub-account-uuid",
          "code": "1001",
          "name": "Checking Account",
          "type": "asset",
          "parentId": "account-uuid",
          "isActive": true,
          "balance": {
            "debit": "10000.00",
            "credit": "0.00",
            "net": "10000.00"
          }
        }
      ],
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedAt": "2024-12-20T10:30:00Z"
    }
  ]
}
```

#### Create Account

```http
POST /api/accounts
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "entityId": "entity-uuid",
  "code": "1500",
  "name": "Equipment",
  "type": "asset",
  "parentId": null,
  "description": "Office equipment and machinery"
}
```

#### Update Account

```http
PUT /api/accounts/<account-uuid>
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Office Equipment",
  "isActive": true,
  "description": "Updated description"
}
```

#### Delete Account

```http
DELETE /api/accounts/<account-uuid>
Authorization: Bearer <jwt_token>
```

### Transactions

#### List Transactions

```http
GET /api/transactions?entityId=<entity-uuid>
Authorization: Bearer <jwt_token>
```

**Query Parameters**:

- `entityId` (required): Entity UUID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)
- `status` (optional): Filter by status (draft, pending, approved, rejected)
- `accountId` (optional): Filter by account involvement

**Response**:

```json
{
  "transactions": [
    {
      "id": "transaction-uuid",
      "reference": "TXN-2024-001",
      "description": "Office supplies purchase",
      "transactionDate": "2024-12-20",
      "status": "approved",
      "totalAmount": "250.00",
      "entries": [
        {
          "id": "entry-uuid-1",
          "accountId": "expense-account-uuid",
          "accountName": "Office Supplies",
          "debitAmount": "250.00",
          "creditAmount": "0.00",
          "description": "Office supplies expense"
        },
        {
          "id": "entry-uuid-2",
          "accountId": "cash-account-uuid",
          "accountName": "Cash",
          "debitAmount": "0.00",
          "creditAmount": "250.00",
          "description": "Cash payment"
        }
      ],
      "documents": [
        {
          "id": "document-uuid",
          "filename": "receipt-001.pdf",
          "contentType": "application/pdf",
          "fileSize": 245760
        }
      ],
      "createdBy": {
        "id": "user-uuid",
        "name": "John Doe"
      },
      "createdAt": "2024-12-20T10:30:00Z",
      "updatedAt": "2024-12-20T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "totalPages": 3
  }
}
```

#### Create Transaction

```http
POST /api/transactions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "entityId": "entity-uuid",
  "reference": "TXN-2024-002",
  "description": "Client payment received",
  "transactionDate": "2024-12-20",
  "entries": [
    {
      "accountId": "cash-account-uuid",
      "debitAmount": "1500.00",
      "creditAmount": "0.00",
      "description": "Cash received"
    },
    {
      "accountId": "revenue-account-uuid",
      "debitAmount": "0.00",
      "creditAmount": "1500.00",
      "description": "Service revenue"
    }
  ]
}
```

#### Update Transaction

```http
PUT /api/transactions/<transaction-uuid>
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "description": "Updated description",
  "status": "approved"
}
```

#### Delete Transaction

```http
DELETE /api/transactions/<transaction-uuid>
Authorization: Bearer <jwt_token>
```

### Financial Reports

#### Balance Sheet

```http
GET /api/reports/balance-sheet?entityId=<entity-uuid>&asOfDate=2024-12-31
Authorization: Bearer <jwt_token>
```

**Query Parameters**:

- `entityId` (required): Entity UUID
- `asOfDate` (required): Report date (YYYY-MM-DD)

**Response**:

```json
{
  "reportDate": "2024-12-31",
  "entityName": "Acme Corp",
  "currency": "USD",
  "assets": {
    "currentAssets": {
      "cash": "15000.00",
      "accountsReceivable": "8500.00",
      "inventory": "12000.00",
      "total": "35500.00"
    },
    "fixedAssets": {
      "equipment": "25000.00",
      "accumulatedDepreciation": "-5000.00",
      "total": "20000.00"
    },
    "totalAssets": "55500.00"
  },
  "liabilities": {
    "currentLiabilities": {
      "accountsPayable": "4500.00",
      "accruedExpenses": "2000.00",
      "total": "6500.00"
    },
    "longTermLiabilities": {
      "longTermDebt": "15000.00",
      "total": "15000.00"
    },
    "totalLiabilities": "21500.00"
  },
  "equity": {
    "ownerEquity": "30000.00",
    "retainedEarnings": "4000.00",
    "totalEquity": "34000.00"
  },
  "totalLiabilitiesAndEquity": "55500.00"
}
```

#### Profit & Loss Statement

```http
GET /api/reports/profit-loss?entityId=<entity-uuid>&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <jwt_token>
```

#### Cash Flow Statement

```http
GET /api/reports/cash-flow?entityId=<entity-uuid>&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <jwt_token>
```

#### Custom Report

```http
POST /api/reports/custom
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "entityId": "entity-uuid",
  "name": "Monthly Expenses Report",
  "criteria": {
    "accountTypes": ["expense"],
    "startDate": "2024-12-01",
    "endDate": "2024-12-31",
    "groupBy": "account"
  },
  "format": "json"
}
```

### Document Management

#### Upload Document

```http
POST /api/documents/upload
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

file: <binary_file_data>
entityId: entity-uuid
transactionId: transaction-uuid (optional)
description: Receipt for office supplies
```

**Response**:

```json
{
  "id": "document-uuid",
  "filename": "receipt-001.pdf",
  "contentType": "application/pdf",
  "fileSize": 245760,
  "storageKey": "documents/entity-uuid/2024/12/document-uuid.pdf",
  "uploadUrl": "https://r2-bucket.com/signed-url",
  "createdAt": "2024-12-20T10:30:00Z"
}
```

#### Process OCR

```http
POST /api/documents/<document-uuid>/ocr
Authorization: Bearer <jwt_token>
```

**Response**:

```json
{
  "success": true,
  "ocrData": {
    "text": "RECEIPT\nOffice Depot\nDate: 12/20/2024\nAmount: $250.00\nItems: Paper, Pens, Stapler",
    "extractedData": {
      "vendor": "Office Depot",
      "date": "2024-12-20",
      "amount": "250.00",
      "currency": "USD",
      "items": ["Paper", "Pens", "Stapler"],
      "category": "Office Supplies"
    },
    "confidence": 0.95
  }
}
```

#### List Documents

```http
GET /api/documents?entityId=<entity-uuid>
Authorization: Bearer <jwt_token>
```

#### Download Document

```http
GET /api/documents/<document-uuid>/download
Authorization: Bearer <jwt_token>
```

#### Delete Document

```http
DELETE /api/documents/<document-uuid>
Authorization: Bearer <jwt_token>
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2024-12-20T10:30:00Z",
    "requestId": "req-uuid"
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate account code)
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - JWT token missing or invalid
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `VALIDATION_ERROR` - Request validation failed
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `BUSINESS_RULE_VIOLATION` - Business logic constraint violated
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXTERNAL_SERVICE_ERROR` - External service failure

## Rate Limiting

- **General API**: 1000 requests per hour per user
- **Authentication**: 10 requests per minute per IP
- **File Upload**: 50 uploads per hour per user
- **Report Generation**: 100 reports per hour per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

## Webhooks (Future Feature)

### Webhook Events

- `transaction.created`
- `transaction.updated`
- `transaction.approved`
- `document.uploaded`
- `document.processed`
- `report.generated`

### Webhook Payload

```json
{
  "event": "transaction.created",
  "timestamp": "2024-12-20T10:30:00Z",
  "data": {
    "transactionId": "transaction-uuid",
    "entityId": "entity-uuid"
  }
}
```

## SDK and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @finance-manager/sdk
```

```typescript
import { FinanceManagerClient } from "@finance-manager/sdk";

const client = new FinanceManagerClient({
  baseUrl: "https://finance-manager.irfandimarsya.workers.dev",
  apiKey: "your-jwt-token",
});

const accounts = await client.accounts.list({ entityId: "entity-uuid" });
```

## Testing

### Test Environment

**Base URL**: `https://finance-manager-staging.irfandimarsya.workers.dev`

### Postman Collection

Import the Postman collection for easy API testing:

```
https://finance-manager.irfandimarsya.workers.dev/api/postman-collection.json
```

### OpenAPI Specification

View the complete API specification:

```
https://finance-manager.irfandimarsya.workers.dev/api/openapi.json
```

---

**Last Updated**: December 2024  
**API Version**: 1.0.0  
**Support**: [GitHub Issues](https://github.com/your-repo/finance-manager/issues)
