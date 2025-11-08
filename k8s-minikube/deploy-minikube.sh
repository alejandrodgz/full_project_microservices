#!/bin/bash

# 🚀 Kubernetes Minikube Deployment Script
# This script deploys all microservices and dependencies to a local minikube cluster

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

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${MAGENTA}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 KUBERNETES MINIKUBE DEPLOYMENT 🚀                        ║
║                                                               ║
║   This script will:                                           ║
║   1. Check prerequisites (minikube, kubectl, docker)          ║
║   2. Start minikube cluster                                   ║
║   3. Build Docker images using minikube's Docker daemon       ║
║   4. Deploy namespace and secrets                             ║
║   5. Deploy RabbitMQ (shared message broker)                  ║
║   6. Deploy Affiliation service (Django + MariaDB + Redis)    ║
║   7. Deploy Auth service (Go + PostgreSQL + Redis)            ║
║   8. Deploy Documents service (Go + DynamoDB + MinIO)         ║
║   9. Deploy Monitoring stack (Prometheus + Grafana)           ║
║   10. Deploy Frontend (Next.js)                               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check prerequisites
print_header "🔍 Step 1/11: Checking Prerequisites"

if ! command_exists minikube; then
    print_error "minikube is not installed. Please install minikube first."
    echo "Visit: https://minikube.sigs.k8s.io/docs/start/"
    exit 1
fi
print_success "minikube found ($(minikube version --short))"

if ! command_exists kubectl; then
    print_error "kubectl is not installed. Please install kubectl first."
    echo "Visit: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi
print_success "kubectl found ($(kubectl version --client --short 2>/dev/null || kubectl version --client))"

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker found"

# Start minikube if not running
print_header "🎯 Step 2/11: Starting Minikube Cluster"

if minikube status | grep -q "Running"; then
    print_success "Minikube is already running"
else
    print_info "Starting minikube cluster (this may take a few minutes)..."
    minikube start --cpus=4 --memory=8192 --disk-size=20g
    print_success "Minikube cluster started"
fi

# Configure kubectl to use minikube context
kubectl config use-context minikube
print_success "kubectl configured to use minikube context"

# Enable required addons
print_info "Enabling minikube addons..."
minikube addons enable ingress
minikube addons enable metrics-server
print_success "Minikube addons enabled"

# Build Docker images using minikube's Docker daemon
print_header "🐳 Step 3/11: Building Docker Images"

print_info "Configuring shell to use minikube's Docker daemon..."
eval $(minikube docker-env)
print_success "Docker environment configured"

print_info "Building Affiliation service image..."
cd "$SCRIPT_DIR/../project_connectivity"
docker build -t affiliation-service:latest .
print_success "Affiliation service image built"

print_info "Building Auth service image..."
cd "$SCRIPT_DIR/../auth-microservice"
docker build -t auth-service:latest .
print_success "Auth service image built"

print_info "Building Documents service image..."
cd "$SCRIPT_DIR/../documents-management-microservice"
docker build -t documents-service:latest .
print_success "Documents service image built"

print_info "Building Frontend image..."
cd "$SCRIPT_DIR/../frontend"
docker build -t frontend:latest .
print_success "Frontend image built"

cd "$SCRIPT_DIR"

# Deploy base resources
print_header "📦 Step 4/11: Deploying Base Resources (Namespace & Secrets)"

kubectl apply -f "$SCRIPT_DIR/base/namespace.yaml"
kubectl apply -f "$SCRIPT_DIR/base/secrets.yaml"
print_success "Namespace and secrets deployed"

# Deploy RabbitMQ
print_header "🐰 Step 5/11: Deploying RabbitMQ (Shared Message Broker)"

kubectl apply -f "$SCRIPT_DIR/base/rabbitmq.yaml"
print_info "Waiting for RabbitMQ to be ready..."
kubectl wait --for=condition=ready pod -l app=rabbitmq -n microservices --timeout=120s
print_success "RabbitMQ deployed and ready"

# Deploy Affiliation service
print_header "📊 Step 6/11: Deploying Affiliation Service"

print_info "Deploying Affiliation databases (MariaDB & Redis)..."
kubectl apply -f "$SCRIPT_DIR/affiliation/databases.yaml"
print_info "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=affiliation-db -n microservices --timeout=120s
kubectl wait --for=condition=ready pod -l app=affiliation-redis -n microservices --timeout=60s
print_success "Affiliation databases ready"

print_info "Running database migrations and creating service users..."
kubectl apply -f "$SCRIPT_DIR/affiliation/deployment.yaml"
kubectl wait --for=condition=complete job/affiliation-migrations -n microservices --timeout=180s
print_success "Database migrations completed"

print_info "Waiting for Affiliation service to be ready..."
kubectl wait --for=condition=ready pod -l app=affiliation-service -n microservices --timeout=120s
print_success "Affiliation service deployed and ready"

# Deploy Auth service
print_header "🔐 Step 7/11: Deploying Auth Service"

print_info "Deploying Auth databases (PostgreSQL & Redis)..."
kubectl apply -f "$SCRIPT_DIR/auth/databases.yaml"
print_info "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=auth-postgres -n microservices --timeout=120s
kubectl wait --for=condition=ready pod -l app=auth-redis -n microservices --timeout=60s
print_success "Auth databases ready"

print_info "Deploying Auth service..."
kubectl apply -f "$SCRIPT_DIR/auth/deployment.yaml"
print_info "Waiting for Auth service to be ready..."
kubectl wait --for=condition=ready pod -l app=auth-service -n microservices --timeout=120s
print_success "Auth service deployed and ready"

# Deploy Documents service
print_header "📄 Step 8/11: Deploying Documents Service"

print_info "Deploying Documents databases (DynamoDB & MinIO)..."
kubectl apply -f "$SCRIPT_DIR/documents/databases.yaml"
print_info "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=dynamodb-local -n microservices --timeout=60s
kubectl wait --for=condition=ready pod -l app=minio -n microservices --timeout=120s
print_success "Documents databases ready"

print_info "Initializing DynamoDB table and MinIO bucket..."
kubectl wait --for=condition=complete job/dynamodb-init -n microservices --timeout=120s
kubectl wait --for=condition=complete job/minio-init -n microservices --timeout=120s
print_success "Database initialization completed"

print_info "Deploying Documents service..."
kubectl apply -f "$SCRIPT_DIR/documents/deployment.yaml"
print_info "Waiting for Documents service to be ready..."
kubectl wait --for=condition=ready pod -l app=documents-service -n microservices --timeout=120s
print_success "Documents service deployed and ready"

# Deploy Monitoring
print_header "📊 Step 9/11: Deploying Monitoring Stack"

kubectl apply -f "$SCRIPT_DIR/monitoring/monitoring.yaml"
print_info "Waiting for Prometheus to be ready..."
kubectl wait --for=condition=ready pod -l app=prometheus -n microservices --timeout=60s
print_info "Waiting for Grafana to be ready..."
kubectl wait --for=condition=ready pod -l app=grafana -n microservices --timeout=60s
print_success "Monitoring stack deployed and ready"

# Deploy Frontend
print_header "🎨 Step 10/11: Deploying Frontend"

kubectl apply -f "$SCRIPT_DIR/frontend/deployment.yaml"
print_info "Waiting for Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n microservices --timeout=120s
print_success "Frontend deployed and ready"

# Get service URLs
print_header "🌐 Step 11/11: Getting Service URLs"

MINIKUBE_IP=$(minikube ip)

# Final Summary
echo -e "\n${MAGENTA}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "\n${CYAN}📋 Service Endpoints:${NC}"
echo -e "┌─────────────────────────────────────────────────────────────────┐"
echo -e "│ ${GREEN}Service${NC}                    │ ${GREEN}URL${NC}                                     │"
echo -e "├─────────────────────────────────────────────────────────────────┤"
echo -e "│ Frontend                 │ http://localhost:3001 (port-forward)     │"
echo -e "│ Auth API                 │ http://localhost:8080 (port-forward)     │"
echo -e "│ Documents API            │ http://localhost:8082 (port-forward)     │"
echo -e "│ MinIO API                │ http://localhost:9000 (port-forward)     │"
echo -e "│ MinIO Console            │ http://localhost:9001 (port-forward)     │"
echo -e "│ Affiliation API          │ http://${MINIKUBE_IP}:30090                  │"
echo -e "│ RabbitMQ Management      │ http://${MINIKUBE_IP}:30673                  │"
echo -e "│ Prometheus               │ http://${MINIKUBE_IP}:30091                  │"
echo -e "│ Grafana                  │ http://${MINIKUBE_IP}:30300                  │"
echo -e "└─────────────────────────────────────────────────────────────────┘"

echo -e "\n${YELLOW}⚠️  NOTE: Docker driver on Linux doesn't expose NodePorts directly.${NC}"
echo -e "${YELLOW}   To access services, run the port-forward script:${NC}"
echo -e "${BLUE}   ./k8s-minikube/port-forward.sh${NC}"

echo -e "\n${CYAN}📚 API Documentation:${NC}"
echo -e "   • Auth Swagger: http://localhost:8080/swagger/index.html (after port-forward)"
echo -e "   • Documents Swagger: http://localhost:8082/swagger/index.html (after port-forward)"
echo -e "   • Affiliation API: http://${MINIKUBE_IP}:30090/api/schema/swagger-ui/"

echo -e "\n${CYAN}🔑 Default Credentials:${NC}"
echo -e "   • RabbitMQ: admin/admin"
echo -e "   • MinIO: admin/admin123"
echo -e "   • Grafana: admin/admin"
echo -e "   • Django Admin: admin/admin123"

echo -e "\n${CYAN}🔧 Useful Commands:${NC}"
echo -e "   • View all pods: ${BLUE}kubectl get pods -n microservices${NC}"
echo -e "   • View services: ${BLUE}kubectl get svc -n microservices${NC}"
echo -e "   • View logs: ${BLUE}kubectl logs <pod-name> -n microservices -f${NC}"
echo -e "   • Access service: ${BLUE}minikube service <service-name> -n microservices${NC}"
echo -e "   • Open dashboard: ${BLUE}minikube dashboard${NC}"
echo -e "   • SSH into minikube: ${BLUE}minikube ssh${NC}"
echo -e "   • Stop minikube: ${BLUE}minikube stop${NC}"
echo -e "   • Delete cluster: ${BLUE}minikube delete${NC}"

echo -e "\n${CYAN}📊 Event Flow Testing:${NC}"
echo -e "   1. Run port-forward script: ${BLUE}./k8s-minikube/port-forward.sh${NC}"
echo -e "   2. Open frontend: ${BLUE}http://localhost:3001${NC}"
echo -e "   3. Register a new user (citizen ID will be validated with Affiliation)"
echo -e "   4. Login with credentials"
echo -e "   5. Upload a document"
echo -e "   6. Request authentication (triggers RabbitMQ event flow)"
echo -e "   7. Watch document status change to 'authenticated'"

echo -e "\n${CYAN}🔍 Troubleshooting:${NC}"
echo -e "   • Check pod status: ${BLUE}kubectl describe pod <pod-name> -n microservices${NC}"
echo -e "   • Check events: ${BLUE}kubectl get events -n microservices --sort-by='.lastTimestamp'${NC}"
echo -e "   • Port forward a service: ${BLUE}kubectl port-forward svc/<service-name> <local-port>:<service-port> -n microservices${NC}"

echo -e "\n${GREEN}🎉 Happy coding!${NC}\n"
