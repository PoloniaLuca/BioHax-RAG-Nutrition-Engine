import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

export default function Step3Goal() {
  const router = useRouter();
  const { user } = useAuth();
  const state = useOnboardingStore();
  const [loading, setLoading] = useState(false);

  const goals = [
    'Cognitive Performance', 
    'Hypertrophy & Strength', 
    'Longevity & Autophagy', 
    'Energy & Mitochondria', 
    'Rapid Fat Loss'
  ];

  const tiers = [
    { id: 'protocol_one_time', name: 'Protocol (Static)', desc: '12-week immutable protocol' },
    { id: 'coach_sub', name: 'AI Coach (Dynamic)', desc: 'Continuous optimization + RAG chat' }
  ];

  const submitProfile = async () => {
    if (!user) return Alert.alert('Error', 'No authenticated user found');
    setLoading(true);

    try {
      // 1. Update Profile in Supabase (Row already created by auth trigger)
      const { error: dbError } = await supabase.from('profiles').update({
        diet_type: state.dietType,
        goal: state.goal,
        biometrics: { 
          weight: state.weight, 
          height: state.height, 
          gender: state.gender, 
          sleep: state.sleep, 
          workoutType: state.workoutType,
          workoutSchedule: state.workoutSchedule,
          fastingProtocol: state.fastingProtocol 
        },
        intolerances: state.allergies ? state.allergies.split(',').map((s: string) => s.trim()) : [],
        subscription_tier: state.tier,
      }).eq('id', user.id);

      if (dbError) throw dbError;

      // 2. Trigger Plan Generation mapping localhost for emulators or web
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.101:8000';
      
      const payload = {
          user_id: user.id,
          tier: state.tier,
          profile_data: {
            id: user.id,
            diet_type: state.dietType,
            goal: state.goal,
            biometrics: { weight: state.weight, height: state.height, gender: state.gender, sleep: state.sleep, workoutType: state.workoutType, workoutSchedule: state.workoutSchedule, fastingProtocol: state.fastingProtocol },
            intolerances: state.allergies ? state.allergies.split(',').map((s: string) => s.trim()) : [],
            subscription_tier: state.tier,
          }
        };

      try {
        const res = await fetch(`${API_URL}/generate-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          Alert.alert("Warning", "The AI Engine returned an error, check backend logs.");
        }
      } catch (fetchErr) {
        Alert.alert(
          "Generation Server Unreachable", 
          `Could not connect to FastAPI at ${API_URL}. Ensure your backend is running. Your profile was saved successfully, so the plan will generate once the server connects.`
        );
        console.error("Fetch Error:", fetchErr);
      }

      // 3. Navigate to Dashboard regardless of generation success 
      //    (dashboard shows skeleton until data arrives)
      router.replace('/(tabs)' as any);
      
    } catch (e: any) {
      Alert.alert('Initialization Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-bioblack px-6 pt-16">
      <Text className="text-4xl font-bold text-white mb-2">Prime Directive</Text>
      <Text className="text-gray-400 mb-8 text-lg">Set main physiological objective.</Text>

      <View className="space-y-6">
        <View>
          <Text className="text-gray-300 font-bold mb-3 ml-1">Primary Goal</Text>
          <View className="space-y-2">
            {goals.map(g => (
              <TouchableOpacity key={g} onPress={() => state.updateField('goal', g)} className={`p-4 rounded-xl border ${state.goal === g ? 'bg-biored border-biored' : 'border-biogrey bg-biodark'}`}>
                <Text className="text-white font-medium text-lg">{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mt-6">
          <Text className="text-gray-300 font-bold mb-3 ml-1">Choose Protocol Tier</Text>
          <View className="space-y-3">
            {tiers.map(t => (
              <TouchableOpacity key={t.id} onPress={() => state.updateField('tier', t.id as any)} className={`p-4 rounded-xl border ${state.tier === t.id ? 'bg-biored border-biored' : 'border-biogrey bg-biodark'}`}>
                <Text className="text-white font-bold text-lg mb-1">{t.name}</Text>
                <Text className="text-gray-400">{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>

      <View className="mt-12 mb-12 flex-row justify-between">
        <TouchableOpacity 
          className="bg-biodark border border-biogrey rounded-xl py-4 flex-1 mr-2 items-center justify-center flex-row"
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-biored rounded-xl py-4 flex-1 ml-2 items-center justify-center flex-row"
          onPress={submitProfile}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Generate AI Protocol</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
