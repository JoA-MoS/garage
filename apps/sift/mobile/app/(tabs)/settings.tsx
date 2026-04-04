import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type AccountRowProps = { email: string; provider: 'gmail' | 'outlook'; active: boolean };

function AccountRow({ email, provider, active }: AccountRowProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center gap-3">
        <Ionicons
          name={provider === 'gmail' ? 'mail' : 'mail-outline'}
          size={20}
          color="#6366f1"
        />
        <View>
          <Text className="text-sm font-medium text-slate-100">{email}</Text>
          <Text className="text-xs capitalize text-slate-500">{provider}</Text>
        </View>
      </View>
      <View className={`h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-slate-600'}`} />
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['bottom']}>
      <ScrollView>
        <View className="px-4 pb-3 pt-4">
          <Text className="text-2xl font-bold text-slate-100">Settings</Text>
        </View>

        {/* Connected Accounts */}
        <View className="mx-4 mb-6 rounded-xl bg-slate-800">
          <Text className="px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Connected Accounts
          </Text>
          <AccountRow email="you@gmail.com" provider="gmail" active={true} />
          <View className="mx-4 border-b border-slate-700" />
          <TouchableOpacity className="flex-row items-center gap-3 px-4 py-3">
            <Ionicons name="add-circle-outline" size={20} color="#6366f1" />
            <Text className="text-sm text-indigo-400">Add account</Text>
          </TouchableOpacity>
        </View>

        {/* AI Settings */}
        <View className="mx-4 mb-6 rounded-xl bg-slate-800">
          <Text className="px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            AI Processing
          </Text>
          <View className="px-4 py-3">
            <Text className="text-sm text-slate-100">Auto-classify incoming emails</Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              Claude will rate importance and extract action items
            </Text>
          </View>
        </View>

        {/* Account */}
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
