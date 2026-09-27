const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.join(__dirname, "..");
const out = path.join(os.tmpdir(), "huilv-build");
const dist = path.join(root, "dist");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(dist, { recursive: true });

const env = {
  ...process.env,
  CSC_IDENTITY_AUTO_DISCOVERY: "false",
  ELECTRON_MIRROR: process.env.ELECTRON_MIRROR || "https://npmmirror.com/mirrors/electron/",
  ELECTRON_BUILDER_BINARIES_MIRROR:
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||
    "https://npmmirror.com/mirrors/electron-builder-binaries/",
};

function run(args) {
  const result = spawnSync("npx", ["electron-builder", ...args], {
    cwd: root,
    env,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

run(["--win", "dir", `--config.directories.output=${out}`]);
run([
  "--win",
  "portable",
  "--prepackaged",
  path.join(out, "win-unpacked"),
  `--config.directories.output=${out}`,
]);

const exeName = "汇率通-1.0.0-portable.exe";
const builtExe = path.join(out, exeName);
if (!fs.existsSync(builtExe)) {
  console.error("未找到生成的 exe:", builtExe);
  process.exit(1);
}

fs.copyFileSync(builtExe, path.join(dist, exeName));
console.log("\n打包完成:", path.join(dist, exeName));
