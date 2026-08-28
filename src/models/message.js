const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content cannot be empty"],
      maxlength: [1000, "Message too long"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    chatType: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    room: {
      type: String,
      default: "general",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);