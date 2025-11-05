import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    private userRepository;
    constructor();
    register(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    login(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    verifyToken(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
    logout(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}
//# sourceMappingURL=auth.d.ts.map