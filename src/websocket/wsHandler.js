const jwt = require("jsonwebtoken");
const Message = require("../models/message");
const User = require("../models/user");
const Conversation = require("../models/conversation");

class WebSocketService {
  constructor() {
    this.clients = new Map();
  }

  handleConnection = (ws, req) => {
    console.log("🔌 New WebSocket connection");

    const url = new URL(req.url, `http://${req.headers.host}`);
    let token = url.searchParams.get("token");

    if (!token) {
      ws.close(1008, "No token provided");
      return;
    }

    token = token.replace(/^Bearer\s+/i, "").trim();

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      console.error("WebSocket auth failed:", err.message);
      ws.close(1008, "Invalid token");
      return;
    }

    this.clients.set(ws, {
      userId: decoded.id,
      username: null,
      conversationId: null,
    });

    User.findById(decoded.id).then((user) => {
      if (!user) {
        ws.close(1008, "User not found");
        return;
      }
      const clientInfo = this.clients.get(ws);
      clientInfo.username = user.username;

      this.sendToClient(ws, {
        type: "connected",
        message: `Welcome ${user.username}!`,
        user: { id: user._id, username: user.username },
      });
    });

    ws.on("message", async (rawData) => {
      try {
        const data = JSON.parse(rawData);
        const clientInfo = this.clients.get(ws);

        switch (data.type) {
          case "chat_message":
            await this.handleChatMessage(ws, clientInfo, data);
            break;
          case "join_conversation":
            this.handleJoinConversation(ws, clientInfo, data);
            break;
          case "typing":
            this.handleTyping(ws, clientInfo, data);
            break;
          default:
            this.sendToClient(ws, { type: "error", message: "Unknown message type" });
        }
      } catch (err) {
        this.sendToClient(ws, { type: "error", message: "Invalid message format" });
      }
    });

    ws.on("close", () => {
      const clientInfo = this.clients.get(ws);
      if (clientInfo?.username && clientInfo.conversationId) {
        this.broadcastToConversation(clientInfo.conversationId, {
          type: "user_left",
          username: clientInfo.username,
          timestamp: new Date().toISOString(),
        });
      }
      this.clients.delete(ws);
      console.log(`🔌 Client disconnected. Total: ${this.clients.size}`);
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err.message);
      this.clients.delete(ws);
    });
  };

  handleChatMessage = async (ws, clientInfo, data) => {
    if (!data.content?.trim() || !data.conversationId) {
      return this.sendToClient(ws, { type: "error", message: "Conversation and content are required" });
    }

    const conversation = await Conversation.findById(data.conversationId);
    if (!conversation || !conversation.participants.some((participant) => participant.toString() === clientInfo.userId.toString())) {
      return this.sendToClient(ws, { type: "error", message: "You are not a member of this conversation" });
    }

    const message = await Message.create({
      sender: clientInfo.userId,
      content: data.content.trim(),
      conversation: conversation._id,
      chatType: conversation.type,
      room: conversation._id.toString(),
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const payload = {
      type: "chat_message",
      id: message._id,
      content: message.content,
      sender: clientInfo.username,
      conversationId: conversation._id.toString(),
      chatType: conversation.type,
      timestamp: message.createdAt,
    };

    this.broadcastToConversation(conversation._id.toString(), payload);
  };

  handleJoinConversation = (ws, clientInfo, data) => {
    if (!data.conversationId) {
      return this.sendToClient(ws, { type: "error", message: "Conversation id is required" });
    }

    clientInfo.conversationId = data.conversationId;
    this.sendToClient(ws, { type: "conversation_changed", conversationId: data.conversationId });
  };

  handleTyping = (ws, clientInfo, data) => {
    if (!clientInfo.conversationId) {
      return;
    }

    this.broadcastToConversation(clientInfo.conversationId, {
      type: "typing",
      username: clientInfo.username,
      isTyping: data.isTyping,
      conversationId: clientInfo.conversationId,
    }, ws);
  };

  sendToClient = (ws, data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  broadcastToConversation = (conversationId, data, excludeWs = null) => {
    this.clients.forEach((clientInfo, ws) => {
      if (clientInfo.conversationId === conversationId && ws !== excludeWs) {
        this.sendToClient(ws, data);
      }
    });
  };
}

const webSocketService = new WebSocketService();

module.exports = {
  WebSocketService,
  handleConnection: webSocketService.handleConnection,
};