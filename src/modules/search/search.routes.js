import express from "express";
import { search } from "./search.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { searchRateLimit } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, searchRateLimit, search);

export default router;