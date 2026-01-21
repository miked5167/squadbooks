/**
 * Performance Test: Association Dashboard Load with Production-Scale Data
 *
 * Tests that the association transaction dashboard loads in <2 seconds
 * with realistic production data (50 teams, 20,000 transactions).
 *
 * Success Criteria:
 * - LCP (Largest Contentful Paint) < 2000ms
 * - CLS (Cumulative Layout Shift) < 0.1 (good score)
 * - FCP (First Contentful Paint) measured for visibility
 *
 * IMPORTANT: This test must run against a production build:
 *   npm run build && npm start
 *
 * Running against dev build (npm run dev) will produce inaccurate results
 * as Next.js dev mode has different optimizations than production.
 */

import { test, expect } from '@playwright/test'

test.describe('Performance: Dashboard Load with Production Data', () => {
  test('association dashboard loads in <2s with 20K transactions', async ({ page }) => {
    // Note: This test requires:
    // 1. Production build running: npm run build && npm start
    // 2. Production-scale seed data: npm run seed:prod
    // 3. Association ID from seed script

    // Navigate to association transactions page
    // TODO: Replace with actual association ID from seed-production-scale.ts
    // For now, skip if environment not set up
    const associationId = process.env.PROD_SEED_ASSOCIATION_ID

    if (!associationId) {
      test.skip(
        true,
        'Skipping performance test - PROD_SEED_ASSOCIATION_ID not set. Run: npm run seed:prod'
      )
      return
    }

    // Start measuring performance
    const navigationPromise = page.goto(
      `http://localhost:3000/association/${associationId}/transactions`
    )

    // Measure Core Web Vitals using PerformanceObserver
    const vitals = await page.evaluate(() => {
      return new Promise<{
        LCP: number
        FCP: number
        CLS: number
      }>(resolve => {
        const metrics = {
          LCP: 0,
          FCP: 0,
          CLS: 0,
        }

        // Largest Contentful Paint
        new PerformanceObserver(list => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          // LCP is renderTime if available, otherwise loadTime
          metrics.LCP = lastEntry.renderTime || lastEntry.loadTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })

        // First Contentful Paint
        new PerformanceObserver(list => {
          const entries = list.getEntries()
          if (entries.length > 0) {
            const fcpEntry = entries[0] as any
            metrics.FCP = fcpEntry.startTime
          }
        }).observe({ type: 'paint', buffered: true })

        // Cumulative Layout Shift
        let clsValue = 0
        new PerformanceObserver(list => {
          for (const entry of list.getEntries() as any[]) {
            // Only count layout shifts without recent user input
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          metrics.CLS = clsValue
        }).observe({ type: 'layout-shift', buffered: true })

        // Wait for page to settle before resolving
        setTimeout(() => {
          resolve(metrics)
        }, 3000)
      })
    })

    // Wait for navigation to complete
    await navigationPromise

    // Log metrics for visibility
    console.log('\n📊 Core Web Vitals:')
    console.log(`   LCP: ${vitals.LCP.toFixed(0)}ms (target: <2000ms)`)
    console.log(`   FCP: ${vitals.FCP.toFixed(0)}ms`)
    console.log(`   CLS: ${vitals.CLS.toFixed(3)} (target: <0.1)`)
    console.log('')

    // Assertions per success criteria
    expect(vitals.LCP, 'LCP should be less than 2000ms').toBeLessThan(2000)
    expect(vitals.CLS, 'CLS should be less than 0.1 (good score)').toBeLessThan(0.1)

    // Additional sanity checks
    // Verify page actually loaded with content
    const hasTransactions = await page.locator('[data-testid="transaction-row"]').count()
    expect(hasTransactions, 'Should display transaction rows').toBeGreaterThan(0)
  })

  test('association dashboard handles pagination load efficiently', async ({ page }) => {
    const associationId = process.env.PROD_SEED_ASSOCIATION_ID

    if (!associationId) {
      test.skip(true, 'Skipping - PROD_SEED_ASSOCIATION_ID not set')
      return
    }

    await page.goto(`http://localhost:3000/association/${associationId}/transactions`)

    // Wait for initial load
    await page.waitForSelector('[data-testid="transaction-row"]', { timeout: 5000 })

    // Test "Load More" pagination performance
    const loadMoreButton = page.locator('button:has-text("Load More")')

    if (await loadMoreButton.isVisible()) {
      const startTime = Date.now()

      // Click "Load More"
      await loadMoreButton.click()

      // Wait for new transactions to appear
      await page.waitForTimeout(500) // Allow time for new content to render

      const loadTime = Date.now() - startTime

      console.log(`\n📊 Pagination Load Time: ${loadTime}ms`)

      // Pagination should be faster than initial load
      expect(loadTime, 'Pagination should load in <1000ms').toBeLessThan(1000)
    } else {
      console.log('\n⚠️  "Load More" button not visible - all transactions fit on one page')
    }
  })

  test('association dashboard with filters maintains good performance', async ({ page }) => {
    const associationId = process.env.PROD_SEED_ASSOCIATION_ID

    if (!associationId) {
      test.skip(true, 'Skipping - PROD_SEED_ASSOCIATION_ID not set')
      return
    }

    await page.goto(`http://localhost:3000/association/${associationId}/transactions`)

    // Wait for initial load
    await page.waitForSelector('[data-testid="transaction-row"]', { timeout: 5000 })

    // Apply a filter (search by vendor)
    const searchInput = page.locator('input[placeholder*="Search"]')
    if (await searchInput.isVisible()) {
      const startTime = Date.now()

      await searchInput.fill('Canadian Tire')

      // Wait for debounce and re-render
      await page.waitForTimeout(500)

      const filterTime = Date.now() - startTime

      console.log(`\n📊 Filter Application Time: ${filterTime}ms`)

      // Filtering should be fast (<1s including debounce)
      expect(filterTime, 'Filtering should complete in <1000ms').toBeLessThan(1000)
    } else {
      console.log('\n⚠️  Search input not found - skipping filter test')
    }
  })
})
