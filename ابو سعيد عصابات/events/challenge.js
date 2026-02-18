const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
} = require("discord.js");

const config = require("../config.json");

module.exports = async (client, interaction) => {

  if (interaction.isButton() && interaction.customId === "challenge_btn") {

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ هذا الزر مخصص للإدمنستريتر فقط.",
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("challenge_modal")
      .setTitle("🏆 إنشاء تحدي");

    const challengeName = new TextInputBuilder()
      .setCustomId("challenge_name")
      .setLabel("اسم التحدي")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const challengeTime = new TextInputBuilder()
      .setCustomId("challenge_time")
      .setLabel("وقت التحدي")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const challengeOwner = new TextInputBuilder()
      .setCustomId("challenge_owner")
      .setLabel("المسؤول عن التحدي")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(challengeName),
      new ActionRowBuilder().addComponents(challengeTime),
      new ActionRowBuilder().addComponents(challengeOwner)
    );

    return interaction.showModal(modal);
  }

  
  if (interaction.isModalSubmit() && interaction.customId === "challenge_modal") {

   
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ غير مصرح لك.",
        ephemeral: true,
      });
    }

    const name = interaction.fields.getTextInputValue("challenge_name");
    const time = interaction.fields.getTextInputValue("challenge_time");
    const owner = interaction.fields.getTextInputValue("challenge_owner");

    const embed = new EmbedBuilder()
      .setTitle("تحدي جديد")
      .setColor("Red")
      .addFields(
        { name: "التحدي", value: name, inline: false },
        { name: "وقت التحدي", value: time, inline: false },
        { name: " المسؤول", value: owner, inline: false }
      )
      .setFooter({ text: `بواسطة ${interaction.user.username}` })
      .setTimestamp();

    const channel = await client.channels
      .fetch(config.challengeChannel)
      .catch(() => null);

    if (!channel) {
      return interaction.reply({
        content: "❌ روم التحديات غير موجود.",
        ephemeral: true,
      });
    }

    await channel.send({ embeds: [embed] });

    return interaction.reply({
      content: "✅ تم نشر التحدي بنجاح.",
      ephemeral: true,
    });
  }
};