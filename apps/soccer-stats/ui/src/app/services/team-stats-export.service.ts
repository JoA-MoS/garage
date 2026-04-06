import type { TeamStatsResponseData } from './team-stats-graphql.service';
import { ExportService } from './export.service';

function escapeCsv(value: string | number | null | undefined): string {
  const stringValue = String(value ?? '');
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

function sanitizeFilenamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDateForFilename(date: string): string {
  return new Date(date).toISOString().slice(0, 10);
}

function buildDateRangeLabel(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) {
    return 'All Time';
  }

  return `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
}

function buildTeamStatsCsv(
  data: TeamStatsResponseData,
  startDate?: string,
  endDate?: string,
): string {
  const { aggregateStats, playerStats, gameBreakdown } = data;

  const lines: string[] = [];

  lines.push('Team Summary');
  lines.push(['Metric', 'Value'].map(escapeCsv).join(','));

  const summaryRows: Array<[string, string | number]> = [
    ['Team Name', data.teamName],
    ['Date Range', buildDateRangeLabel(startDate, endDate)],
    ['Games Played', aggregateStats.gamesPlayed],
    ['Wins', aggregateStats.wins],
    ['Draws', aggregateStats.draws],
    ['Losses', aggregateStats.losses],
    ['Win Rate (%)', aggregateStats.winRate],
    ['Goals For', aggregateStats.goalsFor],
    ['Goals Against', aggregateStats.goalsAgainst],
    ['Goal Difference', aggregateStats.goalDifference],
    ['Total Assists', aggregateStats.totalAssists],
    ['Top Scoring Squad', aggregateStats.topScoringSquad ?? ''],
    ['Top Defensive Squad', aggregateStats.topDefensiveSquad ?? ''],
  ];

  summaryRows.forEach(([metric, value]) => {
    lines.push([metric, value].map(escapeCsv).join(','));
  });

  lines.push('');
  lines.push('Player Stats');
  lines.push(
    [
      'Player Name',
      'External Player Name',
      'External Player Number',
      'Goals',
      'Unassisted Goals',
      'Assists',
      'Own Goals',
      'Games Played',
      'Total Minutes',
      'Total Seconds',
    ]
      .map(escapeCsv)
      .join(','),
  );

  playerStats.forEach((player) => {
    lines.push(
      [
        player.playerName ?? '',
        player.externalPlayerName ?? '',
        player.externalPlayerNumber ?? '',
        player.goals,
        player.unassistedGoals,
        player.assists,
        player.ownGoals,
        player.gamesPlayed,
        player.totalMinutes,
        player.totalSeconds,
      ]
        .map(escapeCsv)
        .join(','),
    );
  });

  lines.push('');
  lines.push('Game Breakdown');
  lines.push(
    [
      'Game Date',
      'Opponent',
      'Result',
      'Score',
      'Total Goals',
      'Total Assists',
      'Game Status',
      'Game Name',
    ]
      .map(escapeCsv)
      .join(','),
  );

  gameBreakdown.forEach((game) => {
    const score =
      game.teamScore !== null &&
      game.teamScore !== undefined &&
      game.opponentScore !== null &&
      game.opponentScore !== undefined
        ? `${game.teamScore}-${game.opponentScore}`
        : '';

    lines.push(
      [
        game.gameDate ? new Date(game.gameDate).toLocaleDateString() : '',
        game.opponentName ?? '',
        game.result,
        score,
        game.totalGoals,
        game.totalAssists,
        game.gameStatus,
        game.gameName ?? '',
      ]
        .map(escapeCsv)
        .join(','),
    );
  });

  return lines.join('\n');
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildTable(
  title: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const headerHtml = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const rowsHtml = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
    )
    .join('');

  return `
    <h2>${escapeHtml(title)}</h2>
    <table>
      <thead>
        <tr>${headerHtml}</tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

function buildTeamStatsExcelHtml(
  data: TeamStatsResponseData,
  startDate?: string,
  endDate?: string,
): string {
  const { aggregateStats, playerStats, gameBreakdown } = data;

  const summaryTable = buildTable(
    'Team Summary',
    ['Metric', 'Value'],
    [
      ['Team Name', data.teamName],
      ['Date Range', buildDateRangeLabel(startDate, endDate)],
      ['Games Played', aggregateStats.gamesPlayed],
      ['Wins', aggregateStats.wins],
      ['Draws', aggregateStats.draws],
      ['Losses', aggregateStats.losses],
      ['Win Rate (%)', aggregateStats.winRate],
      ['Goals For', aggregateStats.goalsFor],
      ['Goals Against', aggregateStats.goalsAgainst],
      ['Goal Difference', aggregateStats.goalDifference],
      ['Total Assists', aggregateStats.totalAssists],
      ['Top Scoring Squad', aggregateStats.topScoringSquad ?? ''],
      ['Top Defensive Squad', aggregateStats.topDefensiveSquad ?? ''],
    ],
  );

  const playerTable = buildTable(
    'Player Stats',
    [
      'Player Name',
      'External Player Name',
      'External Player Number',
      'Goals',
      'Unassisted Goals',
      'Assists',
      'Own Goals',
      'Games Played',
      'Total Minutes',
      'Total Seconds',
    ],
    playerStats.map((player) => [
      player.playerName ?? '',
      player.externalPlayerName ?? '',
      player.externalPlayerNumber ?? '',
      player.goals,
      player.unassistedGoals,
      player.assists,
      player.ownGoals,
      player.gamesPlayed,
      player.totalMinutes,
      player.totalSeconds,
    ]),
  );

  const gameTable = buildTable(
    'Game Breakdown',
    [
      'Game Date',
      'Opponent',
      'Result',
      'Score',
      'Total Goals',
      'Total Assists',
      'Game Status',
      'Game Name',
    ],
    gameBreakdown.map((game) => {
      const score =
        game.teamScore !== null &&
        game.teamScore !== undefined &&
        game.opponentScore !== null &&
        game.opponentScore !== undefined
          ? `${game.teamScore}-${game.opponentScore}`
          : '';

      return [
        game.gameDate ? new Date(game.gameDate).toLocaleDateString() : '',
        game.opponentName ?? '',
        game.result,
        score,
        game.totalGoals,
        game.totalAssists,
        game.gameStatus,
        game.gameName ?? '',
      ];
    }),
  );

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; margin: 16px; }
      h1 { margin-bottom: 4px; }
      h2 { margin: 20px 0 8px; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(data.teamName)} Stats Export</h1>
    <p>${escapeHtml(buildDateRangeLabel(startDate, endDate))}</p>
    ${summaryTable}
    ${playerTable}
    ${gameTable}
  </body>
</html>
`;
}

export class TeamStatsExportService {
  static downloadTeamStatsCsv(
    data: TeamStatsResponseData,
    startDate?: string,
    endDate?: string,
  ): void {
    const csv = buildTeamStatsCsv(data, startDate, endDate);
    const dateSuffix =
      startDate && endDate ? `-${formatDateForFilename(endDate)}` : '';
    const filename = `team-stats-${sanitizeFilenamePart(data.teamName)}${dateSuffix}.csv`;

    ExportService.downloadTextFile(
      `\uFEFF${csv}`,
      filename,
      'text/csv;charset=utf-8',
    );
  }

  static downloadTeamStatsExcel(
    data: TeamStatsResponseData,
    startDate?: string,
    endDate?: string,
  ): void {
    const html = buildTeamStatsExcelHtml(data, startDate, endDate);
    const dateSuffix =
      startDate && endDate ? `-${formatDateForFilename(endDate)}` : '';
    const filename = `team-stats-${sanitizeFilenamePart(data.teamName)}${dateSuffix}.xls`;

    ExportService.downloadTextFile(
      html,
      filename,
      'application/vnd.ms-excel;charset=utf-8',
    );
  }
}
