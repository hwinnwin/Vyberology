const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  path.join(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.join(projectRoot, 'node_modules/react'),
  'react-dom': path.join(projectRoot, 'node_modules/react-dom'),
};

module.exports = config;
