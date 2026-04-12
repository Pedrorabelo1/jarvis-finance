'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Categoria, Lancamento, TipoLancamento } from '@/types';
import { IconRenderer } from '@/components/ui/IconRenderer';

const schema = z.object({
  tipo: z.enum(['entrada', 'saida']),
  valor: z.coerce.number().positive('Valor obrigatório'),
  data: z.string().min(1),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  categoriaId: z.string().min(1, 'Selecione uma categoria'),
  tags: z.string().optional(),
  hasParcelas: z.boolean().optional(),
  parcelas: z.coerce.number().int().positive().optional(),
  parcelaAtual: z.coerce.number().int().positive().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Lancamento;
  onSuccess?: () => void;
}

export function LancamentoForm({ initial, onSuccess }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: initial?.tipo || 'saida',
      valor: initial?.valor,
      data: initial?.data ? initial.data.slice(0, 10) : new Date().toISOString().slice(0, 10),
      descricao: initial?.descricao || '',
      categoriaId: initial?.categoriaId || '',
      tags: initial?.tags || '',
      hasParcelas: !!initial?.parcelas,
      parcelas: initial?.parcelas || undefined,
      parcelaAtual: initial?.parcelaAtual || undefined,
    },
  });

  const tipo = watch('tipo') as TipoLancamento;
  const hasParcelas = watch('hasParcelas');

  useEffect(() => {
    fetch(`/api/categorias?tipo=${tipo}`)
      .then((r) => r.json())
      .then((d) => setCategorias(d.data || []));
  }, [tipo]);

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const payload = {
        descricao: data.descricao,
        valor: data.valor,
        tipo: data.tipo,
        data: data.data,
        categoriaId: data.categoriaId,
        tags: data.tags || null,
        parcelas: data.hasParcelas ? data.parcelas : null,
        parcelaAtual: data.hasParcelas ? data.parcelaAtual : null,
      };
      const url = initial ? `/api/lancamentos/${initial.id}` : '/api/lancamentos';
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(initial ? 'Lançamento atualizado' : 'Lançamento criado');
      onSuccess?.();
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Tipo toggle */}
      <Controller
        control={control}
        name="tipo"
        render={({ field }) => (
          <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => field.onChange('entrada')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all text-sm',
                field.value === 'entrada'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-secondary'
              )}
            >
              <ArrowUpCircle className="w-4 h-4" /> Entrada
            </button>
            <button
              type="button"
              onClick={() => field.onChange('saida')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all text-sm',
                field.value === 'saida'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'text-secondary'
              )}
            >
              <ArrowDownCircle className="w-4 h-4" /> Saída
            </button>
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Valor</label>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0,00"
            className="glass-input tabular"
            {...register('valor')}
          />
          {errors.valor && <p className="text-xs text-rose-400 mt-1">{errors.valor.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Data</label>
          <input type="date" className="glass-input" {...register('data')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Descrição</label>
        <input type="text" placeholder="Ex: Supermercado" className="glass-input" {...register('descricao')} />
        {errors.descricao && <p className="text-xs text-rose-400 mt-1">{errors.descricao.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Categoria</label>
        <Controller
          control={control}
          name="categoriaId"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => field.onChange(c.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs',
                    field.value === c.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 hover:border-white/30'
                  )}
                  style={field.value === c.id ? { borderColor: c.cor } : undefined}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${c.cor}25`, color: c.cor }}
                  >
                    <IconRenderer name={c.icone} className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] text-primary truncate w-full text-center">{c.nome}</span>
                </button>
              ))}
            </div>
          )}
        />
        {errors.categoriaId && <p className="text-xs text-rose-400 mt-1">{errors.categoriaId.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Tags (opcional)</label>
        <input type="text" placeholder="trabalho, viagem" className="glass-input" {...register('tags')} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hasParcelas"
          {...register('hasParcelas')}
          className="w-4 h-4 rounded border-white/20"
        />
        <label htmlFor="hasParcelas" className="text-sm text-secondary cursor-pointer">
          Parcelado
        </label>
      </div>

      {hasParcelas && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Parcela atual</label>
            <input type="number" className="glass-input tabular" {...register('parcelaAtual')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Total parcelas</label>
            <input type="number" className="glass-input tabular" {...register('parcelas')} />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : initial ? 'Atualizar' : 'Salvar'}
      </button>
    </form>
  );
}
