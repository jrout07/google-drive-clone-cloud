import { Request, Response, NextFunction } from 'express';
export interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}
export declare const errorHandler: (err: CustomError, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.d.ts.map