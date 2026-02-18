const { EmbedBuilder } = require("discord.js");
const GangXP = require("../models/GangXP");

module.exports = async (client) => {
  const channelId = "1453670779714539666";
  const messageId = "1453673440165892170";

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) return;

  const allGangs = [
    "trickster",
    "scrap",
    "coza",
    "oldschool",
    "bloods",
    "eleven",
  ];

  const data = await GangXP.find();

  const gangs = allGangs.map(gang => {
    const found = data.find(d => d.gang === gang);
    return {
      gang,
      xp: found ? found.xp : 0,
    };
  });

  gangs.sort((a, b) => b.xp - a.xp);

  let desc = "";
  let i = 1;

  for (const g of gangs) {
    desc += `**${i} - ${g.gang} : XP ${g.xp}**\n`;
    i++;
  }

  const embed = new EmbedBuilder()
    .setTitle("🏆 ترتيب العصابات")
    .setDescription(desc)
    .setColor("Gold");

  await message.edit({ embeds: [embed] });
};