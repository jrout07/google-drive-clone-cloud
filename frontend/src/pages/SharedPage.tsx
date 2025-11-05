import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Share,
  InsertDriveFile,
  Folder,
} from '@mui/icons-material';

interface SharedItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  sharedBy: string;
  sharedDate: string;
  permission: 'view' | 'edit';
}

const SharedPage: React.FC = () => {
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSharedItems = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/shares', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSharedItems(data.data || []);
        } else {
          throw new Error('Failed to fetch shared items');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load shared items');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedItems();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Shared with me
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Files and folders that others have shared with you.
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Sharing feature is currently being developed. Full AWS S3 and database integration coming soon!
        </Alert>
      )}

      <Grid container spacing={2}>
        {sharedItems.map((item) => (
          <Grid item xs={12} key={item.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    {item.type === 'file' ? (
                      <InsertDriveFile color="secondary" sx={{ mr: 2 }} />
                    ) : (
                      <Folder color="primary" sx={{ mr: 2 }} />
                    )}
                    <Box>
                      <Typography variant="h6">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Shared by {item.sharedBy} on {item.sharedDate}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Chip
                      size="small"
                      label={item.permission}
                      color={item.permission === 'edit' ? 'primary' : 'default'}
                      icon={<Share />}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!loading && !error && sharedItems.length === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ py: 8 }}
        >
          <Share sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No shared items yet
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Files and folders shared with you will appear here.<br />
            The sharing feature is currently being developed with full AWS integration.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SharedPage;
