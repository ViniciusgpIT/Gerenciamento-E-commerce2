import { StockByStore } from './store.model';

export interface Product {
  id: number;
  name: string;
  detailedDescription: string;
  categoryId: number;
  price: number;
  promotionalPrice: number | null;
  sku: string;
  eanUpc: string | null;
  sizes: string[];
  colors: string[];
  images: string[]; // mínimo 1, máximo 8
  stocks: StockByStore[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // Adicionado para corresponder à resposta da API que já inclui o objeto de categoria aninhado.
  // Isso otimiza a exibição de dados sem a necessidade de buscas adicionais.
  category?: {
    id: number;
    name: string;
  };
}

// Criamos um tipo estendido para facilitar a exibição de dados relacionados na UI.
export interface ProductWithCategory extends Product {
    categoryName: string;
}

// Novo tipo que inclui também o estoque total calculado.
export interface ProductWithDetails extends ProductWithCategory {
    totalStock: number;
}