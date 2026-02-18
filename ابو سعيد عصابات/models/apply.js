const { Schema, model } = require("mongoose");

const applySchema = new Schema({
  userId: String,
  name: String,
  age: String,
  crimes: String,
  gang: String,
});

module.exports = model("Apply", applySchema);