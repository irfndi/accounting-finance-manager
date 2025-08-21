# Finance Manager Backend

A robust Go-based backend API for the Finance Manager application, built with Gin framework and following clean architecture principles.

## Features

- **Authentication & Authorization**: JWT-based authentication with secure session management
- **Account Management**: Hierarchical chart of accounts with support for assets, liabilities, equity, revenue, and expenses
- **Transaction Processing**: Double-entry bookkeeping with automatic journal entry creation
- **Category Management**: Flexible categorization system for transactions
- **Financial Reporting**: Trial balance, profit & loss, balance sheet, and cash flow statements
- **Rate Limiting**: IP-based rate limiting for API protection
- **Caching**: Redis-based caching for improved performance
- **Database**: PostgreSQL with proper indexing and constraints

## Architecture

```
backend/
├── cmd/
│   └── server/          # Application entry point
├── internal/
│   ├── config/          # Configuration management
│   ├── handlers/        # HTTP request handlers
│   ├── middleware/      # HTTP middleware (auth, CORS, logging, etc.)
│   └── models/          # Data models and structures
├── pkg/
│   ├── database/        # Database connection and utilities
│   └── redis/           # Redis connection and utilities
└── migrations/          # Database migration files
```

## Prerequisites

- Go 1.21 or higher
- PostgreSQL 13 or higher
- Redis 6 or higher

## Setup

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Install Dependencies

```bash
go mod download
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your specific configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_manager
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
SERVER_PORT=8080
```

### 4. Database Setup

Create the database and run migrations:

```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE finance_manager;
```

Run the migration files in order:

```bash
# Apply schema migration
psql -h localhost -U postgres -d finance_manager -f migrations/001_initial_schema.sql

# Apply initial data
psql -h localhost -U postgres -d finance_manager -f migrations/002_initial_data.sql
```

### 5. Start the Server

```bash
go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user (requires auth)
- `GET /api/v1/auth/profile` - Get user profile (requires auth)
- `PUT /api/v1/auth/profile` - Update user profile (requires auth)

### Accounts

- `GET /api/v1/accounts/chart` - Get chart of accounts
- `GET /api/v1/accounts/balances` - Get account balances
- `GET /api/v1/accounts/summary` - Get account summary
- `GET /api/v1/accounts/:id` - Get specific account
- `POST /api/v1/accounts` - Create new account
- `PUT /api/v1/accounts/:id` - Update account
- `DELETE /api/v1/accounts/:id` - Delete account

### Transactions

- `GET /api/v1/transactions` - Get transactions (with filtering)
- `GET /api/v1/transactions/summary` - Get transaction summary
- `GET /api/v1/transactions/:id` - Get specific transaction
- `POST /api/v1/transactions` - Create new transaction
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

### Categories

- `GET /api/v1/categories` - Get categories
- `GET /api/v1/categories/stats` - Get category statistics
- `GET /api/v1/categories/:id` - Get specific category
- `POST /api/v1/categories` - Create new category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Reports

- `GET /api/v1/reports/trial-balance` - Generate trial balance
- `GET /api/v1/reports/profit-loss` - Generate profit & loss statement
- `GET /api/v1/reports/balance-sheet` - Generate balance sheet
- `GET /api/v1/reports/cash-flow` - Generate cash flow statement

### Health Check

- `GET /health` - Server health status

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message description"
}
```

HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## Development

### Running Tests

```bash
go test ./...
```

### Building for Production

```bash
go build -o finance-manager cmd/server/main.go
```

### Docker Support

Build and run with Docker:

```bash
# Build image
docker build -t finance-manager-backend .

# Run container
docker run -p 8080:8080 --env-file .env finance-manager-backend
```

## Configuration

All configuration is handled through environment variables. See `.env.example` for all available options.

### Key Configuration Sections

- **Server**: Port, timeouts, environment
- **Database**: PostgreSQL connection settings
- **Redis**: Cache and session storage
- **JWT**: Token signing and expiration
- **CORS**: Cross-origin resource sharing
- **AI**: Optional AI service integration
- **SMTP**: Optional email notifications

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting per IP
- CORS protection
- SQL injection prevention
- Request ID tracking
- Secure session management

## Performance Features

- Redis caching
- Database connection pooling
- Efficient SQL queries with proper indexing
- Graceful shutdown handling
- Request timeout management

## Contributing

1. Follow Go coding standards
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Follow the existing architecture patterns

## License

This project is licensed under the MIT License.