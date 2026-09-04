import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { primaryNavigation, settingsNavigation } from '../lib/navigation';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark">MP</div>
          <div><strong>Maria Paulina</strong><span>Saboaria</span></div>
          <button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          <p className="nav-label">Menu principal</p>
          {primaryNavigation.map(({ label, path, iconComponent: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <Icon size={18} strokeWidth={1.7} /><span>{label}</span>
            </NavLink>
          ))}
          <p className="nav-label nav-label-settings">Sistema</p>
          <NavLink to={settingsNavigation.path} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <settingsNavigation.iconComponent size={18} strokeWidth={1.7} /><span>{settingsNavigation.label}</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer"><span className="status-dot" />Ambiente pronto para conexão</div>
      </aside>
      <main className="main-area">
        <header className="topbar"><button className="icon-button menu-trigger" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button><div className="topbar-context">Espaço de trabalho <span>/</span> Maria Paulina</div><div className="user-chip"><span className="user-avatar">MP</span><span className="user-name">Minha conta</span></div></header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}