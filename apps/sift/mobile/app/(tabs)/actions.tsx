import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type ActionItemProps = {
  description: string;
  type: 'reply' | 'task' | 'review';
  emailSubject: string;
  completed: boolean;
};

function ActionItem({ description, type, emailSubject, completed }: ActionItemProps) {
  const icons = { reply: 'return-up-forward-outline', task: 'checkbox-outline', review: 'eye-outline' } as const;

  return (
    <TouchableOpacity
      className={`mx-4 mb-3 rounded-xl p-4 ${completed ? 'bg-slate-800/50' : 'bg-slate-800'}`}
    >
      <View className="flex-row items-center gap-3">
        <Ionicons
          name={icons[type]}
          size={20}
          color={completed ? '#475569' : '#6366f1'}
        />
        <View className="flex-1">
          <Text
            className={`text-sm font-medium ${completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}
          >
            {description}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
            Re: {emailSubject}
          </Text>
        </View>
        {!completed && (
          <View className="rounded-full bg-indigo-500/20 px-2 py-1">
            <Text className="text-xs text-indigo-400 capitalize">{type}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const PLACEHOLDER_ACTIONS: ActionItemProps[] = [
  {
    description: 'Sign and return permission slip',
    type: 'task',
    emailSubject: 'School field trip permission slip due Friday',
    completed: false,
  },
  {
    description: 'Reply to coach confirming attendance Monday',
    type: 'reply',
    emailSubject: 'Soccer practice cancelled tomorrow',
    completed: false,
  },
  {
    description: 'Review Amazon order confirmation',
    type: 'review',
    emailSubject: 'Your Amazon order has shipped',
    completed: true,
  },
];

export default function ActionsScreen() {
  const pending = PLACEHOLDER_ACTIONS.filter((a) => !a.completed);
  const done = PLACEHOLDER_ACTIONS.filter((a) => a.completed);

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['bottom']}>
      <View className="px-4 pb-3 pt-4">
        <Text className="text-2xl font-bold text-slate-100">Actions</Text>
        <Text className="mt-1 text-sm text-slate-400">{pending.length} pending</Text>
      </View>
      <FlatList
        data={[...pending, ...done]}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <ActionItem {...item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}
