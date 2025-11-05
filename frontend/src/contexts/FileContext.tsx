import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FolderItem {
  id: string;
  name: string;
  parentId?: string;
  isPublic: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
  children?: FolderItem[];
  files?: FileItem[];
}

interface FileContextType {
  files: FileItem[];
  folders: FolderItem[];
  currentFolder: FolderItem | null;
  loading: boolean;
  uploadFile: (file: File, folderId?: string) => Promise<void>;
  uploadFiles: (files: File[], folderId?: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  loadFiles: (folderId?: string) => Promise<void>;
  loadFolders: (parentId?: string) => Promise<void>;
  setCurrentFolder: (folder: FolderItem | null) => void;
  downloadFile: (fileId: string) => Promise<void>;
  searchFiles: (query: string) => Promise<FileItem[]>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`http://localhost:3001${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  const uploadFile = async (file: File, folderId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    await apiCall('/api/files/upload', {
      method: 'POST',
      body: formData,
    });

    // Reload files after upload
    await loadFiles(folderId);
  };

  const uploadFiles = async (fileList: File[], folderId?: string) => {
    setLoading(true);
    try {
      for (const file of fileList) {
        await uploadFile(file, folderId);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    await apiCall(`/api/files/${fileId}`, {
      method: 'DELETE',
    });

    // Remove file from local state
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const createFolder = async (name: string, parentId?: string) => {
    await apiCall('/api/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, parentId }),
    });

    // Reload folders after creation
    await loadFolders(parentId);
  };

  const deleteFolder = async (folderId: string) => {
    await apiCall(`/api/folders/${folderId}`, {
      method: 'DELETE',
    });

    // Remove folder from local state
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
  };

  const loadFiles = async (folderId?: string) => {
    setLoading(true);
    try {
      const response = await apiCall(`/api/files${folderId ? `?folderId=${folderId}` : ''}`);
      setFiles(response.data.files);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async (parentId?: string) => {
    setLoading(true);
    try {
      const response = await apiCall(`/api/folders${parentId ? `?parentId=${parentId}` : ''}`);
      setFolders(response.data.folders);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileId: string) => {
    const response = await apiCall(`/api/files/${fileId}/download`);
    const { downloadUrl, fileName } = response.data;

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const searchFiles = async (query: string): Promise<FileItem[]> => {
    const response = await apiCall(`/api/files?search=${encodeURIComponent(query)}`);
    return response.data.files;
  };

  const value = {
    files,
    folders,
    currentFolder,
    loading,
    uploadFile,
    uploadFiles,
    deleteFile,
    createFolder,
    deleteFolder,
    loadFiles,
    loadFolders,
    setCurrentFolder,
    downloadFile,
    searchFiles,
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};
