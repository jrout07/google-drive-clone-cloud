# Required GitHub Secrets

This document lists all the GitHub secrets that need to be configured in your repository settings for the CI/CD pipeline to work properly.

## AWS Secrets

### Required for all AWS operations:
- `AWS_ACCESS_KEY_ID` - AWS Access Key ID for deployment user
- `AWS_SECRET_ACCESS_KEY` - AWS Secret Access Key for deployment user
- `AWS_ACCOUNT_ID` - Your AWS Account ID (12-digit number)

### Required for frontend deployment:
- `S3_FRONTEND_BUCKET` - S3 bucket name for frontend static files
- `CLOUDFRONT_DISTRIBUTION_ID` - CloudFront distribution ID for cache invalidation

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Go to **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with its corresponding value

## AWS IAM Permissions

The AWS user/role used for deployment needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:UpdateKubeconfig"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-frontend-bucket",
        "arn:aws:s3:::your-frontend-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

## Security Best Practices

1. **Use IAM roles with minimal permissions** - Only grant the permissions needed for deployment
2. **Rotate secrets regularly** - Update AWS access keys periodically
3. **Use environment-specific secrets** - Consider separate secrets for staging/production
4. **Monitor secret usage** - Review CloudTrail logs for unexpected access patterns
