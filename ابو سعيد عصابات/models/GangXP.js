const mongoose = require("mongoose");

const gangXPSchema = new mongoose.Schema({
  gang: { type: String, unique: true },
  xp: { type: Number, default: 0 }
});

module.exports = mongoose.model("GangXP", gangXPSchema);