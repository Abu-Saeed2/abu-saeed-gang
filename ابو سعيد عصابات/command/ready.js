module.exports = (client) => {
  client.once("ready", () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    console.log("جميع الحقوق محفوظة © LAW");

    // تعيين حالة البوت (Presence)
    client.user.setPresence({
      activities: [
        {
          name: "حقوق LAW - Discord Gang Bot",
          type: 0 // Playing
        }
      ],
      status: "online"
    });
  });
};