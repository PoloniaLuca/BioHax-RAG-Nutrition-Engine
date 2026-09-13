import '../global.css';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

const queryClient = new QueryClient();

function InitialLayout() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const checkOnboarding = async () => {
      // Get current segments cleanly inside the effect without binding to it as a trigger dependency
      const currentSegments = segments;
      const inAuthGroup = currentSegments[0] === '(auth)';
      const inOnboardingGroup = currentSegments[0] === '(onboarding)';
      const inTabsGroup = segments[0] === '(tabs)'; // Add this check

      if (!session?.user) {
        if (!inAuthGroup) router.replace('/(auth)/login');
        return;
      }

      // Check if user has completed onboarding by looking for diet_type/goal
      const { data, error } = await supabase
        .from('profiles')
        .select('goal')
        .eq('id', session.user.id)
        .single();
        
      if (error && error.code === 'PGRST116') {
        // PGRST116 means zero rows. The user exists in Auth but not in Profiles,
        // which implies they were deleted from the DB but the app cache has a stale JWT.
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
        return;
      }

      const hasCompletedOnboarding = data && data.goal !== null;
      
      if (!hasCompletedOnboarding) {
        // Only redirect if NOT already in onboarding
        if (!inOnboardingGroup) {
          router.replace('/(onboarding)/step1-life');
        }
      } else if (hasCompletedOnboarding && (!inTabsGroup)) {
         router.replace('/(tabs)');
      }
    };

    checkOnboarding();
  }, [session, isLoading]); // CRITICAL: Do NOT include 'segments' here or any nested page click will trigger a re-route!

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121212' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(onboarding)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InitialLayout />
          <StatusBar style="light" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
