const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// expo-router uses `require('query-string')`; v8+ is ESM-only and breaks `stringify` under Metro.
const queryStringRoot = path.dirname(
  require.resolve('query-string/package.json', { paths: [projectRoot] })
);
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'query-string': queryStringRoot,
};

module.exports = config;
