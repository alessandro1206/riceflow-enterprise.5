
export const CompanyType = {
    PRODUCTION: 'PRODUCTION',
    TRADING: 'TRADING',
    DIRECT: 'DIRECT'
} as const;

export const TransactionType = {
    SALE: 'SALE',
    PURCHASE: 'PURCHASE',
    PRODUCTION: 'PRODUCTION',
    TRANSFER: 'TRANSFER'
} as const;

export interface MasterSupplier { 
    id: string; 
    name: string; 
}

export interface MasterCustomer { 
    id: string; 
    name: string; 
    code: string; 
}

export interface Pile { 
    id: string; 
    currentWeight: number; 
    type: string; 
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

export interface CustomerOrder {
    id: string;
    customerName: string;
    customerCode: string;
    items: OrderItem[];
    totalValue: number;
    isCredit: boolean;
    date: string;
}

export interface ProductionInput {
    pileId: string;
    weight: number;
}

export interface ProductionOutput {
    productId: string;
    weight: number;
}

export interface ProductionRecord {
    id: string; 
    date: string; 
    inputs: ProductionInput[];
    outputs: ProductionOutput[];
    totalInputWeight: number; 
    totalOutputWeight: number;
    yieldPercentage: number;
}

export interface JournalLine {
    accountId: string;
    debit: number;
    credit: number;
}

export interface JournalEntry {
    id: string;
    date: string;
    description: string;
    lines: JournalLine[];
}

export interface Account { 
    code: string; 
    name: string; 
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'; 
}

export interface InventoryItem { 
    id: string; 
    productName: string; 
    quantity: number; 
}

export interface BusinessState {
    piles: Pile[]; 
    inventory: InventoryItem[]; 
    masterSuppliers: MasterSupplier[]; 
    masterCustomers: MasterCustomer[]; 
    purchaseBook: any[]; 
    productionBook: ProductionRecord[]; 
    salesBook: CustomerOrder[];
    directSalesBook: CustomerOrder[];
    expenseBook: any[];
    accounts: Account[]; 
    journal: JournalEntry[]; 
}
