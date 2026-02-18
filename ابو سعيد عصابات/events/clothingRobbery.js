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

function randReward() {
  const list = ["Luxury Clothes", "Designer Shoes", "Cash Roll", "Gift Bag"];
  return list[Math.floor(Math.random() * list.length)];
}

module.exports = async (client, interaction) => {
  const uid = interaction.user.id;

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "theft_select" &&
    interaction.values[0] === "clothing"
  ) {
    const modal = new ModalBuilder()
      .setCustomId("clothing_modal")
      .setTitle("معلومات السرقة");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("place")
          .setLabel("اسم محل الملابس")
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

  if (interaction.isModalSubmit() && interaction.customId === "clothing_modal") {
    robberyInfo.set(uid, {
      place: interaction.fields.getTextInputValue("place"),
      hostages: interaction.fields.getTextInputValue("hostages"),
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("clothing_start").setLabel("بدء السرقة").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("clothing_cancel").setLabel("إلغاء").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      embeds: [new EmbedBuilder().setColor("DarkBlue").setTitle("🧥 Clothing Store Robbery")],
      components: [row],
      ephemeral: true,
    });
  }

  if (interaction.isButton() && interaction.customId === "clothing_cancel") {
    robberyInfo.delete(uid);
    return interaction.update({ content: "🚫 تم الإلغاء.", embeds: [], components: [], ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === "clothing_start") {
    gameMap.set(uid, { step: 1, clicks: [] });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("c1_left").setLabel("⬅️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("c1_up").setLabel("⬆️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("c1_right").setLabel("➡️").setStyle(ButtonStyle.Primary)
    );

    return interaction.update({
      embeds: [new EmbedBuilder().setColor("Yellow").setDescription("⬆️ ➡️ ⬅️")],
      components: [row],
      ephemeral: true,
    });
  }

  const state = gameMap.get(uid);
  if (!state) return;

  if (state.step === 1 && interaction.customId.startsWith("c1_")) {
    state.clicks.push(interaction.customId);

    if (state.clicks.length === 3) {
      state.step = 2;
      state.clicks = [];

      const buttons = Array.from({ length: 6 }, (_, i) =>
        new ButtonBuilder()
          .setCustomId(`box_${i}`)
          .setLabel("📦")
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({
        embeds: [new EmbedBuilder().setColor("Aqua").setDescription("اختر أي صندوقين بسرعة")],
        components: [
          new ActionRowBuilder().addComponents(buttons.slice(0,3)),
          new ActionRowBuilder().addComponents(buttons.slice(3,6)),
        ],
        ephemeral: true,
      });
    }
    return interaction.deferUpdate();
  }

  if (state.step === 2 && interaction.customId.startsWith("box_")) {
    const idx = parseInt(interaction.customId.split("_")[1]);
    if (!state.clicks.includes(idx)) state.clicks.push(idx);

    if (state.clicks.length === 2) {
      let gangName = null;
      for (const [gang, roleId] of Object.entries(config.gangRoles)) {
        if (interaction.member.roles.cache.has(roleId)) gangName = gang;
      }

      if (gangName) {
        await GangXP.findOneAndUpdate(
          { gang: gangName },
          { $inc: { xp: 20 } },
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
            .setTitle("🚨 بلاغ سرقة محل ملابس")
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
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("✅ تمت السرقة بنجاح")
            .setDescription(`🎁 الغنيمة: **${randReward()}**`)
        ],
        components: [],
        ephemeral: true,
      });
    }
    return interaction.deferUpdate();
  }
};