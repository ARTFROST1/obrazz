/**
 * Database diagnostic script for default items system
 * Run this to check if default items are properly configured
 */

import { supabase } from '../lib/supabase/client';

interface DiagnosticResult {
  check: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  value: any;
  message: string;
}

async function runDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  console.log('🔍 Starting Default Items System Diagnostics...\n');

  // Check 1: System default items count
  try {
    const { data, error } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .is('user_id', null)
      .eq('is_default', true);

    if (error) throw error;

    const count = data?.length || 0;
    results.push({
      check: 'System Default Items',
      status: count === 20 ? 'OK' : count > 0 ? 'WARNING' : 'ERROR',
      value: count,
      message:
        count === 20
          ? 'Correct number of default items'
          : count > 0
            ? `Expected 20, found ${count}`
            : 'No default items found!',
    });
  } catch (error) {
    results.push({
      check: 'System Default Items',
      status: 'ERROR',
      value: null,
      message: `Failed to check: ${error}`,
    });
  }

  // Check 2: Bad default items (should be 0)
  try {
    const { data, error } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .not('user_id', 'is', null)
      .eq('is_default', true);

    if (error) throw error;

    const count = data?.length || 0;
    results.push({
      check: 'Bad Default Items',
      status: count === 0 ? 'OK' : 'ERROR',
      value: count,
      message:
        count === 0
          ? 'No corrupted default items'
          : `Found ${count} default items with user_id (should be 0)`,
    });
  } catch (error) {
    results.push({
      check: 'Bad Default Items',
      status: 'ERROR',
      value: null,
      message: `Failed to check: ${error}`,
    });
  }

  // Check 3: Current user's items
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      results.push({
        check: 'Current User Items',
        status: 'WARNING',
        value: null,
        message: 'No authenticated user',
      });
    } else {
      const { data, error } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;

      const count = data?.length || 0;
      results.push({
        check: 'Current User Items',
        status: count > 0 ? 'OK' : 'WARNING',
        value: count,
        message: count > 0 ? `User has ${count} items` : 'User has no items yet',
      });
    }
  } catch (error) {
    results.push({
      check: 'Current User Items',
      status: 'ERROR',
      value: null,
      message: `Failed to check: ${error}`,
    });
  }

  // Check 4: RLS policies
  try {
    // Try to read system defaults (should work)
    const { data: defaults, error: defaultsError } = await supabase
      .from('items')
      .select('id')
      .is('user_id', null)
      .eq('is_default', true)
      .limit(1);

    if (defaultsError) throw defaultsError;

    results.push({
      check: 'RLS Policy - Read Defaults',
      status: defaults && defaults.length > 0 ? 'OK' : 'WARNING',
      value: defaults?.length || 0,
      message:
        defaults && defaults.length > 0 ? 'Can read system defaults' : 'Cannot read defaults',
    });

    // Try to read own items (should work if authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: userItems, error: userError } = await supabase
        .from('items')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (userError) throw userError;

      results.push({
        check: 'RLS Policy - Read Own Items',
        status: 'OK',
        value: userItems?.length || 0,
        message: 'Can read own items',
      });
    }
  } catch (error) {
    results.push({
      check: 'RLS Policies',
      status: 'ERROR',
      value: null,
      message: `Failed to check: ${error}`,
    });
  }

  return results;
}

async function printResults(results: DiagnosticResult[]) {
  console.log('\n📊 Diagnostic Results:\n');
  console.log('─'.repeat(80));

  for (const result of results) {
    const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${icon} ${result.check}`);
    console.log(`   Status: ${result.status}`);
    if (result.value !== null && result.value !== undefined) {
      console.log(`   Value: ${result.value}`);
    }
    console.log(`   ${result.message}`);
    console.log('─'.repeat(80));
  }

  const hasErrors = results.some((r) => r.status === 'ERROR');
  const hasWarnings = results.some((r) => r.status === 'WARNING');

  console.log('\n📋 Summary:\n');
  if (hasErrors) {
    console.log('❌ Errors detected - system may not work correctly');
  } else if (hasWarnings) {
    console.log('⚠️  Warnings present - system should work but needs attention');
  } else {
    console.log('✅ All checks passed - system is working correctly');
  }
}

// Export for use in app
export async function checkDefaultItemsSystem() {
  try {
    const results = await runDiagnostics();
    await printResults(results);
    return results;
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    throw error;
  }
}

// Run diagnostics if executed directly
if (require.main === module) {
  checkDefaultItemsSystem()
    .then(() => {
      console.log('\n✨ Diagnostics complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Diagnostics failed:', error);
      process.exit(1);
    });
}
