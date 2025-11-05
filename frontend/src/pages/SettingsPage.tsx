import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  AccountCircle,
  Storage,
  Security,
  Notifications,
  Language,
  Palette,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService, User } from '../services/api';
import EditProfileDialog from '../components/Profile/EditProfileDialog';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profileData = await apiService.getProfile();
      setUserProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUserProfile(updatedUser);
    updateUser(updatedUser);
  };

  const handleDownloadData = async () => {
    try {
      setLoading(true);
      await apiService.downloadUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setError('Password is required to delete account');
      return;
    }

    try {
      setDeleteLoading(true);
      await apiService.deleteAccount(deletePassword);
      // Logout user after successful account deletion
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your account settings and preferences.
      </Typography>

      {/* Account Information */}
      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <AccountCircle />
            </ListItemIcon>
            <ListItemText
              primary="Account Information"
              secondary="Manage your personal information"
            />
            <Button variant="outlined" size="small" onClick={() => setEditProfileOpen(true)}>
              Edit Profile
            </Button>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Storage />
            </ListItemIcon>
            <ListItemText
              primary="Storage"
              secondary={
                userProfile 
                  ? `${formatFileSize(userProfile.storageUsed)} of ${formatFileSize(userProfile.storageLimit)} used`
                  : 'Loading...'
              }
            />
            <Button variant="outlined" size="small">
              Manage
            </Button>
          </ListItem>
        </List>
      </Paper>

      {/* Privacy & Security */}
      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText
              primary="Two-Factor Authentication"
              secondary="Add an extra layer of security to your account"
            />
            <Switch />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText
              primary="Login Notifications"
              secondary="Get notified when someone signs in to your account"
            />
            <Switch defaultChecked />
          </ListItem>
        </List>
      </Paper>

      {/* Preferences */}
      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <Notifications />
            </ListItemIcon>
            <ListItemText
              primary="Email Notifications"
              secondary="Receive email updates about your files"
            />
            <Switch defaultChecked />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Language />
            </ListItemIcon>
            <ListItemText
              primary="Language"
              secondary="Choose your preferred language"
            />
            <Button variant="outlined" size="small">
              English
            </Button>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Palette />
            </ListItemIcon>
            <ListItemText
              primary="Theme"
              secondary="Choose between light and dark mode"
            />
            <Button variant="outlined" size="small">
              Light
            </Button>
          </ListItem>
        </List>
      </Paper>

      {/* Account Actions */}
      <Paper>
        <List>
          <ListItem>
            <ListItemText
              primary="Download Your Data"
              secondary="Download a copy of all your files and data"
            />
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleDownloadData}
              disabled={loading}
            >
              {loading ? <CircularProgress size={16} /> : 'Download'}
            </Button>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Delete Account"
              secondary="Permanently delete your account and all data"
            />
            <Button 
              variant="outlined" 
              color="error" 
              size="small"
              onClick={() => setDeleteAccountOpen(true)}
            >
              Delete
            </Button>
          </ListItem>
        </List>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Edit Profile Dialog */}
      {userProfile && (
        <EditProfileDialog
          open={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          user={userProfile}
          onUpdate={handleProfileUpdate}
        />
      )}

      {/* Delete Account Dialog */}
      <Dialog 
        open={deleteAccountOpen} 
        onClose={() => setDeleteAccountOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle color="error">Delete Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            All your files, folders, and data will be permanently deleted.
          </Typography>
          <TextField
            label="Enter your password to confirm"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            fullWidth
            disabled={deleteLoading}
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteAccountOpen(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={deleteLoading || !deletePassword.trim()}
            startIcon={deleteLoading ? <CircularProgress size={16} /> : null}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
