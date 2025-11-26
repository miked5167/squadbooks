import { prisma } from '@/lib/prisma';

export async function createDefaultCategories(teamId: string) {
  const expenseCategories = [
    // Ice & Facilities
    { name: 'Ice Time', heading: 'Ice & Facilities', color: '#0EA5E9', type: 'EXPENSE', sortOrder: 1 },
    { name: 'Facility Rental', heading: 'Ice & Facilities', color: '#0EA5E9', type: 'EXPENSE', sortOrder: 2 },
    { name: 'Ice Maintenance', heading: 'Ice & Facilities', color: '#0EA5E9', type: 'EXPENSE', sortOrder: 3 },

    // Equipment & Uniforms
    { name: 'Team Jerseys', heading: 'Equipment & Uniforms', color: '#8B5CF6', type: 'EXPENSE', sortOrder: 4 },
    { name: 'Team Equipment', heading: 'Equipment & Uniforms', color: '#8B5CF6', type: 'EXPENSE', sortOrder: 5 },
    { name: 'Goalie Equipment', heading: 'Equipment & Uniforms', color: '#8B5CF6', type: 'EXPENSE', sortOrder: 6 },
    { name: 'Equipment Repairs', heading: 'Equipment & Uniforms', color: '#8B5CF6', type: 'EXPENSE', sortOrder: 7 },

    // Tournament & League Fees
    { name: 'Tournament Entry Fees', heading: 'Tournament & League Fees', color: '#F59E0B', type: 'EXPENSE', sortOrder: 8 },
    { name: 'League Registration', heading: 'Tournament & League Fees', color: '#F59E0B', type: 'EXPENSE', sortOrder: 9 },
    { name: 'Exhibition Games', heading: 'Tournament & League Fees', color: '#F59E0B', type: 'EXPENSE', sortOrder: 10 },

    // Travel & Accommodation
    { name: 'Hotels', heading: 'Travel & Accommodation', color: '#10B981', type: 'EXPENSE', sortOrder: 11 },
    { name: 'Transportation', heading: 'Travel & Accommodation', color: '#10B981', type: 'EXPENSE', sortOrder: 12 },
    { name: 'Meals', heading: 'Travel & Accommodation', color: '#10B981', type: 'EXPENSE', sortOrder: 13 },

    // Coaching & Officials
    { name: 'Coaching Fees', heading: 'Coaching & Officials', color: '#EF4444', type: 'EXPENSE', sortOrder: 14 },
    { name: 'Referee Fees', heading: 'Coaching & Officials', color: '#EF4444', type: 'EXPENSE', sortOrder: 15 },
    { name: 'Trainer Fees', heading: 'Coaching & Officials', color: '#EF4444', type: 'EXPENSE', sortOrder: 16 },

    // Fundraising & Events
    { name: 'Fundraising Costs', heading: 'Fundraising & Events', color: '#EC4899', type: 'EXPENSE', sortOrder: 17 },
    { name: 'Team Events', heading: 'Fundraising & Events', color: '#EC4899', type: 'EXPENSE', sortOrder: 18 },
    { name: 'Awards & Prizes', heading: 'Fundraising & Events', color: '#EC4899', type: 'EXPENSE', sortOrder: 19 },

    // Administrative
    { name: 'Insurance', heading: 'Administrative', color: '#64748B', type: 'EXPENSE', sortOrder: 20 },
    { name: 'Bank Fees', heading: 'Administrative', color: '#64748B', type: 'EXPENSE', sortOrder: 21 },
    { name: 'Office Supplies', heading: 'Administrative', color: '#64748B', type: 'EXPENSE', sortOrder: 22 },
    { name: 'Software & Tools', heading: 'Administrative', color: '#64748B', type: 'EXPENSE', sortOrder: 23 },
    { name: 'Marketing & Advertising', heading: 'Administrative', color: '#64748B', type: 'EXPENSE', sortOrder: 24 },

    // Other
    { name: 'Miscellaneous', heading: 'Other', color: '#94A3B8', type: 'EXPENSE', sortOrder: 25 },
    { name: 'Uncategorized', heading: 'Other', color: '#94A3B8', type: 'EXPENSE', sortOrder: 26 },
  ];

  const incomeCategories = [
    // Income Categories
    { name: 'Registration Fees', heading: 'Fundraising & Income', color: '#10B981', type: 'INCOME', sortOrder: 101 },
    { name: 'Tryout Fees', heading: 'Fundraising & Income', color: '#10B981', type: 'INCOME', sortOrder: 102 },
    { name: 'Team Fees', heading: 'Fundraising & Income', color: '#10B981', type: 'INCOME', sortOrder: 103 },
    { name: 'Fundraising Revenue', heading: 'Fundraising & Income', color: '#22C55E', type: 'INCOME', sortOrder: 104 },
    { name: 'Sponsorships', heading: 'Fundraising & Income', color: '#22C55E', type: 'INCOME', sortOrder: 105 },
    { name: 'Donations', heading: 'Fundraising & Income', color: '#22C55E', type: 'INCOME', sortOrder: 106 },
    { name: 'Grants', heading: 'Fundraising & Income', color: '#22C55E', type: 'INCOME', sortOrder: 107 },
    { name: 'Apparel Sales', heading: 'Fundraising & Income', color: '#059669', type: 'INCOME', sortOrder: 108 },
    { name: 'Raffle/50-50', heading: 'Fundraising & Income', color: '#059669', type: 'INCOME', sortOrder: 109 },
    { name: 'Other Income', heading: 'Fundraising & Income', color: '#047857', type: 'INCOME', sortOrder: 110 },
  ];

  await prisma.category.createMany({
    data: [...expenseCategories, ...incomeCategories].map((cat) => ({
      teamId,
      name: cat.name,
      heading: cat.heading,
      color: cat.color,
      type: cat.type,
      sortOrder: cat.sortOrder,
      isDefault: true,
    })),
  });
}
