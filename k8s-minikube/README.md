# Kubernetes Minikube Deployment Guide

This directory contains Kubernetes manifests for deploying the entire microservices platform to a local Minikube cluster.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Services Overview](#services-overview)
- [Manual Deployment](#manual-deployment)
- [Accessing Services](#accessing-services)
- [Troubleshooting](#troubleshooting)
- [Clean Up](#clean-up)

## 🏗️ Architecture Overview

The deployment includes:

### **Microservices:**
- **Affiliation Service** (Django/Python) - Citizen affiliation management
- **Auth Service** (Go) - Authentication and authorization
- **Documents Service** (Go) - Document management
- **Frontend** (Next.js) - Web application

### **Infrastructure:**
- **RabbitMQ** - Shared message broker for event-driven communication
- **MariaDB** - Database for Affiliation service
- **PostgreSQL** - Database for Auth service
- **DynamoDB Local** - NoSQL database for Documents service
- **MinIO** - S3-compatible object storage for documents
- **Redis** (2 instances) - Cache for Affiliation and Auth services
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

## 📦 Prerequisites

### Required Software

1. **Minikube** (v1.30+)
   ```bash
   # Linux
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   
   # macOS
   brew install minikube
   ```

2. **kubectl** (v1.27+)
   ```bash
   # Linux
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   
   # macOS
   brew install kubectl
   ```

3. **Docker** (v20.10+)
   - Install Docker Desktop or Docker Engine
   - Ensure Docker daemon is running

### System Requirements

- **CPU**: 4 cores minimum (recommended: 6+)
- **RAM**: 8 GB minimum (recommended: 12 GB+)
- **Disk**: 20 GB free space minimum

## 🚀 Quick Start

### Automated Deployment

Run the deployment script from the project root:

```bash
# Make the script executable
chmod +x k8s-minikube/deploy-minikube.sh

# Run the deployment
./k8s-minikube/deploy-minikube.sh
```

This script will:
1. ✅ Check prerequisites
2. 🎯 Start Minikube cluster
3. 🐳 Build Docker images
4. 📦 Deploy all services
5. ⏳ Wait for services to be ready
6. 🌐 Display service URLs

**Deployment time:** ~10-15 minutes (depending on your system)

## 📁 Directory Structure

```
k8s-minikube/
├── base/
│   ├── namespace.yaml          # Namespace definition
│   ├── secrets.yaml            # All secrets (JWT, DB passwords, etc.)
│   └── rabbitmq.yaml           # Shared RabbitMQ message broker
├── affiliation/
│   ├── databases.yaml          # MariaDB & Redis
│   └── deployment.yaml         # Django app, consumer, migrations job
├── auth/
│   ├── databases.yaml          # PostgreSQL & Redis
│   └── deployment.yaml         # Go auth microservice
├── documents/
│   ├── databases.yaml          # DynamoDB & MinIO
│   └── deployment.yaml         # Go documents microservice
├── frontend/
│   └── deployment.yaml         # Next.js frontend
├── monitoring/
│   └── monitoring.yaml         # Prometheus & Grafana
├── deploy-minikube.sh          # Automated deployment script
└── README.md                   # This file
```

## 🔧 Services Overview

### Affiliation Service (Port 30090)
- **Technology**: Django, Python
- **Database**: MariaDB
- **Cache**: Redis
- **Features**: 
  - Citizen affiliation validation
  - Document authentication consumer
  - REST API with Swagger UI

### Auth Service (Port 30080)
- **Technology**: Go
- **Database**: PostgreSQL
- **Cache**: Redis
- **Features**:
  - User registration and login
  - JWT token management
  - External citizen validation
  - Swagger API documentation

### Documents Service (Port 30081)
- **Technology**: Go
- **Database**: DynamoDB Local
- **Storage**: MinIO (S3-compatible)
- **Features**:
  - Document upload and storage
  - Document authentication workflow
  - File metadata management
  - Swagger API documentation

### Frontend (Port 30030)
- **Technology**: Next.js, React, TypeScript
- **Features**:
  - User registration and login
  - Document upload interface
  - Document management dashboard
  - Authentication status tracking

### RabbitMQ (Port 30672 AMQP, 30673 Management)
- **Purpose**: Event-driven communication between services
- **Exchanges**: citizen_affiliation
- **Key Queues**:
  - `auth.user.transferred`
  - `document.authentication.requested`
  - `document.authentication.completed`

### MinIO (Port 30900 API, 30901 Console)
- **Purpose**: S3-compatible object storage for documents
- **Bucket**: documents (auto-created)

### Monitoring Stack
- **Prometheus** (Port 30091): Metrics collection from all services
- **Grafana** (Port 30300): Dashboards and visualization

## 📖 Manual Deployment

If you prefer to deploy step-by-step:

### 1. Start Minikube

```bash
minikube start --cpus=4 --memory=8192 --disk-size=20g
minikube addons enable ingress
minikube addons enable metrics-server
```

### 2. Configure Docker Environment

```bash
# Use minikube's Docker daemon
eval $(minikube docker-env)
```

### 3. Build Docker Images

```bash
# From project root
cd auth-microservice
docker build -t auth-service:latest .

cd ../documents-management-microservice
docker build -t documents-service:latest .

cd ../project_connectivity
docker build -t affiliation-service:latest .

cd ../frontend
docker build -t frontend:latest .

cd ..
```

### 4. Deploy Base Resources

```bash
kubectl apply -f k8s-minikube/base/namespace.yaml
kubectl apply -f k8s-minikube/base/secrets.yaml
kubectl apply -f k8s-minikube/base/rabbitmq.yaml
```

### 5. Deploy Affiliation Service

```bash
kubectl apply -f k8s-minikube/affiliation/databases.yaml
# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=affiliation-db -n microservices --timeout=120s

kubectl apply -f k8s-minikube/affiliation/deployment.yaml
# Wait for migrations to complete
kubectl wait --for=condition=complete job/affiliation-migrations -n microservices --timeout=180s
```

### 6. Deploy Auth Service

```bash
kubectl apply -f k8s-minikube/auth/databases.yaml
kubectl wait --for=condition=ready pod -l app=auth-postgres -n microservices --timeout=120s

kubectl apply -f k8s-minikube/auth/deployment.yaml
```

### 7. Deploy Documents Service

```bash
kubectl apply -f k8s-minikube/documents/databases.yaml
kubectl wait --for=condition=ready pod -l app=dynamodb-local -n microservices --timeout=60s

kubectl apply -f k8s-minikube/documents/deployment.yaml
```

### 8. Deploy Monitoring and Frontend

```bash
kubectl apply -f k8s-minikube/monitoring/monitoring.yaml
kubectl apply -f k8s-minikube/frontend/deployment.yaml
```

## 🌐 Accessing Services

Get the Minikube IP:
```bash
minikube ip
```

### Service URLs (Replace `<MINIKUBE_IP>` with actual IP)

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://\<MINIKUBE_IP\>:30030 | Register new user |
| **Auth API** | http://\<MINIKUBE_IP\>:30080 | - |
| **Auth Swagger** | http://\<MINIKUBE_IP\>:30080/swagger/index.html | - |
| **Documents API** | http://\<MINIKUBE_IP\>:30081 | - |
| **Documents Swagger** | http://\<MINIKUBE_IP\>:30081/swagger/index.html | - |
| **Affiliation API** | http://\<MINIKUBE_IP\>:30090 | - |
| **Affiliation Swagger** | http://\<MINIKUBE_IP\>:30090/api/schema/swagger-ui/ | - |
| **RabbitMQ Management** | http://\<MINIKUBE_IP\>:30673 | admin / admin |
| **MinIO Console** | http://\<MINIKUBE_IP\>:30901 | admin / admin123 |
| **Prometheus** | http://\<MINIKUBE_IP\>:30091 | - |
| **Grafana** | http://\<MINIKUBE_IP\>:30300 | admin / admin |

### Using Minikube Service Command

```bash
# Open service in browser
minikube service frontend -n microservices
minikube service grafana -n microservices
minikube service rabbitmq -n microservices

# List all services
minikube service list -n microservices
```

### Port Forwarding (Alternative)

```bash
# Forward frontend to localhost:3000
kubectl port-forward svc/frontend 3000:3000 -n microservices

# Forward auth service to localhost:8080
kubectl port-forward svc/auth-service 8080:8080 -n microservices
```

## 🧪 Testing the Platform

### 1. Test Frontend Access
```bash
MINIKUBE_IP=$(minikube ip)
curl http://${MINIKUBE_IP}:30030
```

### 2. Register a User
Use the frontend at http://\<MINIKUBE_IP\>:30030 or use curl:

```bash
curl -X POST http://${MINIKUBE_IP}:30080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "citizen_id": "123456789"
  }'
```

### 3. Login
```bash
curl -X POST http://${MINIKUBE_IP}:30080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Check RabbitMQ Messages
Visit http://\<MINIKUBE_IP\>:30673 and login with admin/admin to see message queues.

## 🔍 Troubleshooting

### Check Pod Status
```bash
# View all pods
kubectl get pods -n microservices

# Watch pods
kubectl get pods -n microservices -w

# Describe a pod
kubectl describe pod <pod-name> -n microservices
```

### Check Logs
```bash
# View logs
kubectl logs <pod-name> -n microservices

# Follow logs
kubectl logs <pod-name> -n microservices -f

# Previous container logs (if crashed)
kubectl logs <pod-name> -n microservices --previous
```

### Check Events
```bash
kubectl get events -n microservices --sort-by='.lastTimestamp'
```

### Common Issues

#### Pod in CrashLoopBackOff
```bash
# Check logs
kubectl logs <pod-name> -n microservices --previous

# Check pod description
kubectl describe pod <pod-name> -n microservices
```

#### ImagePullBackOff
Make sure you're using minikube's Docker daemon:
```bash
eval $(minikube docker-env)
docker images | grep -E 'auth-service|documents-service|affiliation-service|frontend'
```

#### Service Not Accessible
```bash
# Check service endpoints
kubectl get endpoints -n microservices

# Check if pods are ready
kubectl get pods -n microservices
```

#### Database Connection Issues
```bash
# Check if database pods are running
kubectl get pods -l app=affiliation-db -n microservices
kubectl get pods -l app=auth-postgres -n microservices

# Check database logs
kubectl logs <db-pod-name> -n microservices
```

### Restart a Deployment
```bash
kubectl rollout restart deployment/<deployment-name> -n microservices
```

### Access Minikube Dashboard
```bash
minikube dashboard
```

## 🧹 Clean Up

### Delete All Resources
```bash
# Delete namespace (removes all resources)
kubectl delete namespace microservices

# Or delete individual components
kubectl delete -f k8s-minikube/frontend/
kubectl delete -f k8s-minikube/monitoring/
kubectl delete -f k8s-minikube/documents/
kubectl delete -f k8s-minikube/auth/
kubectl delete -f k8s-minikube/affiliation/
kubectl delete -f k8s-minikube/base/
```

### Stop Minikube
```bash
minikube stop
```

### Delete Minikube Cluster
```bash
minikube delete
```

### Reset Docker Environment
```bash
eval $(minikube docker-env -u)
```

## 📊 Resource Requirements by Service

| Service | CPU Request | Memory Request | Storage |
|---------|-------------|----------------|---------|
| RabbitMQ | 250m | 256Mi | 1Gi |
| MariaDB | 250m | 256Mi | 2Gi |
| PostgreSQL | 250m | 256Mi | 2Gi |
| Redis (each) | 100m | 128Mi | - |
| MinIO | 200m | 256Mi | 5Gi |
| DynamoDB | 200m | 256Mi | - |
| Affiliation Service | 250m | 256Mi | - |
| Auth Service | 250m | 256Mi | - |
| Documents Service | 250m | 256Mi | - |
| Frontend | 200m | 256Mi | - |
| Prometheus | 200m | 256Mi | - |
| Grafana | 100m | 128Mi | - |
| **Total** | **~2.75 CPU** | **~3.5 GB RAM** | **~10 GB** |

## 🔐 Security Notes

**⚠️ This configuration is for LOCAL DEVELOPMENT ONLY**

For production:
- Use proper secrets management (e.g., Sealed Secrets, External Secrets Operator)
- Enable TLS/HTTPS with proper certificates
- Use Ingress controllers with authentication
- Implement network policies
- Use specific image tags instead of `latest`
- Enable RBAC and service accounts
- Scan images for vulnerabilities
- Use resource limits and quotas

## 📚 Additional Resources

- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

## 🤝 Contributing

If you find issues or have improvements for the K8s deployment:
1. Check existing issues
2. Create a detailed issue report
3. Submit a pull request with fixes

---

**Happy Deploying! 🚀**
