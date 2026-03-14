import type { Request, Response } from "express";
import { magic } from "../config/magic.ts";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../utils/jwt.ts";
import redisClient from "../config/redis.ts";

export const me = async (req: Request, res: Response) => {

    const user = (req as any).user;

    return res.json({
        userId: user.userId
    });

};

export const login = async (req: Request, res: Response) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "Missing Authorization header" });
        }

        const didToken = authHeader.split(" ")[1];
        if (!didToken) return res.status(401).json({
            message: "did token gaada anjay"
        })

        // Validate DID token
        magic.token.validate(didToken);

        // Get user metadata
        const metadata = await magic.users.getMetadataByToken(didToken);

        const userId = metadata.issuer;
        if (!userId) return res.status(401).json({
            message: "taada user id ma!!"
        })

        // Create JWT tokens
        const accessToken = createAccessToken(userId);
        const refreshToken = createRefreshToken(userId);

        // Store refresh token in Redis
        await redisClient.set(
            `refresh:${userId}`,
            refreshToken,
            {
                EX: 60 * 60 * 24 * 7 //detik, menit, jam, hari
            }
        );

        // Set access token cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 15 * 60 * 1000 // 900000 mili second
        });

        return res.json({
            message: "Login successful"
        });

    } catch (error) {

        console.error(error);

        return res.status(401).json({
            message: "Authentication failed"
        });

    }
};

export const refresh = async (req: Request, res: Response) => {
    try {

        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Missing refresh token"
            });
        }

        // verify
        const decoded = verifyRefreshToken(refreshToken) as any;

        const userId = decoded.userId;

        // check redis
        const storedToken = await redisClient.get(`refresh:${userId}`);

        if (!storedToken || storedToken !== refreshToken) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        const newAccessToken = createAccessToken(userId);

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 15 * 60 * 1000
        });

        return res.json({
            message: "Access token refreshed"
        });

    } catch (error) {

        return res.status(401).json({
            message: "Refresh failed"
        });

    }
};

export const logout = async (req: Request, res: Response) => {
    try {

        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(200).json({
                message: "Already logged out"
            });
        }

        // verify token
        const decoded = verifyRefreshToken(refreshToken) as any;

        const userId = decoded.userId;

        // delete from redis
        await redisClient.del(`refresh:${userId}`);

        // clear cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.json({
            message: "Logged out successfully"
        });

    } catch (error) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.json({
            message: "Logged out"
        });
    }
};