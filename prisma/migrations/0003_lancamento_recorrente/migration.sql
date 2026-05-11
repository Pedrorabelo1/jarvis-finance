-- AlterTable: add recorrente flag to Lancamento
ALTER TABLE "Lancamento" ADD COLUMN IF NOT EXISTS "recorrente" BOOLEAN NOT NULL DEFAULT FALSE;
