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
  ChannelType
} = require("discord.js");

const config = require("../config");
const { addTicket } = require("../database/tickets");

// ==============================
// TICKET TYPES
// ==============================
const TICKET_TYPES = {
  inGame: {
    label: "In-Game Report",
    role: config.STAFF_ROLE_IDS.moderators,
    color: 0xe74c3c
  },
  discordReport: {
    label: "Discord Report",
    role: config.STAFF_ROLE_IDS.moderators,
    color: 0xf39c12
  },
  technical: {
    label: "Technical Support",
    role: config.STAFF_ROLE_IDS.admins,
    color: 0x2ecc71
  },
  discordSupport: {
    label: "Discord Support",
    role: config.STAFF_ROLE_IDS.support,
    color: 0x3498db
  },
  wellbeing: {
    label: "Community / Wellbeing",
    role: config.STAFF_ROLE_IDS.wellbeing,
    color: 0x9b59b6
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open a support ticket"),

  // ==============================
  // /ticket
  // ==============================
  async execute(interaction) {
    const buttons = Object.entries(TICKET_TYPES).map(([key, type]) =>
      new ButtonBuilder()
        .setCustomId(`ticket_type_${key}`)
        .setLabel(type.label)
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: "📝 **Select the type of support you need:**",
      components: [new ActionRowBuilder().addComponents(buttons)],
      ephemeral: true
    });
  },

  // ==============================
  // BUTTON HANDLER
  // ==============================
  async handleButton(interaction) {
    if (!interaction.customId.startsWith("ticket_type_")) return;

    const typeKey = interaction.customId.replace("ticket_type_", "");
    const typeInfo = TICKET_TYPES[typeKey];
    if (!typeInfo) return;

    const select = new StringSelectMenuBuilder()
      .setCustomId(`ticket_priority_${typeKey}_${interaction.user.id}`)
      .setPlaceholder("Select ticket priority")
      .addOptions(
        { label: "High", value: "High", emoji: "🔥" },
        { label: "Medium", value: "Medium", emoji: "⚠️" },
        { label: "Low", value: "Low", emoji: "🧊" }
      );

    await interaction.update({
      content: `**${typeInfo.label}** selected.\nChoose priority:`,
      components: [new ActionRowBuilder().addComponents(select)]
    });
  },

  // ==============================
  // PRIORITY SELECT
  // ==============================
  async handlePrioritySelect(interaction) {
    if (!interaction.customId.startsWith("ticket_priority_")) return;

    const [, , typeKey, userId] = interaction.customId.split("_");
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: "❌ Not your ticket.", ephemeral: true });
    }

    const priority = interaction.values[0];
    const typeInfo = TICKET_TYPES[typeKey];
    if (!typeInfo) return;

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

  // ==============================
  // MODAL SUBMIT
  // ==============================
  async handleModalSubmit(interaction, client) {
    if (!interaction.customId.startsWith("ticket_modal_")) return;

    const [, , typeKey, priority, userId] = interaction.customId.split("_");
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: "❌ Not your ticket.", ephemeral: true });
    }

    const typeInfo = TICKET_TYPES[typeKey];
    if (!typeInfo) return;

    // SAFELY FETCH BOARD CHANNEL
    const board = await client.channels.fetch(config.TICKET_BOARD_CHANNEL).catch(() => null);

    if (
      !board ||
      ![ChannelType.GuildText, ChannelType.GuildForum].includes(board.type)
    ) {
      return interaction.reply({
        content: "❌ Ticket system misconfigured. Please contact staff.",
        ephemeral: true
      });
    }

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

    const thread = await board.threads.create({
      name: `${typeKey}-${interaction.user.username}`,
      autoArchiveDuration: 1440,
      reason: "New support ticket"
    });

    await thread.send({
      content: typeInfo.role ? `<@&${typeInfo.role}>` : undefined,
      embeds: [embed]
    });

    addTicket({
      id: thread.id,
      creatorId: userId,
      type: typeKey,
      priority,
      status: "open",
      threadId: thread.id,
      channelId: board.id,
      createdAt: Date.now()
    });

    await interaction.reply({
      content: `✅ Ticket created successfully: ${thread}`,
      ephemeral: true
    });
  }
};
