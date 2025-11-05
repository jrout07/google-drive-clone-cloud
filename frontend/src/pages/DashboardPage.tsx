import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  Folder,
  Share,
  Storage,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useFiles } from '../contexts/FileContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { files, folders, loadFiles, loadFolders } = useFiles();

  useEffect(() => {
    loadFiles();
    loadFolders();
  }, []);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const storageUsedPercent = user ? (user.storageUsed / user.storageLimit) * 100 : 0;

  const stats = [
    {
      title: 'Total Files',
      value: files.length,
      icon: <CloudUpload color="primary" />,
      color: 'primary.main',
    },
    {
      title: 'Folders',
      value: folders.length,
      icon: <Folder color="secondary" />,
      color: 'secondary.main',
    },
    {
      title: 'Shared Items',
      value: files.filter(f => f.isPublic).length,
      icon: <Share color="success" />,
      color: 'success.main',
    },
    {
      title: 'Storage Used',
      value: user ? formatFileSize(user.storageUsed) : '0 GB',
      icon: <Storage color="warning" />,
      color: 'warning.main',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Here's an overview of your Google Drive Clone storage.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5">
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Storage Usage */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Storage Usage
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2">
              {user ? formatFileSize(user.storageUsed) : '0 GB'} of {user ? formatFileSize(user.storageLimit) : '15 GB'} used
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {storageUsedPercent.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={storageUsedPercent}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label={`${files.length} files`}
            color="primary"
            variant="outlined"
          />
          <Chip
            size="small"
            label={`${folders.length} folders`}
            color="secondary"
            variant="outlined"
          />
          <Chip
            size="small"
            label={`${files.filter(f => f.isPublic).length} shared`}
            color="success"
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Recent Files */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Files
        </Typography>
        {files.length === 0 ? (
          <Typography color="text.secondary">
            No files uploaded yet. Start by uploading your first file!
          </Typography>
        ) : (
          <Box>
            {files.slice(0, 5).map((file) => (
              <Box
                key={file.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {file.isPublic && (
                  <Chip size="small" label="Shared" color="success" variant="outlined" />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DashboardPage;
