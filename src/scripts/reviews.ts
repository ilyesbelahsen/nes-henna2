interface GoogleReview {
  text: string;
  author: string;
  authorUrl: string | null;
  rating: number;
  relativeDate: string | null;
}

interface ReviewsResponse {
  configured: boolean;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string | null;
  reviews?: GoogleReview[];
}

function reviewsEndpoint() {
  const base = import.meta.env.PUBLIC_BOOKING_API_URL?.replace(/\/+$/, "");
  return base ? `${base}/reviews` : "/reviews";
}

function validExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function createReview(review: GoogleReview) {
  const figure = document.createElement("figure");
  figure.className = "review";
  const stars = document.createElement("div");
  stars.className = "stars";
  stars.setAttribute("aria-label", `${review.rating} étoiles sur 5`);
  stars.textContent = "★".repeat(Math.round(review.rating));
  const quote = document.createElement("blockquote");
  quote.textContent = `« ${review.text} »`;
  const caption = document.createElement("figcaption");
  caption.textContent = review.author;
  if (review.relativeDate) caption.append(` · ${review.relativeDate}`);
  const authorUrl = validExternalUrl(review.authorUrl);
  if (authorUrl) {
    const link = document.createElement("a");
    link.href = authorUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Voir sur Google";
    caption.append(" · ", link);
  }
  figure.append(stars, quote, caption);
  return figure;
}

export async function initializeGoogleReviews() {
  const endpoint = reviewsEndpoint();
  const track = document.querySelector<HTMLElement>(
    "[data-google-reviews-track]",
  );
  if (!endpoint || !track) return;

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      console.warn("[Avis Google] Réponse serveur invalide :", response.status);
      return;
    }
    const body = (await response.json()) as ReviewsResponse;
    console.info("[Avis Google] Avis récupérés :", {
      configured: body.configured,
      rating: body.rating ?? 0,
      userRatingCount: body.userRatingCount ?? 0,
      reviews: body.reviews ?? [],
    });
    if (!body.configured || !body.reviews?.length) return;

    track.replaceChildren(...body.reviews.map(createReview));
    const attribution = document.querySelector<HTMLElement>(
      "[data-google-reviews-attribution]",
    );
    if (attribution) {
      attribution.hidden = false;
      const mapsUrl = validExternalUrl(body.googleMapsUri ?? null);
      if (mapsUrl) {
        const link = document.createElement("a");
        link.href = mapsUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Avis publiés sur Google";
        attribution.replaceChildren(link);
      }
    }
    window.dispatchEvent(new Event("reviews:updated"));
  } catch {
    console.warn("[Avis Google] Impossible de récupérer les avis.");
    // Les témoignages de secours restent visibles si l'API est indisponible.
  }
}
