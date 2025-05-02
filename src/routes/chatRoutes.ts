import { Router } from "express";
import {
  handleChatGeneration,
  handleInitChat,
  handleCloseChat,
} from "../controllers/chatController.js";

const router = Router();

// Chat endpoints
router.post("/init", handleInitChat);
router.post("/close", handleCloseChat);
router.post("/", handleChatGeneration);

export default router;
