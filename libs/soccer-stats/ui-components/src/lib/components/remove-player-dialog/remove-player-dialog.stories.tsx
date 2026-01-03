import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { RemovePlayerDialog } from './remove-player-dialog';

const meta: Meta<typeof RemovePlayerDialog> = {
  component: RemovePlayerDialog,
  title: 'Components/RemovePlayerDialog',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof RemovePlayerDialog>;

export const Default: Story = {
  args: {
    playerName: 'John Smith',
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    playerName: 'Jane Doe',
    loading: true,
  },
};

export const LongName: Story = {
  args: {
    playerName: 'Alexander Montgomery Richardson III',
    loading: false,
  },
};

// Interactive demo
const InteractiveDemo = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setShowDialog(false);
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <button
        onClick={() => setShowDialog(true)}
        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Remove Player
      </button>
      {showDialog && (
        <RemovePlayerDialog
          playerName="Marcus Johnson"
          onClose={() => setShowDialog(false)}
          onConfirm={handleConfirm}
          loading={loading}
        />
      )}
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
