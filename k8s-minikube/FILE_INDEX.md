# 📑 K8s-Minikube Files Index

Complete index of all files created for Kubernetes deployment.

## 📁 Directory Overview

```
k8s-minikube/
├── Documentation (5 files)
├── Scripts (2 files)
├── Base Infrastructure (3 files)
├── Affiliation Service (2 files)
├── Auth Service (2 files)
├── Documents Service (2 files)
├── Frontend (1 file)
├── Monitoring (1 file)
└── Kustomize (1 file)

Total: 19 files
```

## 📚 Documentation Files (5)

### 1. README.md
**Purpose**: Main deployment guide  
**Size**: ~15 KB  
**Sections**:
- Architecture overview
- Prerequisites
- Quick start guide
- Manual deployment steps
- Accessing services
- Troubleshooting
- Resource requirements
- Security notes

**Start here for**: Initial setup and deployment

---

### 2. DEPLOYMENT_SUMMARY.md
**Purpose**: Executive summary of the deployment  
**Size**: ~8 KB  
**Sections**:
- What was built
- Quick start
- Services deployed
- Key features
- Common operations
- Testing procedures

**Start here for**: Quick overview and summary

---

### 3. QUICK_REFERENCE.md
**Purpose**: Command-line reference  
**Size**: ~12 KB  
**Sections**:
- kubectl commands
- Minikube operations
- Service access
- Troubleshooting commands
- Database access
- ConfigMap/Secret management
- NodePort mappings
- Default credentials

**Start here for**: Daily operations and commands

---

### 4. COMPARISON.md
**Purpose**: Docker Compose vs Kubernetes analysis  
**Size**: ~10 KB  
**Sections**:
- Architecture comparison
- Component mapping (detailed)
- Configuration management
- Network access differences
- Deployment process
- Advantages/disadvantages
- When to use each
- Migration path

**Start here for**: Understanding design decisions

---

### 5. ARCHITECTURE.md
**Purpose**: Visual architecture diagrams  
**Size**: ~5 KB  
**Contents**:
- ASCII architecture diagram
- Event flow visualization
- Network topology
- Resource allocation

**Start here for**: System understanding

---

## 🚀 Executable Scripts (2)

### 1. deploy-minikube.sh
**Purpose**: Automated deployment script  
**Size**: ~6 KB  
**Capabilities**:
- Prerequisites check
- Minikube startup
- Docker image building
- Sequential deployment
- Health checking
- URL reporting

**Usage**:
```bash
./k8s-minikube/deploy-minikube.sh
```

**Permissions**: Executable (755)

---

### 2. cleanup.sh
**Purpose**: Resource cleanup script  
**Size**: ~2 KB  
**Capabilities**:
- Delete all resources
- Interactive confirmation
- Optional minikube stop/delete

**Usage**:
```bash
./k8s-minikube/cleanup.sh
```

**Permissions**: Executable (755)

---

## 🏗️ Base Infrastructure (3 files)

### base/namespace.yaml
**Resources**: 1
- Namespace: `microservices`

---

### base/secrets.yaml
**Resources**: 8 Secrets
1. `jwt-secret` - JWT signing key
2. `rabbitmq-secret` - RabbitMQ credentials
3. `postgres-secret` - PostgreSQL credentials
4. `redis-auth-secret` - Redis password
5. `mariadb-secret` - MariaDB credentials
6. `minio-secret` - MinIO credentials
7. `dynamodb-secret` - AWS credentials for DynamoDB
8. `grafana-secret` - Grafana admin credentials

---

### base/rabbitmq.yaml
**Resources**: 2
- Service: `rabbitmq` (NodePort 30672, 30673)
- StatefulSet: `rabbitmq` (1 replica, 1Gi PVC)

**Features**:
- Management UI enabled
- Persistent storage
- Health checks

---

## 🏛️ Affiliation Service (2 files)

### affiliation/databases.yaml
**Resources**: 4
1. Service: `affiliation-db` (ClusterIP)
2. StatefulSet: `affiliation-db` (MariaDB, 2Gi PVC)
3. Service: `affiliation-redis` (ClusterIP)
4. Deployment: `affiliation-redis` (1 replica)

---

### affiliation/deployment.yaml
**Resources**: 5
1. ConfigMap: `affiliation-config` (Django settings)
2. Service: `affiliation-service` (NodePort 30090)
3. Deployment: `affiliation-service` (Django app, 1 replica)
4. Deployment: `affiliation-document-consumer` (RabbitMQ consumer)
5. Job: `affiliation-migrations` (DB migrations + user creation)

**Init Containers**: 3
- wait-for-db
- wait-for-redis
- wait-for-rabbitmq

---

## 🔐 Auth Service (2 files)

### auth/databases.yaml
**Resources**: 4
1. Service: `auth-postgres` (ClusterIP)
2. StatefulSet: `auth-postgres` (PostgreSQL 16, 2Gi PVC)
3. Service: `auth-redis` (ClusterIP)
4. Deployment: `auth-redis` (with password, 1 replica)

---

### auth/deployment.yaml
**Resources**: 2
1. Service: `auth-service` (NodePort 30080)
2. Deployment: `auth-service` (Go service, 1 replica)

**Init Containers**: 3
- wait-for-postgres
- wait-for-redis
- wait-for-rabbitmq

---

## 📄 Documents Service (2 files)

### documents/databases.yaml
**Resources**: 6
1. Service: `dynamodb-local` (ClusterIP)
2. Deployment: `dynamodb-local` (in-memory)
3. Service: `minio` (NodePort 30900, 30901)
4. StatefulSet: `minio` (5Gi PVC)
5. Job: `dynamodb-init` (table creation)
6. Job: `minio-init` (bucket creation)

---

### documents/deployment.yaml
**Resources**: 2
1. Service: `documents-service` (NodePort 30081)
2. Deployment: `documents-service` (Go service, 1 replica)

**Init Containers**: 3
- wait-for-dynamodb
- wait-for-minio
- wait-for-rabbitmq

---

## 🎨 Frontend (1 file)

### frontend/deployment.yaml
**Resources**: 3
1. ConfigMap: `frontend-config` (API URLs)
2. Service: `frontend` (NodePort 30030)
3. Deployment: `frontend` (Next.js, 1 replica)

---

## 📊 Monitoring (1 file)

### monitoring/monitoring.yaml
**Resources**: 5
1. ConfigMap: `prometheus-config` (scrape configs)
2. Service: `prometheus` (NodePort 30091)
3. Deployment: `prometheus` (1 replica)
4. Service: `grafana` (NodePort 30300)
5. Deployment: `grafana` (1 replica)

---

## 🔧 Kustomize (1 file)

### kustomization.yaml
**Purpose**: Kustomize configuration for easy deployment  
**Features**:
- Resource ordering
- Common labels
- Image management
- Namespace specification

**Alternative Deployment**:
```bash
kubectl apply -k k8s-minikube/
```

---

## 📊 Statistics

### Total Resources Created
- **Namespaces**: 1
- **Secrets**: 8
- **ConfigMaps**: 3
- **Services**: 12
- **Deployments**: 10
- **StatefulSets**: 4
- **Jobs**: 3
- **Total**: 41 Kubernetes resources

### Storage Resources
- **PersistentVolumeClaims**: 4 (from StatefulSets)
  - rabbitmq-data: 1Gi
  - mysql-data: 2Gi
  - postgres-data: 2Gi
  - minio-data: 5Gi
- **Total Storage**: 10Gi

### Network Resources
- **ClusterIP Services**: 8 (internal)
- **NodePort Services**: 9 (external)
- **Total Exposed Ports**: 10

### Application Workloads
- **Microservices**: 4 (Affiliation, Auth, Documents, Frontend)
- **Databases**: 3 (MariaDB, PostgreSQL, DynamoDB)
- **Storage**: 1 (MinIO)
- **Cache**: 2 (Redis instances)
- **Message Broker**: 1 (RabbitMQ)
- **Monitoring**: 2 (Prometheus, Grafana)

---

## 🎯 File Usage Matrix

| File | Development | Testing | Production | Learning |
|------|-------------|---------|------------|----------|
| README.md | ✅ | ✅ | ✅ | ✅ |
| DEPLOYMENT_SUMMARY.md | ✅ | ✅ | ⚠️ | ✅ |
| QUICK_REFERENCE.md | ✅ | ✅ | ✅ | ✅ |
| COMPARISON.md | ✅ | ⚠️ | ❌ | ✅ |
| ARCHITECTURE.md | ✅ | ✅ | ✅ | ✅ |
| deploy-minikube.sh | ✅ | ✅ | ❌ | ✅ |
| cleanup.sh | ✅ | ✅ | ❌ | ✅ |
| All YAML files | ✅ | ✅ | ⚠️* | ✅ |

*\*Requires modifications for production (secrets, image tags, resource limits, etc.)*

---

## 🚦 Deployment Order

The `deploy-minikube.sh` script deploys in this order:

1. **Base** (namespace, secrets, RabbitMQ)
2. **Affiliation** (databases → migrations → service + consumer)
3. **Auth** (databases → service)
4. **Documents** (databases → init jobs → service)
5. **Monitoring** (Prometheus → Grafana)
6. **Frontend** (deployment)

This order ensures dependencies are met.

---

## 🔍 Quick Navigation

**Need to...**
- **Get started?** → Start with `README.md`
- **Quick deployment?** → Run `deploy-minikube.sh`
- **Find commands?** → Check `QUICK_REFERENCE.md`
- **Understand architecture?** → Read `ARCHITECTURE.md`
- **Compare approaches?** → Review `COMPARISON.md`
- **Get overview?** → Read `DEPLOYMENT_SUMMARY.md`
- **Clean up?** → Run `cleanup.sh`

---

## 📝 File Maintenance

### When to Update

**YAML Files**: When changing:
- Resource limits
- Environment variables
- Image versions
- Service ports
- Storage sizes

**Scripts**: When adding:
- New services
- New initialization steps
- New health checks

**Documentation**: When:
- Architecture changes
- New features added
- Troubleshooting steps discovered

---

## ✅ Validation Checklist

After cloning or modifying:

- [ ] All YAML files are valid: `kubectl apply --dry-run=client -f <file>`
- [ ] Scripts are executable: `ls -la *.sh`
- [ ] Documentation is up-to-date
- [ ] Secrets are not committed (they should be in .gitignore)
- [ ] Image names match your builds
- [ ] Resource limits are appropriate
- [ ] NodePorts don't conflict
- [ ] PVC sizes are sufficient

---

**This index provides a complete overview of the Kubernetes deployment structure. Use it as a navigation guide through the deployment configuration.**
