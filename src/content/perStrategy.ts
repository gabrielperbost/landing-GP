export const PER_STRATEGY = {
  bookingUrl:
    process.env.NEXT_PUBLIC_PER_CALENDLY_URL?.trim() ||
    "https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale",
  // Add the VSL URL here, or configure PER_STRATEGY_VIDEO_URL when it is ready.
  video: {
    src: process.env.PER_STRATEGY_VIDEO_URL?.trim() || "",
    poster: process.env.PER_STRATEGY_VIDEO_POSTER_URL?.trim() || ""
  }
};
