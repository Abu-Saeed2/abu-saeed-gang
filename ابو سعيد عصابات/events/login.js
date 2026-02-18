const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");
const Login = require("../models/login.js");

/* =====================
   أدوات مساعدة
===================== */

function getMemberGang(member) {
  const gangs = Object.entries(config.gangRoles)
    .filter(([_, roleId]) => member.roles.cache.has(roleId))
    .map(([gang]) => gang);

  if (gangs.length === 0) return null;
  if (gangs.length > 1) return "MULTI";
  return gangs[0];
}

function getRank(member, gang) {
  if (!config.gangAdmins || !config.gangAdmins[gang]) {
    return { tag: "👤 عضو", p: 3 };
  }

  const admins = config.gangAdmins[gang];

  // الرئيس (أولوية 1)
  if (admins[0] && member.roles.cache.has(admins[0])) {
    return { tag: "👑 الرئيس", p: 1 };
  }

  // النائب (أولوية 2)
  if (admins[1] && member.roles.cache.has(admins[1])) {
    return { tag: "⭐ النائب", p: 2 };
  }

  // عضو عادي
  return { tag: "👤 عضو", p: 3 };
}

/* =====================
   التفاعل
===================== */

module.exports = async (client, interaction) => {
  if (!interaction.isButton()) return;

  /* ===== دخول ===== */
  if (interaction.customId === "login_in") {
    const gang = getMemberGang(interaction.member);

    if (!gang) {
      return interaction.reply({
        content: "❌ لازم تكون منضم لعصابة.",
        ephemeral: true,
      });
    }

    if (gang === "MULTI") {
      return interaction.reply({
        content: "❌ معك أكثر من رتبة عصابة، راجع الدعم الفني.",
        ephemeral: true,
      });
    }

    const existing = await Login.findOne({
      userId: interaction.user.id,
      gang,
      status: "in",
    });

    if (existing) {
      return interaction.reply({
        content: "❌ انت مسجل مسبقًا!",
        ephemeral: true,
      });
    }

    await Login.findOneAndUpdate(
      { userId: interaction.user.id, gang },
      { status: "in", lastUpdate: Date.now() },
      { upsert: true }
    );

    return interaction.reply({
      content: `✅ تم تسجيل دخولك في عصابة **${gang}**`,
      ephemeral: true,
    });
  }

  /* ===== خروج ===== */
  if (interaction.customId === "login_out") {
    const existing = await Login.findOne({
      userId: interaction.user.id,
      status: "in",
    });

    if (!existing) {
      return interaction.reply({
        content: "❌ انت لست موجود من الأساس!",
        ephemeral: true,
      });
    }

    await Login.updateMany(
      { userId: interaction.user.id },
      { status: "out", lastUpdate: Date.now() }
    );

    return interaction.reply({
      content: "🚪 تم تسجيل خروجك.",
      ephemeral: true,
    });
  }

  /* ===== عرض العصابات ===== */
  if (interaction.customId === "login_view") {
    const embed = new EmbedBuilder()
      .setTitle("📋 حالة دخول العصابات")
      .setColor("#2f3136");

    for (const gang of Object.keys(config.gangRoles)) {
      const logs = await Login.find({ gang, status: "in" });
      const list = [];

      for (const l of logs) {
        const member = await interaction.guild.members
          .fetch(l.userId)
          .catch(() => null);

        if (!member) continue;

        const rank = getRank(member, gang);

        list.push({
          text: `<@${member.id}> - ${rank.tag}`,
          p: rank.p,
        });
      }

      // ترتيب حسب الأولوية (رئيس → نائب → عضو)
      list.sort((a, b) => a.p - b.p);

      embed.addFields({
        name: gang,
        value: list.length
          ? list.map(x => x.text).join("\n")
          : "لا يوجد أحد بالداخل",
        inline: false,
      });
    }

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }
};