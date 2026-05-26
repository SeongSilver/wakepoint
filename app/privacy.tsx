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

const PROCESSORS = [
  { company: 'Supabase Inc.', work: '데이터베이스 및 인증 서비스', country: '미국' },
  { company: 'Google Firebase (FCM)', work: '푸시 알림 발송', country: '미국' },
  { company: '카카오(Kakao Corp.)', work: '소셜 로그인 및 공유 기능', country: '대한민국' },
  { company: 'Google LLC', work: 'OAuth 로그인 및 지도 서비스', country: '미국' },
] as const;

export default function PrivacyScreen() {
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
        <Text className="text-[17px] font-semibold text-ink">개인정보처리방침</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48 }}
      >
        <Text className="text-[13px] text-ink-muted mb-4">시행일: 2026년 5월 18일</Text>

        <Body>
          {'다왔어(이하 "서비스")는 「개인정보 보호법」 및 「위치정보의 보호 및 이용 등에 관한 법률」에 따라 이용자의 개인정보와 위치정보를 안전하게 보호합니다.'}
        </Body>

        <SectionTitle>제1조 (수집하는 개인정보 항목)</SectionTitle>
        <Bullet>이메일 주소 — 회원가입 및 로그인 인증</Bullet>
        <Bullet>닉네임 — 서비스 내 사용자 식별</Bullet>
        <Bullet>
          위치정보 — 목적지 반경 진입 감지 (앱 백그라운드 실행 중 포함)
        </Bullet>
        <Bullet>기기 식별자 및 FCM 푸시 토큰 — 알림 발송</Bullet>
        <Bullet>
          소셜 계정 정보 (Google, 카카오) — 소셜 로그인 이용 시 이메일·닉네임
        </Bullet>

        <SectionTitle>제2조 (개인정보 수집 및 이용 목적)</SectionTitle>
        <Bullet>위치 기반 알람 서비스 — 설정 목적지 반경 진입 시 알람 발송</Bullet>
        <Bullet>
          대리 알람 기능 — 친구가 이용자를 대신해 알람을 설정하고 푸시 알림 발송
        </Bullet>
        <Bullet>회원 관리 — 서비스 이용 본인 확인, 불량 이용자 제재</Bullet>

        <SectionTitle>제3조 (개인정보 보유 및 이용 기간)</SectionTitle>
        <Body>
          {'이용자가 서비스를 탈퇴하면 개인정보를 즉시 파기합니다.\n\n위치정보는 서버에 이력으로 저장되지 않으며, 반경 진입 감지를 위해 기기에서만 처리된 후 즉시 폐기됩니다.\n\n단, 관련 법령에 따라 보관 의무가 있는 경우 해당 기간 동안 보관 후 파기합니다.'}
        </Body>

        <SectionTitle>제4조 (개인정보의 제3자 제공)</SectionTitle>
        <Body>
          서비스는 이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
          단, 서비스 제공을 위해 아래 수탁업체에 처리를 위탁합니다.
        </Body>

        <SectionTitle>제5조 (개인정보처리 위탁)</SectionTitle>
        <View className="border border-hairline rounded-[14px] overflow-hidden mt-1">
          {PROCESSORS.map((row, i) => (
            <View
              key={row.company}
              className={`px-4 py-3${i < PROCESSORS.length - 1 ? ' border-b border-hairline' : ''}`}
            >
              <Text className="text-[13px] font-semibold text-ink">{row.company}</Text>
              <Text className="text-[12px] text-ink-muted mt-0.5">
                {row.work} · {row.country}
              </Text>
            </View>
          ))}
        </View>
        <Text className="text-[12px] text-ink-muted mt-2 leading-5">
          미국 소재 수탁업체의 경우 「개인정보 보호법」 제28조의8에 따른 국외 이전에 해당하며,
          이용자는 본 약관 동의로 이에 동의한 것으로 간주됩니다.
        </Text>

        <SectionTitle>제6조 (위치정보 처리 — 위치정보법)</SectionTitle>
        <Body>
          {'서비스는 「위치정보의 보호 및 이용 등에 관한 법률」에 따라 위치정보를 처리합니다.\n'}
        </Body>
        <View className="mt-2">
          <Bullet>
            수집 방법: 기기 GPS·네트워크 — 앱 실행 중 및 백그라운드 실행 중 포함
          </Bullet>
          <Bullet>이용 목적: 설정된 목적지 반경 진입 여부 감지 및 알람 트리거</Bullet>
          <Bullet>보유 기간: 위치 이력 미저장 — 반경 진입 감지 처리 후 즉시 폐기</Bullet>
          <Bullet>제3자 제공: 이용자 별도 동의 없이 제3자에게 제공하지 않음</Bullet>
        </View>
        <View className="mt-3">
          <Body>
            이용자는 기기 설정에서 위치 권한을 거부하거나 언제든지 동의를 철회할 수 있습니다.
            위치 권한을 거부하면 알람 핵심 기능이 작동하지 않을 수 있습니다.
          </Body>
        </View>

        <SectionTitle>제7조 (이용자 권리)</SectionTitle>
        <Body>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</Body>
        <View className="mt-2">
          <Bullet>개인정보 열람, 정정, 삭제 요청</Bullet>
          <Bullet>개인정보 처리 정지 요청</Bullet>
          <Bullet>위치정보 수집·이용·제공 동의 철회</Bullet>
        </View>
        <View className="mt-2">
          <Body>
            권리 행사는 서비스 내 탈퇴 기능 또는 아래 개인정보보호 책임자 이메일로
            요청하실 수 있습니다.
          </Body>
        </View>

        <SectionTitle>제8조 (개인정보보호 책임자)</SectionTitle>
        <View className="bg-parchment border border-hairline rounded-[14px] px-4 py-4">
          <Text className="text-[14px] font-semibold text-ink mb-1">다왔어 개인정보보호 담당자</Text>
          <Text className="text-[14px] text-primary">privacy@dawasseo.app</Text>
        </View>
        <View className="mt-3">
          <Body>
            {'개인정보 처리에 관한 불만·문의는 위 이메일로 접수해 주세요.\n\n개인정보 침해 신고는 아래 기관에 문의하실 수 있습니다.'}
          </Body>
        </View>
        <View className="mt-2">
          <Bullet>개인정보침해신고센터: privacy.go.kr / 국번 없이 118</Bullet>
          <Bullet>개인정보보호위원회: pipc.go.kr / 02-2100-3343</Bullet>
          <Bullet>대검찰청 사이버수사과: spo.go.kr / 02-3480-3573</Bullet>
          <Bullet>경찰청 사이버수사국: cyberbureau.police.go.kr / 182</Bullet>
        </View>

        <View className="mt-8 pt-4 border-t border-hairline">
          <Text className="text-[12px] text-ink-muted">
            본 방침은 2026년 5월 18일부터 시행됩니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
