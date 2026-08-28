const User = require("../models/user");
const Conversation = require("../models/conversation");
const Message = require("../models/message");

class ChatController {
  getUsers = async (req, res) => {
    try {
      const users = await User.find({ _id: { $ne: req.user.id } }).select("_id username email");
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  createDirectConversation = async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, message: "userId is required" });
      }

      const existing = await Conversation.findOne({
        type: "direct",
        participants: { $all: [req.user.id, userId], $size: 2 },
      });

      if (existing) {
        return res.json({ success: true, conversation: existing });
      }

      const conversation = await Conversation.create({
        type: "direct",
        participants: [req.user.id, userId],
        createdBy: req.user.id,
      });

      res.status(201).json({ success: true, conversation });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  createGroupConversation = async (req, res) => {
    try {
      const { name, participantIds } = req.body;
      if (!name || !participantIds?.length) {
        return res.status(400).json({ success: false, message: "Group name and participants are required" });
      }

      const participants = [...new Set([req.user.id, ...participantIds])];
      const conversation = await Conversation.create({
        type: "group",
        name,
        participants,
        admin: req.user.id,
        createdBy: req.user.id,
      });

      res.status(201).json({ success: true, conversation });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  addMemberToGroup = async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body;
      const conversation = await Conversation.findById(conversationId);

      if (!conversation || conversation.type !== "group") {
        return res.status(404).json({ success: false, message: "Group not found" });
      }

      if (conversation.admin.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: "Only the admin can add members" });
      }

      if (conversation.participants.some((participant) => participant.toString() === userId)) {
        return res.status(409).json({ success: false, message: "User already in the group" });
      }

      conversation.participants.push(userId);
      await conversation.save();

      res.json({ success: true, conversation });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getConversations = async (req, res) => {
    try {
      const conversations = await Conversation.find({ participants: req.user.id })
        .populate("participants", "username")
        .populate("lastMessage")
        .sort({ updatedAt: -1 });

      res.json({ success: true, conversations });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getMessages = async (req, res) => {
    try {
      const messages = await Message.find({ conversation: req.params.conversationId })
        .populate("sender", "username")
        .sort({ createdAt: 1 });

      res.json({ success: true, messages });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

module.exports = new ChatController();