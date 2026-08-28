const Joi = require("joi");

class AuthValidator {
  constructor() {
    this.registerSchema = Joi.object({
      username: Joi.string().min(3).max(30).alphanum().required().messages({
        "string.min": "Username must be at least 3 characters",
        "string.alphanum": "Username can only contain letters and numbers",
        "any.required": "Username is required",
      }),
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email",
        "any.required": "Email is required",
      }),
      password: Joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters",
        "any.required": "Password is required",
      }),
    });

    this.loginSchema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    this.validateRegister = this.validate(this.registerSchema);
    this.validateLogin = this.validate(this.loginSchema);
  }

  validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ success: false, errors });
    }

    next();
  };
}

module.exports = new AuthValidator();