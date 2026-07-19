// =============================================================================
// TYPES - Pure presentation types (no GraphQL dependencies)
// =============================================================================

interface GameFormData {
  opponentTeamId: string;
  gameFormatId: string;
  duration: number;
  isHome: boolean;
}

interface GameTeamInfo {
  id: string;
  teamType: string;
  finalScore?: number | null;
  team: {
    id: string;
    name: string;
    shortName?: string | null;
    homePrimaryColor?: string | null;
    homeSecondaryColor?: string | null;
  };
}

interface GameFormatInfo {
  id: string;
  name: string;
  playersPerTeam: number;
  durationMinutes: number;
}

interface GameInfo {
  id: string;
  name?: string | null;
  status: string;
  scheduledStart?: string | null;
  venue?: string | null;
  createdAt: string;
  format: GameFormatInfo;
  teams: readonly GameTeamInfo[];
  /** Which side the current team is on */
  currentTeamType: string;
  currentTeamScore?: number | null;
}

interface OpponentInfo {
  id: string;
  name: string;
  shortName?: string | null;
}

interface TeamGamesPresentationProps {
  teamId: string;
  games: GameInfo[];
  availableOpponents: OpponentInfo[];
  gameFormats: GameFormatInfo[];
  showCreateForm: boolean;
  gameForm: GameFormData;
  loading: boolean;
  createLoading: boolean;
  /** Error message to display in the form (validation, mutation, or data loading errors) */
  error?: string | null;
  onCreateGame: () => void;
  onCancelCreate: () => void;
  onFormChange: (field: string, value: string | number | boolean) => void;
  onSubmitGame: () => void;
  onViewGame: (gameId: string) => void;
}

function formatGameDate(value?: string | null) {
  if (!value) return 'Date not scheduled';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const TeamGamesPresentation = ({
  teamId,
  games,
  availableOpponents,
  gameFormats,
  showCreateForm,
  gameForm,
  loading,
  createLoading,
  error,
  onCreateGame,
  onCancelCreate,
  onFormChange,
  onSubmitGame,
  onViewGame,
}: TeamGamesPresentationProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-44 animate-pulse rounded-2xl bg-slate-200/80"
          />
        ))}
      </div>
    );
  }

  const formatOptions = gameFormats.map((format) => ({
    value: format.id,
    label: format.name,
  }));

  const getGameStatus = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return { text: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
      case 'IN_PROGRESS':
        return { text: 'Live', color: 'bg-green-100 text-green-800' };
      case 'PAUSED':
        return { text: 'Paused', color: 'bg-yellow-100 text-yellow-800' };
      case 'FINISHED':
        return { text: 'Finished', color: 'bg-slate-100 text-slate-800' };
      case 'CANCELLED':
        return { text: 'Cancelled', color: 'bg-red-100 text-red-800' };
      default:
        return { text: status, color: 'bg-slate-100 text-slate-800' };
    }
  };

  const getOpponentTeam = (game: GameInfo) => {
    return game.teams.find((gt) => gt.team.id !== teamId)?.team;
  };

  const isHomeTeam = (game: GameInfo) => {
    return game.currentTeamType === 'home';
  };

  const scheduledGames = games.filter(
    (game) => game.status === 'NOT_STARTED',
  ).length;
  const completedGames = games.filter(
    (game) => game.status === 'FINISHED',
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Games</h2>
            <p className="mt-1 text-sm text-slate-500">
              Schedule matches, then jump straight into tracking when it is
              time.
            </p>
          </div>
          <button
            onClick={onCreateGame}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span aria-hidden="true">⚽</span>
            <span>Create Game</span>
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-2xl font-black text-slate-950">
              {games.length}
            </div>
            <div className="text-sm text-slate-500">total games</div>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="text-2xl font-black text-blue-900">
              {scheduledGames}
            </div>
            <div className="text-sm text-blue-700">scheduled</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="text-2xl font-black text-emerald-900">
              {completedGames}
            </div>
            <div className="text-sm text-emerald-700">completed</div>
          </div>
        </div>
      </section>

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <h3 className="text-xl font-black text-slate-950">
                Create New Game
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Pick the opponent, venue, and format. You can fill in deeper
                details later.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Opponent Team
                </label>
                <select
                  value={gameForm.opponentTeamId}
                  onChange={(e) =>
                    onFormChange('opponentTeamId', e.target.value)
                  }
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select opponent...</option>
                  {availableOpponents.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset>
                <legend className="mb-2 block text-sm font-semibold text-slate-700">
                  Venue
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Home', value: true, icon: '🏠' },
                    { label: 'Away', value: false, icon: '✈️' },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => onFormChange('isHome', option.value)}
                      className={`min-h-[44px] rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        gameForm.isHome === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-100'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="mr-2" aria-hidden="true">
                        {option.icon}
                      </span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Game Format
                  </label>
                  <select
                    value={gameForm.gameFormatId}
                    onChange={(e) =>
                      onFormChange('gameFormatId', e.target.value)
                    }
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select format</option>
                    {formatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Duration
                  </label>
                  <input
                    type="number"
                    value={gameForm.duration}
                    onChange={(e) =>
                      onFormChange('duration', parseInt(e.target.value) || 90)
                    }
                    min="1"
                    max="120"
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                onClick={onCancelCreate}
                className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={onSubmitGame}
                disabled={
                  !gameForm.opponentTeamId ||
                  !gameForm.gameFormatId ||
                  createLoading
                }
                className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createLoading ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </div>
        </div>
      )}

      {games.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="text-5xl" aria-hidden="true">
            ⚽
          </div>
          <h3 className="mt-4 text-xl font-black text-slate-950">
            No games yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-slate-500">
            Create the first game to unlock lineup tracking, stats, and match
            history.
          </p>
          <button
            onClick={onCreateGame}
            className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Create first game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => {
            const opponent = getOpponentTeam(game);
            const isHome = isHomeTeam(game);
            const statusInfo = getGameStatus(game.status);

            return (
              <button
                key={game.id}
                type="button"
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => onViewGame(game.id)}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusInfo.color}`}
                  >
                    {statusInfo.text}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {game.format?.name || 'Unknown Format'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                    {isHome ? '🏠' : '✈️'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black text-slate-950">
                      {isHome ? 'vs' : 'at'}{' '}
                      {opponent?.name || 'Unknown opponent'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {formatGameDate(game.scheduledStart)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-slate-500">Score</div>
                    <div className="mt-1 font-black text-slate-950">
                      {game.currentTeamScore ?? '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-slate-500">Created</div>
                    <div className="mt-1 font-semibold text-slate-950">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 text-sm font-semibold text-blue-700 group-hover:text-blue-900">
                  {game.status === 'NOT_STARTED' ? 'Start Game' : 'View Game'} →
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
