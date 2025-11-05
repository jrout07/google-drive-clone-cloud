import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validateRequest: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => Response | void;
export declare const schemas: {
    login: Joi.ObjectSchema<any>;
    createFolder: Joi.ObjectSchema<any>;
    updateFolder: Joi.ObjectSchema<any>;
    updateFile: Joi.ObjectSchema<any>;
    createShare: Joi.ObjectSchema<any>;
    updateUser: Joi.ObjectSchema<any>;
};
export declare const validateUUIDParam: (paramName: string) => (req: Request, res: Response, next: NextFunction) => Response | void;
//# sourceMappingURL=validation.d.ts.map