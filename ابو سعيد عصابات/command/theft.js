const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = {
  name: "theft",
  run: async (client, message) => {

    const embed = new EmbedBuilder()
      .setTitle("🕵️‍♂️ — عمليات السرقة")
      .setDescription(
        "**🏴‍☠️ اختر نوع السرقة التي تريد تنفيذها من القائمة بالأسفل:**"
      )
      .setColor("DarkRed");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("theft_select")
      .setPlaceholder("اختر عملية السرقة")
      .addOptions([
        {
          label: "بقالة",
          value: "store",
          emoji: "🛒",
        },
        {
          label: "محل ملابس",
          value: "clothing",
          emoji: "👕",
        },
        {
          label: "منزل",
          value: "house",
          emoji: "🏠",
        },
        {
          label: "محل أسلحة",
          value: "weapon",
          emoji: "🔫",
        },
        {
          label: "سرقة مجوهرات",
          value: "jewelry",
          emoji: "💎",
        },
        {
          label: "بنك بوليتو",
          value: "polito",
          emoji: "🏦",
        },
        {
          label: "البنك المركزي",
          value: "central_bank",
          emoji: "🏛️",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await message.channel.send({
      embeds: [embed],
      components: [row],
    });
  },
};