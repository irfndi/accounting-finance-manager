#!/bin/bash

# Finance Manager Observability Stack Deployment Script
# This script helps deploy the OpenTelemetry and SigNoz observability stack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OBSERVABILITY_DIR="$PROJECT_ROOT/observability"
DOCKER_COMPOSE_FILE="$OBSERVABILITY_DIR/docker-compose.observability.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

check_resources() {
    log_info "Checking system resources..."
    
    # Check available memory (Linux/macOS)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        AVAILABLE_MEM=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//' | awk '{print $1 * 4096 / 1024 / 1024}')
    else
        log_warning "Cannot check memory on this OS. Proceeding anyway..."
        return 0
    fi
    
    if [[ -n "$AVAILABLE_MEM" ]] && [[ "$AVAILABLE_MEM" -lt 4096 ]]; then
        log_warning "Available memory is less than 4GB. The observability stack may not perform optimally."
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Resource check completed"
}

create_networks() {
    log_info "Creating Docker networks..."
    
    # Create observability network if it doesn't exist
    if ! docker network ls | grep -q "observability"; then
        docker network create observability
        log_success "Created observability network"
    else
        log_info "Observability network already exists"
    fi
}

setup_directories() {
    log_info "Setting up directories and permissions..."
    
    # Create data directories
    mkdir -p "$OBSERVABILITY_DIR/data/clickhouse"
    mkdir -p "$OBSERVABILITY_DIR/data/alertmanager"
    mkdir -p "$OBSERVABILITY_DIR/logs"
    
    # Set permissions for ClickHouse data directory
    if [[ "$OSTYPE" != "msys" ]] && [[ "$OSTYPE" != "cygwin" ]]; then
        sudo chown -R 101:101 "$OBSERVABILITY_DIR/data/clickhouse" 2>/dev/null || {
            log_warning "Could not set ClickHouse directory permissions. You may need to run with sudo."
        }
    fi
    
    log_success "Directories setup completed"
}

validate_config() {
    log_info "Validating configuration files..."
    
    # Check if required files exist
    local required_files=(
        "$DOCKER_COMPOSE_FILE"
        "$OBSERVABILITY_DIR/otel/otel-collector-config.yaml"
        "$OBSERVABILITY_DIR/clickhouse/clickhouse-config.xml"
        "$OBSERVABILITY_DIR/clickhouse/users.xml"
        "$OBSERVABILITY_DIR/alertmanager/config.yml"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done
    
    # Validate Docker Compose file
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" config > /dev/null
    else
        docker compose -f "$DOCKER_COMPOSE_FILE" config > /dev/null
    fi
    
    log_success "Configuration validation passed"
}

deploy_stack() {
    log_info "Deploying observability stack..."
    
    cd "$OBSERVABILITY_DIR"
    
    # Pull images first
    log_info "Pulling Docker images..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.observability.yml pull
    else
        docker compose -f docker-compose.observability.yml pull
    fi
    
    # Start services
    log_info "Starting services..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.observability.yml up -d
    else
        docker compose -f docker-compose.observability.yml up -d
    fi
    
    log_success "Observability stack deployed successfully"
}

wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local services=("clickhouse:8123" "signoz-query:8080" "signoz-frontend:3301" "alertmanager:9093")
    local max_attempts=60
    local attempt=0
    
    for service in "${services[@]}"; do
        local host=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        log_info "Waiting for $host:$port..."
        
        attempt=0
        while [[ $attempt -lt $max_attempts ]]; do
            if docker exec "$(docker ps -q -f name=$host)" nc -z localhost $port 2>/dev/null; then
                log_success "$host:$port is ready"
                break
            fi
            
            attempt=$((attempt + 1))
            if [[ $attempt -eq $max_attempts ]]; then
                log_warning "$host:$port is not responding after $max_attempts attempts"
            else
                sleep 2
            fi
        done
    done
}

show_access_info() {
    log_success "\n=== Observability Stack Access Information ==="
    echo -e "${GREEN}SigNoz Frontend:${NC} http://localhost:3301"
    echo -e "${GREEN}AlertManager:${NC} http://localhost:9093"
    echo -e "${GREEN}ClickHouse:${NC} http://localhost:8123 (admin only)"
    echo -e "${GREEN}OpenTelemetry Collector:${NC} http://localhost:4318 (OTLP HTTP)"
    echo -e "${GREEN}OpenTelemetry Collector:${NC} http://localhost:4317 (OTLP gRPC)"
    echo
    echo -e "${BLUE}To view logs:${NC}"
    echo "  docker-compose -f $DOCKER_COMPOSE_FILE logs -f [service-name]"
    echo
    echo -e "${BLUE}To stop the stack:${NC}"
    echo "  $0 down"
    echo
    echo -e "${BLUE}To restart the stack:${NC}"
    echo "  $0 restart"
    echo
}

stop_stack() {
    log_info "Stopping observability stack..."
    
    cd "$OBSERVABILITY_DIR"
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.observability.yml down
    else
        docker compose -f docker-compose.observability.yml down
    fi
    
    log_success "Observability stack stopped"
}

restart_stack() {
    log_info "Restarting observability stack..."
    stop_stack
    deploy_stack
    wait_for_services
    show_access_info
}

show_status() {
    log_info "Observability stack status:"
    
    cd "$OBSERVABILITY_DIR"
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.observability.yml ps
    else
        docker compose -f docker-compose.observability.yml ps
    fi
}

show_help() {
    echo "Finance Manager Observability Stack Deployment Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  up, deploy    Deploy the observability stack"
    echo "  down, stop    Stop the observability stack"
    echo "  restart       Restart the observability stack"
    echo "  status        Show status of services"
    echo "  logs [service] Show logs for all services or specific service"
    echo "  help          Show this help message"
    echo
    echo "Examples:"
    echo "  $0 up                    # Deploy the stack"
    echo "  $0 logs signoz-query     # Show logs for SigNoz query service"
    echo "  $0 status                # Show service status"
}

show_logs() {
    local service="$1"
    
    cd "$OBSERVABILITY_DIR"
    
    if [[ -n "$service" ]]; then
        log_info "Showing logs for $service..."
        if command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.observability.yml logs -f "$service"
        else
            docker compose -f docker-compose.observability.yml logs -f "$service"
        fi
    else
        log_info "Showing logs for all services..."
        if command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.observability.yml logs -f
        else
            docker compose -f docker-compose.observability.yml logs -f
        fi
    fi
}

# Main script logic
case "${1:-up}" in
    "up"|"deploy")
        check_prerequisites
        check_resources
        create_networks
        setup_directories
        validate_config
        deploy_stack
        wait_for_services
        show_access_info
        ;;
    "down"|"stop")
        stop_stack
        ;;
    "restart")
        restart_stack
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "help"|"--help"|"")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac