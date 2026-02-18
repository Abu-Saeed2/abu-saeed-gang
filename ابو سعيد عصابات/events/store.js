const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const config = require("../config.json");
const GangXP = require("../models/GangXP");
const updateGangXPEmbed = require("../utils/updateGangXPEmbed");

const userAttempts = new Map();
const codeMap = new Map();
const robberyInfo = new Map();

function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

module.exports = async (client, interaction) => {
  const userId = interaction.user.id;

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "theft_select" &&
    interaction.values[0] === "store"
  ) {
    const modal = new ModalBuilder()
      .setCustomId("grocery_modal")
      .setTitle("معلومات السرقة");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("place_name")
          .setLabel("اسم المكان")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("hostages")
          .setLabel("عدد الرهائن")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "grocery_modal") {
    robberyInfo.set(userId, {
      place: interaction.fields.getTextInputValue("place_name"),
      hostages: interaction.fields.getTextInputValue("hostages"),
    });

    const embed = new EmbedBuilder()
      .setColor("DarkGrey")
      .setTitle("🛒 سرقة بقالة")
      .setDescription("**اضغط متابعة لبدء السرقة**");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("grocery_continue")
        .setLabel("متابعة")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("grocery_cancel")
        .setLabel("إلغاء")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === "grocery_cancel") {
    robberyInfo.delete(userId);
    return interaction.update({ content: "❌ تم الإلغاء", components: [], embeds: [], ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === "grocery_continue") {
    userAttempts.set(userId, { gt: 0, lt: 0 });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("arrow_gt").setLabel(">").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("arrow_lt").setLabel("<").setStyle(ButtonStyle.Primary)
    );

    return interaction.update({
      embeds: [new EmbedBuilder().setColor("Blue").setDescription("اضغط < مرتين و > مرة")],
      components: [row],
      ephemeral: true,
    });
  }

  if (interaction.isButton() && ["arrow_gt", "arrow_lt"].includes(interaction.customId)) {
    const state = userAttempts.get(userId);
    if (!state) return interaction.deferUpdate();

    interaction.customId === "arrow_gt" ? state.gt++ : state.lt++;

    if (state.gt > 2 || state.lt > 1 || (state.gt < 2 && state.lt === 1)) {
      userAttempts.delete(userId);
      robberyInfo.delete(userId);
      return interaction.update({ embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ فشل")], components: [], ephemeral: true });
    }

    if (state.gt === 2 && state.lt === 1) {
      userAttempts.delete(userId);
      return interaction.update({
        embeds: [new EmbedBuilder().setColor("Green").setDescription("✅ تم الفتح وحصلت على ربطة نقود")],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("rob_safe_grocery").setLabel("سرقة الخزنة").setStyle(ButtonStyle.Success)
        )],
        ephemeral: true,
      });
    }

    return interaction.deferUpdate();
  }

  if (interaction.isButton() && interaction.customId === "rob_safe_grocery") {
    const code = generateCode();
    codeMap.set(userId, { code, input: "" });

    await interaction.update({
      embeds: [new EmbedBuilder().setColor("Yellow").setDescription(`احفظ الكود: ${code}`)],
      components: [],
      ephemeral: true,
    });

    setTimeout(async () => {
      const rows = [
        new ActionRowBuilder().addComponents(...[1,2,3,4,5].map(n =>
          new ButtonBuilder().setCustomId(`digit_${n}`).setLabel(`${n}`).setStyle(ButtonStyle.Secondary)
        )),
        new ActionRowBuilder().addComponents(...[6,7,8,9,0].map(n =>
          new ButtonBuilder().setCustomId(`digit_${n}`).setLabel(`${n}`).setStyle(ButtonStyle.Secondary)
        ))
      ];

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor("Blue").setDescription("ادخل الكود")],
        components: rows,
      });
    }, 3000);
  }

  if (interaction.isButton() && interaction.customId.startsWith("digit_")) {
    const digit = interaction.customId.split("_")[1];
    const state = codeMap.get(userId);
    if (!state) return interaction.deferUpdate();

    state.input += digit;
    if (state.input.length < state.code.length) return interaction.deferUpdate();

    codeMap.delete(userId);

    if (state.input !== state.code) {
      robberyInfo.delete(userId);
      return interaction.update({ embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ كود خطأ")], components: [], ephemeral: true });
    }

    let gangName = null;
    for (const [gang, roleId] of Object.entries(config.gangRoles)) {
      if (interaction.member.roles.cache.has(roleId)) gangName = gang;
    }

    if (gangName) {
      await GangXP.findOneAndUpdate({ gang: gangName }, { $inc: { xp: 10 } }, { upsert: true });
      await updateGangXPEmbed(interaction.client);
    }

    const info = robberyInfo.get(userId);
    robberyInfo.delete(userId);

    const channel = await interaction.guild.channels.fetch(config.robberyChannel).catch(() => null);
    if (channel) {
      channel.send({
        embeds: [new EmbedBuilder()
          .setColor("Red")
          .setTitle("🚨 بلاغ سرقة بقالة")
          .addFields(
            { name: "📍 المكان", value: info.place, inline: true },
            { name: "👥 الرهائن", value: info.hostages, inline: true },
            { name: "👤 السارق", value: `<@${userId}>`, inline: true },
            { name: "🏴 العصابة", value: gangName ?? "بدون عصابة", inline: true }
          )
          .setTimestamp()
        ]
      });
    }

    return interaction.update({ embeds: [new EmbedBuilder().setColor("Green").setDescription("✅ نجحت السرقة ولقيت مفتاح محل الملابس")], components: [], ephemeral: true });
  }
};