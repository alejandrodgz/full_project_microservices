# Kubernetes Minikube Quick Reference

## 🚀 Quick Commands

### Deployment
```bash
# Full automated deployment
./k8s-minikube/deploy-minikube.sh

# Cleanup everything
./k8s-minikube/cleanup.sh
```

### Minikube Operations
```bash
# Start cluster
minikube start --cpus=4 --memory=8192

# Stop cluster (preserves state)
minikube stop

# Delete cluster completely
minikube delete

# Get cluster IP
minikube ip

# SSH into cluster
minikube ssh

# Open dashboard
minikube dashboard

# Enable addon
minikube addons enable ingress
minikube addons enable metrics-server

# Use minikube Docker daemon
eval $(minikube docker-env)

# Reset to host Docker daemon
eval $(minikube docker-env -u)
```

### kubectl Basics
```bash
# Get all resources in namespace
kubectl get all -n microservices

# Get pods
kubectl get pods -n microservices
kubectl get pods -n microservices -w  # watch mode

# Get services
kubectl get svc -n microservices

# Get persistent volume claims
kubectl get pvc -n microservices

# Describe resource
kubectl describe pod <pod-name> -n microservices
kubectl describe svc <service-name> -n microservices

# View logs
kubectl logs <pod-name> -n microservices
kubectl logs <pod-name> -n microservices -f  # follow
kubectl logs <pod-name> -n microservices --previous  # previous container

# Execute command in pod
kubectl exec -it <pod-name> -n microservices -- /bin/bash
kubectl exec -it <pod-name> -n microservices -- sh

# Port forward
kubectl port-forward svc/<service-name> <local-port>:<service-port> -n microservices
kubectl port-forward pod/<pod-name> <local-port>:<container-port> -n microservices

# Delete resource
kubectl delete pod <pod-name> -n microservices
kubectl delete svc <service-name> -n microservices

# Restart deployment
kubectl rollout restart deployment/<deployment-name> -n microservices

# Scale deployment
kubectl scale deployment/<deployment-name> --replicas=3 -n microservices

# View events
kubectl get events -n microservices --sort-by='.lastTimestamp'

# Edit resource
kubectl edit deployment/<deployment-name> -n microservices
```

## 🔍 Service Access

### Get Minikube IP
```bash
export MINIKUBE_IP=$(minikube ip)
echo $MINIKUBE_IP
```

### Service URLs Template
```
Frontend:              http://${MINIKUBE_IP}:30030
Auth API:              http://${MINIKUBE_IP}:30080
Auth Swagger:          http://${MINIKUBE_IP}:30080/swagger/index.html
Documents API:         http://${MINIKUBE_IP}:30081
Documents Swagger:     http://${MINIKUBE_IP}:30081/swagger/index.html
Affiliation API:       http://${MINIKUBE_IP}:30090
Affiliation Swagger:   http://${MINIKUBE_IP}:30090/api/schema/swagger-ui/
RabbitMQ Management:   http://${MINIKUBE_IP}:30673
MinIO Console:         http://${MINIKUBE_IP}:30901
Prometheus:            http://${MINIKUBE_IP}:30091
Grafana:               http://${MINIKUBE_IP}:30300
```

### Open Service in Browser
```bash
minikube service frontend -n microservices
minikube service grafana -n microservices
minikube service rabbitmq -n microservices

# List all services
minikube service list -n microservices
```

## 🐛 Troubleshooting Commands

### Check Pod Status
```bash
# Quick status
kubectl get pods -n microservices

# Detailed info
kubectl describe pod <pod-name> -n microservices

# Check resource usage
kubectl top pods -n microservices
kubectl top nodes
```

### Debug Container Issues
```bash
# Check logs
kubectl logs <pod-name> -n microservices

# Check previous logs (if container crashed)
kubectl logs <pod-name> -n microservices --previous

# Shell into running container
kubectl exec -it <pod-name> -n microservices -- /bin/sh

# Run debug command
kubectl exec <pod-name> -n microservices -- env
kubectl exec <pod-name> -n microservices -- ps aux
kubectl exec <pod-name> -n microservices -- netstat -tuln
```

### Check Network
```bash
# Get service endpoints
kubectl get endpoints -n microservices

# Describe service
kubectl describe svc <service-name> -n microservices

# Test connectivity from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -n microservices -- sh
# Then inside pod:
wget -O- http://auth-service:8080/healthz
nc -zv affiliation-db 3306
nslookup rabbitmq
```

### Check Storage
```bash
# View PVCs
kubectl get pvc -n microservices

# Describe PVC
kubectl describe pvc <pvc-name> -n microservices

# View PVs
kubectl get pv
```

### Check Jobs
```bash
# List jobs
kubectl get jobs -n microservices

# View job logs
kubectl logs job/<job-name> -n microservices

# Describe job
kubectl describe job/<job-name> -n microservices
```

## 🔧 Common Fixes

### Restart All Services
```bash
kubectl rollout restart deployment -n microservices
```

### Delete and Recreate Pod
```bash
kubectl delete pod <pod-name> -n microservices
# Deployment will automatically create new pod
```

### Clear Failed Jobs
```bash
kubectl delete job affiliation-migrations -n microservices
kubectl delete job dynamodb-init -n microservices
kubectl delete job minio-init -n microservices
```

### Reset Database
```bash
# Delete PVC (WARNING: Data loss!)
kubectl delete pvc <pvc-name> -n microservices

# Restart database pod
kubectl delete pod <db-pod-name> -n microservices
```

### Rebuild and Redeploy Image
```bash
# Use minikube Docker
eval $(minikube docker-env)

# Rebuild image
cd auth-microservice
docker build -t auth-service:latest .

# Delete pod to force pull new image
kubectl delete pod -l app=auth-service -n microservices
```

## 📊 Monitoring Commands

### Resource Usage
```bash
# Pod metrics
kubectl top pods -n microservices

# Node metrics
kubectl top nodes

# Sort by CPU
kubectl top pods -n microservices --sort-by=cpu

# Sort by memory
kubectl top pods -n microservices --sort-by=memory
```

### Watch Resources
```bash
# Watch pods
kubectl get pods -n microservices -w

# Watch all resources
kubectl get all -n microservices -w

# Watch events
kubectl get events -n microservices -w
```

## 🗄️ Database Access

### MariaDB (Affiliation)
```bash
kubectl exec -it <affiliation-db-pod> -n microservices -- mysql -u djangouser -p
# Password: djangopass
```

### PostgreSQL (Auth)
```bash
kubectl exec -it <auth-postgres-pod> -n microservices -- psql -U authuser -d authdb
# Password: authpassword
```

### Redis
```bash
# Affiliation Redis
kubectl exec -it <affiliation-redis-pod> -n microservices -- redis-cli

# Auth Redis
kubectl exec -it <auth-redis-pod> -n microservices -- redis-cli -a redispassword
```

### DynamoDB Local
```bash
kubectl exec -it <dynamodb-pod> -n microservices -- sh
```

### MinIO
```bash
kubectl exec -it <minio-pod> -n microservices -- sh
# Use mc (MinIO Client) inside
```

## 📝 ConfigMap & Secret Management

### View ConfigMaps
```bash
kubectl get configmaps -n microservices
kubectl describe configmap <configmap-name> -n microservices
kubectl get configmap <configmap-name> -n microservices -o yaml
```

### View Secrets
```bash
kubectl get secrets -n microservices
kubectl describe secret <secret-name> -n microservices

# Decode secret value
kubectl get secret <secret-name> -n microservices -o jsonpath='{.data.<key>}' | base64 -d
```

### Update ConfigMap
```bash
kubectl edit configmap <configmap-name> -n microservices
# Then restart pods to pick up changes
kubectl rollout restart deployment/<deployment-name> -n microservices
```

## 🔄 Update Deployment

### Change Image
```bash
kubectl set image deployment/<deployment-name> <container-name>=<new-image> -n microservices
```

### Edit Deployment
```bash
kubectl edit deployment/<deployment-name> -n microservices
```

### Apply Changes
```bash
kubectl apply -f k8s-minikube/auth/deployment.yaml
```

### Rollback
```bash
# View rollout history
kubectl rollout history deployment/<deployment-name> -n microservices

# Rollback to previous version
kubectl rollout undo deployment/<deployment-name> -n microservices

# Rollback to specific revision
kubectl rollout undo deployment/<deployment-name> --to-revision=2 -n microservices
```

## 📋 Namespace Management

### Create Namespace
```bash
kubectl create namespace microservices
```

### Delete Namespace (deletes all resources)
```bash
kubectl delete namespace microservices
```

### Set Default Namespace
```bash
kubectl config set-context --current --namespace=microservices

# Now you can omit -n microservices flag
kubectl get pods
```

## 🎯 NodePort Mappings

| Service | Internal Port | NodePort | Protocol |
|---------|--------------|----------|----------|
| Frontend | 3000 | 30030 | HTTP |
| Auth Service | 8080 | 30080 | HTTP |
| Documents Service | 8080 | 30081 | HTTP |
| Affiliation Service | 8000 | 30090 | HTTP |
| Prometheus | 9090 | 30091 | HTTP |
| Grafana | 3000 | 30300 | HTTP |
| RabbitMQ AMQP | 5672 | 30672 | AMQP |
| RabbitMQ Management | 15672 | 30673 | HTTP |
| MinIO API | 9000 | 30900 | HTTP |
| MinIO Console | 9001 | 30901 | HTTP |

## 🔐 Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| RabbitMQ | admin | admin |
| MinIO | admin | admin123 |
| Grafana | admin | admin |
| Django Admin | admin | admin123 |
| MariaDB Root | root | rootpassword |
| MariaDB User | djangouser | djangopass |
| PostgreSQL | authuser | authpassword |
| Redis (Auth) | - | redispassword |

---

**Quick Access After Deployment:**
```bash
export MINIKUBE_IP=$(minikube ip)
echo "Frontend: http://${MINIKUBE_IP}:30030"
echo "Grafana: http://${MINIKUBE_IP}:30300"
echo "RabbitMQ: http://${MINIKUBE_IP}:30673"
```
