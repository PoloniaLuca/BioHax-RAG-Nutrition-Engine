import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';

export default function Step1Life() {
  const router = useRouter();
  const { height, weight, gender, sleep, workoutType, updateField } = useOnboardingStore();

  return (
    <ScrollView className="flex-1 bg-bioblack px-6 pt-16">
      <Text className="text-4xl font-bold text-white mb-2">Biometrics</Text>
      <Text className="text-gray-400 mb-8 text-lg">Establish baseline metrics for the biological engine.</Text>

      <View className="space-y-6">
        <View>
          <Text className="text-gray-300 font-bold mb-2 ml-1">Height (cm)</Text>
          <TextInput className="bg-biodark text-white rounded-xl px-4 py-4 border border-biogrey" placeholder="180" placeholderTextColor="#666" value={height} onChangeText={(v) => updateField('height', v)} keyboardType="numeric" />
        </View>

        <View>
          <Text className="text-gray-300 font-bold mb-2 ml-1">Weight (kg)</Text>
          <TextInput className="bg-biodark text-white rounded-xl px-4 py-4 border border-biogrey" placeholder="85" placeholderTextColor="#666" value={weight} onChangeText={(v) => updateField('weight', v)} keyboardType="numeric" />
        </View>
        
        <View>
          <Text className="text-gray-300 font-bold mb-2 ml-1">Biological Gender</Text>
          <TextInput className="bg-biodark text-white rounded-xl px-4 py-4 border border-biogrey" placeholder="Male / Female" placeholderTextColor="#666" value={gender} onChangeText={(v) => updateField('gender', v)} />
        </View>

        <View>
          <Text className="text-gray-300 font-bold mb-2 ml-1">Sleep Quality (Hours/Ratings)</Text>
          <TextInput className="bg-biodark text-white rounded-xl px-4 py-4 border border-biogrey" placeholder="e.g. 6.5 hours, fragmented" placeholderTextColor="#666" value={sleep} onChangeText={(v) => updateField('sleep', v)} />
        </View>

        <View>
          <Text className="text-gray-300 font-bold mb-2 ml-1">Average Workout Protocol</Text>
          <TextInput className="bg-biodark text-white rounded-xl px-4 py-4 border border-biogrey" placeholder="Weightlifting 4x week" placeholderTextColor="#666" value={workoutType} onChangeText={(v) => updateField('workoutType', v)} />
        </View>

        <View>
          <Text className="text-gray-300 font-bold mb-2 ml-1">Workout Days & Time</Text>
          <TextInput className="bg-biodark text-white rounded-xl px-4 py-4 border border-biogrey" placeholder="e.g. Mon/Wed/Fri at 6 PM" placeholderTextColor="#666" value={useOnboardingStore(s => s.workoutSchedule)} onChangeText={(v) => updateField('workoutSchedule', v)} />
        </View>
      </View>

      <View className="mt-12 mb-12">
        <TouchableOpacity 
          className="bg-biored rounded-xl py-4 items-center justify-center flex-row"
          onPress={() => router.push('/(onboarding)/step2-food' as any)}
        >
          <Text className="text-white font-bold text-lg">Next: Fuel Sources</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
