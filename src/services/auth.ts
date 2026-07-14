import * as Linking from 'expo-linking';

import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';

const magicRedirectTo = Linking.createURL('magic-link');
const resetRedirectTo = Linking.createURL('reset-password');

export async function signInWithEmail(email: string, password: string) {
  assertEnvConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  assertEnvConfigured();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: magicRedirectTo,
    },
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function signInWithMagicLink(email: string) {
  assertEnvConfigured();
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: magicRedirectTo,
      shouldCreateUser: true,
    },
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function sendPasswordResetEmail(email: string) {
  assertEnvConfigured();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: resetRedirectTo,
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function signOut() {
  assertEnvConfigured();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user;
}
