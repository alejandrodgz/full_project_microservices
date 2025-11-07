# Generate SSH key pair
resource "tls_private_key" "ec2_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Create AWS key pair
resource "aws_key_pair" "ec2_key" {
  key_name   = "${var.app_name}-key"
  public_key = tls_private_key.ec2_key.public_key_openssh

  tags = {
    Name      = "${var.app_name}-key"
    ManagedBy = "terraform"
  }
}

# Store private key in AWS Secrets Manager
resource "aws_secretsmanager_secret" "ec2_private_key" {
  name                    = "${var.app_name}-ssh-key"
  description             = "Private SSH key for EC2 instance"
  recovery_window_in_days = 0 # Permite eliminar inmediatamente si es necesario

  tags = {
    Name      = "${var.app_name}-ssh-key"
    ManagedBy = "terraform"
  }
}

resource "aws_secretsmanager_secret_version" "ec2_private_key" {
  secret_id     = aws_secretsmanager_secret.ec2_private_key.id
  secret_string = tls_private_key.ec2_key.private_key_pem
}
