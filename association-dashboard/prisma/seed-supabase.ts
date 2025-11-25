/**
 * Seed Script using Supabase Client (bypasses Prisma)
 * Creates demo data to showcase the dashboard
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🌱 Starting seed with Supabase client...')

  const clerkUserId = process.env.SEED_CLERK_USER_ID || 'user_35mxqUEnd8SXJxf6VCvRJW0zMTi'
  console.log(`Creating data for Clerk user: ${clerkUserId}`)

  // 1. Create Association
  const now = new Date().toISOString()
  const { data: association, error: assocError } = await supabase
    .from('associations')
    .insert({
      name: 'Greater Toronto Hockey Association',
      abbreviation: 'GTHA',
      province_state: 'Ontario',
      country: 'Canada',
      season: '2024-2025',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (assocError) {
    console.error('Error creating association:', assocError)
    throw assocError
  }
  console.log(`✓ Created association: ${association.name}`)

  // 2. Create AssociationUser
  const { data: associationUser, error: userError } = await supabase
    .from('association_users')
    .insert({
      clerk_user_id: clerkUserId,
      association_id: association.id,
      name: 'Demo Admin',
      email: 'admin@gtha.com',
      role: 'association_admin',
      created_at: now,
    })
    .select()
    .single()

  if (userError) {
    console.error('Error creating association user:', userError)
    throw userError
  }
  console.log(`✓ Created association user: ${associationUser.name}`)

  // 3. Create Teams
  const teamsData = [
    {
      association_id: association.id,
      team_name: 'U13 Hawks',
      division: 'U13',
      season: '2024-2025',
      team_id: 'team_hawks_u13',
      api_access_token: 'demo_token_hawks',
      created_at: now,
      updated_at: now,
    },
    {
      association_id: association.id,
      team_name: 'U15 Eagles',
      division: 'U15',
      season: '2024-2025',
      team_id: 'team_eagles_u15',
      api_access_token: 'demo_token_eagles',
      created_at: now,
      updated_at: now,
    },
    {
      association_id: association.id,
      team_name: 'U18 Warriors',
      division: 'U18',
      season: '2024-2025',
      team_id: 'team_warriors_u18',
      api_access_token: 'demo_token_warriors',
      created_at: now,
      updated_at: now,
    },
    {
      association_id: association.id,
      team_name: 'U10 Sharks',
      division: 'U10',
      season: '2024-2025',
      team_id: 'team_sharks_u10',
      api_access_token: 'demo_token_sharks',
      created_at: now,
      updated_at: now,
    },
    {
      association_id: association.id,
      team_name: 'U12 Tigers',
      division: 'U12',
      season: '2024-2025',
      team_id: 'team_tigers_u12',
      api_access_token: 'demo_token_tigers',
      created_at: now,
      updated_at: now,
    },
  ]

  const { data: teams, error: teamsError } = await supabase
    .from('association_teams')
    .insert(teamsData)
    .select()

  if (teamsError) {
    console.error('Error creating teams:', teamsError)
    throw teamsError
  }
  console.log(`✓ Created ${teams.length} teams`)

  // 4. Create Financial Snapshots
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

  const snapshotsData = [
    {
      association_team_id: teams[0].id,
      snapshot_at: now,
      health_status: 'healthy',
      budget_total: 15000,
      spent: 8500,
      remaining: 6500,
      percent_used: 56.67,
      bank_connected: true,
      bank_reconciled_through: twoDaysAgo,
      pending_approvals: 2,
      missing_receipts: 1,
      red_flags: [],
      created_at: now,
    },
    {
      association_team_id: teams[1].id,
      snapshot_at: now,
      health_status: 'needs_attention',
      budget_total: 20000,
      spent: 16500,
      remaining: 3500,
      percent_used: 82.5,
      bank_connected: true,
      bank_reconciled_through: fortyFiveDaysAgo,
      pending_approvals: 8,
      missing_receipts: 5,
      red_flags: ['high_budget_usage', 'stale_reconciliation'],
      created_at: now,
    },
    {
      association_team_id: teams[2].id,
      snapshot_at: now,
      health_status: 'at_risk',
      budget_total: 18000,
      spent: 17200,
      remaining: 800,
      percent_used: 95.56,
      bank_connected: false,
      bank_reconciled_through: null,
      pending_approvals: 12,
      missing_receipts: 15,
      red_flags: ['critical_budget_usage', 'bank_not_connected', 'many_missing_receipts'],
      created_at: now,
    },
    {
      association_team_id: teams[3].id,
      snapshot_at: now,
      health_status: 'healthy',
      budget_total: 12000,
      spent: 5800,
      remaining: 6200,
      percent_used: 48.33,
      bank_connected: true,
      bank_reconciled_through: fiveDaysAgo,
      pending_approvals: 1,
      missing_receipts: 0,
      red_flags: [],
      created_at: now,
    },
    {
      association_team_id: teams[4].id,
      snapshot_at: now,
      health_status: 'needs_attention',
      budget_total: 16000,
      spent: 13000,
      remaining: 3000,
      percent_used: 81.25,
      bank_connected: true,
      bank_reconciled_through: tenDaysAgo,
      pending_approvals: 6,
      missing_receipts: 3,
      red_flags: ['high_budget_usage'],
      created_at: now,
    },
  ]

  const { data: snapshots, error: snapshotsError } = await supabase
    .from('team_financial_snapshots')
    .insert(snapshotsData)
    .select()

  if (snapshotsError) {
    console.error('Error creating snapshots:', snapshotsError)
    throw snapshotsError
  }
  console.log(`✓ Created ${snapshots.length} financial snapshots`)

  // 5. Create Alerts
  const alertsData = [
    {
      association_id: association.id,
      association_team_id: teams[2].id,
      alert_type: 'critical_budget_usage',
      severity: 'critical',
      status: 'active',
      title: 'Critical Budget Usage - U18 Warriors',
      description: 'Team has used 95.56% of their budget',
      last_triggered_at: now,
      created_at: now,
    },
    {
      association_id: association.id,
      association_team_id: teams[2].id,
      alert_type: 'bank_not_connected',
      severity: 'warning',
      status: 'active',
      title: 'Bank Not Connected - U18 Warriors',
      description: 'Team needs to connect their bank account',
      last_triggered_at: now,
      created_at: now,
    },
    {
      association_id: association.id,
      association_team_id: teams[1].id,
      alert_type: 'stale_reconciliation',
      severity: 'warning',
      status: 'active',
      title: 'Stale Reconciliation - U15 Eagles',
      description: 'Last reconciliation was 45 days ago',
      last_triggered_at: now,
      created_at: now,
    },
  ]

  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .insert(alertsData)
    .select()

  if (alertsError) {
    console.error('Error creating alerts:', alertsError)
    throw alertsError
  }
  console.log(`✓ Created ${alerts.length} alerts`)

  // 6. Create a report record
  const { error: reportError } = await supabase
    .from('reports')
    .insert({
      association_id: association.id,
      generated_by: associationUser.id,
      report_type: 'board_summary',
      generated_at: now,
    })

  if (reportError) {
    console.error('Error creating report:', reportError)
    throw reportError
  }
  console.log('✓ Created sample report record')

  console.log('\n✅ Seed complete!')
  console.log('Refresh http://localhost:3000 to see your dashboard!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
