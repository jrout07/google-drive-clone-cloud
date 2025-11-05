import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  CreateNewFolder,
  MoreVert,
  Download,
  Delete,
  Share,
  Folder,
  InsertDriveFile,
  Home,
} from '@mui/icons-material';
import { useFiles } from '../contexts/FileContext';
import { useNotification } from '../contexts/NotificationContext';

const FilesPage: React.FC = () => {
  const {
    files,
    folders,
    currentFolder,
    loading,
    uploadFiles,
    deleteFile,
    createFolder,
    deleteFolder,
    loadFiles,
    loadFolders,
    setCurrentFolder,
    downloadFile,
  } = useFiles();
  const { showNotification } = useNotification();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    loadFiles(currentFolder?.id);
    loadFolders(currentFolder?.id);
  }, [currentFolder]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      const filesArray = Array.from(fileList);
      uploadFiles(filesArray, currentFolder?.id)
        .then(() => {
          showNotification(`${filesArray.length} file(s) uploaded successfully`, 'success');
        })
        .catch(() => {
          showNotification('Upload failed', 'error');
        });
    }
  };

  const handleCreateFolder = async () => {
    try {
      await createFolder(newFolderName, currentFolder?.id);
      setFolderDialogOpen(false);
      setNewFolderName('');
      showNotification('Folder created successfully', 'success');
    } catch (error) {
      showNotification('Failed to create folder', 'error');
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      await downloadFile(fileId);
      handleMenuClose();
    } catch (error) {
      showNotification('Download failed', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedItem.mimeType) {
        // It's a file
        await deleteFile(selectedItem.id);
        showNotification('File deleted successfully', 'success');
      } else {
        // It's a folder
        await deleteFolder(selectedItem.id);
        showNotification('Folder deleted successfully', 'success');
      }
      handleMenuClose();
    } catch (error) {
      showNotification('Delete failed', 'error');
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const breadcrumbPath = currentFolder?.name ? currentFolder.name.split('/') : [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom>
            My Files
          </Typography>
          <Breadcrumbs>
            <Link
              component="button"
              variant="body2"
              onClick={() => setCurrentFolder(null)}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Home sx={{ mr: 0.5 }} fontSize="inherit" />
              Home
            </Link>
            {breadcrumbPath.map((path, index) => (
              <Typography key={index} color="text.primary">
                {path}
              </Typography>
            ))}
          </Breadcrumbs>
        </div>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CreateNewFolder />}
            onClick={() => setFolderDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUpload />}
          >
            Upload Files
            <input
              type="file"
              hidden
              multiple
              onChange={handleFileUpload}
            />
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Folders */}
        {folders.map((folder) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
            <Card
              sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}
              onClick={() => setCurrentFolder(folder)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
                    <Folder color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1" noWrap>
                      {folder.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, folder);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Folder • {new Date(folder.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Files */}
        {files.map((file) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
                    <InsertDriveFile color="secondary" sx={{ mr: 1 }} />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, file)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </Typography>
                  {file.isPublic && (
                    <Chip size="small" label="Shared" color="success" sx={{ ml: 1 }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {files.length === 0 && folders.length === 0 && !loading && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ py: 8 }}
        >
          <InsertDriveFile sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No files or folders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload files or create folders to get started
          </Typography>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedItem?.mimeType && (
          <MenuItem onClick={() => handleDownload(selectedItem.id)}>
            <Download sx={{ mr: 1 }} />
            Download
          </MenuItem>
        )}
        <MenuItem onClick={() => {}}>
          <Share sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FilesPage;
