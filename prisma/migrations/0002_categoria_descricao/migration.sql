-- AlterTable: add optional descricao to Categoria
ALTER TABLE "Categoria" ADD COLUMN IF NOT EXISTS "descricao" TEXT;
