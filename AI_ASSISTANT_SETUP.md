# HuddleBooks AI Assistant - Setup Guide

## Overview

The HuddleBooks AI Assistant is an intelligent chatbot powered by Anthropic's Claude that helps users navigate the app, answer questions about hockey rules and compliance, and perform actions like creating transactions, checking budgets, and generating reports.

## What Has Been Implemented

### ✅ Backend Infrastructure

1. **Type System** (`lib/types/assistant.ts`)
   - Complete TypeScript interfaces for assistant context, permissions, tool calls, and chat messages
   - Zod schemas for all tool parameters with validation

2. **Permission System** (`lib/assistant/permissions.ts`)
   - Role-based permission calculation
   - Tool-level permission validation
   - User-friendly error messages for permission denials

3. **Tool Functions** (`lib/assistant/tools.ts`)
   - `createTransaction` - Create income/expense transactions
   - `editTransaction` - Modify existing transactions
   - `approveTransaction` - Approve pending transactions
   - `sendParentReminder` - Send email reminders
   - `openPage` - Navigate to app pages
   - `generateReport` - Trigger report generation
   - `getTeamBudgetStatus` - Fetch budget data
   - `getAssociationComplianceFlags` - Check compliance issues
   - `getTeamTransactions` - Retrieve transaction history

4. **Knowledge Base** (`lib/assistant/knowledge-base.ts`)
   - Comprehensive knowledge entries covering:
     - App features and navigation
     - Hockey rules (GTHL, OMHA)
     - Compliance requirements
     - Budget benchmarks
     - How-to guides
     - Role definitions
     - Troubleshooting tips
   - Search functionality
   - Role-based filtering
   - System prompt generation

5. **API Endpoint** (`app/api/assistant/route.ts`)
   - POST endpoint at `/api/assistant`
   - Clerk authentication
   - Context injection (user role, team, permissions)
   - Claude integration with function calling
   - Knowledge base search and injection
   - Multi-step tool execution

### ✅ Frontend Components

1. **ChatButton** (`components/assistant/ChatButton.tsx`)
   - Floating action button (bottom right)
   - Unread message badge support

2. **ChatDrawer** (`components/assistant/ChatDrawer.tsx`)
   - Slide-in drawer interface
   - Message display with role-based styling
   - Quick action buttons
   - Tool result badges
   - Auto-scrolling
   - Loading states

3. **Assistant** (`components/assistant/Assistant.tsx`)
   - State management for chat
   - API communication
   - Navigation handling
   - Error handling with toasts

## Manual Steps Required

### 1. Add Assistant to Layout

Edit `app/layout.tsx` to include the Assistant component:

```tsx
import { Assistant } from "@/components/assistant/Assistant";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <html lang="en" className={ibmPlexSans.variable}>
        <body className={ibmPlexSans.className}>
          {children}
          <Toaster position="top-right" />
          <TeamSwitcher />
          <Assistant />  {/* Add this line */}
        </body>
      </html>
    </AuthProvider>
  );
}
```

### 2. Add Environment Variable

Add to your `.env.local` file:

```bash
# AI Assistant (Anthropic Claude)
ANTHROPIC_API_KEY="sk-ant-..."
```

Get your API key from: https://console.anthropic.com

Also update `.env.example` with:

```bash
# AI Assistant (Anthropic Claude)
# Get your API key from https://console.anthropic.com
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Verify Dependencies

The following packages have been installed:
- `ai` - Vercel AI SDK
- `@ai-sdk/anthropic` - Anthropic provider
- `zod` - Schema validation (already installed)

## How to Use

### User Experience

1. **Starting a Conversation**
   - Click the floating chat button (bottom right corner)
   - Chat drawer slides in from the right
   - See quick action buttons for common tasks

2. **Example Queries**
   - "What's our budget status?"
   - "Show me pending approvals"
   - "How do I create a transaction?"
   - "Check for compliance issues"
   - "What are the GTHL budget requirements?"
   - "Create an expense for $200 to ABC Sports for ice time"
   - "Navigate to the budget page"

3. **Tool Execution**
   - Assistant automatically calls appropriate tools based on user intent
   - Tool results appear as badges below assistant messages
   - Actions like navigation happen automatically
   - Permission errors are explained clearly

### Permission Model

| Role | Capabilities |
|------|-------------|
| **Treasurer** | Full access: create/edit/approve transactions, manage budgets, generate reports, send reminders |
| **President/Board Member** | Approve transactions, view budgets, generate reports, send reminders |
| **Auditor** | View-only access to all financial data, generate compliance reports |
| **Parent** | View approved budgets and transactions only |

## Architecture

### Request Flow

```
User Message
    ↓
ChatDrawer → Assistant Component
    ↓
POST /api/assistant
    ↓
1. Authenticate with Clerk
2. Load user from database
3. Build AssistantContext (role, permissions, team)
4. Search knowledge base for relevant context
5. Call Claude with:
   - System prompt
   - Knowledge base context
   - Conversation history
   - Available tools
6. Execute tool calls with permission checks
7. Return response with tool results
    ↓
Assistant Component
    ↓
Display message + handle navigation
```

### Security Features

1. **Authentication** - Clerk-based user authentication required
2. **Role Validation** - Every tool call validates user role
3. **Team Scoping** - All data queries scoped to user's team
4. **Permission Checks** - Pre-execution validation with clear error messages
5. **Input Validation** - Zod schemas validate all tool parameters
6. **Prompt Injection Protection** - System prompts separate from user input

## Testing Scenarios

### Test Case 1: Budget Inquiry (All Roles)
**User**: "What's our budget status?"
**Expected**: Assistant calls `getTeamBudgetStatus` and returns formatted budget data

### Test Case 2: Create Transaction (Treasurer Only)
**User**: "Create an expense for $150 to Referee Association"
**Expected**:
- Treasurer: Transaction created successfully
- Parent: "You do not have permission to create transactions"

### Test Case 3: Compliance Check (Treasurer/Board/Auditor)
**User**: "Check for compliance issues"
**Expected**: Assistant calls `getAssociationComplianceFlags` and lists issues

### Test Case 4: Navigation (All Roles)
**User**: "Take me to the transactions page"
**Expected**: Assistant calls `openPage` and redirects to /transactions

### Test Case 5: Knowledge Query (All Roles)
**User**: "What are GTHL budget requirements?"
**Expected**: Assistant responds from knowledge base without tool calls

## Extending the Assistant

### Adding New Tools

1. **Define Schema** in `lib/types/assistant.ts`:
```typescript
export const myNewToolSchema = z.object({
  param1: z.string(),
  param2: z.number(),
})
```

2. **Add Permission** in `lib/assistant/permissions.ts`:
```typescript
case 'myNewTool':
  return {
    allowed: permissions.canDoSomething,
    reason: permissions.canDoSomething ? undefined : 'Permission denied',
  }
```

3. **Implement Function** in `lib/assistant/tools.ts`:
```typescript
async function myNewTool(params: any, context: AssistantContext): Promise<ToolResult> {
  const validated = myNewToolSchema.parse(params)
  // Implementation
  return { success: true, data: result, message: 'Success!' }
}
```

4. **Register Tool** in `app/api/assistant/route.ts`:
```typescript
myNewTool: tool({
  description: 'What this tool does',
  parameters: myNewToolSchema,
  execute: async (params) => executeTool('myNewTool', params, context),
})
```

### Adding Knowledge Entries

Edit `lib/assistant/knowledge-base.ts` and add to the `entries` array:

```typescript
{
  category: 'features', // or 'hockey_rules', 'compliance', etc.
  title: 'My New Feature',
  content: 'Detailed explanation...',
  tags: ['keyword1', 'keyword2'],
  relatedPages: ['page1', 'page2'],
  roleRelevant: ['TREASURER'], // optional
}
```

## Deployment Considerations

1. **Rate Limiting** - Consider adding rate limits to `/api/assistant`
2. **Monitoring** - Track usage, errors, and costs
3. **Model Selection** - Currently uses Claude Sonnet 4.5, can switch to Haiku for cost savings
4. **Caching** - Consider caching knowledge base searches
5. **Conversation History** - Implement persistent storage if needed
6. **Error Handling** - Add Sentry integration for production

## Cost Estimation

Using Claude Sonnet 4.5:
- Input: $3.00 / million tokens
- Output: $15.00 / million tokens

Typical conversation (5 turns):
- ~5,000 input tokens (~$0.015)
- ~2,000 output tokens (~$0.03)
- **Total: ~$0.05 per conversation**

For cost optimization, switch to Claude Haiku for simpler queries.

## Troubleshooting

### Assistant button not appearing
- Check that `<Assistant />` is added to layout
- Verify no CSS conflicts with `z-50` class
- Check browser console for errors

### "Unauthorized" errors
- Verify Clerk authentication is working
- Check user exists in database
- Verify team association

### Tool calls failing
- Check permission configuration
- Verify team/user relationship in database
- Review API logs for detailed errors

### Knowledge base not working
- Verify knowledge entries are loading
- Check search query formatting
- Review role filtering logic

## Next Steps

1. ✅ Complete manual setup steps above
2. Test with different user roles
3. Add more knowledge entries for your specific association rules
4. Customize quick action buttons for your users
5. Consider adding conversation persistence
6. Set up monitoring and analytics
7. Gather user feedback and iterate

## Support

For issues or questions:
- Review code comments in implementation files
- Check Vercel AI SDK docs: https://sdk.vercel.ai/docs
- Check Anthropic docs: https://docs.anthropic.com
- Review existing API patterns in the codebase
