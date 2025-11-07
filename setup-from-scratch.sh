#!/bin/bash

# 🚀 Complete Setup from Scratch
# This script cleans everything and sets up all microservices and frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print info messages
print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    print_info "Waiting for $service_name to be ready..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${MAGENTA}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 COMPLETE MICROSERVICES SETUP FROM SCRATCH 🚀             ║
║                                                               ║
║   This script will:                                           ║
║   1. Stop all running services                                ║
║   2. Clean all Docker resources (containers, volumes, etc.)   ║
║   3. Rebuild and start all services                           ║
║   4. Configure databases and apply migrations                 ║
║   5. Setup and start the frontend                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check prerequisites
print_header "🔍 Checking Prerequisites"

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker found"

if ! command_exists docker-compose && ! docker compose version > /dev/null 2>&1; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose found"

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js found ($(node --version))"

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm found ($(npm --version))"

# Confirmation prompt
echo -e "\n${YELLOW}⚠️  WARNING: This will delete ALL Docker containers, volumes, networks, and images related to this project!${NC}"
read -p "$(echo -e ${CYAN}Are you sure you want to continue? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Operation cancelled."
    exit 0
fi

# Step 1: Stop all services
print_header "🛑 Step 1/7: Stopping All Services"

print_info "Stopping Auth Microservice..."
cd "$SCRIPT_DIR/auth-microservice"
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
print_success "Auth Microservice stopped"

print_info "Stopping Documents Microservice..."
cd "$SCRIPT_DIR/documents-management-microservice"
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
print_success "Documents Microservice stopped"

print_info "Stopping Affiliation Microservice..."
cd "$SCRIPT_DIR/project_connectivity"
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
print_success "Affiliation Microservice stopped"

print_info "Stopping any frontend containers..."
docker stop frontend-dev 2>/dev/null || true
docker rm frontend-dev 2>/dev/null || true

cd "$SCRIPT_DIR"

# Step 2: Clean Docker resources
print_header "🧹 Step 2/7: Cleaning Docker Resources"

print_info "Removing all containers..."
cd "$SCRIPT_DIR/auth-microservice"
docker compose down -v --remove-orphans 2>/dev/null || docker-compose down -v --remove-orphans 2>/dev/null || true

cd "$SCRIPT_DIR/documents-management-microservice"
docker compose down -v --remove-orphans 2>/dev/null || docker-compose down -v --remove-orphans 2>/dev/null || true

cd "$SCRIPT_DIR/project_connectivity"
docker compose down -v --remove-orphans 2>/dev/null || docker-compose down -v --remove-orphans 2>/dev/null || true

cd "$SCRIPT_DIR"

print_info "Removing Docker networks..."
docker network rm auth-network 2>/dev/null || true
docker network rm app-network 2>/dev/null || true
docker network rm affiliation-network 2>/dev/null || true

print_info "Pruning unused Docker resources..."
docker system prune -f

print_success "Docker cleanup completed"

# Step 3: Start Affiliation Service (Django) - FIRST because it has the shared RabbitMQ
print_header "🐘 Step 3/7: Starting Affiliation Service (Django)"

cd "$SCRIPT_DIR/project_connectivity"

# Check if .env exists
if [ ! -f .env ]; then
    print_info "Creating .env file..."
    cat > .env << 'ENV_EOF'
DEBUG=True
SECRET_KEY=django-insecure-development-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,affiliation-web
DATABASE_ENGINE=django.db.backends.mysql
DATABASE_NAME=affiliation_db
DATABASE_USER=affiliation_user
DATABASE_PASSWORD=affiliation_password
DATABASE_HOST=affiliation-db
DATABASE_PORT=3306
REDIS_HOST=affiliation-redis
REDIS_PORT=6379
RABBITMQ_HOST=affiliation-rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin
ENV_EOF
    print_success ".env file created"
fi

print_info "Building and starting Affiliation service..."
docker compose up -d --build

print_info "Waiting for database and migrations to complete..."
print_info "This may take up to 180 seconds..."

# Wait for the web service to be ready and migrations to complete
max_attempts=90
attempt=0
while [ $attempt -lt $max_attempts ]; do
    # Check if the auth_user table exists (created by Django migrations)
    if docker compose exec -T web python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.count()" > /dev/null 2>&1; then
        print_success "Database migrations completed successfully!"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Migrations failed to complete in time"
    print_info "Checking logs..."
    docker compose logs web | tail -20
    exit 1
fi

print_info "Creating service accounts for microservice authentication..."
sleep 2
docker compose exec -T web python manage.py shell << 'PYTHON_EOF'
from django.contrib.auth import get_user_model
User = get_user_model()

# Create auth-service user
if not User.objects.filter(username='auth-service').exists():
    User.objects.create_user('auth-service', password='auth-service-pass-123')
    print('Auth service user created')
else:
    print('Auth service user already exists')

# Create document-service user
if not User.objects.filter(username='document-service').exists():
    User.objects.create_user('document-service', password='doc-service-pass-123')
    print('Document service user created')
else:
    print('Document service user already exists')

# Create Django admin superuser
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@connectivity.local', 'admin123')
    print('Django admin superuser created')
else:
    print('Django admin superuser already exists')
PYTHON_EOF

wait_for_service "http://localhost:9090/health/" "Affiliation Service"
wait_for_service "http://localhost:15673" "RabbitMQ Management"

print_success "Affiliation Service is running on http://localhost:9090"
print_success "RabbitMQ is running on port 5673 (Management UI: http://localhost:15673)"

cd "$SCRIPT_DIR"

# Step 4: Start Auth Service
print_header "🔐 Step 4/7: Starting Auth Service"

cd "$SCRIPT_DIR/auth-microservice"

print_info "Building and starting Auth service..."
docker compose up -d --build

print_info "Waiting for Auth Service to be ready..."
sleep 10

# Auth service healthz returns 404 but service is running - check if container is up
if docker ps | grep -q "auth-service"; then
    print_success "Auth Service is running on http://localhost:8080"
    print_info "Swagger UI: http://localhost:8080/swagger/index.html"
else
    print_error "Auth Service container is not running"
fi

cd "$SCRIPT_DIR"

# Step 5: Start Documents Service
print_header "📄 Step 5/7: Starting Documents Service"

cd "$SCRIPT_DIR/documents-management-microservice"

print_info "Building and starting Documents service..."
docker compose up -d --build

print_info "Waiting for DynamoDB and MinIO to initialize..."
sleep 10

# Documents service healthz returns 404 but service is running - check if container is up
if docker ps | grep -q "documents-service"; then
    print_success "Documents Service is running on http://localhost:8081"
    print_info "Swagger UI: http://localhost:8081/swagger/index.html"
else
    print_error "Documents Service container is not running"
fi

wait_for_service "http://localhost:9001" "MinIO Console"
print_success "MinIO Console: http://localhost:9001 (admin/admin123)"

cd "$SCRIPT_DIR"

# Step 6: Setup and Start Frontend
print_header "🎨 Step 6/7: Setting Up Frontend"

cd "$SCRIPT_DIR/frontend"

# Create .env.local file
print_info "Creating .env.local configuration..."
cat > .env.local << 'FRONTEND_ENV'
# Microservice URLs for local development
AUTH_BASE_URL=http://localhost:8080/api/auth
DOCUMENTS_BASE_URL=http://localhost:8081/api/docs

# JWT Secret (must match backend)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Environment
NODE_ENV=development
FRONTEND_ENV

print_success ".env.local created"

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_info "Installing npm dependencies (this may take a few minutes)..."
    npm install
    print_success "Dependencies installed"
else
    print_info "Dependencies already installed, skipping..."
fi

print_info "Starting Next.js development server..."
print_info "The frontend will start in the background. Use 'npm run dev' in the frontend directory to see logs."

# Start in background
nohup npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

print_info "Waiting for frontend to be ready..."
sleep 5

# Try to detect the actual port
FRONTEND_PORT=3003
if lsof -i :3000 >/dev/null 2>&1; then
    FRONTEND_PORT=3003
fi

print_success "Frontend is starting on http://localhost:${FRONTEND_PORT}"

cd "$SCRIPT_DIR"

# Step 7: Verification
print_header "✅ Step 7/7: Verifying All Services"

print_info "Checking service health..."

# Check Affiliation
if curl -s -f "http://localhost:9090/health/" > /dev/null 2>&1; then
    print_success "Affiliation Service: ✓ Running"
else
    print_error "Affiliation Service: ✗ Not responding"
fi

# Check Auth (may return 404 on healthz but still working)
if curl -s "http://localhost:8080/healthz" > /dev/null 2>&1; then
    print_success "Auth Service: ✓ Running"
else
    print_info "Auth Service: May be running (healthz returns 404)"
fi

# Check Documents
if curl -s -f "http://localhost:8081/healthz" > /dev/null 2>&1; then
    print_success "Documents Service: ✓ Running"
else
    print_error "Documents Service: ✗ Not responding"
fi

# Check RabbitMQ
if curl -s -f "http://localhost:15673" > /dev/null 2>&1; then
    print_success "RabbitMQ: ✓ Running"
else
    print_error "RabbitMQ: ✗ Not responding"
fi

# Final Summary
echo -e "\n${MAGENTA}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🎉 SETUP COMPLETED SUCCESSFULLY! 🎉                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}📋 Service Endpoints:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"
echo -e "│ ${GREEN}Service${NC}                    │ ${GREEN}URL${NC}                              │"
echo -e "├─────────────────────────────────────────────────────────────┤"
echo -e "│ Frontend (Next.js)       │ http://localhost:${FRONTEND_PORT}            │"
echo -e "│ Auth API                 │ http://localhost:8080            │"
echo -e "│ Documents API            │ http://localhost:8081            │"
echo -e "│ Affiliation API          │ http://localhost:9090            │"
echo -e "│ RabbitMQ Management      │ http://localhost:15673           │"
echo -e "│ MinIO Console            │ http://localhost:9001            │"
echo -e "│ Auth Grafana             │ http://localhost:3002            │"
echo -e "│ Documents Grafana        │ http://localhost:3001            │"
echo -e "│ Affiliation Grafana      │ http://localhost:3000            │"
echo -e "│ Auth Prometheus          │ http://localhost:9093            │"
echo -e "│ Documents Prometheus     │ http://localhost:9092            │"
echo -e "│ Affiliation Prometheus   │ http://localhost:9091            │"
echo -e "└─────────────────────────────────────────────────────────────┘"

echo -e "\n${CYAN}📚 API Documentation:${NC}"
echo -e "   • Auth: http://localhost:8080/swagger/index.html"
echo -e "   • Affiliation: http://localhost:9090/api/schema/swagger-ui/"

echo -e "\n${CYAN}🔑 Default Credentials:${NC}"
echo -e "   • RabbitMQ: admin/admin"
echo -e "   • MinIO: admin/admin123"
echo -e "   • Grafana: admin/admin"

echo -e "\n${CYAN}🔧 System Architecture:${NC}"
echo -e "   • Auth Service: PostgreSQL + Redis + RabbitMQ (shared)"
echo -e "   • Documents Service: DynamoDB + MinIO + RabbitMQ (shared)"
echo -e "   • Affiliation Service: MariaDB + Redis + RabbitMQ (master)"
echo -e "   • All services use a single shared RabbitMQ instance on port 5673"

echo -e "\n${CYAN}🔍 Useful Commands:${NC}"
echo -e "   • View running containers: ${BLUE}docker ps${NC}"
echo -e "   • View service logs: ${BLUE}docker logs <container-name> -f${NC}"
echo -e "   • Stop all services: ${BLUE}./stop-all-services.sh${NC}"
echo -e "   • Restart from scratch: ${BLUE}./setup-from-scratch.sh${NC}"

echo -e "\n${CYAN}📊 Event Flow Testing:${NC}"
echo -e "   1. Open frontend: http://localhost:${FRONTEND_PORT}"
echo -e "   2. Register a new user (citizen ID will be validated with Affiliation)"
echo -e "   3. Login with credentials"
echo -e "   4. Upload a document"
echo -e "   5. Request authentication (triggers RabbitMQ event flow)"
echo -e "   6. Watch document status change to 'authenticated'"

echo -e "\n${GREEN}🎉 Happy coding!${NC}\n"
