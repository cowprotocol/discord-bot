function sendAlert(client, embeddedMessage, channelId) {
  if (!client) {
    console.error('Discord client is not initialized.');
    return;
  }
  
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    channel.send({ embeds: [embeddedMessage] });
  } else {
    console.error(`Channel with ID ${channelId} not found.`);
  }
}

module.exports = {
  sendAlert
};