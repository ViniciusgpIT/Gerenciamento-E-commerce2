
// A modelagem com interfaces garante a segurança de tipos em toda a aplicação.
export interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
  parentId: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}