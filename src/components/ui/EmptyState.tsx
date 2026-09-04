import { Inbox } from 'lucide-react';

export function EmptyState({ title = 'Você ainda não possui dados cadastrados.', detail }: { title?: string; detail?: string }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon"><Inbox size={22} strokeWidth={1.5} /></span>
      <h3>{title}</h3>
      {detail && <p>{detail}</p>}
    </div>
  );
}