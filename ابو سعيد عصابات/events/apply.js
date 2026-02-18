const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js");
const config = require("../config.json");

module.exports = async (client, interaction) => {
  // زر تقديم
  if (interaction.isButton() && interaction.customId === "apply_start") {
    const modal = new ModalBuilder()
      .setCustomId("apply_modal")
      .setTitle("تقديم العصابة");

    const nameInput = new TextInputBuilder()
      .setCustomId("apply_name")
      .setLabel("اسمك")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const ageInput = new TextInputBuilder()
      .setCustomId("apply_age")
      .setLabel("عمرك")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const crimeInput = new TextInputBuilder()
      .setCustomId("apply_crimes")
      .setLabel("أعمالك الإجرامية")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(ageInput),
      new ActionRowBuilder().addComponents(crimeInput)
    );

    return interaction.showModal(modal);
  }

  // بعد ارسال المودال
  if (interaction.isModalSubmit() && interaction.customId === "apply_modal") {
    const name = interaction.fields.getTextInputValue("apply_name");
    const age = interaction.fields.getTextInputValue("apply_age");
    const crimes = interaction.fields.getTextInputValue("apply_crimes");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("apply_selectGang")
      .setPlaceholder("اختر العصابة")
      .addOptions([
  { label: "Trickster", value: "trickster" },
  { label: "Bloods", value: "bloods" },
  { label: "Scrap", value: "scrap" },
  { label: "Coza", value: "Coza" },
  { label: "Old School", value: "oldschool" },
  { label: "Eleven", value: "eleven" }
]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: "اختر العصابة التي تريد التقديم عليها:",
      components: [row],
      ephemeral: true,
    });

    // نخزن بيانات التقديم بالذاكرة (اختصار)
    client.applyCache = client.applyCache || {};
    client.applyCache[interaction.user.id] = { name, age, crimes };
  }

  // اختيار العصابة
  if (interaction.isStringSelectMenu() && interaction.customId === "apply_selectGang") {
    const gang = interaction.values[0];
    const data = client.applyCache?.[interaction.user.id];
    if (!data) return interaction.reply({ content: "لم يتم العثور على بيانات التقديم.", ephemeral: true });

    const gangRoleId = config.gangRoles[gang];
    const gangChannelId = config.gangChannels[gang];
    const mainGangRole = config.mainGangRole;

    // تحقق لو الرتبة فل (9 أعضاء)
    const gangRole = interaction.guild.roles.cache.get(gangRoleId);
    if (gangRole && gangRole.members.size >= 40) {
      return interaction.reply({ content: "❌ تم رفض التقديم: العصابة ممتلئة (40 أعضاء).", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("📥 تقديم عصابة")
      .setColor("Blue")
      .addFields(
        { name: "المتقدّم", value: `${interaction.user}`, inline: false },
        { name: "الاسم", value: data.name, inline: true },
        { name: "العمر", value: data.age, inline: true },
        { name: "الأعمال الإجرامية", value: data.crimes, inline: false }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`accept_apply_${interaction.user.id}_${gang}`).setLabel("قبول").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`reject_apply_${interaction.user.id}_${gang}`).setLabel("رفض").setStyle(ButtonStyle.Danger)
    );

    const channel = interaction.guild.channels.cache.get(gangChannelId);
    if (!channel) return interaction.reply({ content: "لم أجد روم العصابة.", ephemeral: true });

    await channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: "✅ تم إرسال تقديمك للإدارة.", ephemeral: true });
  }

  // قبول أو رفض
  if (interaction.isButton() && (interaction.customId.startsWith("accept_apply") || interaction.customId.startsWith("reject_apply"))) {
    const [action, , userId, gang] = interaction.customId.split("_");
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) return interaction.reply({ content: "العضو غير موجود.", ephemeral: true });

    // تحقق أن الشخص ضاغط Admin
    const gangAdmins = config.gangAdmins[gang] || [];
    if (!gangAdmins.some(id => interaction.member.roles.cache.has(id))) {
      return interaction.reply({ content: "❌ ليس لديك صلاحية للتحكم بهذا التقديم.", ephemeral: true });
    }

    // قفل الأزرار
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("accept_disabled").setLabel("قبول").setStyle(ButtonStyle.Success).setDisabled(true),
      new ButtonBuilder().setCustomId("reject_disabled").setLabel("رفض").setStyle(ButtonStyle.Danger).setDisabled(true)
    );

    if (action === "accept") {
      // تعديل الرسالة
      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor("Green")
        .addFields({ name: "النتيجة", value: `✅ تم القبول بواسطة ${interaction.user}\nالمتقدّم: ${member}` });

      await interaction.update({ embeds: [embed], components: [row] });

      // DM
      await member.send("✅ تم قبولك في العصابة! مبروك.").catch(() => {});

      // تعديل الرتب
      try {
        await member.roles.set([config.gangRoles[gang], config.mainGangRole]);
      } catch (e) {
        console.error("Role update failed:", e);
      }
    }

    if (action === "reject") {
      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor("Red")
        .addFields({ name: "النتيجة", value: `❌ تم الرفض بواسطة ${interaction.user}\nالمتقدّم: ${member}` });

      await interaction.update({ embeds: [embed], components: [row] });

      await member.send("❌ تم رفض تقديمك. حاول مرة أخرى لاحقاً.").catch(() => {});
    }
  }
};