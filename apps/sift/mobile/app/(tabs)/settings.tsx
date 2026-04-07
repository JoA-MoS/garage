import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { EmailAccount } from '@garage/sift/types';

import { getAccounts } from '../services/sift-api';

type AccountRowProps = { account: EmailAccount };

function AccountRow({ account }: AccountRowProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center gap-3">
        <Ionicons
          name={account.provider === 'gmail' ? 'mail' : 'mail-outline'}
          size={20}
          color="#6366f1"
        />
        <View>
          <Text className="text-sm font-medium text-slate-100">
            {account.email}
          </Text>
          <Text className="text-xs capitalize text-slate-500">
            {account.provider}
          </Text>
        </View>
      </View>
      <View
        className={`h-2 w-2 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-slate-600'}`}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load accounts';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['bottom']}>
      <ScrollView>
        <View className="px-4 pb-3 pt-4">
          <Text className="text-2xl font-bold text-slate-100">Settings</Text>
        </View>

        <View className="mx-4 mb-6 rounded-xl bg-slate-800">
          <Text className="px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Connected Accounts
          </Text>

          {loading ? (
            <View className="px-4 py-5">
              <ActivityIndicator size="small" color="#6366f1" />
              <Text className="mt-2 text-sm text-slate-400">
                Loading accounts...
              </Text>
            </View>
          ) : error ? (
            <View className="px-4 py-4">
              <Text className="text-sm text-red-400">{error}</Text>
              <TouchableOpacity
                className="mt-3 rounded-lg bg-indigo-600 px-3 py-2"
                onPress={loadAccounts}
              >
                <Text className="font-semibold text-white">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : accounts.length === 0 ? (
            <View className="px-4 py-4">
              <Text className="text-sm text-slate-400">
                No connected accounts yet.
              </Text>
            </View>
          ) : (
            accounts.map((account, index) => (
              <View key={account.id}>
                <AccountRow account={account} />
                {index < accounts.length - 1 ? (
                  <View className="mx-4 border-b border-slate-700" />
                ) : null}
              </View>
            ))
          )}

          <TouchableOpacity className="flex-row items-center gap-3 px-4 py-3">
            <Ionicons name="add-circle-outline" size={20} color="#6366f1" />
            <Text className="text-sm text-indigo-400">Add account</Text>
          </TouchableOpacity>
        </View>

        <View className="mx-4 mb-6 rounded-xl bg-slate-800">
          <Text className="px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            AI Processing
          </Text>
          <View className="px-4 py-3">
            <Text className="text-sm text-slate-100">
              Auto-classify incoming emails
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              Claude will rate importance and extract action items
            </Text>
          </View>
        </View>

        <View className="mx-4 rounded-xl bg-slate-800">
          <Text className="px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Account
          </Text>
          <TouchableOpacity className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-sm text-red-400">Sign out</Text>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
