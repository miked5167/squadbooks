// Knowledge Base Loader for AI Assistant
import type { KnowledgeBase, KnowledgeEntry } from '@/lib/types/assistant'

// In production, this would load from YAML/JSON files
// For MVP, we'll embed the knowledge directly

export function getKnowledgeBase(): KnowledgeBase {
  const entries: KnowledgeEntry[] = [
    // ============================================
    // APP FEATURES & NAVIGATION
    // ============================================
    {
      category: 'features',
      title: 'Dashboard Overview',
      content: `The Dashboard shows a real-time financial overview including:
- Budget summary with allocated vs spent amounts
- Recent transactions
- Pending approvals count
- Budget health indicators (green/yellow/red)
- Quick action buttons

Navigate to the dashboard by clicking "Dashboard" in the sidebar or asking to "show the dashboard".`,
      tags: ['dashboard', 'overview', 'navigation'],
      relatedPages: ['dashboard'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER', 'PARENT'],
    },

    {
      category: 'features',
      title: 'Transaction Management',
      content: `Transactions are the core of HuddleBooks:
- Create INCOME or EXPENSE transactions
- Add receipts (required for expenses over $50)
- Transactions require approval before being counted
- Categories help organize spending
- View transaction history filtered by category, date, or status

Treasurers can create and edit transactions. Board members and Presidents can approve them.`,
      tags: ['transactions', 'expenses', 'income', 'receipts'],
      relatedPages: ['transactions'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER'],
    },

    {
      category: 'features',
      title: 'Budget Tracking',
      content: `The Budget page shows:
- All expense categories with allocated amounts
- Amount spent and remaining for each category
- Visual progress bars showing budget usage
- Warning when categories exceed 80% usage
- Critical alerts when categories exceed 100%

You can adjust budget allocations if you're a Treasurer. Parents and board members can view but not edit budgets.`,
      tags: ['budget', 'categories', 'spending'],
      relatedPages: ['budget'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER', 'PARENT'],
    },

    {
      category: 'features',
      title: 'Reports and Exports',
      content: `Generate financial reports including:
- Monthly Summary: Income, expenses, and net for the month
- Budget Variance Report: Shows over/under budget by category
- Transaction History: Detailed export of all transactions
- Compliance Reports: For association audits

Reports can be exported as PDF or Excel. Only Treasurers, Board Members, and Auditors can generate reports.`,
      tags: ['reports', 'exports', 'audit', 'compliance'],
      relatedPages: ['reports'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER', 'AUDITOR'],
    },

    {
      category: 'features',
      title: 'Team and Family Management',
      content: `Manage your team roster:
- Add players with jersey numbers and positions
- Link players to families for billing and communication
- Track parent contact information
- Send invitations to parents for onboarding
- View parent acknowledgments of budgets

Access from the "Players" or "Families" tab in settings.`,
      tags: ['players', 'families', 'roster', 'parents'],
      relatedPages: ['players', 'families', 'settings'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT'],
    },

    // ============================================
    // HOCKEY RULES & COMPLIANCE
    // ============================================
    {
      category: 'hockey_rules',
      title: 'GTHL Budget Requirements',
      content: `Greater Toronto Hockey League (GTHL) requires:
- Maximum player assessment varies by division
- All expenses must have receipts
- Dual approval required for expenses over $200
- Budget must be approved by majority of parents
- End-of-season financial package required
- Zero balance at season end (no profit)

HuddleBooks helps you stay compliant automatically.`,
      tags: ['gthl', 'compliance', 'rules', 'assessment'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER'],
    },

    {
      category: 'hockey_rules',
      title: 'OMHA Guidelines',
      content: `Ontario Minor Hockey Association (OMHA) guidelines:
- Team budgets should be transparent and shared with parents
- No team shall operate for profit
- All revenue must be spent on hockey operations
- Financial records must be maintained for 7 years
- Association oversight required

HuddleBooks provides tools for OMHA compliance including audit trails and reporting.`,
      tags: ['omha', 'compliance', 'guidelines'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER'],
    },

    {
      category: 'compliance',
      title: 'Receipt Requirements',
      content: `Receipt best practices:
- REQUIRED for all expenses over $50
- RECOMMENDED for all expenses
- Upload clear, legible photos or PDFs
- Must show: vendor, date, amount, items purchased
- Store receipts for 7 years (HuddleBooks stores indefinitely)

Missing receipts will flag compliance warnings.`,
      tags: ['receipts', 'compliance', 'documentation'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER'],
    },

    {
      category: 'compliance',
      title: 'Approval Workflows',
      content: `Transaction approval rules:
- Under $200: Single approval required
- Over $200: Dual approval required (GTHL requirement)
- Approver cannot be the same person who created the transaction
- Approvals from Board Members or Presidents are valid
- Rejected transactions can be edited and resubmitted

Set up approval thresholds in Team Settings.`,
      tags: ['approvals', 'workflow', 'gthl'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER'],
    },

    // ============================================
    // BUDGET NORMS & BENCHMARKS
    // ============================================
    {
      category: 'benchmarks',
      title: 'Typical Budget Breakdown',
      content: `Standard minor hockey budget allocation (percentages):
- Ice Time: 50-60% (largest expense)
- Referee Fees: 10-15%
- Equipment & Jerseys: 8-12%
- Tournament Fees: 8-12%
- League Fees: 5-8%
- Coaching & Training: 3-5%
- Administration: 2-3%

These are guidelines. Your team may vary based on ice costs, tournament schedule, and other factors.`,
      tags: ['budget', 'benchmarks', 'categories'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT'],
    },

    {
      category: 'benchmarks',
      title: 'Typical Team Costs by Division',
      content: `Average player assessment ranges (Ontario, 2024-2025):
- U7-U9 House League: $400-800
- U11-U13 House League: $800-1,200
- U15-U18 House League: $1,000-1,500
- U11-U13 Rep/Select: $2,000-4,000
- U15-U18 Rep/Select: $3,000-6,000
- AAA Teams: $6,000-12,000+

Costs vary by region, ice availability, and competitive level.`,
      tags: ['benchmarks', 'assessment', 'costs'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'PARENT'],
    },

    // ============================================
    // COMMON TASKS & HOW-TOS
    // ============================================
    {
      category: 'how_to',
      title: 'How to Create a Transaction',
      content: `Steps to create a transaction:
1. Go to Transactions page
2. Click "New Transaction" button
3. Select type (Income or Expense)
4. Choose category from dropdown
5. Enter vendor/payor name
6. Enter amount
7. Select transaction date
8. Upload receipt (if available)
9. Add description (optional)
10. Click "Save"

The transaction will be in DRAFT status until submitted for approval.`,
      tags: ['how-to', 'transactions', 'guide'],
      relatedPages: ['transactions'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER'],
    },

    {
      category: 'how_to',
      title: 'How to Approve a Transaction',
      content: `To approve a pending transaction:
1. Go to Transactions page
2. Filter by "Pending" status
3. Click on the transaction to view details
4. Review the amount, vendor, category, and receipt
5. Click "Approve" button
6. Add optional comment
7. Confirm approval

Dual approval transactions require a second approver. You'll see a badge showing how many approvals are needed.`,
      tags: ['how-to', 'approvals', 'guide'],
      relatedPages: ['transactions'],
      roleRelevant: ['PRESIDENT', 'BOARD_MEMBER', 'TREASURER', 'ASSISTANT_TREASURER'],
    },

    {
      category: 'how_to',
      title: 'How to Check Budget Status',
      content: `View budget health:
1. Go to Budget page from sidebar
2. See all categories with allocated/spent/remaining amounts
3. Green = under 80% used (healthy)
4. Yellow = 80-99% used (approaching limit)
5. Red = over 100% (overspent)
6. Click on a category to see all transactions in that category

You can also ask me "What's our budget status?" or "How much have we spent on ice time?"`,
      tags: ['how-to', 'budget', 'guide'],
      relatedPages: ['budget'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER', 'PARENT'],
    },

    // ============================================
    // ROLE DEFINITIONS
    // ============================================
    {
      category: 'roles',
      title: 'Role: Treasurer',
      content: `Treasurers have full financial management access:
- Create and edit all transactions
- Approve transactions (if not creator)
- Manage budget allocations
- Generate all reports
- Invite and manage team members
- Send reminders to parents
- Upload and manage receipts
- Access full audit log

This is the primary financial administrator role.`,
      tags: ['roles', 'permissions', 'treasurer'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER'],
    },

    {
      category: 'roles',
      title: 'Role: Board Member / President',
      content: `Board Members and Presidents can:
- View all financial data
- Approve transactions
- Generate reports
- Send parent communications
- View budget status

They CANNOT:
- Create or edit transactions
- Change budget allocations
- Manage team settings

This provides oversight without day-to-day management.`,
      tags: ['roles', 'permissions', 'board'],
      roleRelevant: ['PRESIDENT', 'BOARD_MEMBER'],
    },

    {
      category: 'roles',
      title: 'Role: Parent',
      content: `Parents have read-only access:
- View budget summary
- See approved transactions
- Acknowledge budget requests
- View team roster (if applicable)

Parents CANNOT:
- Create, edit, or approve transactions
- Generate reports
- Access pending approvals
- See draft transactions

This provides transparency while protecting sensitive data.`,
      tags: ['roles', 'permissions', 'parent'],
      roleRelevant: ['PARENT'],
    },

    {
      category: 'roles',
      title: 'Role: Auditor',
      content: `Auditors have special view-only access:
- View all transactions (including drafts)
- Generate compliance reports
- Access full audit log
- View budget history

Auditors CANNOT:
- Create, edit, or approve transactions
- Change any data
- Send communications

This role is for association auditors and compliance reviews.`,
      tags: ['roles', 'permissions', 'auditor'],
      roleRelevant: ['AUDITOR'],
    },

    // ============================================
    // TROUBLESHOOTING
    // ============================================
    {
      category: 'troubleshooting',
      title: 'Budget Shows Overspent',
      content: `If a category shows overspent (red):
1. Review transactions in that category for errors
2. Check if any unapproved transactions should be rejected
3. Consider reallocating budget from underspent categories
4. If legitimate overspending, document the reason for board/association

You can ask me "Why is ice time overspent?" or "Show me all ice time transactions"`,
      tags: ['troubleshooting', 'budget', 'overspending'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT'],
    },

    {
      category: 'troubleshooting',
      title: 'Missing Receipts Warning',
      content: `If you see missing receipt warnings:
1. Go to Transactions page
2. Filter by "Missing Receipts"
3. Upload receipts for flagged transactions
4. For lost receipts, document the reason in transaction notes
5. Contact vendor for duplicate receipt if possible

GTHL/OMHA may reject expenses without receipts during audits.`,
      tags: ['troubleshooting', 'receipts', 'compliance'],
      roleRelevant: ['TREASURER', 'ASSISTANT_TREASURER'],
    },
  ]

  return {
    entries,
    version: '1.0.0',
    lastUpdated: new Date(),
  }
}

export function searchKnowledge(
  query: string,
  category?: string,
  role?: string
): KnowledgeEntry[] {
  const kb = getKnowledgeBase()
  const queryLower = query.toLowerCase()

  return kb.entries
    .filter((entry) => {
      // Filter by category if specified
      if (category && entry.category !== category) return false

      // Filter by role relevance if specified
      if (role && entry.roleRelevant && !entry.roleRelevant.includes(role as any)) {
        return false
      }

      // Search in title, content, and tags
      return (
        entry.title.toLowerCase().includes(queryLower) ||
        entry.content.toLowerCase().includes(queryLower) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(queryLower))
      )
    })
    .slice(0, 5) // Return top 5 matches
}

export function getKnowledgeByCategory(category: string): KnowledgeEntry[] {
  const kb = getKnowledgeBase()
  return kb.entries.filter((entry) => entry.category === category)
}

export function getSystemPrompt(context: { role: string; teamId: string }): string {
  return `You are HuddleBooks AI Assistant, a helpful financial management assistant for youth sports teams (specifically hockey).

ROLE: The user is a ${context.role}.

YOUR CAPABILITIES:
1. Answer questions about HuddleBooks features and navigation
2. Explain hockey association rules (GTHL, OMHA)
3. Help with budget tracking and compliance
4. Execute actions like creating transactions, approving expenses, and generating reports (based on user permissions)
5. Provide insights about team finances

IMPORTANT GUIDELINES:
- Be concise and friendly
- Always check user permissions before suggesting actions
- When users ask "how do I...", provide step-by-step guidance
- Offer to execute actions when possible (e.g., "Would you like me to create that transaction for you?")
- If asked about budget or transactions, use tools to fetch real data rather than guessing
- For compliance questions, cite specific rules (GTHL, OMHA)
- If you don't know something, say so and suggest where to find the answer

TONE: Professional but friendly, like a knowledgeable team manager who wants to help.`
}
