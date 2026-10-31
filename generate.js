const fs = require("node:fs/promises");
const cheerio = require("cheerio");
const TARGET = 1000;
const DELAY = 1200;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function getDirectImageUrl(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  const match = thumbnailUrl.match(
    /th\.wallhaven\.cc\/(?:small|thumb|large)\/([a-z0-9]{2})\/(?:th-)?([a-z0-9]{6})\.(jpg|jpeg|png|webp)/i
  );
  if (!match) return null;
  const [, folder, id] = match;
  return `https://w.wallhaven.cc/full/${folder}/wallhaven-${id}.jpg`;
}
async function scrapePage(page) {
  const url = new URL("https://wallhaven.cc/search");
  url.searchParams.set("categories", "111");
  url.searchParams.set("purity", "100");
  url.searchParams.set("sorting", "toplist");
  url.searchParams.set("order", "desc");
  url.searchParams.set("page", page);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  const images = [];
  $('a[href^="/w/"]').each((_, element) => {
    const href = $(element).attr("href");
    const id = href?.match(/\/w\/([a-z0-9]{6})/i)?.[1];
    const img = $(element).find("img").first();
    const thumbnail =
      img.attr("data-src") ||
      img.attr("data-original") ||
      img.attr("src");
    const imageUrl = getDirectImageUrl(thumbnail);
    if (id && imageUrl) {
      images.push({
        wallhavenId: id,
        url: imageUrl
      });
    }
  });
  return images;
}
async function main() {
  const wallpapers = new Map();
  const maxPages = Math.ceil(TARGET / 24) + 10;
  for (
    let page = 1;
    page <= maxPages && wallpapers.size < TARGET;
    page++
  ) {
    console.log(`Scraping page ${page}...`);
    const images = await scrapePage(page);
    for (const image of images) {
      if (!wallpapers.has(image.wallhavenId)) {
        wallpapers.set(image.wallhavenId, image.url);
      }
      if (wallpapers.size >= TARGET) break;
    }
    console.log(`Collected: ${wallpapers.size}/${TARGET}`);
    if (images.length === 0) break;
    await sleep(DELAY);
  }
  const result = [...wallpapers.entries()].map(
    ([wallhavenId, url], index) => ({
      id: index + 1,
      wallhavenId,
      url
    })
  );
  await fs.writeFile(
    "wallpapers.json",
    JSON.stringify(result, null, 2),
    "utf8"
  );
  console.log(`Successfully saved ${result.length} URLs.`);
}
main().catch(console.error);
