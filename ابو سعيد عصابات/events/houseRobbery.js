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

const houseAttempts = new Map();
const codeMap = new Map();
const robberyInfo = new Map();

function generateCode() {
  return ["R10526", "007L17", "HHR10110"][Math.floor(Math.random() * 3)];
}

function mix(code) {
  const chars = [...new Set(code.split(""))];
  const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  while (chars.length < 9) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    if (!chars.includes(c)) chars.push(c);
  }
  return chars.sort(() => Math.random() - 0.5);
}

module.exports = async (client, interaction) => {
  const userId = interaction.user.id;

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "theft_select" &&
    interaction.values[0] === "house"
  ) {
    const modal = new ModalBuilder()
      .setCustomId("house_modal")
      .setTitle("معلومات السرقة");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("place_name").setLabel("اسم المكان").setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("hostages").setLabel("عدد الرهائن").setStyle(TextInputStyle.Short).setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "house_modal") {
    robberyInfo.set(userId, {
      place: interaction.fields.getTextInputValue("place_name"),
      hostages: interaction.fields.getTextInputValue("hostages"),
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("house_continue").setLabel("متابعة").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("house_cancel").setLabel("إلغاء").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      embeds: [new EmbedBuilder().setColor("DarkGrey").setTitle("🏠 سرقة منزل")],
      components: [row],
      ephemeral: true,
    });
  }

  if (interaction.isButton() && interaction.customId === "house_cancel") {
    robberyInfo.delete(userId);
    return interaction.update({ content: "❌ تم الإلغاء", components: [], embeds: [], ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === "house_continue") {
    houseAttempts.set(userId, { lt: 0, gt: 0 });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("house_lt").setLabel("<").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("house_gt").setLabel(">").setStyle(ButtonStyle.Primary)
    );

    return interaction.update({
      embeds: [new EmbedBuilder().setColor("Blue").setDescription("اضغط < مرتين و > ومرة")],
      components: [row],
      ephemeral: true,
    });
  }

  if (interaction.isButton() && ["house_lt", "house_gt"].includes(interaction.customId)) {
    const s = houseAttempts.get(userId);
    if (!s) return interaction.deferUpdate();

    interaction.customId === "house_lt" ? s.lt++ : s.gt++;

    if (s.lt > 1 || s.gt > 2 || (s.lt === 1 && s.gt < 2)) {
      houseAttempts.delete(userId);
      robberyInfo.delete(userId);
      return interaction.update({ embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ فشل")], components: [], ephemeral: true });
    }

    if (s.lt === 1 && s.gt === 2) {
      houseAttempts.delete(userId);
      return interaction.update({
        embeds: [new EmbedBuilder().setColor("Green").setDescription("✅ دخلت المنزل ولقيت قلادة ذهب")],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("house_safe").setLabel("سرقة الخزنة").setStyle(ButtonStyle.Success)
        )],
        ephemeral: true,
      });
    }

    return interaction.deferUpdate();
  }

  if (interaction.isButton() && interaction.customId === "house_safe") {
    const code = generateCode();
    codeMap.set(userId, { code, input: "" });

    await interaction.update({
      embeds: [new EmbedBuilder().setColor("Yellow").setDescription(`احفظ الكود: ${code}`)],
      components: [],
      ephemeral: true,
    });

    setTimeout(async () => {
      const chars = mix(code);
      const rows = [
        new ActionRowBuilder().addComponents(...chars.slice(0,5).map(c =>
          new ButtonBuilder().setCustomId(`house_code_${c}`).setLabel(c).setStyle(ButtonStyle.Secondary)
        )),
        new ActionRowBuilder().addComponents(...chars.slice(5).map(c =>
          new ButtonBuilder().setCustomId(`house_code_${c}`).setLabel(c).setStyle(ButtonStyle.Secondary)
        ))
      ];

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor("Blue").setDescription("ادخل الكود")],
        components: rows,
      });
    }, 3000);
  }

  if (interaction.isButton() && interaction.customId.startsWith("house_code_")) {
    const char = interaction.customId.replace("house_code_", "");
    const state = codeMap.get(userId);
    if (!state) return interaction.deferUpdate();

    state.input += char;
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
      await GangXP.findOneAndUpdate({ gang: gangName }, { $inc: { xp: 25 } }, { upsert: true });
      await updateGangXPEmbed(interaction.client);
    }

    const info = robberyInfo.get(userId);
    robberyInfo.delete(userId);

    const channel = await interaction.guild.channels.fetch(config.robberyChannel).catch(() => null);
    if (channel) {
      channel.send({
        embeds: [new EmbedBuilder()
          .setColor("Red")
          .setTitle("🚨 بلاغ سرقة منزل")
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

    return interaction.update({ embeds: [new EmbedBuilder().setColor("Green").setDescription("✅ نجحت السرقة وحصلت على مفتاح محل الاسلحة")], components: [], ephemeral: true });
  }
};