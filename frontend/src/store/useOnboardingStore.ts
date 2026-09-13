import { create } from 'zustand';

interface OnboardingState {
  workoutType: string;
  workoutSchedule: string;
  weight: string;
  height: string;
  gender: string;
  sleep: string;
  
  dietType: string;
  fastingProtocol: string;
  allergies: string;
  
  goal: string;
  tier: 'protocol_one_time' | 'coach_sub';

  updateField: (field: keyof Omit<OnboardingState, 'updateField'>, value: string) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  workoutType: '',
  workoutSchedule: '',
  weight: '',
  height: '',
  gender: '',
  sleep: '',
  
  dietType: 'Omnivore',
  fastingProtocol: 'None',
  allergies: '',
  
  goal: 'Longevity & Autophagy',
  tier: 'protocol_one_time',

  updateField: (field, value) => set((state) => ({ ...state, [field]: value })),
}));
