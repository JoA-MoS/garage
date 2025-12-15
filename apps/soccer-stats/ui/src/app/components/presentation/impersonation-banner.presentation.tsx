/**
 * Impersonation banner that displays when an admin is impersonating another user.
 * Uses Clerk's actor information to show impersonation status.
 * @see https://clerk.com/docs/guides/users/impersonation
 */

export interface ImpersonationBannerProps {
  /** The impersonated user's name */
  userName: string;
  /** Callback to exit impersonation session */
  onExitImpersonation: () => void;
}

export const ImpersonationBannerPresentation = ({
  userName,
  onExitImpersonation,
}: ImpersonationBannerProps) => {
  return (
    <div className="bg-amber-500 text-amber-950">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="text-sm font-medium">
              Viewing as <span className="font-bold">{userName}</span>
            </span>
          </div>
          <button
            onClick={onExitImpersonation}
            className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-amber-500"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};
