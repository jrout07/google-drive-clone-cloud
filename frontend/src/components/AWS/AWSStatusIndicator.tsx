import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { CloudDone, Security, Storage } from '@mui/icons-material';

const AWSStatusIndicator: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
      <Tooltip title="AWS Cognito Authentication - User Pool: us-west-2_GyEF1dW0E">
        <Chip
          icon={<Security />}
          label="AWS Cognito"
          color="success"
          variant="outlined"
          size="small"
        />
      </Tooltip>
      
      <Tooltip title="AWS RDS PostgreSQL Database - gdrive_clone">
        <Chip
          icon={<Storage />}
          label="RDS PostgreSQL"
          color="success"
          variant="outlined"
          size="small"
        />
      </Tooltip>
      
      <Tooltip title="AWS S3 Cloud Storage - File uploads and downloads">
        <Chip
          icon={<CloudDone />}
          label="S3 Storage"
          color="success"
          variant="outlined"
          size="small"
        />
      </Tooltip>
    </Box>
  );
};

export default AWSStatusIndicator;
