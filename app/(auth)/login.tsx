import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { login, isKakaoTalkLoginAvailable } from '@react-native-kakao/user';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const anyLoading = loading || kakaoLoading;
  const canLogin = agreedToTerms && !anyLoading;

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

  const handleKakaoLogin = async () => {
    setKakaoLoading(true);
    try {
      // KakaoTalk 미설치 시 카카오 계정 웹 로그인으로 fallback
      const talkAvailable = await isKakaoTalkLoginAvailable();
      const token = await login({ useKakaoAccountLogin: !talkAvailable });

      if (!token.idToken) {
        Alert.alert(
          '설정 오류',
          '카카오 OpenID Connect가 비활성화 상태입니다.\n카카오 개발자 콘솔 → 앱 → 카카오 로그인 → OpenID Connect를 활성화해주세요.'
        );
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'kakao',
        token: token.idToken,
      });

      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof Error ? err.message : '카카오 로그인에 실패했습니다.';
      Alert.alert('로그인 실패', message);
    } finally {
      setKakaoLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-canvas"
    >
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 justify-center px-6">
        {/* 로고 */}
        <View className="items-center mb-12">
          <Image
            source={require('../../assets/images/logo-basic.png')}
            className="w-52 h-14"
            resizeMode="contain"
          />
          <Text className="text-sm text-ink-muted mt-3">
            목적지에 다 왔을 때 알려드려요
          </Text>
        </View>

        {/* 이메일 */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-ink mb-1.5">이메일</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor="#7a7a7a"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="bg-parchment border border-hairline rounded-[18px] px-4 py-3 text-[17px] text-ink"
          />
        </View>

        {/* 비밀번호 */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-ink mb-1.5">비밀번호</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호 입력"
            placeholderTextColor="#7a7a7a"
            secureTextEntry
            autoComplete="password"
            className="bg-parchment border border-hairline rounded-[18px] px-4 py-3 text-[17px] text-ink"
          />
        </View>

        {/* 이메일 로그인 버튼 */}
        <TouchableOpacity
          onPress={handleEmailLogin}
          disabled={!canLogin}
          className={`bg-primary rounded-full px-6 py-3.5 items-center mb-3 active:scale-95 ${!canLogin ? 'opacity-60' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-[17px]">로그인</Text>
          )}
        </TouchableOpacity>

        {/* 구분선 */}
        <View className="flex-row items-center my-4">
          <View className="flex-1 h-px bg-hairline" />
          <Text className="mx-3 text-sm text-ink-muted">또는</Text>
          <View className="flex-1 h-px bg-hairline" />
        </View>

        {/* 구글 로그인 */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={!canLogin}
          className={`flex-row items-center justify-center border border-hairline rounded-full px-6 py-3.5 mb-3 active:scale-95 ${!canLogin ? 'opacity-60' : ''}`}
        >
          <Text className="text-lg mr-2">G</Text>
          <Text className="text-ink font-semibold text-[17px]">Google로 계속하기</Text>
        </TouchableOpacity>

        {/* 카카오 로그인 */}
        <TouchableOpacity
          onPress={handleKakaoLogin}
          disabled={!canLogin}
          className={`flex-row items-center justify-center bg-kakao rounded-full px-6 py-3.5 mb-5 active:scale-95 ${!canLogin ? 'opacity-60' : ''}`}
        >
          {kakaoLoading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Text className="text-lg mr-2">💬</Text>
              <Text className="text-black font-semibold text-[17px]">카카오로 계속하기</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 이용약관 동의 */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setAgreedToTerms((v) => !v)}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons
              name={agreedToTerms ? 'checkbox' : 'square-outline'}
              size={22}
              color={agreedToTerms ? '#0066cc' : '#7a7a7a'}
            />
            <Text className="text-sm text-ink ml-2 flex-1">
              이용약관 및 개인정보처리방침에 동의합니다
            </Text>
          </TouchableOpacity>
          <View className="flex-row items-center ml-8 mt-1.5">
            <TouchableOpacity
              onPress={() => router.push('/terms')}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text className="text-sm text-primary">이용약관</Text>
            </TouchableOpacity>
            <Text className="text-sm text-ink-muted mx-1.5">·</Text>
            <TouchableOpacity
              onPress={() => router.push('/privacy')}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text className="text-sm text-primary">개인정보처리방침</Text>
            </TouchableOpacity>
            <Text className="text-sm text-ink-muted ml-1">보기</Text>
          </View>
        </View>

        {/* 회원가입 링크 */}
        <View className="flex-row justify-center">
          <Text className="text-sm text-ink-muted">계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text className="text-sm font-semibold text-primary">회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
