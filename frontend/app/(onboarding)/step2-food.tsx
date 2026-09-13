import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';

export default function Step2Food() {
  const router = useRouter();
  const { dietType, fastingProtocol, allergies, updateField } = useOnboardingStore();

  const selectDiet = (diet: string) => updateField('dietType', diet);
  const diets = ['Omnivore', 'Keto', 'Carnivore', 'Mediterranean', 'Paleo', 'Vegan'];

  const selectFasting = (f: string) => updateField('fastingProtocol', f);
  const fastingOptions = ['None', '16:8', 'OMAD', 'Circadian'];

  return (
    <ScrollView className="flex-1 bg-bioblack px-6 pt-16">
      <Text className="text-4xl font-bold text-white mb-2">Fuel Protocol</Text>
      <Text className="text-gray-400 mb-8 text-lg">Define dietary constraints and windows.</Text>

      <View className="space-y-6">
        <View>
          <Text className="text-gray-300 font-bold mb-3 ml-1">Diet Type</Text>
          <View className="flex-row flex-wrap gap-3">
            {diets.map(d => (
              <TouchableOpacity key={d} onPress={() => selectDiet(d)} className={`px-4 py-2 rounded-lg border ${dietType === d ? 'bg-biored border-biored' : 'border-biogrey bg-biodark'}`}>
                <Text className="text-white font-medium">{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-gray-300 font-bold mb-3 ml-1">Fasting Window</Text>
          <View className="flex-row flex-wrap gap-3">
            {fastingOptions.map(f => (
              <TouchableOpacity key={f} onPress={() => selectFasting(f)} className={`px-4 py-2 rounded-lg border ${fastingProtocol === f ? 'bg-biored border-biored' : 'border-biogrey bg-biodark'}`}>
                <Text className="text-white font-medium">{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-gray-300 font-bold mb-2 ml-1">Allergies / Anti-nutrients to Avoid</Text>
          <TextInput className="bg-biodark text-white rounded-xl px-4 py-4 border border-biogrey" placeholder="e.g. Seed oils, Gluten, Dairy" placeholderTextColor="#666" value={allergies} onChangeText={(v) => updateField('allergies', v)} />
        </View>
      </View>

      <View className="mt-12 mb-12 flex-row justify-between">
        <TouchableOpacity 
          className="bg-biodark border border-biogrey rounded-xl py-4 flex-1 mr-2 items-center justify-center flex-row"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold text-lg">Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-biored rounded-xl py-4 flex-1 ml-2 items-center justify-center flex-row"
          onPress={() => router.push('/(onboarding)/step3-goal' as any)}
        >
          <Text className="text-white font-bold text-lg">Next: Objectives</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
