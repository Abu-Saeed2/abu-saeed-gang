const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = async (client, interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId !== "wanted_start") return;

  await interaction.reply({
    content: "📩 تم إرسال رسالة لك في الخاص",
    ephemeral: true,
  });

  client.wantedTemp.set(interaction.user.id, {
    step: 1,
    text: null,
  });

  await interaction.user.send(
    "✍️ اكتب وصف المطلوب (الاسم / السبب / أي تفاصيل)"
  );
};