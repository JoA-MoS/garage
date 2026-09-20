export type PlayerNameDisplayFormat =
  | 'FIRST_NAME'
  | 'LAST_NAME'
  | 'FIRST_LAST'
  | 'LAST_COMMA_FIRST'
  | 'FIRST_LASTINITIAL'
  | 'FIRSTINITIAL_LASTINITIAL'
  | 'FIRSTINITIAL_LAST';

export type JerseyNumberPosition = 'BEFORE' | 'AFTER';

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
    case 'FIRST_NAME':
      return first || last;
    case 'LAST_NAME':
      return last || first;
    case 'FIRST_LAST':
      return [first, last].filter(Boolean).join(' ');
    case 'LAST_COMMA_FIRST':
      return last && first ? `${last}, ${first}` : first || last;
    case 'FIRST_LASTINITIAL':
      return last ? `${first} ${lastInitial}` : first;
    case 'FIRSTINITIAL_LASTINITIAL':
      return last ? `${firstInitial}${lastInitial}` : firstInitial;
    case 'FIRSTINITIAL_LAST':
      return last ? `${firstInitial} ${last}` : firstInitial;
  }
}

/** Every format option with a human label and a sample rendering, for settings UI pickers. */
export const PLAYER_NAME_DISPLAY_FORMAT_OPTIONS: Array<{
  value: PlayerNameDisplayFormat;
  label: string;
  sample: string;
}> = (
  [
    ['FIRST_LAST', 'First Last'],
    ['LAST_COMMA_FIRST', 'Last, First'],
    ['FIRST_NAME', 'First name only'],
    ['LAST_NAME', 'Last name only'],
    ['FIRST_LASTINITIAL', 'First, last initial'],
    ['FIRSTINITIAL_LAST', 'First initial, last'],
    ['FIRSTINITIAL_LASTINITIAL', 'Initials only'],
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

  return jerseyNumberPosition === 'BEFORE'
    ? `#${jerseyNumber} ${name}`
    : `${name} #${jerseyNumber}`;
}
