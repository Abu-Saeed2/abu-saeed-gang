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

const gameMap = new Map();
const robberyInfo = new Map();

function randItem() {
  const list = ["Car dealer Card","Knife","Baseball Bat","Armor","Cash roll","Empty"];
  return list[Math.floor(Math.random() * list.length)];
}

function pickReds() {
  const arr = [];
  while (arr.length < 5) {
    const idx = Math.floor(Math.random() * 15);
    if (!arr.includes(idx)) arr.push(idx);
  }
  return arr;
}

module.exports = async (client, interaction) => {
  const uid = interaction.user.id;

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "theft_select" &&
    interaction.values[0] === "weapon"
  ) {
    const modal = new ModalBuilder()
      .setCustomId("weapon_modal")
      .setTitle("معلومات السرقة");

    modal.addComponents(
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

  if (interaction.isModalSubmit() && interaction.customId === "weapon_modal") {
    robberyInfo.set(uid, {
      place: interaction.fields.getTextInputValue("place"),
      hostages: interaction.fields.getTextInputValue("hostages"),
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("weapon_start").setLabel("استكمال").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("weapon_cancel").setLabel("إلغاء").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      embeds: [new EmbedBuilder().setColor("DarkRed").setTitle("🔫 Weapon Store Robbery")],
      components: [row],
      ephemeral: true,
    });
  }

  if (interaction.isButton() && interaction.customId === "weapon_cancel") {
    robberyInfo.delete(uid);
    return interaction.update({ content: "🚫 تم الإلغاء.", embeds: [], components: [], ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === "weapon_start") {
    gameMap.set(uid, { step: 1, clicks: [] });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("w1_2").setLabel("⬅").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("w1_3").setLabel("➡️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("w1_4").setLabel("⬆️").setStyle(ButtonStyle.Primary)
    );

    return interaction.update({
      embeds: [new EmbedBuilder().setColor("Yellow").setDescription("⬆️ ⬆️ ➡️ ⬅")],
      components: [row],
      ephemeral: true,
    });
  }

  const state = gameMap.get(uid);
  if (!state) return;

  if (state.step === 1 && ["w1_2","w1_3","w1_4"].includes(interaction.customId)) {
    state.clicks.push(interaction.customId);

    if (state.clicks.length === 4) {
      const correct = ["w1_4","w1_4","w1_3","w1_2"];
      if (JSON.stringify(state.clicks) !== JSON.stringify(correct)) {
        gameMap.delete(uid);
        robberyInfo.delete(uid);
        return interaction.update({ embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ فشل")], components: [], ephemeral: true });
      }

      state.step = 2;
      state.clicks = [];

      return interaction.update({
        embeds: [new EmbedBuilder().setColor("Green").setDescription(`🎁 ${randItem()}`)],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("weapon_cashier").setLabel("Cashier Theft").setStyle(ButtonStyle.Secondary)
        )],
        ephemeral: true,
      });
    }
    return interaction.deferUpdate();
  }

  if (state.step === 2 && interaction.customId === "weapon_cashier") {
    state.step = 3;
    state.reds = pickReds();
    state.clicks = [];

    const buttons = Array.from({ length: 15 }, (_, i) =>
      new ButtonBuilder()
        .setCustomId(`wc_${i}`)
        .setLabel("•")
        .setStyle(state.reds.includes(i) ? ButtonStyle.Danger : ButtonStyle.Secondary)
    );

    const rows = [
      new ActionRowBuilder().addComponents(buttons.slice(0,5)),
      new ActionRowBuilder().addComponents(buttons.slice(5,10)),
      new ActionRowBuilder().addComponents(buttons.slice(10,15)),
    ];

    await interaction.update({
      embeds: [new EmbedBuilder().setColor("Orange").setDescription("تذكر الأزرار")],
      components: rows,
      ephemeral: true,
    });

    setTimeout(async () => {
      const hidden = buttons.map(b =>
        ButtonBuilder.from(b).setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor("Aqua").setDescription("اضغط نفس الأزرار")],
        components: [
          new ActionRowBuilder().addComponents(hidden.slice(0,5)),
          new ActionRowBuilder().addComponents(hidden.slice(5,10)),
          new ActionRowBuilder().addComponents(hidden.slice(10,15)),
        ],
      });
    }, 5000);
    return;
  }

  if (state.step === 3 && interaction.customId.startsWith("wc_")) {
    const idx = parseInt(interaction.customId.split("_")[1]);
    if (!state.clicks.includes(idx)) state.clicks.push(idx);

    if (state.clicks.length === state.reds.length) {
      const ok = state.reds.every(r => state.clicks.includes(r));
      if (!ok) {
        gameMap.delete(uid);
        robberyInfo.delete(uid);
        return interaction.update({ embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ فشل")], components: [], ephemeral: true });
      }

      state.step = 4;
      state.clicks = [];

      return interaction.update({
        embeds: [new EmbedBuilder().setColor("Green").setDescription(`🎁 ${randItem()}`)],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("weapon_glass").setLabel("Broken Glass").setStyle(ButtonStyle.Danger)
        )],
        ephemeral: true,
      });
    }
    return interaction.deferUpdate();
  }

  if (state.step === 4 && interaction.customId === "weapon_glass") {
    state.clicks = [];

    return interaction.update({
      embeds: [new EmbedBuilder().setColor("Blue").setDescription("⚒️ ⚒️🔨")],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("wg_1").setLabel("🔨").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("wg_2").setLabel("⚒️").setStyle(ButtonStyle.Primary)
      )],
      ephemeral: true,
    });
  }

  if (state.step === 4 && interaction.customId.startsWith("wg_")) {
    state.clicks.push(interaction.customId);

    if (state.clicks.length === 3) {
      const correct = ["wg_1","wg_2","wg_2"];
      if (JSON.stringify(state.clicks) !== JSON.stringify(correct)) {
        gameMap.delete(uid);
        robberyInfo.delete(uid);
        return interaction.update({ embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ فشل")], components: [], ephemeral: true });
      }

      let gangName = null;
      for (const [gang, roleId] of Object.entries(config.gangRoles)) {
        if (interaction.member.roles.cache.has(roleId)) gangName = gang;
      }

      if (gangName) {
        await GangXP.findOneAndUpdate(
          { gang: gangName },
          { $inc: { xp: 40 } },
          { upsert: true }
        );
        await updateGangXPEmbed(interaction.client);
      }

      const info = robberyInfo.get(uid);
      robberyInfo.delete(uid);

      const channel = await interaction.guild.channels.fetch(config.robberyChannel).catch(() => null);
      if (channel) {
        channel.send({
          embeds: [new EmbedBuilder()
            .setColor("Red")
            .setTitle("🚨 بلاغ سرقة Weapon Store")
            .addFields(
              { name: "📍 المكان", value: info.place, inline: true },
              { name: "👥 الرهائن", value: info.hostages, inline: true },
              { name: "👤 السارق", value: `<@${uid}>`, inline: true },
              { name: "🏴 العصابة", value: gangName ?? "بدون عصابة", inline: true }
            )
            .setTimestamp()
          ]
        });
      }

      gameMap.delete(uid);
      return interaction.update({
        embeds: [new EmbedBuilder().setColor("Gold").setDescription("✅ انتهت السرقة بنجاح")],
        components: [],
        ephemeral: true,
      });
    }
    return interaction.deferUpdate();
  }
};