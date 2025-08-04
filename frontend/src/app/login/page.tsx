/**
 * Página de login que valida y envía datos al backend
 * Usa react-hook-form con zod y el contexto de autenticación
 */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import './login.css';

const formSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

const LoginPage = () => {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const router = useRouter();

  // Cambiar el título dinámicamente y redirigir si ya está autenticado
  useEffect(() => {
    document.title = 'Iniciar Sesión';
    // Solo redirigir si loading es false y user existe
    if (typeof window === 'undefined') return;
    if (!user) return;
    const currentPath = window.location.pathname;
    if (user.role === 'admin' || user.role === 'superadmin') {
      if (currentPath !== '/admin') {
        router.push('/admin');
      }
    } else {
      if (currentPath !== '/pc-build') {
        router.push('/pc-build');
      }
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data);
      setSuccess('Inicio de sesión exitoso');
      setError('');
    } catch (err) {
      // Use a more specific type for error handling
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        setError(errorObj.response?.data?.message || 'Error al iniciar sesión');
      } else {
        setError('Error al iniciar sesión');
      }
      setSuccess('');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="text-2xl font-bold mb-6">Iniciar Sesión</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input 
              placeholder="Correo electrónico" 
              type="email" 
              {...register('email')} 
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Input 
              placeholder="Contraseña" 
              type="password" 
              {...register('password')} 
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        {success && <p className="text-green-600 mt-4">{success}</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;