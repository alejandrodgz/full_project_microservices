#!/bin/bash
# Script para verificar el estado de la instancia EC2

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Verificando Instancia EC2 ===${NC}\n"

# Obtener el Instance ID desde Terraform
cd "$(dirname "$0")/../terraform"
INSTANCE_ID=$(terraform output -raw instance_id 2>/dev/null)
PUBLIC_IP=$(terraform output -raw instance_public_ip 2>/dev/null)

if [ -z "$INSTANCE_ID" ]; then
    echo -e "${RED}Error: No se pudo obtener el Instance ID${NC}"
    exit 1
fi

echo -e "${GREEN}Instance ID:${NC} $INSTANCE_ID"
echo -e "${GREEN}Public IP:${NC} $PUBLIC_IP"
echo ""

# Estado de la instancia
echo -e "${YELLOW}Estado de la instancia:${NC}"
aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress,KeyName]' \
    --output table

echo ""

# Status checks
echo -e "${YELLOW}Status Checks:${NC}"
aws ec2 describe-instance-status \
    --instance-ids $INSTANCE_ID \
    --query 'InstanceStatuses[0].[SystemStatus.Status,InstanceStatus.Status]' \
    --output table || echo "Instance aún inicializando..."

echo ""

# Security Groups
echo -e "${YELLOW}Security Groups:${NC}"
aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].SecurityGroups[*].[GroupId,GroupName]' \
    --output table

echo ""

# Verificar conectividad HTTP
echo -e "${YELLOW}Verificando conectividad HTTP:${NC}"
if curl -s --connect-timeout 5 http://$PUBLIC_IP > /dev/null; then
    echo -e "${GREEN}✓ HTTP responde correctamente${NC}"
else
    echo -e "${RED}✗ HTTP no responde${NC}"
    echo "Posibles causas:"
    echo "  1. La aplicación aún está iniciando (espera 2-3 minutos)"
    echo "  2. Docker no se instaló correctamente"
    echo "  3. Error en el user-data script"
fi

echo ""

# Verificar conectividad SSH
echo -e "${YELLOW}Verificando conectividad SSH:${NC}"
if nc -zv -w 5 $PUBLIC_IP 22 2>&1 | grep -q succeeded; then
    echo -e "${GREEN}✓ Puerto SSH (22) está abierto${NC}"
else
    echo -e "${RED}✗ Puerto SSH (22) no responde${NC}"
fi

echo ""
echo -e "${YELLOW}=== Comandos útiles ===${NC}"
echo "Ver logs de user-data:"
echo "  aws ssm start-session --target $INSTANCE_ID"
echo "  sudo tail -f /var/log/user-data.log"
echo ""
echo "Ver estado de Docker:"
echo "  sudo docker ps"
echo "  sudo docker-compose -f /opt/frontend-app/docker-compose.yml ps"
echo ""
echo "Ver logs de la aplicación:"
echo "  sudo docker-compose -f /opt/frontend-app/docker-compose.yml logs -f"
