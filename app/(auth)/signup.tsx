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
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

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

      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: user.id,
        email,
        nickname: nickname.trim(),
      });
      if (profileError) throw profileError;

      // 이메일 인증이 필요한 경우 session이 null
      if (!data.session) {
        Alert.alert(
          '가입 완료',
          '이메일로 인증 링크를 보냈습니다. 확인 후 로그인해주세요.',
          [{ text: '확인', onPress: () => router.replace('/(auth)/login') }]
        );
      }
      // session이 있으면 _layout.tsx의 onAuthStateChange가 자동으로 /(tabs)로 이동
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
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* 헤더 */}
          <View className="items-center mb-10">
            <Text className="text-4xl font-semibold tracking-tight text-indigo-600">다왔어</Text>
            <Text className="text-sm text-gray-500 mt-2">계정을 만들어 시작해보세요</Text>
          </View>

          {/* 닉네임 */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">닉네임</Text>
            <TextInput
              value={nickname}
              onChangeText={(v) => {
                setNickname(v);
                setFieldErrors((e) => ({ ...e, nickname: undefined }));
              }}
              placeholder="2자 이상 입력"
              autoCapitalize="none"
              returnKeyType="next"
              className={`border rounded-xl px-4 py-3 text-base text-gray-900 ${
                fieldErrors.nickname ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {fieldErrors.nickname && (
              <Text className="text-xs text-red-500 mt-1">{fieldErrors.nickname}</Text>
            )}
          </View>

          {/* 이메일 */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">이메일</Text>
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setFieldErrors((e) => ({ ...e, email: undefined }));
              }}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              className={`border rounded-xl px-4 py-3 text-base text-gray-900 ${
                fieldErrors.email ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {fieldErrors.email && (
              <Text className="text-xs text-red-500 mt-1">{fieldErrors.email}</Text>
            )}
          </View>

          {/* 비밀번호 */}
          <View className="mb-7">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">비밀번호</Text>
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setFieldErrors((e) => ({ ...e, password: undefined }));
              }}
              placeholder="6자 이상 입력"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSignup}
              className={`border rounded-xl px-4 py-3 text-base text-gray-900 ${
                fieldErrors.password ? 'border-red-400' : 'border-gray-300'
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
            className={`bg-indigo-600 rounded-full py-3 px-6 items-center mb-4 active:scale-95 ${loading ? 'opacity-60' : ''}`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">회원가입</Text>
            )}
          </TouchableOpacity>

          {/* 로그인 링크 */}
          <View className="flex-row justify-center mt-2">
            <Text className="text-sm text-gray-500">이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sm font-semibold text-indigo-600">로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
