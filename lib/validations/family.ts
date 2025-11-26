import { z } from 'zod';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Schema for a single family
export const familySchema = z.object({
  familyName: z.string()
    .min(1, 'Family name is required')
    .max(100, 'Family name must be less than 100 characters')
    .trim(),
  primaryEmail: z.string()
    .min(1, 'Primary email is required')
    .regex(emailRegex, 'Invalid email format')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  secondaryEmail: z.string()
    .regex(emailRegex, 'Invalid email format')
    .email('Invalid email format')
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal('')),
});

// Schema for an array of families
export const familiesSchema = z.array(familySchema);

// Type definitions
export type Family = z.infer<typeof familySchema>;
export type Families = z.infer<typeof familiesSchema>;

// Row-level validation result
export interface FamilyValidationResult {
  rowNumber: number;
  data: Partial<Family>;
  isValid: boolean;
  errors: string[];
}

// Validation function with detailed error reporting
export function validateFamilies(
  families: Partial<Family>[],
  existingEmails: string[] = []
): {
  validFamilies: Family[];
  errors: FamilyValidationResult[];
  hasDuplicates: boolean;
  duplicateEmails: string[];
} {
  const validFamilies: Family[] = [];
  const errors: FamilyValidationResult[] = [];
  const allEmails = new Set(existingEmails.map(e => e.toLowerCase()));
  const duplicateEmails: string[] = [];

  families.forEach((family, index) => {
    const rowNumber = index + 1; // 1-based for user display (skip instruction row)
    const rowErrors: string[] = [];

    try {
      // Validate with schema
      const validatedFamily = familySchema.parse(family);

      // Check for duplicate primary email
      const primaryEmail = validatedFamily.primaryEmail.toLowerCase();
      if (allEmails.has(primaryEmail)) {
        rowErrors.push(`Duplicate primary email: ${primaryEmail}`);
        if (!duplicateEmails.includes(primaryEmail)) {
          duplicateEmails.push(primaryEmail);
        }
      } else {
        allEmails.add(primaryEmail);
      }

      // Check for duplicate secondary email (if provided)
      if (validatedFamily.secondaryEmail) {
        const secondaryEmail = validatedFamily.secondaryEmail.toLowerCase();
        if (allEmails.has(secondaryEmail)) {
          rowErrors.push(`Duplicate secondary email: ${secondaryEmail}`);
          if (!duplicateEmails.includes(secondaryEmail)) {
            duplicateEmails.push(secondaryEmail);
          }
        } else {
          allEmails.add(secondaryEmail);
        }
      }

      if (rowErrors.length === 0) {
        validFamilies.push(validatedFamily);
      } else {
        errors.push({
          rowNumber,
          data: family,
          isValid: false,
          errors: rowErrors,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors = error.errors.map(e => e.message);
        errors.push({
          rowNumber,
          data: family,
          isValid: false,
          errors: zodErrors,
        });
      } else {
        errors.push({
          rowNumber,
          data: family,
          isValid: false,
          errors: ['Invalid data format'],
        });
      }
    }
  });

  return {
    validFamilies,
    errors,
    hasDuplicates: duplicateEmails.length > 0,
    duplicateEmails,
  };
}
