import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
// A importação do roleGuard agora é necessária.
import { roleGuard } from './guards/role.guard';

// As rotas são configuradas para separar as páginas públicas das privadas.
export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    title: 'Login'
  },
  {
    // Rota "pai" para o layout principal do app.
    // Todas as rotas filhas exigirão autenticação por causa do canActivate.
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard'
      },
      {
        path: 'products',
        loadComponent: () => import('./components/products/product-list/product-list.component').then(m => m.ProductListComponent),
        title: 'Produtos'
      },
      {
        path: 'products/new',
        canActivate: [roleGuard('ADMIN')], // Reativado
        loadComponent: () => import('./components/products/product-form/product-form.component').then(m => m.ProductFormComponent),
        title: 'Novo Produto'
      },
      {
        path: 'products/edit/:sku',
        canActivate: [roleGuard('ADMIN')], // Reativado
        loadComponent: () => import('./components/products/product-form/product-form.component').then(m => m.ProductFormComponent),
        title: 'Editar Produto'
      },
      {
        path: 'product/:sku',
        loadComponent: () => import('./components/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
        title: 'Detalhes do Produto'
      },
      {
        path: 'categories',
        loadComponent: () => import('./components/categories/category-list/category-list.component').then(m => m.CategoryListComponent),
        title: 'Categorias'
      },
      {
        path: 'categories/new',
        canActivate: [roleGuard('ADMIN')], // Reativado
        loadComponent: () => import('./components/categories/category-form/category-form.component').then(m => m.CategoryFormComponent),
        title: 'Nova Categoria'
      },
      {
        path: 'categories/edit/:slug',
        canActivate: [roleGuard('ADMIN')], // Reativado
        loadComponent: () => import('./components/categories/category-form/category-form.component').then(m => m.CategoryFormComponent),
        title: 'Editar Categoria'
      },
      {
        path: 'stores',
        loadComponent: () => import('./components/stores/store-list/store-list.component').then(m => m.StoreListComponent),
        title: 'Lojas'
      },
      {
        path: 'stores/new',
        canActivate: [roleGuard('ADMIN')], // Reativado
        loadComponent: () => import('./components/stores/store-form/store-form.component').then(m => m.StoreFormComponent),
        title: 'Nova Loja'
      },
      {
        path: 'stores/edit/:id',
        canActivate: [roleGuard('ADMIN')], // Reativado
        loadComponent: () => import('./components/stores/store-form/store-form.component').then(m => m.StoreFormComponent),
        title: 'Editar Loja'
      },
      {
        path: 'storefront',
        loadComponent: () => import('./components/storefront/storefront.component').then(m => m.StorefrontComponent),
        title: 'Vitrine'
      },
      {
        path: 'audit',
        loadComponent: () => import('./components/audit/audit-log.component').then(m => m.AuditLogComponent),
        title: 'Auditoria'
      },
    ]
  },
  {
    path: '**', // Rota coringa para páginas não encontradas
    redirectTo: '' // Redireciona para a rota padrão, que será protegida pelo guard.
  }
];