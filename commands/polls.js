const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { MOD_LOG_CHANNEL } = require("../config");
const { getPoll, addPoll, updatePoll, removePoll, getAllPolls } = require("../database/polls");
const client = require("../index").client; // make sure your index.js exports the client

const MAX_USER_OPTIONS = 4;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll")
    .addStringOption(opt =>
      opt.setName("question")
        .setDescription("Poll question")
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("channel")
        .setDescription("Channel to post the poll")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("options")
        .setDescription("Comma-separated options (max 10)")
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName("allow_user_options")
        .setDescription("Allow users to add their own options")
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName("duration")
        .setDescription("Poll duration in minutes (optional)")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member))
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    const question = interaction.options.getString("question");
    const optionsInput = interaction.options.getString("options") || "";
    const allowUserOptions = interaction.options.getBoolean("allow_user_options") || false;
    const duration = interaction.options.getInteger("duration") || null;
    const channel = interaction.options.getChannel("channel");

    if (!channel.isTextBased())
      return interaction.reply({ content: "❌ Not a text channel.", ephemeral: true });

    // Parse options
    const options = optionsInput.split(",").map(o => o.trim()).filter(o => o.length > 0).slice(0, 10);
    if (options.length === 0) options.push("Yes", "No");

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`📊 Poll: ${question}`)
      .setDescription(options.map((o, i) => `${i + 1}. ${o}`).join("\n"))
      .setColor("#f1c40f")
      .setFooter({ text: `Poll created by ${interaction.user.tag}` })
      .setTimestamp();

    // Send message
    const pollMessage = await channel.send({ embeds: [embed] });

    const emojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
    for (let i = 0; i < options.length; i++) await pollMessage.react(emojis[i]);

    // Save poll to DB
    addPoll(pollMessage.id, {
      question,
      options,
      emojis: emojis.slice(0, options.length),
      channelId: channel.id,
      userCanAdd: allowUserOptions,
      duration,            // minutes
      createdAt: Date.now()
    });

    if (allowUserOptions) {
      await pollMessage.reply("✅ Users can add options by replying to this message. Bot will update automatically.");
    }

    client.channels.cache.get(MOD_LOG_CHANNEL)
      ?.send(`📊 Poll posted in ${channel} by ${interaction.user.tag}: ${question}`);

    await interaction.reply({ content: `✅ Poll posted in ${channel}`, ephemeral: true });
  }
};

// ===========================
// Handle user-added options
// ===========================
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const polls = getAllPolls().filter(p => p.channelId === message.channel.id && p.userCanAdd);
  if (!polls.length) return;

  for (const poll of polls) {
    if (poll.options.length >= 10 + MAX_USER_OPTIONS) return;

    const emojiList = ["5️⃣","6️⃣","7️⃣","8️⃣"];
    const emoji = emojiList[poll.options.length - 10] || "➕";

    poll.options.push(message.content);
    poll.emojis.push(emoji);

    const channel = client.channels.cache.get(poll.channelId);
    if (!channel) return;

    const pollMessage = await channel.messages.fetch(poll.id).catch(() => null);
    if (!pollMessage) return;

    const embed = new EmbedBuilder()
      .setTitle(`📊 Poll: ${poll.question}`)
      .setDescription(poll.options.map((o, i) => `${poll.emojis[i]} ${o}`).join("\n"))
      .setColor("#f1c40f")
      .setFooter({ text: "Users can add options" })
      .setTimestamp();

    await pollMessage.edit({ embeds: [embed] });
    await pollMessage.react(emoji).catch(() => {});
    updatePoll(poll.id, poll);

    message.delete().catch(() => {});
  }
});

// ===========================
// Auto-close polls & post results
// ===========================
async function checkPolls() {
  const now = Date.now();
  const polls = getAllPolls();

  for (const poll of polls) {
    if (!poll.duration || poll.closed) continue;

    const elapsed = (now - poll.createdAt) / 60000;
    if (elapsed >= poll.duration) {
      const channel = client.channels.cache.get(poll.channelId);
      if (!channel) continue;

      const pollMessage = await channel.messages.fetch(poll.id).catch(() => null);
      if (!pollMessage) continue;

      const reactions = pollMessage.reactions.cache;
      const results = [];
      for (let i = 0; i < poll.options.length; i++) {
        const emoji = poll.emojis[i];
        const count = reactions.get(emoji)?.count - 1 || 0;
        results.push({ option: poll.options[i], votes: count });
      }

      results.sort((a, b) => b.votes - a.votes);

      const resultEmbed = new EmbedBuilder()
        .setTitle(`📊 Poll Closed: ${poll.question}`)
        .setDescription(results.map(r => `**${r.option}** — ${r.votes} vote(s)`).join("\n"))
        .setColor("#2ecc71")
        .setTimestamp()
        .setFooter({ text: "Poll auto-closed" });

      await channel.send({ embeds: [resultEmbed] }).catch(() => {});
      removePoll(poll.id);
    }
  }
}

setInterval(checkPolls, 30_000);

// ===========================
// Reload polls on bot start
// ===========================
client.once("ready", async () => {
  const polls = getAllPolls();
  for (const poll of polls) {
    const channel = client.channels.cache.get(poll.channelId);
    if (!channel) continue;

    const pollMessage = await channel.messages.fetch(poll.id).catch(() => null);
    if (!pollMessage) continue;

    const embed = new EmbedBuilder()
      .setTitle(`📊 Poll: ${poll.question}`)
      .setDescription(poll.options.map((o, i) => `${poll.emojis[i]} ${o}`).join("\n"))
      .setColor("#f1c40f")
      .setFooter({ text: poll.userCanAdd ? "Users can add options" : "" })
      .setTimestamp();

    await pollMessage.edit({ embeds: [embed] }).catch(() => {});
    for (const e of poll.emojis) await pollMessage.react(e).catch(() => {});
  }
});
