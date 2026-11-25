import express from "express";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();
router.use(requireAuth);

const TOPICS = {
  stress: "5 minute guided meditation for stress relief",
  anxiety: "guided meditation for anxiety calm",
  sleep: "guided sleep meditation",
  focus: "short guided meditation for focus",
  breathing: "guided breathing exercise relaxation",
};

const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

router.get("/", async (req, res) => {
  const topic = TOPICS[req.query.topic] ? req.query.topic : "stress";

  const cached = cache.get(topic);
  if (cached && Date.now() - cached.time < CACHE_MS) {
    return res.json(cached.items);
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return res
      .status(503)
      .json({ error: "The meditation library isn't set up yet" });
  }

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: TOPICS[topic],
      type: "video",
      videoEmbeddable: "true",
      safeSearch: "strict",
      maxResults: "6",
      key: process.env.YOUTUBE_API_KEY,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );

    if (!response.ok) {
      console.error("YouTube API error, status:", response.status);
      return res
        .status(502)
        .json({ error: "Could not load meditations right now" });
    }

    const data = await response.json();
    const items = (data.items || []).map((i) => ({
      videoId: i.id.videoId,
      title: i.snippet.title,
      channel: i.snippet.channelTitle,
      thumbnail: i.snippet.thumbnails?.medium?.url,
    }));

    cache.set(topic, { time: Date.now(), items });
    res.json(items);
  } catch (err) {
    console.error("Meditation fetch failed");
    res.status(502).json({ error: "Could not load meditations right now" });
  }
});

export default router;