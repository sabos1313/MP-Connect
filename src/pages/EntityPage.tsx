import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Search, SlidersHorizontal, Trash2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { adjustStock, deleteIfSafe, listCustomers, listIngredients, listProducts, registerIngredientPurchase, saveCustomer, saveIngredient, saveProduct, unitOptions } from '../services/dataService';
import type { Customer, Ingredient, Product, StockUnit } from '../types/database';

type EntityKind = 'ingredients' | 'products' | 'customers';
type Entity = Ingredient | Product | Customer;
type FormState = Partial<Ingredient & Product & Customer>;

const config: Record<EntityKind, { title: string; description: string; singular: string }> = {
  ingredients: { title: 'Insumos', description: 'Organize materiais e ingredientes com estoque sempre atualizado.', singular: 'insumo' },
  products: { title: 'Produtos', description: 'Gerencie produtos acabados, preços e disponibilidade.', singular: 'produto' },
  customers: { title: 'Clientes', description: 'Mantenha os dados de quem escolhe a sua marca.', singular: 'cliente' },
};

export function EntityPage({ kind }: { kind: EntityKind }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState<Entity[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState<'form' | 'stock' | null>(null);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [form, setForm] = useState<FormState>({ active: true, unit: 'unidade' });
  const [stockRecord, setStockRecord] = useState<Ingredient | Product | null>(null);
  const [stockDelta, setStockDelta] = useState('');
  const [stockType, setStockType] = useState<'purchase' | 'manual_addition' | 'manual_removal' | 'adjustment'>('manual_addition');
  const [stockNotes, setStockNotes] = useState('');
  const [purchaseUnit, setPurchaseUnit] = useState<StockUnit>('unidade');
  const [purchaseTotal, setPurchaseTotal] = useState('');
  const [purchaseSupplier, setPurchaseSupplier] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const active = activeFilter === 'all' ? undefined : activeFilter === 'active';
      const data = kind === 'ingredients' ? await listIngredients(search, active) : kind === 'products' ? await listProducts(search, active) : await listCustomers(search, active);
      setRecords(data as Entity[]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os dados.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [kind, search, activeFilter]);

  function openCreate() { setEditing(null); setForm({ active: true, unit: 'unidade' }); setModal('form'); }
  function openEdit(record: Entity) { setEditing(record); setForm(record); setModal('form'); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    try {
      if (kind === 'ingredients') await saveIngredient({ name: form.name ?? '', description: form.description ?? null, unit: (form.unit ?? 'unidade') as StockUnit, current_stock: form.current_stock ?? 0, minimum_stock: form.minimum_stock ?? 0, unit_cost: form.unit_cost ?? 0, active: form.active ?? true }, editing?.id);
      else if (kind === 'products') await saveProduct({ name: form.name ?? '', description: form.description ?? null, sale_price: form.sale_price ?? 0, current_stock: form.current_stock ?? 0, minimum_stock: form.minimum_stock ?? 0, unit: (form.unit ?? 'unidade') as StockUnit, active: form.active ?? true }, editing?.id);
      else await saveCustomer({ name: form.name ?? '', phone: form.phone ?? null, email: form.email ?? null, birth_date: form.birth_date ?? null, notes: form.notes ?? null, active: form.active ?? true }, editing?.id);
      setNotice(`${config[kind].singular[0].toUpperCase()}${config[kind].singular.slice(1)} ${editing ? 'atualizado' : 'cadastrado'} com sucesso.`); setModal(null); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.'); }
  }

  async function toggleActive(record: Entity) {
    try {
      const nextActive = !record.active;
      if (kind === 'ingredients') { const item = record as Ingredient; await saveIngredient({ name: item.name, description: item.description, unit: item.unit, active: nextActive }, record.id); }
      else if (kind === 'products') { const item = record as Product; await saveProduct({ name: item.name, description: item.description, unit: item.unit, active: nextActive }, record.id); }
      else { const customer = record as Customer; await saveCustomer({ name: customer.name, phone: customer.phone, email: customer.email, birth_date: customer.birth_date, notes: customer.notes, active: nextActive }, record.id); }
      setNotice(`${config[kind].singular} ${nextActive ? 'ativado' : 'desativado'} com sucesso.`); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar.'); }
  }

  async function remove(record: Entity) {
    if (!window.confirm(`Excluir este ${config[kind].singular}? Essa ação só será permitida se não houver histórico relacionado.`)) return;
    try { await deleteIfSafe(kind, record.id); setNotice('Registro excluído com sucesso.'); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível excluir. Desative o registro em vez disso.'); }
  }

  async function submitStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!stockRecord) return;
    const entered = Number(stockDelta); if (!Number.isFinite(entered) || entered <= 0) { setError('Informe uma quantidade maior que zero.'); return; }
    try {
      if (kind === 'ingredients' && stockType === 'purchase') {
        const totalCost = Number(purchaseTotal);
        if (!Number.isFinite(totalCost) || totalCost < 0) { setError('Informe um valor pago válido.'); return; }
        await registerIngredientPurchase({ ingredient_id: stockRecord.id, quantity: entered, unit: purchaseUnit, total_cost: totalCost, supplier: purchaseSupplier || null, notes: stockNotes || null });
        setNotice('Compra registrada, estoque atualizado e custo médio recalculado.');
      } else {
        await adjustStock({ [kind === 'ingredients' ? 'ingredient_id' : 'product_id']: stockRecord.id, delta: stockType === 'manual_removal' ? -entered : entered, movement_type: stockType, notes: stockNotes });
        setNotice('Estoque atualizado e movimentação registrada.');
      }
      setModal(null); await load();
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o estoque.'); }
  }

  const title = config[kind];
  return <div className="module-page">
    <section className="page-heading"><div><p className="eyebrow">Cadastros</p><h1>{title.title}</h1><p className="heading-subtitle">{title.description}</p></div><Button onClick={openCreate}><Plus size={16} /> Novo {title.singular}</Button></section>
    {notice && <div className="notice success" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso">×</button></div>}
    {error && <div className="notice error" role="alert"><ErrorState message={error} /><button onClick={() => setError('')} aria-label="Fechar aviso">×</button></div>}
    <Card className="data-card"><div className="toolbar"><label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Pesquisar ${title.singular}s...`} aria-label={`Pesquisar ${title.singular}s`} /></label><label className="filter-select"><SlidersHorizontal size={15} /><select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="all">Todos</option></select></label></div>
      {loading ? <LoadingState /> : records.length === 0 ? <EmptyState title={`Nenhum ${title.singular} encontrado.`} detail="Cadastre o primeiro registro para começar." /> : <div className="table-wrap"><table><thead><tr><th>Nome</th><th>{kind === 'customers' ? 'Contato' : 'Estoque'}</th><th>{kind === 'customers' ? 'Aniversário' : 'Situação'}</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.name}</strong>{'description' in record && record.description && <small>{record.description}</small>}</td><td>{kind === 'customers' ? <span>{(record as Customer).phone || (record as Customer).email || 'Sem contato'}</span> : <span>{(record as Ingredient | Product).current_stock} {(record as Ingredient | Product).unit}</span>}</td><td>{kind === 'customers' ? <span>{(record as Customer).birth_date ? new Date(`${(record as Customer).birth_date}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informado'}</span> : <Badge tone={(record as Ingredient | Product).current_stock <= (record as Ingredient | Product).minimum_stock ? 'accent' : 'neutral'}>{(record as Ingredient | Product).current_stock <= (record as Ingredient | Product).minimum_stock ? 'Estoque baixo' : 'Normal'}</Badge>}</td><td><div className="row-actions"><Button variant="ghost" onClick={() => openEdit(record)}>Editar</Button>{kind === 'products' && <Button variant="ghost" onClick={() => navigate(`/formulas?productId=${record.id}`)}>Ficha técnica</Button>}{kind !== 'customers' && <Button variant="ghost" aria-label="Movimentar estoque" onClick={() => { const item = record as Ingredient | Product; setStockRecord(item); setStockDelta(''); setStockType('manual_addition'); setPurchaseUnit(item.unit); setPurchaseTotal(''); setPurchaseSupplier(''); setStockNotes(''); setModal('stock'); }}>{(record as Ingredient | Product).current_stock > 0 ? <ArrowDownToLine size={15} /> : <ArrowUpFromLine size={15} />} Estoque</Button>}<Button variant="ghost" onClick={() => void toggleActive(record)}>{record.active ? 'Desativar' : 'Ativar'}</Button><button className="icon-button danger-icon" aria-label="Excluir" onClick={() => void remove(record)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
    </Card>
    {modal === 'form' && <Modal title={`${editing ? 'Editar' : 'Novo'} ${title.singular}`} onClose={() => setModal(null)}><form className="form-grid" onSubmit={(event) => void submit(event)}><Input label="Nome *" value={form.name ?? ''} required onChange={(event) => setForm({ ...form, name: event.target.value })} />{kind !== 'customers' ? <><label className="field"><span>Descrição</span><textarea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><Select label="Unidade *" value={form.unit ?? 'unidade'} onChange={(event) => setForm({ ...form, unit: event.target.value as StockUnit })}>{unitOptions().map((unit) => <option key={unit}>{unit}</option>)}</Select>{kind === 'ingredients' ? <Input label="Custo unitário" type="number" min="0" step="0.01" value={form.unit_cost ?? 0} onChange={(event) => setForm({ ...form, unit_cost: Number(event.target.value) })} /> : <Input label="Preço de venda" type="number" min="0" step="0.01" value={form.sale_price ?? 0} onChange={(event) => setForm({ ...form, sale_price: Number(event.target.value) })} />}<Input label="Estoque mínimo" type="number" min="0" step="0.01" value={form.minimum_stock ?? 0} onChange={(event) => setForm({ ...form, minimum_stock: Number(event.target.value) })} />{editing && <Input label="Estoque atual (use movimentações para alterar)" type="number" value={form.current_stock ?? 0} readOnly />}</> : <><Input label="Telefone" value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /><Input label="E-mail" type="email" value={form.email ?? ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /><Input label="Data de nascimento" type="date" value={form.birth_date ?? ''} onChange={(event) => setForm({ ...form, birth_date: event.target.value })} /><label className="field"><span>Observações</span><textarea value={form.notes ?? ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label></>}<label className="check-field"><input type="checkbox" checked={form.active ?? true} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Registro ativo</label><div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit">Salvar</Button></div></form></Modal>}
    {modal === 'stock' && stockRecord && <Modal title={`Movimentar estoque: ${stockRecord.name}`} onClose={() => setModal(null)}><form className="form-grid" onSubmit={(event) => void submitStock(event)}><p className="stock-current">Saldo atual: <strong>{stockRecord.current_stock} {stockRecord.unit}</strong></p><Select label="Tipo" value={stockType} onChange={(event) => setStockType(event.target.value as typeof stockType)}><option value="manual_addition">Entrada manual</option>{kind === 'ingredients' && <option value="purchase">Compra com custo</option>}<option value="manual_removal">Saída manual</option><option value="adjustment">Ajuste positivo</option></Select>{kind === 'ingredients' && stockType === 'purchase' && <><Select label="Unidade da compra" value={purchaseUnit} onChange={(event) => setPurchaseUnit(event.target.value as StockUnit)}>{unitOptions().map((unit) => <option key={unit}>{unit}</option>)}</Select><Input label="Valor pago *" type="number" min="0" step="0.0001" required value={purchaseTotal} onChange={(event) => setPurchaseTotal(event.target.value)} /><Input label="Fornecedor" value={purchaseSupplier} onChange={(event) => setPurchaseSupplier(event.target.value)} /></>}<Input label="Quantidade *" type="number" min="0.01" step="0.01" required value={stockDelta} onChange={(event) => setStockDelta(event.target.value)} /><Input label="Observação" value={stockNotes} onChange={(event) => setStockNotes(event.target.value)} /><div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit">{stockType === 'purchase' ? 'Registrar compra' : 'Registrar movimentação'}</Button></div></form></Modal>}
  </div>;
}