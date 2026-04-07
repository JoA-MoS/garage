import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ActionType, Email } from '@garage/sift/types';

import {
  completeAction,
  getActions,
  getEmails,
  type ApiAction,
} from '../services/sift-api';

type ActionItemProps = {
  action: ApiAction;
  emailSubject: string;
  onComplete: (actionId: string) => void;
  completingActionId: string | null;
};

function iconForAction(type: ActionType): keyof typeof Ionicons.glyphMap {
  const icons: Record<ActionType, keyof typeof Ionicons.glyphMap> = {
    reply: 'return-up-forward-outline',
    forward: 'arrow-redo-outline',
    calendar_event: 'calendar-outline',
    task: 'checkbox-outline',
    review: 'eye-outline',
  };

  return icons[type];
}

function ActionItem({
  action,
  emailSubject,
  onComplete,
  completingActionId,
}: ActionItemProps) {
  const isCompleting = completingActionId === action.id;

  return (
    <TouchableOpacity
      className={`mx-4 mb-3 rounded-xl p-4 ${action.completed ? 'bg-slate-800/50' : 'bg-slate-800'}`}
      disabled={action.completed || isCompleting}
      onPress={() => onComplete(action.id)}
    >
      <View className="flex-row items-center gap-3">
        <Ionicons
          name={iconForAction(action.type)}
          size={20}
          color={action.completed ? '#475569' : '#6366f1'}
        />
        <View className="flex-1">
          <Text
            className={`text-sm font-medium ${action.completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}
          >
            {action.description}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
            Re: {emailSubject}
          </Text>
        </View>
        {isCompleting ? (
          <ActivityIndicator size="small" color="#6366f1" />
        ) : !action.completed ? (
          <View className="rounded-full bg-indigo-500/20 px-2 py-1">
            <Text className="text-xs capitalize text-indigo-400">
              {action.type.replace('_', ' ')}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function ActionsScreen() {
  const [actions, setActions] = useState<ApiAction[]>([]);
  const [emailById, setEmailById] = useState<Record<string, Email>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingActionId, setCompletingActionId] = useState<string | null>(
    null,
  );

  const loadActions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [actionsData, emailsData] = await Promise.all([
        getActions(),
        getEmails(),
      ]);
      const emailMap = emailsData.reduce<Record<string, Email>>(
        (acc, email) => {
          acc[email.id] = email;
          return acc;
        },
        {},
      );

      setActions(actionsData);
      setEmailById(emailMap);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load actions';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActions();
  }, [loadActions]);

  const handleComplete = useCallback(async (actionId: string) => {
    setCompletingActionId(actionId);
    setError(null);

    try {
      const updated = await completeAction(actionId);
      setActions((prev) =>
        prev.map((action) => (action.id === actionId ? updated : action)),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to complete action';
      setError(message);
    } finally {
      setCompletingActionId(null);
    }
  }, []);

  const pending = useMemo(
    () => actions.filter((action) => !action.completed),
    [actions],
  );
  const done = useMemo(
    () => actions.filter((action) => action.completed),
    [actions],
  );
  const sortedActions = useMemo(() => [...pending, ...done], [pending, done]);

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['bottom']}>
      <View className="px-4 pb-3 pt-4">
        <Text className="text-2xl font-bold text-slate-100">Actions</Text>
        <Text className="mt-1 text-sm text-slate-400">
          {pending.length} pending
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#6366f1" />
          <Text className="mt-3 text-sm text-slate-400">
            Loading actions...
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedActions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ActionItem
              action={item}
              emailSubject={emailById[item.emailId]?.subject ?? 'Unknown email'}
              onComplete={handleComplete}
              completingActionId={completingActionId}
            />
          )}
          ListEmptyComponent={
            <View className="px-6 py-12">
              <Text className="text-center text-sm text-slate-400">
                No actions yet. Action items will appear once emails are
                classified.
              </Text>
            </View>
          }
          ListHeaderComponent={
            error ? (
              <View className="mx-4 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                <Text className="text-sm text-red-300">{error}</Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={loading}
          onRefresh={loadActions}
        />
      )}
    </SafeAreaView>
  );
}
