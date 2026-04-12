'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { CLASSES_INVESTIMENTO, Investimento } from '@/types';

const schema = z.object({
  descricao: z.string().min(1),
  valor: z.coerce.number().positive(),
  classe: z.enum(['renda_fixa', 'acoes', 'fiis', 'cripto', 'internacional', 'outros']),
  data: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Investimento;
  onSuccess?: () => void;
}

export function InvestimentoForm({ initial, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao: initial?.descricao || '',
      valor: initial?.valor,
      classe: initial?.classe || 'renda_fixa',
      data: initial?.data ? initial.data.slice(0, 10) : new Date().toISOString().slice(0, 10),
    },
  });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const url = initial ? `/api/investimentos/${initial.id}` : '/api/investimentos';
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success(initial ? 'Aporte atualizado' : 'Aporte registrado');
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
        <input type="text" placeholder="Ex: Tesouro Selic" className="glass-input" {...register('descricao')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Valor</label>
          <input type="number" step="0.01" className="glass-input tabular" {...register('valor')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Data</label>
          <input type="date" className="glass-input" {...register('data')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Classe de ativo</label>
        <select className="glass-input" {...register('classe')}>
          {CLASSES_INVESTIMENTO.map((c) => (
            <option key={c.value} value={c.value} style={{ background: '#1a1040' }}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : initial ? 'Atualizar' : 'Salvar'}
      </button>
    </form>
  );
}
