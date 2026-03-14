import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.ts";

dotenv.config();

const app = express();

app.get('/health', (req, res) => {
    res.json({
        status: 'ok'
    });
});

app.use("/auth", authRoutes);

export default app;