'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Investimento, CategoriaInvestimento } from '@/types';

const schema = z.object({
  descricao: z.string().min(1, 'Obrigatório'),
  valor: z.coerce.number().positive('Valor deve ser positivo'),
  categoriaInvestimentoId: z.string().min(1, 'Selecione uma categoria'),
  data: z.string().min(1),
  quantidadeBTC: z.coerce.number().min(0).optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Investimento;
  onSuccess?: () => void;
}

export function InvestimentoForm({ initial, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaInvestimento[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    fetch('/api/categorias-investimento')
      .then(r => r.json())
      .then(d => setCategorias(d.data || []))
      .finally(() => setLoadingCats(false));
  }, []);

  const { register, handleSubmit, control } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao: initial?.descricao || '',
      valor: initial?.valor,
      categoriaInvestimentoId: initial?.categoriaInvestimentoId || '',
      data: initial?.data ? initial.data.slice(0, 10) : new Date().toISOString().slice(0, 10),
      quantidadeBTC: initial?.quantidadeBTC ?? null,
    },
  });

  const catIdWatched = useWatch({ control, name: 'categoriaInvestimentoId' });
  const catSelecionada = categorias.find(c => c.id === catIdWatched);
  const isBTC = catSelecionada?.nome.toLowerCase().includes('bitcoin') || catSelecionada?.nome.toLowerCase().includes('btc');

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const url = initial ? `/api/investimentos/${initial.id}` : '/api/investimentos';
      const method = initial ? 'PATCH' : 'POST';
      const payload = {
        ...data,
        quantidadeBTC: isBTC && data.quantidadeBTC ? data.quantidadeBTC : null,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        <input type="text" placeholder="Ex: Tesouro Selic, Aporte fundo XYZ" className="glass-input" {...register('descricao')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Valor (R$)</label>
          <input type="number" step="0.01" className="glass-input tabular" {...register('valor')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Data</label>
          <input type="date" className="glass-input" {...register('data')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Categoria</label>
        {loadingCats ? (
          <div className="glass-input flex items-center gap-2 text-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : categorias.length === 0 ? (
          <div className="glass-input text-sm text-secondary">
            Crie categorias de investimento primeiro na aba "Categorias".
          </div>
        ) : (
          <select className="glass-input" {...register('categoriaInvestimentoId')}>
            <option value="">— Selecione —</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                {c.icone} {c.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      {isBTC && (
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Quantidade de BTC <span className="text-tertiary">(para rastreio do preço ao vivo)</span>
          </label>
          <input
            type="number"
            step="0.00000001"
            placeholder="Ex: 0.00500000"
            className="glass-input tabular"
            {...register('quantidadeBTC')}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || categorias.length === 0}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : initial ? 'Atualizar' : 'Salvar aporte'}
      </button>
    </form>
  );
}
