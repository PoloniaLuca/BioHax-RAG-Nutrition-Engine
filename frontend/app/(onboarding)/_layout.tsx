import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121212' } }}>
      <Stack.Screen name="step1-life" />
      <Stack.Screen name="step2-food" />
      <Stack.Screen name="step3-goal" />
    </Stack>
  );
}
