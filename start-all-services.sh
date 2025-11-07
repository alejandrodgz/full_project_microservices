#!/bin/bash

# 🚀 Start All Microservices and Frontend
# This script starts all services using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🚀 Starting All Microservices and Frontend${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${YELLOW}⚠️  Node.js is not installed. Frontend will not start.${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Start Auth Microservice
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}1️⃣  Starting Auth Microservice...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd auth-microservice
docker-compose up -d
echo -e "${GREEN}✅ Auth Microservice started on http://localhost:8080${NC}"
echo -e "   Swagger: http://localhost:8080/swagger/index.html"
cd ..

# Wait a bit for auth service to stabilize
sleep 3

# Start Documents Management Microservice
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}2️⃣  Starting Documents Management Microservice...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  Note: Modifying port to 8081 to avoid conflict with Auth service${NC}"
cd documents-management-microservice
# Modify docker-compose to use port 8081
if grep -q "8080:8080" docker-compose.yml; then
    echo -e "${YELLOW}   Creating docker-compose override for port 8081...${NC}"
    cat > docker-compose.override.yml << 'EOF'
version: '3.8'
services:
  documents-service:
    ports:
      - "8081:8080"
EOF
fi
docker-compose up -d
echo -e "${GREEN}✅ Documents Microservice started on http://localhost:8081${NC}"
echo -e "   MinIO Console: http://localhost:9001 (admin/admin123)"
echo -e "   RabbitMQ UI: http://localhost:15672 (guest/guest)"
cd ..

# Wait a bit for documents service to stabilize
sleep 3

# Start Affiliation Microservice (Django)
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}3️⃣  Starting Affiliation Microservice (Django)...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd project_connectivity

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo -e "${YELLOW}   Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}   ✅ .env file created${NC}"
fi

docker-compose up -d
echo -e "${GREEN}✅ Affiliation Microservice started on http://localhost:8000${NC}"
echo -e "   API Docs: http://localhost:8000/api/schema/swagger-ui/"
echo -e "   Grafana: http://localhost:3000 (admin/admin)"
echo -e "   RabbitMQ UI: http://localhost:15672"
cd ..

# Wait for Django to be ready
sleep 5

# Start Frontend
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}4️⃣  Starting Frontend (Next.js)...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd frontend

if command_exists node; then
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}   Installing npm dependencies...${NC}"
        npm install
    fi
    
    echo -e "${GREEN}   Starting Next.js dev server...${NC}"
    echo -e "${YELLOW}   Note: Frontend will run in the background. Check logs with: docker logs frontend-dev${NC}"
    
    # Start frontend in background using Docker if available, otherwise use npm
    if command_exists docker; then
        docker run -d --name frontend-dev \
            -p 3001:3000 \
            -v "$(pwd):/app" \
            -w /app \
            node:18-alpine \
            sh -c "npm install && npm run dev" 2>/dev/null || {
            echo -e "${YELLOW}   Docker run failed, starting with npm directly...${NC}"
            echo -e "${YELLOW}   Run 'cd frontend && npm run dev' manually in a new terminal${NC}"
        }
    else
        echo -e "${YELLOW}   Run 'cd frontend && npm run dev' manually in a new terminal${NC}"
    fi
    
    echo -e "${GREEN}✅ Frontend will be available at http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Node.js not found. Skipping frontend setup.${NC}"
    echo -e "${YELLOW}   Install Node.js and run 'cd frontend && npm install && npm run dev' manually${NC}"
fi
cd ..

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ All Services Started Successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "\n${YELLOW}📋 Service Summary:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────┐"
echo -e "│ ${GREEN}Service${NC}                    │ ${GREEN}URL${NC}                              │"
echo -e "├─────────────────────────────────────────────────────────────┤"
echo -e "│ Frontend (Next.js)       │ http://localhost:3001            │"
echo -e "│ Auth API                 │ http://localhost:8080            │"
echo -e "│ Documents API            │ http://localhost:8081            │"
echo -e "│ Affiliation API          │ http://localhost:8000            │"
echo -e "│ RabbitMQ Management      │ http://localhost:15672           │"
echo -e "│ MinIO Console            │ http://localhost:9001            │"
echo -e "│ Grafana Dashboard        │ http://localhost:3000            │"
echo -e "│ Prometheus               │ http://localhost:9090            │"
echo -e "└─────────────────────────────────────────────────────────────┘"

echo -e "\n${YELLOW}📚 API Documentation:${NC}"
echo -e "   • Auth: http://localhost:8080/swagger/index.html"
echo -e "   • Affiliation: http://localhost:8000/api/schema/swagger-ui/"

echo -e "\n${YELLOW}🔍 Useful Commands:${NC}"
echo -e "   • View all running containers: ${BLUE}docker ps${NC}"
echo -e "   • View logs: ${BLUE}docker-compose logs -f <service>${NC}"
echo -e "   • Stop all services: ${BLUE}./stop-all-services.sh${NC}"
echo -e "   • Stop specific service: ${BLUE}cd <service-dir> && docker-compose down${NC}"

echo -e "\n${YELLOW}🔑 Default Credentials:${NC}"
echo -e "   • RabbitMQ: guest/guest"
echo -e "   • MinIO: admin/admin123"
echo -e "   • Grafana: admin/admin"

echo -e "\n${GREEN}🎉 Happy coding!${NC}\n"
