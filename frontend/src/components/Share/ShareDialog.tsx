import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { ContentCopy, Visibility, VisibilityOff } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { apiService, ShareCreateRequest, Share } from '../../services/api';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: 'file' | 'folder';
  resourceName: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  resourceId,
  resourceType,
  resourceName,
}) => {
  const [permissions, setPermissions] = useState<'read' | 'write'>('read');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShare, setCreatedShare] = useState<Share | null>(null);

  const handleCreateShare = async () => {
    setLoading(true);
    setError(null);

    try {
      const shareData: ShareCreateRequest = {
        resourceId,
        resourceType,
        permissions,
        ...(expiresAt && { expiresAt: expiresAt.toISOString() }),
        ...(hasPassword && password && { password }),
      };

      const { share } = await apiService.createShare(shareData);
      setCreatedShare(share);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (createdShare) {
      try {
        await navigator.clipboard.writeText(createdShare.shareUrl);
        // You could add a toast notification here
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = createdShare.shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPermissions('read');
      setExpiresAt(null);
      setHasPassword(false);
      setPassword('');
      setShowPassword(false);
      setError(null);
      setCreatedShare(null);
      onClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          Share "{resourceName}"
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {createdShare ? (
              // Show created share
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="success">
                  Share link created successfully!
                </Alert>
                
                <TextField
                  label="Share Link"
                  value={createdShare.shareUrl}
                  fullWidth
                  multiline
                  rows={2}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleCopyLink} edge="end">
                          <ContentCopy />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Permissions:</strong> {createdShare.permissions === 'read' ? 'View only' : 'Can edit'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Protected:</strong> {createdShare.isPasswordProtected ? 'Yes' : 'No'}
                  </Typography>
                </Box>

                {createdShare.expiresAt && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Expires:</strong> {new Date(createdShare.expiresAt).toLocaleString()}
                  </Typography>
                )}
              </Box>
            ) : (
              // Show share creation form
              <>
                <FormControl fullWidth>
                  <InputLabel>Permissions</InputLabel>
                  <Select
                    value={permissions}
                    onChange={(e) => setPermissions(e.target.value as 'read' | 'write')}
                    label="Permissions"
                    disabled={loading}
                  >
                    <MenuItem value="read">View only</MenuItem>
                    <MenuItem value="write">Can edit</MenuItem>
                  </Select>
                </FormControl>

                <DateTimePicker
                  label="Expiration Date (Optional)"
                  value={expiresAt}
                  onChange={setExpiresAt}
                  disabled={loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Leave empty for no expiration"
                    }
                  }}
                  minDateTime={new Date()}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={hasPassword}
                      onChange={(e) => setHasPassword(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Protect with password"
                />

                {hasPassword && (
                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    disabled={loading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Anyone with the link will need this password to access the file"
                  />
                )}

                <Typography variant="body2" color="text.secondary">
                  People with the link {permissions === 'read' ? 'can view' : 'can edit'} this {resourceType}.
                  {!expiresAt && ' The link will never expire.'}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            color="inherit"
          >
            {createdShare ? 'Done' : 'Cancel'}
          </Button>
          {!createdShare && (
            <Button 
              onClick={handleCreateShare} 
              variant="contained"
              disabled={loading || (hasPassword && !password.trim())}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Creating...' : 'Create Share Link'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ShareDialog;
