# 🚀 Microservices Complete Setup Guide

This guide will help you set up the entire microservices architecture from scratch.

## 📋 Prerequisites

Before running the setup script, ensure you have:

- **Docker** (version 20.x or higher)
- **Docker Compose** (version 2.x or higher)
- **Node.js** (version 18.x or higher)
- **npm** (version 8.x or higher)

Check versions:
```bash
docker --version
docker compose version
node --version
npm --version
```

## 🎯 Quick Start

### Option 1: Complete Setup from Scratch (Recommended)

This will clean everything and start fresh:

```bash
./setup-from-scratch.sh
```

This script will:
1. ✅ Stop all running services
2. ✅ Clean all Docker resources (containers, volumes, networks)
3. ✅ Rebuild and start all services
4. ✅ Apply database migrations
5. ✅ Create service users
6. ✅ Setup and start the frontend
7. ✅ Verify all services are running

**Total setup time: ~5-10 minutes** (depending on your internet speed and machine)

### Option 2: Start Services (if already set up)

```bash
./start-all-services.sh
```

### Option 3: Stop All Services

```bash
./stop-all-services.sh
```

To stop and clean volumes:
```bash
./stop-all-services.sh --clean
```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     MICROSERVICES ARCHITECTURE              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (Next.js)                                         │
│  Port: 3003                                                 │
│    ↓         ↓                    ↓                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │   Auth   │  │Documents │  │Affiliation                  │
│  │   :8080  │  │  :8081   │  │  :9090   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│       │             │              │                        │
│       ↓             ↓              ↓                        │
│  PostgreSQL    DynamoDB      MariaDB                        │
│    Redis       MinIO          Redis                         │
│                                                             │
│  ┌──────────────────────────────────────────┐              │
│  │     RabbitMQ (Shared Message Broker)     │              │
│  │              Port: 5673                  │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Service Endpoints

After setup completes, these services will be available:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3003 | Next.js web application |
| **Auth API** | http://localhost:8080 | User authentication service |
| **Documents API** | http://localhost:8081 | Document management service |
| **Affiliation API** | http://localhost:9090 | Citizen affiliation service |
| **RabbitMQ UI** | http://localhost:15673 | Message broker management |
| **MinIO Console** | http://localhost:9001 | Object storage management |
| **Grafana (Auth)** | http://localhost:3002 | Auth monitoring |
| **Grafana (Docs)** | http://localhost:3001 | Documents monitoring |
| **Grafana (Affil)** | http://localhost:3000 | Affiliation monitoring |
| **Prometheus (Auth)** | http://localhost:9093 | Auth metrics |
| **Prometheus (Docs)** | http://localhost:9092 | Documents metrics |
| **Prometheus (Affil)** | http://localhost:9091 | Affiliation metrics |

## 🔑 Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| RabbitMQ | admin | admin |
| MinIO | admin | admin123 |
| Grafana | admin | admin |

## 🧪 Testing the Complete Flow

After setup completes, test the end-to-end flow:

### 1. Register a New User
1. Open http://localhost:3003
2. Click "Registrarse"
3. Fill in the form with a valid citizen ID (e.g., 1128456232)
4. Submit

**Behind the scenes:**
- Frontend → Auth Service
- Auth Service → Affiliation Service (validates citizen ID via `/api/v1/affiliation/check/`)
- Affiliation → Govcarpeta API (external validation)
- User created in PostgreSQL

### 2. Login
1. Use the credentials you just created
2. Login

**Behind the scenes:**
- JWT token generated
- Token stored in cookies
- Redirected to documents page

### 3. Upload a Document
1. Navigate to "Documentos"
2. Click "Subir Documento"
3. Select a file and upload

**Behind the scenes:**
- Document metadata → DynamoDB
- File → MinIO S3-compatible storage
- Document status: "unauthenticated"

### 4. Request Document Authentication
1. Click "Autenticar" on the uploaded document

**Behind the scenes (Event-Driven Flow):**
```
Documents Service
  ↓ Publishes: document.authentication.requested
RabbitMQ (citizen_affiliation exchange)
  ↓ Routes to queue
Affiliation Service (Consumer)
  ↓ Processes event
  ↓ Calls Govcarpeta API
  ↓ Publishes: document.authentication.completed
RabbitMQ
  ↓ Routes result
Documents Service (Consumer)
  ↓ Updates document status
  ✓ Status: "authenticated"
```

### 5. Verify Authentication
1. Refresh the document page
2. Status should show "authenticated"

## 📝 Logs and Debugging

### View all running containers:
```bash
docker ps
```

### View service logs:
```bash
# Auth service
docker logs auth-service -f

# Documents service
docker logs documents-service -f

# Affiliation web
docker logs affiliation-web -f

# Affiliation consumer (RabbitMQ)
docker logs affiliation-document-consumer -f

# RabbitMQ
docker logs affiliation-rabbitmq -f
```

### Check RabbitMQ queues:
```bash
# Via UI
open http://localhost:15673

# Via CLI
docker exec affiliation-rabbitmq rabbitmqctl list_queues
```

### Check database:
```bash
# PostgreSQL (Auth)
docker exec -it auth-postgres psql -U authuser -d authdb

# MariaDB (Affiliation)
docker exec -it affiliation-db mysql -u affiliation_user -p affiliation_db
```

## 🔧 Troubleshooting

### Script fails during setup

1. Check Docker is running:
```bash
docker ps
```

2. Check ports are available:
```bash
lsof -i :8080  # Auth
lsof -i :8081  # Documents
lsof -i :9090  # Affiliation
lsof -i :3003  # Frontend
lsof -i :5673  # RabbitMQ
```

3. Clean everything and retry:
```bash
./stop-all-services.sh --clean
./setup-from-scratch.sh
```

### Service not responding

1. Check container status:
```bash
docker ps -a
```

2. Check logs for errors:
```bash
docker logs <container-name>
```

3. Restart specific service:
```bash
cd <service-directory>
docker compose restart
```

### RabbitMQ events not flowing

1. Check RabbitMQ is running:
```bash
curl http://localhost:15673
```

2. Check queues exist:
```bash
docker exec affiliation-rabbitmq rabbitmqctl list_queues
```

3. Check queue bindings:
```bash
curl -u admin:admin http://localhost:15673/api/queues
```

### Frontend not starting

1. Check Node.js version:
```bash
node --version  # Should be 18.x or higher
```

2. Reinstall dependencies:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port conflicts

If you see "port already in use" errors:

1. Find the process:
```bash
lsof -i :<port_number>
```

2. Kill the process:
```bash
kill -9 <PID>
```

3. Or modify ports in docker-compose.yml files

## 🛠️ Manual Setup (if script fails)

If the automated script fails, you can set up manually:

### 1. Start Affiliation Service (FIRST - has shared RabbitMQ)
```bash
cd project_connectivity
docker compose up -d --build
docker compose exec web python manage.py migrate
docker compose exec web python manage.py shell
# In shell: create user 'auth-service' with password 'auth-service-pass-123'
```

### 2. Start Auth Service
```bash
cd auth-microservice
docker compose up -d --build
```

### 3. Start Documents Service
```bash
cd documents-management-microservice
docker compose up -d --build
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📚 Additional Resources

- **Swagger Documentation (Auth)**: http://localhost:8080/swagger/index.html
- **API Schema (Affiliation)**: http://localhost:9090/api/schema/swagger-ui/
- **RabbitMQ Management**: http://localhost:15673
- **Grafana Dashboards**: http://localhost:3000, 3001, 3002

## 🎯 Next Steps

After successful setup:

1. Explore the Swagger documentation
2. Test the complete user flow
3. Monitor RabbitMQ message flow
4. Check Grafana dashboards for metrics
5. Review Prometheus metrics

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs
3. Verify all prerequisites are met
4. Try a clean setup from scratch

---

**Happy coding! 🚀**
