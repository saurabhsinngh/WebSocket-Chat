const Joi = require("joi");

class ChatValidator {
  constructor() {
    this.directSchema = Joi.object({
      userId: Joi.string().required().messages({
        "any.required": "userId is required",
      }),
    });

    this.groupSchema = Joi.object({
      name: Joi.string().min(3).max(50).required().messages({
        "string.min": "Group name must be at least 3 characters",
        "any.required": "Group name is required",
      }),
      participantIds: Joi.array().items(Joi.string()).min(1).required().messages({
        "array.min": "At least one participant is required",
        "any.required": "Participants are required",
      }),
    });

    this.addMemberSchema = Joi.object({
      userId: Joi.string().required().messages({
        "any.required": "userId is required",
      }),
    });

    this.validateDirect = this.validate(this.directSchema);
    this.validateGroup = this.validate(this.groupSchema);
    this.validateAddMember = this.validate(this.addMemberSchema);
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

module.exports = new ChatValidator();
