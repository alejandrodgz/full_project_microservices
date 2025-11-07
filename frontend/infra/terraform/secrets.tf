resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "frontend-app-secrets"
  recovery_window_in_days = 0 # Immediate deletion for dev

  tags = {
    Name        = "frontend-app-secrets"
    Environment = "development"
    ManagedBy   = "terraform"
  }
}

# Secret value is managed by GitHub Actions pipeline
# Not defined here to avoid storing secrets in Terraform
