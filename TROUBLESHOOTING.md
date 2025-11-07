# 🔧 Troubleshooting Guide

Common issues and solutions when running the microservices locally.

## 📋 Table of Contents

- [Port Conflicts](#port-conflicts)
- [Docker Issues](#docker-issues)
- [Database Connection Problems](#database-connection-problems)
- [Service-Specific Issues](#service-specific-issues)
- [Network Issues](#network-issues)
- [Performance Issues](#performance-issues)

---

## 🚨 Port Conflicts

### Problem: Port already in use

**Error messages:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:8080: bind: address already in use
```

**Solution 1: Find and kill the process**

```bash
# On Linux/Mac
lsof -i :8080

# Kill the process
kill -9 <PID>
```

```bash
# On Windows (PowerShell)
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Solution 2: Change the port**

Edit `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Change external port (left side)
```

### Common Port Conflicts

| Port | Service | Conflict Resolution |
|------|---------|---------------------|
| 3000 | Frontend / Grafana | Change Frontend to 3001 |
| 8080 | Auth / Documents | Change Documents to 8081 |
| 5672 | RabbitMQ (multiple) | Use different RabbitMQ instance |
| 6379 | Redis (multiple) | Use different Redis instance |
| 3306 | MariaDB / MySQL | Stop local MySQL or change port |
| 5432 | PostgreSQL | Stop local PostgreSQL or change port |

---

## 🐳 Docker Issues

### Problem: Docker daemon not running

**Error:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution:**
```bash
# Linux
sudo systemctl start docker

# Mac
# Start Docker Desktop application

# Windows
# Start Docker Desktop application
```

### Problem: Docker Compose version mismatch

**Error:**
```
ERROR: Version in "./docker-compose.yml" is unsupported
```

**Solution:**
```bash
# Check Docker Compose version
docker-compose --version

# Update to version 2.0+
# On Linux
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Problem: Out of disk space

**Error:**
```
no space left on device
```

**Solution:**
```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

### Problem: Container keeps restarting

**Solution:**
```bash
# Check logs
docker-compose logs -f <service-name>

# Check container status
docker ps -a

# Inspect container
docker inspect <container-name>

# Remove and recreate
docker-compose down
docker-compose up -d
```

---

## 💾 Database Connection Problems

### Problem: Database not ready

**Error:**
```
database is not ready: dial tcp 127.0.0.1:5432: connect: connection refused
```

**Solution:**
```bash
# Wait for database to be healthy
docker-compose ps

# Check database logs
docker-compose logs -f postgres
docker-compose logs -f db

# Restart services with dependencies
docker-compose down
docker-compose up -d
```

### Problem: Authentication failed for database

**Error:**
```
FATAL: password authentication failed for user "authuser"
```

**Solution 1: Check credentials**

Verify environment variables in `docker-compose.yml` or `.env` match.

**Solution 2: Recreate database volume**

```bash
cd <service-directory>
docker-compose down -v
docker-compose up -d
```

### Problem: Database migrations not applied (Django)

**Error:**
```
relation "users_user" does not exist
```

**Solution:**
```bash
cd project_connectivity

# Run migrations manually
docker-compose exec web python manage.py migrate

# Or restart the service (migrations run automatically)
docker-compose restart web
```

### Problem: PostgreSQL initialization failed

**Solution:**
```bash
cd auth-microservice

# Remove PostgreSQL volume and restart
docker-compose down -v
docker volume rm auth-microservice_postgres_data
docker-compose up -d postgres

# Check logs
docker-compose logs -f postgres
```

---

## 🔧 Service-Specific Issues

### Auth Microservice (Go)

#### Problem: JWT token validation fails

**Check:**
- Ensure `JWT_SECRET` is the same across all services
- Check token expiration time
- Verify token format (Bearer token)

**Debug:**
```bash
# Check logs
docker-compose -f auth-microservice/docker-compose.yml logs -f auth-service

# Test endpoint
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Problem: Redis connection failed

**Solution:**
```bash
cd auth-microservice

# Check Redis status
docker-compose logs -f redis

# Test Redis connection
docker exec -it auth-redis redis-cli
> PING
# Should return PONG

# If password protected
> AUTH redispassword
> PING
```

#### Problem: Go module download issues

**Solution:**
```bash
cd auth-microservice

# Clear module cache
go clean -modcache

# Download modules
go mod download

# Update dependencies
go mod tidy
```

### Documents Microservice (Go)

#### Problem: DynamoDB table not created

**Solution:**
```bash
cd documents-management-microservice

# Check initialization logs
docker-compose logs -f dynamodb-init

# Recreate initialization
docker-compose down
docker-compose up -d

# Manually create table (if needed)
docker-compose exec dynamodb-local aws dynamodb create-table \
  --table-name Documents \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000
```

#### Problem: MinIO bucket not created

**Solution:**
```bash
cd documents-management-microservice

# Check MinIO logs
docker-compose logs -f minio-init

# Access MinIO console
open http://localhost:9001
# Login: admin/admin123

# Manually create bucket
docker-compose exec minio mc mb /data/documents
```

#### Problem: S3 upload fails

**Check:**
- MinIO is running: `docker ps | grep minio`
- Bucket exists: Check MinIO console
- Credentials are correct in environment variables

### Affiliation Microservice (Django)

#### Problem: Django migrations not applied

**Solution:**
```bash
cd project_connectivity

# Apply migrations
docker-compose exec web python manage.py migrate

# Create migrations for new models
docker-compose exec web python manage.py makemigrations

# Check migration status
docker-compose exec web python manage.py showmigrations
```

#### Problem: Static files not served

**Solution:**
```bash
cd project_connectivity

# Collect static files
docker-compose exec web python manage.py collectstatic --noinput
```

#### Problem: RabbitMQ consumer not running

**Solution:**
```bash
cd project_connectivity

# Check consumer logs
docker-compose logs -f document-consumer

# Restart consumer
docker-compose restart document-consumer

# Check RabbitMQ queues
open http://localhost:15672
# Login: guest/guest
```

#### Problem: External API timeout

**Error:**
```
requests.exceptions.Timeout: HTTPSConnectionPool
```

**Solution:**
- Check internet connection
- Verify `EXTERNAL_AFFILIATION_API_URL` in `.env`
- Increase `EXTERNAL_API_TIMEOUT` value
- Check external API status

### Frontend (Next.js)

#### Problem: Module not found

**Solution:**
```bash
cd frontend

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use clean install
npm ci
```

#### Problem: API connection refused

**Check:**
- Backend services are running
- API URLs in `lib/api-constants.ts` are correct
- CORS is properly configured

**Debug:**
```bash
# Test backend directly
curl http://localhost:8080/health
curl http://localhost:8000/api/health/
```

#### Problem: Build fails

**Solution:**
```bash
cd frontend

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

---

## 🌐 Network Issues

### Problem: Services can't communicate

**Solution:**
```bash
# Check if services are on the same network
docker network ls
docker network inspect <network-name>

# Restart services
docker-compose down
docker-compose up -d
```

### Problem: DNS resolution fails

**Error:**
```
could not resolve host: postgres
```

**Solution:**
- Ensure services are defined in the same `docker-compose.yml`
- Use service names as hostnames (e.g., `postgres`, not `localhost`)
- Check network configuration in docker-compose.yml

### Problem: CORS errors in browser

**Error:**
```
Access to fetch at 'http://localhost:8080' from origin 'http://localhost:3000' has been blocked by CORS
```

**Solution:**

For Go services, check CORS middleware configuration.

For Django:
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]
```

---

## ⚡ Performance Issues

### Problem: Slow database queries

**Solution:**
```bash
# Check database connections
docker-compose exec postgres psql -U authuser -d authdb -c "SELECT * FROM pg_stat_activity;"

# Check slow queries (PostgreSQL)
docker-compose exec postgres psql -U authuser -d authdb -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### Problem: High memory usage

**Solution:**
```bash
# Check Docker stats
docker stats

# Limit memory in docker-compose.yml
services:
  service-name:
    mem_limit: 512m
    mem_reservation: 256m
```

### Problem: Slow container startup

**Solution:**
- Use multi-stage Docker builds
- Minimize dependencies
- Use caching layers in Dockerfile
- Check health check intervals

---

## 🔍 Debugging Tools

### View all running containers
```bash
docker ps
```

### View all containers (including stopped)
```bash
docker ps -a
```

### Follow logs for all services
```bash
docker-compose logs -f
```

### Follow logs for specific service
```bash
docker-compose logs -f <service-name>
```

### Execute command in running container
```bash
docker-compose exec <service-name> <command>

# Examples:
docker-compose exec web python manage.py shell
docker-compose exec postgres psql -U authuser -d authdb
docker-compose exec redis redis-cli
```

### Inspect container
```bash
docker inspect <container-name>
```

### Check container resource usage
```bash
docker stats
```

### Access container shell
```bash
docker-compose exec <service-name> /bin/bash
# or
docker-compose exec <service-name> sh
```

---

## 🆘 Emergency Recovery

### Nuclear Option: Clean Everything

```bash
# Stop all containers
docker stop $(docker ps -a -q)

# Remove all containers
docker rm $(docker ps -a -q)

# Remove all volumes
docker volume prune -a

# Remove all networks
docker network prune

# Remove all images
docker image prune -a

# Or all at once
docker system prune -a --volumes

# Then restart
./start-all-services.sh
```

### Selective Cleanup

```bash
# Clean specific service
cd <service-directory>
docker-compose down -v
docker-compose up --build -d
```

---

## 📞 Still Having Issues?

1. Check the [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md) for detailed setup instructions
2. Review [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common commands
3. Check individual service README files
4. Enable debug logging:
   - Go services: Set `LOG_LEVEL=debug`
   - Django: Set `DEBUG=True`
5. Open an issue with:
   - Error message
   - Service logs
   - Docker version
   - Operating system
   - Steps to reproduce

---

**Good luck! 🍀**
