'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Modal } from '@/components/ui/Modal';
import { LancamentoForm } from '@/components/forms/LancamentoForm';
import { Badge } from '@/components/ui/Badge';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { HiddenValue } from '@/components/ui/HiddenValue';
import { Lancamento, Categoria } from '@/types';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

export default function LancamentosPage() {
  const { selectedYear, selectedMonth } = useFinanceStore();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Lancamento | null>(null);

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [filterCategoria, setFilterCategoria] = useState<string>('todas');
  const [orderBy, setOrderBy] = useState<'data' | 'valor'>('data');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('desc');

  async function load() {
    setLoading(true);
    const start = new Date(selectedYear, selectedMonth, 1).toISOString();
    const end = new Date(selectedYear, selectedMonth + 1, 1).toISOString();
    const params = new URLSearchParams({ start, end, orderBy, orderDir });
    const r = await fetch(`/api/lancamentos?${params}`);
    const d = await r.json();
    setLancamentos(d.data || []);
    setLoading(false);
  }

  async function loadCategorias() {
    const r = await fetch('/api/categorias');
    const d = await r.json();
    setCategorias(d.data || []);
  }

  useEffect(() => { load(); }, [selectedYear, selectedMonth, orderBy, orderDir]);
  useEffect(() => { loadCategorias(); }, []);
  useEffect(() => { setPage(1); }, [search, filterTipo, filterCategoria, selectedYear, selectedMonth]);

  const filtered = useMemo(() => {
    return lancamentos.filter((l) => {
      if (filterTipo !== 'todos' && l.tipo !== filterTipo) return false;
      if (filterCategoria !== 'todas' && l.categoriaId !== filterCategoria) return false;
      if (search && !l.descricao.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [lancamentos, filterTipo, filterCategoria, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete(id: string) {
    if (!confirm('Excluir lançamento?')) return;
    const r = await fetch(`/api/lancamentos/${id}`, { method: 'DELETE' });
    if (!r.ok) { toast.error('Erro'); return; }
    toast.success('Excluído');
    load();
  }

  function toggleSort(col: 'data' | 'valor') {
    if (orderBy === col) {
      setOrderDir(orderDir === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(col);
      setOrderDir('desc');
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filtros */}
      <div className="glass-card p-3 sm:p-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-10 text-sm"
          />
        </div>

        <div className="flex gap-2 sm:gap-3 items-center">
          <div className="flex gap-0.5 p-0.5 rounded-lg bg-white/5 border border-white/10">
            {(['todos', 'entrada', 'saida'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterTipo(t)}
                className={cn(
                  'px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all',
                  filterTipo === t ? 'bg-blue-500/20 text-primary' : 'text-secondary'
                )}
              >
                {t === 'todos' ? 'Todos' : t === 'entrada' ? 'Entr.' : 'Saídas'}
              </button>
            ))}
          </div>

          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="glass-input !w-auto !py-1 sm:!py-1.5 text-[10px] sm:text-xs max-w-[120px] sm:max-w-none"
          >
            <option value="todas" style={{ background: '#1a1040' }}>Todas cat.</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id} style={{ background: '#1a1040' }}>{c.nome}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setEditing(null); setOpenForm(true); }}
          className="w-full sm:w-auto sm:ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Novo
        </button>
      </div>

      {/* Lista mobile / Tabela desktop */}
      <div className="glass-card !p-0 overflow-hidden">
        {/* Mobile: card list */}
        <div className="sm:hidden">
          {loading ? (
            <div className="p-3 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-12 text-secondary text-sm">Nenhum lançamento encontrado</div>
          ) : (
            <div className="divide-y divide-white/5">
              {paginated.map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2.5 px-3 py-2.5 active:bg-white/5"
                >
                  {l.categoria && (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${l.categoria.cor}25`, color: l.categoria.cor }}
                    >
                      <IconRenderer name={l.categoria.icone} className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-primary font-medium truncate">{l.descricao}</div>
                    <div className="text-[10px] text-tertiary">
                      {formatDate(l.data)}
                      {l.categoria && <span> · {l.categoria.nome}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn('text-sm font-semibold tabular', l.tipo === 'entrada' ? 'text-emerald-400' : 'text-rose-400')}>
                      {l.tipo === 'entrada' ? '+' : '-'}<HiddenValue value={l.valor} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => { setEditing(l); setOpenForm(true); }}
                      className="p-1 rounded hover:bg-white/10 text-secondary"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="p-1 rounded hover:bg-rose-500/15 text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-secondary uppercase tracking-wider">
                <th className="text-left px-4 py-3 cursor-pointer" onClick={() => toggleSort('data')}>
                  <div className="flex items-center gap-1">Data <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="text-left px-4 py-3">Descrição</th>
                <th className="text-left px-4 py-3">Categoria</th>
                <th className="text-right px-4 py-3 cursor-pointer" onClick={() => toggleSort('valor')}>
                  <div className="flex items-center gap-1 justify-end">Valor <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={5} className="px-4 py-3"><div className="h-6 rounded bg-white/5 animate-pulse" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-secondary">Nenhum lançamento encontrado</td></tr>
              ) : (
                paginated.map((l) => (
                  <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-secondary tabular text-xs">{formatDate(l.data)}</td>
                    <td className="px-4 py-3 text-primary">
                      <div className="font-medium truncate max-w-[200px]">{l.descricao}</div>
                      {l.parcelas && <div className="text-xs text-tertiary">{l.parcelaAtual}/{l.parcelas}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {l.categoria && (
                        <Badge color={l.categoria.cor}>
                          <IconRenderer name={l.categoria.icone} className="w-3 h-3" />
                          {l.categoria.nome}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular">
                      <span className={l.tipo === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}>
                        {l.tipo === 'entrada' ? '+' : '-'}<HiddenValue value={l.valor} />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setEditing(l); setOpenForm(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-secondary"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(l.id)} className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-t border-white/10 text-[10px] sm:text-xs text-secondary">
            <span>{filtered.length} itens · Pág. {page}/{totalPages}</span>
            <div className="flex gap-1.5 sm:gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg glass-button text-[10px] sm:text-xs disabled:opacity-50">Ant.</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg glass-button text-[10px] sm:text-xs disabled:opacity-50">Próx.</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={openForm} onClose={() => setOpenForm(false)} title={editing ? 'Editar lançamento' : 'Novo lançamento'}>
        <LancamentoForm initial={editing || undefined} onSuccess={() => { setOpenForm(false); load(); }} />
      </Modal>
    </div>
  );
}
