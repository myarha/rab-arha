export interface BudgetItem {
  id: string;
  name: string;
  estimatedCost: number;
  actualCost: number;
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  items: BudgetItem[];
}

export interface WeddingBudget {
  totalLimit: number;
  categories: BudgetCategory[];
}
