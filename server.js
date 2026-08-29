
require("dotenv").config(); // Load .env variables FIRST

const path = require("path");
const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");
const connectDB = require("./src/database/db");
const authRoutes = require("./src/routes/authRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const { handleConnection } = require("./src/websocket/wsHandler");
const listenWithPortFallback = require("./src/utils/serverStartup");

const app = express();

// --- MIDDLEWARE ---
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, "public")));

// --- HTTP ROUTES ---
app.use("/api/auth", authRoutes); // All auth routes live under /api/auth
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", uptime: process.uptime() });
});

// --- CREATE HTTP SERVER (needed to share port with WebSocket) ---
// WebSocket needs an HTTP server to "upgrade" from
const server = http.createServer(app);

// --- ATTACH WEBSOCKET SERVER to the same HTTP server ---
const wss = new WebSocketServer({ server });

// 'connection' event fires every time a new client connects
wss.on("connection", handleConnection);

// Log total connections periodically (optional)
setInterval(() => {
  console.log(`📊 Active WebSocket connections: ${wss.clients.size}`);
}, 30000);

// --- START THE SERVER ---
const PORT = process.env.PORT || 3030;

connectDB().then(() => {
  listenWithPortFallback(
    server,
    PORT,
    (actualPort) => {
      console.log(`🚀 Server running on http://localhost:${actualPort}`);
      console.log(`🔌 WebSocket ready on ws://localhost:${actualPort}`);
    },
    (error) => {
      console.error("Failed to start server:", error.message);
      process.exit(1);
    }
  );
}).catch((error) => {
  console.error("Database connection failed:", error.message);
  process.exit(1);
});