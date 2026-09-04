import { AlertCircle } from 'lucide-react';

export function ErrorState({ message = 'Não foi possível carregar estas informações.' }: { message?: string }) {
  return <div className="error-state" role="alert"><AlertCircle size={18} />{message}</div>;
}