import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      Alert.alert('로그인 실패', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL('auth/callback');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : '구글 로그인에 실패했습니다.';
      Alert.alert('로그인 실패', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        {/* 로고 */}
        <View className="items-center mb-12">
          <Text className="text-4xl font-semibold tracking-tight text-indigo-600">
            다왔어
          </Text>
          <Text className="text-sm text-gray-500 mt-2">
            목적지에 다 왔을 때 알려드려요
          </Text>
        </View>

        {/* 이메일 */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">이메일</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
          />
        </View>

        {/* 비밀번호 */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">비밀번호</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호 입력"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            autoComplete="password"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
          />
        </View>

        {/* 로그인 버튼 */}
        <TouchableOpacity
          onPress={handleEmailLogin}
          disabled={loading}
          className={`bg-indigo-600 rounded-full px-6 py-3 items-center mb-3 active:scale-95 ${loading ? 'opacity-60' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">로그인</Text>
          )}
        </TouchableOpacity>

        {/* 구분선 */}
        <View className="flex-row items-center my-4">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-3 text-sm text-gray-400">또는</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* 구글 로그인 */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={loading}
          className={`flex-row items-center justify-center border border-gray-300 rounded-full px-6 py-3 mb-6 active:scale-95 ${loading ? 'opacity-60' : ''}`}
        >
          <Text className="text-lg mr-2">G</Text>
          <Text className="text-gray-700 font-semibold text-base">Google로 계속하기</Text>
        </TouchableOpacity>

        {/* 회원가입 링크 */}
        <View className="flex-row justify-center">
          <Text className="text-sm text-gray-500">계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text className="text-sm font-semibold text-indigo-600">회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
