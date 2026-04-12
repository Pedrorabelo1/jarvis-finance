'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Modal } from '@/components/ui/Modal';
import { CategoriaForm } from '@/components/forms/CategoriaForm';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { Categoria, TipoLancamento } from '@/types';
import { formatBRL } from '@/lib/formatters';

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [tipoForm, setTipoForm] = useState<TipoLancamento>('saida');

  async function load() {
    setLoading(true);
    const r = await fetch('/api/categorias');
    const d = await r.json();
    setCategorias(d.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate(tipo: TipoLancamento) {
    setEditing(null);
    setTipoForm(tipo);
    setOpenForm(true);
  }

  function openEdit(c: Categoria) {
    setEditing(c);
    setTipoForm(c.tipo);
    setOpenForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir categoria?')) return;
    const r = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
    const d = await r.json();
    if (!r.ok) {
      toast.error(d.error || 'Erro');
      return;
    }
    toast.success('Excluída');
    load();
  }

  const entradas = categorias.filter((c) => c.tipo === 'entrada');
  const saidas = categorias.filter((c) => c.tipo === 'saida');

  function CardCategoria({ c }: { c: Categoria }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 flex items-center gap-3"
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${c.cor}25`, color: c.cor }}
        >
          <IconRenderer name={c.icone} className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-primary truncate">{c.nome}</div>
          {c.orcamento ? (
            <div className="text-xs text-secondary tabular">Orç. {formatBRL(c.orcamento)}</div>
          ) : (
            <div className="text-xs text-tertiary">Sem orçamento</div>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-white/10 text-secondary">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Saídas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-primary">Categorias de Saída</h2>
          <button
            onClick={() => openCreate('saida')}
            className="glass-button flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-4 h-[72px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {saidas.map((c) => (
              <CardCategoria key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      {/* Entradas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-primary">Categorias de Entrada</h2>
          <button
            onClick={() => openCreate('entrada')}
            className="glass-button flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entradas.map((c) => (
              <CardCategoria key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editing ? 'Editar categoria' : 'Nova categoria'}
      >
        <CategoriaForm
          initial={editing || undefined}
          tipo={tipoForm}
          onSuccess={() => {
            setOpenForm(false);
            load();
          }}
        />
      </Modal>
    </div>
  );
}
