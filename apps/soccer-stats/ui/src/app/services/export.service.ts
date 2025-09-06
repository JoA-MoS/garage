import { formatTime } from '../utils';

import { GameResult, SeasonStats } from './game-history.service';

export class ExportService {
  /**
   * Generate a printable game report
   */
  static generateGameReport(game: GameResult): string {
    const gameDate = new Date(game.date).toLocaleDateString();
    const gameDuration = formatTime(game.duration);

    let report = `GAME REPORT\n`;
    report += `===========\n\n`;
    report += `Date: ${gameDate}\n`;
    report += `Duration: ${gameDuration}\n`;
    report += `${game.homeTeam.name} vs ${game.awayTeam.name}\n`;
    report += `Final Score: ${game.homeTeam.score} - ${game.awayTeam.score}\n\n`;

    // Home Team Section
    report += `${game.homeTeam.name.toUpperCase()}\n`;
    report += `${'='.repeat(game.homeTeam.name.length)}\n`;
    report += this.generateTeamReport(game.homeTeam);
    report += `\n`;

    // Away Team Section
    report += `${game.awayTeam.name.toUpperCase()}\n`;
    report += `${'='.repeat(game.awayTeam.name.length)}\n`;
    report += this.generateTeamReport(game.awayTeam);
    report += `\n`;

    // Goals Summary
    if (game.goals.length > 0) {
      report += `GOALS\n`;
      report += `=====\n`;

      const allGoals = game.goals.sort((a, b) => a.timestamp - b.timestamp);

      allGoals.forEach((goal) => {
        const time = formatTime(goal.timestamp);

        report += `${time} - ${goal.scorerName} (${
          goal.team === 'home' ? game.homeTeam.name : game.awayTeam.name
        })`;
        if (goal.assistName) {
          report += ` - Assist: ${goal.assistName}`;
        }
        report += `\n`;
      });
    }

    return report;
  }

  /**
   * Generate season statistics report
   */
  static generateSeasonReport(playerStats: SeasonStats[]): string {
    let report = `SEASON STATISTICS\n`;
    report += `================\n\n`;
    report += `Total Players: ${playerStats.length}\n`;
    report += `Total Games Played: ${Math.max(
      ...playerStats.map((p) => p.gamesPlayed),
      0
    )}\n\n`;

    // Top Scorers
    const topScorers = [...playerStats]
      .filter((p) => p.totalGoals > 0)
      .sort((a, b) => b.totalGoals - a.totalGoals)
      .slice(0, 5);

    if (topScorers.length > 0) {
      report += `TOP SCORERS\n`;
      report += `-----------\n`;
      topScorers.forEach((player, index) => {
        report += `${index + 1}. ${player.name} - ${player.totalGoals} goals\n`;
      });
      report += `\n`;
    }

    // Top Assisters
    const topAssisters = [...playerStats]
      .filter((p) => p.totalAssists > 0)
      .sort((a, b) => b.totalAssists - a.totalAssists)
      .slice(0, 5);

    if (topAssisters.length > 0) {
      report += `TOP ASSISTERS\n`;
      report += `-------------\n`;
      topAssisters.forEach((player, index) => {
        report += `${index + 1}. ${player.name} - ${
          player.totalAssists
        } assists\n`;
      });
      report += `\n`;
    }

    // Playing Time Leaders
    const playingTimeLeaders = [...playerStats]
      .sort((a, b) => b.totalPlayTime - a.totalPlayTime)
      .slice(0, 5);

    report += `PLAYING TIME LEADERS\n`;
    report += `-------------------\n`;
    playingTimeLeaders.forEach((player, index) => {
      const avgPlayTime =
        player.gamesPlayed > 0 ? player.totalPlayTime / player.gamesPlayed : 0;
      report += `${index + 1}. ${player.name} - ${formatTime(
        player.totalPlayTime
      )} total (${formatTime(avgPlayTime)} avg)\n`;
    });
    report += `\n`;

    // Full Player Statistics
    report += `COMPLETE PLAYER STATISTICS\n`;
    report += `=========================\n`;
    report += `Player Name                | Games | Goals | Assists | Play Time | Avg Time\n`;
    report += `---------------------------|-------|-------|---------|-----------|----------\n`;

    playerStats
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((player) => {
        const avgPlayTime =
          player.gamesPlayed > 0
            ? player.totalPlayTime / player.gamesPlayed
            : 0;
        const name = player.name.padEnd(26);
        const games = player.gamesPlayed.toString().padStart(5);
        const goals = player.totalGoals.toString().padStart(5);
        const assists = player.totalAssists.toString().padStart(7);
        const playTime = formatTime(player.totalPlayTime).padStart(9);
        const avgTime = formatTime(avgPlayTime).padStart(8);

        report += `${name} | ${games} | ${goals} | ${assists} | ${playTime} | ${avgTime}\n`;
      });

    return report;
  }

  /**
   * Download text file with content
   */
  static downloadTextFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generate CSV data for spreadsheet import
   */
  static generateGameCSV(game: GameResult): string {
    let csv = 'Player Name,Jersey,Position,Team,Play Time,Goals,Assists\n';

    // Add home team players
    game.homeTeam.players.forEach((player) => {
      csv += `"${player.name}",${player.jersey},"${player.position}","${
        game.homeTeam.name
      }",${formatTime(player.playTime)},${player.goals},${player.assists}\n`;
    });

    // Add away team players
    game.awayTeam.players.forEach((player) => {
      csv += `"${player.name}",${player.jersey},"${player.position}","${
        game.awayTeam.name
      }",${formatTime(player.playTime)},${player.goals},${player.assists}\n`;
    });

    return csv;
  }

  /**
   * Generate season CSV data
   */
  static generateSeasonCSV(playerStats: SeasonStats[]): string {
    let csv =
      'Player Name,Games Played,Total Goals,Total Assists,Total Play Time,Average Play Time\n';

    playerStats.forEach((player) => {
      const avgPlayTime =
        player.gamesPlayed > 0 ? player.totalPlayTime / player.gamesPlayed : 0;
      csv += `"${player.name}",${player.gamesPlayed},${player.totalGoals},${
        player.totalAssists
      },${formatTime(player.totalPlayTime)},${formatTime(avgPlayTime)}\n`;
    });

    return csv;
  }

  /**
   * Helper method to generate team report section
   */
  private static generateTeamReport(team: GameResult['homeTeam']): string {
    let report = '';

    // Team stats
    const totalGoals = team.score;
    const totalPlayTime = team.players.reduce(
      (sum: number, p) => sum + p.playTime,
      0
    );
    const avgPlayTime =
      team.players.length > 0 ? totalPlayTime / team.players.length : 0;

    report += `Goals: ${totalGoals}\n`;
    report += `Average Play Time: ${formatTime(avgPlayTime)}\n\n`;

    // Player statistics
    report += `PLAYER STATISTICS\n`;
    report += `Name                | #  | Position    | Play Time | Goals | Assists\n`;
    report += `--------------------|----|-----------  |-----------|-------|--------\n`;

    team.players.forEach((player) => {
      const name = player.name.substring(0, 19).padEnd(19);
      const jersey = player.jersey.toString().padStart(2);
      const position = player.position.substring(0, 11).padEnd(11);
      const playTime = formatTime(player.playTime).padStart(9);
      const goalStr = player.goals.toString().padStart(5);
      const assistStr = player.assists.toString().padStart(7);

      report += `${name} | ${jersey} | ${position} | ${playTime} | ${goalStr} | ${assistStr}\n`;
    });

    return report;
  }
}
