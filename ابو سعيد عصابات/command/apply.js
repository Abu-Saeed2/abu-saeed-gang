const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "apply",
  run: async (client, message) => {
    const embed = new EmbedBuilder()
      .setTitle("**🏴‍☠️ - التقديم على العصابات **")
      .setDescription("**📃 - اضغط بالزر بالاسفل وسيظهر لك نموذج تقديم نتمنى منك تعبئتها بشكل جدّي لزيادة نسبه قبولك بين العصابات وبعد ارسال النموذج سيظهر لك اختيار متعدد بين العصابات اختر العصابه الذي تريد تقديمك يوصل لها **")
    .setColor("#a30000")
    .setImage("https://cdn.discordapp.com/attachments/1291727340837277767/1419283034028638238/IMG_2802.jpg?ex=68d28354&is=68d131d4&hm=494cffaeb56598ca40f8047aee86366428f60f09695d9b91ce81056ffe57b4f1&")

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("apply_start")
        .setLabel("تقديم")
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
};