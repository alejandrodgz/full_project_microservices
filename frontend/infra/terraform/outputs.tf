output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.frontend.id
}

output "instance_public_ip" {
  description = "Public IP of the EC2 instance (Elastic IP)"
  value       = aws_eip.frontend.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.frontend.public_dns
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_eip.frontend.public_ip}"
}

output "elastic_ip" {
  description = "Elastic IP address (persistent)"
  value       = aws_eip.frontend.public_ip
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.frontend_ec2.id
}

output "ssh_key_secret_name" {
  description = "Name of the Secrets Manager secret containing the SSH private key"
  value       = aws_secretsmanager_secret.ec2_private_key.name
}

output "ssh_command" {
  description = "Command to SSH into the instance"
  value       = "aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.ec2_private_key.name} --query SecretString --output text > /tmp/ec2-key.pem && chmod 400 /tmp/ec2-key.pem && ssh -i /tmp/ec2-key.pem ec2-user@${aws_eip.frontend.public_ip}"
}
