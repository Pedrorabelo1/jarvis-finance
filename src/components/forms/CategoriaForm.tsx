'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Categoria, TipoLancamento } from '@/types';
import { IconRenderer } from '@/components/ui/IconRenderer';

const ICONS = [
  'Home', 'UtensilsCrossed', 'Car', 'Heart', 'GraduationCap', 'Gamepad2',
  'Repeat', 'PawPrint', 'ShoppingBag', 'FileText', 'MoreHorizontal',
  'Building2', 'Briefcase', 'Laptop', 'Key', 'TrendingUp', 'Plus',
  'Coffee', 'Plane', 'Smartphone', 'Tv', 'Music', 'Book', 'Shirt',
  'Wrench', 'Gift', 'Wallet', 'CreditCard', 'PiggyBank', 'DollarSign',
];

const COLORS = [
  '#3b82f6', '#22d3ee', '#34d399', '#fb7185', '#a5b4fc',
  '#f59e0b', '#ec4899', '#14b8a6', '#a78bfa', '#f97316',
  '#64748b', '#94a3b8', '#059669', '#dc2626', '#0ea5e9',
];

const schema = z.object({
  nome: z.string().min(1),
  icone: z.string().min(1),
  cor: z.string().min(1),
  orcamento: z.coerce.number().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Categoria;
  tipo: TipoLancamento;
  onSuccess?: () => void;
}

export function CategoriaForm({ initial, tipo, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: initial?.nome || '',
      icone: initial?.icone || ICONS[0],
      cor: initial?.cor || COLORS[0],
      orcamento: initial?.orcamento ?? undefined,
    },
  });

  const icone = watch('icone');
  const cor = watch('cor');

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const payload: any = {
        ...data,
        orcamento: data.orcamento && data.orcamento > 0 ? data.orcamento : null,
      };
      if (!initial) payload.tipo = tipo;
      const url = initial ? `/api/categorias/${initial.id}` : '/api/categorias';
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast.success(initial ? 'Categoria atualizada' : 'Categoria criada');
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Nome</label>
        <input type="text" className="glass-input" {...register('nome')} />
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('cor', c)}
              className={cn(
                'w-8 h-8 rounded-lg border-2 transition-all',
                cor === c ? 'border-white/80 scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Ícone</label>
        <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1">
          {ICONS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setValue('icone', name)}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center border transition-all',
                icone === name ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/30'
              )}
              style={icone === name ? { borderColor: cor, color: cor } : undefined}
            >
              <IconRenderer name={name} className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {tipo === 'saida' && (
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Orçamento mensal (opcional)</label>
          <input type="number" step="0.01" className="glass-input tabular" {...register('orcamento')} />
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
