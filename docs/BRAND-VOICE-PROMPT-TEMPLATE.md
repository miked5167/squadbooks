# Brand Voice Prompt Template for Claude Code

## Purpose
Use this template when asking Claude Code to generate new UI components, pages, or features. It ensures consistent brand voice and terminology across all development work.

---

## Template: Copy and Paste This
```
[YOUR SPECIFIC REQUEST HERE]

---

BRAND VOICE REQUIREMENTS:

Please follow TeamTreasure brand voice guidelines:

1. TERMINOLOGY:
   - Use "financial protection", "safeguards", "verification", "oversight"
   - NEVER use "fraud", "embezzlement", "theft", "suspicious" in UI text
   - Frame features as protective, not policing

2. TONE:
   - Supportive and collaborative (not accusatory)
   - Protective (helping the treasurer, not watching them)
   - Professional but warm (not corporate or cold)
   - Action-oriented (tight copy, not verbose paragraphs)

3. REFERENCE:
   - Full guidelines: /docs/BRAND-VOICE-GUIDE.md
   - Quick lookup: /docs/UI-COPY-REFERENCE.md
   - Examples follow approved patterns from these docs

4. COPY CHECKLIST:
   ✅ No "fraud" language in user-facing text
   ✅ Supportive, protective tone
   ✅ Tight, scannable copy (not long paragraphs)
   ✅ Frames features as helping users
   ✅ Would make volunteers feel trusted (not suspected)

Please confirm you've reviewed the brand voice guide before generating code.
```

---

## Usage Examples

### Example 1: Creating a New Settings Page
```
Create a settings page for configuring approval thresholds where treasurers can set:
- Auto-approve amount (default $50)
- Single approval range ($50-$1,000)
- Dual approval threshold (>$1,000)

Include explanatory text for each threshold.

---

BRAND VOICE REQUIREMENTS:

Please follow TeamTreasure brand voice guidelines:

1. TERMINOLOGY:
   - Use "financial protection", "safeguards", "verification", "oversight"
   - NEVER use "fraud", "embezzlement", "theft", "suspicious" in UI text
   - Frame features as protective, not policing

2. TONE:
   - Supportive and collaborative (not accusatory)
   - Protective (helping the treasurer, not watching them)
   - Professional but warm (not corporate or cold)
   - Action-oriented (tight copy, not verbose paragraphs)

3. REFERENCE:
   - Full guidelines: /docs/BRAND-VOICE-GUIDE.md
   - Quick lookup: /docs/UI-COPY-REFERENCE.md
   - Examples follow approved patterns from these docs

4. COPY CHECKLIST:
   ✅ No "fraud" language in user-facing text
   ✅ Supportive, protective tone
   ✅ Tight, scannable copy (not long paragraphs)
   ✅ Frames features as helping users
   ✅ Would make volunteers feel trusted (not suspected)

Please confirm you've reviewed the brand voice guide before generating code.
```

### Example 2: Building an Approval Queue
```
Build the approval queue page where board members can:
- See pending expenses waiting for approval
- View expense details (vendor, amount, category, receipt)
- Approve or reject with optional comment
- See approval history

---

BRAND VOICE REQUIREMENTS:

Please follow TeamTreasure brand voice guidelines:

1. TERMINOLOGY:
   - Use "financial protection", "safeguards", "verification", "oversight"
   - NEVER use "fraud", "embezzlement", "theft", "suspicious" in UI text
   - Frame features as protective, not policing

2. TONE:
   - Supportive and collaborative (not accusatory)
   - Protective (helping the treasurer, not watching them)
   - Professional but warm (not corporate or cold)
   - Action-oriented (tight copy, not verbose paragraphs)

3. REFERENCE:
   - Full guidelines: /docs/BRAND-VOICE-GUIDE.md
   - Quick lookup: /docs/UI-COPY-REFERENCE.md
   - Examples follow approved patterns from these docs

4. COPY CHECKLIST:
   ✅ No "fraud" language in user-facing text
   ✅ Supportive, protective tone
   ✅ Tight, scannable copy (not long paragraphs)
   ✅ Frames features as helping users
   ✅ Would make volunteers feel trusted (not suspected)

Please confirm you've reviewed the brand voice guide before generating code.
```

### Example 3: Creating Email Notification Templates
```
Create email templates for:
1. Expense pending approval (sent to president)
2. Expense approved (sent to treasurer)
3. Expense needs more info (sent to treasurer)

Templates should be plain text with HTML alternative.

---

BRAND VOICE REQUIREMENTS:

Please follow TeamTreasure brand voice guidelines:

1. TERMINOLOGY:
   - Use "financial protection", "safeguards", "verification", "oversight"
   - NEVER use "fraud", "embezzlement", "theft", "suspicious" in UI text
   - Frame features as protective, not policing

2. TONE:
   - Supportive and collaborative (not accusatory)
   - Protective (helping the treasurer, not watching them)
   - Professional but warm (not corporate or cold)
   - Action-oriented (tight copy, not verbose paragraphs)

3. REFERENCE:
   - Full guidelines: /docs/BRAND-VOICE-GUIDE.md
   - Quick lookup: /docs/UI-COPY-REFERENCE.md
   - Examples follow approved patterns from these docs

4. COPY CHECKLIST:
   ✅ No "fraud" language in user-facing text
   ✅ Supportive, protective tone
   ✅ Tight, scannable copy (not long paragraphs)
   ✅ Frames features as helping users
   ✅ Would make volunteers feel trusted (not suspected)

Please confirm you've reviewed the brand voice guide before generating code.
```

### Example 4: Building Dashboard Components
```
Create dashboard components for the treasurer home screen:
1. Financial Health Card (budget status, spent, remaining)
2. Quick Actions (Add Expense, Record Income buttons)
3. Budget Snapshot (top 3 categories with progress)
4. Recent Transactions (last 5 with status badges)

Include proper loading states and error handling.

---

BRAND VOICE REQUIREMENTS:

Please follow TeamTreasure brand voice guidelines:

1. TERMINOLOGY:
   - Use "financial protection", "safeguards", "verification", "oversight"
   - NEVER use "fraud", "embezzlement", "theft", "suspicious" in UI text
   - Frame features as protective, not policing

2. TONE:
   - Supportive and collaborative (not accusatory)
   - Protective (helping the treasurer, not watching them)
   - Professional but warm (not corporate or cold)
   - Action-oriented (tight copy, not verbose paragraphs)

3. REFERENCE:
   - Full guidelines: /docs/BRAND-VOICE-GUIDE.md
   - Quick lookup: /docs/UI-COPY-REFERENCE.md
   - Examples follow approved patterns from these docs

4. COPY CHECKLIST:
   ✅ No "fraud" language in user-facing text
   ✅ Supportive, protective tone
   ✅ Tight, scannable copy (not long paragraphs)
   ✅ Frames features as helping users
   ✅ Would make volunteers feel trusted (not suspected)

Please confirm you've reviewed the brand voice guide before generating code.
```

---

## Quick Checklist for Developers

Before sending a prompt to Claude Code:

- [ ] Does the request involve user-facing text?
- [ ] Have I included the brand voice requirements section?
- [ ] Have I referenced the documentation files?
- [ ] Have I asked Claude Code to confirm review of guidelines?

---

## Common Scenarios & Quick Prompts

### Scenario 1: Updating Existing Component Copy
```
Review the [component name] at [file path] and update any user-facing text to comply with brand voice guidelines. Specifically check for "fraud" terminology and replace with protective language.

[Include BRAND VOICE REQUIREMENTS section from template above]
```

### Scenario 2: Creating New Feature
```
Build [feature description].

[Include BRAND VOICE REQUIREMENTS section from template above]
```

### Scenario 3: Writing Help Documentation
```
Write help documentation for [feature] that explains [functionality].

[Include BRAND VOICE REQUIREMENTS section from template above]

Additional context: This is for volunteer treasurers with limited accounting experience, so keep explanations simple and encouraging.
```

### Scenario 4: Error Message Review
```
Review all error messages in [file/component] and ensure they follow brand voice guidelines. Error messages should be helpful and clear without making users feel like they did something wrong or suspicious.

[Include BRAND VOICE REQUIREMENTS section from template above]
```

---

## Tips for Best Results

1. **Be Specific About Context**: Tell Claude Code this is for volunteers, not professional accountants

2. **Reference Documentation**: Always point to `/docs/BRAND-VOICE-GUIDE.md`

3. **Ask for Confirmation**: Include "Please confirm you've reviewed the brand voice guide"

4. **Provide Examples**: If Claude Code generates off-brand copy, give a specific example of the correct style

5. **Iterate**: If first attempt isn't quite right, ask Claude Code to revise with specific feedback

6. **Tone Feedback**: If copy is too formal/cold or too casual/vague, say: "Make this warmer but still professional" or "Make this more concise and action-oriented"

---

## What to Do If Claude Code Forgets

If Claude Code generates copy with "fraud" terminology:
```
Please revise this code to follow our brand voice guidelines at /docs/BRAND-VOICE-GUIDE.md.

Specifically, replace:
- "Fraud prevention" → "Financial protection"
- [Other specific instances]

Remember: Our tone should be supportive and protective, not accusatory. We're helping treasurers, not policing them.
```

---

## Save This Template

Save this file as: `/docs/BRAND-VOICE-PROMPT-TEMPLATE.md`

Then you can quickly reference it or copy sections when working with Claude Code on any UI-related tasks.

---

## Deliverable

This template ensures every interaction with Claude Code produces brand-compliant copy that:
- ✅ Uses protective, supportive language
- ✅ Avoids accusatory "fraud" terminology
- ✅ Makes volunteers feel trusted and supported
- ✅ Maintains tight, action-oriented copy
- ✅ Stays consistent across the entire application

Copy and use the template section in every prompt that involves user-facing text.
