module.exports = (client) => {
  client.once("ready", () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    console.log("");

    // تعيين حالة البوت (Presence)
    client.user.setPresence({
      activities: [
        {
          name: " - Discord Gang Bot",
          type: 0 // Playing
        }
      ],
      status: "online"
    });
  });
};
