import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { GameStatus } from '@garage/soccer-stats/graphql-codegen';

import { GameClockControl } from './game-clock-control.presentation';
import { ScoreDisplay } from './score-display.presentation';
import { CompactGoalButtons } from './compact-goal-buttons.presentation';
import { formatGameTime } from './game-utils';

export interface StickyScoreBarProps {
  // Game status and timing
  status: GameStatus;
  elapsedSeconds: number;
  isPaused: boolean;
  durationMinutes: number;
  halfIndicator: string;

  // Game timestamps
  firstHalfEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  secondHalfStart?: string | null;

  // Team info
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  highlightedScore: 'home' | 'away' | null;

  // Game info
  venue?: string | null;
  scheduledStart?: string | null;

  // UI state
  isActivePlay: boolean;
  recordingGoal: boolean;
  updatingGame: boolean;
  showEndGameConfirm: boolean;

  // Callbacks
  onStartFirstHalf: () => void;
  onEndFirstHalf: () => void;
  onStartSecondHalf: () => void;
  onEndGame: () => void;
  onShowEndGameConfirm: (show: boolean) => void;
  onGoalClick: (team: 'home' | 'away') => void;
  onSubClick: (team: 'home' | 'away') => void;
}

/**
 * Sticky Score Bar - The main game score display that sticks to the top when scrolling.
 *
 * Uses a JS-based approach with Intersection Observer on a sentinel element:
 * 1. Sentinel div sits above the score bar - when it exits viewport, we're "stuck"
 * 2. When stuck: render a fixed compact header + spacer to prevent content jump
 * 3. When not stuck: render the normal expanded view
 *
 * This avoids the oscillation issue that occurs with CSS container queries,
 * because the fixed header is completely removed from document flow.
 */
export function StickyScoreBar({
  status,
  elapsedSeconds,
  isPaused,
  durationMinutes,
  halfIndicator,
  firstHalfEnd,
  actualStart,
  actualEnd,
  secondHalfStart,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  highlightedScore,
  venue,
  scheduledStart,
  isActivePlay,
  recordingGoal,
  updatingGame,
  showEndGameConfirm,
  onStartFirstHalf,
  onEndFirstHalf,
  onStartSecondHalf,
  onEndGame,
  onShowEndGameConfirm,
  onGoalClick,
  onSubClick,
}: StickyScoreBarProps) {
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedHeight, setExpandedHeight] = useState(0);

  // Measure the expanded container height for the spacer
  useEffect(() => {
    if (containerRef.current && !isStuck) {
      setExpandedHeight(containerRef.current.offsetHeight);
    }
  }, [isStuck, venue, scheduledStart, status]);

  // Intersection Observer on the sentinel to detect when to switch to stuck mode
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not intersecting (scrolled out of view), we're stuck
        setIsStuck(!entry.isIntersecting);
      },
      {
        // Trigger when sentinel fully exits viewport
        threshold: 0,
        rootMargin: '0px',
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Compact fixed header (shown when stuck)
  const compactHeader = (
    <div className="fixed left-0 right-0 top-0 z-50 bg-white px-4 py-3 shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        {/* Home Team - Name above score */}
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <span className="truncate text-xs font-medium text-gray-900">
            {homeTeamName}
          </span>
          <span
            className={`text-2xl font-bold text-blue-600 ${
              highlightedScore === 'home' ? 'score-highlight' : ''
            }`}
          >
            {homeScore}
          </span>
        </div>

        {/* Center: Clock + Half Indicator */}
        <div className="flex flex-col items-center">
          <span className="font-mono text-lg font-bold text-gray-900">
            {formatGameTime(elapsedSeconds)}
          </span>
          {halfIndicator && (
            <span className="text-xs font-medium text-gray-500">
              {halfIndicator}
              {isPaused && ' (Paused)'}
            </span>
          )}
        </div>

        {/* Away Team - Name above score */}
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <span className="truncate text-xs font-medium text-gray-900">
            {awayTeamName}
          </span>
          <span
            className={`text-2xl font-bold text-red-600 ${
              highlightedScore === 'away' ? 'score-highlight' : ''
            }`}
          >
            {awayScore}
          </span>
        </div>
      </div>

      {/* Compact Goal Buttons */}
      {isActivePlay && (
        <div className="mx-auto mt-2 flex max-w-6xl gap-3 border-t border-gray-100 pt-2">
          <button
            onClick={() => onGoalClick('home')}
            disabled={recordingGoal}
            className="min-h-touch flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors active:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 lg:hover:bg-blue-100"
            type="button"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Goal
          </button>
          <button
            onClick={() => onGoalClick('away')}
            disabled={recordingGoal}
            className="min-h-touch flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors active:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 lg:hover:bg-red-100"
            type="button"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Goal
          </button>
        </div>
      )}
    </div>
  );

  // Expanded view (shown when not stuck)
  const expandedView = (
    <div
      ref={containerRef}
      className="-mt-6 rounded-lg bg-white p-6 shadow transition-all duration-300 ease-in-out"
    >
      {/* Game Clock and Controls */}
      <GameClockControl
        status={status}
        elapsedSeconds={elapsedSeconds}
        isPaused={isPaused}
        updatingGame={updatingGame}
        showEndGameConfirm={showEndGameConfirm}
        firstHalfEnd={firstHalfEnd}
        actualStart={actualStart}
        actualEnd={actualEnd}
        secondHalfStart={secondHalfStart}
        durationMinutes={durationMinutes}
        onStartFirstHalf={onStartFirstHalf}
        onEndFirstHalf={onEndFirstHalf}
        onStartSecondHalf={onStartSecondHalf}
        onEndGame={onEndGame}
        onShowEndGameConfirm={onShowEndGameConfirm}
      />

      {/* Score Display */}
      <ScoreDisplay
        homeTeam={{
          name: homeTeamName,
          score: homeScore,
          color: 'blue',
        }}
        awayTeam={{
          name: awayTeamName,
          score: awayScore,
          color: 'red',
        }}
        isActivePlay={isActivePlay}
        recordingGoal={recordingGoal}
        elapsedSeconds={elapsedSeconds}
        isPaused={isPaused}
        halfIndicator={halfIndicator}
        highlightedScore={highlightedScore}
        onGoalClick={onGoalClick}
        onSubClick={onSubClick}
      />

      {/* Compact Goal Buttons (hidden when not stuck) */}
      {isActivePlay && (
        <CompactGoalButtons
          recordingGoal={recordingGoal}
          onGoalClick={onGoalClick}
        />
      )}

      {/* Game Info */}
      {(venue || scheduledStart) && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {venue && (
              <div>
                <span className="text-gray-600">Venue:</span>{' '}
                <span className="font-medium text-gray-900">{venue}</span>
              </div>
            )}
            {scheduledStart && (
              <div>
                <span className="text-gray-600">Date:</span>{' '}
                <span className="font-medium text-gray-900">
                  {new Date(scheduledStart).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sentinel: invisible div that triggers stuck state when scrolled out of view */}
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />

      {/* When stuck: show fixed compact header via portal (escapes any containing blocks) + spacer */}
      {isStuck && (
        <>
          {createPortal(compactHeader, document.body)}
          {/* Spacer to prevent content jump when switching to fixed */}
          <div style={{ height: expandedHeight }} aria-hidden="true" />
        </>
      )}

      {/* Always render expanded view, but hide visually when stuck */}
      <div className={isStuck ? 'invisible' : ''}>{expandedView}</div>
    </>
  );
}
