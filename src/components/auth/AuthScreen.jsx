import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const AuthScreen = () => {
  const { signIn, signUp, authError, authLoading } = useCRM();
  const [mode, setMode] = useState('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      if (mode === 'sign-up') {
        const result = await signUp(email, password, name);
        if (result?.needsEmailConfirmation) {
          setMessage('Check your email to confirm your registration. A workspace administrator must approve your CRM access.');
        }
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      setMessage(error.message || 'The authentication request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen grid place-items-center bg-[#0f141e] text-slate-300">Checking your session…</div>;
  }

  return (
    <main className="min-h-screen grid place-items-center bg-[#0f141e] px-4 text-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-xl border border-slate-200 bg-white p-7 text-slate-900 shadow-xl">
        <div>
          <div className="text-xl font-extrabold">Leadwise <span className="text-cyan-400">CRM</span></div>
          <p className="mt-1 text-sm text-slate-600">{mode === 'sign-in' ? 'Sign in to your workspace' : 'Request workspace access'}</p>
          {mode === 'sign-up' && <p className="text-xs text-slate-500">Registration does not grant access to customer records. An administrator must approve your account.</p>}
        </div>
        {mode === 'sign-up' && (
          <Input label="Full name" value={name} onChange={event => setName(event.target.value)} required autoComplete="name" />
        )}
        <Input label="Email address" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" />
        <Input label="Password" type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} />
        {(authError || message) && (
          <p className={`text-sm ${authError ? 'text-rose-700' : 'text-emerald-700'}`} role={authError ? 'alert' : 'status'}>
            {authError || message}
          </p>
        )}
        <Button type="submit" variant="primary" className="w-full" loading={submitting}>
          {mode === 'sign-in' ? 'Sign in' : 'Request access'}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-blue-700 hover:text-blue-900"
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            setMessage('');
          }}
        >
          {mode === 'sign-in' ? 'Need access? Request an account' : 'Already registered? Sign in'}
        </button>
      </form>
    </main>
  );
};
