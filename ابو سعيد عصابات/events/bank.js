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

const robberyInfo = new Map();
const gameMap = new Map();
const codeMap = new Map();

/* ===== HELPERS (منسوخة) ===== */
function pickReds() {
  const arr = [];
  while (arr.length < 4) {
    const n = Math.floor(Math.random() * 12);
    if (!arr.includes(n)) arr.push(n);
  }
  return arr;
}

function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

module.exports = async (client, interaction) => {
  const uid = interaction.user.id;

  /* ================= SELECT ================= */
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "theft_select" &&
    interaction.values[0] === "polito"
  ) {
    const modal = new ModalBuilder()
      .setCustomId("polito_modal")
      .setTitle("معلومات سرقة بنك بوليتو")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("place")
            .setLabel("اسم البنك")
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

  /* ================= MODAL ================= */
  if (interaction.isModalSubmit() && interaction.customId === "polito_modal") {
    robberyInfo.set(uid, {
      place: interaction.fields.getTextInputValue("place"),
      hostages: interaction.fields.getTextInputValue("hostages"),
    });

    gameMap.set(uid, { step: 1, clicks: [] });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("DarkBlue")
          .setTitle("🏦 Bank Polito Heist"),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("polito_start")
            .setLabel("استكمال")
            .setStyle(ButtonStyle.Success)
        ),
      ],
      ephemeral: true,
    });
  }

  const state = gameMap.get(uid);
  if (!state) return;

  /* ==================================================
     STEP 1 — ألوان (نسخ من المجوهرات)
  ================================================== */
  if (interaction.isButton() && interaction.customId === "polito_start") {
    state.step = 1;
    state.reds = pickReds();
    state.clicks = [];

    const buttons = Array.from({ length: 12 }, (_, i) =>
      new ButtonBuilder()
        .setCustomId(`p1_${i}`)
        .setLabel("•")
        .setStyle(state.reds.includes(i) ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await interaction.update({
      embeds: [new EmbedBuilder().setColor("Orange").setDescription("احفظ الأزرار")],
      components: [
        new ActionRowBuilder().addComponents(buttons.slice(0,4)),
        new ActionRowBuilder().addComponents(buttons.slice(4,8)),
        new ActionRowBuilder().addComponents(buttons.slice(8,12)),
      ],
      ephemeral: true,
    });

    setTimeout(async () => {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor("Aqua").setDescription("اضغط نفس الأزرار")],
        components: [
          new ActionRowBuilder().addComponents(buttons.slice(0,4).map(b => ButtonBuilder.from(b).setDisabled(false).setStyle(ButtonStyle.Secondary))),
          new ActionRowBuilder().addComponents(buttons.slice(4,8).map(b => ButtonBuilder.from(b).setDisabled(false).setStyle(ButtonStyle.Secondary))),
          new ActionRowBuilder().addComponents(buttons.slice(8,12).map(b => ButtonBuilder.from(b).setDisabled(false).setStyle(ButtonStyle.Secondary))),
        ],
      });
    }, 5000);
  }

  if (state.step === 1 && interaction.customId.startsWith("p1_")) {
    const idx = parseInt(interaction.customId.split("_")[1]);
    if (!state.clicks.includes(idx)) state.clicks.push(idx);

    if (state.clicks.length < state.reds.length)
      return interaction.deferUpdate();

    if (!state.reds.every(r => state.clicks.includes(r))) {
      gameMap.delete(uid);
      robberyInfo.delete(uid);
      return interaction.update({
        embeds:[new EmbedBuilder().setColor("Red").setDescription("❌ فشلت العملية")],
        components:[],
        ephemeral:true,
      });
    }

    /* ==================================================
       STEP 2 — أرقام (نسخ من البقالة)
    ================================================== */
    state.step = 2;
    const code = generateCode();
    codeMap.set(uid, { code, input: "" });

    await interaction.update({
      embeds:[new EmbedBuilder().setColor("Yellow").setDescription(`احفظ الكود: ${code}`)],
      components:[],
      ephemeral:true,
    });

    setTimeout(async () => {
      const rows = [
        new ActionRowBuilder().addComponents(...[1,2,3,4,5].map(n =>
          new ButtonBuilder().setCustomId(`p2_${n}`).setLabel(`${n}`).setStyle(ButtonStyle.Secondary)
        )),
        new ActionRowBuilder().addComponents(...[6,7,8,9,0].map(n =>
          new ButtonBuilder().setCustomId(`p2_${n}`).setLabel(`${n}`).setStyle(ButtonStyle.Secondary)
        )),
      ];

      await interaction.editReply({
        embeds:[new EmbedBuilder().setColor("Blue").setDescription("ادخل الكود")],
        components: rows,
      });
    },3000);
  }

  if (state.step === 2 && interaction.customId.startsWith("p2_")) {
    const digit = interaction.customId.split("_")[1];
    const s = codeMap.get(uid);
    if (!s) return;

    s.input += digit;
    if (s.input.length < s.code.length)
      return interaction.deferUpdate();

    if (s.input !== s.code) {
      gameMap.delete(uid);
      robberyInfo.delete(uid);
      return interaction.update({
        embeds:[new EmbedBuilder().setColor("Red").setDescription("❌ كود خاطئ")],
        components:[],
        ephemeral:true,
      });
    }

    codeMap.delete(uid);

    /* ==================================================
       STEP 3 — ألوان (نسخ ثاني حرفي)
    ================================================== */
    state.step = 3;
    state.reds = pickReds();
    state.clicks = [];

    const buttons = Array.from({ length: 12 }, (_, i) =>
      new ButtonBuilder()
        .setCustomId(`p3_${i}`)
        .setLabel("•")
        .setStyle(state.reds.includes(i) ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await interaction.update({
      embeds:[new EmbedBuilder().setColor("Orange").setDescription("احفظ الأزرار")],
      components:[
        new ActionRowBuilder().addComponents(buttons.slice(0,4)),
        new ActionRowBuilder().addComponents(buttons.slice(4,8)),
        new ActionRowBuilder().addComponents(buttons.slice(8,12)),
      ],
      ephemeral:true,
    });

    setTimeout(async () => {
      await interaction.editReply({
        embeds:[new EmbedBuilder().setColor("Aqua").setDescription("اضغط نفس الأزرار")],
        components:[
          new ActionRowBuilder().addComponents(buttons.slice(0,4).map(b => ButtonBuilder.from(b).setDisabled(false).setStyle(ButtonStyle.Secondary))),
          new ActionRowBuilder().addComponents(buttons.slice(4,8).map(b => ButtonBuilder.from(b).setDisabled(false).setStyle(ButtonStyle.Secondary))),
          new ActionRowBuilder().addComponents(buttons.slice(8,12).map(b => ButtonBuilder.from(b).setDisabled(false).setStyle(ButtonStyle.Secondary))),
        ],
      });
    },5000);
  }

  if (state.step === 3 && interaction.customId.startsWith("p3_")) {
    const idx = parseInt(interaction.customId.split("_")[1]);
    if (!state.clicks.includes(idx)) state.clicks.push(idx);

    if (state.clicks.length < state.reds.length)
      return interaction.deferUpdate();

    if (!state.reds.every(r => state.clicks.includes(r))) {
      gameMap.delete(uid);
      robberyInfo.delete(uid);
      return interaction.update({
        embeds:[new EmbedBuilder().setColor("Red").setDescription("❌ فشلت العملية")],
        components:[],
        ephemeral:true,
      });
    }

    /* ==================================================
       STEP 4 — أرقام (نسخ ثاني حرفي)
    ================================================== */
    state.step = 4;
    const code = generateCode();
    codeMap.set(uid, { code, input: "" });

    await interaction.update({
      embeds:[new EmbedBuilder().setColor("Yellow").setDescription(`احفظ الكود: ${code}`)],
      components:[],
      ephemeral:true,
    });

    setTimeout(async () => {
      const rows = [
        new ActionRowBuilder().addComponents(...[1,2,3,4,5].map(n =>
          new ButtonBuilder().setCustomId(`p4_${n}`).setLabel(`${n}`).setStyle(ButtonStyle.Secondary)
        )),
        new ActionRowBuilder().addComponents(...[6,7,8,9,0].map(n =>
          new ButtonBuilder().setCustomId(`p4_${n}`).setLabel(`${n}`).setStyle(ButtonStyle.Secondary)
        )),
      ];

      await interaction.editReply({
        embeds:[new EmbedBuilder().setColor("Blue").setDescription("ادخل الكود")],
        components: rows,
      });
    },3000);
  }

  if (state.step === 4 && interaction.customId.startsWith("p4_")) {
    const digit = interaction.customId.split("_")[1];
    const s = codeMap.get(uid);
    if (!s) return;

    s.input += digit;
    if (s.input.length < s.code.length)
      return interaction.deferUpdate();

    if (s.input !== s.code) {
      gameMap.delete(uid);
      robberyInfo.delete(uid);
      return interaction.update({
        embeds:[new EmbedBuilder().setColor("Red").setDescription("❌ كود خاطئ")],
        components:[],
        ephemeral:true,
      });
    }

    /* ================= SUCCESS ================= */
    let gangName = null;
    for (const [gang, roleId] of Object.entries(config.gangRoles))
      if (interaction.member.roles.cache.has(roleId)) gangName = gang;

    if (gangName) {
      await GangXP.findOneAndUpdate(
        { gang: gangName },
        { $inc: { xp: 80 } },
        { upsert: true }
      );
      await updateGangXPEmbed(interaction.client);
    }

    const info = robberyInfo.get(uid);
    const channel = await interaction.guild.channels
      .fetch(config.robberyChannel)
      .catch(() => null);

    if (channel && info) {
      channel.send({
        embeds:[
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("🚨 بلاغ سرقة بنك بوليتو")
            .addFields(
              { name:"📍 المكان", value:info.place, inline:true },
              { name:"👥 الرهائن", value:info.hostages, inline:true },
              { name:"👤 السارق", value:`<@${uid}>`, inline:true },
              { name:"🏴 العصابة", value:gangName ?? "بدون عصابة", inline:true }
            )
            .setTimestamp()
        ]
      });
    }

    gameMap.delete(uid);
    robberyInfo.delete(uid);
    codeMap.delete(uid);

    return interaction.update({
      embeds:[
        new EmbedBuilder()
          .setColor("Gold")
          .setTitle("✅ تمت سرقة بنك بوليتو بنجاح"),
      ],
      components:[],
      ephemeral:true,
    });
  }
};