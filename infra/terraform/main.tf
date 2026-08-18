provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "votechain_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "votechain-vpc"
  }
}

resource "aws_eks_cluster" "votechain_cluster" {
  name     = "votechain-eks-cluster"
  role_arn = var.eks_role_arn

  vpc_config {
    subnet_ids = var.subnet_ids
  }
}
