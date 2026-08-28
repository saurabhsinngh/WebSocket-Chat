const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const chatValidator = require("../validtors/chatValidator");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/users", authMiddleware.authenticate, chatController.getUsers);

router.post("/direct", authMiddleware.authenticate, chatValidator.validateDirect, chatController.createDirectConversation);

router.post("/group", authMiddleware.authenticate, chatValidator.validateGroup, chatController.createGroupConversation);

router.post("/group/:conversationId/add", authMiddleware.authenticate, chatValidator.validateAddMember, chatController.addMemberToGroup);

router.get("/conversations", authMiddleware.authenticate, chatController.getConversations);

router.get("/messages/:conversationId", authMiddleware.authenticate, chatController.getMessages);

module.exports = router;
