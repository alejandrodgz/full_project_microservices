#!/bin/bash

# 🛑 Stop All Microservices and Frontend
# This script stops all services started with Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🛑 Stopping All Microservices and Frontend${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Stop Auth Microservice
echo -e "\n${YELLOW}Stopping Auth Microservice...${NC}"
cd auth-microservice
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
echo -e "${GREEN}✅ Auth Microservice stopped${NC}"
cd ..

# Stop Documents Management Microservice
echo -e "\n${YELLOW}Stopping Documents Management Microservice...${NC}"
cd documents-management-microservice
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
echo -e "${GREEN}✅ Documents Microservice stopped${NC}"
cd ..

# Stop Affiliation Microservice (Django)
echo -e "\n${YELLOW}Stopping Affiliation Microservice...${NC}"
cd project_connectivity
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
echo -e "${GREEN}✅ Affiliation Microservice stopped${NC}"
cd ..

# Stop Frontend process
echo -e "\n${YELLOW}Stopping Frontend...${NC}"
pkill -f "next dev" 2>/dev/null || true
docker stop frontend-dev 2>/dev/null && docker rm frontend-dev 2>/dev/null || true
echo -e "${GREEN}✅ Frontend stopped${NC}"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ All Services Stopped${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}💡 To remove all volumes (clean state):${NC}"
echo -e "   Run: ${BLUE}./stop-all-services.sh --clean${NC}"

# Check if clean flag is provided
if [ "$1" == "--clean" ]; then
    echo -e "\n${YELLOW}🧹 Cleaning up volumes and networks...${NC}"
    
    cd auth-microservice
    docker compose down -v --remove-orphans 2>/dev/null || docker-compose down -v --remove-orphans 2>/dev/null || true
    cd ..
    
    cd documents-management-microservice
    docker compose down -v --remove-orphans 2>/dev/null || docker-compose down -v --remove-orphans 2>/dev/null || true
    cd ..
    
    cd project_connectivity
    docker compose down -v --remove-orphans 2>/dev/null || docker-compose down -v --remove-orphans 2>/dev/null || true
    cd ..
    
    echo -e "${YELLOW}Removing Docker networks...${NC}"
    docker network rm auth-network 2>/dev/null || true
    docker network rm app-network 2>/dev/null || true
    docker network rm affiliation-network 2>/dev/null || true
    
    echo -e "${YELLOW}Pruning Docker system...${NC}"
    docker system prune -f
    
    echo -e "${GREEN}✅ All volumes and networks removed${NC}"
fi

echo -e "\n${GREEN}Done!${NC}\n"
