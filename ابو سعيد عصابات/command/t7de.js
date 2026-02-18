const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "تحدي",
  run: async (client, message) => {
    const embed = new EmbedBuilder()
      .setTitle("**— لوحة التحكم بالتحديات .**")
      .setDescription("**🏴‍☠️ - يمكنك من الاسفل اضافة تحدي للعصابات . .**");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("challenge_btn").setLabel("تحدي").setStyle(ButtonStyle.Danger)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
};