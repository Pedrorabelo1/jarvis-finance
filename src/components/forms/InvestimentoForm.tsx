'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, Bitcoin, Calculator } from 'lucide-react';
import { Investimento, CategoriaInvestimento } from '@/types';
import { formatBRL } from '@/lib/formatters';

function fmtUSD(v: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(v);
}

const schema = z.object({
  descricao:               z.string().min(1, 'Obrigatório'),
  valor:                   z.coerce.number().positive('Valor deve ser positivo'),
  categoriaInvestimentoId: z.string().min(1, 'Selecione uma categoria'),
  data:                    z.string().min(1),
  quantidadeBTC:           z.coerce.number().min(0).optional().nullable(),
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

  // Live rates
  const [btcPriceUSD, setBtcPriceUSD] = useState(0);
  const [usdBrlRate,  setUsdBrlRate]  = useState(0);

  // USD display helpers (not submitted — only `valor` in BRL is submitted)
  const [btcPrecoUSD, setBtcPrecoUSD] = useState('');
  const [totalUSD,    setTotalUSD]    = useState('');
  const [valorUSD,    setValorUSD]    = useState('');

  const brlOf = (usd: number) => usdBrlRate > 0 ? usd * usdBrlRate : 0;

  const { register, handleSubmit, control, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao:               initial?.descricao || '',
      valor:                   initial?.valor ?? undefined,
      categoriaInvestimentoId: initial?.categoriaInvestimentoId || '',
      data:    initial?.data ? initial.data.slice(0, 10) : new Date().toISOString().slice(0, 10),
      quantidadeBTC:           initial?.quantidadeBTC ?? null,
    },
  });

  const catIdWatched   = useWatch({ control, name: 'categoriaInvestimentoId' });
  const catSelecionada = categorias.find(c => c.id === catIdWatched);
  const isBTC = !!(
    catSelecionada?.nome.toLowerCase().includes('bitcoin') ||
    catSelecionada?.nome.toLowerCase().includes('btc')
  );

  // Watch quantidadeBTC to keep displays in sync
  const qtdWatched = watch('quantidadeBTC');

  useEffect(() => {
    Promise.all([
      fetch('/api/categorias-investimento').then(r => r.json()),
      fetch('/api/btc-price').then(r => r.json()).catch(() => ({})),
    ]).then(([catRes, btcRes]) => {
      setCategorias(catRes.data || []);

      const priceUSD  = btcRes.priceUSD  ?? 0;
      const rate      = btcRes.usdBrlRate ?? 0;
      setBtcPriceUSD(priceUSD);
      setUsdBrlRate(rate);

      if (rate > 0) {
        if (initial?.quantidadeBTC && initial.valor) {
          // ── EDITING: derive original USD price from stored BRL ──
          const origTotalUSD  = initial.valor / rate;
          const origPrecoUSD  = initial.quantidadeBTC > 0
            ? origTotalUSD / initial.quantidadeBTC
            : priceUSD;
          setBtcPrecoUSD(origPrecoUSD.toFixed(2));
          setTotalUSD(origTotalUSD.toFixed(2));
          // Non-BTC editing
          setValorUSD((initial.valor / rate).toFixed(2));
        } else {
          // ── NEW: pre-fill with live BTC price ──
          if (priceUSD > 0) setBtcPrecoUSD(priceUSD.toFixed(2));
        }
      }
    }).finally(() => setLoadingCats(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── BTC calculator ────────────────────────────────────────────────────────

  function recalc(qtd: number, precoUsd: number) {
    if (qtd > 0 && precoUsd > 0) {
      const tu = qtd * precoUsd;
      const tb = brlOf(tu);
      setTotalUSD(tu.toFixed(2));
      setValue('valor', tb, { shouldValidate: true });
    }
  }

  function onPrecoUSDChange(v: string) {
    setBtcPrecoUSD(v);
    recalc(parseFloat(qtdWatched?.toString() ?? '0') || 0, parseFloat(v) || 0);
  }

  function onTotalUSDChange(v: string) {
    setTotalUSD(v);
    const tu  = parseFloat(v) || 0;
    const qtd = parseFloat(qtdWatched?.toString() ?? '0') || 0;
    setValue('valor', brlOf(tu), { shouldValidate: true });
    if (qtd > 0 && tu > 0) setBtcPrecoUSD((tu / qtd).toFixed(2));
  }

  // ── Non-BTC USD ───────────────────────────────────────────────────────────

  function onValorUSDChange(v: string) {
    setValorUSD(v);
    const usd = parseFloat(v) || 0;
    setValue('valor', brlOf(usd), { shouldValidate: true });
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const url    = initial ? `/api/investimentos/${initial.id}` : '/api/investimentos';
      const method = initial ? 'PATCH' : 'POST';

      // quantidadeBTC: only send if it's a BTC category AND has a value
      const quantidadeBTC = isBTC && data.quantidadeBTC && data.quantidadeBTC > 0
        ? data.quantidadeBTC
        : null;

      const payload = { ...data, quantidadeBTC };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }
      toast.success(initial ? 'Aporte atualizado' : 'Aporte registrado');
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Display helpers ───────────────────────────────────────────────────────
  const qtdN      = parseFloat(qtdWatched?.toString() ?? '0') || 0;
  const precoUSDN = parseFloat(btcPrecoUSD) || 0;
  const totalUSDN = parseFloat(totalUSD) || 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Cotação ao vivo */}
      {usdBrlRate > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-secondary px-1 flex-wrap">
          <span className="text-tertiary">Cotação ao vivo:</span>
          <span className="tabular font-medium text-primary">1 USD = {formatBRL(usdBrlRate)}</span>
          {btcPriceUSD > 0 && (
            <span className="text-tertiary">· BTC {fmtUSD(btcPriceUSD)}</span>
          )}
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />AO VIVO
          </span>
        </div>
      )}

      {/* Categoria */}
      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Categoria</label>
        {loadingCats ? (
          <div className="glass-input flex items-center gap-2 text-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : categorias.length === 0 ? (
          <div className="glass-input text-sm text-secondary">
            Crie categorias na aba "Categorias" primeiro.
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bitcoin className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Compra de Bitcoin</span>
            </div>
            {btcPriceUSD > 0 && (
              <span className="text-[10px] text-amber-400/70 tabular">{fmtUSD(btcPriceUSD)} ao vivo</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Quantidade — registrada via Controller para garantir que vai no submit */}
            <div>
              <label className="block text-[10px] font-medium text-secondary mb-1.5 uppercase tracking-wide">
                Quantidade BTC
              </label>
              <Controller
                control={control}
                name="quantidadeBTC"
                render={({ field }) => (
                  <input
                    type="number"
                    step="0.00000001"
                    placeholder="0.07294739"
                    className="glass-input tabular"
                    value={field.value ?? ''}
                    onChange={e => {
                      const v = e.target.value;
                      const qtd = parseFloat(v) || 0;
                      field.onChange(qtd || null);
                      recalc(qtd, precoUSDN);
                    }}
                  />
                )}
              />
            </div>

            {/* Preço em USD */}
            <div>
              <label className="block text-[10px] font-medium text-secondary mb-1.5 uppercase tracking-wide">
                Preço BTC (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={btcPrecoUSD}
                onChange={e => onPrecoUSDChange(e.target.value)}
                placeholder="Ex: 100114"
                className="glass-input tabular"
              />
              {precoUSDN > 0 && usdBrlRate > 0 && (
                <p className="text-[10px] text-tertiary mt-1 tabular">≈ {formatBRL(brlOf(precoUSDN))}/BTC</p>
              )}
            </div>
          </div>

          {/* Total USD */}
          <div>
            <label className="block text-[10px] font-medium text-secondary mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Calculator className="w-3 h-3" /> Total pago (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={totalUSD}
              onChange={e => onTotalUSDChange(e.target.value)}
              placeholder="Calculado automaticamente"
              className="glass-input tabular"
            />
            {totalUSDN > 0 && usdBrlRate > 0 && (
              <p className="text-[10px] text-tertiary mt-1 tabular">
                ≈ {formatBRL(brlOf(totalUSDN))} · salvo em BRL pela cotação atual
              </p>
            )}
            {/* valor em BRL é o campo real enviado */}
            <input type="hidden" {...register('valor')} />
          </div>

          {/* Preview preço médio */}
          {qtdN > 0 && totalUSDN > 0 && (
            <div className="flex items-center justify-between text-xs px-3 py-2.5 rounded-xl bg-white/5">
              <span className="text-secondary">Preço médio desta compra</span>
              <div className="text-right">
                <div className="text-amber-400 font-semibold tabular">{fmtUSD(totalUSDN / qtdN)}/BTC</div>
                <div className="text-[10px] text-tertiary tabular">≈ {formatBRL(brlOf(totalUSDN) / qtdN)}/BTC</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Normal mode (USD) ── */
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Valor aportado (USD)
          </label>
          <input
            type="number"
            step="0.01"
            value={valorUSD}
            onChange={e => onValorUSDChange(e.target.value)}
            placeholder="Ex: 500.00"
            className="glass-input tabular"
          />
          {parseFloat(valorUSD) > 0 && usdBrlRate > 0 && (
            <p className="text-[10px] text-tertiary mt-1.5 tabular">
              ≈ {formatBRL(brlOf(parseFloat(valorUSD)))} · salvo em BRL pela cotação atual
            </p>
          )}
          <input type="hidden" {...register('valor')} />
        </div>
      )}

      {/* Descrição */}
      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Descrição</label>
        <input
          type="text"
          placeholder={isBTC ? 'Ex: Compra BTC — Jan 2024' : 'Ex: HRM, aporte fundo XYZ'}
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
