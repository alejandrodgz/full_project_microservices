# Internet Gateway para la VPC
resource "aws_internet_gateway" "main" {
  vpc_id = data.aws_vpc.default.id

  tags = {
    Name      = "${var.app_name}-igw"
    ManagedBy = "terraform"
  }
}

# Gestionar la default route table de la VPC y asegurar ruta a IGW (evita blackhole)
data "aws_route_table" "main" {
  vpc_id = data.aws_vpc.default.id
  filter {
    name   = "association.main"
    values = ["true"]
  }
}

resource "aws_default_route_table" "main" {
  default_route_table_id = data.aws_route_table.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name      = "${var.app_name}-main-rt"
    ManagedBy = "terraform"
  }
}
