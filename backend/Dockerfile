# Multi-stage Docker build for Cloudflare Workers + Containers

# Build stage - compile Go code
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go.mod (go.sum is optional)
COPY go.mod* ./

# Download dependencies
RUN go mod download || true

# Copy source code
COPY . .

# Build the Go application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o main .

# Final stage - minimal runtime
FROM alpine:latest AS runtime

# Install ca-certificates
RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy the compiled binary from builder
COPY --from=builder /app/main .

# Expose default port
EXPOSE 8080

# Health check endpoint using curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
CMD ["/app/main"]
