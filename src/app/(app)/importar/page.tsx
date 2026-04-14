'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, CheckCircle2, AlertCircle, Trash2,
  ChevronDown, Sparkles, BookMarked, Plus, X, Tag,
  ArrowDownCircle, ArrowUpCircle, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import toast from 'react-hot-toast';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Transacao {
  id: string;
  data: string;
  descricao: string;
  descricaoFinal: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  origem: string;
  categoriaId: string | null;
  categoriaNome: string | null;
  regraId: string | null;
  incluir: boolean;
  salvarRegra: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  cor: string;
  icone: string;
  tipo: string;
}

interface Regra {
  id: string;
  padrao: string;
  tipo: string;
  descricao?: string;
  categoria: { id: string; nome: string; cor: string; icone: string };
}

type Aba = 'importar' | 'regras';

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ImportarPage() {
  const [aba, setAba] = useState<Aba>('importar');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-card !rounded-2xl">
        {([['importar', 'Importar Extrato'], ['regras', 'Regras de Destinatários']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all',
              aba === key
                ? 'bg-blue-600 text-white shadow'
                : 'text-secondary hover:text-primary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === 'importar' ? <ImportarTab /> : <RegrasTab />}
    </div>
  );
}

// ─── Importar Tab ───────────────────────────────────────────────────────────

function ImportarTab() {
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload');
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [criados, setCriados] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/categorias').then(r => r.json()).then(d => setCategorias(d.data || []));
  }, []);

  async function handleFile(file: File) {
    setFileName(file.name);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/importar', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao processar arquivo');
      setTransacoes((json.data as any[]).map(t => ({ ...t, incluir: true, salvarRegra: !t.regraId })));
      setStep('review');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function toggleIncluir(id: string) {
    setTransacoes(prev => prev.map(t => t.id === id ? { ...t, incluir: !t.incluir } : t));
  }

  function setCategoria(id: string, categoriaId: string) {
    const cat = categorias.find(c => c.id === categoriaId);
    setTransacoes(prev => prev.map(t =>
      t.id === id ? { ...t, categoriaId, categoriaNome: cat?.nome ?? null } : t
    ));
  }

  function setDescricao(id: string, descricaoFinal: string) {
    setTransacoes(prev => prev.map(t => t.id === id ? { ...t, descricaoFinal } : t));
  }

  function toggleSalvarRegra(id: string) {
    setTransacoes(prev => prev.map(t => t.id === id ? { ...t, salvarRegra: !t.salvarRegra } : t));
  }

  function removeItem(id: string) {
    setTransacoes(prev => prev.filter(t => t.id !== id));
  }

  async function confirmar() {
    const incluidas = transacoes.filter(t => t.incluir && t.categoriaId);
    if (incluidas.length === 0) { toast.error('Selecione pelo menos 1 transação com categoria'); return; }

    setSalvando(true);
    try {
      const salvarRegras = incluidas
        .filter(t => t.salvarRegra && t.categoriaId)
        .map(t => ({
          padrao: t.origem.substring(0, 60),
          categoriaId: t.categoriaId!,
          tipo: t.tipo,
          descricao: t.descricaoFinal !== t.origem ? t.descricaoFinal : undefined,
        }));

      const res = await fetch('/api/importar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lancamentos: incluidas.map(t => ({
            descricao: t.descricaoFinal || t.descricao,
            valor: t.valor,
            tipo: t.tipo,
            data: t.data,
            categoriaId: t.categoriaId!,
          })),
          salvarRegras,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCriados(json.data.criados);
      setStep('done');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSalvando(false);
    }
  }

  const semCategoria = transacoes.filter(t => t.incluir && !t.categoriaId).length;
  const totalIncluidas = transacoes.filter(t => t.incluir).length;

  if (step === 'done') {
    return (
      <div className="glass-card p-8 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-primary">{criados} lançamentos importados!</h2>
          <p className="text-secondary text-sm mt-1">Tudo salvo com sucesso no seu histórico.</p>
        </div>
        <button
          onClick={() => { setStep('upload'); setTransacoes([]); setFileName(''); }}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          Importar outro extrato
        </button>
      </div>
    );
  }

  if (step === 'upload') {
    return (
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'glass-card p-8 sm:p-12 flex flex-col items-center gap-4 cursor-pointer transition-all border-2 border-dashed text-center',
            dragging ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5'
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".ofx,.qfx,.csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              <span className="text-secondary text-sm">Processando {fileName}…</span>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                <Upload className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <p className="text-primary font-medium">Arraste seu extrato aqui</p>
                <p className="text-secondary text-sm mt-1">ou toque para selecionar o arquivo</p>
              </div>
              <div className="flex gap-2 mt-1">
                {['OFX', 'QFX', 'CSV'].map(f => (
                  <span key={f} className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-medium">{f}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bancos suportados */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-secondary text-xs font-medium uppercase tracking-wide">
            <Info className="w-3.5 h-3.5" />
            Bancos suportados
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-secondary">
            {[
              ['OFX/QFX', 'Itaú, Bradesco, Santander, BB, Caixa'],
              ['CSV', 'Nubank, Inter, C6, XP'],
            ].map(([fmt, banks]) => (
              <div key={fmt} className="col-span-1 sm:col-span-1">
                <span className="text-blue-400 font-medium">{fmt}: </span>{banks}
              </div>
            ))}
          </div>
          <p className="text-tertiary text-xs mt-1">
            Para exportar: no app/site do banco, acesse <strong className="text-secondary">extratos → exportar</strong> e escolha OFX ou CSV.
          </p>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-primary">{fileName}</span>
            <span className="text-xs text-secondary ml-2">{transacoes.length} transações encontradas</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {semCategoria > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" />
              {semCategoria} sem categoria
            </span>
          )}
          <button
            onClick={confirmar}
            disabled={salvando || semCategoria > 0}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              semCategoria > 0
                ? 'bg-white/10 text-secondary cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
            )}
          >
            {salvando ? 'Salvando…' : `Importar ${totalIncluidas}`}
          </button>
        </div>
      </div>

      {/* Transactions list */}
      <div className="space-y-2">
        {transacoes.map((t) => (
          <TransacaoCard
            key={t.id}
            transacao={t}
            categorias={categorias}
            onToggle={() => toggleIncluir(t.id)}
            onCategoria={(cid) => setCategoria(t.id, cid)}
            onDescricao={(d) => setDescricao(t.id, d)}
            onToggleRegra={() => toggleSalvarRegra(t.id)}
            onRemove={() => removeItem(t.id)}
          />
        ))}
      </div>

      <button
        onClick={confirmar}
        disabled={salvando || semCategoria > 0}
        className={cn(
          'w-full py-3.5 rounded-2xl text-sm font-semibold transition-all',
          semCategoria > 0
            ? 'bg-white/10 text-secondary cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
        )}
      >
        {salvando ? 'Salvando…' : semCategoria > 0 ? `Categorize ${semCategoria} transação(ões) para continuar` : `Importar ${totalIncluidas} lançamentos`}
      </button>
    </div>
  );
}

// ─── TransacaoCard ──────────────────────────────────────────────────────────

function TransacaoCard({
  transacao: t,
  categorias,
  onToggle,
  onCategoria,
  onDescricao,
  onToggleRegra,
  onRemove,
}: {
  transacao: Transacao;
  categorias: Categoria[];
  onToggle: () => void;
  onCategoria: (id: string) => void;
  onDescricao: (d: string) => void;
  onToggleRegra: () => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(!t.categoriaId);

  const cats = categorias.filter(c => c.tipo === t.tipo);
  const cat = categorias.find(c => c.id === t.categoriaId);

  const dataFmt = new Date(t.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <div className={cn(
      'glass-card overflow-hidden transition-all',
      !t.incluir && 'opacity-40'
    )}>
      {/* Main row */}
      <div className="p-3 flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            'w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors',
            t.incluir ? 'bg-blue-600 border-blue-600' : 'border-white/20'
          )}
        >
          {t.incluir && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </button>

        {/* Tipo icon */}
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          t.tipo === 'saida' ? 'bg-rose-500/15' : 'bg-emerald-500/15'
        )}>
          {t.tipo === 'saida'
            ? <ArrowDownCircle className="w-4 h-4 text-rose-400" />
            : <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
          }
        </div>

        {/* Description + date */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-primary truncate">{t.descricaoFinal || t.descricao}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-secondary">{dataFmt}</span>
            {t.regraId && (
              <span className="flex items-center gap-0.5 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" /> auto
              </span>
            )}
          </div>
        </div>

        {/* Value */}
        <div className={cn(
          'text-sm font-semibold tabular flex-shrink-0',
          t.tipo === 'saida' ? 'text-rose-400' : 'text-emerald-400'
        )}>
          {t.tipo === 'saida' ? '-' : '+'}{formatCurrency(t.valor)}
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="p-1 text-secondary"
        >
          <ChevronDown className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {/* Category pill — always visible if set */}
      {!expanded && cat && (
        <div className="px-3 pb-3 -mt-1">
          <span
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: cat.cor + '22', color: cat.cor }}
          >
            <span>{cat.icone}</span>{cat.nome}
          </span>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-white/5 pt-2.5">
          {/* Descrição customizada */}
          <div>
            <label className="text-[10px] text-secondary uppercase tracking-wide font-medium">Descrição</label>
            <input
              value={t.descricaoFinal}
              onChange={e => onDescricao(e.target.value)}
              className="glass-input mt-1 !py-2 !text-sm"
              placeholder={t.origem}
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="text-[10px] text-secondary uppercase tracking-wide font-medium">
              Categoria <span className="text-rose-400">*</span>
            </label>
            <select
              value={t.categoriaId ?? ''}
              onChange={e => onCategoria(e.target.value)}
              className="glass-input mt-1 !py-2 !text-sm"
            >
              <option value="">— Selecione —</option>
              {cats.map(c => (
                <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>
              ))}
            </select>
          </div>

          {/* Salvar regra */}
          {t.categoriaId && !t.regraId && (
            <button
              onClick={onToggleRegra}
              className={cn(
                'flex items-center gap-2 w-full p-2.5 rounded-xl border transition-all text-sm',
                t.salvarRegra
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'border-white/10 text-secondary hover:border-blue-500/20'
              )}
            >
              <BookMarked className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-left flex-1">
                Lembrar: <span className="font-medium">"{t.origem.substring(0, 30)}"</span> → {cat?.nome}
              </span>
              <div className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                t.salvarRegra ? 'bg-blue-600 border-blue-600' : 'border-white/30'
              )}>
                {t.salvarRegra && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
            </button>
          )}

          {/* Remove */}
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 text-xs text-secondary hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remover desta importação
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Regras Tab ─────────────────────────────────────────────────────────────

function RegrasTab() {
  const [regras, setRegras] = useState<Regra[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ padrao: '', categoriaId: '', tipo: 'saida' as 'entrada' | 'saida', descricao: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [r, c] = await Promise.all([
      fetch('/api/destinatarios').then(r => r.json()),
      fetch('/api/categorias').then(r => r.json()),
    ]);
    setRegras(r.data || []);
    setCategorias(c.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function salvar() {
    if (!form.padrao || !form.categoriaId) { toast.error('Preencha padrão e categoria'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/destinatarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast.success('Regra salva!');
      setShowForm(false);
      setForm({ padrao: '', categoriaId: '', tipo: 'saida', descricao: '' });
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deletar(id: string) {
    await fetch(`/api/destinatarios/${id}`, { method: 'DELETE' });
    setRegras(prev => prev.filter(r => r.id !== id));
    toast.success('Regra removida');
  }

  const cats = categorias.filter(c => c.tipo === form.tipo);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary">
            Regras automáticas para categorizar transações ao importar extratos.
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Nova regra
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">Nova regra</span>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-secondary" /></button>
          </div>

          <div>
            <label className="text-[10px] text-secondary uppercase tracking-wide font-medium">Padrão (texto na descrição)</label>
            <input
              value={form.padrao}
              onChange={e => setForm(f => ({ ...f, padrao: e.target.value }))}
              className="glass-input mt-1"
              placeholder="ex: IFOOD, UBER, SUPERMERCADO XYZ"
            />
            <p className="text-[10px] text-tertiary mt-1">Se a descrição do extrato contiver este texto, a categoria será aplicada automaticamente.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-secondary uppercase tracking-wide font-medium">Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any, categoriaId: '' }))}
                className="glass-input mt-1"
              >
                <option value="saida">Saída</option>
                <option value="entrada">Entrada</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-secondary uppercase tracking-wide font-medium">Categoria</label>
              <select
                value={form.categoriaId}
                onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}
                className="glass-input mt-1"
              >
                <option value="">— Selecione —</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-secondary uppercase tracking-wide font-medium">Descrição personalizada (opcional)</label>
            <input
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="glass-input mt-1"
              placeholder="ex: iFood"
            />
          </div>

          <button
            onClick={salvar}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            {saving ? 'Salvando…' : 'Salvar regra'}
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-secondary text-sm">Carregando…</div>
      ) : regras.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Tag className="w-8 h-8 text-secondary mx-auto mb-3" />
          <p className="text-secondary text-sm">Nenhuma regra ainda.</p>
          <p className="text-tertiary text-xs mt-1">Ao importar um extrato, você pode salvar regras para cada destinatário.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {regras.map(r => (
            <div key={r.id} className="glass-card p-3.5 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: r.categoria.cor + '22' }}
              >
                {r.categoria.icone}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-primary truncate">
                  "{r.padrao}"
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: r.categoria.cor + '22', color: r.categoria.cor }}
                  >
                    {r.categoria.nome}
                  </span>
                  <span className={cn(
                    'text-[11px]',
                    r.tipo === 'saida' ? 'text-rose-400' : 'text-emerald-400'
                  )}>
                    {r.tipo === 'saida' ? 'saída' : 'entrada'}
                  </span>
                  {r.descricao && <span className="text-[11px] text-secondary truncate">→ {r.descricao}</span>}
                </div>
              </div>
              <button
                onClick={() => deletar(r.id)}
                className="p-1.5 text-secondary hover:text-rose-400 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
