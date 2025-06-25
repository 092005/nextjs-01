import NextAuth from 'next-auth';
import { authOptions } from './auth.config';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const { auth, signIn, signOut } = NextAuth(authOptions);

export { auth, signIn, signOut };

export async function signOutAction() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
  redirect('/');
}