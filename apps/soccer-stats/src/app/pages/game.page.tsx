import { Outlet } from 'react-router-dom';

/**
 * Game page wrapper - contains game-specific routing
 */
export const GamePage = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <Outlet />
    </div>
  );
};
