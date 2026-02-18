const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();

client.wantedTemp = new Map();

fs.readdirSync("./command").forEach(file => {
  const cmd = require(`./command/${file}`);
  client.commands.set(cmd.name, cmd);
});


fs.readdirSync("./events").forEach(file => {
  const event = require(`./events/${file}`);
  client.on("interactionCreate", interaction => event(client, interaction));
});

mongoose.connect("", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"));


client.on("messageCreate", async msg => {
  if (msg.author.bot) return;

  
  if (msg.guild && msg.content.startsWith("!")) {
    const args = msg.content.slice(1).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    if (client.commands.has(cmdName)) {
      client.commands.get(cmdName).run(client, msg, args);
    }
    return;
  }

  if (msg.guild) return;

  const wanted = client.wantedTemp?.get(msg.author.id);
  if (wanted) {
  
    if (wanted.step === 1) {
      wanted.name = msg.content;
      wanted.step = 2;
      return msg.reply("✍️ اكتب **وظيفة المطلوب**");
    }


    if (wanted.step === 2) {
      wanted.job = msg.content;
      wanted.step = 3;
      return msg.reply("📝 اكتب **وصف عن المطلوب**");
    }

    // الوصف
    if (wanted.step === 3) {
      wanted.desc = msg.content;
      wanted.step = 4;
      return msg.reply("📸 أرسل **صورة المطلوب**");
    }

 
    if (wanted.step === 4) {
      const img = msg.attachments.first();
      if (!img) return msg.reply("❌ لازم ترسل صورة");

      const channel = await client.channels.fetch(config.wantedChannel).catch(() => null);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle("🚨 مطلوب")
        .setColor("Red")
        .addFields(
          { name: "الاسم", value: wanted.name, inline: true },
          { name: "الوظيفة", value: wanted.job, inline: true },
          { name: "الوصف", value: wanted.desc, inline: false }
        )
        .setImage(img.url)
        .setFooter({ text: `بواسطة ${msg.author.tag}` });

      await channel.send({ embeds: [embed] });

      client.wantedTemp.delete(msg.author.id);
      return msg.reply("✅ تم إرسال المطلوب بنجاح");
    }
  }
});

client.login("");