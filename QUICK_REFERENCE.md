# 🚀 Quick Reference Card

## 📦 Services Overview

| Service | Technology | Port | Description |
|---------|-----------|------|-------------|
| **Auth Microservice** | Go 1.25 | 8080 | JWT authentication & user management |
| **Documents Microservice** | Go 1.25 | 8081 | Document management with S3 & DynamoDB |
| **Affiliation Microservice** | Python 3.12 Django | 8000 | Citizen affiliation & document auth |
| **Frontend** | Next.js 16 React 19 | 3001 | Web interface |

## ⚡ Quick Start Commands

### Start Everything (Recommended)
```bash
./start-all-services.sh
```

### Stop Everything
```bash
./stop-all-services.sh
```

### Stop and Clean All Data
```bash
./stop-all-services.sh --clean
```

## 🔧 Individual Service Commands

### Auth Microservice
```bash
cd auth-microservice
docker-compose up -d        # Start
docker-compose logs -f      # View logs
docker-compose down         # Stop
```

### Documents Microservice
```bash
cd documents-management-microservice
docker-compose up -d        # Start
docker-compose logs -f      # View logs
docker-compose down         # Stop
```

### Affiliation Microservice
```bash
cd project_connectivity
cp .env.example .env        # First time only
docker-compose up -d        # Start
docker-compose logs -f web  # View logs
docker-compose down         # Stop
```

### Frontend
```bash
cd frontend
npm install                 # First time only
npm run dev                 # Start dev server
# Press Ctrl+C to stop
```

## 🌐 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3001 | - |
| Auth API | http://localhost:8080 | - |
| Auth Swagger | http://localhost:8080/swagger/index.html | - |
| Documents API | http://localhost:8081 | - |
| Affiliation API | http://localhost:8000 | - |
| Affiliation Docs | http://localhost:8000/api/schema/swagger-ui/ | - |
| RabbitMQ UI | http://localhost:15672 | guest/guest |
| MinIO Console | http://localhost:9001 | admin/admin123 |
| Grafana | http://localhost:3000 | admin/admin |
| Prometheus | http://localhost:9090 | - |

## 🔍 Health Check Endpoints

```bash
# Auth Microservice
curl http://localhost:8080/health

# Documents Microservice
curl http://localhost:8081/health

# Affiliation Microservice
curl http://localhost:8000/api/health/
```

## 🧪 Quick Test Commands

### Register a User (Auth Service)
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🐛 Troubleshooting

### Check Running Containers
```bash
docker ps
```

### View Logs
```bash
# All services in current directory
docker-compose logs -f

# Specific service
docker-compose logs -f <service-name>

# Last 100 lines
docker-compose logs --tail=100 <service-name>
```

### Port Already in Use
```bash
# Find process using port (Linux/Mac)
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Restart a Service
```bash
cd <service-directory>
docker-compose restart <service-name>
```

### Rebuild After Code Changes
```bash
cd <service-directory>
docker-compose up --build -d
```

### Clean Everything and Start Fresh
```bash
# Stop all services
./stop-all-services.sh --clean

# Remove all Docker resources
docker system prune -a --volumes

# Start again
./start-all-services.sh
```

## 📊 Database Access

### PostgreSQL (Auth Service)
```bash
docker exec -it auth-postgres psql -U authuser -d authdb
```

### MariaDB (Affiliation Service)
```bash
docker exec -it affiliation-db mysql -u djangouser -p
# Password: djangopass
```

### Redis
```bash
docker exec -it auth-redis redis-cli
# If password protected: AUTH redispassword
```

## 🔐 Environment Variables

### Auth Microservice
Key variables in `docker-compose.yml`:
- `JWT_SECRET` - JWT signing key
- `DB_*` - PostgreSQL connection
- `REDIS_*` - Redis connection

### Documents Microservice
Key variables in `docker-compose.yml`:
- `AWS_*` - AWS credentials for DynamoDB/S3
- `RABBITMQ_URL` - RabbitMQ connection

### Affiliation Microservice
Create `.env` from `.env.example`:
- `DATABASE_URL` - MariaDB connection
- `REDIS_HOST` - Redis connection
- `RABBITMQ_*` - RabbitMQ settings

## 📝 Development Tips

### Hot Reload
- **Frontend**: Auto-reloads on file changes
- **Go Services**: Restart required after code changes
- **Django**: Auto-reloads in development mode

### Rebuild After Go Code Changes
```bash
cd auth-microservice  # or documents-management-microservice
docker-compose up --build -d
```

### Run Django Management Commands
```bash
cd project_connectivity
docker-compose exec web python manage.py <command>

# Examples:
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
docker-compose exec web python manage.py shell
```

### View Frontend Build Output
```bash
cd frontend
npm run build
```

## 🎯 Common Tasks

### Reset Databases
```bash
# Auth PostgreSQL
docker-compose -f auth-microservice/docker-compose.yml down -v
docker-compose -f auth-microservice/docker-compose.yml up -d

# Affiliation MariaDB
docker-compose -f project_connectivity/docker-compose.yml down -v
docker-compose -f project_connectivity/docker-compose.yml up -d
```

### Access RabbitMQ Management
1. Open http://localhost:15672
2. Login: guest/guest
3. View queues, exchanges, and messages

### Access MinIO Console
1. Open http://localhost:9001
2. Login: admin/admin123
3. Manage buckets and files

### Monitor with Grafana
1. Open http://localhost:3000
2. Login: admin/admin
3. View dashboards for Django metrics

## 📚 Documentation Links

- [Detailed Setup Guide](./LOCAL_SETUP_GUIDE.md)
- [Auth Microservice README](./auth-microservice/README.md)
- [Affiliation Microservice README](./project_connectivity/README.md)

## 🆘 Getting Help

If you encounter issues:

1. Check service logs: `docker-compose logs -f`
2. Verify all containers are running: `docker ps`
3. Check the detailed [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)
4. Ensure all ports are available
5. Try cleaning and restarting: `./stop-all-services.sh --clean && ./start-all-services.sh`

---

**Happy Development! 🎉**
