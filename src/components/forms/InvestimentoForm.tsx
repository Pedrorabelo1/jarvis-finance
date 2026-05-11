'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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

// Only fields that go through react-hook-form (text/select/date)
const schema = z.object({
  descricao:               z.string().min(1, 'Obrigatório'),
  categoriaInvestimentoId: z.string().min(1, 'Selecione uma categoria'),
  data:                    z.string().min(1),
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

  // ── Pure-state fields (NOT controlled by react-hook-form) ──────────────────
  // BTC mode
  const [qtdBTC,      setQtdBTC]      = useState<string>('');
  const [btcPrecoUSD, setBtcPrecoUSD] = useState<string>('');
  const [totalUSD,    setTotalUSD]    = useState<string>('');
  // Normal mode
  const [valorUSD,    setValorUSD]    = useState<string>('');

  const brlOf = (usd: number) => usdBrlRate > 0 ? usd * usdBrlRate : 0;

  const { register, control } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao:               initial?.descricao || '',
      categoriaInvestimentoId: initial?.categoriaInvestimentoId || '',
      data: initial?.data ? initial.data.slice(0, 10) : new Date().toISOString().slice(0, 10),
    },
  });

  const catIdWatched   = useWatch({ control, name: 'categoriaInvestimentoId' });
  const catSelecionada = categorias.find(c => c.id === catIdWatched);
  const isBTC = !!(
    catSelecionada?.nome.toLowerCase().includes('bitcoin') ||
    catSelecionada?.nome.toLowerCase().includes('btc')
  );

  // ── Load categories + BTC price ────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/categorias-investimento').then(r => r.json()),
      fetch('/api/btc-price').then(r => r.json()).catch(() => ({})),
    ]).then(([catRes, btcRes]) => {
      setCategorias(catRes.data || []);

      const priceUSD = Number(btcRes.priceUSD  ?? 0);
      const rate     = Number(btcRes.usdBrlRate ?? 0);
      setBtcPriceUSD(priceUSD);
      setUsdBrlRate(rate);

      if (rate > 0) {
        if (initial?.quantidadeBTC && Number(initial.quantidadeBTC) > 0 && initial.valor) {
          // ── EDITING BTC: derive historical price from stored BRL ──────────
          const origQtd      = Number(initial.quantidadeBTC);
          const origValorBRL = Number(initial.valor);
          const origTotalUSD = origValorBRL / rate;
          const origPrecoUSD = origQtd > 0 ? origTotalUSD / origQtd : priceUSD;

          setQtdBTC(origQtd.toString());
          setBtcPrecoUSD(origPrecoUSD.toFixed(2));
          setTotalUSD(origTotalUSD.toFixed(2));
        } else if (initial && !initial.quantidadeBTC && initial.valor) {
          // ── EDITING non-BTC: show USD equivalent ─────────────────────────
          setValorUSD((Number(initial.valor) / rate).toFixed(2));
        } else {
          // ── NEW aporte: pre-fill live BTC price ──────────────────────────
          if (priceUSD > 0) setBtcPrecoUSD(priceUSD.toFixed(2));
        }
      }
    }).finally(() => setLoadingCats(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── BTC calculators ────────────────────────────────────────────────────────

  const precoUSDN = parseFloat(btcPrecoUSD) || 0;
  const totalUSDN = parseFloat(totalUSD)    || 0;
  const qtdN      = parseFloat(qtdBTC)      || 0;

  function recalcFromQtdPreco(qtd: number, preco: number) {
    if (qtd > 0 && preco > 0) {
      const tu = qtd * preco;
      setTotalUSD(tu.toFixed(2));
    }
  }

  function onQtdChange(v: string) {
    setQtdBTC(v);
    recalcFromQtdPreco(parseFloat(v) || 0, precoUSDN);
  }

  function onPrecoUSDChange(v: string) {
    setBtcPrecoUSD(v);
    recalcFromQtdPreco(qtdN, parseFloat(v) || 0);
  }

  function onTotalUSDChange(v: string) {
    setTotalUSD(v);
    const tu  = parseFloat(v) || 0;
    if (qtdN > 0 && tu > 0) setBtcPrecoUSD((tu / qtdN).toFixed(2));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Manual validation for base fields
    const form     = e.currentTarget;
    const descricao               = (form.elements.namedItem('descricao') as HTMLInputElement)?.value?.trim();
    const categoriaInvestimentoId = (form.elements.namedItem('categoriaInvestimentoId') as HTMLSelectElement)?.value;
    const data                    = (form.elements.namedItem('data') as HTMLInputElement)?.value;

    if (!descricao) { toast.error('Informe a descrição'); return; }
    if (!categoriaInvestimentoId) { toast.error('Selecione uma categoria'); return; }

    // Compute valor and quantidadeBTC from pure state (100% reliable)
    let valorBRL: number;
    let quantidadeBTC: number | null;

    if (isBTC) {
      const tu  = parseFloat(totalUSD) || 0;
      const qtd = parseFloat(qtdBTC)   || 0;
      if (tu <= 0)  { toast.error('Informe o total pago em USD'); return; }
      if (qtd <= 0) { toast.error('Informe a quantidade de BTC'); return; }
      valorBRL      = tu * usdBrlRate;
      quantidadeBTC = qtd;
    } else {
      const usd = parseFloat(valorUSD) || 0;
      if (usd <= 0) { toast.error('Informe o valor em USD'); return; }
      valorBRL      = usd * usdBrlRate;
      quantidadeBTC = null;
    }

    if (valorBRL <= 0) { toast.error('Cotação indisponível — tente novamente'); return; }

    setSubmitting(true);
    try {
      const url    = initial ? `/api/investimentos/${initial.id}` : '/api/investimentos';
      const method = initial ? 'PATCH' : 'POST';

      const payload = {
        descricao,
        categoriaInvestimentoId,
        data,
        valor: valorBRL,
        quantidadeBTC,
      };

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

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">

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
            {/* Quantidade BTC — pure state */}
            <div>
              <label className="block text-[10px] font-medium text-secondary mb-1.5 uppercase tracking-wide">
                Quantidade BTC
              </label>
              <input
                type="number"
                step="0.00000001"
                placeholder="0.07294739"
                className="glass-input tabular"
                value={qtdBTC}
                onChange={e => onQtdChange(e.target.value)}
              />
            </div>

            {/* Preço em USD — pure state */}
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

          {/* Total USD — pure state */}
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
            onChange={e => setValorUSD(e.target.value)}
            placeholder="Ex: 500.00"
            className="glass-input tabular"
          />
          {parseFloat(valorUSD) > 0 && usdBrlRate > 0 && (
            <p className="text-[10px] text-tertiary mt-1.5 tabular">
              ≈ {formatBRL(brlOf(parseFloat(valorUSD)))} · salvo em BRL pela cotação atual
            </p>
          )}
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
