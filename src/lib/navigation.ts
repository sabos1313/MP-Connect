import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  ChartNoAxesCombined,
  ClipboardList,
  FlaskConical,
  Factory,
  House,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react';
import type { NavigationItem } from '../types/domain';

export interface AppNavigationItem extends NavigationItem {
  iconComponent: LucideIcon;
}

export const primaryNavigation: AppNavigationItem[] = [
  { label: 'Visão geral', path: '/', icon: 'house', iconComponent: House },
  { label: 'Estoque', path: '/estoque', icon: 'boxes', iconComponent: Boxes },
  { label: 'Insumos', path: '/insumos', icon: 'flask', iconComponent: FlaskConical },
  { label: 'Produtos', path: '/produtos', icon: 'package', iconComponent: Package },
  { label: 'Fórmulas', path: '/formulas', icon: 'clipboard', iconComponent: ClipboardList },
  { label: 'Produção', path: '/producao', icon: 'factory', iconComponent: Factory },
  { label: 'Clientes', path: '/clientes', icon: 'users', iconComponent: Users },
  { label: 'Vendas', path: '/vendas', icon: 'shopping', iconComponent: ShoppingBag },
  { label: 'Aniversários', path: '/aniversarios', icon: 'sparkles', iconComponent: Sparkles },
  { label: 'Relatórios', path: '/relatorios', icon: 'chart', iconComponent: ChartNoAxesCombined },
];

export const settingsNavigation: AppNavigationItem = {
  label: 'Configurações', path: '/configuracoes', icon: 'settings', iconComponent: Settings,
};