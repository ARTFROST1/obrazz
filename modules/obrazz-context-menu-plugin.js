const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for adding ObrazzContextMenu native view module.
 * Adds a local Pod so we can use UIContextMenuInteraction via Expo Modules.
 */
function withObrazzContextMenu(config) {
  // Ensure iOS deployment target is 16.0 (matches the module + app requirements)
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const propsPath = path.join(projectRoot, 'ios', 'Podfile.properties.json');

      let props = {};
      if (fs.existsSync(propsPath)) {
        props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
      }

      if (props['ios.deploymentTarget'] !== '16.0') {
        props['ios.deploymentTarget'] = '16.0';
        fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));
      }

      return config;
    },
  ]);

  // Add local pod
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      if (!podfileContent.includes("pod 'ObrazzContextMenu'")) {
        // Insert right after use_expo_modules!
        podfileContent = podfileContent.replace(
          'use_expo_modules!',
          `use_expo_modules!\n\n  # ObrazzContextMenu - UIContextMenuInteraction (native iOS context menu)\n  pod 'ObrazzContextMenu', :path => '../modules/obrazz-context-menu/ios'`,
        );

        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);

  return config;
}

/**
 * Patch ExpoModulesProvider.swift to register ObrazzContextMenuModule.
 * Call after `pod install`.
 */
function patchExpoModulesProvider(projectRoot) {
  const providerPath = path.join(
    projectRoot,
    'ios',
    'Pods',
    'Target Support Files',
    'Pods-obrazz',
    'ExpoModulesProvider.swift',
  );

  if (!fs.existsSync(providerPath)) {
    return false;
  }

  let content = fs.readFileSync(providerPath, 'utf8');

  if (!content.includes('import ObrazzContextMenu')) {
    if (content.includes('import SubjectLifter')) {
      content = content.replace(
        'import SubjectLifter',
        'import SubjectLifter\nimport ObrazzContextMenu',
      );
    } else {
      content = content.replace(
        'import ExpoModulesCore',
        'import ExpoModulesCore\nimport ObrazzContextMenu',
      );
    }
  }

  if (!content.includes('ObrazzContextMenuModule.self')) {
    if (content.includes('SubjectLifterModule.self,')) {
      content = content.replace(
        'SubjectLifterModule.self,',
        'SubjectLifterModule.self,\n      ObrazzContextMenuModule.self,',
      );
    } else if (content.includes('WebBrowserModule.self,')) {
      content = content.replace(
        'WebBrowserModule.self,',
        'WebBrowserModule.self,\n      ObrazzContextMenuModule.self,',
      );
    }

    if (content.includes('SubjectLifterModule.self\n')) {
      content = content.replace(
        'SubjectLifterModule.self\n',
        'SubjectLifterModule.self,\n      ObrazzContextMenuModule.self\n',
      );
    } else if (content.includes('WebBrowserModule.self\n')) {
      content = content.replace(
        'WebBrowserModule.self\n',
        'WebBrowserModule.self,\n      ObrazzContextMenuModule.self\n',
      );
    }
  }

  fs.writeFileSync(providerPath, content);
  return true;
}

module.exports = withObrazzContextMenu;
module.exports.patchExpoModulesProvider = patchExpoModulesProvider;
