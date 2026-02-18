const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const config = require("../config.json");
const Apply = require("../models/apply"); // تأكد من المسار

module.exports = async (client, interaction) => {
  if (!interaction.isButton()) return;

  // زر عرض الأعضاء
  if (interaction.customId === "members_control") {
    // تحقق هل معه رتبة EmployeeGang فقط
    const isEmployee = Object.values(config.EmployeeGang).some(roleId =>
      interaction.member.roles.cache.has(roleId)
    );

    if (!isEmployee) {
      return interaction.reply({ content: "ما عندك صلاحية.", ephemeral: true });
    }

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("members_trickster").setLabel("Trickster").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("members_scrap").setLabel("Scrap").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("members_coza").setLabel("Coza").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("members_oldschool").setLabel("Old School").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("members_bloods").setLabel("Bloods").setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("members_eleven").setLabel("Eleven").setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: "اختر العصابة:",
      components: [row1, row2],
      ephemeral: true,
    });
  }

  // عند اختيار العصابة
  if (interaction.customId.startsWith("members_")) {
    const gang = interaction.customId.replace("members_", "");
    const employeeRole = config.EmployeeGang[`Employee${gang.charAt(0).toUpperCase()}${gang.slice(1)}`];

    // تحقق أنه عنده EmployeeRole لهذه العصابة فقط
    if (!employeeRole || !interaction.member.roles.cache.has(employeeRole)) {
      return interaction.reply({ content: "انت مو موظف هذي العصابة.", ephemeral: true });
    }

    const roleId = config.gangRoles[gang];
    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) {
      return interaction.reply({ content: "رتبة العصابة غير موجودة.", ephemeral: true });
    }

    const members = role.members;
    if (members.size === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`أعضاء ${gang}`)
            .setDescription("لا يوجد احد"),
        ],
        ephemeral: true,
      });
    }

    let desc = "";
    let i = 1;

    for (const [id, member] of members) {
      const data = await Apply.findOne({ userId: id });
      const crimes = data ? data.crimes : "لا يوجد بيانات واضحة";

      desc += `**${i} - العضو : <@${id}>**\n🏴‍☠️ - أعماله الإجرامية: [${crimes}]\n\n`;
      i++;
    }

    const embed = new EmbedBuilder()
      .setTitle(`أعضاء عصابة ${gang}`)
      .setDescription(desc);

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }
};