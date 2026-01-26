const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin для добавления SubjectLifter native module
 * Использует локальный Pod для правильной интеграции с Expo Modules
 */
function withSubjectLifter(config) {
  // Шаг 0: Убеждаемся что deployment target правильный в Podfile.properties.json
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const propsPath = path.join(projectRoot, 'ios', 'Podfile.properties.json');

      console.log('[SubjectLifter Plugin] Checking Podfile.properties.json...');

      let props = {};
      if (fs.existsSync(propsPath)) {
        props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
      }

      // Устанавливаем минимальный deployment target для Apple Vision (Vision.framework)
      if (props['ios.deploymentTarget'] !== '16.0') {
        props['ios.deploymentTarget'] = '16.0';
        fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));
        console.log('[SubjectLifter Plugin] ✅ Set ios.deploymentTarget to 16.0');
      }

      return config;
    },
  ]);

  // Шаг 1: Модифицируем Podfile для добавления локального pod
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');

      console.log('[SubjectLifter Plugin] Modifying Podfile...');

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // Проверяем, не добавлен ли уже pod
      if (!podfileContent.includes('SubjectLifter')) {
        // Добавляем pod после use_expo_modules!
        podfileContent = podfileContent.replace(
          'use_expo_modules!',
          `use_expo_modules!

  # SubjectLifter - Apple Vision (Vision.framework) Background Removal
  pod 'SubjectLifter', :path => '../modules/subject-lifter/ios'`,
        );

        fs.writeFileSync(podfilePath, podfileContent);
        console.log('[SubjectLifter Plugin] ✅ Added SubjectLifter pod to Podfile');
      } else {
        console.log('[SubjectLifter Plugin] ℹ️ SubjectLifter pod already in Podfile');
      }

      return config;
    },
  ]);

  // Шаг 2: Добавляем Vision.framework и обновляем deployment target в Xcode проект
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;

    console.log('[SubjectLifter Plugin] Adding Vision.framework...');
    xcodeProject.addFramework('Vision.framework', {
      link: true,
      weak: false,
    });
    console.log('[SubjectLifter Plugin] ✅ Vision.framework added');

    // Обновляем deployment target для всех build configurations
    console.log('[SubjectLifter Plugin] Setting IPHONEOS_DEPLOYMENT_TARGET to 16.0...');
    const buildConfigs = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in buildConfigs) {
      if (buildConfigs[key].buildSettings) {
        buildConfigs[key].buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '16.0';
      }
    }
    console.log('[SubjectLifter Plugin] ✅ Deployment target set to 16.0');

    return config;
  });

  return config;
}

/**
 * Патчит ExpoModulesProvider.swift для добавления SubjectLifterModule
 * Вызывается ПОСЛЕ pod install
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
    console.log('[SubjectLifter] ExpoModulesProvider.swift not found (run pod install first)');
    return false;
  }

  let content = fs.readFileSync(providerPath, 'utf8');

  // Проверяем, не добавлен ли уже
  if (content.includes('SubjectLifterModule')) {
    console.log('[SubjectLifter] ExpoModulesProvider.swift already patched');
    return true;
  }

  console.log('[SubjectLifter] Patching ExpoModulesProvider.swift...');

  // Добавляем import
  content = content.replace(
    'import ExpoModulesCore',
    'import ExpoModulesCore\nimport SubjectLifter',
  );

  // Патчим DEBUG секцию - добавляем после DevMenuPreferences.self
  content = content.replace(
    /DevMenuPreferences\.self\n(\s*)\]/g,
    'DevMenuPreferences.self,\n$1SubjectLifterModule.self\n$1]',
  );

  // Патчим RELEASE секцию - находим последний WebBrowserModule.self перед #endif
  // и добавляем SubjectLifterModule
  content = content.replace(
    /WebBrowserModule\.self\n(\s*)\]\n(\s*)#endif\s*$/gm,
    'WebBrowserModule.self,\n$1SubjectLifterModule.self\n$1]\n$2#endif',
  );

  fs.writeFileSync(providerPath, content);
  console.log('[SubjectLifter] ✅ ExpoModulesProvider.swift patched!');
  return true;
}

// Экспортируем функцию патча для использования из скрипта
module.exports = withSubjectLifter;
module.exports.patchExpoModulesProvider = patchExpoModulesProvider;

module.exports = withSubjectLifter;
