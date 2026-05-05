'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, Bitcoin, Calculator } from 'lucide-react';
import { Investimento, CategoriaInvestimento } from '@/types';
import { formatBRL } from '@/lib/formatters';

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
  const [submitting, setSubmitting]   = useState(false);
  const [categorias, setCategorias]   = useState<CategoriaInvestimento[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // BTC calculator helpers (not submitted, just used to fill `valor`)
  const [btcQtd,    setBtcQtd]    = useState(initial?.quantidadeBTC?.toString() ?? '');
  const [btcPreco,  setBtcPreco]  = useState('');
  const [valorTotal, setValorTotal] = useState(initial?.valor?.toString() ?? '');

  useEffect(() => {
    fetch('/api/categorias-investimento')
      .then(r => r.json())
      .then(d => setCategorias(d.data || []))
      .finally(() => setLoadingCats(false));
  }, []);

  const { register, handleSubmit, control, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao:               initial?.descricao || '',
      valor:                   initial?.valor,
      categoriaInvestimentoId: initial?.categoriaInvestimentoId || '',
      data:                    initial?.data ? initial.data.slice(0, 10) : new Date().toISOString().slice(0, 10),
      quantidadeBTC:           initial?.quantidadeBTC ?? null,
    },
  });

  const catIdWatched  = useWatch({ control, name: 'categoriaInvestimentoId' });
  const catSelecionada = categorias.find(c => c.id === catIdWatched);
  const isBTC = !!(
    catSelecionada?.nome.toLowerCase().includes('bitcoin') ||
    catSelecionada?.nome.toLowerCase().includes('btc')
  );

  // ── BTC calculator logic ──────────────────────────────────────────────────

  function onQtdChange(v: string) {
    setBtcQtd(v);
    setValue('quantidadeBTC', v ? parseFloat(v) : null);
    if (v && btcPreco) {
      const total = parseFloat(v) * parseFloat(btcPreco);
      if (!isNaN(total)) {
        const t = total.toFixed(2);
        setValorTotal(t);
        setValue('valor', total);
      }
    }
  }

  function onPrecoChange(v: string) {
    setBtcPreco(v);
    if (v && btcQtd) {
      const total = parseFloat(v) * parseFloat(btcQtd);
      if (!isNaN(total)) {
        const t = total.toFixed(2);
        setValorTotal(t);
        setValue('valor', total);
      }
    }
  }

  function onValorTotalChange(v: string) {
    setValorTotal(v);
    setValue('valor', parseFloat(v) || 0);
    if (v && btcQtd && parseFloat(btcQtd) > 0) {
      const preco = parseFloat(v) / parseFloat(btcQtd);
      if (!isNaN(preco)) setBtcPreco(preco.toFixed(2));
    }
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const url    = initial ? `/api/investimentos/${initial.id}` : '/api/investimentos';
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

      {/* Categoria (first — determines BTC mode) */}
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

      {/* ── BTC mode ── */}
      {isBTC ? (
        <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Bitcoin className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Compra de Bitcoin</span>
          </div>

          <p className="text-[11px] text-secondary">
            Preencha a <strong className="text-primary">Quantidade</strong> e o <strong className="text-primary">Preço do BTC</strong> — o valor total é calculado automaticamente. Ou preencha o valor total diretamente.
          </p>

          {/* Qtd + Preço por BTC */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-secondary mb-1.5 uppercase tracking-wide">
                Quantidade BTC
              </label>
              <input
                type="number"
                step="0.00000001"
                value={btcQtd}
                onChange={e => onQtdChange(e.target.value)}
                placeholder="0.00500000"
                className="glass-input tabular"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-secondary mb-1.5 uppercase tracking-wide">
                Preço do BTC na época (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={btcPreco}
                onChange={e => onPrecoChange(e.target.value)}
                placeholder="Ex: 450.000"
                className="glass-input tabular"
              />
            </div>
          </div>

          {/* Valor total calculado */}
          <div className="relative">
            <label className="block text-[10px] font-medium text-secondary mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Calculator className="w-3 h-3" /> Valor total pago (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={valorTotal}
              onChange={e => onValorTotalChange(e.target.value)}
              placeholder="Calculado automaticamente"
              className="glass-input tabular"
            />
            {/* Hidden real field */}
            <input type="hidden" {...register('valor')} />
          </div>

          {/* Preview */}
          {btcQtd && valorTotal && parseFloat(btcQtd) > 0 && parseFloat(valorTotal) > 0 && (
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-white/5">
              <span className="text-secondary">Preço médio desta compra</span>
              <span className="text-amber-400 font-semibold tabular">
                {formatBRL(parseFloat(valorTotal) / parseFloat(btcQtd))} / BTC
              </span>
            </div>
          )}
        </div>
      ) : (
        /* ── Normal mode ── */
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Valor aportado (R$)</label>
          <input type="number" step="0.01" className="glass-input tabular" {...register('valor')} />
        </div>
      )}

      {/* Descrição */}
      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Descrição</label>
        <input
          type="text"
          placeholder={isBTC ? 'Ex: Compra BTC — Maio 2024' : 'Ex: Tesouro Selic, Aporte fundo XYZ'}
          className="glass-input"
          {...register('descricao')}
        />
      </div>

      {/* Data */}
      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Data da compra</label>
        <input type="date" className="glass-input" {...register('data')} />
      </div>

      <button
        type="submit"
        disabled={submitting || categorias.length === 0}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : initial ? 'Atualizar aporte' : 'Salvar aporte'}
      </button>
    </form>
  );
}
