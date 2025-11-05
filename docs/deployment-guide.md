# 🚀 Google Drive Clone - Complete Deployment Guide

This guide provides step-by-step instructions to deploy the complete Google Drive clone infrastructure and application on AWS.

## 📋 Prerequisites

### Required Tools
```bash
# Install Homebrew (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install aws-cli terraform kubectl docker node npm

# Verify installations
aws --version
terraform --version
kubectl version --client
docker --version
node --version
npm --version
```

### AWS Account Setup
1. **Create AWS Account** with administrative access
2. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, Region (us-west-2), and output format (json)
   ```
3. **Verify AWS access**:
   ```bash
   aws sts get-caller-identity
   ```

### Domain Setup (Optional but Recommended)
1. **Register a domain** or use an existing one
2. **Create Route 53 hosted zone**:
   ```bash
   aws route53 create-hosted-zone --name your-domain.com --caller-reference $(date +%s)
   ```

## 🏗️ Infrastructure Deployment

### Step 1: Clone and Prepare Repository
```bash
# Clone this repository
git clone <your-repo-url>
cd google-drive-clone

# Make scripts executable
chmod +x scripts/*.sh
```

### Step 2: Configure Environment Variables
```bash
# Create environment-specific configuration
cp infrastructure/environments/dev/terraform.tfvars.example infrastructure/environments/dev/terraform.tfvars
cp infrastructure/environments/prod/terraform.tfvars.example infrastructure/environments/prod/terraform.tfvars

# Edit the configuration files with your specific values
vi infrastructure/environments/dev/terraform.tfvars
vi infrastructure/environments/prod/terraform.tfvars
```

**Key variables to update:**
- `domain_name`: Your registered domain
- `aws_region`: Your preferred AWS region
- `jwt_secret`: Strong random secret for JWT tokens
- Instance sizes and scaling configurations as needed

### Step 3: Deploy Infrastructure
```bash
# Deploy development environment
./scripts/deploy-infrastructure.sh dev

# Deploy production environment (after testing dev)
./scripts/deploy-infrastructure.sh prod
```

**This script will:**
- ✅ Create S3 bucket for Terraform state
- ✅ Create DynamoDB table for state locking
- ✅ Deploy VPC, subnets, and networking
- ✅ Create EKS cluster and worker nodes
- ✅ Set up RDS PostgreSQL database
- ✅ Create S3 buckets for file storage and frontend
- ✅ Configure CloudFront CDN
- ✅ Set up Route 53 DNS records
- ✅ Create Cognito user pool for authentication
- ✅ Configure security groups and IAM roles

### Step 4: Verify Infrastructure
```bash
# Check EKS cluster
kubectl get nodes
kubectl get namespaces

# Check AWS resources
aws eks list-clusters
aws rds describe-db-instances
aws s3 ls
```

## 🚀 Application Deployment

### Step 1: Build and Deploy Backend
```bash
# Deploy backend application
./scripts/deploy-app.sh dev

# For production
./scripts/deploy-app.sh prod
```

**This script will:**
- ✅ Build Node.js backend Docker image
- ✅ Push image to Amazon ECR
- ✅ Deploy to EKS using Kubernetes manifests
- ✅ Configure auto-scaling and health checks
- ✅ Run database migrations
- ✅ Build React frontend application
- ✅ Deploy frontend to S3
- ✅ Invalidate CloudFront cache

### Step 2: Configure DNS (If using custom domain)
```bash
# Get load balancer DNS name
kubectl get ingress gdrive-ingress

# Update Route 53 records to point to the load balancer
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://dns-update.json
```

### Step 3: Verify Deployment
```bash
# Check application pods
kubectl get pods -l app=gdrive-backend

# Check services and ingress
kubectl get services
kubectl get ingress

# Test health endpoints
curl https://api.your-domain.com/health
curl https://your-domain.com
```

## 🔧 Post-Deployment Configuration

### Step 1: Set up Monitoring (Production)
```bash
# Deploy Prometheus and Grafana
kubectl apply -f k8s/monitoring/

# Access Grafana dashboard
kubectl port-forward svc/grafana 3000:80
# Open http://localhost:3000 (admin/admin)
```

### Step 2: Configure Alerts
```bash
# Set up CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "EKS-High-CPU" \
  --alarm-description "EKS nodes high CPU usage" \
  --metric-name CPUUtilization \
  --namespace AWS/EKS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Step 3: Set up Backup
```bash
# Enable RDS automated backups (already configured via Terraform)
# Configure S3 versioning for file storage (already enabled)

# Set up additional backup job
kubectl apply -f k8s/backup/backup-job.yaml
```

## 🔐 Security Configuration

### Step 1: SSL/TLS Certificates
```bash
# Request SSL certificate via ACM
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names "*.your-domain.com" \
  --validation-method DNS

# Update ingress with certificate ARN
kubectl patch ingress gdrive-ingress \
  --type='json' \
  -p='[{"op": "replace", "path": "/metadata/annotations/alb.ingress.kubernetes.io~1certificate-arn", "value": "arn:aws:acm:..."}]'
```

### Step 2: Configure WAF (Web Application Firewall)
```bash
# Create WAF web ACL
aws wafv2 create-web-acl \
  --name gdrive-waf \
  --scope REGIONAL \
  --default-action Allow={}
```

### Step 3: Enable GuardDuty
```bash
# Enable GuardDuty for threat detection
aws guardduty create-detector --enable
```

## 📊 Monitoring and Observability

### CloudWatch Dashboards
Access AWS CloudWatch console to view:
- **EKS Cluster Metrics**: CPU, memory, pod status
- **RDS Metrics**: Database connections, CPU, storage
- **S3 Metrics**: Request rates, error rates
- **Application Logs**: Centralized logging from all services

### Prometheus & Grafana
```bash
# Access Grafana dashboard
kubectl port-forward svc/grafana 3000:80

# Import pre-built dashboards:
# - Kubernetes cluster overview
# - Node.js application metrics
# - PostgreSQL database metrics
```

### Log Aggregation
```bash
# View application logs
kubectl logs -f deployment/gdrive-backend

# View logs from CloudWatch
aws logs tail /aws/eks/gdrive-clone-prod-eks/cluster --follow
```

## 🔄 CI/CD Pipeline Setup

### Step 1: Configure GitHub Secrets
In your GitHub repository, add these secrets:
```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_ACCOUNT_ID=your-account-id
S3_FRONTEND_BUCKET=your-frontend-bucket
CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
JWT_SECRET=your-jwt-secret
```

### Step 2: Enable GitHub Actions
The CI/CD pipeline will automatically:
- ✅ Run tests on pull requests
- ✅ Build and push Docker images
- ✅ Deploy to staging on develop branch
- ✅ Deploy to production on main branch
- ✅ Run security scans
- ✅ Send notifications

## 🛠️ Maintenance and Operations

### Regular Tasks
```bash
# Update kubectl configuration
aws eks update-kubeconfig --region us-west-2 --name gdrive-clone-prod-eks

# Check cluster health
kubectl get nodes
kubectl top pods

# Update application
./scripts/deploy-app.sh prod

# Scale applications
kubectl scale deployment gdrive-backend --replicas=5
```

### Backup and Recovery
```bash
# Manual database backup
aws rds create-db-snapshot \
  --db-instance-identifier gdrive-prod \
  --db-snapshot-identifier gdrive-backup-$(date +%Y%m%d)

# Restore from backup (if needed)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier gdrive-restored \
  --db-snapshot-identifier gdrive-backup-20231201
```

### Troubleshooting
```bash
# Check pod logs
kubectl logs deployment/gdrive-backend

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp

# Debug networking
kubectl exec -it deployment/gdrive-backend -- curl localhost:3000/health

# Check AWS Load Balancer Controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

## 💰 Cost Optimization

### Monitor Costs
- Use AWS Cost Explorer to track spending
- Set up billing alerts
- Review AWS Trusted Advisor recommendations

### Optimization Tips
```bash
# Use Spot instances for development
# Configure in terraform.tfvars:
node_group_capacity_type = "SPOT"

# Enable S3 lifecycle policies
aws s3api put-bucket-lifecycle-configuration \
  --bucket your-bucket \
  --lifecycle-configuration file://lifecycle.json

# Schedule EKS cluster shutdown for development
kubectl create cronjob cluster-shutdown \
  --schedule="0 18 * * 1-5" \
  --image=amazon/aws-cli \
  -- aws eks update-nodegroup-config \
    --cluster-name gdrive-clone-dev-eks \
    --nodegroup-name workers \
    --scaling-config minSize=0,maxSize=0,desiredSize=0
```

## 🚨 Emergency Procedures

### Rollback Application
```bash
# Rollback to previous version
kubectl rollout undo deployment/gdrive-backend

# Check rollout status
kubectl rollout status deployment/gdrive-backend
```

### Scale Up for High Traffic
```bash
# Manually scale up
kubectl scale deployment gdrive-backend --replicas=10

# Check auto-scaling status
kubectl get hpa
```

### Disaster Recovery
```bash
# Restore infrastructure from Terraform
cd infrastructure
terraform apply -var-file="environments/prod/terraform.tfvars"

# Restore database from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier gdrive-prod-restored \
  --db-snapshot-identifier your-backup-snapshot
```

## 📞 Support and Resources

### Documentation
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

### Monitoring Dashboards
- **AWS CloudWatch**: https://console.aws.amazon.com/cloudwatch/
- **Grafana**: `kubectl port-forward svc/grafana 3000:80`
- **Prometheus**: `kubectl port-forward svc/prometheus 9090:9090`

### Log Locations
- **Application Logs**: CloudWatch Log Groups
- **EKS Logs**: `/aws/eks/cluster-name/cluster`
- **Application Metrics**: Prometheus + Grafana

---

## 🎉 Congratulations!

You now have a fully deployed, production-ready Google Drive clone running on AWS with:
- ✅ High availability and auto-scaling
- ✅ Automated CI/CD pipeline
- ✅ Comprehensive monitoring and alerting
- ✅ Security best practices
- ✅ Disaster recovery capabilities

Your application is accessible at:
- **Frontend**: https://your-domain.com
- **API**: https://api.your-domain.com
- **Monitoring**: Grafana dashboard

For any issues or questions, refer to the troubleshooting section or check the CloudWatch logs.
