variable "aws_region" {
  default     = "us-east-1"
  description = "AWS Region"
}

variable "eks_role_arn" {
  description = "EKS Cluster IAM Role ARN"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of VPC Subnet IDs"
}
