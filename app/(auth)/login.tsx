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
      // Expo Go는 wakepoint:// 스킴을 인식하지 못하므로 환경에 맞는 URI를 동적으로 생성
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
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        {/* 헤더 */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text style={{ fontSize: 32, fontWeight: '700', color: '#4F46E5' }}>
            WakePoint
          </Text>
          <Text style={{ color: '#6B7280', marginTop: 8, fontSize: 15 }}>
            목적지 도착 알람 서비스
          </Text>
        </View>

        {/* 이메일 입력 */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: '500' }}>
            이메일
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: '#111827',
            }}
          />
        </View>

        {/* 비밀번호 입력 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: '500' }}>
            비밀번호
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호 입력"
            secureTextEntry
            autoComplete="password"
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: '#111827',
            }}
          />
        </View>

        {/* 이메일 로그인 버튼 */}
        <TouchableOpacity
          onPress={handleEmailLogin}
          disabled={loading}
          style={{
            backgroundColor: '#4F46E5',
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 12,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              로그인
            </Text>
          )}
        </TouchableOpacity>

        {/* 구분선 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
          <Text style={{ marginHorizontal: 12, color: '#9CA3AF', fontSize: 13 }}>또는</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
        </View>

        {/* 구글 로그인 버튼 */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={loading}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 10,
            paddingVertical: 14,
            marginBottom: 24,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>🅖</Text>
          <Text style={{ color: '#374151', fontWeight: '600', fontSize: 16 }}>
            Google로 계속하기
          </Text>
        </TouchableOpacity>

        {/* 회원가입 링크 */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={{ color: '#4F46E5', fontWeight: '600', fontSize: 14 }}>
              회원가입
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
