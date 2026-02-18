const GangXP = require("../models/GangXP");

module.exports = async () => {
  const gangs = [
    "trickster",
    "scrap",
    "coza",
    "oldschool",
    "bloods",
    "eleven"
  ];

  for (const gang of gangs) {
    await GangXP.findOneAndUpdate(
      { gang },
      { gang },
      { upsert: true }
    );
  }
};