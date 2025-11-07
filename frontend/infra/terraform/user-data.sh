#!/bin/bash
set -e

# Variables from Terraform
AWS_REGION="${aws_region}"
SECRET_NAME="${secret_name}"
DOCKERHUB_USERNAME="${dockerhub_username}"

# Log output
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting user data script..."

echo "Updating system packages..."
if command -v dnf >/dev/null 2>&1; then
  dnf -y update
else
  yum -y update
fi

# Ensure SSH and EC2 Instance Connect (for console-based SSH) are installed and running
echo "Ensuring sshd and ec2-instance-connect are installed..."
if command -v dnf >/dev/null 2>&1; then
  dnf install -y openssh-server ec2-instance-connect || true
else
  yum install -y openssh-server ec2-instance-connect || true
fi
systemctl enable sshd || true
systemctl start sshd || true

# Install AWS CLI v2
echo "Installing AWS CLI v2..."
if command -v dnf >/dev/null 2>&1; then
  dnf install -y unzip
else
  yum install -y unzip
fi
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install || true
rm -rf aws awscliv2.zip || true

# Install jq for JSON parsing
echo "Installing jq..."
if command -v dnf >/dev/null 2>&1; then
  dnf install -y jq
else
  yum install -y jq
fi

# Install Docker
echo "Installing Docker..."
if command -v dnf >/dev/null 2>&1; then
  dnf install -y docker
else
  yum install -y docker
fi
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
if ! /usr/local/bin/docker-compose version >/dev/null 2>&1; then
  echo "Failed to install docker-compose binary"
fi

# Create app directory
echo "Creating application directory..."
mkdir -p /opt/frontend-app
cd /opt/frontend-app

# Create rolling update script
echo "Creating rolling update script..."
cat > /opt/frontend-app/rolling-update.sh <<'EOFROLLING'
#!/bin/bash

# Script para hacer rolling update de los contenedores
# Actualiza app1, luego app2, manteniendo la aplicación disponible

set -e

cd /opt/frontend-app

echo "=========================================="
echo "Starting rolling update..."
echo "=========================================="

# Pull latest images
echo "Pulling latest Docker images..."
docker-compose pull

# Update app1 first
echo ""
echo "=========================================="
echo "Step 1: Updating app1..."
echo "=========================================="
docker-compose up -d --no-deps app1

# Wait for app1 to be healthy
echo "Waiting for app1 to be ready..."
sleep 10

# Check if app1 is running
if docker-compose ps app1 | grep -q "Up"; then
  echo "✓ app1 is running"
else
  echo "✗ app1 failed to start"
  exit 1
fi

# Update app2
echo ""
echo "=========================================="
echo "Step 2: Updating app2..."
echo "=========================================="
docker-compose up -d --no-deps app2

# Wait for app2 to be healthy
echo "Waiting for app2 to be ready..."
sleep 10

# Check if app2 is running
if docker-compose ps app2 | grep -q "Up"; then
  echo "✓ app2 is running"
else
  echo "✗ app2 failed to start"
  exit 1
fi

# Clean up old images
echo ""
echo "=========================================="
echo "Cleaning up old images..."
echo "=========================================="
docker image prune -af || true

echo ""
echo "=========================================="
echo "Rolling update completed successfully!"
echo "=========================================="
docker-compose ps
EOFROLLING
chmod +x /opt/frontend-app/rolling-update.sh

# Retrieve secrets from Secrets Manager
echo "Retrieving secrets from Secrets Manager (non-fatal if not present)..."
if SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$AWS_REGION" \
  --query SecretString \
  --output text 2>/dev/null); then
  export AUTH_BASE_URL=$(echo "$SECRET_JSON" | jq -r '.AUTH_BASE_URL // empty')
  export DOCUMENTS_BASE_URL=$(echo "$SECRET_JSON" | jq -r '.DOCUMENTS_BASE_URL // empty')
  export JWT_SECRET=$(echo "$SECRET_JSON" | jq -r '.JWT_SECRET // empty')
  export NODE_ENV=$(echo "$SECRET_JSON" | jq -r '.NODE_ENV // empty')
  export DOCKERHUB_PASSWORD=$(echo "$SECRET_JSON" | jq -r '.DOCKERHUB_PASSWORD // empty')
  export DOCKERHUB_USERNAME_OVR=$(echo "$SECRET_JSON" | jq -r '.DOCKERHUB_USERNAME // empty')
  echo "Secrets retrieved successfully"
else
  echo "Secrets not found or no version; proceeding without overriding envs"
fi

# Create nginx.conf
echo "Creating nginx configuration..."
cat > nginx.conf <<'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        least_conn;
        server app1:3000 max_fails=3 fail_timeout=30s;
        server app2:3000 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        
        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_next_upstream error timeout http_502 http_503 http_504;
        }
    }
}
EOF

# Create docker-compose.yml
echo "Creating docker-compose configuration..."
cat > docker-compose.yml <<EOF
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app1
      - app2
    restart: unless-stopped

  app1:
    image: kristianrpo30/frontend-app:latest
    environment:
      - AUTH_BASE_URL=$AUTH_BASE_URL
      - DOCUMENTS_BASE_URL=$DOCUMENTS_BASE_URL
      - JWT_SECRET=$JWT_SECRET
      - NODE_ENV=$NODE_ENV
    expose:
      - "3000"
    restart: unless-stopped

  app2:
    image: kristianrpo30/frontend-app:latest
    environment:
      - AUTH_BASE_URL=$AUTH_BASE_URL
      - DOCUMENTS_BASE_URL=$DOCUMENTS_BASE_URL
      - JWT_SECRET=$JWT_SECRET
      - NODE_ENV=$NODE_ENV
    expose:
      - "3000"
    restart: unless-stopped
EOF

# Configure Docker to prevent disk space issues
echo "Configuring Docker to limit disk usage..."
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# Restart Docker to apply settings
echo "Restarting Docker with new configuration..."
systemctl restart docker || true

# Clean up any existing Docker data before pulling
echo "Cleaning up any existing Docker data..."
docker system prune -af --volumes || true

echo "Pulling Docker images..."
/usr/local/bin/docker-compose pull || true

# Clean up after pulling to save space
echo "Cleaning up unused Docker images and layers..."
docker image prune -af || true

echo "Starting containers..."
/usr/local/bin/docker-compose up -d || true

# Setup log rotation
echo "Configuring log rotation..."
cat > /etc/logrotate.d/docker-compose <<EOF
/opt/frontend-app/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF

echo "Frontend application deployed successfully!"
echo "Application should be accessible on port 80"

# Display container status
/usr/local/bin/docker-compose ps || true
