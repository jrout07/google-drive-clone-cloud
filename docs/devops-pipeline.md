# DevOps Pipeline & Workflow Guide

## 🚀 Complete CI/CD Pipeline Flow

This document outlines the complete DevOps pipeline for the Google Drive Clone project, from code commit to production deployment.

## 📋 Pipeline Overview

```
Developer → GitHub → GitHub Actions → ECR → EKS → CloudWatch → Monitoring
    ↓         ↓          ↓           ↓      ↓        ↓           ↓
  Code      Webhook   Build/Test    Push   Deploy   Monitor    Alerts
  Push      Trigger   Docker       Image   Pods     Metrics    
```

## 🔄 CI/CD Workflow Steps

### 1. **Source Control Management**
- **Repository**: GitHub with branch protection rules
- **Branching Strategy**: GitFlow (main, develop, feature/* branches)
- **Pull Requests**: Required for all changes to main/develop

### 2. **Continuous Integration (CI)**

#### Backend CI Pipeline
```yaml
1. Checkout code
2. Setup Node.js environment
3. Install dependencies (npm ci)
4. Run linting (ESLint)
5. Run unit tests (Jest)
6. Run security scans (Trivy)
7. Build TypeScript application
8. Build Docker image
9. Push to ECR (if main branch)
```

#### Frontend CI Pipeline
```yaml
1. Checkout code
2. Setup Node.js environment
3. Install dependencies (npm ci)
4. Run linting (ESLint)
5. Run unit tests (Jest)
6. Build React application
7. Deploy to S3 (if main branch)
8. Invalidate CloudFront cache
```

### 3. **Infrastructure as Code (IaC)**

#### Terraform Workflow
```yaml
1. Terraform Plan (on PR)
   - Validate syntax
   - Plan infrastructure changes
   - Comment plan on PR

2. Terraform Apply (on main)
   - Apply infrastructure changes
   - Update state in S3 backend
   - Output important values
```

### 4. **Continuous Deployment (CD)**

#### EKS Deployment Pipeline
```yaml
1. Update kubeconfig for EKS cluster
2. Replace image tags in K8s manifests
3. Apply Kubernetes manifests:
   - Deployments
   - Services
   - ConfigMaps
   - Secrets
   - Ingress
   - HPA
4. Wait for rollout completion
5. Verify deployment health
6. Run smoke tests
```

## 🛠️ Pipeline Configuration

### GitHub Actions Secrets
```bash
# AWS Credentials
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ACCOUNT_ID

# S3 & CloudFront
S3_FRONTEND_BUCKET
CLOUDFRONT_DISTRIBUTION_ID

# Application Secrets
JWT_SECRET
DATABASE_PASSWORD

# Notification
SLACK_WEBHOOK_URL
```

### Environment Variables
```bash
# AWS Configuration
AWS_REGION=us-west-2
EKS_CLUSTER_NAME=gdrive-clone-prod-eks
ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com

# Application Configuration
NODE_ENV=production
API_URL=https://api.your-domain.com
FRONTEND_URL=https://your-domain.com
```

## 🔧 Infrastructure Provisioning

### 1. **Prerequisites Setup**
```bash
# Install required tools
brew install terraform kubectl aws-cli docker

# Configure AWS CLI
aws configure

# Create S3 bucket for Terraform state
aws s3 mb s3://gdrive-terraform-state --region us-west-2

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name gdrive-terraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### 2. **Infrastructure Deployment**
```bash
# Navigate to infrastructure directory
cd infrastructure

# Initialize Terraform
terraform init

# Plan infrastructure (development)
terraform plan -var-file="environments/dev/terraform.tfvars"

# Apply infrastructure (development)
terraform apply -var-file="environments/dev/terraform.tfvars"

# Plan infrastructure (production)
terraform plan -var-file="environments/prod/terraform.tfvars"

# Apply infrastructure (production)
terraform apply -var-file="environments/prod/terraform.tfvars"
```

### 3. **Post-Deployment Configuration**
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name gdrive-clone-prod-eks

# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

# Install metrics server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

## 🚀 Application Deployment

### 1. **Backend Deployment**
```bash
# Build and push Docker image
cd backend
docker build -t gdrive-backend .
docker tag gdrive-backend:latest ${ECR_REGISTRY}/gdrive-backend:latest
docker push ${ECR_REGISTRY}/gdrive-backend:latest

# Deploy to Kubernetes
kubectl apply -f ../k8s/backend/
kubectl rollout status deployment/gdrive-backend
```

### 2. **Frontend Deployment**
```bash
# Build React application
cd frontend
npm run build

# Deploy to S3
aws s3 sync build/ s3://gdrive-frontend-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890123 \
  --paths "/*"
```

## 📊 Monitoring & Observability

### 1. **CloudWatch Integration**
- **Logs**: Centralized logging for all services
- **Metrics**: Custom and AWS metrics collection
- **Alarms**: Automated alerting for critical issues
- **Dashboards**: Real-time monitoring dashboards

### 2. **Prometheus & Grafana Stack**
```bash
# Install Prometheus
kubectl apply -f k8s/monitoring/prometheus/

# Install Grafana
kubectl apply -f k8s/monitoring/grafana/

# Access Grafana dashboard
kubectl port-forward svc/grafana 3000:80
```

### 3. **Key Metrics to Monitor**
- **Application**: Response time, error rate, throughput
- **Infrastructure**: CPU, memory, disk, network usage
- **Database**: Connection pool, query performance
- **S3**: Request rates, error rates, latency
- **EKS**: Pod status, node health, resource utilization

## 🔒 Security Best Practices

### 1. **Container Security**
- Base images from official sources
- Regular vulnerability scanning with Trivy
- Non-root user execution
- Read-only root filesystem
- Minimal attack surface

### 2. **Kubernetes Security**
- Network policies for pod communication
- RBAC for service accounts
- Pod security standards
- Secrets management with AWS Secrets Manager
- Resource limits and quotas

### 3. **AWS Security**
- IAM roles with least privilege
- VPC with private subnets
- Security groups and NACLs
- WAF for web application protection
- CloudTrail for audit logging

## 🎯 Deployment Strategies

### 1. **Rolling Deployment (Default)**
- Zero-downtime deployments
- Gradual rollout of new versions
- Automatic rollback on failure

### 2. **Blue-Green Deployment**
```bash
# Deploy to green environment
kubectl apply -f k8s/backend/deployment-green.yaml

# Switch traffic after verification
kubectl patch service gdrive-backend-service \
  -p '{"spec":{"selector":{"version":"green"}}}'
```

### 3. **Canary Deployment**
```bash
# Deploy canary version (10% traffic)
kubectl apply -f k8s/backend/deployment-canary.yaml

# Gradually increase traffic
kubectl patch ingress gdrive-ingress \
  --type='json' \
  -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value": "gdrive-backend-canary"}]'
```

## 🚨 Incident Response

### 1. **Monitoring Alerts**
- Critical: P0 (immediate response)
- High: P1 (response within 30 minutes)
- Medium: P2 (response within 2 hours)
- Low: P3 (response within 24 hours)

### 2. **Rollback Procedures**
```bash
# Rollback Kubernetes deployment
kubectl rollout undo deployment/gdrive-backend

# Rollback frontend to previous version
aws s3 sync s3://gdrive-frontend-backup/previous/ s3://gdrive-frontend-bucket/

# Rollback infrastructure changes
terraform apply -var-file="environments/prod/terraform.tfvars"
```

## 📈 Performance Optimization

### 1. **Auto Scaling**
- **HPA**: Horizontal Pod Autoscaler for application scaling
- **Cluster Autoscaler**: Node scaling based on demand
- **VPA**: Vertical Pod Autoscaler for resource optimization

### 2. **Caching Strategy**
- **CloudFront**: Global CDN for static content
- **Redis**: Application-level caching
- **Database**: Query optimization and indexing

### 3. **Cost Optimization**
- Spot instances for non-critical workloads
- Reserved instances for predictable workloads
- Resource right-sizing based on metrics
- Automated scaling policies

## 🔄 Backup & Disaster Recovery

### 1. **Database Backups**
- Automated RDS backups (30-day retention)
- Point-in-time recovery capability
- Cross-region backup replication

### 2. **Application Data**
- S3 versioning for file storage
- Cross-region replication
- Lifecycle policies for cost optimization

### 3. **Infrastructure Recovery**
- Infrastructure as Code for quick recreation
- Multi-AZ deployment for high availability
- Disaster recovery runbooks

## 📚 Additional Resources

- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Kubernetes Production Best Practices](https://kubernetes.io/docs/setup/best-practices/)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
