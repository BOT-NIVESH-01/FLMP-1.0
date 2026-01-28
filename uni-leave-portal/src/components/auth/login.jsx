import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { login } from '../../api/auth.api';

export default function Login({ onSuccess, addToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await login({ email, password });
      localStorage.setItem('token', res.data.token);
      onSuccess();
    } catch (err) {
      addToast(err.response?.data?.msg || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="card p-8" onSubmit={handleSubmit}>
        <BookOpen size={32} />
        <input value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </div>
  );
}