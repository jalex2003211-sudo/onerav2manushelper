import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { usePartnersStore } from '@/store/partners.store';
import { trpc } from '@/lib/trpc';

export default function PairScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const partnerA = usePartnersStore((s) => s.partnerA);
  const setCouple = usePartnersStore((s) => s.setCouple);
  const stage = usePartnersStore((s) => s.relationshipStage);

  const createCouple = trpc.couple.create.useMutation({
    onSuccess: (data) => {
      setCreatedCode(data.inviteCode);
      setCouple({ id: data.coupleId, inviteCode: data.inviteCode });
    },
    onError: (err) => setError(err.message),
  });

  const joinCouple = trpc.couple.join.useMutation({
    onSuccess: (data) => {
      setCouple({ id: data.coupleId });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    },
    onError: (err) => setError(err.message),
  });

  const handleCreate = () => {
    setError(null);
    createCouple.mutate({
      partnerAName: partnerA.name || 'Partner A',
      partnerAAvatar: partnerA.avatar,
      relationshipStage: stage,
    });
  };

  const handleJoin = () => {
    if (inviteCode.trim().length !== 8) {
      setError('Please enter a valid 8-character invite code.');
      return;
    }
    setError(null);
    joinCouple.mutate({ inviteCode: inviteCode.trim().toUpperCase() });
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.backText, { color: colors.muted }]}>← Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Connect with your partner</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Share an invite code to sync your experience across devices.
          </Text>
        </View>

        {/* Tab switcher */}
        <View style={[styles.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['create', 'join'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => { setTab(t); setError(null); }}
              style={[
                styles.tab,
                tab === t && { backgroundColor: colors.background },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tab === t ? colors.foreground : colors.muted },
                ]}
              >
                {t === 'create' ? 'Create code' : 'Join with code'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        {tab === 'create' ? (
          <View style={styles.section}>
            {createdCode ? (
              <View style={styles.codeBox}>
                <Text style={[styles.codeLabel, { color: colors.muted }]}>Share this code with your partner</Text>
                <Text style={[styles.codeText, { color: colors.primary }]}>{createdCode}</Text>
                <Text style={[styles.codeHint, { color: colors.muted }]}>
                  They'll enter this code in the "Join with code" tab.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace('/(tabs)')}
                  activeOpacity={0.85}
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.primaryBtnText, { color: colors.background }]}>
                    Continue to app
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.sectionText, { color: colors.muted }]}>
                  Generate a unique code that your partner can use to join your couple profile.
                </Text>
                <TouchableOpacity
                  onPress={handleCreate}
                  disabled={createCouple.isPending}
                  activeOpacity={0.85}
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                >
                  {createCouple.isPending ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={[styles.primaryBtnText, { color: colors.background }]}>
                      Generate invite code
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionText, { color: colors.muted }]}>
              Enter the 8-character code your partner shared with you.
            </Text>
            <TextInput
              value={inviteCode}
              onChangeText={(v) => setInviteCode(v.toUpperCase())}
              placeholder="XXXXXXXX"
              placeholderTextColor={colors.muted}
              style={[
                styles.codeInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              maxLength={8}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
            <TouchableOpacity
              onPress={handleJoin}
              disabled={joinCouple.isPending}
              activeOpacity={0.85}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              {joinCouple.isPending ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.background }]}>
                  Join couple
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        )}

        {/* Skip option */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.6}
          style={styles.skipBtn}
        >
          <Text style={[styles.skipText, { color: colors.muted }]}>Skip for now — use locally</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    gap: 16,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  codeBox: {
    gap: 12,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  codeText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
  },
  codeHint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  codeInput: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 'auto',
  },
  skipText: {
    fontSize: 14,
  },
});
