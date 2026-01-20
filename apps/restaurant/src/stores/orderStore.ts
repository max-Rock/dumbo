import { create } from 'zustand';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  items: any[];
  total: number;
  customerNotes?: string;
  customer: {
    user: {
      name: string;
      phone: string;
    };
  };
  placedAt: string;
  estimatedPrepTime?: number;
}

interface OrdersState {
  activeOrders: Order[];
  orderHistory: Order[];
  isLoading: boolean;
  
  setActiveOrders: (orders: Order[]) => void;
  setOrderHistory: (orders: Order[]) => void;
  addNewOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeFromActive: (orderId: string) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  activeOrders: [],
  orderHistory: [],
  isLoading: false,
  
  setActiveOrders: (orders) => set({ activeOrders: orders }),
  
  setOrderHistory: (orders) => set({ orderHistory: orders }),
  
  addNewOrder: (order) =>
    set((state) => ({
      activeOrders: [order, ...state.activeOrders],
    })),
  
  updateOrder: (orderId, updates) =>
    set((state) => ({
      activeOrders: state.activeOrders.map((order) =>
        order.id === orderId ? { ...order, ...updates } : order
      ),
    })),
  
  removeFromActive: (orderId) =>
    set((state) => ({
      activeOrders: state.activeOrders.filter((order) => order.id !== orderId),
    })),
}));