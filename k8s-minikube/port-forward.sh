#!/bin/bash

# 🔌 Port Forward Script for Minikube Services
# This script forwards all necessary services to localhost for browser access

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Cleanup function to kill all port-forwards on exit
cleanup() {
    print_info "Stopping all port-forwards..."
    jobs -p | xargs -r kill 2>/dev/null || true
    print_success "All port-forwards stopped"
}

trap cleanup EXIT INT TERM

print_header "🔌 Starting Kubernetes Port Forwards"

# Kill any existing port-forwards on these ports
print_info "Cleaning up existing port-forwards..."
lsof -ti:3001 2>/dev/null | xargs -r kill -9 2>/dev/null || true
lsof -ti:9000 2>/dev/null | xargs -r kill -9 2>/dev/null || true
lsof -ti:8080 2>/dev/null | xargs -r kill -9 2>/dev/null || true
lsof -ti:8082 2>/dev/null | xargs -r kill -9 2>/dev/null || true
sleep 2

# Start port-forwards for browser access (required)
print_info "Starting Frontend port-forward (localhost:3001)..."
kubectl port-forward -n microservices svc/frontend 3001:3001 > /tmp/frontend-pf.log 2>&1 &

print_info "Starting MinIO port-forward (localhost:9000)..."
kubectl port-forward -n microservices svc/minio 9000:9000 > /tmp/minio-pf.log 2>&1 &

# Port-forward backend services for direct API testing (optional but useful)
print_info "Starting Auth service port-forward (localhost:8080)..."
kubectl port-forward -n microservices svc/auth-service 8080:8080 > /tmp/auth-pf.log 2>&1 &

print_info "Starting Documents service port-forward (localhost:8082)..."
kubectl port-forward -n microservices svc/documents-service 8082:8082 > /tmp/documents-pf.log 2>&1 &

# Wait for port-forwards to be ready
sleep 3

# Verify port-forwards are working
print_info "Verifying port-forwards..."

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "Frontend accessible at http://localhost:3001"
else
    print_error "Frontend port-forward failed"
    cat /tmp/frontend-pf.log
fi

if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    print_success "MinIO accessible at http://localhost:9000"
else
    print_error "MinIO port-forward failed"
    cat /tmp/minio-pf.log
fi

print_header "✨ Port Forwards Active"
echo -e "${GREEN}🌐 Frontend:${NC}         http://localhost:3001"
echo -e "${GREEN}� Auth API:${NC}         http://localhost:8080/api/auth"
echo -e "${GREEN}📄 Documents API:${NC}    http://localhost:8082/api/docs"
echo -e "${GREEN}📦 MinIO API:${NC}        http://localhost:9000"
echo ""
echo -e "${CYAN}Additional services:${NC}"
echo -e "   📊 MinIO Console:     http://localhost:9001 (run: kubectl port-forward -n microservices svc/minio 9001:9001)"
echo -e "   👥 Affiliation API:   http://localhost:8000 (uncomment in script to enable)"
echo ""
echo -e "${YELLOW}ℹ️  Press Ctrl+C to stop all port-forwards${NC}"
echo ""

# Keep script running
wait
