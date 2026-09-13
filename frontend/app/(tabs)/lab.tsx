import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { fetchKnowledgeSources } from '../../src/api/plan';
import { useRouter } from 'expo-router';
import { LogOut, User, Activity, Flame, BookOpen } from 'lucide-react-native';

export default function LabScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
    }
  }, [user]);

  const { data: sourcesData, isLoading: sourcesLoading } = useQuery({
    queryKey: ['knowledgeSources'],
    queryFn: fetchKnowledgeSources,
  });

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
    else router.replace('/(auth)/login' as any);
  };

  return (
    <ScrollView className="flex-1 bg-bioblack">
      <View className="pt-16 px-6 pb-6 bg-biodark border-b border-biogrey relative">
        <Text className="text-gray-400 uppercase font-bold tracking-widest mb-1 text-xs">Subject ID: {user?.id?.substring(0,8)}</Text>
        <Text className="text-white text-3xl font-bold tracking-tight">The Lab</Text>
        
        <TouchableOpacity onPress={handleSignOut} className="absolute right-6 pt-16 mt-2">
            <LogOut color="#FF3B30" size={24} />
        </TouchableOpacity>
      </View>

      {profile && (
        <View className="px-6 py-8">
          
          <Text className="text-white text-xl font-bold mb-4">Current Directive</Text>
          <View className="bg-biodark border border-biogrey rounded-2xl p-5 mb-8">
            <View className="flex-row items-center mb-3">
              <Flame color="#FF3B30" size={20} className="mr-3" />
              <Text className="text-white font-bold text-lg">{profile.goal}</Text>
            </View>
            <View className="flex-row items-center">
              <Activity color="#4CAF50" size={20} className="mr-3" />
              <Text className="text-gray-300 font-medium">Dietary Core: <Text className="text-white font-bold">{profile.diet_type}</Text></Text>
            </View>
          </View>

          <Text className="text-white text-xl font-bold mb-4">Biometrics Vector</Text>
          <View className="flex-row flex-wrap justify-between">
             <View className="w-[48%] bg-biodark p-4 rounded-xl border border-biogrey mb-4 items-center">
               <Text className="text-gray-400 text-xs font-bold tracking-widest mb-1">HEIGHT</Text>
               <Text className="text-white font-bold text-xl">{profile.biometrics?.height}cm</Text>
             </View>
             <View className="w-[48%] bg-biodark p-4 rounded-xl border border-biogrey mb-4 items-center">
               <Text className="text-gray-400 text-xs font-bold tracking-widest mb-1">WEIGHT</Text>
               <Text className="text-white font-bold text-xl">{profile.biometrics?.weight}kg</Text>
             </View>
             <View className="w-[48%] bg-biodark p-4 rounded-xl border border-biogrey mb-4 items-center">
               <Text className="text-gray-400 text-xs font-bold tracking-widest mb-1">FASTING</Text>
               <Text className="text-white font-bold text-xl">{profile.biometrics?.fastingProtocol || 'None'}</Text>
             </View>
             <View className="w-[48%] bg-biodark p-4 rounded-xl border border-biogrey mb-4 items-center">
               <Text className="text-gray-400 text-xs font-bold tracking-widest mb-1">GENDER</Text>
               <Text className="text-white font-bold text-xl">{profile.biometrics?.gender}</Text>
             </View>
             <View className="w-[48%] bg-biodark p-4 rounded-xl border border-biogrey mb-4 items-center">
               <Text className="text-gray-400 text-xs font-bold tracking-widest mb-1">TIER</Text>
               <Text className="text-biored font-bold text-md text-center">{profile.subscription_tier}</Text>
             </View>
          </View>
          
          {profile.intolerances && profile.intolerances.length > 0 && (
              <View className="mt-4">
                  <Text className="text-white text-xl font-bold mb-4">Regimen Constraints</Text>
                  <View className="flex-row flex-wrap gap-2">
                      {profile.intolerances.map((intol: string, idx: number) => (
                          <View key={idx} className="bg-[#2C1919] px-3 py-1.5 rounded-lg border border-[#FF3B30]/30">
                              <Text className="text-[#FFaaaA] font-medium">{intol}</Text>
                          </View>
                      ))}
                  </View>
              </View>
          )}

          <View className="mt-8 mb-4">
            <View className="flex-row items-center mb-4">
              <BookOpen color="#0A84FF" size={24} className="mr-3" />
              <Text className="text-white text-xl font-bold">RAG Knowledge Base</Text>
            </View>
            <Text className="text-gray-400 text-sm mb-4 leading-5">The AI engine actively retrieves protocols and optimization strategies from these verified source materials when synthesizing your meal plans and providing advice.</Text>
            
            {sourcesLoading ? (
               <ActivityIndicator size="small" color="#0A84FF" />
            ) : (
               <View className="flex-row flex-wrap gap-3">
                 {sourcesData?.sources?.map((source: string, idx: number) => (
                   <View key={idx} className="bg-[#1C1C1E] px-4 py-2.5 rounded-xl border border-[#2C2C2E] flex-row items-center">
                     <View className="w-2 h-2 rounded-full bg-[#0A84FF] mr-2" />
                     <Text className="text-gray-300 font-bold tracking-wide">{source}</Text>
                   </View>
                 ))}
                 
                 {(!sourcesData?.sources || sourcesData.sources.length === 0) && (
                   <Text className="text-gray-500 italic">No sources loaded in the vector database.</Text>
                 )}
               </View>
            )}
          </View>

        </View>
      )}
    </ScrollView>
  );
}
