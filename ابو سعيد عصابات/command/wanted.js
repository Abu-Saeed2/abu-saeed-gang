const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");

module.exports = {
  name: "مطلوب",
  run: async (client, message) => {

    // فقط إدمن
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return message.reply("❌ هذا الأمر للإدمن فقط.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🚨 مطلوب")
      .setDescription("اضغط على الزر بالأسفل لإرسال بلاغ مطلوب")
      .setColor("Red");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("wanted_start")
        .setLabel(" تقديم مطلوب")
        .setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row],
    });
  }
};