const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");

/**
 * Build a paginated select menu for events
 * @param {Array} events Array of event objects
 * @param {number} page Current page (0-indexed)
 * @param {string} customIdPrefix Prefix for select menu customId
 */
function buildEventMenu(events, page = 0, customIdPrefix = "event_select") {
  const ITEMS_PER_PAGE = 25;
  const start = page * ITEMS_PER_PAGE;
  const pagedEvents = events.slice(start, start + ITEMS_PER_PAGE);

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${customIdPrefix}_${page}`)
    .setPlaceholder("Select an event...")
    .addOptions(
      pagedEvents.map(ev => ({
        label: ev.name.length > 25 ? ev.name.slice(0, 22) + "..." : ev.name,
        value: ev.id
      }))
    );

  const rowMenu = new ActionRowBuilder().addComponents(menu);

  const buttons = [];
  if (start > 0) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${customIdPrefix}_prev_${page}`)
        .setLabel("⬅️ Previous")
        .setStyle(ButtonStyle.Primary)
    );
  }
  if (start + ITEMS_PER_PAGE < events.length) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${customIdPrefix}_next_${page}`)
        .setLabel("➡️ Next")
        .setStyle(ButtonStyle.Primary)
    );
  }

  const rowButtons = buttons.length ? [new ActionRowBuilder().addComponents(buttons)] : [];
  return { rows: [rowMenu, ...rowButtons], totalPages: Math.ceil(events.length / ITEMS_PER_PAGE) };
}

module.exports = { buildEventMenu };
