export type AssetType = 'Stock' | 'ETF' | 'Fund' | 'Insurance' | 'Gold' | 'Cash' | 'Other';

export interface Investment {
  id: number;
  name: string;
  type: AssetType;
  amount: number;
  cost: number;
  current_price: number;
  currency: string;
  date: string;
}

export const ASSET_TYPES: { value: AssetType; label: string; color: string }[] = [
  { value: 'Stock', label: '股票', color: '#3b82f6' },
  { value: 'ETF', label: 'ETF', color: '#10b981' },
  { value: 'Fund', label: '基金', color: '#f59e0b' },
  { value: 'Insurance', label: '投資型保單', color: '#8b5cf6' },
  { value: 'Gold', label: '黃金', color: '#fbbf24' },
  { value: 'Cash', label: '現金/定存', color: '#64748b' },
  { value: 'Other', label: '其他', color: '#ec4899' },
];
