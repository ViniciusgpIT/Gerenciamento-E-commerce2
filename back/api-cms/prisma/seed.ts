import { PrismaClient, StoreType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando seed do banco de dados...');

  try {
    // 1. Criar usuários
    console.log('👤 Criando usuários...');

    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedAdminPassword,
        name: 'Administrador Principal',
      },
    });
    console.log(`✅ Usuário administrador criado: ${adminUser.email}`);

    const hashedUserPassword = await bcrypt.hash('user123', 10);
    const regularUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: hashedUserPassword,
        name: 'Usuário Teste',
      },
    });
    console.log(`✅ Usuário comum criado: ${regularUser.email}`);

    // 2. Criar categorias principais
    console.log('📂 Criando categorias...');

    const camisetasCategory = await prisma.category.create({
      data: {
        name: 'Camisetas',
        description: 'Camisetas de algodão em várias cores e modelos',
        slug: 'camisetas',
        active: true,
      },
    });
    console.log(
      `✅ ${camisetasCategory.name} criada (ID: ${camisetasCategory.id})`,
    );

    const camisasCategory = await prisma.category.create({
      data: {
        name: 'Camisas',
        description: 'Camisas sociais e casuais',
        slug: 'camisas',
        active: true,
      },
    });
    console.log(
      `✅ ${camisasCategory.name} criada (ID: ${camisasCategory.id})`,
    );

    const calcasCategory = await prisma.category.create({
      data: {
        name: 'Calças',
        description: 'Calças jeans e sociais',
        slug: 'calcas',
        active: true,
      },
    });
    console.log(`✅ ${calcasCategory.name} criada (ID: ${calcasCategory.id})`);

    // 3. Criar subcategorias
    const camisetasBasicasCategory = await prisma.category.create({
      data: {
        name: 'Camisetas Básicas',
        description: 'Camisetas básicas de algodão',
        slug: 'camisetas-basicas',
        parentId: camisetasCategory.id,
        active: true,
      },
    });
    console.log(
      `✅ ${camisetasBasicasCategory.name} criada (ID: ${camisetasBasicasCategory.id})`,
    );

    const camisetasEstampadasCategory = await prisma.category.create({
      data: {
        name: 'Camisetas Estampadas',
        description: 'Camisetas com estampas exclusivas',
        slug: 'camisetas-estampadas',
        parentId: camisetasCategory.id,
        active: true,
      },
    });
    console.log(
      `✅ ${camisetasEstampadasCategory.name} criada (ID: ${camisetasEstampadasCategory.id})`,
    );

    // 4. Criar lojas
    console.log('🏬 Criando lojas...');

    const lojaCentro = await prisma.store.create({
      data: {
        name: 'Loja Centro',
        type: StoreType.FISICA,
        fullAddress: 'Av. Paulista, 123 - São Paulo, SP',
        openingHours: 'Segunda a Sexta: 09:00-18:00 | Sábado: 09:00-13:00',
        active: true,
      },
    });
    console.log(`✅ ${lojaCentro.name} criada (ID: ${lojaCentro.id})`);

    const lojaShopping = await prisma.store.create({
      data: {
        name: 'Loja Shopping Ibirapuera',
        type: StoreType.FISICA,
        fullAddress: 'Shopping Ibirapuera, Piso Térreo - São Paulo, SP',
        openingHours: 'Segunda a Domingo: 10:00-22:00',
        active: true,
      },
    });
    console.log(`✅ ${lojaShopping.name} criada (ID: ${lojaShopping.id})`);

    const lojaOnline = await prisma.store.create({
      data: {
        name: 'Loja Online Principal',
        type: StoreType.ONLINE,
        fullAddress: null,
        openingHours: null,
        active: true,
      },
    });
    console.log(`✅ ${lojaOnline.name} criada (ID: ${lojaOnline.id})`);

    const lojaInativa = await prisma.store.create({
      data: {
        name: 'Loja Inativa',
        type: StoreType.FISICA,
        fullAddress: 'Rua das Flores, 456 - São Paulo, SP',
        openingHours: 'Segunda a Sexta: 09:00-17:00',
        active: false,
      },
    });
    console.log(`✅ ${lojaInativa.name} criada (ID: ${lojaInativa.id})`);

    // 5. Criar produtos
    console.log('🎁 Criando produtos...');

    const produto1 = await prisma.product.create({
      data: {
        name: 'Camiseta Básica Branca',
        detailedDescription:
          'Camiseta 100% algodão, corte reto, dupla face, ideal para uso diário.',
        categoryId: camisetasBasicasCategory.id,
        price: 39.9,
        promotionalPrice: 34.9,
        sku: 'CAM-BAS-BRA-001',
        eanUpc: '7891234567890',
        sizes: ['P', 'M', 'G', 'GG'],
        colors: ['Branco'],
        images: [
          'https://exemplo.com/camiseta-branca-1.jpg',
          'https://exemplo.com/camiseta-branca-2.jpg',
        ],
        active: true,
      },
    });
    console.log(`✅ ${produto1.name} criado (SKU: ${produto1.sku})`);

    const produto2 = await prisma.product.create({
      data: {
        name: 'Camiseta Básica Preta',
        detailedDescription:
          'Camiseta preta 100% algodão, não desbota, alta durabilidade.',
        categoryId: camisetasBasicasCategory.id,
        price: 42.9,
        promotionalPrice: null,
        sku: 'CAM-BAS-PRE-001',
        eanUpc: '7891234567891',
        sizes: ['M', 'G', 'GG'],
        colors: ['Preto'],
        images: ['https://exemplo.com/camiseta-preta-1.jpg'],
        active: true,
      },
    });
    console.log(`✅ ${produto2.name} criado (SKU: ${produto2.sku})`);

    const produto3 = await prisma.product.create({
      data: {
        name: 'Camiseta Estampada Logotipo',
        detailedDescription:
          'Camiseta com estampa do logotipo da marca, 95% algodão 5% elastano.',
        categoryId: camisetasEstampadasCategory.id,
        price: 69.9,
        promotionalPrice: 59.9,
        sku: 'CAM-EST-LOG-001',
        eanUpc: '7891234567892',
        sizes: ['P', 'M', 'G'],
        colors: ['Vermelho', 'Azul', 'Verde'],
        images: [
          'https://exemplo.com/camiseta-estampada-1.jpg',
          'https://exemplo.com/camiseta-estampada-2.jpg',
          'https://exemplo.com/camiseta-estampada-3.jpg',
        ],
        active: true,
      },
    });
    console.log(`✅ ${produto3.name} criado (SKU: ${produto3.sku})`);

    const produto4 = await prisma.product.create({
      data: {
        name: 'Camisa Social Slim',
        detailedDescription:
          'Camisa social slim fit, tecido antiamassado, ideal para trabalho.',
        categoryId: camisasCategory.id,
        price: 129.9,
        promotionalPrice: 99.9,
        sku: 'CAM-SOC-SLM-001',
        eanUpc: '7891234567893',
        sizes: ['38', '40', '42', '44'],
        colors: ['Branco', 'Azul Marinho'],
        images: ['https://exemplo.com/camisa-social-1.jpg'],
        active: true,
      },
    });
    console.log(`✅ ${produto4.name} criado (SKU: ${produto4.sku})`);

    const produto5 = await prisma.product.create({
      data: {
        name: 'Produto Sem Estoque',
        detailedDescription: 'Produto para teste de alertas de estoque zerado.',
        categoryId: camisetasBasicasCategory.id,
        price: 29.9,
        promotionalPrice: null,
        sku: 'PROD-SEM-EST-001',
        eanUpc: '7891234567894',
        sizes: ['M'],
        colors: ['Cinza'],
        images: ['https://exemplo.com/produto-teste.jpg'],
        active: true,
      },
    });
    console.log(`✅ ${produto5.name} criado (SKU: ${produto5.sku})`);

    const produto6 = await prisma.product.create({
      data: {
        name: 'Produto Inativo',
        detailedDescription: 'Produto desativado para testes.',
        categoryId: camisetasEstampadasCategory.id,
        price: 49.9,
        promotionalPrice: null,
        sku: 'PROD-INAT-001',
        eanUpc: '7891234567895',
        sizes: ['G'],
        colors: ['Amarelo'],
        images: ['https://exemplo.com/produto-inativo.jpg'],
        active: false,
      },
    });
    console.log(`✅ ${produto6.name} criado (SKU: ${produto6.sku})`);

    // 6. Adicionar estoque aos produtos
    console.log('📦 Adicionando estoque...');

    // Adicionar estoque para os produtos ativos
    const lojasAtivas = [lojaCentro, lojaShopping, lojaOnline];

    // Para produto1 (Camiseta Básica Branca)
    for (const loja of lojasAtivas) {
      const quantidade = Math.floor(Math.random() * 100) + 10;
      await prisma.stockByStore.create({
        data: {
          productId: produto1.id,
          storeId: loja.id,
          quantity: loja.name === 'Loja Centro' ? 3 : quantidade, // Estoque crítico na Loja Centro
        },
      });
      console.log(
        `📊 ${produto1.name} - ${loja.name}: ${loja.name === 'Loja Centro' ? 3 : quantidade} unidades`,
      );
    }

    // Para produto2 (Camiseta Básica Preta)
    for (const loja of lojasAtivas) {
      const quantidade = Math.floor(Math.random() * 100) + 10;
      await prisma.stockByStore.create({
        data: {
          productId: produto2.id,
          storeId: loja.id,
          quantity: quantidade,
        },
      });
      console.log(`📊 ${produto2.name} - ${loja.name}: ${quantidade} unidades`);
    }

    // Para produto3 (Camiseta Estampada)
    for (const loja of lojasAtivas) {
      const quantidade = Math.floor(Math.random() * 100) + 10;
      await prisma.stockByStore.create({
        data: {
          productId: produto3.id,
          storeId: loja.id,
          quantity: quantidade,
        },
      });
      console.log(`📊 ${produto3.name} - ${loja.name}: ${quantidade} unidades`);
    }

    // Para produto4 (Camisa Social)
    for (const loja of lojasAtivas) {
      const quantidade = Math.floor(Math.random() * 100) + 10;
      await prisma.stockByStore.create({
        data: {
          productId: produto4.id,
          storeId: loja.id,
          quantity: quantidade,
        },
      });
      console.log(`📊 ${produto4.name} - ${loja.name}: ${quantidade} unidades`);
    }

    // Produto5 (Sem Estoque) - não adicionamos estoque
    console.log(`📊 ${produto5.name} - Sem estoque em nenhuma loja`);

    console.log('\n✨ Seed concluído com sucesso!');
    console.log('\n📋 Resumo do seed:');
    console.log(`👤 Usuários: 2 criados`);
    console.log(`📂 Categorias: 5 criadas`);
    console.log(`🏬 Lojas: 4 criadas (3 ativas)`);
    console.log(`🎁 Produtos: 6 criados (5 ativos)`);

    console.log('\n🔑 Credenciais para teste:');
    console.log('Administrador:');
    console.log('  Email: admin@example.com');
    console.log('  Senha: admin123');
    console.log('\nUsuário comum:');
    console.log('  Email: user@example.com');
    console.log('  Senha: user123');

    console.log('\n🚀 Para testar o login, use:');
    console.log('POST http://localhost:3000/auth/login');
    console.log('Body: {"email": "admin@example.com", "password": "admin123"}');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
