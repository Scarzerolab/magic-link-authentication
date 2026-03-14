import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function createAccessToken(userId: string) {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });
}

export function createRefreshToken(userId: string) {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
}
