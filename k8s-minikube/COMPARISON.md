# Docker Compose vs Kubernetes Deployment Comparison

This document compares the original Docker Compose setup with the new Kubernetes deployment.

## 🔄 Architecture Comparison

### Docker Compose (`setup-from-scratch.sh`)
- **Orchestration**: Docker Compose
- **Network**: Multiple Docker networks (auth-network, app-network, affiliation-network)
- **Service Discovery**: Docker DNS
- **Storage**: Docker volumes
- **Ports**: Host ports directly mapped
- **Scaling**: Manual via docker-compose up --scale
- **Load Balancing**: None (single instance)
- **Health Checks**: Container-level only

### Kubernetes (Minikube)
- **Orchestration**: Kubernetes
- **Network**: Single namespace with Kubernetes Service mesh
- **Service Discovery**: Kubernetes Services (DNS + ClusterIP)
- **Storage**: PersistentVolumeClaims (PVCs)
- **Ports**: NodePort for external access, ClusterIP for internal
- **Scaling**: Horizontal Pod Autoscaling (HPA) capable
- **Load Balancing**: Kubernetes Services
- **Health Checks**: Liveness & Readiness probes

## 📊 Component Mapping

### Affiliation Service (Django)

| Component | Docker Compose | Kubernetes |
|-----------|----------------|------------|
| **Application** | Container: `affiliation-web` | Deployment: `affiliation-service` |
| | Port: 9090 | Service: ClusterIP + NodePort 30090 |
| **Database** | Container: `affiliation-db` (MariaDB) | StatefulSet: `affiliation-db` |
| | Port: 3306 | Service: ClusterIP (internal only) |
| | Volume: `mysql_data` | PVC: 2Gi |
| **Cache** | Container: `affiliation-redis` | Deployment: `affiliation-redis` |
| | Port: 6380 (external) | Service: ClusterIP (internal only) |
| | Volume: `redis_data` | EmptyDir |
| **Consumer** | Container: `document-consumer` | Deployment: `affiliation-document-consumer` |
| **Migrations** | docker-entrypoint.sh | Job: `affiliation-migrations` |
| **Monitoring** | Prometheus: 9091, Grafana: 3000 | Included in monitoring stack |

### Auth Service (Go)

| Component | Docker Compose | Kubernetes |
|-----------|----------------|------------|
| **Application** | Container: `auth-service` | Deployment: `auth-service` |
| | Port: 8080 | Service: ClusterIP + NodePort 30080 |
| **Database** | Container: `postgres` | StatefulSet: `auth-postgres` |
| | Port: 5432 | Service: ClusterIP (internal only) |
| | Volume: `postgres_data` | PVC: 2Gi |
| **Cache** | Container: `redis` | Deployment: `auth-redis` |
| | Port: 6379 | Service: ClusterIP (internal only) |
| | Volume: `redis_data` | EmptyDir |
| **Monitoring** | Prometheus: 9093, Grafana: 3002 | Included in monitoring stack |

### Documents Service (Go)

| Component | Docker Compose | Kubernetes |
|-----------|----------------|------------|
| **Application** | Container: `documents-service` | Deployment: `documents-service` |
| | Port: 8081 | Service: ClusterIP + NodePort 30081 |
| **DynamoDB** | Container: `dynamodb-local` | Deployment: `dynamodb-local` |
| | Port: 8000 | Service: ClusterIP (internal only) |
| **Initialization** | Container: `dynamodb-init` | Job: `dynamodb-init` |
| **MinIO** | Container: `minio` | StatefulSet: `minio` |
| | Port: 9000 (API), 9001 (Console) | Service: NodePort 30900, 30901 |
| | Volume: `minio-data` | PVC: 5Gi |
| **Initialization** | Container: `minio-init` | Job: `minio-init` |
| **Monitoring** | Prometheus: 9092, Grafana: 3001 | Included in monitoring stack |

### Shared Infrastructure

| Component | Docker Compose | Kubernetes |
|-----------|----------------|------------|
| **RabbitMQ** | Container in affiliation stack | StatefulSet: `rabbitmq` (shared) |
| | Port: 5673 (AMQP), 15673 (Mgmt) | Service: NodePort 30672, 30673 |
| | Volume: `rabbitmq_data` | PVC: 1Gi |
| **Prometheus** | 3 separate instances | Single instance: NodePort 30091 |
| **Grafana** | 3 separate instances | Single instance: NodePort 30300 |

### Frontend (Next.js)

| Component | Docker Compose | Kubernetes |
|-----------|----------------|------------|
| **Application** | npm run dev (host) | Deployment: `frontend` |
| | Port: 3003 (dynamic) | Service: NodePort 30030 |
| **Config** | .env.local file | ConfigMap + Secret |

## 🔧 Configuration Management

### Docker Compose
- Environment variables in `.env` files
- Hardcoded in docker-compose.yml
- Mounted configuration files
- Secrets in plain text

### Kubernetes
- ConfigMaps for non-sensitive data
- Secrets for sensitive data (base64 encoded)
- Environment variables from ConfigMaps/Secrets
- Better separation of concerns

## 🌐 Network Access

### Docker Compose
```
Frontend:        http://localhost:3003
Auth:            http://localhost:8080
Documents:       http://localhost:8081
Affiliation:     http://localhost:9090
RabbitMQ:        http://localhost:15673
MinIO:           http://localhost:9001
Prometheus (A):  http://localhost:9091
Prometheus (Au): http://localhost:9093
Prometheus (D):  http://localhost:9092
Grafana (A):     http://localhost:3000
Grafana (Au):    http://localhost:3002
Grafana (D):     http://localhost:3001
```

### Kubernetes (Minikube)
```
Frontend:        http://<MINIKUBE_IP>:30030
Auth:            http://<MINIKUBE_IP>:30080
Documents:       http://<MINIKUBE_IP>:30081
Affiliation:     http://<MINIKUBE_IP>:30090
RabbitMQ:        http://<MINIKUBE_IP>:30673
MinIO:           http://<MINIKUBE_IP>:30901
Prometheus:      http://<MINIKUBE_IP>:30091 (unified)
Grafana:         http://<MINIKUBE_IP>:30300 (unified)
```

## 🚀 Deployment Process

### Docker Compose
1. Stop all services
2. Clean Docker resources
3. Start Affiliation (includes RabbitMQ)
4. Wait for migrations
5. Create service users
6. Start Auth service
7. Start Documents service
8. Start Frontend (npm)
9. Verify health endpoints

**Time**: ~5-8 minutes

### Kubernetes
1. Start Minikube cluster
2. Build images in Minikube Docker
3. Deploy namespace & secrets
4. Deploy RabbitMQ (shared)
5. Deploy Affiliation + databases
6. Run migration Job
7. Deploy Auth + databases
8. Deploy Documents + databases
9. Run init Jobs (DynamoDB, MinIO)
10. Deploy monitoring stack
11. Deploy Frontend

**Time**: ~10-15 minutes (first time)

## ✅ Advantages of Kubernetes

### Scalability
- Easy horizontal scaling: `kubectl scale deployment/auth-service --replicas=3`
- Auto-scaling with HPA
- Load balancing built-in

### Resilience
- Automatic pod restart on failure
- Health checks (liveness/readiness)
- Self-healing infrastructure
- Rolling updates with zero downtime

### Resource Management
- CPU and memory requests/limits
- Resource quotas per namespace
- Better isolation between services

### Production Ready
- Declarative configuration (GitOps ready)
- Version control friendly (YAML manifests)
- Infrastructure as Code
- Easy to replicate environments

### Monitoring & Observability
- Centralized monitoring (single Prometheus/Grafana)
- Better metrics collection
- Kubernetes events and logs
- Integration with cloud provider tools

### Networking
- Service mesh ready
- Network policies for security
- Ingress controllers for advanced routing
- Better service discovery

## ⚠️ Disadvantages of Kubernetes (for Local Dev)

### Complexity
- Steeper learning curve
- More configuration files
- More tools to install (minikube, kubectl)

### Resource Usage
- Higher memory/CPU overhead
- Minikube VM adds overhead
- More processes running

### Development Speed
- Slower iteration (build → push → deploy)
- Image rebuilds required
- More steps to debug

### Local Setup
- Requires minikube/kind/k3s
- Additional networking complexity
- Port forwarding needed for some access

## 🎯 When to Use Each

### Use Docker Compose When:
- ✅ Local development and testing
- ✅ Quick prototyping
- ✅ Simple deployment requirements
- ✅ Small team, single developer
- ✅ No scaling requirements
- ✅ Learning the application architecture

### Use Kubernetes When:
- ✅ Production deployments
- ✅ Need horizontal scaling
- ✅ Multi-environment setups (dev, staging, prod)
- ✅ High availability requirements
- ✅ Cloud deployment
- ✅ Learning Kubernetes
- ✅ CI/CD pipelines
- ✅ Microservices at scale

## 📈 Migration Path

1. **Development**: Use Docker Compose (current setup-from-scratch.sh)
2. **Testing**: Use Kubernetes (Minikube) to validate deployment
3. **Staging**: Use Kubernetes (EKS, GKE, AKS)
4. **Production**: Use Kubernetes with production-grade configs

## 🔄 Key Differences Summary

| Aspect | Docker Compose | Kubernetes |
|--------|----------------|------------|
| **Complexity** | Low | High |
| **Scalability** | Limited | Excellent |
| **Learning Curve** | Easy | Steep |
| **Production Ready** | No | Yes |
| **Resource Usage** | Low | Medium-High |
| **High Availability** | No | Yes |
| **Load Balancing** | No | Yes |
| **Service Discovery** | Docker DNS | Kubernetes Services |
| **Health Checks** | Basic | Advanced |
| **Secrets Management** | Basic | Advanced |
| **Monitoring** | Manual | Built-in |
| **Updates** | Manual | Rolling/Blue-Green |
| **Best For** | Development | Production |

## 🛠️ Maintenance

### Docker Compose
```bash
# Update a service
cd auth-microservice
docker-compose up -d --build

# View logs
docker-compose logs -f auth-service

# Restart
docker-compose restart auth-service
```

### Kubernetes
```bash
# Update a service
kubectl set image deployment/auth-service auth-service=auth-service:v2 -n microservices

# View logs
kubectl logs deployment/auth-service -n microservices -f

# Restart
kubectl rollout restart deployment/auth-service -n microservices

# Rollback
kubectl rollout undo deployment/auth-service -n microservices
```

## 📝 Conclusion

Both approaches are valid:
- **Docker Compose**: Perfect for local development, testing, and learning
- **Kubernetes**: Essential for production, scaling, and cloud deployments

The Kubernetes setup mirrors the Docker Compose architecture while providing production-grade features like:
- High availability
- Horizontal scaling
- Self-healing
- Rolling updates
- Better resource management
- Advanced monitoring

Choose based on your current needs and future plans!
