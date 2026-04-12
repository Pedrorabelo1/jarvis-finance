'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Categoria, DespesaFixa } from '@/types';
import { IconRenderer } from '@/components/ui/IconRenderer';

const schema = z.object({
  descricao: z.string().min(1),
  valor: z.coerce.number().positive(),
  diaVencimento: z.coerce.number().int().min(1).max(31),
  categoriaId: z.string().min(1),
  dataInicio: z.string().min(1),
  semDataFim: z.boolean().optional(),
  dataFim: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: DespesaFixa;
  onSuccess?: () => void;
}

export function FixaForm({ initial, onSuccess }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao: initial?.descricao || '',
      valor: initial?.valor,
      diaVencimento: initial?.diaVencimento || 1,
      categoriaId: initial?.categoriaId || '',
      dataInicio: initial?.dataInicio
        ? initial.dataInicio.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      semDataFim: !initial?.dataFim,
      dataFim: initial?.dataFim ? initial.dataFim.slice(0, 10) : '',
    },
  });

  const semDataFim = watch('semDataFim');

  useEffect(() => {
    fetch('/api/categorias?tipo=saida')
      .then((r) => r.json())
      .then((d) => setCategorias(d.data || []));
  }, []);

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const payload: any = {
        descricao: data.descricao,
        valor: data.valor,
        diaVencimento: data.diaVencimento,
        categoriaId: data.categoriaId,
        dataInicio: data.dataInicio,
        dataFim: data.semDataFim ? null : data.dataFim || null,
      };
      const url = initial ? `/api/fixas/${initial.id}` : '/api/fixas';
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(initial ? 'Despesa atualizada' : 'Despesa criada');
      onSuccess?.();
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Descrição</label>
        <input type="text" className="glass-input" {...register('descricao')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Valor</label>
          <input type="number" step="0.01" className="glass-input tabular" {...register('valor')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Dia vencimento</label>
          <input type="number" min="1" max="31" className="glass-input tabular" {...register('diaVencimento')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Categoria</label>
        <select className="glass-input" {...register('categoriaId')}>
          <option value="">Selecione...</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id} style={{ background: '#1a1040' }}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Data de início</label>
        <input type="date" className="glass-input" {...register('dataInicio')} />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="semDataFim" {...register('semDataFim')} className="w-4 h-4" />
        <label htmlFor="semDataFim" className="text-sm text-secondary cursor-pointer">
          Sem data de encerramento
        </label>
      </div>

      {!semDataFim && (
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Data de encerramento</label>
          <input type="date" className="glass-input" {...register('dataFim')} />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : initial ? 'Atualizar' : 'Criar'}
      </button>
    </form>
  );
}
