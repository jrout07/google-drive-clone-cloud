import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class FoldersController {
    private folderRepository;
    constructor();
    createFolder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void>;
    getFolders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void>;
    getFolder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void>;
    updateFolder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void>;
    deleteFolder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void>;
}
//# sourceMappingURL=folders.d.ts.map