const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "setup-gang-login",
  run: async (client, message) => {
    const embed = new EmbedBuilder()
      .setTitle("🕒 نظام تسجيل العصابات")
      .setDescription("استخدم الأزرار بالأسفل")
      .setColor("#2f3136");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("login_in")
        .setLabel("دخول")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("login_out")
        .setLabel("خروج")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("login_view")
        .setLabel("عرض العصابات")
        .setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};