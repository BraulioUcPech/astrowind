import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const name = formData.get('name')?.toString();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  console.log('Received data:', { name, email, password }); // Log de los datos recibidos

  if (!name || !email || !password) {
    console.error('Missing data:', { name, email, password }); // Log de datos faltantes
    return new Response('Name, email, and password are required', { status: 400 });
  }

  if (password.length < 6) {
    console.error('Weak password:', password); // Log de contraseña débil
    return new Response('Password should be at least 6 characters', { status: 400 });
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    console.error('Sign up error:', error); // Log del error de registro
    if (error.status === 500 && error.code === 'unexpected_failure') {
      return new Response('Error sending confirmation email', { status: 500 });
    }
    return new Response(error.message, { status: 500 });
  }

  return redirect('/login');
};
