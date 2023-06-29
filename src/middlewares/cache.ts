import mcache from 'memory-cache';
import { Request, Response, NextFunction } from 'express';

interface CustomResponse extends Response {
    sendResponse?: (body: any) => void;
}

const cacheMiddleware = (duration: number) => {
    return (req: Request, res: CustomResponse, next: NextFunction): void => {
        try {
            const key = '__express__' + (req.originalUrl || req.url);
            const cachedBody = mcache.get(key);
            if (cachedBody) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.parse(cachedBody));
                return;
            } else {
                res.sendResponse = (body: any) => {
                    if (body && !res.headersSent) {
                        mcache.put(key, JSON.stringify(body), duration * 1000);
                    }
                    res.sendResponse = res.send;
                    res.send(body);
                };
                next();
            }
        } catch (err) {
            console.log(err);
            next(err);
        }
    };
};

export default cacheMiddleware;
