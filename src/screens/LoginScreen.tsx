import React, { useState } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { setError, error, isLoading, setLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        await authService.signup(email, password);
        alert('Verifique seu e-mail para confirmar o cadastro!');
      } else {
        await authService.login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'var(--bg-base, #0a0a0a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-title)'
    }}>
      <div style={{
        width: '320px',
        padding: '32px',
        background: 'var(--bg-module)',
        borderRadius: 'var(--radius-module)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Social OS</h1>
          <p style={{ color: 'var(--color-subtitle)', fontSize: '13px', marginTop: '8px' }}>
            {isRegistering ? 'Crie sua nova conta' : 'Acesse seu sistema operacional'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input 
            placeholder="E-mail" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            placeholder="Senha" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && (
            <p style={{ color: 'var(--status-dnd)', fontSize: '12px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <Button type="submit" disabled={isLoading} style={{ marginTop: '12px' }}>
            {isLoading ? 'Aguarde...' : (isRegistering ? 'Cadastrar' : 'Entrar')}
          </Button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-subtitle)', 
              fontSize: '12px', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Crie uma agora'}
          </button>
        </div>
      </div>
    </div>
  );
}
