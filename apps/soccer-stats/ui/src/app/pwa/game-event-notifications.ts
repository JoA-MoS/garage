const NOTIFICATION_SETTING_KEY = 'soccer-stats:game-event-notifications';

export type GameEventNotificationSetting = 'enabled' | 'disabled';

export interface GameEventNotificationEvent {
  id: string;
  gameTeamId: string;
  period?: string | null;
  periodSecond: number;
  eventType: { name: string };
  player?: { firstName?: string | null; lastName?: string | null } | null;
  externalPlayerName?: string | null;
  externalPlayerNumber?: string | null;
  position?: string | null;
  formation?: string | null;
  childEvents?: Array<{
    eventType: { name: string };
    player?: { firstName?: string | null; lastName?: string | null } | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    position?: string | null;
  }>;
}

export interface GameEventNotificationContext {
  gameName: string;
  teamName: string;
  opponentName?: string;
  teamType?: 'home' | 'away';
  homeScore?: number;
  awayScore?: number;
}

export function areGameEventNotificationsEnabled() {
  return localStorage.getItem(NOTIFICATION_SETTING_KEY) === 'enabled';
}

export function setGameEventNotificationsEnabled(enabled: boolean) {
  localStorage.setItem(
    NOTIFICATION_SETTING_KEY,
    enabled ? 'enabled' : 'disabled',
  );
}

export function getNotificationPermission():
  | NotificationPermission
  | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function enableGameEventNotifications() {
  if (!('Notification' in window)) {
    setGameEventNotificationsEnabled(false);
    return 'unsupported' as const;
  }

  const permission =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;

  const enabled = permission === 'granted';
  setGameEventNotificationsEnabled(enabled);
  return permission;
}

export function disableGameEventNotifications() {
  setGameEventNotificationsEnabled(false);
}

export function formatGameClock(
  period: string | null | undefined,
  periodSecond: number,
) {
  const minutes = Math.floor(Math.max(0, periodSecond) / 60);
  const seconds = Math.max(0, periodSecond) % 60;
  const clock = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  return period ? `${period} ${clock}` : clock;
}

function formatPlayerName(event: GameEventNotificationEvent) {
  const realName = [event.player?.firstName, event.player?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (realName) return realName;
  if (event.externalPlayerName) return event.externalPlayerName;
  if (event.externalPlayerNumber) return `#${event.externalPlayerNumber}`;
  return null;
}

function formatChildPlayer(
  child: NonNullable<GameEventNotificationEvent['childEvents']>[number],
) {
  const realName = [child.player?.firstName, child.player?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (realName) return realName;
  if (child.externalPlayerName) return child.externalPlayerName;
  if (child.externalPlayerNumber) return `#${child.externalPlayerNumber}`;
  return null;
}

export function buildGameEventNotification(
  event: GameEventNotificationEvent,
  context: GameEventNotificationContext,
): { title: string; body: string; tag: string } | null {
  const eventType = event.eventType.name;
  const clock = formatGameClock(event.period, event.periodSecond);
  const playerName = formatPlayerName(event);
  const score =
    context.homeScore !== undefined && context.awayScore !== undefined
      ? `Score: ${context.homeScore}-${context.awayScore}`
      : undefined;
  const tag = `soccer-stats:${event.id}`;

  switch (eventType) {
    case 'GOAL': {
      const assist = event.childEvents
        ?.filter((child) => child.eventType.name === 'ASSIST')
        .map(formatChildPlayer)
        .find(Boolean);
      const details = [
        playerName ? `Scorer: ${playerName}` : null,
        assist ? `Assist: ${assist}` : null,
        score,
      ].filter(Boolean);

      return {
        title: `⚽ Goal — ${context.teamName}`,
        body: [`${context.gameName} · ${clock}`, ...details].join('\n'),
        tag,
      };
    }

    case 'OWN_GOAL':
      return {
        title: `Own goal — ${context.teamName}`,
        body: [
          `${context.gameName} · ${clock}`,
          playerName ? `Player: ${playerName}` : null,
          score,
        ]
          .filter(Boolean)
          .join('\n'),
        tag,
      };

    case 'SUBSTITUTION_IN':
      return {
        title: `Substitution — ${context.teamName}`,
        body: [
          `${playerName ?? 'Player'} on`,
          `${context.gameName} · ${clock}`,
        ].join('\n'),
        tag,
      };

    case 'SUBSTITUTION_OUT':
      return {
        title: `Substitution — ${context.teamName}`,
        body: [
          `${playerName ?? 'Player'} off`,
          `${context.gameName} · ${clock}`,
        ].join('\n'),
        tag,
      };

    case 'PERIOD_START':
      return {
        title: `${context.gameName} resumed`,
        body: `${context.teamName} · ${clock}`,
        tag,
      };

    case 'PERIOD_END':
      return {
        title: `${context.gameName} period ended`,
        body: `${context.teamName} · ${clock}`,
        tag,
      };

    case 'FORMATION_CHANGE':
      return {
        title: `Formation change — ${context.teamName}`,
        body: [event.formation, `${context.gameName} · ${clock}`]
          .filter(Boolean)
          .join('\n'),
        tag,
      };

    case 'POSITION_CHANGE':
      return {
        title: `Position change — ${context.teamName}`,
        body: [
          playerName
            ? `${playerName}${event.position ? ` → ${event.position}` : ''}`
            : null,
          `${context.gameName} · ${clock}`,
        ]
          .filter(Boolean)
          .join('\n'),
        tag,
      };

    case 'YELLOW_CARD':
    case 'RED_CARD':
      return {
        title: `${eventType.replace('_', ' ')} — ${context.teamName}`,
        body: [playerName, `${context.gameName} · ${clock}`]
          .filter(Boolean)
          .join('\n'),
        tag,
      };

    default:
      return null;
  }
}

export async function notifyGameEvent(
  event: GameEventNotificationEvent,
  context: GameEventNotificationContext,
) {
  if (!areGameEventNotificationsEnabled()) return false;
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const notification = buildGameEventNotification(event, context);
  if (!notification) return false;

  const options: NotificationOptions = {
    body: notification.body,
    tag: notification.tag,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notification.title, options);
      return true;
    }

    new Notification(notification.title, options);
    return true;
  } catch (error) {
    console.error('Failed to show game event notification:', error);
    return false;
  }
}
