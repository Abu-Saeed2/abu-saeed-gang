const GangXP = require("../models/GangXP");
const updateGangXPEmbed = require("../utils/updateGangXPEmbed");

module.exports = {
  name: "اضافة",
  run: async (client, message, args) => {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ هذا الأمر للإداريين فقط.");
    }

    const gang = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);

    if (!gang || isNaN(amount) || amount <= 0) {
      return message.reply("❌ الاستخدام الصحيح: اضافة vagos 10");
    }

    const doc = await GangXP.findOneAndUpdate(
      { gang },
      { $inc: { xp: amount } },
      { upsert: true, new: true }
    );

    await updateGangXPEmbed(client);

    return message.reply(
      `✅ تمت إضافة **${amount} XP** لعصابة **${gang}**\n📊 XP الحالي: **${doc.xp}**`
    );
  }
};