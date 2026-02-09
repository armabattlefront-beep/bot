// commands/ticket.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  SelectMenuBuilder
} = require("discord.js");
const { addTicket, updateTicket, getTicket } = require("../database/tickets");
const config = require("../config");

const MAX_VIDEO_DURATION = 300; // seconds

// Define ticket types and staff roles mapping
const TICKET_TYPES = {
  inGame: { label: "In-Game Report", role: config.STAFF_ROLE_IDS.moderators, color: 0xff0000 },
  discordReport: { label: "Discord Report", role: config.STAFF_ROLE_IDS.moderators, color: 0xff9900 },
  technical: { label: "Technical Support", role: config.STAFF_ROLE_IDS.admins, color: 0x00ff00 },
  discordSupport: { label: "Discord Support", role: config.STAFF_ROLE_IDS.support, color: 0x3498db },
  wellbeing: { label: "Community / Wellbeing", role: config.STAFF_ROLE_IDS.wellbeing, color: 0x9932cc }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open a new support ticket"),

  // --------------------
  // STEP 1: Ask ticket type
  // --------------------
  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      ...Object.entries(TICKET_TYPES).map(([key, type]) =>
        new ButtonBuilder()
          .setCustomId(`ticket_type_${key}`)
          .setLabel(type.label)
          .setStyle(ButtonStyle.Primary)
      )
    );

    await interaction.reply({
      content: "Please select the type of support you need:",
      components: [row],
      ephemeral: true
    });
  },

  // --------------------
  // STEP 2: Handle ticket type selection
  // --------------------
  async handleButton(interaction) {
    if (!interaction.customId.startsWith("ticket_type_")) return;

    const typeKey = interaction.customId.replace("ticket_type_", "");
    const typeInfo = TICKET_TYPES[typeKey];
    if (!typeInfo) return interaction.reply({ content: "❌ Invalid ticket type.", ephemeral: true });

    // Create priority select menu
    const priorityRow = new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId(`ticket_priority_${typeKey}_${interaction.user.id}`)
        .setPlaceholder("Select ticket priority")
        .addOptions([
          { label: "High", value: "High" },
          { label: "Medium", value: "Medium" },
          { label: "Low", value: "Low" }
        ])
    );

    await interaction.reply({
      content: `You selected **${typeInfo.label}**. Please choose the priority for this ticket:`,
      components: [priorityRow],
      ephemeral: true
    });
  },

  // --------------------
  // STEP 3: Handle priority selection → show modal
  // --------------------
  async handlePrioritySelect(interaction) {
    if (!interaction.customId.startsWith("ticket_priority_")) return;

    const [, typeKey, userId] = interaction.customId.split("_");
    if (interaction.user.id !== userId) return interaction.reply({ content: "❌ You cannot submit this ticket.", ephemeral: true });

    const typeInfo = TICKET_TYPES[typeKey];
    if (!typeInfo) return interaction.reply({ content: "❌ Invalid ticket type.", ephemeral: true });

    const priority = interaction.values[0] || "Medium";

    // Build modal fields based on ticket type
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${typeKey}_${priority}_${userId}`)
      .setTitle(`${typeInfo.label} Ticket`);

    const fields = [];
    switch (typeKey) {
      case "inGame":
      case "discordReport":
        fields.push(
          new TextInputBuilder().setCustomId("ign").setLabel("Player IGN").setStyle(TextInputStyle.Short).setRequired(true),
          new TextInputBuilder().setCustomId("description").setLabel("Describe the issue").setStyle(TextInputStyle.Paragraph).setRequired(true),
          new TextInputBuilder().setCustomId("attachments").setLabel("Links to images/videos (max 5 min each)").setStyle(TextInputStyle.Paragraph).setRequired(false)
        );
        break;
      case "technical":
        fields.push(
          new TextInputBuilder().setCustomId("os").setLabel("OS / Device").setStyle(TextInputStyle.Short).setRequired(true),
          new TextInputBuilder().setCustomId("client").setLabel("Client Version").setStyle(TextInputStyle.Short).setRequired(true),
          new TextInputBuilder().setCustomId("description").setLabel("Describe the issue").setStyle(TextInputStyle.Paragraph).setRequired(true),
          new TextInputBuilder().setCustomId("attachments").setLabel("Links to screenshots/videos (max 5 min each)").setStyle(TextInputStyle.Paragraph).setRequired(false)
        );
        break;
      case "discordSupport":
      case "wellbeing":
        fields.push(
          new TextInputBuilder().setCustomId("description").setLabel("How can we help you?").setStyle(TextInputStyle.Paragraph).setRequired(true),
          new TextInputBuilder().setCustomId("contact").setLabel("Optional contact info").setStyle(TextInputStyle.Short).setRequired(false)
        );
        break;
    }

    modal.addComponents(fields.map(f => new ActionRowBuilder().addComponents(f)));
    await interaction.showModal(modal);
  },

  // --------------------
  // STEP 4: Handle modal submission → create thread ticket
  // --------------------
  async handleModalSubmit(interaction, client) {
    if (!interaction.customId.startsWith("ticket_modal_")) return;

    const [, typeKey, priority, userId] = interaction.customId.split("_");
    if (interaction.user.id !== userId) return interaction.reply({ content: "❌ You cannot submit this ticket.", ephemeral: true });

    const typeInfo = TICKET_TYPES[typeKey];
    if (!typeInfo) return interaction.reply({ content: "❌ Invalid ticket type.", ephemeral: true });

    const values = {};
    for (const key of interaction.fields.fields.keys()) {
      values[key] = interaction.fields.getTextInputValue(key);
    }

    const embed = new EmbedBuilder()
      .setTitle(`📝 ${typeInfo.label} Ticket`)
      .setDescription(values.description || "No description provided")
      .setColor(typeInfo.color)
      .addFields(
        { name: "User", value: `<@${userId}>`, inline: true },
        { name: "Priority", value: priority, inline: true }
      )
      .setTimestamp();

    // Add other fields dynamically
    Object.keys(values).forEach(key => {
      if (!["description"].includes(key)) {
        embed.addFields({ name: key.charAt(0).toUpperCase() + key.slice(1), value: values[key] || "N/A", inline: true });
      }
    });

    // Create ticket thread
    const board = client.channels.cache.get(config.TICKET_BOARD_CHANNEL);
    if (!board) return interaction.reply({ content: "❌ Ticket board channel not found.", ephemeral: true });

    const thread = await board.threads.create({
      name: `${typeKey}-${interaction.user.username}`,
      autoArchiveDuration: 1440,
      reason: `Ticket created by ${interaction.user.tag}`
    });

    // Notify staff
    await thread.send({ content: typeInfo.role ? `<@&${typeInfo.role}>` : "", embeds: [embed] });

    // Save ticket in DB
    addTicket({
      id: thread.id,
      creatorId: userId,
      type: typeKey,
      priority,
      status: "open",
      threadId: thread.id,
      channelId: board.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      details: JSON.stringify(values),
      attachments: values.attachments || ""
    });

    await interaction.reply({ content: `✅ Ticket created: ${thread.name}`, ephemeral: true });
  }
};
