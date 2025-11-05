import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Download,
  Share,
  Edit,
  Delete,
  Info,
  DriveFileMove,
  CreateNewFolder,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import ShareDialog from '../Share/ShareDialog';

interface FolderContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  folder: {
    id: string;
    name: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  onInfo?: () => void;
  onCreateSubfolder?: () => void;
}

const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  anchorEl,
  open,
  onClose,
  folder,
  onEdit,
  onDelete,
  onMove,
  onInfo,
  onCreateSubfolder,
}) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await apiService.downloadFolder(folder.id);
    } catch (error) {
      console.error('Download failed:', error);
      // You could show a toast notification here
    } finally {
      setDownloading(false);
      onClose();
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
    onClose();
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleDownload} disabled={downloading}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>{downloading ? 'Downloading...' : 'Download'}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleShare}>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>

        <Divider />

        {onCreateSubfolder && (
          <MenuItem onClick={() => handleAction(onCreateSubfolder)}>
            <ListItemIcon>
              <CreateNewFolder fontSize="small" />
            </ListItemIcon>
            <ListItemText>New Subfolder</ListItemText>
          </MenuItem>
        )}

        {onEdit && (
          <MenuItem onClick={() => handleAction(onEdit)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
        )}

        {onMove && (
          <MenuItem onClick={() => handleAction(onMove)}>
            <ListItemIcon>
              <DriveFileMove fontSize="small" />
            </ListItemIcon>
            <ListItemText>Move</ListItemText>
          </MenuItem>
        )}

        {onInfo && (
          <MenuItem onClick={() => handleAction(onInfo)}>
            <ListItemIcon>
              <Info fontSize="small" />
            </ListItemIcon>
            <ListItemText>Details</ListItemText>
          </MenuItem>
        )}

        <Divider />

        {onDelete && (
          <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        resourceId={folder.id}
        resourceType="folder"
        resourceName={folder.name}
      />
    </>
  );
};

export default FolderContextMenu;
