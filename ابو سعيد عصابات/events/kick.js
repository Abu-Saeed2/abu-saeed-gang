const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const config = require("../config.json");

function getEmployeeRole(gang) {
  const key = `Employee${gang.charAt(0).toUpperCase()}${gang.slice(1)}`;
  return config.EmployeeGang[key];
}

module.exports = async (client, interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  if (interaction.isButton() && interaction.customId === "kick_control") {
    const isEmployee = Object.values(config.EmployeeGang).some(r =>
      interaction.member.roles.cache.has(r)
    );

    if (!isEmployee) {
      return interaction.reply({ content: "❌ انت مو موظف.", ephemeral: true });
    }

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("kick_trickster").setLabel("Trickster").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("kick_scrap").setLabel("Scrap").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("kick_coza").setLabel("Coza").setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("kick_oldschool").setLabel("Old School").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("kick_bloods").setLabel("Bloods").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("kick_eleven").setLabel("Eleven").setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: "اختر العصابة:",
      components: [row1, row2],
      ephemeral: true
    });
  }

  if (interaction.isButton() && interaction.customId.startsWith("kick_")) {
    const gang = interaction.customId.replace("kick_", "");
    const employeeRole = getEmployeeRole(gang);

    if (!employeeRole || !interaction.member.roles.cache.has(employeeRole)) {
      return interaction.reply({ content: "❌ انت مو موظف بهذي العصابة.", ephemeral: true });
    }

    const gangRoleId = config.gangRoles[gang];
    const gangRole = interaction.guild.roles.cache.get(gangRoleId);

    if (!gangRole) {
      return interaction.reply({ content: "❌ رتبة العصابة غير موجودة.", ephemeral: true });
    }

    const adminRoles = config.gangAdmins[gang] || [];

    // جمع كل الأعضاء: رتبة العصابة + البوس/نائب، مع فلترة undefined
    const allMembers = [
      ...gangRole.members.values(),
      ...adminRoles.flatMap(id => {
        const role = interaction.guild.roles.cache.get(id);
        if (!role) return [];
        return [...role.members.values()];
      })
    ];

    let members = Array.from(allMembers)
      .filter(m => m && m.id !== interaction.member.id) // استبعاد الشخص اللي ضغط الزر
      .map(m => ({
        label: m.user.username.slice(0, 25),
        value: m.id,
        description: `ID: ${m.id}`
      }));

    // إزالة التكرار
    const uniqueMembers = [];
    const seenIds = new Set();
    for (const m of members) {
      if (!seenIds.has(m.value)) {
        uniqueMembers.push(m);
        seenIds.add(m.value);
      }
    }

    if (uniqueMembers.length === 0) {
      uniqueMembers.push({
        label: "لا يوجد أحد",
        value: "none",
        description: "لا يوجد أعضاء حالياً"
      });
    }

    const rows = [];
    for (let i = 0; i < uniqueMembers.length; i += 25) {
      rows.push(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`kick_member:${gang}:${i / 25}`)
            .setPlaceholder("اختر العضو للطرد")
            .addOptions(uniqueMembers.slice(i, i + 25))
        )
      );
    }

    return interaction.reply({
      embeds: [new EmbedBuilder().setTitle(`أعضاء عصابة ${gang}`)],
      components: rows.slice(0, 5),
      ephemeral: true
    });
  }

  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("kick_member:")) {
    const gang = interaction.customId.split(":")[1];
    const memberId = interaction.values[0];

    if (memberId === "none") {
      return interaction.reply({ content: "❌ لا يوجد أعضاء للطرد.", ephemeral: true });
    }

    const employeeRole = getEmployeeRole(gang);
    if (!employeeRole || !interaction.member.roles.cache.has(employeeRole)) {
      return interaction.reply({ content: "❌ ما عندك صلاحية.", ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(memberId).catch(() => null);
    if (!member) {
      return interaction.reply({ content: "❌ العضو غير موجود.", ephemeral: true });
    }

    for (const role of member.roles.cache.values()) {
      if (role.id !== interaction.guild.id) {
        await member.roles.remove(role.id).catch(() => {});
      }
    }

    await member.roles.add(config.kickRole).catch(() => {});

    return interaction.reply({
      content: `✅ تم طرد <@${memberId}> من عصابة ${gang}.`,
      ephemeral: true
    });
  }
};