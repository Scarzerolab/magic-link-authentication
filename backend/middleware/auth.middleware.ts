import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.ts";

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const decoded = verifyAccessToken(token) as string;

        (req as any).user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid token"
        });

    }
}