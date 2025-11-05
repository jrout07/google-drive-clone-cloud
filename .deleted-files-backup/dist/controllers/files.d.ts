import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, FileUploadRequest } from '../types';
export declare class FilesController {
    private fileRepository;
    private userRepository;
    constructor();
    uploadFile(req: FileUploadRequest, res: Response, next: NextFunction): Promise<Response | void>;
    getFiles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void>;
    getFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void>;
    downloadFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void>;
    updateFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void>;
    deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void>;
}
//# sourceMappingURL=files.d.ts.map