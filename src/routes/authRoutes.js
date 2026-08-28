// src/routes/auth.routes.js
// Routes define WHAT URL does WHAT.
// The flow is: Route → Validator → Controller
// Each middleware runs in order, left to right.

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authValidator = require("../validtors/authValidator");

router.post("/register", authValidator.validateRegister, authController.register);
router.post("/login", authValidator.validateLogin, authController.login);

module.exports = router;