import { prisma } from '@/lib/prisma';

export async function createDefaultCategories(teamId: string) {
  const categories = [
    // Ice & Facilities
    { name: 'Ice Time', heading: 'Ice & Facilities', color: '#0EA5E9', sortOrder: 1 },
    { name: 'Facility Rental', heading: 'Ice & Facilities', color: '#0EA5E9', sortOrder: 2 },
    { name: 'Ice Maintenance', heading: 'Ice & Facilities', color: '#0EA5E9', sortOrder: 3 },

    // Equipment & Uniforms
    { name: 'Team Jerseys', heading: 'Equipment & Uniforms', color: '#8B5CF6', sortOrder: 4 },
    { name: 'Team Equipment', heading: 'Equipment & Uniforms', color: '#8B5CF6', sortOrder: 5 },
    { name: 'Goalie Equipment', heading: 'Equipment & Uniforms', color: '#8B5CF6', sortOrder: 6 },
    { name: 'Equipment Repairs', heading: 'Equipment & Uniforms', color: '#8B5CF6', sortOrder: 7 },

    // Tournament & League Fees
    { name: 'Tournament Entry Fees', heading: 'Tournament & League Fees', color: '#F59E0B', sortOrder: 8 },
    { name: 'League Registration', heading: 'Tournament & League Fees', color: '#F59E0B', sortOrder: 9 },
    { name: 'Exhibition Games', heading: 'Tournament & League Fees', color: '#F59E0B', sortOrder: 10 },

    // Travel & Accommodation
    { name: 'Hotels', heading: 'Travel & Accommodation', color: '#10B981', sortOrder: 11 },
    { name: 'Transportation', heading: 'Travel & Accommodation', color: '#10B981', sortOrder: 12 },
    { name: 'Meals', heading: 'Travel & Accommodation', color: '#10B981', sortOrder: 13 },

    // Coaching & Officials
    { name: 'Coaching Fees', heading: 'Coaching & Officials', color: '#EF4444', sortOrder: 14 },
    { name: 'Referee Fees', heading: 'Coaching & Officials', color: '#EF4444', sortOrder: 15 },
    { name: 'Trainer Fees', heading: 'Coaching & Officials', color: '#EF4444', sortOrder: 16 },

    // Fundraising & Events
    { name: 'Fundraising Costs', heading: 'Fundraising & Events', color: '#EC4899', sortOrder: 17 },
    { name: 'Team Events', heading: 'Fundraising & Events', color: '#EC4899', sortOrder: 18 },
    { name: 'Awards & Prizes', heading: 'Fundraising & Events', color: '#EC4899', sortOrder: 19 },

    // Administrative
    { name: 'Insurance', heading: 'Administrative', color: '#64748B', sortOrder: 20 },
    { name: 'Bank Fees', heading: 'Administrative', color: '#64748B', sortOrder: 21 },
    { name: 'Office Supplies', heading: 'Administrative', color: '#64748B', sortOrder: 22 },
    { name: 'Software & Tools', heading: 'Administrative', color: '#64748B', sortOrder: 23 },
    { name: 'Marketing & Advertising', heading: 'Administrative', color: '#64748B', sortOrder: 24 },

    // Other
    { name: 'Miscellaneous', heading: 'Other', color: '#94A3B8', sortOrder: 25 },
    { name: 'Uncategorized', heading: 'Other', color: '#94A3B8', sortOrder: 26 },
  ];

  await prisma.category.createMany({
    data: categories.map((cat) => ({
      teamId,
      name: cat.name,
      heading: cat.heading,
      color: cat.color,
      sortOrder: cat.sortOrder,
      isDefault: true,
    })),
  });
}
