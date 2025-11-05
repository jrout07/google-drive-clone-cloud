# Google Drive Clone - AWS DevOps Project

A production-ready Google Drive clone built with modern DevOps practices on AWS infrastructure.

## 🏗️ Architecture Overview

This project implements a scalable cloud-native file storage and sharing platform using:

### Frontend
- **React.js** - Modern web interface for file management
- **TypeScript** - Type-safe development
- **Material-UI** - Professional UI components
- **AWS Amplify** - Frontend hosting and deployment

### Backend
- **Node.js + Express** - RESTful API server
- **TypeScript** - Type-safe backend development
- **JWT Authentication** - Secure user sessions
- **Multer** - File upload handling

### Cloud Infrastructure (AWS)
- **EKS (Elastic Kubernetes Service)** - Container orchestration
- **RDS PostgreSQL** - Managed database service
- **S3** - Object storage for files
- **CloudFront** - Global CDN
- **Route 53** - DNS management
- **Application Load Balancer** - Traffic distribution
- **Cognito** - User authentication and authorization
- **Secrets Manager** - Secure credential storage
- **CloudWatch** - Monitoring and logging
- **VPC** - Network isolation and security

### DevOps Tools
- **Terraform** - Infrastructure as Code
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Kubernetes** - Container orchestration
- **Prometheus + Grafana** - Advanced monitoring
- **Nginx** - Reverse proxy and load balancing

## 📁 Project Structure

```
google-drive-clone/
├── frontend/                 # React.js application
├── backend/                  # Node.js API server
├── infrastructure/           # Terraform configurations
├── k8s/                     # Kubernetes manifests
├── docker/                  # Docker configurations
├── .github/workflows/       # GitHub Actions CI/CD
├── monitoring/              # Prometheus & Grafana configs
├── scripts/                 # Deployment and utility scripts
└── docs/                    # Documentation and diagrams
```

## 🚀 Quick Start

1. **Prerequisites**
   ```bash
   # Install required tools
   brew install terraform kubectl docker aws-cli
   
   # Configure AWS CLI
   aws configure
   ```

2. **Infrastructure Setup**
   ```bash
   cd infrastructure
   terraform init
   terraform plan
   terraform apply
   ```

3. **Application Deployment**
   ```bash
   # Build and deploy backend
   cd backend
   docker build -t gdrive-backend .
   kubectl apply -f ../k8s/backend/
   
   # Build and deploy frontend
   cd ../frontend
   npm run build
   aws s3 sync build/ s3://your-frontend-bucket
   ```

## 🔧 DevOps Pipeline

### CI/CD Workflow
1. **Code Push** → GitHub repository
2. **GitHub Actions** → Automated testing and building
3. **Docker Images** → Built and pushed to ECR
4. **Kubernetes Deployment** → Rolling updates to EKS
5. **Monitoring** → CloudWatch and Grafana dashboards

### Infrastructure as Code
- All AWS resources defined in Terraform
- Environment-specific configurations
- Automated infrastructure provisioning
- State management with S3 backend

## 📊 Monitoring & Observability

- **CloudWatch** - AWS native monitoring
- **Prometheus** - Metrics collection
- **Grafana** - Visualization dashboards
- **ELK Stack** - Centralized logging
- **Health Checks** - Application and infrastructure monitoring

## 🔒 Security Features

- **VPC with private subnets** - Network isolation
- **IAM roles and policies** - Least privilege access
- **Secrets Manager** - Secure credential storage
- **WAF** - Web application firewall
- **SSL/TLS** - End-to-end encryption
- **Cognito** - Managed authentication

## 🎯 Features

- **File Upload/Download** - Secure file operations
- **File Sharing** - Share files with other users
- **Folder Management** - Organize files in folders
- **Real-time Sync** - File synchronization
- **Version Control** - File versioning with S3
- **Search** - Advanced file search capabilities
- **Mobile Responsive** - Works on all devices

## 📈 Scalability

- **Auto Scaling Groups** - Dynamic instance scaling
- **EKS** - Container orchestration and scaling
- **CloudFront** - Global content delivery
- **RDS Read Replicas** - Database scaling
- **S3** - Unlimited object storage

## 🛠️ Development

See individual README files in each component directory for detailed development instructions.

## 📄 License

MIT License - see LICENSE file for details.
