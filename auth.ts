import NextAuth from 'next-auth';
import { authOptions } from './auth.config';

const nextAuth = NextAuth(authOptions);

export const auth = nextAuth.auth;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

export async function signOutAction() {
  'use server';
  await signOut({ redirectTo: '/' });
}