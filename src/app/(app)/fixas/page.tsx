'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Pause, Play, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { FixaForm } from '@/components/forms/FixaForm';
import { Badge } from '@/components/ui/Badge';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { HiddenValue } from '@/components/ui/HiddenValue';
import { DespesaFixa } from '@/types';
import { daysUntil, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export default function FixasPage() {
  const [fixas, setFixas] = useState<DespesaFixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<DespesaFixa | null>(null);
  const [tab, setTab] = useState<'ativas' | 'encerradas'>('ativas');

  async function load() {
    setLoading(true);
    const r = await fetch('/api/fixas');
    const d = await r.json();
    setFixas(d.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    const payload: any = { status };
    if (status === 'encerrada') payload.dataFim = new Date().toISOString();
    const r = await fetch(`/api/fixas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) { toast.error('Erro'); return; }
    toast.success('Atualizado');
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir despesa fixa?')) return;
    const r = await fetch(`/api/fixas/${id}`, { method: 'DELETE' });
    if (!r.ok) { toast.error('Erro'); return; }
    toast.success('Excluída');
    load();
  }

  const ativas = fixas.filter((f) => f.status !== 'encerrada');
  const encerradas = fixas.filter((f) => f.status === 'encerrada');
  const lista = tab === 'ativas' ? ativas : encerradas;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="glass-card p-3 sm:p-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div>
          <div className="text-[10px] sm:text-xs text-secondary">Total mensal {tab === 'ativas' ? 'ativas' : 'encerradas'}</div>
          <div className="text-xl sm:text-2xl font-semibold text-primary">
            <HiddenValue value={lista.reduce((s, f) => s + f.valor, 0)} />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex gap-0.5 p-0.5 rounded-lg bg-white/5 border border-white/10">
            {(['ativas', 'encerradas'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all',
                  tab === t ? 'bg-blue-500/20 text-primary' : 'text-secondary'
                )}
              >
                {t === 'ativas' ? `Ativas (${ativas.length})` : `Enc. (${encerradas.length})`}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setEditing(null); setOpenForm(true); }}
            className="ml-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 shadow-md"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Nova
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-3 sm:p-4 h-20 sm:h-24 animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="glass-card p-8 sm:p-12 text-center text-secondary text-sm">Nenhuma despesa nesta aba.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {lista.map((f) => {
            const dias = daysUntil(f.diaVencimento);
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3"
              >
                {f.categoria && (
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${f.categoria.cor}25`, color: f.categoria.cor }}
                  >
                    <IconRenderer name={f.categoria.icone} className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="text-sm font-medium text-primary truncate">{f.descricao}</div>
                    {f.status === 'pausada' && <Badge color="#f59e0b">Pausada</Badge>}
                    {f.status === 'encerrada' && <Badge color="#94a3b8">Enc.</Badge>}
                  </div>
                  <div className="text-xs sm:text-sm text-secondary tabular truncate">
                    <HiddenValue value={f.valor} /> · dia {f.diaVencimento}
                  </div>
                  {f.status === 'ativa' && (
                    <div className="text-[10px] sm:text-xs text-tertiary">
                      {dias === 0 ? 'Vence hoje' : dias === 1 ? 'Amanhã' : `Em ${dias} dias`}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => { setEditing(f); setOpenForm(true); }} className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-secondary" title="Editar">
                    <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                  {f.status === 'ativa' ? (
                    <button onClick={() => updateStatus(f.id, 'pausada')} className="p-1 sm:p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-500" title="Pausar">
                      <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  ) : f.status === 'pausada' ? (
                    <button onClick={() => updateStatus(f.id, 'ativa')} className="p-1 sm:p-1.5 rounded-lg hover:bg-emerald-500/15 text-emerald-400" title="Reativar">
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  ) : null}
                  {f.status !== 'encerrada' && (
                    <button onClick={() => updateStatus(f.id, 'encerrada')} className="p-1 sm:p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400" title="Encerrar">
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                  {f.status === 'encerrada' && (
                    <button onClick={() => handleDelete(f.id)} className="p-1 sm:p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400" title="Excluir">
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={openForm} onClose={() => setOpenForm(false)} title={editing ? 'Editar despesa fixa' : 'Nova despesa fixa'}>
        <FixaForm initial={editing || undefined} onSuccess={() => { setOpenForm(false); load(); }} />
      </Modal>
    </div>
  );
}
