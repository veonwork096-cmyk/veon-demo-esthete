// One-off image pipeline: client originals (downloaded once, outside the repo) -> public/images/<name>-<w>.{avif,webp}.
// Usage: node scripts/images.mjs <source-dir>
// Crops follow design/concept.md 8.9 (lens = square detail, people = 3:4 / 4:5, works = whole collage).
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) { console.error("usage: node scripts/images.mjs <source-dir>"); process.exit(2); }
const out = path.resolve("public/images");
fs.mkdirSync(out, { recursive: true });

/** name, file, crop {left, top, width, height} | null, widths */
const jobs = [
  ["hero-microscope", "hero-microscope.webp", { left: 500, top: 0, width: 628, height: 628 }, [360, 560, 628]],
  ["hero-veneer", "hero-veneer.webp", { left: 170, top: 20, width: 414, height: 414 }, [200, 414]],
  ["dir-microscope", "dir-microscope.jpg", null, [480, 800]],
  ["dir-implant", "dir-implant.jpg", { left: 0, top: 0, width: 711, height: 533 }, [480, 711]],
  ["dir-veneers", "dir-veneers.jpg", null, [600, 980]],
  ["dir-sedation", "dir-sedation.webp", { left: 560, top: 0, width: 1366, height: 1707 }, [400, 640]],
  ["dir-kids", "dir-kids.jpg", { left: 166, top: 0, width: 2667, height: 2000 }, [480, 800, 1200]],
  ["dir-lab", "dir-lab.webp", { left: 120, top: 0, width: 960, height: 1200 }, [480, 800]],
  ["team", "team.webp", null, [640, 960, 1200]],
  ["doc-slyvka", "doc-slyvka.webp", { left: 178, top: 0, width: 384, height: 480 }, [384]],
  ["doc-roziuk", "doc-roziuk.webp", { left: 190, top: 0, width: 360, height: 480 }, [360]],
  ["doc-stoika", "doc-stoika.webp", { left: 190, top: 0, width: 360, height: 480 }, [360]],
  ["doc-levkulych", "doc-levkulych.webp", { left: 190, top: 0, width: 360, height: 480 }, [360]],
  ["work-veneers", "work-veneers.jpg", null, [480, 968]],
  ["work-implant", "work-implant.jpg", { left: 0, top: 0, width: 724, height: 1342 }, [362, 724]],
  ["work-implant-2", "work-implant.jpg", { left: 744, top: 206, width: 936, height: 934 }, [480, 936]],
  ["online", "online.webp", { left: 426, top: 0, width: 1707, height: 1707 }, [360, 720]],
];

const manifest = {};
for (const [name, file, crop, widths] of jobs) {
  const base = () => { const s = sharp(path.join(src, file)); return crop ? s.extract(crop) : s; };
  const meta = await base().toBuffer({ resolveWithObject: true });
  const ratio = meta.info.height / meta.info.width;
  for (const w of widths) {
    const h = Math.round(w * ratio);
    await base().resize(w, h).avif({ quality: 52 }).toFile(path.join(out, `${name}-${w}.avif`));
    await base().resize(w, h).webp({ quality: 78 }).toFile(path.join(out, `${name}-${w}.webp`));
  }
  manifest[name] = { widths, ratio: +ratio.toFixed(4) };
  console.log(name, meta.info.width, "x", meta.info.height, widths.join(","));
}
// Logo: client PNG kept as PNG (no SVG from the client yet, R-203) + WebP.
await sharp(path.join(src, "logo.png")).resize(384).png({ compressionLevel: 9 }).toFile(path.join(out, "logo-384.png"));
await sharp(path.join(src, "logo.png")).webp({ quality: 90 }).toFile(path.join(out, "logo-768.webp"));
await sharp(path.join(src, "logo.png")).png({ compressionLevel: 9 }).toFile(path.join(out, "logo-768.png"));
fs.writeFileSync(path.resolve("src/data/images.json"), JSON.stringify(manifest, null, 2));
