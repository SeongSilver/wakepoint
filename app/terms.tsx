import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="text-[15px] font-semibold text-ink mb-2 mt-6">{children}</Text>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <Text className="text-[14px] text-ink leading-6">{children}</Text>;
}

function Bullet({ children }: { children: string }) {
  return (
    <View className="flex-row mb-1.5 pl-1">
      <Text className="text-[14px] text-ink-muted mr-2">•</Text>
      <Text className="text-[14px] text-ink leading-6 flex-1">{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center px-5 h-14 border-b border-hairline">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="mr-3"
        >
          <Ionicons name="chevron-back" size={24} color="#1d1d1f" />
        </TouchableOpacity>
        <Text className="text-[17px] font-semibold text-ink">이용약관</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48 }}
      >
        <Text className="text-[13px] text-ink-muted mb-4">시행일: 2026년 5월 18일</Text>

        <Body>
          이 약관은 다왔어(이하 "서비스")가 제공하는 위치 기반 알람 서비스의 이용 조건 및
          절차에 관한 사항을 규정합니다.
        </Body>

        <SectionTitle>제1조 (목적)</SectionTitle>
        <Body>
          이 약관은 서비스의 이용 조건·절차 및 운영자와 이용자의 권리·의무와 책임 사항을
          규정함을 목적으로 합니다.
        </Body>

        <SectionTitle>제2조 (용어의 정의)</SectionTitle>
        <Bullet>이용자: 서비스에 회원가입하여 서비스를 이용하는 자</Bullet>
        <Bullet>위치 알람: 이용자가 설정한 목적지 반경 진입 시 발생하는 알림</Bullet>
        <Bullet>
          대리 알람: 이용자의 동의 하에 친구 또는 가족이 이용자 대신 설정하는 알람
        </Bullet>
        <Bullet>위치정보: 이용자 기기의 GPS·네트워크를 통해 수집되는 실시간 위치 데이터</Bullet>

        <SectionTitle>제3조 (서비스 내용)</SectionTitle>
        <Body>서비스는 다음 기능을 제공합니다.</Body>
        <View className="mt-2">
          <Bullet>목적지 설정 및 반경 진입 시 알람 발송</Bullet>
          <Bullet>친구·가족이 이용자를 대신해 알람을 설정하는 대리 알람 기능</Bullet>
          <Bullet>친구 목록 관리 및 알람 설정 권한 요청·수락</Bullet>
          <Bullet>카카오톡을 통한 서비스 초대</Bullet>
        </View>

        <SectionTitle>제4조 (이용자 의무)</SectionTitle>
        <Body>이용자는 다음 행위를 하여서는 안 됩니다.</Body>
        <View className="mt-2">
          <Bullet>
            상대방의 명시적 동의 없이 타인의 위치정보를 수집하거나 추적하는 행위
          </Bullet>
          <Bullet>서비스를 이용하여 타인을 감시·스토킹하는 행위</Bullet>
          <Bullet>허위 정보를 등록하거나 타인의 계정을 도용하는 행위</Bullet>
          <Bullet>서비스 운영을 방해하거나 시스템을 악의적으로 사용하는 행위</Bullet>
          <Bullet>관련 법령 및 이 약관을 위반하는 행위</Bullet>
        </View>

        <SectionTitle>제5조 (위치정보 서비스)</SectionTitle>
        <Body>
          {'서비스는 위치 기반 알람 제공을 위해 이용자의 실시간 위치정보를 수집합니다. 앱이 백그라운드에서 실행 중일 때도 위치정보가 수집될 수 있습니다.\n\n위치정보 수집·이용·제공에 관한 세부 내용은 개인정보처리방침 제6조(위치정보 처리)를 따릅니다. 이용자는 기기 설정에서 위치 권한을 거부할 수 있으나, 이 경우 서비스의 핵심 기능이 정상 작동하지 않을 수 있습니다.'}
        </Body>

        <SectionTitle>제6조 (대리 알람 이용)</SectionTitle>
        <Body>
          {'대리 알람 기능은 이용자가 명시적으로 상대방에게 알람 설정 권한을 부여한 경우에만 작동합니다.\n\n권한을 부여한 이용자는 언제든지 서비스 내 친구 화면에서 권한을 철회할 수 있습니다.'}
        </Body>

        <SectionTitle>제7조 (서비스 중단 및 변경)</SectionTitle>
        <Body>
          {'서비스 운영자는 시스템 점검, 기술적 장애, 천재지변 등의 사유로 서비스를 일시 중단할 수 있습니다. 서비스 내용이 변경되는 경우 앱 공지 또는 이메일로 사전 안내합니다.'}
        </Body>

        <SectionTitle>제8조 (면책조항)</SectionTitle>
        <Body>
          {'서비스 운영자는 다음 사항에 대해 책임을 지지 않습니다.\n'}
        </Body>
        <Bullet>기기·통신 환경에 따른 위치 측정 오차로 인한 알람 오작동</Bullet>
        <Bullet>이용자의 귀책 사유로 발생한 손해</Bullet>
        <Bullet>
          이용자 간 대리 알람 이용 과정에서 발생하는 분쟁 (단, 서비스 결함에 의한 경우 제외)
        </Bullet>
        <Bullet>서비스 운영자의 통제 범위 밖의 사유로 인한 서비스 장애</Bullet>

        <SectionTitle>제9조 (분쟁 해결)</SectionTitle>
        <Body>
          이 약관에 관한 분쟁은 대한민국 법률을 준거법으로 하며, 분쟁이 발생한 경우
          서비스 운영자의 소재지를 관할하는 법원을 제1심 관할 법원으로 합니다.
        </Body>

        <View className="mt-8 pt-4 border-t border-hairline">
          <Text className="text-[12px] text-ink-muted">
            본 약관은 2026년 5월 18일부터 시행됩니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
