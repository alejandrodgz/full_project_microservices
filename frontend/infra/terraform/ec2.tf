# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Elastic IP for persistent IP address
resource "aws_eip" "frontend" {
  domain = "vpc"
  
  tags = {
    Name        = "${var.app_name}-eip"
    Environment = "development"
    ManagedBy   = "terraform"
  }
}

resource "aws_eip_association" "frontend" {
  instance_id   = aws_instance.frontend.id
  allocation_id = aws_eip.frontend.id
}

resource "aws_instance" "frontend" {
  ami                         = data.aws_ami.amazon_linux_2023.id
  instance_type               = var.instance_type
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids      = [aws_security_group.frontend_ec2.id]
  subnet_id                   = data.aws_subnet.default_az1.id
  key_name                    = aws_key_pair.ec2_key.key_name
  associate_public_ip_address = true

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user-data.sh", {
    aws_region         = var.aws_region
    secret_name        = aws_secretsmanager_secret.app_secrets.name
    dockerhub_username = var.dockerhub_username
  })

  tags = {
    Name        = var.app_name
    Environment = "development"
    ManagedBy   = "terraform"
  }

  # Force replacement when user data changes
  user_data_replace_on_change = true
}
