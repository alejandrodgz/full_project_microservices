#!/bin/bash

# 🧹 Kubernetes Minikube Cleanup Script
# This script removes all deployed resources from the minikube cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🧹 KUBERNETES CLEANUP 🧹                                    ║
║                                                               ║
║   This script will remove all deployed resources             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Confirmation prompt
echo -e "${YELLOW}⚠️  WARNING: This will delete all resources in the 'microservices' namespace!${NC}"
read -p "$(echo -e ${CYAN}Are you sure you want to continue? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Operation cancelled."
    exit 0
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_header "🗑️  Deleting Resources"

print_info "Deleting Frontend..."
kubectl delete -f frontend/deployment.yaml --ignore-not-found=true
print_success "Frontend deleted"

print_info "Deleting Monitoring stack..."
kubectl delete -f monitoring/monitoring.yaml --ignore-not-found=true
print_success "Monitoring stack deleted"

print_info "Deleting Documents service..."
kubectl delete -f documents/deployment.yaml --ignore-not-found=true
kubectl delete -f documents/databases.yaml --ignore-not-found=true
print_success "Documents service deleted"

print_info "Deleting Auth service..."
kubectl delete -f auth/deployment.yaml --ignore-not-found=true
kubectl delete -f auth/databases.yaml --ignore-not-found=true
print_success "Auth service deleted"

print_info "Deleting Affiliation service..."
kubectl delete -f affiliation/deployment.yaml --ignore-not-found=true
kubectl delete -f affiliation/databases.yaml --ignore-not-found=true
print_success "Affiliation service deleted"

print_info "Deleting RabbitMQ..."
kubectl delete -f base/rabbitmq.yaml --ignore-not-found=true
print_success "RabbitMQ deleted"

print_info "Deleting Secrets..."
kubectl delete -f base/secrets.yaml --ignore-not-found=true
print_success "Secrets deleted"

print_info "Deleting Namespace..."
kubectl delete -f base/namespace.yaml --ignore-not-found=true
print_success "Namespace deleted"

print_header "🎯 Cleanup Options"

echo -e "${CYAN}What would you like to do next?${NC}"
echo "1) Stop minikube (keeps cluster for later)"
echo "2) Delete minikube cluster (complete removal)"
echo "3) Do nothing (keep minikube running)"
echo ""
read -p "$(echo -e ${CYAN}Enter your choice [1-3]: ${NC})" choice

case $choice in
    1)
        print_info "Stopping minikube cluster..."
        minikube stop
        print_success "Minikube stopped"
        ;;
    2)
        print_info "Deleting minikube cluster..."
        minikube delete
        print_success "Minikube cluster deleted"
        ;;
    3)
        print_info "Keeping minikube running"
        ;;
    *)
        print_info "Invalid choice. Keeping minikube running."
        ;;
esac

echo -e "\n${GREEN}🎉 Cleanup completed!${NC}\n"
