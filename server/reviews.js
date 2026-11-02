const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places";
const DEFAULT_CACHE_TTL = 6 * 60 * 60 * 1000;

let cache = null;

function parseReview(review) {
  const text = review?.text?.text;
  const author = review?.authorAttribution;
  const rating = Number(review?.rating);
  if (
    typeof text !== "string" ||
    !text.trim() ||
    typeof author?.displayName !== "string" ||
    !Number.isFinite(rating)
  ) {
    return null;
  }
  return {
    text: text.trim(),
    author: author.displayName.trim(),
    authorUrl: typeof author.uri === "string" ? author.uri : null,
    authorPhoto: typeof author.photoUri === "string" ? author.photoUri : null,
    rating: Math.min(5, Math.max(1, rating)),
    publishedAt:
      typeof review.publishTime === "string" ? review.publishTime : null,
    relativeDate:
      typeof review.relativePublishTimeDescription === "string"
        ? review.relativePublishTimeDescription
        : null,
    url: typeof review.googleMapsUri === "string" ? review.googleMapsUri : null,
  };
}

function parseResponse(body) {
  const reviews = body?.reviews ?? [];
  const rating = Number(body?.rating ?? 0);
  const userRatingCount = Number(body?.userRatingCount ?? 0);
  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray(reviews) ||
    !Number.isFinite(rating) ||
    !Number.isFinite(userRatingCount)
  ) {
    throw new Error("Réponse Google Places invalide.");
  }
  return {
    rating,
    userRatingCount,
    googleMapsUri:
      typeof body.googleMapsUri === "string" ? body.googleMapsUri : null,
    reviews: reviews.map(parseReview).filter(Boolean).slice(0, 5),
  };
}

function getConfig() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  const cacheTtl = Number(process.env.REVIEWS_CACHE_TTL ?? "");
  return {
    apiKey,
    placeId,
    cacheTtl:
      Number.isFinite(cacheTtl) && cacheTtl > 0 ? cacheTtl : DEFAULT_CACHE_TTL,
  };
}

export async function getReviews() {
  const { apiKey, placeId, cacheTtl } = getConfig();
  if (!apiKey || !placeId) {
    return { configured: false, reviews: [] };
  }
  if (cache && cache.expiresAt > Date.now()) {
    return { configured: true, ...cache.value, cached: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(
      `${GOOGLE_PLACES_URL}/${encodeURIComponent(placeId)}?languageCode=fr`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
          "Accept-Language": "fr-FR",
        },
        signal: controller.signal,
      },
    );
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`Google Places HTTP ${response.status}.`);
    }
    const value = parseResponse(body);
    cache = { value, expiresAt: Date.now() + cacheTtl };
    return { configured: true, ...value, cached: false };
  } catch (error) {
    if (cache) {
      console.error(
        "reviews: Google indisponible, cache utilisé",
        error.message,
      );
      return { configured: true, ...cache.value, cached: true, stale: true };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
