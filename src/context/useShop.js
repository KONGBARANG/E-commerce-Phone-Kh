import { useContext } from 'react';
import { StoreContext } from './StoreContext';

export function useShop() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useShop must be used within ShopProvider');
  return context;
}
