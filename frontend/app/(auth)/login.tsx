import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/src/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signUpWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) Alert.alert('Sign Up Error', error.message);
    else Alert.alert('Success', 'Check your email for the confirmation link');
    setLoading(false);
  };

  const signInWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) Alert.alert('Sign In Error', error.message);
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-bioblack justify-center px-8">
      <View className="items-center mb-12">
        <Text className="text-4xl font-bold text-white mb-2 tracking-tighter">BIO<Text className="text-biored">HAX</Text></Text>
        <Text className="text-gray-400 text-center">Engineering your nutritional protocols.</Text>
      </View>

      <View className="space-y-4">
        <TextInput
          className="bg-biodark text-white rounded-xl px-4 py-4 font-medium border border-biogrey"
          placeholder="Email address"
          placeholderTextColor="#666"
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          className="bg-biodark text-white rounded-xl px-4 py-4 font-medium border border-biogrey"
          placeholder="Password"
          placeholderTextColor="#666"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <View className="mt-8 space-y-4">
        <TouchableOpacity 
          className="bg-biored rounded-xl py-4 items-center justify-center flex-row"
          onPress={signInWithEmail}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Initialize Protocol</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-biodark border border-biogrey rounded-xl py-4 items-center justify-center"
          onPress={signUpWithEmail}
          disabled={loading}
        >
          <Text className="text-white font-medium text-lg">Create Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
