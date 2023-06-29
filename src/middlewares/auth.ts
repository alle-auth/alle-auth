import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getEnvironment } from '../config/environment';

interface AuthenticatedRequest extends Request {
    user?: any;
}

const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined> => {
    try {
        const { authorization } = req.headers;
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).send({ message: 'Authorization required!' })
        }
        const token = authorization.replace('Bearer ', '');
        let payload: any = jwt.verify(token, getEnvironment().JSON_SECRET as string)
        req.user = payload;
        next();
    } catch (err: any) {
        console.log(err);
        return res.status(401).send({ message: err.message })
    }
};

export default authenticate;
