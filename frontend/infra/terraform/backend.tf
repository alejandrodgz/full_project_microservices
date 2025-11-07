terraform {
  backend "s3" {
    # Configuration provided via -backend-config flags in pipeline
    # bucket         = provided by TF_BACKEND_BUCKET
    # key            = "frontend/terraform.tfstate"
    # region         = provided by TF_BACKEND_REGION
    # dynamodb_table = provided by TF_BACKEND_DDB_TABLE
    # encrypt        = true
  }
}
