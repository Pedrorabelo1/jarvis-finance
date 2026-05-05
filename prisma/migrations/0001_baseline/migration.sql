-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "orcamento" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "tags" TEXT,
    "parcelas" INTEGER,
    "parcelaAtual" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DespesaFixa" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ativa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DespesaFixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoValor" (
    "id" TEXT NOT NULL,
    "despesaFixaId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataAlteracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoValor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investimento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "quantidadeBTC" DOUBLE PRECISION,
    "classe" TEXT,
    "categoriaInvestimentoId" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegraDestinatario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "padrao" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegraDestinatario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentabilidadeConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classe" TEXT NOT NULL,
    "taxaMensal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentabilidadeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaInvestimento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aporteMensal" DOUBLE PRECISION,
    "patrimonioAlvo" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaInvestimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaInvestimento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#3b82f6',
    "icone" TEXT NOT NULL DEFAULT '📈',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaInvestimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendimentoMensal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoriaInvestimentoId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "valorRendimento" DOUBLE PRECISION,
    "percentual" DOUBLE PRECISION,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RendimentoMensal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Categoria_userId_idx" ON "Categoria"("userId");

-- CreateIndex
CREATE INDEX "Lancamento_userId_idx" ON "Lancamento"("userId");

-- CreateIndex
CREATE INDEX "Lancamento_data_idx" ON "Lancamento"("data");

-- CreateIndex
CREATE INDEX "Lancamento_categoriaId_idx" ON "Lancamento"("categoriaId");

-- CreateIndex
CREATE INDEX "DespesaFixa_userId_idx" ON "DespesaFixa"("userId");

-- CreateIndex
CREATE INDEX "Investimento_userId_idx" ON "Investimento"("userId");

-- CreateIndex
CREATE INDEX "Investimento_data_idx" ON "Investimento"("data");

-- CreateIndex
CREATE INDEX "Configuracao_userId_idx" ON "Configuracao"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracao_userId_chave_key" ON "Configuracao"("userId", "chave");

-- CreateIndex
CREATE INDEX "RegraDestinatario_userId_idx" ON "RegraDestinatario"("userId");

-- CreateIndex
CREATE INDEX "RentabilidadeConfig_userId_idx" ON "RentabilidadeConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RentabilidadeConfig_userId_classe_key" ON "RentabilidadeConfig"("userId", "classe");

-- CreateIndex
CREATE UNIQUE INDEX "MetaInvestimento_userId_key" ON "MetaInvestimento"("userId");

-- CreateIndex
CREATE INDEX "CategoriaInvestimento_userId_idx" ON "CategoriaInvestimento"("userId");

-- CreateIndex
CREATE INDEX "RendimentoMensal_userId_idx" ON "RendimentoMensal"("userId");

-- CreateIndex
CREATE INDEX "RendimentoMensal_categoriaInvestimentoId_idx" ON "RendimentoMensal"("categoriaInvestimentoId");

-- CreateIndex
CREATE UNIQUE INDEX "RendimentoMensal_userId_categoriaInvestimentoId_ano_mes_key" ON "RendimentoMensal"("userId", "categoriaInvestimentoId", "ano", "mes");

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaFixa" ADD CONSTRAINT "DespesaFixa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaFixa" ADD CONSTRAINT "DespesaFixa_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoValor" ADD CONSTRAINT "HistoricoValor_despesaFixaId_fkey" FOREIGN KEY ("despesaFixaId") REFERENCES "DespesaFixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investimento" ADD CONSTRAINT "Investimento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investimento" ADD CONSTRAINT "Investimento_categoriaInvestimentoId_fkey" FOREIGN KEY ("categoriaInvestimentoId") REFERENCES "CategoriaInvestimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuracao" ADD CONSTRAINT "Configuracao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDestinatario" ADD CONSTRAINT "RegraDestinatario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraDestinatario" ADD CONSTRAINT "RegraDestinatario_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentabilidadeConfig" ADD CONSTRAINT "RentabilidadeConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaInvestimento" ADD CONSTRAINT "MetaInvestimento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaInvestimento" ADD CONSTRAINT "CategoriaInvestimento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendimentoMensal" ADD CONSTRAINT "RendimentoMensal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendimentoMensal" ADD CONSTRAINT "RendimentoMensal_categoriaInvestimentoId_fkey" FOREIGN KEY ("categoriaInvestimentoId") REFERENCES "CategoriaInvestimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
