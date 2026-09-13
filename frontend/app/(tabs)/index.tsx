import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../src/context/AuthContext';
import { fetchActivePlan, fetchTodayPlan, fetchProfile, toggleMealStatus } from '../../src/api/plan';
import { Flame, Activity, CheckCircle, Info, Target } from 'lucide-react-native';

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['activePlan', user?.id],
    queryFn: () => fetchActivePlan(user!.id),
    enabled: !!user
  });

  const { data: todayLog, isLoading: todayLoading } = useQuery({
    queryKey: ['todayPlan', user?.id, todayStr],
    queryFn: () => fetchTodayPlan(user!.id, todayStr),
    enabled: !!user
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user
  });

  const toggleMealMutation = useMutation({
    mutationFn: ({ mealId, status }: { mealId: string, status: boolean }) => toggleMealStatus(mealId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayPlan'] });
    }
  });

  if (planLoading || todayLoading || profileLoading) {
    return (
      <View className="flex-1 bg-bioblack justify-center items-center px-6">
        <ActivityIndicator size="large" color="#FF3B30" className="mb-4" />
        <Text className="text-white text-xl font-bold animate-pulse">Analyzing Biology...</Text>
        <Text className="text-gray-400 text-center mt-2">Connecting to AI engine to synthesize your protocol.</Text>
      </View>
    );
  }

  if (!todayLog) {
     return (
       <View className="flex-1 bg-bioblack justify-center items-center px-6">
         <ActivityIndicator size="large" color="#FF3B30" className="mb-4" />
         <Text className="text-white text-xl font-bold animate-pulse">Generating AI Protocol...</Text>
         <Text className="text-gray-400 text-center mt-2">This may take a moment. Please wait.</Text>
       </View>
     )
  }

  const currentHour = new Date().getHours();
  const fastingProtocol = profile?.biometrics?.fastingProtocol || 'None';
  
  let totalP = 0, totalC = 0, totalF = 0;
  if (Array.isArray(todayLog.meals) && todayLog.meals.length > 0) {
    totalP = todayLog.meals.reduce((sum: number, m: any) => sum + (Number(m.macros?.p) || 0), 0);
    totalC = todayLog.meals.reduce((sum: number, m: any) => sum + (Number(m.macros?.c) || 0), 0);
    totalF = todayLog.meals.reduce((sum: number, m: any) => sum + (Number(m.macros?.f) || 0), 0);
  } else {
    totalP = Number(todayLog.macros_total?.p) || 0;
    totalC = Number(todayLog.macros_total?.c) || 0;
    totalF = Number(todayLog.macros_total?.f) || 0;
  }
  
  let isFasting = false;
  let ringLabel = "FEEDING";
  let ringValueStr = "";
  let ringColor = "#4CAF50";
  let subText = "Optimal nutrient absorption window.";

  if (fastingProtocol === 'None') {
    // If no fasting, show progress of meals
    const totalMeals = todayLog.meals?.length || 0;
    const completedMeals = todayLog.meals?.filter((m: any) => m.is_completed).length || 0;
    ringLabel = "MEAL COMPLETED";
    ringValueStr = `${completedMeals}/${totalMeals}`;
    subText = "Daily protocol adherence.";
  } else {
    // Calculate Fasting based on protocol
    let startFast = 20; // Default 8 PM
    let endFast = 12; // Default Noon (16:8)

    if (fastingProtocol === '16:8') {
      startFast = 20; endFast = 12;
    } else if (fastingProtocol === 'OMAD') {
      startFast = 19; endFast = 18; // 23 hours fasting
    } else if (fastingProtocol === 'Circadian') {
      startFast = 19; endFast = 7; // 12 hours fasting
    }

    // Determine if currently in fasting window
    if (startFast > endFast) {
      // Crosses midnight (e.g. 20 to 12)
      isFasting = currentHour >= startFast || currentHour < endFast;
    } else {
      isFasting = currentHour >= startFast && currentHour < endFast;
    }

    if (isFasting) {
      ringLabel = "AUTOPHAGY";
      ringColor = "#FF3B30";
      // Calc hours fasted
      let hoursFasted = 0;
      if (currentHour >= startFast) {
        hoursFasted = currentHour - startFast;
      } else {
        hoursFasted = (24 - startFast) + currentHour;
      }
      ringValueStr = `${hoursFasted}h`;
      subText = `Fasting: ${fastingProtocol}. Ends at ${endFast}:00.`;
    } else {
      ringLabel = "FEEDING";
      ringColor = "#4CAF50";
      ringValueStr = `EAT`;
      
      let hoursUntilFast = startFast - currentHour;
      if (hoursUntilFast < 0) hoursUntilFast += 24;
      subText = `Fasting Protocol resumes in ${hoursUntilFast}h.`;
    }
  }

  return (
    <ScrollView className="flex-1 bg-bioblack">
      <View className="pt-16 px-6 pb-4 border-b border-biogrey">
        <Text className="text-gray-400 font-bold mb-1 uppercase tracking-wider">{new Date().toDateString()}</Text>
        <Text className="text-white text-3xl font-bold">{plan?.title || 'BioHax Protocol'}</Text>
      </View>

      <View className="items-center justify-center my-10">
        <View className={`w-64 h-64 rounded-full border-[12px] border-biogrey items-center justify-center relative`}>
          <View className={`absolute w-full h-full rounded-full border-[12px] border-transparent border-t-[${ringColor}] border-r-[${ringColor}] rotate-45 opacity-80`} style={{ borderTopColor: ringColor, borderRightColor: ringColor }} />
          {fastingProtocol === 'None' ? (
             <Target color={ringColor} size={40} className="mb-2" />
          ) : (
             <Flame color={ringColor} size={40} className="mb-2" />
          )}
          <Text className="text-white text-5xl font-bold">{ringValueStr}</Text>
          <Text style={{ color: ringColor }} className="font-bold tracking-widest mt-2">{ringLabel}</Text>
        </View>
        <Text className="text-gray-400 mt-6 font-medium tracking-wide">{subText}</Text>
      </View>

      <View className="px-6 mb-8">
        <View className="flex-row justify-between bg-biodark p-5 rounded-2xl border border-biogrey shadow-sm">
            <View className="items-center flex-1"><Text className="text-gray-400 text-xs font-bold mb-1 tracking-wider">PROTEIN</Text><Text className="text-white text-xl font-bold">{Math.round(totalP)}g</Text></View>
            <View className="w-px bg-biogrey h-full" />
            <View className="items-center flex-1"><Text className="text-gray-400 text-xs font-bold mb-1 tracking-wider">FAT</Text><Text className="text-white text-xl font-bold">{Math.round(totalF)}g</Text></View>
            <View className="w-px bg-biogrey h-full" />
            <View className="items-center flex-1"><Text className="text-gray-400 text-xs font-bold mb-1 tracking-wider">CARBS</Text><Text className="text-white text-xl font-bold">{Math.round(totalC)}g</Text></View>
        </View>
      </View>

      <View className="px-6 pb-12">
        <Text className="text-white text-2xl font-bold mb-6 tracking-tight">Timeline</Text>
        
        {(() => {
          const mealOrder: Record<string, number> = {
            'breakfast': 1,
            'snack': 2,
            'lunch': 3,
            'pre_workout': 4,
            'dinner': 5
          };
          const sortedMeals = todayLog.meals ? [...todayLog.meals].sort((a: any, b: any) => 
            (mealOrder[a.type.toLowerCase()] || 99) - (mealOrder[b.type.toLowerCase()] || 99)
          ) : [];

          return sortedMeals.map((meal: any, index: number) => (
          <View key={meal.id} className="flex-row mb-2">
            <View className="items-center mr-4">
              <View className="w-12 h-12 rounded-full bg-biodark border border-biogrey items-center justify-center">
                <Activity size={20} color="#FF3B30" />
              </View>
              {index !== sortedMeals.length - 1 && <View className="w-px flex-1 bg-biogrey mt-2" />}
            </View>
            <View className="flex-1 bg-biodark p-5 rounded-2xl border border-biogrey mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-biored font-bold text-xs uppercase tracking-widest">{meal.type}</Text>
                <TouchableOpacity 
                  onPress={() => toggleMealMutation.mutate({ mealId: meal.id, status: meal.is_completed })}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  className="p-2 -m-2"
                >
                  {meal.is_completed ? (
                    <CheckCircle size={24} color="#4CAF50" />
                  ) : (
                    <View className="w-6 h-6 rounded-full border-[2.5px] border-gray-500" />
                  )}
                </TouchableOpacity>
              </View>
              <Text className="text-white font-bold text-xl mb-3">{meal.name}</Text>
              
              {meal.ingredients && (
                <Text className="text-gray-400 leading-5 mb-4 text-sm">
                  {meal.ingredients.map((i:any) => `${i.qty} ${i.item}`).join(', ')}
                </Text>
              )}

              {meal.biohack_tip && (
                <View className="flex-row bg-[#FF3B30]/10 p-4 rounded-xl items-start">
                  <Info size={18} color="#FF3B30" className="mr-3" />
                  <Text className="text-[#FFaaaA] text-sm flex-1 leading-5 font-medium">{meal.biohack_tip}</Text>
                </View>
              )}
            </View>
          </View>
        ))})()}
      </View>
    </ScrollView>
  );
}