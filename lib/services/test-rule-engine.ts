// Test script for RuleEnforcementEngine
// Run with: npx tsx lib/services/test-rule-engine.ts

import { ruleEngine } from './rule-enforcement-engine'
import { prisma } from '@/lib/prisma'

async function testRuleEngine() {
  console.log('🧪 Testing RuleEnforcementEngine\n')

  try {
    // 1. Find a team with an association
    console.log('1️⃣ Finding a team with association...')
    const team = await prisma.team.findFirst({
      where: {
        associationTeam: {
          isNot: null
        }
      },
      include: {
        associationTeam: {
          include: {
            association: true
          }
        }
      }
    })

    if (!team) {
      console.log('❌ No team with association found. Skipping tests.')
      return
    }

    console.log(`✅ Found team: ${team.name} (${team.id})`)
    console.log(`   Association: ${team.associationTeam?.association?.name}\n`)

    // 2. Test getActiveRules
    console.log('2️⃣ Testing getActiveRules()...')
    const rules = await ruleEngine.getActiveRules(team.id)
    console.log(`✅ Found ${rules.length} active rules:`)
    rules.forEach(rule => {
      console.log(`   - ${rule.name} (${rule.ruleType})${rule.isOverridden ? ' [OVERRIDDEN]' : ''}`)
    })
    console.log()

    // 3. Test validateBudget - Valid budget
    console.log('3️⃣ Testing validateBudget() with valid budget...')
    const validBudget = {
      totalBudget: 15000,
      playerAssessment: 2500,
      maxBuyout: 800,
      categories: [
        { name: 'Ice Rental', allocated: 8000 },
        { name: 'Referee Fees', allocated: 3000 },
        { name: 'League Fees', allocated: 2000 },
        { name: 'Equipment', allocated: 2000 }
      ]
    }
    const validResult = await ruleEngine.validateBudget(team.id, validBudget)
    console.log(`✅ Valid budget result:`)
    console.log(`   - isValid: ${validResult.isValid}`)
    console.log(`   - Violations: ${validResult.violations.length}`)
    console.log(`   - Warnings: ${validResult.warnings.length}`)
    console.log()

    // 4. Test validateBudget - Invalid budget (exceeds max)
    console.log('4️⃣ Testing validateBudget() with invalid budget...')
    const invalidBudget = {
      totalBudget: 25000, // Exceeds BMHA max of 20,000
      playerAssessment: 4000, // Exceeds max of 3,500
      maxBuyout: 1500, // Exceeds max of 1,000
      categories: [
        { name: 'Ice Rental', allocated: 25000 }
      ]
    }
    const invalidResult = await ruleEngine.validateBudget(team.id, invalidBudget)
    console.log(`✅ Invalid budget result:`)
    console.log(`   - isValid: ${invalidResult.isValid}`)
    console.log(`   - Violations: ${invalidResult.violations.length}`)
    invalidResult.violations.forEach(v => {
      console.log(`     • [${v.severity}] ${v.message}`)
    })
    console.log()

    // 5. Test validateTransaction
    console.log('5️⃣ Testing validateTransaction()...')

    const smallExpense = { amount: 50, type: 'EXPENSE' as const }
    const smallResult = await ruleEngine.validateTransaction(team.id, smallExpense)
    console.log(`   - $50 expense requires ${smallResult.requiredApprovals} approvals`)

    const mediumExpense = { amount: 250, type: 'EXPENSE' as const }
    const mediumResult = await ruleEngine.validateTransaction(team.id, mediumExpense)
    console.log(`   - $250 expense requires ${mediumResult.requiredApprovals} approvals`)

    const largeExpense = { amount: 1000, type: 'EXPENSE' as const }
    const largeResult = await ruleEngine.validateTransaction(team.id, largeExpense)
    console.log(`   - $1,000 expense requires ${largeResult.requiredApprovals} approvals`)
    console.log()

    // 6. Test calculateComplianceScore (before violations)
    console.log('6️⃣ Testing calculateComplianceScore() before violations...')
    const scoreBefore = await ruleEngine.calculateComplianceScore(team.id)
    console.log(`✅ Initial compliance score: ${scoreBefore}/100\n`)

    // 7. Test logViolation
    console.log('7️⃣ Testing logViolation()...')
    const testRule = rules[0]
    if (testRule) {
      const violation = await ruleEngine.logViolation({
        teamId: team.id,
        ruleId: testRule.id,
        violationType: 'TEST_VIOLATION',
        severity: 'WARNING',
        description: 'This is a test violation for RuleEngine testing',
        violationData: { test: true, timestamp: new Date().toISOString() }
      })
      console.log(`✅ Violation logged: ${violation.id}`)
      console.log(`   - Type: ${violation.violationType}`)
      console.log(`   - Severity: ${violation.severity}`)
      console.log()

      // 8. Test calculateComplianceScore (after violation)
      console.log('8️⃣ Testing calculateComplianceScore() after violation...')
      const scoreAfter = await ruleEngine.calculateComplianceScore(team.id)
      console.log(`✅ Compliance score after violation: ${scoreAfter}/100`)
      console.log(`   - Score decreased by ${scoreBefore - scoreAfter} points\n`)

      // 9. Check compliance status was updated
      console.log('9️⃣ Checking TeamComplianceStatus...')
      const complianceStatus = await prisma.teamComplianceStatus.findUnique({
        where: { teamId: team.id }
      })
      if (complianceStatus) {
        console.log(`✅ Compliance status:`)
        console.log(`   - Status: ${complianceStatus.status}`)
        console.log(`   - Score: ${complianceStatus.complianceScore}`)
        console.log(`   - Active violations: ${complianceStatus.activeViolations}`)
        console.log(`   - Warnings: ${complianceStatus.warningCount}`)
        console.log(`   - Errors: ${complianceStatus.errorCount}`)
        console.log(`   - Critical: ${complianceStatus.criticalCount}`)
      }
      console.log()

      // Cleanup: Resolve the test violation
      console.log('🧹 Cleaning up test violation...')
      await prisma.ruleViolation.update({
        where: { id: violation.id },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: 'test-script',
          resolutionNotes: 'Test violation - auto-resolved'
        }
      })
      console.log('✅ Test violation resolved\n')
    }

    console.log('✅ All tests completed successfully!')

  } catch (error) {
    console.error('❌ Test error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run tests
testRuleEngine()
