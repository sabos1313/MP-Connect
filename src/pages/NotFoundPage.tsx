import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return <div className="not-found"><span>404</span><h1>Página não encontrada</h1><p>O endereço acessado não faz parte do seu espaço de trabalho.</p><Link to="/"><Button>Voltar para a visão geral</Button></Link></div>;
}