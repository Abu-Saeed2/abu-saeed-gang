const { EmbedBuilder } = require("discord.js");
const GangXP = require("../models/GangXP");

module.exports = {
  name: "gang-xp",
  run: async (client, message) => {
    const gangs = await GangXP.find().sort({ xp: -1 });

    let desc = "";
let i = 1;

for (const g of gangs) {
  desc += `**${i} - ${g.gang} : XP ${g.xp}**\n`;
  i++;
}

if (!desc) {
  desc = "لا توجد بيانات XP للعصابات حالياً.";
}

const embed = new EmbedBuilder()
  .setTitle("🏆 ترتيب العصابات")
  .setDescription(desc)
  .setColor("Gold");

    message.channel.send({ embeds: [embed] });
  }
};