// apps/mobile/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../.."); // repo root

const config = getDefaultConfig(projectRoot);

// Watch the workspace (so packages/* updates are seen)
config.watchFolders = [workspaceRoot];

// Resolve modules from the workspace root first to avoid duplicate React
config.resolver.nodeModulesPaths = [
  path.join(workspaceRoot, "node_modules"),
  path.join(projectRoot, "node_modules"),
];

// Helpful in monorepos
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
