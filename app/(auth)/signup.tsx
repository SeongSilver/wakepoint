import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { UserProfile } from '@/types';

interface FieldError {
  email?: string;
  password?: string;
  nickname?: string;
}

function mapSupabaseError(message: string): string {
  if (message.includes('already registered') || message.includes('already been registered')) {
    return '이미 가입된 이메일 주소입니다.';
  }
  if (message.includes('password')) {
    return '비밀번호는 6자 이상이어야 합니다.';
  }
  if (message.includes('email')) {
    return '올바른 이메일 형식을 입력해주세요.';
  }
  if (message.includes('rate limit')) {
    return '잠시 후 다시 시도해주세요.';
  }
  return message;
}

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const setProfile = useUserStore((s) => s.setProfile);

  const validate = (): boolean => {
    const errors: FieldError = {};
    if (!email) errors.email = '이메일을 입력해주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = '올바른 이메일 형식을 입력해주세요.';
    if (!password) errors.password = '비밀번호를 입력해주세요.';
    else if (password.length < 6) errors.password = '비밀번호는 6자 이상이어야 합니다.';
    if (!nickname.trim()) errors.nickname = '닉네임을 입력해주세요.';
    else if (nickname.trim().length < 2) errors.nickname = '닉네임은 2자 이상이어야 합니다.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      const user = data.user;
      if (!user) throw new Error('회원가입 처리 중 오류가 발생했습니다.');

      if (data.session) {
        // handle_new_user 트리거가 auto-insert한 행에 닉네임을 upsert로 갱신
        await supabase
          .from('user_profiles')
          .upsert({ id: user.id, email, nickname: nickname.trim() });

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) setProfile(profile as UserProfile);

        router.replace('/(tabs)');
      } else {
        // Supabase 이메일 인증 활성화된 경우
        Alert.alert(
          '인증 이메일 발송',
          '가입한 이메일로 인증 링크를 보냈습니다.\n확인 후 로그인해주세요.',
          [{ text: '확인', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
      Alert.alert('회원가입 실패', mapSupabaseError(raw));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-canvas"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* 헤더 */}
          <View className="items-center mb-10">
            <Text className="text-4xl font-semibold text-[#0066cc]">다왔어</Text>
            <Text className="text-sm text-gray-500 mt-2">계정을 만들어 시작해보세요</Text>
          </View>

          {/* 닉네임 */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-ink mb-1.5">닉네임</Text>
            <TextInput
              value={nickname}
              onChangeText={(v) => {
                setNickname(v);
                setFieldErrors((e) => ({ ...e, nickname: undefined }));
              }}
              placeholder="2자 이상 입력"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              className={`bg-gray-50 border rounded-[11px] px-4 py-3 text-[17px] text-ink ${
                fieldErrors.nickname ? 'border-red-500' : 'border-[rgba(0,0,0,0.08)]'
              }`}
            />
            {fieldErrors.nickname && (
              <Text className="text-xs text-red-500 mt-1">{fieldErrors.nickname}</Text>
            )}
          </View>

          {/* 이메일 */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-ink mb-1.5">이메일</Text>
            <TextInput
              ref={emailRef}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setFieldErrors((e) => ({ ...e, email: undefined }));
              }}
              placeholder="email@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              className={`bg-gray-50 border rounded-[11px] px-4 py-3 text-[17px] text-ink ${
                fieldErrors.email ? 'border-red-500' : 'border-[rgba(0,0,0,0.08)]'
              }`}
            />
            {fieldErrors.email && (
              <Text className="text-xs text-red-500 mt-1">{fieldErrors.email}</Text>
            )}
          </View>

          {/* 비밀번호 */}
          <View className="mb-7">
            <Text className="text-sm font-medium text-ink mb-1.5">비밀번호</Text>
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setFieldErrors((e) => ({ ...e, password: undefined }));
              }}
              placeholder="6자 이상 입력"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSignup}
              className={`bg-gray-50 border rounded-[11px] px-4 py-3 text-[17px] text-ink ${
                fieldErrors.password ? 'border-red-500' : 'border-[rgba(0,0,0,0.08)]'
              }`}
            />
            {fieldErrors.password && (
              <Text className="text-xs text-red-500 mt-1">{fieldErrors.password}</Text>
            )}
          </View>

          {/* 회원가입 버튼 */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            className={`bg-primary rounded-full py-3.5 px-6 items-center mb-4 active:scale-95 ${loading ? 'opacity-60' : ''}`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-[17px]">회원가입</Text>
            )}
          </TouchableOpacity>

          {/* 로그인 링크 */}
          <View className="flex-row justify-center mt-2">
            <Text className="text-sm text-ink-muted">이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sm font-semibold text-primary">로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
