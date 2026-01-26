#!/usr/bin/env node
/**
 * Скрипт для патча ExpoModulesProvider.swift после pod install
 * Добавляет SubjectLifterModule в список зарегистрированных модулей Expo
 *
 * Использование: node scripts/patch-expo-modules.js
 */

const path = require('path');
const { patchExpoModulesProvider } = require('../modules/subject-lifter-plugin');

const projectRoot = path.join(__dirname, '..');

console.log('[Patch Script] Patching ExpoModulesProvider...');
const success = patchExpoModulesProvider(projectRoot);

if (success) {
  console.log('[Patch Script] ✅ Done!');
  process.exit(0);
} else {
  console.error('[Patch Script] ❌ Failed to patch');
  process.exit(1);
}
