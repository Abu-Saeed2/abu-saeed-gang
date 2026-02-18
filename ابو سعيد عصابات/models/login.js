const { Schema, model } = require("mongoose");

const loginSchema = new Schema({
  userId: { type: String, required: true },
  gang: { type: String, required: true },
  status: { type: String, enum: ["in", "out"], default: "out" },
  lastUpdate: { type: Date, default: Date.now }
});

loginSchema.index({ userId: 1, gang: 1 }, { unique: true });

module.exports = model("Login", loginSchema);