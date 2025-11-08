# Kubernetes Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MINIKUBE CLUSTER (Namespace: microservices)              │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                          EXTERNAL ACCESS (NodePort)                        │  │
│  │                                                                            │  │
│  │  :30030        :30080        :30081        :30090        :30673  :30901   │  │
│  │  Frontend      Auth API      Docs API      Affil API     RabbitMQ MinIO   │  │
│  └────┬─────────────┬──────────────┬─────────────┬──────────────┬──────┬─────┘  │
│       │             │              │             │              │      │        │
│  ┌────▼─────────────▼──────────────▼─────────────▼──────────────▼──────▼─────┐  │
│  │                         KUBERNETES SERVICES (ClusterIP/NodePort)          │  │
│  └────┬─────────────┬──────────────┬─────────────┬──────────────┬──────┬─────┘  │
│       │             │              │             │              │      │        │
│       │             │              │             │              │      │        │
│  ┌────▼──────┐ ┌────▼──────┐ ┌────▼──────┐ ┌────▼──────┐ ┌─────▼──────▼─────┐  │
│  │ Frontend  │ │   Auth    │ │ Documents │ │Affiliation│ │  Shared Infra    │  │
│  │ Next.js   │ │  Service  │ │  Service  │ │  Service  │ │                  │  │
│  │           │ │   (Go)    │ │   (Go)    │ │ (Django)  │ │  RabbitMQ (5672) │  │
│  │ Port:3000 │ │ Port:8080 │ │ Port:8080 │ │ Port:8000 │ │  MinIO (9000)    │  │
│  │           │ │           │ │           │ │           │ │                  │  │
│  │Deployment │ │Deployment │ │Deployment │ │Deployment │ │  StatefulSet     │  │
│  │  1 Pod    │ │  1 Pod    │ │  1 Pod    │ │  1 Pod    │ │  1 Pod each      │  │
│  └───────────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └──────────────────┘  │
│                      │              │             │                             │
│                 ┌────▼─────┐   ┌────▼─────┐  ┌────▼─────┐                      │
│                 │PostgreSQL│   │ DynamoDB │  │ MariaDB  │                      │
│                 │          │   │  Local   │  │          │                      │
│                 │Port: 5432│   │Port: 8000│  │Port: 3306│                      │
│                 │          │   │          │  │          │                      │
│                 │StatefulSet   │Deployment│  │StatefulSet                      │
│                 │  PVC:2Gi │   │(in-mem)  │  │  PVC:2Gi │                      │
│                 └──────────┘   └────┬─────┘  └──────────┘                      │
│                                     │                                           │
│                 ┌──────────┐   ┌────▼─────┐  ┌──────────┐                      │
│                 │Auth Redis│   │  MinIO   │  │Affil Redis                      │
│                 │          │   │          │  │          │                      │
│                 │Port: 6379│   │Port: 9000│  │Port: 6379│                      │
│                 │          │   │          │  │          │                      │
│                 │Deployment│   │StatefulSet  │Deployment│                      │
│                 │ EmptyDir │   │  PVC:5Gi │  │ EmptyDir │                      │
│                 └──────────┘   └──────────┘  └──────────┘                      │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        CONSUMER DEPLOYMENT                                │  │
│  │                                                                           │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Affiliation Document Consumer                                     │  │  │
│  │  │  - Listens to: document.authentication.requested                   │  │  │
│  │  │  - Publishes to: document.authentication.completed                 │  │  │
│  │  │  Deployment: 1 Pod                                                 │  │  │
│  │  └────────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        MONITORING STACK                                   │  │
│  │                                                                           │  │
│  │  ┌─────────────┐          ┌─────────────┐                               │  │
│  │  │ Prometheus  │          │  Grafana    │                               │  │
│  │  │  Port:9090  │◄─────────┤  Port:3000  │                               │  │
│  │  │  NodePort:  │  Scrapes │  NodePort:  │                               │  │
│  │  │   30091     │          │   30300     │                               │  │
│  │  │             │          │             │                               │  │
│  │  │ Deployment  │          │ Deployment  │                               │  │
│  │  └─────────────┘          └─────────────┘                               │  │
│  │        │                                                                 │  │
│  │        │ Scrapes metrics from:                                          │  │
│  │        ├─► Affiliation Service :8000/metrics                            │  │
│  │        ├─► Auth Service :8080/metrics                                   │  │
│  │        └─► Documents Service :8080/metrics                              │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        INITIALIZATION JOBS                                │  │
│  │                                                                           │  │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │  │
│  │  │ affiliation-       │  │ dynamodb-init      │  │ minio-init       │  │  │
│  │  │ migrations         │  │                    │  │                  │  │  │
│  │  │                    │  │ Creates:           │  │ Creates:         │  │  │
│  │  │ - Run migrations   │  │ - Documents table  │  │ - documents      │  │  │
│  │  │ - Create users:    │  │ - GSI indexes      │  │   bucket         │  │  │
│  │  │   * auth-service   │  │                    │  │ - Sets public    │  │  │
│  │  │   * document-srv   │  │ Job (run once)     │  │   download       │  │  │
│  │  │   * admin          │  │                    │  │                  │  │  │
│  │  │                    │  │                    │  │ Job (run once)   │  │  │
│  │  │ Job (run once)     │  │                    │  │                  │  │  │
│  │  └────────────────────┘  └────────────────────┘  └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                     CONFIGURATION & SECRETS                               │  │
│  │                                                                           │  │
│  │  ConfigMaps:                        Secrets:                             │  │
│  │  - affiliation-config               - jwt-secret                         │  │
│  │  - frontend-config                  - rabbitmq-secret                    │  │
│  │  - prometheus-config                - postgres-secret                    │  │
│  │                                     - redis-auth-secret                  │  │
│  │                                     - mariadb-secret                     │  │
│  │                                     - minio-secret                       │  │
│  │                                     - dynamodb-secret                    │  │
│  │                                     - grafana-secret                     │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                     PERSISTENT STORAGE (PVCs)                             │  │
│  │                                                                           │  │
│  │  - rabbitmq-data (1Gi)          - Messaging queue storage                │  │
│  │  - mysql-data (2Gi)             - Affiliation database                   │  │
│  │  - postgres-data (2Gi)          - Auth database                          │  │
│  │  - minio-data (5Gi)             - Document object storage                │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

EVENT FLOW (RabbitMQ):
═══════════════════════

1. USER REGISTRATION:
   Frontend → Auth Service → Validates with Affiliation Service → Creates User

2. DOCUMENT UPLOAD:
   Frontend → Documents Service → Stores in MinIO + DynamoDB

3. AUTHENTICATION REQUEST:
   Documents Service → RabbitMQ (document.authentication.requested)
                    ↓
   Affiliation Consumer ← RabbitMQ
                    ↓
   Validates Document
                    ↓
   RabbitMQ (document.authentication.completed) → Documents Service
                    ↓
   Updates Document Status

NETWORK TOPOLOGY:
═════════════════

External (NodePort) ─┬─► :30030 (Frontend)
                     ├─► :30080 (Auth API)
                     ├─► :30081 (Documents API)
                     ├─► :30090 (Affiliation API)
                     ├─► :30091 (Prometheus)
                     ├─► :30300 (Grafana)
                     ├─► :30672 (RabbitMQ AMQP)
                     ├─► :30673 (RabbitMQ Mgmt)
                     ├─► :30900 (MinIO API)
                     └─► :30901 (MinIO Console)

Internal (ClusterIP) ─┬─► All databases (not externally accessible)
                      ├─► Redis instances (not externally accessible)
                      ├─► DynamoDB (not externally accessible)
                      └─► Service-to-service communication

RESOURCE ALLOCATION:
═══════════════════

Total CPU Requests:    ~2.75 cores
Total Memory Requests: ~3.5 GB
Total Storage:         ~10 GB (PVCs)

Recommended Minikube: --cpus=4 --memory=8192 --disk-size=20g
```
