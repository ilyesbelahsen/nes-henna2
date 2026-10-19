const ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const COLORS = {
  title: "#a30d2d",
  text: "#2a1420",
  muted: "#6f5560",
  border: "#ead9de",
};

export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ENTITIES[character],
  );
}

function safeFilename(filename) {
  return String(filename).replace(/[\\/\r\n"]/g, "_");
}

function plural(count, singular) {
  return `${count} ${Number(count) > 1 ? `${singular}s` : singular}`;
}

function modelType(model) {
  return model.kind === "upload" ? "Photo importée" : "Modèle de la galerie";
}

// Ne garde que les chiffres et le "+" : sûr à placer dans un lien tel:
function phoneHref(phone) {
  const digits = String(phone ?? "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

function tableRow(label, valueHtml) {
  return `<tr><th align="left" valign="top" style="padding:6px 16px 6px 0;color:${COLORS.muted};font-weight:600;white-space:nowrap">${label}</th><td style="padding:6px 0">${valueHtml}</td></tr>`;
}

function sectionTitle(label) {
  return `<h2 style="margin:28px 0 8px;font-size:16px;color:${COLORS.title};border-bottom:1px solid ${COLORS.border};padding-bottom:6px">${label}</h2>`;
}

export function buildBookingEmailContent(booking, when, files) {
  const uploadedModels = booking.models.filter(
    (model) => model.kind === "upload",
  );
  if (uploadedModels.length !== files.length) {
    throw new Error(
      "Les photos ne correspondent pas aux modèles sélectionnés.",
    );
  }

  let uploadIndex = 0;
  const models = booking.models.map((model) => {
    const filename =
      model.kind === "upload"
        ? safeFilename(files[uploadIndex++].originalname)
        : null;
    return { ...model, filename };
  });

  const modelCount = models.reduce((total, model) => total + model.quantity, 0);
  const fullName = `${booking.prenom} ${booking.nom}`;
  const people = plural(booking.participants, "personne");
  const photos = files.length > 0 ? plural(files.length, "photo") : null;
  const comment = booking.commentaire?.trim() || "";

  // ---------- Version texte ----------
  const lines = [
    "NOUVELLE DEMANDE DE RENDEZ-VOUS",
    "",
    `${fullName} demande un rendez-vous le ${when} à ${booking.ville}.`,
    "Pensez à la recontacter pour confirmer le créneau.",
    "",
    "RENDEZ-VOUS",
    `Date : ${when}`,
    `Ville : ${booking.ville}`,
    `Nombre de personnes : ${booking.participants}`,
    `Niveau souhaité : ${booking.niveau}`,
    "",
    "COORDONNÉES",
    `Nom : ${fullName}`,
    `Téléphone : ${booking.telephone}`,
    `E-mail : ${booking.email}`,
    "Pour lui répondre, utilisez simplement « Répondre » sur cet e-mail.",
    "",
    `MODÈLES (${modelCount})`,
    ...models.map((model, index) => {
      const photo = model.filename
        ? ` — fichier joint : ${model.filename}`
        : "";
      return [
        `${index + 1}. ${modelType(model)} : ${model.label}`,
        `   Partie du corps : ${model.zone}`,
        `   Quantité : ${model.quantity}${photo}`,
      ].join("\n");
    }),
    "",
    "COMMENTAIRE",
    comment || "Aucun commentaire.",
  ];
  if (photos) lines.push("", `Pièces jointes : ${photos}.`);

  // ---------- Version HTML ----------
  const modelItems = models
    .map((model) => {
      const photo = model.filename
        ? `<br><span style="color:${COLORS.muted}">Photo jointe : ${escapeHtml(model.filename)}</span>`
        : "";
      return `<li style="margin:0 0 12px"><strong>${escapeHtml(modelType(model))} : ${escapeHtml(model.label)}</strong><br>Partie du corps : ${escapeHtml(model.zone)}<br>Quantité : ${escapeHtml(model.quantity)}${photo}</li>`;
    })
    .join("");

  const phone = escapeHtml(booking.telephone);
  const href = phoneHref(booking.telephone);
  const phoneHtml = href
    ? `<a href="${escapeHtml(href)}" style="color:${COLORS.title}">${phone}</a>`
    : phone;

  const commentHtml = comment
    ? escapeHtml(comment).replace(/\r?\n/g, "<br>")
    : `<span style="color:${COLORS.muted}">Aucun commentaire.</span>`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:${COLORS.text};line-height:1.6;max-width:640px;margin:0 auto;padding:8px">
<h1 style="margin:0 0 12px;font-size:22px;color:${COLORS.title}">Nouvelle demande de rendez-vous</h1>
<p style="margin:0 0 4px"><strong>${escapeHtml(fullName)}</strong> demande un rendez-vous le <strong>${escapeHtml(when)}</strong> à <strong>${escapeHtml(booking.ville)}</strong>.</p>
<p style="margin:0;color:${COLORS.muted}">Pensez à la recontacter pour confirmer le créneau.</p>
${sectionTitle("Rendez-vous")}
<table style="border-collapse:collapse">${tableRow("Date", escapeHtml(when))}${tableRow("Ville", escapeHtml(booking.ville))}${tableRow("Personnes", escapeHtml(booking.participants))}${tableRow("Niveau souhaité", escapeHtml(booking.niveau))}</table>
${sectionTitle("Coordonnées")}
<table style="border-collapse:collapse">${tableRow("Nom", escapeHtml(fullName))}${tableRow("Téléphone", phoneHtml)}${tableRow("E-mail", escapeHtml(booking.email))}</table>
<p style="margin:8px 0 0;color:${COLORS.muted};font-size:14px">Pour lui répondre, utilisez simplement « Répondre » sur cet e-mail.</p>
${sectionTitle(`Modèles (${escapeHtml(modelCount)})`)}
<ol style="margin:0;padding-left:20px">${modelItems}</ol>
${sectionTitle("Commentaire")}
<p style="margin:0">${commentHtml}</p>
${photos ? `<p style="margin:24px 0 0;color:${COLORS.muted};font-size:14px">Pièces jointes : ${escapeHtml(photos)}.</p>` : ""}
</div>`;

  return { text: lines.join("\n"), html };
}
