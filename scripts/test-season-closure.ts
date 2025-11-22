/**
 * Test script for Season Closure feature
 * This script tests the validation logic and package generation
 */

import { prisma } from '@/lib/prisma';
import { validateSeasonClosure } from '@/lib/season-closure/validation';
import { generateSeasonPackage } from '@/lib/season-closure/package-generator';

async function testSeasonClosure() {
  console.log('🧪 Testing Season Closure Feature...\n');

  try {
    // Get a test team (first team in database)
    const team = await prisma.team.findFirst({
      include: { users: true },
    });

    if (!team) {
      console.log('❌ No team found in database. Please create a team first.');
      return;
    }

    console.log(`✅ Found team: ${team.name}`);
    console.log(`   Season: ${team.season}`);
    console.log(`   Team ID: ${team.id}\n`);

    // Test 1: Validation
    console.log('📋 Test 1: Running validation...');
    const validationResult = await validateSeasonClosure(team.id, team.season);

    console.log(`   Budget Balanced: ${validationResult.budgetBalanced ? '✅' : '❌'}`);
    console.log(
      `   All Transactions Approved: ${validationResult.allTransactionsApproved ? '✅' : '❌'}`
    );
    console.log(
      `   All Receipts Present: ${validationResult.allReceiptsPresent ? '✅' : '❌'}`
    );
    console.log(`   Bank Reconciled: ${validationResult.bankReconciled ? '✅' : '⚠️'}`);
    console.log(`   Overall Valid: ${validationResult.isValid ? '✅' : '❌'}\n`);

    if (validationResult.errors.length > 0) {
      console.log('   Errors:');
      validationResult.errors.forEach((error) => {
        console.log(`     - ${error.message}`);
      });
      console.log('');
    }

    if (validationResult.warnings.length > 0) {
      console.log('   Warnings:');
      validationResult.warnings.forEach((warning) => {
        console.log(`     - ${warning.message}`);
      });
      console.log('');
    }

    // Test 2: Financial Summary
    console.log('💰 Test 2: Financial Summary');
    console.log(`   Total Income: $${validationResult.totalIncome.toFixed(2)}`);
    console.log(`   Total Expenses: $${validationResult.totalExpenses.toFixed(2)}`);
    console.log(`   Final Balance: $${validationResult.finalBalance.toFixed(2)}`);
    console.log(`   Total Transactions: ${validationResult.totalTransactions}`);
    console.log(`   Receipts: ${validationResult.receiptCount}\n`);

    // Test 3: Package Generation
    console.log('📦 Test 3: Generating season package (this may take a moment)...');
    const startTime = Date.now();
    const pkg = await generateSeasonPackage(team.id, team.season);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`   ✅ Package generated in ${duration}s`);
    console.log(`   Reports:`);
    console.log(`     - Final Budget: ${pkg.reports.finalBudget.length} bytes`);
    console.log(`     - Transaction History: ${pkg.reports.transactionHistory.length} bytes`);
    console.log(`     - Budget Variance: ${pkg.reports.budgetVariance.length} bytes`);
    console.log(`     - Audit Trail: ${pkg.reports.auditTrail.length} bytes`);
    console.log(`   Receipts: ${pkg.receipts.length} files`);
    console.log(`   Summary:`);
    console.log(`     - Total Income: $${pkg.summary.totalIncome.toFixed(2)}`);
    console.log(`     - Total Expenses: $${pkg.summary.totalExpenses.toFixed(2)}`);
    console.log(`     - Final Balance: $${pkg.summary.finalBalance.toFixed(2)}`);
    console.log(`     - Transactions: ${pkg.summary.transactionCount}`);
    console.log(`     - Receipts: ${pkg.summary.receiptCount}\n`);

    // Test 4: Check if SeasonClosure record exists
    console.log('💾 Test 4: Checking SeasonClosure records...');
    const existingClosure = await prisma.seasonClosure.findUnique({
      where: {
        teamId_season: {
          teamId: team.id,
          season: team.season,
        },
      },
    });

    if (existingClosure) {
      console.log(`   ✅ Found existing closure record`);
      console.log(`     - Status: ${existingClosure.status}`);
      console.log(`     - Created: ${existingClosure.createdAt.toLocaleDateString()}`);
      if (existingClosure.submittedAt) {
        console.log(`     - Submitted: ${existingClosure.submittedAt.toLocaleDateString()}`);
      }
    } else {
      console.log(`   ℹ️  No closure record found (this is normal if not yet submitted)`);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Navigate to http://localhost:3000/season-closure');
    console.log('   2. Click "Run Validation" to see the validation results');
    console.log('   3. If validation passes, enter association email and submit');
    console.log(
      '   4. Note: Email sending requires RESEND_API_KEY and storage requires Supabase setup\n'
    );
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSeasonClosure();
