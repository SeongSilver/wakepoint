import { View, Text } from 'react-native';

export default function SignupScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>WakePoint</Text>
      <Text style={{ color: '#6B7280', marginTop: 8 }}>회원가입</Text>
    </View>
  );
}
