# 🏗️ Full Stack Microservices Project

A complete microservices architecture with authentication, document management, citizen affiliation checking, and a modern web frontend.

## 📁 Project Structure

```
full_project/
├── auth-microservice/              # 🔐 Authentication & JWT Management (Go)
├── documents-management-microservice/  # 📄 Document Management (Go)
├── project_connectivity/           # 🏥 Citizen Affiliation Service (Django)
├── frontend/                       # 🎨 Web Interface (Next.js)
├── infrastructure-shared/          # ☁️ Shared Infrastructure (Terraform)
├── start-all-services.sh          # 🚀 Start all services
├── stop-all-services.sh           # 🛑 Stop all services
├── LOCAL_SETUP_GUIDE.md           # 📚 Detailed setup instructions
└── QUICK_REFERENCE.md             # ⚡ Quick reference card
```

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for frontend)
- Go 1.21+ (optional, for local development)
- Python 3.12+ (optional, for local development)

### Start All Services

```bash
# Make scripts executable (first time only)
chmod +x start-all-services.sh stop-all-services.sh

# Start everything
./start-all-services.sh
```

This will start:
- ✅ Auth Microservice (http://localhost:8080)
- ✅ Documents Microservice (http://localhost:8081)
- ✅ Affiliation Microservice (http://localhost:8000)
- ✅ Frontend (http://localhost:3001)
- ✅ All supporting infrastructure (databases, message queues, etc.)

### Stop All Services

```bash
./stop-all-services.sh

# Or with data cleanup
./stop-all-services.sh --clean
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                      http://localhost:3001                       │
└───────────────┬─────────────────┬──────────────────┬─────────────┘
                │                 │                  │
        ┌───────▼────────┐ ┌─────▼───────┐  ┌──────▼──────────┐
        │ Auth Service   │ │  Documents  │  │  Affiliation    │
        │    (Go)        │ │  Service    │  │  Service        │
        │   Port 8080    │ │    (Go)     │  │  (Django)       │
        │                │ │  Port 8081  │  │  Port 8000      │
        └───────┬────────┘ └──────┬──────┘  └─────────┬────────┘
                │                 │                    │
        ┌───────▼────────┐ ┌─────▼───────┐  ┌─────────▼────────┐
        │  PostgreSQL    │ │  DynamoDB   │  │    MariaDB       │
        │     Redis      │ │    MinIO    │  │     Redis        │
        │                │ │  RabbitMQ   │  │   RabbitMQ       │
        └────────────────┘ └─────────────┘  └──────────────────┘
```

## 🔧 Services Overview

### 1. Auth Microservice (Go)

**Purpose**: Centralized authentication and authorization

**Features**:
- User registration and login
- JWT token generation (access & refresh)
- Token validation and refresh
- Password hashing with bcrypt
- Redis-based token blacklist
- User profile management

**Tech Stack**: Go, PostgreSQL, Redis, JWT

**Endpoints**:
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout and invalidate tokens
- `GET /api/v1/auth/me` - Get current user info

### 2. Documents Management Microservice (Go)

**Purpose**: Store, manage, and retrieve documents

**Features**:
- Document upload to S3-compatible storage (MinIO)
- Document metadata storage in DynamoDB
- Document retrieval and download
- Event-driven architecture with RabbitMQ
- Document authentication workflow

**Tech Stack**: Go, DynamoDB, MinIO (S3), RabbitMQ

**Endpoints**:
- `POST /api/v1/documents` - Upload document
- `GET /api/v1/documents` - List documents
- `GET /api/v1/documents/:id` - Get document details
- `DELETE /api/v1/documents/:id` - Delete document

### 3. Affiliation Microservice (Django/Python)

**Purpose**: Citizen affiliation checking and document authentication

**Features**:
- Check citizen affiliation eligibility via external API
- Document authentication workflow
- Event publishing to RabbitMQ
- RabbitMQ consumer for document authentication
- Prometheus metrics integration
- Grafana dashboards

**Tech Stack**: Django, MariaDB, Redis, RabbitMQ, Prometheus, Grafana

**Endpoints**:
- `POST /api/affiliation/check/` - Check affiliation
- `POST /api/documents/authenticate/` - Authenticate document
- `GET /api/health/` - Health check

### 4. Frontend (Next.js)

**Purpose**: User-facing web application

**Features**:
- User authentication UI
- Document upload and management
- Affiliation checking interface
- Responsive design with Tailwind CSS
- JWT token management
- Protected routes

**Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS

## 🔌 Service Communication

### Event-Driven Architecture (RabbitMQ)

```
Auth Service
    │
    ├─→ user.created ─────────→ Documents Service
    ├─→ user.updated ─────────→ Documents Service
    └─→ user.transferred ─────→ Affiliation Service

Documents Service
    │
    ├─→ document.authentication.requested ─→ Affiliation Service
    └─→ document.uploaded ────────────────→ Affiliation Service

Affiliation Service
    │
    ├─→ affiliation.checked ──────────────→ Documents Service
    └─→ document.authentication.completed ─→ Documents Service
```

### Synchronous Communication (HTTP/REST)

- Frontend → Auth Service: User authentication
- Frontend → Documents Service: Document operations
- Frontend → Affiliation Service: Affiliation checks

## 🗄️ Data Storage

| Service | Primary DB | Cache | Message Queue | Object Storage |
|---------|-----------|-------|---------------|----------------|
| Auth | PostgreSQL | Redis | RabbitMQ | - |
| Documents | DynamoDB | - | RabbitMQ | MinIO (S3) |
| Affiliation | MariaDB | Redis | RabbitMQ | - |

## 🌐 Port Mapping

| Service/Tool | Port | Access URL |
|--------------|------|------------|
| Frontend | 3001 | http://localhost:3001 |
| Auth API | 8080 | http://localhost:8080 |
| Documents API | 8081 | http://localhost:8081 |
| Affiliation API | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |
| MariaDB | 3306 | localhost:3306 |
| Redis (Auth) | 6379 | localhost:6379 |
| Redis (Affiliation) | 6380 | localhost:6380 |
| RabbitMQ | 5672 | localhost:5672 |
| RabbitMQ Management | 15672 | http://localhost:15672 |
| DynamoDB Local | 8000 | http://localhost:8000 |
| MinIO | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3000 | http://localhost:3000 |

## 🔐 Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| RabbitMQ | guest | guest |
| MinIO | admin | admin123 |
| Grafana | admin | admin |
| MariaDB | djangouser | djangopass |
| PostgreSQL | authuser | authpassword |

## 📚 Documentation

- **[LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)** - Comprehensive setup guide
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference card
- **[auth-microservice/README.md](./auth-microservice/README.md)** - Auth service docs
- **[project_connectivity/README.md](./project_connectivity/README.md)** - Affiliation service docs

## 🧪 Testing

### Quick Health Checks

```bash
# Auth Service
curl http://localhost:8080/health

# Documents Service
curl http://localhost:8081/health

# Affiliation Service
curl http://localhost:8000/api/health/

# Frontend
curl http://localhost:3001
```

### API Documentation

- **Auth Swagger**: http://localhost:8080/swagger/index.html
- **Affiliation Swagger**: http://localhost:8000/api/schema/swagger-ui/
- **Documents**: Check docker-compose.yml for endpoint details

## 🛠️ Development Workflow

### 1. Initial Setup

```bash
git clone <repository>
cd full_project
./start-all-services.sh
```

### 2. Making Changes

#### Go Services (Auth/Documents)
```bash
# Make code changes
cd auth-microservice  # or documents-management-microservice

# Rebuild and restart
docker-compose up --build -d

# View logs
docker-compose logs -f
```

#### Django Service (Affiliation)
```bash
# Make code changes
cd project_connectivity

# Restart service (Django auto-reloads in dev mode)
docker-compose restart web

# Run migrations if models changed
docker-compose exec web python manage.py migrate
```

#### Frontend
```bash
# Changes auto-reload in dev mode
cd frontend

# If dependencies changed
npm install
```

### 3. Running Tests

```bash
# Go services
cd auth-microservice
go test ./...

# Django service
cd project_connectivity
docker-compose exec web python manage.py test
# or
docker-compose exec web pytest

# Frontend
cd frontend
npm test
```

## 🚢 Deployment

Each microservice includes:
- **Dockerfile** for containerization
- **k8s/** directory with Kubernetes manifests
- **terraform/** directory for infrastructure as code
- **CI/CD** configurations (GitHub Actions)

See individual service directories for deployment instructions.

## 📊 Monitoring

### Prometheus Metrics

Access Prometheus at http://localhost:9090

Available metrics:
- HTTP request duration
- Request count by endpoint
- Error rates
- Custom business metrics

### Grafana Dashboards

Access Grafana at http://localhost:3000 (admin/admin)

Pre-configured dashboards for:
- Django application metrics
- Database performance
- RabbitMQ message rates
- System resources

## 🐛 Troubleshooting

### Services won't start

```bash
# Check Docker daemon
docker ps

# Check port conflicts
lsof -i :8080

# Clean and restart
./stop-all-services.sh --clean
./start-all-services.sh
```

### Database connection errors

```bash
# Wait for databases to be ready
docker-compose logs -f postgres
docker-compose logs -f db

# Check database health
docker-compose ps
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose -f auth-microservice/docker-compose.yml logs -f auth-service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

See individual service directories for license information.

## 👥 Team

- Auth Microservice: [@kristianrpo](https://github.com/kristianrpo)
- Documents Microservice: [@kristianrpo](https://github.com/kristianrpo)
- Affiliation Microservice: Team effort
- Frontend: Team effort

## 🆘 Support

For issues or questions:
1. Check the [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
2. Review [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)
3. Check individual service README files
4. Open an issue in the repository

---

**Happy Coding! 🎉**
