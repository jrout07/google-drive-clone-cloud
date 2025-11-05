import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Avatar,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera, Person } from '@mui/icons-material';
import { apiService, User } from '../../services/api';

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (user: User) => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onClose,
  user,
  onUpdate,
}) => {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB');
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update profile information
      const updatedUser = await apiService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      let finalUser = updatedUser;

      // Upload profile image if selected
      if (profileImage) {
        const userWithImage = await apiService.uploadProfileImage(profileImage);
        finalUser = userWithImage;
      }

      onUpdate(finalUser);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setProfileImage(null);
      setProfileImagePreview(null);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Profile Image Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={profileImagePreview || user.profileImageUrl}
                sx={{ 
                  width: 100, 
                  height: 100,
                  border: '3px solid',
                  borderColor: 'primary.light'
                }}
              >
                {!profileImagePreview && !user.profileImageUrl && (
                  <Person sx={{ fontSize: 50 }} />
                )}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  width: 36,
                  height: 36,
                }}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <PhotoCamera sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Click the camera icon to change your profile picture
              <br />
              (Max 5MB, JPG/PNG)
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </Box>

          {/* Name Fields */}
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            disabled={loading}
            required
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            disabled={loading}
            required
          />

          {/* Email (read-only) */}
          <TextField
            label="Email"
            value={user.email}
            fullWidth
            disabled
            helperText="Email cannot be changed"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileDialog;
