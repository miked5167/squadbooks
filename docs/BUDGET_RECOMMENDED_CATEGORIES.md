# Budget Recommended Categories & Templates

## Overview

This feature will allow associations and teams to quickly bootstrap their budget structure by applying pre-configured templates of category groups and categories, instead of manually creating each category from scratch. This accelerates onboarding and ensures consistency across teams.

---

## Table of Contents
1. [Goal](#goal)
2. [User Stories](#user-stories)
3. [Feature Design](#feature-design)
4. [Templates](#templates)
5. [User Experience](#user-experience)
6. [Implementation Considerations](#implementation-considerations)
7. [Future Enhancements](#future-enhancements)
8. [Open Questions](#open-questions)

---

## Goal

Enable teams and associations to:
- **Quickly set up budget categories** using industry-standard templates
- **Ensure consistency** across teams within an association
- **Reduce onboarding friction** by eliminating manual category creation
- **Customize after applying** templates to fit specific team needs

---

## User Stories

### As a Team Treasurer
- I want to apply a recommended budget template during onboarding so I don't have to manually create 20+ categories
- I want to choose between different team types (Rep/Travel vs House League) to get categories relevant to my needs
- I want to review and customize the template before applying it to ensure it fits my team

### As an Association Admin
- I want to define a standard budget template that all teams in my association should use
- I want to ensure consistency in reporting by having all teams use the same category structure
- I want teams to be able to add their own custom categories while maintaining the core structure

### As a New User
- I want to get started quickly without having to understand all the nuances of budget category structures
- I want confidence that I'm setting up my budget correctly by using proven templates

---

## Feature Design

### 1. Template Types

#### Standard Rep/Travel Team Template
**Target Audience:** Competitive teams that travel to tournaments

**Category Groups & Categories:**

**Expense Categories:**
- **Ice & Facilities**
  - Ice Time (Practice)
  - Ice Time (Games)
  - Tournament Ice Fees
  - Facility Rentals

- **Equipment & Uniforms**
  - Team Jerseys
  - Practice Jerseys
  - Socks & Accessories
  - Goalie Equipment
  - Training Equipment

- **Tournament & League Fees**
  - League Registration
  - Tournament Entry Fees
  - Playoff Fees
  - Exhibition Game Fees

- **Travel & Accommodation**
  - Hotels
  - Transportation (Bus/Van)
  - Meals (Team Events)
  - Per Diems

- **Coaching & Officials**
  - Head Coach Stipend
  - Assistant Coach Stipend
  - Trainer Fees
  - Referee Fees (Exhibition)

- **Fundraising & Events**
  - Team Events
  - Year-End Banquet
  - Team Photos
  - Fundraising Costs

- **Administrative**
  - Team Insurance
  - Bank Fees
  - Software & Technology
  - Office Supplies

- **Other**
  - Miscellaneous

**Income Categories:**
- **Fundraising & Income**
  - Registration Fees
  - Fundraising Revenue
  - Sponsorships
  - Grants & Subsidies
  - Other Income

---

#### House League Team Template
**Target Audience:** Recreational/house league teams with minimal travel

**Category Groups & Categories:**

**Expense Categories:**
- **Ice & Facilities**
  - Ice Time (Practice)
  - Ice Time (Games)

- **Equipment & Uniforms**
  - Team Jerseys
  - Practice Jerseys
  - Equipment

- **League Fees**
  - League Registration
  - Playoff Fees

- **Coaching & Officials**
  - Coach Stipend
  - Trainer Fees

- **Events**
  - Year-End Party
  - Team Photos

- **Administrative**
  - Team Insurance
  - Bank Fees
  - Software

- **Other**
  - Miscellaneous

**Income Categories:**
- **Fundraising & Income**
  - Registration Fees
  - Fundraising Revenue
  - Other Income

---

#### Association Default Template
**Target Audience:** Association-level admins creating a standard for all teams

**Description:**
A customizable template that associations can define and then push to all their teams. This template would be a hybrid of Rep/Travel and House League templates, with the association admin able to customize which categories are required vs optional.

**Future Consideration:** This template would be maintained at the association level and could be versioned (e.g., "2025-26 Default", "2026-27 Default").

---

### 2. Template Application Flow

#### Location in App
Templates can be accessed from:
1. **During Onboarding** (Step 2: Budget Setup)
   - Show a "Use Recommended Template" option before/instead of manually entering categories
   - User selects a template type
   - Preview the categories that will be created
   - Option to "Apply Template" or "Start from Scratch"

2. **Settings → Budget & Categories Page**
   - Add a "Apply Template" button in the header
   - Warning modal if categories already exist: "This will add new categories. Existing categories will not be affected."
   - Non-destructive: only adds categories, doesn't delete existing ones

#### Application Logic
```
When user clicks "Apply Template":
1. Show modal with template selection dropdown
2. Display preview of category groups and categories to be created
3. Show warning if categories already exist
4. On confirm:
   - Create category groups (headings) if they don't exist
   - Create categories with default colors and sort orders
   - Skip categories that already exist (match by name + heading)
   - Show success message with count of categories created
5. Refresh the categories list
```

---

### 3. Template Data Structure

Templates should be stored as JSON/TypeScript constants:

```typescript
interface CategoryTemplate {
  name: string
  heading: string
  color: string
  sortOrder: number
}

interface BudgetTemplate {
  id: string
  name: string
  description: string
  targetAudience: string
  categories: CategoryTemplate[]
}

const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: 'rep-travel',
    name: 'Standard Rep/Travel Team',
    description: 'Comprehensive budget for competitive teams that travel to tournaments',
    targetAudience: 'AAA, AA, A, Rep, and Travel teams',
    categories: [
      // ... category definitions
    ]
  },
  {
    id: 'house-league',
    name: 'House League Team',
    description: 'Simplified budget for recreational teams with minimal travel',
    targetAudience: 'House league and recreational teams',
    categories: [
      // ... category definitions
    ]
  }
]
```

---

## User Experience

### Onboarding Flow Enhancement

**Current:** User manually creates categories during onboarding

**Proposed:**
1. Step 2: Budget Total
   - After entering budget total, show a choice:
     - "Use Recommended Template" (recommended)
     - "Create Categories Manually"

2. If "Use Recommended Template":
   - Show template selection cards with:
     - Template name
     - Description
     - Target audience
     - Sample categories preview (first 5-6 categories)
   - User selects a template
   - Confirmation screen shows all categories that will be created
   - Button: "Apply Template" or "Back"

3. After applying template:
   - Success message: "Created 24 budget categories"
   - Option to "Review Categories" or "Continue to Next Step"
   - Note: "You can always add, edit, or remove categories later in Settings"

### Settings Page Flow

**In Settings → Budget & Categories:**
1. Add button: "Apply Template" next to the page header
2. On click, show modal:
   - "Choose a Budget Template"
   - Template selection dropdown
   - Preview of categories
   - Warning (if categories exist): "This will add new categories to your existing setup. Existing categories will not be modified."
3. On apply:
   - Create categories
   - Scroll to newly created groups
   - Show toast: "Added 15 new categories from Rep/Travel template"

---

## Implementation Considerations

### Database Impact
- **No schema changes required** - uses existing `Category` table
- Templates are code-based constants (not stored in DB)
- Future: Could add `Category.templateId` field to track which template a category came from

### Non-Destructive Application
- **Key principle:** Applying a template should never delete or modify existing categories
- Check for duplicates by matching `name` + `heading`
- If duplicate found, skip that category
- Report skipped categories to user: "Skipped 3 categories that already exist"

### Sort Order Assignment
- Assign sort orders based on template position
- If categories already exist, find the max sort order and increment from there
- Example: If max sort order is 50, template categories start at 51, 52, 53...

### Color Assignment
Each template should have thoughtful default colors:
- Ice & Facilities: Blue (#3B82F6)
- Equipment: Orange (#F97316)
- Tournament Fees: Purple (#A855F7)
- Travel: Teal (#14B8A6)
- Coaching: Green (#22C55E)
- Events: Pink (#EC4899)
- Administrative: Gray (#6B7280)
- Income: Green (#10B981)

### Permission Requirements
- **Treasurers and Admins** can apply templates
- **View-only users** cannot apply templates

---

## Future Enhancements

### Phase 2: Association-Level Templates
- Association admins can create and maintain custom templates
- Templates can be "published" to all teams
- Teams can choose to "sync" with association template or diverge
- Version control for templates (2025-26, 2026-27, etc.)

### Phase 3: Template Marketplace
- Share templates across associations
- Community-contributed templates
- Rate and review templates
- Clone and customize existing templates

### Phase 4: Budget Allocation Templates
- Templates include recommended budget allocations (not just categories)
- Percentage-based allocations (e.g., Ice = 40% of total budget)
- Dynamic allocation based on team level or total budget

### Phase 5: Cloning from Existing Team
- "Copy categories from another team" option
- Association admins can designate a "reference team"
- New teams can clone structure from reference team

---

## Open Questions

### 1. Should templates include budget allocations?
**Consideration:** Should the Rep/Travel template not only create categories but also suggest dollar amounts or percentages?

**Options:**
- **A)** Categories only (current scope) - simpler, less opinionated
- **B)** Include percentage-based allocations - more helpful but assumes budget total is set
- **C)** Include sample dollar amounts - very opinionated, might not fit all budgets

**Recommendation:** Start with A (categories only), add B in Phase 4

### 2. Should we allow editing templates before applying?
**Consideration:** Should users be able to check/uncheck categories before applying the template?

**Options:**
- **A)** Apply all or nothing - simpler UX
- **B)** Allow deselecting categories - more flexible but complex UI
- **C)** Apply all, then user can delete unwanted categories - simpler, achieves same goal

**Recommendation:** Start with C

### 3. How do we handle template updates?
**Consideration:** If we update the "Rep/Travel" template in a future version, how do existing teams benefit?

**Options:**
- **A)** No updates - templates are one-time apply
- **B)** Show "New categories available" notification
- **C)** Track template version and offer "sync" option

**Recommendation:** Start with A, consider B/C in Phase 2

### 4. Should templates be scoped to sport type?
**Consideration:** Hockey, Lacrosse, and Soccer might need different category structures

**Current Scope:** Hockey only
**Future:** Sport-specific templates (Phase 2 or 3)

### 5. How do we handle sort order conflicts?
**Consideration:** If user has categories with sort order 1-30, and template has 1-25, what happens?

**Recommendation:** Template categories are added with sort order starting at max(existing) + 1. Users can manually reorder later.

---

## Success Metrics

Once implemented, we should track:
- **Adoption Rate:** % of new teams using templates vs manual creation
- **Time to Complete Onboarding:** Does template usage reduce onboarding time?
- **Category Count:** Average number of categories per team (template vs manual)
- **Template Preference:** Which template is most popular?
- **Customization Rate:** % of users who edit/delete template categories after applying

---

## Technical Implementation Notes

### Files to Create/Modify

**New Files:**
- `lib/constants/budget-templates.ts` - Template definitions
- `app/api/settings/categories/apply-template/route.ts` - API endpoint for applying templates
- `components/settings/TemplateSelectionModal.tsx` - UI for selecting templates
- `components/settings/TemplatePreview.tsx` - Preview component showing categories

**Modified Files:**
- `app/settings/categories/page.tsx` - Add "Apply Template" button
- `app/onboarding/components/StepBudget.tsx` - Add template option to onboarding
- `lib/validations/settings.ts` - Add template application validation

### API Endpoint Design

```typescript
POST /api/settings/categories/apply-template
Body: {
  templateId: 'rep-travel' | 'house-league'
}

Response: {
  created: number,        // Count of categories created
  skipped: number,        // Count of duplicates skipped
  categories: Category[]  // All categories after application
}
```

### Error Handling
- Template not found: 404
- Permission denied: 403
- Database error during creation: 500 (rollback all changes)
- Partial success: Not allowed - all or nothing transaction

---

## Timeline Estimate

- **Phase 1 - Basic Templates:** 2-3 days
  - Define templates as constants
  - Build template application logic
  - Add UI to Settings page
  - Testing

- **Phase 1.5 - Onboarding Integration:** 1-2 days
  - Add template selection to onboarding wizard
  - Update onboarding flow
  - Testing

- **Phase 2 - Association Templates:** 5-7 days
  - Association-level template management
  - Template versioning
  - Team synchronization
  - Testing

---

## Notes

- Keep templates simple and opinionated to start
- Focus on the 80% use case (Rep/Travel teams)
- Make it easy to customize after application
- Prioritize non-destructive operations
- Consider localization (Canadian vs US terminology) in future phases
