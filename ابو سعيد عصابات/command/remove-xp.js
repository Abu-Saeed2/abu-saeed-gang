const GangXP = require("../models/GangXP");
const updateGangXPEmbed = require("../utils/updateGangXPEmbed");

module.exports = {
  name: "ازالة",
  run: async (client, message, args) => {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ هذا الأمر للإداريين فقط.");
    }

    const gang = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);

    if (!gang || isNaN(amount) || amount <= 0) {
      return message.reply("❌ الاستخدام الصحيح: ازالة vagos 5");
    }

    const doc = await GangXP.findOne({ gang });

    // ❌ العصابة ما لها XP أصلاً
    if (!doc) {
      return message.reply(`❌ عصابة **${gang}** ما عندها XP أساسًا.`);
    }

    // ❌ سحب أكثر من الموجود
    if (amount > doc.xp) {
      return message.reply(
        `❌ العدد غير موجود.\n📊 XP الحالي لعصابة **${gang}** هو **${doc.xp}**`
      );
    }

    // ✅ سحب آمن
    doc.xp -= amount;
    await doc.save();

    await updateGangXPEmbed(client);

    return message.reply(
      `❌ تمت إزالة **${amount} XP** من عصابة **${gang}**\n📊 XP الحالي: **${doc.xp}**`
    );
  }
};