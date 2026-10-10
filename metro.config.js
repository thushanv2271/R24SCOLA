const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Route React Native's Text and TextInput through font-aware wrappers so the
// app font applies everywhere, including react-native-paper.
const overrides = {
  "./Libraries/Text/Text": path.resolve(__dirname, "components/ui/typography/Text.js"),
  "./Libraries/Components/TextInput/TextInput": path.resolve(__dirname, "components/ui/typography/TextInput.js"),
};
const normalized = (p) => p.split(path.sep).join("/");
const defaultResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = normalized(context.originModulePath || "");
  if (overrides[moduleName] && origin.endsWith("node_modules/react-native/index.js")) {
    return { type: "sourceFile", filePath: overrides[moduleName] };
  }
  return (defaultResolve || context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
