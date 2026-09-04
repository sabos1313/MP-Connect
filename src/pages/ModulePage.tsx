import type { LucideIcon } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

export function ModulePage({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return <div className="module-page"><section className="page-heading"><div><p className="eyebrow">Área de trabalho</p><h1>{title}</h1><p className="heading-subtitle">{description}</p></div><Badge>Estrutura preparada</Badge></section><Card className="module-empty-card"><div className="module-icon"><Icon size={24} strokeWidth={1.5} /></div><EmptyState title="Você ainda não possui dados cadastrados." detail="Quando os dados estiverem disponíveis, eles serão organizados nesta área." /></Card></div>;
}