import { supabase } from '../lib/supabase';

export const fetchActivePlan = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
    
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
}

export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
};

export const fetchTodayPlan = async (userId: string, dateStr: string) => {
  const { data, error } = await supabase
    .from('daily_logs')
    .select(`
      *,
      meals (*)
    `)
    .eq('user_id', userId)
    .eq('date', dateStr)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
};

export const fetchWeekPlan = async (userId: string, startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('daily_logs')
    .select(`
      *,
      meals (*)
    `)
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

export const toggleMealStatus = async (mealId: string, currentStatus: boolean) => {
  const { data, error } = await supabase
    .from('meals')
    .update({ is_completed: !currentStatus })
    .eq('id', mealId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const fetchKnowledgeSources = async () => {
  const url = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const response = await fetch(`${url}/sources`);
  if (!response.ok) {
    throw new Error('Failed to fetch knowledge sources');
  }
  return response.json();
};
