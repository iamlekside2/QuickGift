const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// lucide-react-native ships ESM (.mjs) icons behind a package `exports` map.
// Metro needs package-exports resolution + .mjs in sourceExts to import them
// per-icon (lucide-react-native/icons/<name>) without pulling the whole barrel.
config.resolver.unstable_enablePackageExports = true;
if (!config.resolver.sourceExts.includes("mjs")) {
  config.resolver.sourceExts.push("mjs");
}

module.exports = withNativeWind(config, { input: "./global.css" });
