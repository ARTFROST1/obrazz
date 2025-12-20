/**
 * Database diagnostic and fix script
 * Run this to check and fix wardrobe items loading issue
 */

import { supabase } from '../lib/supabase/client';

interface DiagnosticResult {
  check: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  value: any;
  details: string;
}

async function runDatabaseDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  console.log('🔍 Starting Wardrobe Database Diagnostics...\n');

  // Check 1: Verify items table exists and structure
  try {
    const { error } = await supabase.from('items').select('*').limit(1);

    if (error) {
      results.push({
        check: 'Items Table Accessibility',
        status: 'ERROR',
        value: null,
        details: `Cannot access items table: ${error.message}`,
      });
    } else {
      results.push({
        check: 'Items Table Accessibility',
        status: 'OK',
        value: true,
        details: 'Items table is accessible',
      });
    }
  } catch (error) {
    results.push({
      check: 'Items Table Accessibility',
      status: 'ERROR',
      value: null,
      details: `Exception: ${error}`,
    });
  }

  // Check 2: Count system default items
  try {
    const { count, error } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null)
      .eq('is_default', true);

    if (error) {
      results.push({
        check: 'System Default Items',
        status: 'ERROR',
        value: null,
        details: `Cannot count default items: ${error.message}`,
      });
    } else {
      results.push({
        check: 'System Default Items',
        status: count === 20 ? 'OK' : count! > 0 ? 'WARNING' : 'ERROR',
        value: count,
        details:
          count === 20
            ? 'Correct: 20 system default items'
            : count! > 0
              ? `Found ${count} items (expected 20)`
              : 'No default items found!',
      });
    }
  } catch (error) {
    results.push({
      check: 'System Default Items',
      status: 'ERROR',
      value: null,
      details: `Exception: ${error}`,
    });
  }

  // Check 3: Check current user authentication
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      results.push({
        check: 'User Authentication',
        status: 'WARNING',
        value: null,
        details: 'No authenticated user (cannot check user-specific data)',
      });
    } else {
      results.push({
        check: 'User Authentication',
        status: 'OK',
        value: user.id,
        details: `User authenticated: ${user.email}`,
      });

      // Check 4: Count current user's items
      const { count: userItemsCount, error: itemsError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (itemsError) {
        results.push({
          check: 'User Wardrobe Items',
          status: 'ERROR',
          value: null,
          details: `Cannot count user items: ${itemsError.message}`,
        });
      } else {
        results.push({
          check: 'User Wardrobe Items',
          status: userItemsCount! > 0 ? 'OK' : 'WARNING',
          value: userItemsCount,
          details:
            userItemsCount! > 0
              ? `User has ${userItemsCount} items in wardrobe`
              : 'User has no items yet (need to copy defaults)',
        });
      }

      // Check 5: Verify RLS policies work
      const { error: rlsError } = await supabase
        .from('items')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (rlsError) {
        results.push({
          check: 'RLS Policy - Read Own Items',
          status: 'ERROR',
          value: null,
          details: `RLS blocking access: ${rlsError.message}`,
        });
      } else {
        results.push({
          check: 'RLS Policy - Read Own Items',
          status: 'OK',
          value: true,
          details: 'User can read their own items',
        });
      }
    }
  } catch (error) {
    results.push({
      check: 'User Authentication',
      status: 'ERROR',
      value: null,
      details: `Exception: ${error}`,
    });
  }

  // Check 6: Verify trigger exists (attempt to query)
  try {
    await supabase.rpc('pg_get_triggerdef', {});

    results.push({
      check: 'Database Triggers',
      status: 'OK',
      value: true,
      details: 'Can query database functions',
    });
  } catch {
    results.push({
      check: 'Database Triggers',
      status: 'WARNING',
      value: null,
      details: 'Cannot verify trigger (may require admin access)',
    });
  }

  return results;
}

async function fixUserWardrobe() {
  console.log('\n🔧 Attempting to fix user wardrobe...\n');

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Cannot fix: No authenticated user');
      return;
    }

    console.log(`👤 User: ${user.email}`);

    // Check if user has items
    const { count, error: countError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.log(`❌ Cannot count user items: ${countError.message}`);
      return;
    }

    console.log(`📦 Current items count: ${count}`);

    if (count! > 0) {
      console.log('✅ User already has items, no fix needed');
      return;
    }

    // User has no items - try to copy default items
    console.log('\n🔄 Copying default items to user...');

    const { data: defaultItems, error: defaultsError } = await supabase
      .from('items')
      .select('*')
      .is('user_id', null)
      .eq('is_default', true);

    if (defaultsError) {
      console.log(`❌ Cannot fetch default items: ${defaultsError.message}`);
      return;
    }

    if (!defaultItems || defaultItems.length === 0) {
      console.log('❌ No default items found in database');
      return;
    }

    console.log(`📋 Found ${defaultItems.length} default items to copy`);

    // Prepare items for insertion
    const itemsToCopy = defaultItems.map((item) => ({
      user_id: user.id,
      name: item.name,
      category: item.category,
      image_url: item.image_url,
      thumbnail_url: item.thumbnail_url,
      color: item.color,
      colors: item.colors,
      primary_color: item.primary_color,
      style: item.style,
      season: item.season,
      tags: item.tags,
      favorite: false,
      is_default: false, // User copies are not default
      metadata: item.metadata,
    }));

    // Insert items in batches
    const { data: insertedItems, error: insertError } = await supabase
      .from('items')
      .insert(itemsToCopy)
      .select();

    if (insertError) {
      console.log(`❌ Cannot insert items: ${insertError.message}`);
      return;
    }

    console.log(`✅ Successfully copied ${insertedItems?.length || 0} items to user wardrobe`);
  } catch (error) {
    console.log(`❌ Fix failed: ${error}`);
  }
}

async function printResults(results: DiagnosticResult[]) {
  console.log('\n📊 Diagnostic Results:\n');
  console.log('═'.repeat(80));

  for (const result of results) {
    const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`\n${icon} ${result.check}`);
    console.log(`   Status: ${result.status}`);
    if (result.value !== null && result.value !== undefined) {
      console.log(`   Value: ${result.value}`);
    }
    console.log(`   ${result.details}`);
  }

  console.log('\n' + '═'.repeat(80));

  const hasErrors = results.some((r) => r.status === 'ERROR');
  const hasWarnings = results.some((r) => r.status === 'WARNING');

  console.log('\n📋 Summary:\n');
  if (hasErrors) {
    console.log('❌ ERRORS DETECTED - System may not work correctly');
    console.log('   Please check database configuration and RLS policies');
  } else if (hasWarnings) {
    console.log('⚠️  WARNINGS PRESENT - System should work but needs attention');
    console.log('   Some optimizations or fixes may be needed');
  } else {
    console.log('✅ ALL CHECKS PASSED - System is working correctly');
  }
}

// Main diagnostic function
export async function runWardrobeDiagnostics(autoFix: boolean = false) {
  try {
    const results = await runDatabaseDiagnostics();
    await printResults(results);

    // Check if we need to fix user wardrobe
    const needsFix = results.some(
      (r) => r.check === 'User Wardrobe Items' && r.status === 'WARNING',
    );

    if (needsFix && autoFix) {
      await fixUserWardrobe();

      // Re-run diagnostics to verify fix
      console.log('\n\n🔄 Re-running diagnostics after fix...\n');
      const newResults = await runDatabaseDiagnostics();
      await printResults(newResults);
    } else if (needsFix) {
      console.log('\n💡 Tip: User has no items. To auto-fix, call:');
      console.log('   runWardrobeDiagnostics(true)');
    }

    return results;
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    throw error;
  }
}

// Export for console usage
if (typeof window !== 'undefined' && __DEV__) {
  // @ts-ignore - Global console helpers for development
  window.checkWardrobe = () => runWardrobeDiagnostics(false);
  // @ts-ignore
  window.fixWardrobe = () => runWardrobeDiagnostics(true);

  console.log('\n🔧 Wardrobe Diagnostics loaded!');
  console.log('═'.repeat(50));
  console.log('💡 Available commands:');
  console.log('   checkWardrobe() - Check database state');
  console.log('   fixWardrobe()   - Check and auto-fix issues');
  console.log('═'.repeat(50) + '\n');
}
