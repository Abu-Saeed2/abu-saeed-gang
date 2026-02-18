const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const config = require("../config.json");
const GangXP = require("../models/GangXP");
const updateGangXPEmbed = require("../utils/updateGangXPEmbed");

const gameMap = new Map();
const robberyInfo = new Map();

function pickReds() {
  const arr = [];
  while (arr.length < 4) {
    const n = Math.floor(Math.random() * 12);
    if (!arr.includes(n)) arr.push(n);
  }
  return arr;
}

module.exports = async (client, interaction) => {
  const uid = interaction.user.id;

  /* ========== SELECT ========= */
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "theft_select" &&
    interaction.values[0] === "jewelry"
  ) {
    const modal = new ModalBuilder()
      .setCustomId("jewelry_modal")
      .setTitle("معلومات السرقة")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("place")
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

  /* ========== MODAL ========= */
  if (interaction.isModalSubmit() && interaction.customId === "jewelry_modal") {
    robberyInfo.set(uid, {
      place: interaction.fields.getTextInputValue("place"),
      hostages: interaction.fields.getTextInputValue("hostages"),
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Purple")
          .setTitle("💎 Jewelry Store Robbery"),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("jewel_start")
            .setLabel("استكمال")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("jewel_cancel")
            .setLabel("إلغاء")
            .setStyle(ButtonStyle.Danger)
        ),
      ],
      ephemeral: true,
    });
  }

  /* ========== CANCEL ========= */
  if (interaction.isButton() && interaction.customId === "jewel_cancel") {
    robberyInfo.delete(uid);
    gameMap.delete(uid);
    return interaction.update({
      content: "🚫 تم الإلغاء",
      embeds: [],
      components: [],
      ephemeral: true,
    });
  }

  /* ========== START ========= */
  if (interaction.isButton() && interaction.customId === "jewel_start") {
    gameMap.set(uid, { step: 1, clicks: [] });

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor("Yellow")
          .setDescription("⬆️ ⬆️ ⬇️"),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("j1_up").setLabel("⬆️").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("j1_down").setLabel("⬇️").setStyle(ButtonStyle.Primary)
        ),
      ],
      ephemeral: true,
    });
  }

  const state = gameMap.get(uid);
  if (!state) return;

  /* ========== STEP 1 ========= */
  if (state.step === 1 && ["j1_up", "j1_down"].includes(interaction.customId)) {
    state.clicks.push(interaction.customId);

    if (state.clicks.length < 3) {
      return interaction.deferUpdate();
    }

    const correct = ["j1_up", "j1_up", "j1_down"];
    if (JSON.stringify(state.clicks) !== JSON.stringify(correct)) {
      gameMap.delete(uid);
      robberyInfo.delete(uid);
      return interaction.update({
        embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ فشلت العملية")],
        components: [],
        ephemeral: true,
      });
    }

    state.step = 2;
    state.reds = pickReds();
    state.clicks = [];

    const buttons = Array.from({ length: 12 }, (_, i) =>
      new ButtonBuilder()
        .setCustomId(`jr_${i}`)
        .setLabel("•")
        .setStyle(state.reds.includes(i) ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await interaction.update({
      embeds: [new EmbedBuilder().setColor("Orange").setDescription("تذكر الأزرار")],
      components: [
        new ActionRowBuilder().addComponents(buttons.slice(0,4)),
        new ActionRowBuilder().addComponents(buttons.slice(4,8)),
        new ActionRowBuilder().addComponents(buttons.slice(8,12)),
      ],
      ephemeral: true,
    });

    setTimeout(async () => {
      const enabled = buttons.map(b =>
        ButtonBuilder.from(b)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(false)
      );

      state.step = 3;

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor("Aqua").setDescription("اضغط نفس الأزرار")],
        components: [
          new ActionRowBuilder().addComponents(enabled.slice(0,4)),
          new ActionRowBuilder().addComponents(enabled.slice(4,8)),
          new ActionRowBuilder().addComponents(enabled.slice(8,12)),
        ],
      });
    }, 5000);

    return;
  }

  /* ========== STEP 2 ========= */
  if (state.step === 3 && interaction.customId.startsWith("jr_")) {
    const idx = parseInt(interaction.customId.split("_")[1]);

    if (!state.clicks.includes(idx)) state.clicks.push(idx);

    if (state.clicks.length < state.reds.length) {
      return interaction.deferUpdate();
    }

    const ok = state.reds.every(r => state.clicks.includes(r));
    if (!ok) {
      gameMap.delete(uid);
      robberyInfo.delete(uid);
      return interaction.update({
        embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ فشلت العملية")],
        components: [],
        ephemeral: true,
      });
    }

    state.step = 4;
    state.clicks = [];

    return interaction.update({
      embeds: [new EmbedBuilder().setColor("Green").setDescription("💎 تم كسر الخزنة")],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("jewel_glass")
            .setLabel("كسر الزجاج")
            .setStyle(ButtonStyle.Danger)
        ),
      ],
      ephemeral: true,
    });
  }

  /* ========== STEP 3 ========= */
  if (state.step === 4 && interaction.customId === "jewel_glass") {
    state.clicks = [];

    return interaction.update({
      embeds: [new EmbedBuilder().setColor("Blue").setDescription("🔨 ⚒️ ⚒️")],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("jg_1").setLabel("🔨").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("jg_2").setLabel("⚒️").setStyle(ButtonStyle.Primary)
        ),
      ],
      ephemeral: true,
    });
  }

  if (state.step === 4 && interaction.customId.startsWith("jg_")) {
    state.clicks.push(interaction.customId);

    if (state.clicks.length < 3) {
      return interaction.deferUpdate();
    }

    const correct = ["jg_1", "jg_2", "jg_2"];
    if (JSON.stringify(state.clicks) !== JSON.stringify(correct)) {
      gameMap.delete(uid);
      robberyInfo.delete(uid);
      return interaction.update({
        embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ فشلت العملية")],
        components: [],
        ephemeral: true,
      });
    }

    /* ===== XP SYSTEM (ADDED ONLY) ===== */
    let gangName = null;
    for (const [gang, roleId] of Object.entries(config.gangRoles)) {
      if (interaction.member.roles.cache.has(roleId)) {
        gangName = gang;
        break;
      }
    }

    if (gangName) {
      await GangXP.findOneAndUpdate(
        { gang: gangName },
        { $inc: { xp: 40 } },
        { upsert: true }
      );
      await updateGangXPEmbed(interaction.client);
    }
    /* ===== END XP ===== */
    /* ===== ROBBERY REPORT (ADDED ONLY) ===== */
    const info = robberyInfo.get(uid);

    const channel = await interaction.guild.channels
      .fetch(config.robberyChannel)
      .catch(() => null);

    if (channel && info) {
      channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("🚨 بلاغ سرقة مجوهرات")
            .addFields(
              { name: "📍 المكان", value: info.place, inline: true },
              { name: "👥 الرهائن", value: info.hostages, inline: true },
              { name: "👤 السارق", value: `<@${uid}>`, inline: true },
              { name: "🏴 العصابة", value: gangName ?? "بدون عصابة", inline: true }
            )
            .setTimestamp(),
        ],
      });
    }
    /* ===== END REPORT ===== */
      
    gameMap.delete(uid);
    robberyInfo.delete(uid);

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor("Gold")
          .setTitle("✅ تمت سرقة المجوهرات بنجاح"),
      ],
      components: [],
      ephemeral: true,
    });
  }
};

