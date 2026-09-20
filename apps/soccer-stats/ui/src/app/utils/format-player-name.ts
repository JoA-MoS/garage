import {
  JerseyNumberPosition,
  PlayerNameDisplayFormat,
} from '@garage/soccer-stats/graphql-codegen';

export type { JerseyNumberPosition, PlayerNameDisplayFormat };

type NameParts = {
  firstName?: string | null;
  lastName?: string | null;
};

const clean = (value?: string | null) => value?.trim() || '';

/**
 * Formats a player's name per the team's configured display format.
 * Degrades gracefully when lastName is unavailable (e.g. a privacy-restricted
 * minor) instead of ever rendering a partial/undefined last name — so a
 * team's format choice can never leak a redacted last name.
 */
export function formatPlayerName(
  { firstName, lastName }: NameParts,
  format: PlayerNameDisplayFormat,
): string {
  const first = clean(firstName);
  const last = clean(lastName);

  if (!first && !last) return '';

  const firstInitial = first ? `${first[0]}.` : '';
  const lastInitial = last ? `${last[0]}.` : '';

  switch (format) {
    case PlayerNameDisplayFormat.FirstName:
      return first || last;
    case PlayerNameDisplayFormat.LastName:
      return last || first;
    case PlayerNameDisplayFormat.FirstLast:
      return [first, last].filter(Boolean).join(' ');
    case PlayerNameDisplayFormat.LastCommaFirst:
      return last && first ? `${last}, ${first}` : first || last;
    case PlayerNameDisplayFormat.FirstLastinitial:
      return [first, lastInitial].filter(Boolean).join(' ');
    case PlayerNameDisplayFormat.FirstinitialLastinitial:
      return last ? `${firstInitial}${lastInitial}` : firstInitial;
    case PlayerNameDisplayFormat.FirstinitialLast:
      return [firstInitial, last].filter(Boolean).join(' ');
  }
}

/** Every format option with a human label and a sample rendering, for settings UI pickers. */
export const PLAYER_NAME_DISPLAY_FORMAT_OPTIONS: Array<{
  value: PlayerNameDisplayFormat;
  label: string;
  sample: string;
}> = (
  [
    [PlayerNameDisplayFormat.FirstLast, 'First Last'],
    [PlayerNameDisplayFormat.LastCommaFirst, 'Last, First'],
    [PlayerNameDisplayFormat.FirstName, 'First name only'],
    [PlayerNameDisplayFormat.LastName, 'Last name only'],
    [PlayerNameDisplayFormat.FirstLastinitial, 'First, last initial'],
    [PlayerNameDisplayFormat.FirstinitialLast, 'First initial, last'],
    [PlayerNameDisplayFormat.FirstinitialLastinitial, 'Initials only'],
  ] as const
).map(([value, label]) => ({
  value,
  label,
  sample: formatPlayerName({ firstName: 'Sarah', lastName: 'Smith' }, value),
}));

export function formatJerseyDisplay(
  name: string,
  jerseyNumber: string | null | undefined,
  {
    showJerseyNumber,
    jerseyNumberPosition,
  }: { showJerseyNumber: boolean; jerseyNumberPosition: JerseyNumberPosition },
): string {
  if (!showJerseyNumber || !jerseyNumber) return name;

  return jerseyNumberPosition === JerseyNumberPosition.Before
    ? `#${jerseyNumber} ${name}`
    : `${name} #${jerseyNumber}`;
}
