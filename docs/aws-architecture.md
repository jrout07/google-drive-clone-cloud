# AWS Architecture Diagram

## Google Drive Clone - AWS Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  Internet                                        │
└─────────────────────────┬───────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────────────────┐
│                            Route 53 (DNS)                                       │
│                        gdrive.yourdomain.com                                    │
└─────────────────────────┬───────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────────────────┐
│                          CloudFront (CDN)                                       │
│                     Global Content Delivery                                     │
└─────────────┬───────────────────────────────────────────────────┬───────────────┘
              │                                                   │
    ┌─────────▼─────────┐                                ┌─────────▼─────────┐
    │   Frontend (S3)   │                                │    API Gateway    │
    │   Static Website  │                                │  REST API Proxy   │
    │   React.js App    │                                └─────────┬─────────┘
    └───────────────────┘                                          │
                                                          ┌─────────▼─────────┐
                                                          │       WAF         │
                                                          │  Web App Firewall │
                                                          └─────────┬─────────┘
                                                                    │
┌───────────────────────────────────────────────────────────────────▼─────────────┐
│                                     VPC                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        Application Load Balancer                        │    │
│  │                         (Multi-AZ Deployment)                          │    │
│  └─────────────────────────┬───────────────────────┬───────────────────────┘    │
│                            │                       │                            │
│  ┌─────────────────────────▼─────────┐   ┌─────────▼─────────────────────────┐  │
│  │        Public Subnet AZ-1a        │   │        Public Subnet AZ-1b        │  │
│  │                                   │   │                                   │  │
│  │    ┌─────────────────────────┐    │   │    ┌─────────────────────────┐    │  │
│  │    │     NAT Gateway         │    │   │    │     NAT Gateway         │    │  │
│  │    └─────────────────────────┘    │   │    └─────────────────────────┘    │  │
│  └─────────────┬───────────────────────┘   └─────────────┬───────────────────────┘
│                │                                         │                      │
│  ┌─────────────▼─────────────────────┐   ┌─────────────▼─────────────────────┐  │
│  │       Private Subnet AZ-1a        │   │       Private Subnet AZ-1b        │  │
│  │                                   │   │                                   │  │
│  │  ┌─────────────────────────────┐  │   │  ┌─────────────────────────────┐  │  │
│  │  │      EKS Worker Nodes       │  │   │  │      EKS Worker Nodes       │  │  │
│  │  │                             │  │   │  │                             │  │  │
│  │  │ ┌─────────────────────────┐ │  │   │  │ ┌─────────────────────────┐ │  │  │
│  │  │ │    Backend Pods         │ │  │   │  │ │    Backend Pods         │ │  │  │
│  │  │ │  Node.js + Express      │ │  │   │  │ │  Node.js + Express      │ │  │  │
│  │  │ └─────────────────────────┘ │  │   │  │ └─────────────────────────┘ │  │  │
│  │  │                             │  │   │  │                             │  │  │
│  │  │ ┌─────────────────────────┐ │  │   │  │ ┌─────────────────────────┐ │  │  │
│  │  │ │   Monitoring Pods       │ │  │   │  │ │   Monitoring Pods       │ │  │  │
│  │  │ │ Prometheus + Grafana    │ │  │   │  │ │ Prometheus + Grafana    │ │  │  │
│  │  │ └─────────────────────────┘ │  │   │  │ └─────────────────────────┘ │  │  │
│  │  └─────────────────────────────┘  │   │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘   └───────────────────────────────────┘  │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        Database Subnet Group                            │    │
│  │                                                                         │    │
│  │  ┌─────────────────────────┐          ┌─────────────────────────┐       │    │
│  │  │    RDS PostgreSQL       │          │   RDS Read Replica      │       │    │
│  │  │      Primary DB         │◄────────►│     (Optional)          │       │    │
│  │  │       AZ-1a             │          │       AZ-1b             │       │    │
│  │  └─────────────────────────┘          └─────────────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘

External AWS Services:
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │       S3        │  │    Cognito      │  │  Secrets Mgr    │                 │
│  │  File Storage   │  │ Authentication  │  │   Credentials   │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   CloudWatch    │  │      ECR        │  │    EKS Cluster  │                 │
│  │ Logs & Metrics  │  │ Container Reg.  │  │ Control Plane   │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   Parameter     │  │    AWS Backup   │  │   Systems Mgr   │                 │
│  │     Store       │  │ Automated Backup│  │  Session Mgr    │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘

CI/CD Pipeline:
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Developer → GitHub → GitHub Actions → ECR → EKS → CloudWatch                   │
│     ↓           ↓          ↓           ↓      ↓        ↓                        │
│   Code      Webhook   Build/Test    Push   Deploy   Monitor                     │
│   Push      Trigger   Docker       Image   Pods     Metrics                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Architecture Components Explanation

### 1. **Frontend Layer**
- **S3 Static Website**: Hosts React.js application
- **CloudFront**: Global CDN for fast content delivery
- **Route 53**: DNS management and domain routing

### 2. **API Layer**
- **API Gateway**: REST API proxy and rate limiting
- **WAF**: Web Application Firewall for security
- **Application Load Balancer**: Traffic distribution across EKS nodes

### 3. **Compute Layer**
- **EKS Cluster**: Managed Kubernetes service
- **Worker Nodes**: EC2 instances running application pods
- **Auto Scaling Groups**: Dynamic scaling based on load

### 4. **Data Layer**
- **RDS PostgreSQL**: Managed relational database
- **S3**: Object storage for uploaded files
- **ElastiCache Redis**: Session storage and caching

### 5. **Security Layer**
- **VPC**: Network isolation
- **Private Subnets**: Secure application deployment
- **NAT Gateways**: Outbound internet access for private resources
- **Cognito**: User authentication and authorization
- **Secrets Manager**: Secure credential storage

### 6. **Monitoring Layer**
- **CloudWatch**: AWS native monitoring and logging
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **X-Ray**: Distributed tracing

### 7. **DevOps Layer**
- **GitHub Actions**: CI/CD pipeline automation
- **ECR**: Container registry
- **Terraform**: Infrastructure as Code
- **Systems Manager**: Configuration management

## Traffic Flow

1. **User Request** → Route 53 → CloudFront → S3 (Static Assets)
2. **API Calls** → Route 53 → CloudFront → API Gateway → WAF → ALB → EKS Pods
3. **File Uploads** → Backend API → S3 Bucket
4. **Database Operations** → Backend API → RDS PostgreSQL
5. **Authentication** → Cognito → JWT Tokens → Backend Validation

## Security Measures

- **Network**: VPC with private subnets, security groups, NACLs
- **Application**: WAF, API Gateway throttling, JWT authentication
- **Data**: Encryption at rest and in transit, S3 bucket policies
- **Access**: IAM roles and policies, least privilege principle
- **Monitoring**: CloudTrail, GuardDuty, Security Hub

## High Availability & Disaster Recovery

- **Multi-AZ Deployment**: Resources distributed across multiple AZs
- **Auto Scaling**: Automatic scaling based on metrics
- **Load Balancing**: Traffic distribution across healthy instances
- **Database Replication**: RDS Multi-AZ with automatic failover
- **Backup Strategy**: Automated backups for RDS and S3 versioning
- **Health Checks**: Application and infrastructure health monitoring
