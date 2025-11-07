# 🚀 Local Development Setup Guide

This guide will help you run all microservices and the frontend locally.

## 📦 Project Structure

This workspace contains:
1. **Auth Microservice** (Go) - Authentication and JWT management
2. **Documents Management Microservice** (Go) - Document management with DynamoDB and S3
3. **Project Connectivity / Affiliation Microservice** (Python/Django) - Citizen affiliation and document authentication
4. **Frontend** (Next.js) - React-based web interface

## 🔧 Prerequisites

Before starting, ensure you have installed:

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Go** (1.21+) - for Go microservices
- **Python** (3.12+) - for Django microservice
- **Node.js** (18+) and **npm/yarn** - for frontend
- **Git**

## 📋 Quick Start - All Services with Docker Compose

The easiest way to run all services is using Docker Compose in each directory.

### Option 1: Run Each Service Independently

#### 1️⃣ Auth Microservice (Port 8080)

```bash
cd auth-microservice

# Start PostgreSQL, Redis, and Auth service
docker-compose up -d

# Check logs
docker-compose logs -f auth-service

# Service will be available at: http://localhost:8080
# Swagger API docs: http://localhost:8080/swagger/index.html
```

**Services started:**
- Auth API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Prometheus: `http://localhost:9090`

#### 2️⃣ Documents Management Microservice (Port 8081)

```bash
cd documents-management-microservice

# Start DynamoDB, MinIO, RabbitMQ, and Documents service
docker-compose up -d

# Check logs
docker-compose logs -f documents-service

# Service will be available at: http://localhost:8080
# Swagger API docs: http://localhost:8080/swagger/index.html
```

**Note:** This service uses port 8080 by default. To avoid conflict with Auth service, you can modify the port in docker-compose.yml or run services separately.

**Services started:**
- Documents API: `http://localhost:8080`
- DynamoDB: `localhost:8000`
- MinIO (S3): `http://localhost:9000` (Console: `http://localhost:9001`)
- RabbitMQ: `localhost:5672` (Management: `http://localhost:15672`)

**MinIO Credentials:**
- Username: `admin`
- Password: `admin123`

**RabbitMQ Credentials:**
- Username: `guest`
- Password: `guest`

#### 3️⃣ Affiliation Microservice - Django (Port 8000)

```bash
cd project_connectivity

# Copy environment variables
cp .env.example .env

# Edit .env file if needed (default values should work for local development)

# Start MariaDB, Redis, RabbitMQ, and Django service
docker-compose up -d

# Check logs
docker-compose logs -f web

# Service will be available at: http://localhost:8000
# API docs: http://localhost:8000/api/schema/swagger-ui/
```

**Services started:**
- Django API: `http://localhost:8000`
- MariaDB: `localhost:3306`
- Redis: `localhost:6379`
- RabbitMQ: `localhost:5672` (Management: `http://localhost:15672`)
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

**Grafana Credentials:**
- Username: `admin`
- Password: `admin`

#### 4️⃣ Frontend - Next.js (Port 3000)

```bash
cd frontend

# Install dependencies
npm install

# Create environment file (if needed)
# Check lib/api-constants.ts for API endpoint configuration

# Run development server
npm run dev

# Frontend will be available at: http://localhost:3000
```

---

## 🔨 Development Setup - Running Services Locally (without Docker)

If you prefer to run services directly on your machine without containers:

### 1️⃣ Auth Microservice

**Prerequisites:**
- PostgreSQL 16+ running on `localhost:5432`
- Redis 7+ running on `localhost:6379`

```bash
cd auth-microservice

# Install Go dependencies
go mod download

# Create .env file (or export environment variables)
cat > .env << EOF
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=authuser
DB_PASSWORD=authpassword
DB_NAME=authdb
DB_SSL_MODE=disable
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_DURATION=15m
JWT_REFRESH_TOKEN_DURATION=168h
APP_ENV=development
LOG_LEVEL=debug
EOF

# Run the service
go run cmd/server/main.go
```

### 2️⃣ Documents Management Microservice

**Prerequisites:**
- DynamoDB Local running on `localhost:8000`
- MinIO running on `localhost:9000`
- RabbitMQ running on `localhost:5672`

```bash
cd documents-management-microservice

# Install Go dependencies
go mod download

# Create .env file
cat > .env << EOF
APP_PORT=8081
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE=Documents
AWS_ACCESS_KEY_ID=admin
AWS_SECRET_ACCESS_KEY=admin123
AWS_REGION=us-east-1
S3_BUCKET=documents
S3_ENDPOINT=http://localhost:9000
S3_USE_PATH_STYLE=true
S3_PUBLIC_BASE_URL=http://localhost:9000/documents
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
EOF

# Run the service
go run cmd/server/main.go
```

### 3️⃣ Affiliation Microservice (Django)

**Prerequisites:**
- MariaDB/MySQL running on `localhost:3306`
- Redis running on `localhost:6379`
- RabbitMQ running on `localhost:5672`

```bash
cd project_connectivity

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/dev.txt

# Copy and configure .env
cp .env.example .env
# Edit .env to match your local database settings

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver 0.0.0.0:8000

# In another terminal, run the document consumer
python manage.py consume_document_auth
```

### 4️⃣ Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 🔄 Service Communication

The microservices communicate as follows:

```
Frontend (Next.js :3000)
    ↓
    ├─→ Auth Microservice (:8080)
    ├─→ Documents Microservice (:8080/:8081)
    └─→ Affiliation Microservice (:8000)

Auth Microservice
    ├─→ PostgreSQL (Users)
    ├─→ Redis (Token cache)
    └─→ RabbitMQ (Events)

Documents Microservice
    ├─→ DynamoDB (Document metadata)
    ├─→ S3/MinIO (Document storage)
    └─→ RabbitMQ (Events)

Affiliation Microservice
    ├─→ MariaDB (Affiliation data)
    ├─→ Redis (Cache)
    └─→ RabbitMQ (Events)
```

---

## 🧪 Testing the Services

### Test Auth Microservice

```bash
# Health check
curl http://localhost:8080/health

# Register user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Documents Microservice

```bash
# Health check
curl http://localhost:8080/health

# Create document (requires auth token)
curl -X POST http://localhost:8080/api/v1/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Document",
    "type": "PDF"
  }'
```

### Test Affiliation Microservice

```bash
# Health check
curl http://localhost:8000/api/health/

# API documentation
open http://localhost:8000/api/schema/swagger-ui/
```

### Test Frontend

```bash
# Open browser
open http://localhost:3000
```

---

## 🛑 Stopping Services

### Stop Docker Compose services:

```bash
# In each microservice directory
docker-compose down

# To remove volumes as well (clean state)
docker-compose down -v
```

### Stop local development servers:

Press `Ctrl+C` in each terminal running the services.

---

## 📝 Port Summary

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Auth API | 8080 | http://localhost:8080 |
| Documents API | 8080/8081 | http://localhost:8080 |
| Affiliation API | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |
| MariaDB | 3306 | localhost:3306 |
| Redis | 6379 | localhost:6379 |
| RabbitMQ | 5672 | localhost:5672 |
| RabbitMQ UI | 15672 | http://localhost:15672 |
| DynamoDB Local | 8000 | http://localhost:8000 |
| MinIO | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3000 | http://localhost:3000 |

**Note:** Some ports conflict (3000, 8080). You may need to adjust ports or run services separately.

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using a port (Linux/Mac)
lsof -i :8080

# Kill the process
kill -9 <PID>
```

### Docker Issues

```bash
# Clean up Docker
docker-compose down -v
docker system prune -a

# Rebuild containers
docker-compose up --build
```

### Database Connection Issues

- Ensure databases are running and accessible
- Check credentials in `.env` files
- Verify network connectivity

### Go Module Issues

```bash
# Clean Go module cache
go clean -modcache
go mod download
```

### Python Issues

```bash
# Recreate virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements/dev.txt
```

### Frontend Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Additional Resources

- Auth Microservice: `/auth-microservice/README.md`
- Documents Microservice: Check `docker-compose.yml` for configuration
- Affiliation Microservice: `/project_connectivity/README.md`
- Frontend: `/frontend/README.md`

---

## ✅ Recommended Setup for Local Development

For the best local development experience:

1. **Use Docker Compose for infrastructure** (databases, message queues, cache)
2. **Run microservices directly** (faster restart, easier debugging)
3. **Run frontend with npm dev** (hot reload)

This gives you the flexibility of Docker for complex infrastructure while maintaining fast iteration on code.

---

**Happy Coding! 🎉**
