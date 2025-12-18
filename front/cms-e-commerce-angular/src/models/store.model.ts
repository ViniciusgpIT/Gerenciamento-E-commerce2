export interface Store {
  id: number;
  name: string;
  type: 'FISICA' | 'ONLINE';
  fullAddress: string | null;
  openingHours: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockByStore {
    storeId: number;
    quantity: number;
    // Adicionado para corresponder à resposta da API que pode incluir detalhes da loja.
    store?: {
      id: number;
      name: string;
    }
}