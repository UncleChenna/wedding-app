/* Local read-only UI. All ticket text uses textContent, never HTML insertion. */
const data = JSON.parse(document.getElementById("board-data").textContent);
const byId = (id) => document.getElementById(id);
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const option = (select, value, label = value) => {
  const item = node("option", label);
  item.value = value;
  select.append(item);
};
for (const theme of data.themes) option(byId("theme"), theme.id, theme.name);
function themeChanged() {
  const theme = data.themes.find((t) => t.id === byId("theme").value);
  for (const [name, value] of Object.entries(theme.colors))
    document.documentElement.style.setProperty(`--${name}`, value);
  document.documentElement.style.setProperty("--radius", theme.radii.md);
  document.documentElement.style.colorScheme = theme.colorScheme;
}
byId("theme").addEventListener("change", themeChanged);
themeChanged();
byId("freshness").textContent =
  `${data.source} · Generated ${new Date(data.generated).toLocaleString()} · Base ${data.base}`;
const tickets = data.tickets;
const count = (status) => tickets.filter((t) => t.meta.status === status).length;
for (const [label, value] of [
  ["Total tickets", tickets.length],
  ["Completed", count("done")],
  ["In review", count("in_review")],
  ["Blocked", count("blocked")],
]) {
  const item = node("div");
  item.append(node("strong", value), node("span", label));
  byId("summary").append(item);
}
for (const epic of data.epics) option(byId("epic"), epic.key, epic.title);
for (const owner of [...new Set(tickets.map((t) => t.meta.owner).filter(Boolean))].sort())
  option(byId("owner"), owner);
for (const priority of ["urgent", "high", "medium", "low"]) option(byId("priority"), priority);
for (const label of [...new Set(tickets.flatMap((t) => t.meta.labels))].sort())
  option(byId("label"), label);
function openTicket(ticket) {
  const meta = ticket.meta;
  byId("detail-id").textContent = meta.id;
  byId("detail-title").textContent = meta.title;
  const body = byId("detail-body");
  body.replaceChildren();
  body.append(
    node(
      "p",
      `${meta.status.replaceAll("_", " ")} · ${meta.priority} · ${meta.estimate} · ${meta.owner || "Unassigned"}`,
    ),
  );
  body.append(node("p", `Depends on: ${meta.blocked_by.join(", ") || "None"}`));
  body.append(node("p", `Unblocks: ${meta.blocks.join(", ") || "None"}`));
  body.append(node("p", `Source: ${ticket.path}`));
  if (/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+$/.test(meta.pr)) {
    const link = node("a", "Review pull request");
    link.href = meta.pr;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    body.append(link);
  }
  for (const [heading, content] of Object.entries(ticket.sections))
    body.append(node("h3", heading), node("pre", content));
  byId("detail").showModal();
}
byId("close").addEventListener("click", () => byId("detail").close());
const fields = ["search", "epic", "owner", "priority", "label"];
function render() {
  const values = Object.fromEntries(fields.map((id) => [id, byId(id).value.toLowerCase().trim()]));
  const filtered = tickets.filter((t) => {
    const m = t.meta;
    return (
      (!values.search ||
        `${m.id} ${m.title} ${Object.values(t.sections).join(" ")}`
          .toLowerCase()
          .includes(values.search)) &&
      (!values.epic || m.epic === values.epic) &&
      (!values.owner || (m.owner.toLowerCase() || "unassigned") === values.owner) &&
      (!values.priority || m.priority === values.priority) &&
      (!values.label || m.labels.includes(values.label))
    );
  });
  byId("results").textContent = `${filtered.length} of ${tickets.length} tickets`;
  byId("empty").hidden = filtered.length !== 0;
  const board = byId("board");
  board.replaceChildren();
  for (const status of data.statuses) {
    const group = filtered.filter((t) => t.meta.status === status.id);
    const section = node("section", undefined, "column");
    section.setAttribute("aria-label", status.name);
    const title = node("h3", status.name);
    title.append(node("span", group.length));
    section.append(title);
    if (!group.length) section.append(node("p", "No tickets here", "column-empty"));
    for (const t of group) {
      const m = t.meta;
      const card = node("button", undefined, "card");
      card.type = "button";
      card.append(
        node("span", m.id, "ticket-id"),
        node("strong", m.title),
        node("span", `${m.priority} · ${m.estimate}`, "priority"),
        node("span", m.owner || "Unassigned", "meta"),
      );
      const open = m.blocked_by.filter(
        (id) => tickets.find((other) => other.meta.id === id)?.meta.status !== "done",
      );
      if (open.length) card.append(node("span", `Waiting on ${open.join(", ")}`, "meta"));
      card.addEventListener("click", () => openTicket(t));
      section.append(card);
    }
    board.append(section);
  }
}
for (const field of fields)
  byId(field).addEventListener(field === "search" ? "input" : "change", render);
byId("reset").addEventListener("click", () => {
  for (const field of fields) byId(field).value = "";
  render();
});
for (const epic of data.epics) {
  const group = tickets.filter((t) => t.meta.epic === epic.key && t.meta.status !== "cancelled");
  const done = group.filter((t) => t.meta.status === "done").length;
  const row = node("div", undefined, "epic-row");
  const progress = node("progress");
  progress.max = group.length || 1;
  progress.value = done;
  progress.setAttribute("aria-label", epic.title);
  row.append(node("span", epic.title), progress, node("span", `${done} / ${group.length}`));
  byId("epics").append(row);
}
render();
