

export interface IProfitLossSheetQuery {
  basis: string,
  fromDate: Date | string,
  toDate: Date | string,
  numberFormat: {
    noCents: boolean,
    divideOn1000: boolean,
  },
  noneZero: boolean,
  noneTransactions: boolean,
  accountsIds: number[],
  displayColumnsType: 'total' | 'date_periods',
  displayColumnsBy: string,
};

export interface IProfitLossSheetTotal {
  amount: number,
  formattedAmount: string,
  currencyCode: string,
  date?: Date|string,
};

export interface IProfitLossSheetAccount {
  id: number,
  index: number,
  name: string,
  code: string,
  parentAccountId: number,
  hasTransactions: boolean,
  total: IProfitLossSheetTotal,
  totalPeriods: IProfitLossSheetTotal[],
};

export interface IProfitLossSheetAccountsSection {
  sectionTitle: string,
  entryNormal: 'credit',
  accounts: IProfitLossSheetAccount[],
  total: IProfitLossSheetTotal,
  totalPeriods?: IProfitLossSheetTotal[],
};

export interface IProfitLossSheetTotalSection {
  total: IProfitLossSheetTotal,
  totalPeriods?: IProfitLossSheetTotal[],
};

export interface IProfitLossSheetStatement {
  income: IProfitLossSheetAccountsSection,
  costOfSales: IProfitLossSheetAccountsSection,
  expenses: IProfitLossSheetAccountsSection,
  otherExpenses: IProfitLossSheetAccountsSection,

  netIncome: IProfitLossSheetTotalSection;
  operatingProfit: IProfitLossSheetTotalSection;
  grossProfit: IProfitLossSheetTotalSection;
};