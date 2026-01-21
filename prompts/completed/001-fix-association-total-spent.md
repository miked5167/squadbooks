<objective>
Fix the bug where the association admin financials tab displays $0 for "total spent" when demo teams in NMHA (Niagara Minor Hockey Association) have actually incurred expenses.

The total spent should accurately reflect the sum of all team expenses across all teams in the association, but it currently shows $0 despite teams having real expense data.
</objective>

<context>
This is a Squadbooks application - a hockey association financial management system. The issue occurs specifically in the association admin view of the financials tab for NMHA.

Tech stack: Next.js 15, React 19, Prisma, TypeScript
Database: Supabase (PostgreSQL)

The application has demo data seeded via `npm run seed:demo`, and the demo teams have expense transactions that should be reflected in the association-level total.
</context>

<investigation>
You need to investigate and identify:

1. Where the association admin financials tab component is located
2. How the "total spent" value is currently being calculated
3. What data it's querying (or failing to query)
4. Why it's returning $0 instead of the sum of team expenses

Start by searching for files related to:
- Association financials view/page
- Association admin dashboard
- Total spent calculations or queries
- Financial summaries or aggregations
</investigation>

<requirements>
1. Locate the component/page that displays the association admin financials tab
2. Find where "total spent" is calculated or queried
3. Identify the bug causing it to show $0
4. Fix the calculation to correctly sum all team expenses for the association
5. Ensure the fix works with the existing demo data

The total spent should be: Sum of all expenses from all teams belonging to the association
</requirements>

<implementation>
- Examine the database schema to understand relationships between associations, teams, and transactions/expenses
- Check if there's a missing join, incorrect filter, or wrong aggregation
- Ensure the query includes all teams in the association
- Verify proper handling of different expense types if applicable
- Consider any date filters or other constraints that might be excluding data

Common issues to check:
- Missing `where` clause to filter by association
- Aggregation happening at wrong level (e.g., per-team instead of association-wide)
- Incorrect relationship traversal (association → teams → expenses)
- Null handling or default values
</implementation>

<verification>
Before declaring complete, verify your work by:

1. Running the dev server: `npm run dev`
2. Navigate to the association admin financials tab for NMHA
3. Confirm the "total spent" value is no longer $0
4. Verify it matches the expected sum of demo team expenses
5. Check browser console for any errors
6. If possible, verify the calculation logic against the actual database data

You can query the database to verify expected totals using Prisma Studio or SQL queries via the Supabase MCP tools.
</verification>

<success_criteria>
- The "total spent" value in the association admin financials tab shows the correct sum
- The value accurately reflects all team expenses for the association
- No console errors or warnings
- Code changes are minimal and focused on fixing the specific bug
- The fix is properly typed and follows existing code patterns
</success_criteria>
