import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Email, EmailImportance } from '@garage/sift/types';

import { getEmails } from '../services/sift-api';

type BadgeLevel = 'high' | 'medium' | 'low' | 'spam' | 'unknown';
type ImportanceBadgeProps = { level: BadgeLevel };

function ImportanceBadge({ level }: ImportanceBadgeProps) {
  const colors: Record<BadgeLevel, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-green-500',
    spam: 'bg-fuchsia-600',
    unknown: 'bg-slate-500',
  };
  return (
    <View className={`rounded-full px-2 py-0.5 ${colors[level]}`}>
      <Text className="text-xs font-semibold capitalize text-white">
        {level}
      </Text>
    </View>
  );
}

function toBadgeLevel(importance: EmailImportance | null): BadgeLevel {
  if (!importance) return 'unknown';
  return importance;
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function EmailCard({ email }: { email: Email }) {
  return (
    <TouchableOpacity className="mx-4 mb-3 rounded-xl bg-slate-800 p-4">
      <View className="mb-2 flex-row items-start justify-between">
        <Text
          className="flex-1 pr-2 text-base font-semibold text-slate-100"
          numberOfLines={1}
        >
          {email.subject}
        </Text>
        <ImportanceBadge level={toBadgeLevel(email.importance)} />
      </View>
      <Text className="mb-1 text-sm text-slate-400">
        {email.fromName
          ? `${email.fromName} <${email.fromAddress}>`
          : email.fromAddress}
      </Text>
      <Text className="text-sm text-slate-500" numberOfLines={2}>
        {email.bodySnippet}
      </Text>
      <Text className="mt-2 text-xs text-slate-600">
        {formatRelativeTime(email.receivedAt)}
      </Text>
    </TouchableOpacity>
  );
}

export default function InboxScreen() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmails();
      setEmails(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load inbox';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const needsAttentionCount = useMemo(
    () => emails.filter((email) => email.status === 'unread').length,
    [emails],
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['bottom']}>
      <View className="px-4 pb-3 pt-4">
        <Text className="text-2xl font-bold text-slate-100">Inbox</Text>
        <Text className="mt-1 text-sm text-slate-400">
          {needsAttentionCount} emails need attention
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#6366f1" />
          <Text className="mt-3 text-sm text-slate-400">Loading inbox...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-red-400">{error}</Text>
          <TouchableOpacity
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2"
            onPress={loadInbox}
          >
            <Text className="font-semibold text-white">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={emails}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EmailCard email={item} />}
          ListEmptyComponent={
            <View className="px-6 py-12">
              <Text className="text-center text-sm text-slate-400">
                No emails yet. Connect an account in Settings to start syncing.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={loading}
          onRefresh={loadInbox}
        />
      )}
    </SafeAreaView>
  );
}
