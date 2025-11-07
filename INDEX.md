# 📚 Documentation Index

Welcome to the complete documentation for the Full Stack Microservices Project!

## 🎯 Quick Navigation

### 🚀 Getting Started
- **[README.md](./README.md)** - Project overview and quick start
- **[LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)** - Detailed local development setup
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick command reference

### 🏗️ Architecture & Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture diagrams and design
- Flow diagrams and component interactions
- Technology stack details

### 🔧 Operations
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[start-all-services.sh](./start-all-services.sh)** - Automated startup script
- **[stop-all-services.sh](./stop-all-services.sh)** - Automated shutdown script

### 📦 Service-Specific Documentation

#### 🔐 Auth Microservice
- **Location**: `auth-microservice/`
- **[README](./auth-microservice/README.md)** - Service documentation
- **[Swagger Docs](http://localhost:8080/swagger/index.html)** - API documentation (when running)
- **Port**: 8080

#### 📄 Documents Management Microservice
- **Location**: `documents-management-microservice/`
- **[docker-compose.yml](./documents-management-microservice/docker-compose.yml)** - Configuration
- **Port**: 8081

#### 🏥 Affiliation Microservice
- **Location**: `project_connectivity/`
- **[README](./project_connectivity/README.md)** - Service documentation
- **[API Docs](http://localhost:8000/api/schema/swagger-ui/)** - API documentation (when running)
- **Port**: 8000

#### 🎨 Frontend
- **Location**: `frontend/`
- **[README](./frontend/README.md)** - Frontend documentation
- **Port**: 3001

---

## 📖 Documentation by Topic

### Installation & Setup

1. **First Time Setup**
   - Read: [README.md](./README.md) → Quick Start section
   - Then: [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md) → Prerequisites
   - Run: `./start-all-services.sh`

2. **Development Setup**
   - [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md) → Development Setup section
   - Individual service README files

3. **Production Deployment**
   - Each service has `k8s/` and `terraform/` directories
   - See individual service documentation

### Understanding the System

1. **Architecture Overview**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) → System Architecture
   - [ARCHITECTURE.md](./ARCHITECTURE.md) → Data Flow Diagrams

2. **Service Communication**
   - [README.md](./README.md) → Service Communication section
   - [ARCHITECTURE.md](./ARCHITECTURE.md) → Event-Driven Architecture

3. **Technology Stack**
   - [README.md](./README.md) → Services Overview
   - [ARCHITECTURE.md](./ARCHITECTURE.md) → Technology Stack by Layer

### Day-to-Day Operations

1. **Starting Services**
   - [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Quick Start Commands
   - Run: `./start-all-services.sh`

2. **Stopping Services**
   - [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Quick Start Commands
   - Run: `./stop-all-services.sh`

3. **Viewing Logs**
   - [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Troubleshooting section
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) → Debugging Tools

4. **Running Tests**
   - [README.md](./README.md) → Testing section
   - Individual service documentation

### Problem Solving

1. **Common Issues**
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) → All sections
   - [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Troubleshooting

2. **Port Conflicts**
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) → Port Conflicts
   - [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Access Points

3. **Database Issues**
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) → Database Connection Problems
   - [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md) → Development Setup

4. **Service-Specific Problems**
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) → Service-Specific Issues
   - Individual service README files

### API Documentation

1. **Auth API**
   - Live: http://localhost:8080/swagger/index.html
   - [README.md](./README.md) → Auth Service section
   - [auth-microservice/README.md](./auth-microservice/README.md)

2. **Documents API**
   - Check: `documents-management-microservice/docs/`
   - [README.md](./README.md) → Documents Service section

3. **Affiliation API**
   - Live: http://localhost:8000/api/schema/swagger-ui/
   - [README.md](./README.md) → Affiliation Service section
   - [project_connectivity/README.md](./project_connectivity/README.md)

### Monitoring & Observability

1. **Prometheus**
   - Access: http://localhost:9090
   - [ARCHITECTURE.md](./ARCHITECTURE.md) → Monitoring Layer

2. **Grafana**
   - Access: http://localhost:3000 (admin/admin)
   - [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Access Points

3. **RabbitMQ Management**
   - Access: http://localhost:15672 (guest/guest)
   - [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Access Points

4. **MinIO Console**
   - Access: http://localhost:9001 (admin/admin123)
   - [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Access Points

---

## 📋 Checklists

### ✅ New Developer Onboarding

- [ ] Install Docker and Docker Compose
- [ ] Clone the repository
- [ ] Read [README.md](./README.md)
- [ ] Read [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)
- [ ] Run `./start-all-services.sh`
- [ ] Verify all services are running: `docker ps`
- [ ] Access frontend: http://localhost:3001
- [ ] Review [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- [ ] Bookmark [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [ ] Join team communication channels

### ✅ Before Making Changes

- [ ] Pull latest code: `git pull`
- [ ] Start services: `./start-all-services.sh`
- [ ] Check service health
- [ ] Create feature branch
- [ ] Review relevant service documentation

### ✅ Before Committing

- [ ] Run tests for modified services
- [ ] Check for linting errors
- [ ] Verify services still work
- [ ] Update documentation if needed
- [ ] Review changes: `git diff`
- [ ] Write meaningful commit message

### ✅ Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Documentation updated

---

## 🔍 Search Guide

### Finding Information

**If you want to...**

- **Start all services** → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) or run `./start-all-services.sh`
- **Fix an error** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Understand the system** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Set up for development** → [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)
- **Find an API endpoint** → Service-specific Swagger docs
- **See all ports** → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Access Points
- **Learn about a service** → README in service directory
- **Deploy to production** → Service k8s/ or terraform/ directory
- **Monitor the system** → [ARCHITECTURE.md](./ARCHITECTURE.md) → Monitoring

---

## 📞 Support

### Getting Help

1. **Check Documentation**
   - Start with [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
   - Search [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
   - Review relevant service README

2. **Debug Yourself**
   - Check logs: `docker-compose logs -f`
   - Verify services are running: `docker ps`
   - Check health endpoints
   - Review error messages

3. **Ask for Help**
   - Provide error message
   - Include service logs
   - Describe what you tried
   - Share environment info

---

## 📚 Learning Path

### For New Developers

1. **Day 1: Overview**
   - [ ] Read [README.md](./README.md)
   - [ ] Review [ARCHITECTURE.md](./ARCHITECTURE.md)
   - [ ] Get services running with [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)

2. **Day 2: Deep Dive**
   - [ ] Explore each service individually
   - [ ] Read service-specific READMEs
   - [ ] Test API endpoints
   - [ ] Review code structure

3. **Day 3: Hands-On**
   - [ ] Make a small change
   - [ ] Run tests
   - [ ] Debug an issue using [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
   - [ ] Practice with [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

4. **Week 1+: Mastery**
   - [ ] Contribute to a service
   - [ ] Write tests
   - [ ] Update documentation
   - [ ] Help onboard others

### For Backend Developers

Focus on:
- [auth-microservice/README.md](./auth-microservice/README.md)
- [project_connectivity/README.md](./project_connectivity/README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md) → Data Flow Diagrams

### For Frontend Developers

Focus on:
- [frontend/README.md](./frontend/README.md)
- API documentation (Swagger)
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → Access Points

### For DevOps Engineers

Focus on:
- Docker Compose files in each service
- k8s/ directories
- terraform/ directories
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md) → Container Architecture

---

## 🗺️ Document Map

```
📁 full_project/
│
├── 📄 README.md ............................ Main project overview
├── 📄 LOCAL_SETUP_GUIDE.md ................. Detailed setup instructions
├── 📄 QUICK_REFERENCE.md ................... Quick command reference
├── 📄 TROUBLESHOOTING.md ................... Problem-solving guide
├── 📄 ARCHITECTURE.md ...................... Architecture diagrams
├── 📄 INDEX.md ............................. This file!
│
├── 🔐 auth-microservice/
│   ├── 📄 README.md ........................ Auth service docs
│   ├── 📄 docker-compose.yml ............... Service configuration
│   └── 📁 docs/ ............................ API documentation
│
├── 📄 documents-management-microservice/
│   ├── 📄 docker-compose.yml ............... Service configuration
│   └── 📁 docs/ ............................ API documentation
│
├── 🏥 project_connectivity/
│   ├── 📄 README.md ........................ Affiliation service docs
│   ├── 📄 docker-compose.yml ............... Service configuration
│   └── 📄 .env.example ..................... Environment template
│
└── 🎨 frontend/
    ├── 📄 README.md ........................ Frontend documentation
    └── 📄 package.json ..................... Dependencies
```

---

## 🎓 Glossary

| Term | Description |
|------|-------------|
| **Auth Service** | Microservice handling authentication and JWT tokens |
| **Documents Service** | Microservice for document storage and management |
| **Affiliation Service** | Django service for citizen affiliation checks |
| **JWT** | JSON Web Token - used for authentication |
| **RabbitMQ** | Message broker for event-driven communication |
| **MinIO** | S3-compatible object storage |
| **DynamoDB** | NoSQL database service (AWS) |
| **HPA** | Horizontal Pod Autoscaler (Kubernetes) |
| **CORS** | Cross-Origin Resource Sharing |

---

## 📝 Recent Updates

- ✅ Created comprehensive documentation suite
- ✅ Added automated startup/shutdown scripts
- ✅ Created troubleshooting guide
- ✅ Added architecture diagrams
- ✅ Created quick reference card
- ✅ Added this index document

---

**Happy Learning! 🎉**

*Last updated: November 2025*
