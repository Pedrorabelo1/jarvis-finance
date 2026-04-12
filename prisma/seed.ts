import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@jarvis.app';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME = 'Demo';

const categoriasSaida = [
  { nome: 'Moradia', icone: 'Home', cor: '#3b82f6', orcamento: 2500 },
  { nome: 'Alimentação', icone: 'UtensilsCrossed', cor: '#22d3ee', orcamento: 1500 },
  { nome: 'Transporte', icone: 'Car', cor: '#60a5fa', orcamento: 800 },
  { nome: 'Saúde', icone: 'Heart', cor: '#fb7185', orcamento: 600 },
  { nome: 'Educação', icone: 'GraduationCap', cor: '#a5b4fc', orcamento: 500 },
  { nome: 'Lazer', icone: 'Gamepad2', cor: '#818cf8', orcamento: 400 },
  { nome: 'Assinaturas', icone: 'Repeat', cor: '#38bdf8', orcamento: 300 },
  { nome: 'Pets', icone: 'PawPrint', cor: '#93c5fd', orcamento: 200 },
  { nome: 'Vestuário', icone: 'ShoppingBag', cor: '#67e8f9', orcamento: 300 },
  { nome: 'Impostos', icone: 'FileText', cor: '#64748b', orcamento: null },
  { nome: 'Outros', icone: 'MoreHorizontal', cor: '#94a3b8', orcamento: null },
];

const categoriasEntrada = [
  { nome: 'Distribuição de Lucros', icone: 'Building2', cor: '#34d399' },
  { nome: 'Salário', icone: 'Briefcase', cor: '#2dd4bf' },
  { nome: 'Freelance', icone: 'Laptop', cor: '#22d3ee' },
  { nome: 'Aluguel Recebido', icone: 'Key', cor: '#60a5fa' },
  { nome: 'Dividendos', icone: 'TrendingUp', cor: '#a5b4fc' },
  { nome: 'Outros', icone: 'Plus', cor: '#94a3b8' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Wipe demo user data (idempotent re-seed)
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log('🧹 Removed existing demo user');
  }

  // Create demo user
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.create({
    data: { email: DEMO_EMAIL, name: DEMO_NAME, passwordHash },
  });
  console.log(`👤 Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // Categorias
  const createdSaidas = await Promise.all(
    categoriasSaida.map((c) =>
      prisma.categoria.create({ data: { ...c, tipo: 'saida', userId: user.id } })
    )
  );
  const createdEntradas = await Promise.all(
    categoriasEntrada.map((c) =>
      prisma.categoria.create({ data: { ...c, tipo: 'entrada', userId: user.id } })
    )
  );
  console.log(`✅ Created ${createdSaidas.length + createdEntradas.length} categorias`);

  const findSaida = (nome: string) => createdSaidas.find((c) => c.nome === nome)!;
  const findEntrada = (nome: string) => createdEntradas.find((c) => c.nome === nome)!;

  // Meta mensal
  await prisma.configuracao.create({
    data: { userId: user.id, chave: 'meta_mensal', valor: '3000' },
  });

  // Despesas fixas
  const fixas = [
    { descricao: 'Aluguel', valor: 2200, diaVencimento: 5, cat: 'Moradia' },
    { descricao: 'Internet', valor: 120, diaVencimento: 10, cat: 'Moradia' },
    { descricao: 'Energia elétrica', valor: 180, diaVencimento: 15, cat: 'Moradia' },
    { descricao: 'Netflix', valor: 55, diaVencimento: 12, cat: 'Assinaturas' },
    { descricao: 'Spotify', valor: 22, diaVencimento: 20, cat: 'Assinaturas' },
    { descricao: 'Plano de saúde', valor: 480, diaVencimento: 8, cat: 'Saúde' },
  ];

  for (const f of fixas) {
    await prisma.despesaFixa.create({
      data: {
        userId: user.id,
        descricao: f.descricao,
        valor: f.valor,
        diaVencimento: f.diaVencimento,
        categoriaId: findSaida(f.cat).id,
        dataInicio: new Date(2024, 0, 1),
        status: 'ativa',
      },
    });
  }
  console.log(`✅ Created ${fixas.length} despesas fixas`);

  // Lançamentos: 3 meses
  const today = new Date();
  const lancamentos: any[] = [];

  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const baseDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    lancamentos.push({
      userId: user.id,
      descricao: 'Distribuição mensal',
      valor: 8500,
      tipo: 'entrada',
      data: new Date(year, month, 5),
      categoriaId: findEntrada('Distribuição de Lucros').id,
    });
    lancamentos.push({
      userId: user.id,
      descricao: 'Projeto freelance',
      valor: 1200 + Math.random() * 800,
      tipo: 'entrada',
      data: new Date(year, month, 18),
      categoriaId: findEntrada('Freelance').id,
    });
    lancamentos.push({
      userId: user.id,
      descricao: 'Dividendos do mês',
      valor: 250 + Math.random() * 100,
      tipo: 'entrada',
      data: new Date(year, month, 25),
      categoriaId: findEntrada('Dividendos').id,
    });

    const saidas = [
      { d: 'Aluguel', v: 2200, cat: 'Moradia', day: 5 },
      { d: 'Internet', v: 120, cat: 'Moradia', day: 10 },
      { d: 'Energia', v: 165 + Math.random() * 50, cat: 'Moradia', day: 15 },
      { d: 'Supermercado', v: 420 + Math.random() * 100, cat: 'Alimentação', day: 3 },
      { d: 'Supermercado', v: 380 + Math.random() * 100, cat: 'Alimentação', day: 17 },
      { d: 'Restaurante', v: 85 + Math.random() * 40, cat: 'Alimentação', day: 8 },
      { d: 'Restaurante', v: 110 + Math.random() * 40, cat: 'Alimentação', day: 22 },
      { d: 'Uber', v: 45 + Math.random() * 30, cat: 'Transporte', day: 7 },
      { d: 'Uber', v: 38 + Math.random() * 30, cat: 'Transporte', day: 14 },
      { d: 'Combustível', v: 280 + Math.random() * 80, cat: 'Transporte', day: 20 },
      { d: 'Plano de saúde', v: 480, cat: 'Saúde', day: 8 },
      { d: 'Farmácia', v: 65 + Math.random() * 40, cat: 'Saúde', day: 19 },
      { d: 'Curso online', v: 197, cat: 'Educação', day: 11 },
      { d: 'Cinema', v: 60 + Math.random() * 30, cat: 'Lazer', day: 13 },
      { d: 'Show', v: 180 + Math.random() * 100, cat: 'Lazer', day: 24 },
      { d: 'Netflix', v: 55, cat: 'Assinaturas', day: 12 },
      { d: 'Spotify', v: 22, cat: 'Assinaturas', day: 20 },
      { d: 'Camiseta', v: 89 + Math.random() * 50, cat: 'Vestuário', day: 16 },
      { d: 'Ração', v: 120 + Math.random() * 30, cat: 'Pets', day: 6 },
    ];

    for (const s of saidas) {
      lancamentos.push({
        userId: user.id,
        descricao: s.d,
        valor: Math.round(s.v * 100) / 100,
        tipo: 'saida',
        data: new Date(year, month, s.day),
        categoriaId: findSaida(s.cat).id,
      });
    }
  }

  for (const l of lancamentos) {
    await prisma.lancamento.create({ data: l });
  }
  console.log(`✅ Created ${lancamentos.length} lançamentos`);

  // Investimentos
  const investimentos = [
    { descricao: 'Tesouro Selic', valor: 5000, classe: 'renda_fixa', data: new Date(2024, 0, 15) },
    { descricao: 'CDB Banco Inter', valor: 3000, classe: 'renda_fixa', data: new Date(2024, 1, 20) },
    { descricao: 'ITSA4', valor: 1500, classe: 'acoes', data: new Date(2024, 2, 10) },
    { descricao: 'BBAS3', valor: 2000, classe: 'acoes', data: new Date(2024, 3, 5) },
    { descricao: 'HGLG11', valor: 1800, classe: 'fiis', data: new Date(2024, 4, 12) },
    { descricao: 'KNRI11', valor: 1600, classe: 'fiis', data: new Date(2024, 5, 8) },
    { descricao: 'Bitcoin', valor: 1000, classe: 'cripto', data: new Date(2024, 6, 22) },
    { descricao: 'Tesouro IPCA', valor: 4000, classe: 'renda_fixa', data: new Date(2024, 7, 18) },
    { descricao: 'VWRA ETF', valor: 2500, classe: 'internacional', data: new Date(2024, 8, 14) },
    { descricao: 'XPLG11', valor: 1500, classe: 'fiis', data: new Date(2024, 9, 9) },
    { descricao: 'Ethereum', valor: 800, classe: 'cripto', data: new Date(2024, 10, 16) },
    { descricao: 'Tesouro Selic', valor: 2500, classe: 'renda_fixa', data: new Date(2024, 11, 20) },
  ];
  for (const inv of investimentos) {
    await prisma.investimento.create({ data: { ...inv, userId: user.id } });
  }
  console.log(`✅ Created ${investimentos.length} investimentos`);

  console.log('🎉 Seed completed!');
  console.log(`\n👉 Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
