import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import shows from "../data/support.js";

const router = express.Router();
router.use(requireAuth);

const CACHE_MS = 24 * 60 * 60 * 1000;
let cache = null;

async function fetchDetails() {
  const ids = shows.map((s) => s.id).join(",");
  const response = await fetch(
    `https://itunes.apple.com/lookup?id=${ids}&entity=podcast`
  );
  if (!response.ok) {
    throw new Error(`iTunes status ${response.status}`);
  }
  const data = await response.json();
  const byId = new Map();
  for (const r of data.results || []) {
    byId.set(r.collectionId, r);
  }
  return byId;
}

router.get("/", async (req, res) => {
  if (cache && Date.now() - cache.time < CACHE_MS) {
    return res.json(cache.items);
  }

  let details = new Map();
  let fromApi = true;
  try {
    details = await fetchDetails();
  } catch (err) {
    console.error("Podcast lookup failed:", err.message);
    fromApi = false;
  }

  const items = shows.map((s) => {
    const d = details.get(s.id);
    const apiLink = d?.collectionViewUrl;
    const link =
      apiLink && apiLink.startsWith("https://podcasts.apple.com/")
        ? apiLink
        : `https://podcasts.apple.com/podcast/id${s.id}`;
    return {
      id: s.id,
      name: s.name,
      by: s.by,
      tag: s.tag,
      why: s.why,
      note: s.note || null,
      artwork: d?.artworkUrl600 || null,
      link,
    };
  });

  if (fromApi) {
    cache = { time: Date.now(), items };
  }
  res.json(items);
});

export default router;