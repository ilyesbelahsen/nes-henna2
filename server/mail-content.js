function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function safeFilename(filename) {
  return String(filename).replace(/[\\/\r\n"]/g, "_");
}

export function buildBookingEmailContent(booking, when, files) {
  const uploadedModels = booking.models.filter(
    (model) => model.kind === "upload",
  );
  if (uploadedModels.length !== files.length) {
    throw new Error("Les photos ne correspondent pas aux modèles sélectionnés.");
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
  const lines = [
    `Bonjour ${booking.prenom},`,
    "",
    "Une nouvelle demande de rendez-vous a été enregistrée.",
    "",
    "RENDEZ-VOUS",
    `Date : ${when}`,
    `Ville : ${booking.ville}`,
    `Nombre de personnes : ${booking.participants}`,
    `Niveau souhaité : ${booking.niveau}`,
    "",
    "COORDONNÉES",
    `Nom : ${booking.prenom} ${booking.nom}`,
    `Téléphone : ${booking.telephone}`,
    `E-mail : ${booking.email}`,
    "",
    `MODÈLES (${modelCount})`,
    ...models.map((model, index) => {
      const type =
        model.kind === "upload" ? "Photo importée" : "Modèle de la galerie";
      const photo = model.filename ? ` — fichier joint : ${model.filename}` : "";
      return [
        `${index + 1}. ${type} : ${model.label}`,
        `   Partie du corps : ${model.zone}`,
        `   Quantité : ${model.quantity}${photo}`,
      ].join("\n");
    }),
    "",
    "COMMENTAIRE",
    booking.commentaire || "Aucun commentaire.",
  ];

  const modelRows = models
    .map((model) => {
      const type =
        model.kind === "upload" ? "Photo importée" : "Modèle de la galerie";
      const photo = model.filename
        ? `<br><span style="color:#6f5560">Photo jointe : ${escapeHtml(model.filename)}</span>`
        : "";
      return `<li style="margin:0 0 12px"><strong>${escapeHtml(type)} : ${escapeHtml(model.label)}</strong><br>Partie du corps : ${escapeHtml(model.zone)}<br>Quantité : ${model.quantity}${photo}</li>`;
    })
    .join("");
  const comment = booking.commentaire
    ? escapeHtml(booking.commentaire).replace(/\r?\n/g, "<br>")
    : "Aucun commentaire.";

  return {
    text: lines.join("\n"),
    html: `<div style="font-family:Arial,sans-serif;color:#2a1420;line-height:1.6;max-width:640px"><h1 style="color:#a30d2d">Demande de rendez-vous</h1><p>Bonjour ${escapeHtml(booking.prenom)}, une nouvelle demande a été enregistrée.</p><h2 style="color:#a30d2d">Rendez-vous</h2><table style="border-collapse:collapse"><tr><th align="left" style="padding:4px 16px 4px 0">Date</th><td>${escapeHtml(when)}</td></tr><tr><th align="left" style="padding:4px 16px 4px 0">Ville</th><td>${escapeHtml(booking.ville)}</td></tr><tr><th align="left" style="padding:4px 16px 4px 0">Personnes</th><td>${booking.participants}</td></tr><tr><th align="left" style="padding:4px 16px 4px 0">Niveau souhaité</th><td>${escapeHtml(booking.niveau)}</td></tr></table><h2 style="color:#a30d2d">Coordonnées</h2><p><strong>Nom :</strong> ${escapeHtml(booking.prenom)} ${escapeHtml(booking.nom)}<br><strong>Téléphone :</strong> ${escapeHtml(booking.telephone)}<br><strong>E-mail :</strong> ${escapeHtml(booking.email)}</p><h2 style="color:#a30d2d">Modèles (${modelCount})</h2><ol>${modelRows}</ol><h2 style="color:#a30d2d">Commentaire</h2><p>${comment}</p><p style="color:#6f5560">${files.length} photo(s) jointe(s) à cet e-mail.</p></div>`,
  };
}
