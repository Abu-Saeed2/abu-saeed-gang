const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const config = require("../config.json");

/* ================== RANK IDS ================== */
const roles = {
  Boss: "1453670213974233088",
  CoBoss: "1453670163210829959",
  "Advisor-Boss": "1458980641512095908",
  "Advisor-CoBoss": "1458980713083965534",
  Observer: "1458980750392164395",
  Advisor: "1458980784143597609",
  Organizer: "1458980833590513722",
  Gangestr: "1458980871116820628"
};

/* ========== ORDER (LOW ➜ HIGH) ========== */
const rankOrder = [
  "Gangestr",
  "Organizer",
  "Advisor",
  "Observer",
  "Advisor-CoBoss",
  "Advisor-Boss",
  "CoBoss",
  "Boss"
];

/* ================== HELPERS ================== */
function getEmployeeRole(gang) {
  const key = `Employee${gang.charAt(0).toUpperCase()}${gang.slice(1)}`;
  return config.EmployeeGang[key];
}

function getCurrentRank(member) {
  for (let i = rankOrder.length - 1; i >= 0; i--) {
    if (member.roles.cache.has(roles[rankOrder[i]])) {
      return rankOrder[i];
    }
  }
  return null; // عضو
}

function getHigherRanks(rank) {
  if (!rank) return rankOrder; // عضو → كل الرتب
  const index = rankOrder.indexOf(rank);
  return rankOrder.slice(index + 1);
}

/* ================== MAIN ================== */
module.exports = async (client, interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  /* ========== CONTROL BUTTON ========== */
  if (interaction.isButton() && interaction.customId === "promote_control") {
    const isEmployee = Object.values(config.EmployeeGang)
      .some(r => interaction.member.roles.cache.has(r));

    if (!isEmployee)
      return interaction.reply({ content: "❌ انت مو موظف.", ephemeral: true });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("promote_trickster").setLabel("Trickster").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("promote_scrap").setLabel("Scrap").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("promote_coza").setLabel("Coza").setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("promote_oldschool").setLabel("Old School").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("promote_bloods").setLabel("Bloods").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("promote_eleven").setLabel("Eleven").setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: "اختر العصابة:",
      components: [row1, row2],
      ephemeral: true
    });
  }

  /* ========== SHOW MEMBERS (FETCH + gangRole فقط) ========== */
  if (interaction.isButton() && interaction.customId.startsWith("promote_")) {
    const gang = interaction.customId.replace("promote_", "");
    const employeeRole = getEmployeeRole(gang);

    if (!employeeRole || !interaction.member.roles.cache.has(employeeRole))
      return interaction.reply({ content: "❌ انت مو موظف بهذي العصابة.", ephemeral: true });

    const gangRole = config.gangRoles[gang];

    const members = (await interaction.guild.members.fetch()).filter(m =>
      m.id !== interaction.member.id &&
      m.roles.cache.has(gangRole)
    );

    if (!members.size)
      return interaction.reply({ content: "❌ لا يوجد أعضاء.", ephemeral: true });

    const options = members.map(m => {
      const rank = getCurrentRank(m);
      return {
        label: m.user.username.slice(0, 25),
        value: m.id,
        description: `رتبته: ${rank || "عضو"}`
      };
    });

    const rows = [];
    for (let i = 0; i < options.length; i += 25) {
      rows.push(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("promote_select")
            .setPlaceholder("اختر عضو")
            .addOptions(options.slice(i, i + 25))
        )
      );
    }

    return interaction.reply({
      embeds: [new EmbedBuilder().setTitle(`ترقية ${gang}`)],
      components: rows,
      ephemeral: true
    });
  }

  /* ========== SELECT MEMBER ========== */
  if (interaction.isStringSelectMenu() && interaction.customId === "promote_select") {
    const member = await interaction.guild.members.fetch(interaction.values[0]);
    const currentRank = getCurrentRank(member);
    const higherRanks = getHigherRanks(currentRank);

    const rows = [];
    for (let i = 0; i < higherRanks.length; i += 5) {
      const row = new ActionRowBuilder();
      higherRanks.slice(i, i + 5).forEach(rank => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`promote:${member.id}:${rank}`)
            .setLabel(rank)
            .setStyle(ButtonStyle.Primary)
        );
      });
      rows.push(row);
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`ترقية ${member.user.username}`)
          .setDescription(`رتبته الحالية: **${currentRank || "عضو"}**`)
      ],
      components: rows,
      ephemeral: true
    });
  }

  /* ========== DO PROMOTION ========== */
  if (interaction.isButton() && interaction.customId.startsWith("promote:")) {
    const [, memberId, newRank] = interaction.customId.split(":");
    const member = await interaction.guild.members.fetch(memberId);
    const oldRank = getCurrentRank(member);

    if (oldRank)
      await member.roles.remove(roles[oldRank]).catch(() => {});

    await member.roles.add(roles[newRank]).catch(() => {});

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `✅ تم ترقية **${member.user.username}**\n` +
            `من **${oldRank || "عضو"}** ➜ **${newRank}**`
          )
      ],
      components: []
    });
  }
};