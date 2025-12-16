const fs = require("fs");
const path = require("path");

const PROJECTS_DIR = path.join(__dirname, "..", "projects");
const OUTPUT_FILE = path.join(__dirname, "..", "index.html");

if (!fs.existsSync(PROJECTS_DIR)) {
  console.error("No /projects directory found.");
  process.exit(1);
}

const projects = fs
  .readdirSync(PROJECTS_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .filter(dirent =>
    fs.existsSync(path.join(PROJECTS_DIR, dirent.name, "index.html"))
  )
  .map(dirent => dirent.name)
  .sort();

const projectLinks = projects.map(name => {
  return `<li><a href="./projects/${name}/">${name}</a></li>`;
}).join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Demo Projects</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 16px;
      line-height: 1.6;
    }
    h1 {
      margin-bottom: 0.5em;
    }
    ul {
      padding-left: 1.2em;
    }
    li {
      margin: 0.4em 0;
    }
    a {
      text-decoration: none;
      color: #0055cc;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>Demo Projects</h1>
  <p>Select a project:</p>
  <ul>
    ${projectLinks || "<li>No projects found.</li>"}
  </ul>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_FILE, html, "utf8");
console.log(`Generated index with ${projects.length} projects.`);
