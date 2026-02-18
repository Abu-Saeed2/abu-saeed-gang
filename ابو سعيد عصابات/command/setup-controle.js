const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  name: "setup-controle",
  run: async (client, message) => {
    const embed = new EmbedBuilder()
      .setTitle("**💻 — لوحة التحكم بالعصابات .**")
      .setDescription(
        "**🏴‍☠️ - يمكنك من الأسفل التحكم الكامل بعصابتك**\n\n" +
        "• طرد عضو\n" +
        "• مشاهدة الأعضاء\n" +
        "• ترقية عضو\n" +
        "• تنزيل عضو"
      );

    // الصف الأول
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("kick_control")
        .setLabel("طرد عضو")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("members_control")
        .setLabel("الأعضاء")
        .setStyle(ButtonStyle.Secondary)
    );

    // الصف الثاني
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("promote_control")
        .setLabel("ترقية")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("demote_control")
        .setLabel("تنزيل")
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row1, row2]
    });
  }
};