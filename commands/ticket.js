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
  StringSelectMenuBuilder,
  InteractionResponseFlags
} = require("discord.js");

const { addTicket } = require("../database/tickets");
const config = require("../config");

// ==============================
// TICKET TYPES
// ==============================
const TICKET_TYPES = {
  inGame: { label: "In-Game Report", role: config.STAFF_ROLE_IDS.moderators, color: 0xe74c3c },
  discordReport: { label: "Discord Report", role: config.STAFF_ROLE_IDS.moderators, color: 0xf39c12 },
  technical: { label: "Technical Support", role: config.STAFF_ROLE_IDS.admins, color: 0x2ecc71 },
  discordSupport: { label: "Discord Support", role: config.STAFF_ROLE_IDS.support, color: 0x3498db },
  wellbeing: { label: "Community / Wellbeing", role: config.STAFF_ROLE_IDS.wellbeing, color: 0x9b59b6 }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open a new support ticket"),

  // -----------------------------
  // STEP 1 — Slash Command
  // -----------------------------
  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      Object.entries(TICKET_TYPES).map(([key, type]) =>
        new ButtonBuilder()
          .setCustomId(`ticket_type_${key}`)
          .setLabel(type.label)
          .setStyle(ButtonStyle.Primary)
      )
    );

    await interaction.reply({
      content: "📝 **Select the type of support you need:**",
      components: [row],
      flags: InteractionResponseFlags.Ephemeral
    });
  },

  // -----------------------------
  // STEP 2 — Handle Type Button
  // -----------------------------
  async handleButton(interaction) {
    if (!interaction.customId.startsWith("ticket_type_")) return;

    const typeKey = interaction.customId.replace("ticket_type_", "");
    const typeInfo = TICKET_TYPES[typeKey];
    if (!typeInfo)
      return interaction.reply({ content: "❌ Invalid ticket type.", flags: InteractionResponseFlags.Ephemeral });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`ticket_priority_${typeKey}_${interaction.user.id}`)
        .setPlaceholder("Select ticket priority")
        .addOptions([
          { label: "High", value: "High", emoji: "🔥" },
          { label: "Medium", value: "Medium", emoji: "⚠️" },
          { label: "Low", value: "Low", emoji: "🧊" }
        ])
    );

    await interaction.update({
      content: `**${typeInfo.label}** selected.\nNow choose the priority:`,
      components: [row]
    });
  },

  // -----------------------------
  // STEP 3 — Handle Priority Select
  // -----------------------------
  async handlePrioritySelect(interaction) {
    if (!interaction.customId.startsWith("ticket_priority_")) return;

    const [, , typeKey, userId] = interaction.customId.split("_");
    if (interaction.user.id !== userId)
      return interaction.reply({ content: "❌ This is not your ticket.", flags: InteractionResponseFlags.Ephemeral });

    const typeInfo = TICKET_TYPES[typeKey];
    if (!typeInfo)
      return interaction.reply({ content: "❌ Invalid ticket type.", flags: InteractionResponseFlags.Ephemeral });

    const priority = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${typeKey}_${priority}_${userId}`)
      .setTitle(`${typeInfo.label} Ticket`);

    const rows = [];

    if (["inGame", "discordReport"].includes(typeKey)) {
      rows.push(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("ign")
            .setLabel("Player IGN")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    }

    rows.push(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Describe the issue")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    rows.push(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("attachments")
          .setLabel("Links (screenshots / videos)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
      )
    );

    modal.addComponents(rows);
    await interaction.showModal(modal);
  },

  // -----------------------------
  // STEP 4 — Handle Modal Submit
  // -----------------------------
  async handleModalSubmit(interaction, client) {
    if (!interaction.customId.startsWith("ticket_modal_")) return;

    const [, , typeKey, priority, userId] = interaction.customId.split("_");
    if (interaction.user.id !== userId)
      return interaction.reply({ content: "❌ This is not your ticket.", flags: InteractionResponseFlags.Ephemeral });

    const typeInfo = TICKET_TYPES[typeKey];
    if (!typeInfo)
      return interaction.reply({ content: "❌ Invalid ticket type.", flags: InteractionResponseFlags.Ephemeral });

    const values = {};
    for (const key of interaction.fields.fields.keys()) {
      values[key] = interaction.fields.getTextInputValue(key);
    }

    const embed = new EmbedBuilder()
      .setTitle(`📝 ${typeInfo.label}`)
      .setColor(typeInfo.color)
      .setDescription(values.description)
      .addFields(
        { name: "User", value: `<@${userId}>`, inline: true },
        { name: "Priority", value: priority, inline: true }
      )
      .setTimestamp();

    if (values.ign) embed.addFields({ name: "IGN", value: values.ign, inline: true });
    if (values.attachments) embed.addFields({ name: "Attachments", value: values.attachments });

    // ✅ Send directly to text channel
    const board = client.channels.cache.get(config.TICKET_BOARD_CHANNEL);
    if (!board)
      return interaction.reply({ content: "❌ Ticket board channel not found.", flags: InteractionResponseFlags.Ephemeral });

    await board.send({
      content: typeInfo.role ? `<@&${typeInfo.role}>` : null,
      embeds: [embed]
    });

    // Save ticket to DB
    addTicket({
      id: `${Date.now()}_${userId}`,
      creatorId: userId,
      type: typeKey,
      priority,
      status: "open",
      threadId: null,
      channelId: board.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      details: values.description,
      attachments: values.attachments || null
    });

    await interaction.reply({
      content: `✅ Ticket submitted successfully!`,
      flags: InteractionResponseFlags.Ephemeral
    });
  }
};
