const GangXP = require("../models/GangXP");

module.exports = async (gang, amount) => {
  const data = await GangXP.findOne({ gang });
  if (!data) return;
  data.xp += amount;
  await data.save();
};