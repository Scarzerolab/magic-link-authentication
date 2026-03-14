import { createAccessToken, verifyAccessToken } from "../utils/jwt.ts";

const token = createAccessToken("budi");

console.log("token:", token);

const decoded = verifyAccessToken(token);

console.log("decoded:", decoded);