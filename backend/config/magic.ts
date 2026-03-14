import { Magic } from "@magic-sdk/admin";
import dotenv from "dotenv";

dotenv.config();

export const magic = new Magic(process.env.MAGIC_SECRET_KEY);