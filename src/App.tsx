import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { EntityPage } from './pages/EntityPage';
import { FormulasPage, ProductionPage, SalesPage, StockPage, BirthdaysPage, ReportsPage, SettingsPage } from './pages/OperationsPage';

export function App() {
  return <HashRouter><Routes><Route element={<AppShell />}><Route path="/" element={<DashboardPage />} /><Route path="/estoque" element={<StockPage />} /><Route path="/insumos" element={<EntityPage kind="ingredients" />} /><Route path="/produtos" element={<EntityPage kind="products" />} /><Route path="/formulas" element={<FormulasPage />} /><Route path="/producao" element={<ProductionPage />} /><Route path="/clientes" element={<EntityPage kind="customers" />} /><Route path="/vendas" element={<SalesPage />} /><Route path="/aniversarios" element={<BirthdaysPage />} /><Route path="/relatorios" element={<ReportsPage />} /><Route path="/configuracoes" element={<SettingsPage />} /><Route path="*" element={<NotFoundPage />} /></Route></Routes></HashRouter>;
}