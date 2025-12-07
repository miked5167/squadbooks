/**
 * Custom Plaid Sandbox Configuration for Hockey Team Banking
 *
 * This configuration creates a realistic hockey team bank account with
 * typical transactions including registration fees, ice rental, equipment
 * purchases, and tournament fees.
 */

export interface SandboxTransaction {
  date_transacted: string;
  amount: number;
  description: string;
  currency?: string;
}

export interface SandboxAccount {
  type: 'depository' | 'credit' | 'loan' | 'investment';
  subtype: string;
  starting_balance: number;
  meta: {
    name: string;
    official_name?: string;
    limit?: number | null;
    mask: string;
  };
  transactions: SandboxTransaction[];
}

export interface SandboxUserConfig {
  override_username: string;
  override_password: string;
  override_accounts: SandboxAccount[];
}

/**
 * Generates custom hockey team sandbox test data
 * Transactions use relative dates (days ago from when Item is created)
 */
export function getHockeyTeamSandboxConfig(): SandboxUserConfig {
  // Calculate dates (relative to today)
  const today = new Date();
  const formatDate = (daysAgo: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  const transactions: SandboxTransaction[] = [
    // Player Registration Income (Credits = negative amounts in Plaid)
    {
      date_transacted: formatDate(45),
      amount: -650.00,
      description: 'Player Registration - Anderson Family',
    },
    {
      date_transacted: formatDate(43),
      amount: -500.00,
      description: 'Player Registration - Martinez Family',
    },
    {
      date_transacted: formatDate(40),
      amount: -750.00,
      description: 'Player Registration - Chen Family',
    },
    {
      date_transacted: formatDate(38),
      amount: -600.00,
      description: 'Player Registration - Thompson Family',
    },
    {
      date_transacted: formatDate(35),
      amount: -800.00,
      description: 'Player Registration - Johnson Family',
    },

    // Ice Rental & Facility Expenses (Debits = positive amounts)
    {
      date_transacted: formatDate(42),
      amount: 350.00,
      description: 'Ice Time Rental - Community Arena',
    },
    {
      date_transacted: formatDate(35),
      amount: 450.00,
      description: 'Ice Time Rental - Community Arena',
    },
    {
      date_transacted: formatDate(28),
      amount: 350.00,
      description: 'Ice Time Rental - Community Arena',
    },
    {
      date_transacted: formatDate(21),
      amount: 500.00,
      description: 'Arena Rental - Tournament Practice',
    },
    {
      date_transacted: formatDate(14),
      amount: 350.00,
      description: 'Ice Time Rental - Community Arena',
    },
    {
      date_transacted: formatDate(7),
      amount: 350.00,
      description: 'Ice Time Rental - Community Arena',
    },

    // Equipment Purchases
    {
      date_transacted: formatDate(50),
      amount: 1850.00,
      description: 'Team Jerseys - Pro Hockey Supply',
    },
    {
      date_transacted: formatDate(30),
      amount: 425.00,
      description: 'Practice Pucks and Cones - Hockey Depot',
    },
    {
      date_transacted: formatDate(20),
      amount: 1200.00,
      description: 'Goalie Equipment - Elite Sports',
    },
    {
      date_transacted: formatDate(10),
      amount: 675.00,
      description: 'Training Equipment - Sports Authority',
    },

    // Tournament Fees
    {
      date_transacted: formatDate(37),
      amount: 850.00,
      description: 'Tournament Registration - State Championships',
    },
    {
      date_transacted: formatDate(15),
      amount: 1200.00,
      description: 'Tournament Registration - Regional Invitational',
    },

    // Other Team Expenses
    {
      date_transacted: formatDate(32),
      amount: 125.00,
      description: 'First Aid Kit and Supplies',
    },
    {
      date_transacted: formatDate(25),
      amount: 89.00,
      description: 'Water Bottles - Team Store',
    },
    {
      date_transacted: formatDate(18),
      amount: 200.00,
      description: 'Coaching Certification Fee',
    },

    // Fundraising Income
    {
      date_transacted: formatDate(29),
      amount: -450.00,
      description: 'Fundraiser - Car Wash Event',
    },
    {
      date_transacted: formatDate(12),
      amount: -325.00,
      description: 'Fundraiser - Bake Sale',
    },

    // Recent transactions (last week)
    {
      date_transacted: formatDate(5),
      amount: -550.00,
      description: 'Player Registration - Williams Family',
    },
    {
      date_transacted: formatDate(3),
      amount: 350.00,
      description: 'Ice Time Rental - Community Arena',
    },
    {
      date_transacted: formatDate(1),
      amount: 95.00,
      description: 'Team Snacks - Grocery Store',
    },
  ];

  const accountConfig = [
    {
      type: 'depository' as const,
      subtype: 'checking',
      starting_balance: 15000.00,
      meta: {
        name: 'Hockey Team Operating Account',
        official_name: 'Team Checking',
        mask: '4321',
      },
      transactions,
    },
  ];

  return {
    override_username: 'custom_hockey',
    override_password: 'pass_good',
    override_accounts: accountConfig,
  };
}

/**
 * Helper to get just the username/password for Plaid Link
 */
export function getHockeyTeamCredentials() {
  const config = getHockeyTeamSandboxConfig();
  return {
    username: config.override_username,
    password: config.override_password,
  };
}
