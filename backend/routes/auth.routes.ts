import { Router } from "express";
import { login, refresh, me, logout } from "../controllers/auth.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/login", login);

router.post("/refresh", refresh);

router.get("/me", authenticate, me);

router.delete("/logout", logout);

export default router;