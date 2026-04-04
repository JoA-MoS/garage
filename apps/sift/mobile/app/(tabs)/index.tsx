import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ImportanceBadgeProps = { level: 'high' | 'medium' | 'low' };

function ImportanceBadge({ level }: ImportanceBadgeProps) {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-green-500',
  };
  return (
    <View className={`rounded-full px-2 py-0.5 ${colors[level]}`}>
      <Text className="text-xs font-semibold text-white capitalize">{level}</Text>
    </View>
  );
}

type EmailCardProps = {
  subject: string;
  from: string;
  snippet: string;
  receivedAt: string;
  importance: 'high' | 'medium' | 'low';
};

function EmailCard({ subject, from, snippet, receivedAt, importance }: EmailCardProps) {
  return (
    <TouchableOpacity className="mx-4 mb-3 rounded-xl bg-slate-800 p-4">
      <View className="mb-2 flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-base font-semibold text-slate-100" numberOfLines={1}>
          {subject}
        </Text>
        <ImportanceBadge level={importance} />
      </View>
      <Text className="mb-1 text-sm text-slate-400">{from}</Text>
      <Text className="text-sm text-slate-500" numberOfLines={2}>
        {snippet}
      </Text>
      <Text className="mt-2 text-xs text-slate-600">{receivedAt}</Text>
    </TouchableOpacity>
  );
}

// Placeholder data until API is connected
const PLACEHOLDER_EMAILS: EmailCardProps[] = [
  {
    subject: 'School field trip permission slip due Friday',
    from: 'teacher@school.edu',
    snippet: 'Please return the signed permission slip by Friday for the upcoming museum visit.',
    receivedAt: '2h ago',
    importance: 'high',
  },
  {
    subject: 'Your Amazon order has shipped',
    from: 'shipment-tracking@amazon.com',
    snippet: 'Your package is on its way and will arrive by Thursday.',
    receivedAt: '4h ago',
    importance: 'low',
  },
  {
    subject: 'Soccer practice cancelled tomorrow',
    from: 'coach@soccerclub.com',
    snippet: 'Due to weather conditions, practice is cancelled. Next session Monday.',
    receivedAt: '6h ago',
    importance: 'medium',
  },
];

export default function InboxScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['bottom']}>
      <View className="px-4 pb-3 pt-4">
        <Text className="text-2xl font-bold text-slate-100">Inbox</Text>
        <Text className="mt-1 text-sm text-slate-400">3 emails need attention</Text>
      </View>
      <FlatList
        data={PLACEHOLDER_EMAILS}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <EmailCard {...item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}
