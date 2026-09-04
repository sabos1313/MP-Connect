export function LoadingState({ label = 'Carregando informações...' }: { label?: string }) {
  return <div className="loading-state" role="status"><span className="spinner" />{label}</div>;
}