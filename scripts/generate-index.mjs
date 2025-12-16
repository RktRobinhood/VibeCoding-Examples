import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PROJECTS_DIR = path.join(ROOT, "projects");
const DIST_DIR = path.join(ROOT, "dist");
const DIST_PROJECTS = path.join(DIST_DIR, "projects");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function rmDirIfExists(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      if (entry === ".DS_Store") continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleFromHtml(html) {
  const m = html.match(/<title>([^<]{1,140})<\/title>/i);
  return m ? m[1].trim() : null;
}

function niceName(folder) {
  return folder
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function findProjects() {
  const projects = [];
  if (!fs.existsSync(PROJECTS_DIR)) return projects;

  for (const dirent of fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;

    const folder = dirent.name;
    const indexPath = path.join(PROJECTS_DIR, folder, "index.html");
    if (!fs.existsSync(indexPath)) continue;

    const html = fs.readFileSync(indexPath, "utf8");
    const title = titleFromHtml(html) || niceName(folder);

    projects.push({
      folder,
      title,
      href: `./projects/${folder}/index.html`,
    });
  }

  projects.sort((a, b) => a.title.localeCompare(b.title));
  return projects;
}

function generateIndex(projects) {
  const list =
    projects.length === 0
      ? `<li><em>No projects found.</em> Add <code>projects/&lt;name&gt;/index.html</code></li>`
      : projects
          .map(
            (p) =>
              `<li><a href="${p.href}">${escapeHtml(p.title)}</a> <span class="meta">projects/${escapeHtml(
                p.folder
              )}/</span></li>`
          )
          .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Projects</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;padding:24px;background:#0b1020;color:#e9ecff}
    a{color:#9ac6ff;text-decoration:none} a:hover{text-decoration:underline}
    .wrap{max-width:920px;margin:0 auto}
    .card{border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;background:rgba(255,255,255,.04)}
    ul{line-height:1.9;margin:10px 0 0 18px}
    .meta{opacity:.7;font-size:12px;margin-left:8px}
    .hint{opacity:.8;margin:10px 0 0;font-size:13px;line-height:1.4}
    code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Projects</h1>
    <div class="card">
      <p class="hint">
        This index is generated automatically on every push. Add new projects as:
        <code>projects/&lt;name&gt;/index.html</code>
      </p>
      <ul>
        ${list}
      </ul>
    </div>
  </div>
</body>
</html>`;
}

// ---- Build steps ----
rmDirIfExists(DIST_DIR);
ensureDir(DIST_DIR);

// Copy projects folder into dist (so links work)
if (fs.existsSync(PROJECTS_DIR)) {
  copyRecursive(PROJECTS_DIR, DIST_PROJECTS);
}

// Write generated index
const projects = findProjects();
fs.writeFileSync(path.join(DIST_DIR, "index.html"), generateIndex(projects), "utf8");

// Avoid Jekyll interference (safe even when using Actions)
fs.writeFileSync(path.join(DIST_DIR, ".nojekyll"), "", "utf8");

console.log(`OK: generated dist/index.html with ${projects.length} project(s).`);
