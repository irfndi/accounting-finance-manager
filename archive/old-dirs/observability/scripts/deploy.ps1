# Finance Manager Observability Stack Deployment Script (PowerShell)
# This script helps deploy the OpenTelemetry and SigNoz observability stack on Windows

param(
    [Parameter(Position=0)]
    [ValidateSet('up', 'deploy', 'down', 'stop', 'restart', 'status', 'logs', 'help')]
    [string]$Command = 'up',
    
    [Parameter(Position=1)]
    [string]$Service = ''
)

# Configuration
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ObservabilityDir = Join-Path $ProjectRoot "observability"
$DockerComposeFile = Join-Path $ObservabilityDir "docker-compose.observability.yml"

# Functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check Docker
    try {
        $null = Get-Command docker -ErrorAction Stop
    }
    catch {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    # Check Docker Compose
    try {
        $null = Get-Command docker-compose -ErrorAction Stop
    }
    catch {
        try {
            docker compose version | Out-Null
        }
        catch {
            Write-Error "Docker Compose is not available. Please ensure Docker Desktop is properly installed."
            exit 1
        }
    }
    
    # Check if Docker is running
    try {
        docker info | Out-Null
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop first."
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

function Test-Resources {
    Write-Info "Checking system resources..."
    
    # Check available memory
    $TotalMemory = (Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory
    $AvailableMemory = (Get-CimInstance -ClassName Win32_OperatingSystem).FreePhysicalMemory * 1024
    $AvailableMemoryGB = [math]::Round($AvailableMemory / 1GB, 2)
    
    if ($AvailableMemoryGB -lt 4) {
        Write-Warning "Available memory is less than 4GB ($AvailableMemoryGB GB). The observability stack may not perform optimally."
        $Continue = Read-Host "Do you want to continue? (y/N)"
        if ($Continue -notmatch '^[Yy]$') {
            exit 1
        }
    }
    
    Write-Success "Resource check completed"
}

function New-Networks {
    Write-Info "Creating Docker networks..."
    
    # Check if observability network exists
    $NetworkExists = docker network ls --format "{{.Name}}" | Where-Object { $_ -eq "observability" }
    
    if (-not $NetworkExists) {
        docker network create observability
        Write-Success "Created observability network"
    }
    else {
        Write-Info "Observability network already exists"
    }
}

function Initialize-Directories {
    Write-Info "Setting up directories..."
    
    # Create data directories
    $DataDirs = @(
        (Join-Path $ObservabilityDir "data\clickhouse"),
        (Join-Path $ObservabilityDir "data\alertmanager"),
        (Join-Path $ObservabilityDir "logs")
    )
    
    foreach ($Dir in $DataDirs) {
        if (-not (Test-Path $Dir)) {
            New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        }
    }
    
    Write-Success "Directories setup completed"
}

function Test-Configuration {
    Write-Info "Validating configuration files..."
    
    # Check if required files exist
    $RequiredFiles = @(
        $DockerComposeFile,
        (Join-Path $ObservabilityDir "otel\otel-collector-config.yaml"),
        (Join-Path $ObservabilityDir "clickhouse\clickhouse-config.xml"),
        (Join-Path $ObservabilityDir "clickhouse\users.xml"),
        (Join-Path $ObservabilityDir "alertmanager\config.yml")
    )
    
    foreach ($File in $RequiredFiles) {
        if (-not (Test-Path $File)) {
            Write-Error "Required file not found: $File"
            exit 1
        }
    }
    
    # Validate Docker Compose file
    try {
        Push-Location $ObservabilityDir
        if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
            docker-compose -f docker-compose.observability.yml config | Out-Null
        }
        else {
            docker compose -f docker-compose.observability.yml config | Out-Null
        }
    }
    catch {
        Write-Error "Docker Compose configuration validation failed: $($_.Exception.Message)"
        exit 1
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Configuration validation passed"
}

function Start-ObservabilityStack {
    Write-Info "Deploying observability stack..."
    
    try {
        Push-Location $ObservabilityDir
        
        # Pull images first
        Write-Info "Pulling Docker images..."
        if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
            docker-compose -f docker-compose.observability.yml pull
        }
        else {
            docker compose -f docker-compose.observability.yml pull
        }
        
        # Start services
        Write-Info "Starting services..."
        if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
            docker-compose -f docker-compose.observability.yml up -d
        }
        else {
            docker compose -f docker-compose.observability.yml up -d
        }
        
        Write-Success "Observability stack deployed successfully"
    }
    catch {
        Write-Error "Failed to deploy observability stack: $($_.Exception.Message)"
        exit 1
    }
    finally {
        Pop-Location
    }
}

function Wait-ForServices {
    Write-Info "Waiting for services to be ready..."
    
    $Services = @(
        @{Name="clickhouse"; Port=8123},
        @{Name="signoz-query"; Port=8080},
        @{Name="signoz-frontend"; Port=3301},
        @{Name="alertmanager"; Port=9093}
    )
    
    $MaxAttempts = 60
    
    foreach ($ServiceInfo in $Services) {
        $ServiceName = $ServiceInfo.Name
        $Port = $ServiceInfo.Port
        
        Write-Info "Waiting for $ServiceName`:$Port..."
        
        $Attempt = 0
        $IsReady = $false
        
        while ($Attempt -lt $MaxAttempts -and -not $IsReady) {
            try {
                $ContainerId = docker ps -q -f "name=$ServiceName" | Select-Object -First 1
                if ($ContainerId) {
                    $TestResult = docker exec $ContainerId powershell -Command "Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet" 2>$null
                    if ($TestResult -eq "True") {
                        $IsReady = $true
                        Write-Success "$ServiceName`:$Port is ready"
                        break
                    }
                }
            }
            catch {
                # Service not ready yet
            }
            
            $Attempt++
            if ($Attempt -eq $MaxAttempts) {
                Write-Warning "$ServiceName`:$Port is not responding after $MaxAttempts attempts"
            }
            else {
                Start-Sleep -Seconds 2
            }
        }
    }
}

function Show-AccessInfo {
    Write-Success "`n=== Observability Stack Access Information ==="
    Write-Host "SigNoz Frontend: " -NoNewline -ForegroundColor Green
    Write-Host "http://localhost:3301"
    Write-Host "AlertManager: " -NoNewline -ForegroundColor Green
    Write-Host "http://localhost:9093"
    Write-Host "ClickHouse: " -NoNewline -ForegroundColor Green
    Write-Host "http://localhost:8123 (admin only)"
    Write-Host "OpenTelemetry Collector (HTTP): " -NoNewline -ForegroundColor Green
    Write-Host "http://localhost:4318"
    Write-Host "OpenTelemetry Collector (gRPC): " -NoNewline -ForegroundColor Green
    Write-Host "http://localhost:4317"
    Write-Host ""
    Write-Host "To view logs:" -ForegroundColor Blue
    Write-Host "  .\deploy.ps1 logs [service-name]"
    Write-Host ""
    Write-Host "To stop the stack:" -ForegroundColor Blue
    Write-Host "  .\deploy.ps1 down"
    Write-Host ""
    Write-Host "To restart the stack:" -ForegroundColor Blue
    Write-Host "  .\deploy.ps1 restart"
    Write-Host ""
}

function Stop-ObservabilityStack {
    Write-Info "Stopping observability stack..."
    
    try {
        Push-Location $ObservabilityDir
        
        if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
            docker-compose -f docker-compose.observability.yml down
        }
        else {
            docker compose -f docker-compose.observability.yml down
        }
        
        Write-Success "Observability stack stopped"
    }
    catch {
        Write-Error "Failed to stop observability stack: $($_.Exception.Message)"
        exit 1
    }
    finally {
        Pop-Location
    }
}

function Restart-ObservabilityStack {
    Write-Info "Restarting observability stack..."
    Stop-ObservabilityStack
    Start-ObservabilityStack
    Wait-ForServices
    Show-AccessInfo
}

function Show-Status {
    Write-Info "Observability stack status:"
    
    try {
        Push-Location $ObservabilityDir
        
        if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
            docker-compose -f docker-compose.observability.yml ps
        }
        else {
            docker compose -f docker-compose.observability.yml ps
        }
    }
    finally {
        Pop-Location
    }
}

function Show-Help {
    Write-Host "Finance Manager Observability Stack Deployment Script (PowerShell)"
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [COMMAND] [SERVICE]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  up, deploy    Deploy the observability stack"
    Write-Host "  down, stop    Stop the observability stack"
    Write-Host "  restart       Restart the observability stack"
    Write-Host "  status        Show status of services"
    Write-Host "  logs [service] Show logs for all services or specific service"
    Write-Host "  help          Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 up                    # Deploy the stack"
    Write-Host "  .\deploy.ps1 logs signoz-query     # Show logs for SigNoz query service"
    Write-Host "  .\deploy.ps1 status                # Show service status"
}

function Show-Logs {
    param([string]$ServiceName)
    
    try {
        Push-Location $ObservabilityDir
        
        if ($ServiceName) {
            Write-Info "Showing logs for $ServiceName..."
            if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
                docker-compose -f docker-compose.observability.yml logs -f $ServiceName
            }
            else {
                docker compose -f docker-compose.observability.yml logs -f $ServiceName
            }
        }
        else {
            Write-Info "Showing logs for all services..."
            if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
                docker-compose -f docker-compose.observability.yml logs -f
            }
            else {
                docker compose -f docker-compose.observability.yml logs -f
            }
        }
    }
    finally {
        Pop-Location
    }
}

# Main script logic
switch ($Command) {
    { $_ -in @('up', 'deploy') } {
        Test-Prerequisites
        Test-Resources
        New-Networks
        Initialize-Directories
        Test-Configuration
        Start-ObservabilityStack
        Wait-ForServices
        Show-AccessInfo
    }
    { $_ -in @('down', 'stop') } {
        Stop-ObservabilityStack
    }
    'restart' {
        Restart-ObservabilityStack
    }
    'status' {
        Show-Status
    }
    'logs' {
        Show-Logs -ServiceName $Service
    }
    'help' {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Show-Help
        exit 1
    }
}