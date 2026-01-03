import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ModalPortal } from './modal-portal';

const meta: Meta<typeof ModalPortal> = {
  component: ModalPortal,
  title: 'Components/ModalPortal',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ModalPortal>;

// Interactive wrapper to demonstrate modal behavior
const ModalDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Open Modal
      </button>
      <ModalPortal isOpen={isOpen} onBackdropClick={() => setIsOpen(false)}>
        <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold">Modal Title</h2>
          <p className="mb-4 text-gray-600">
            This is a modal rendered via a portal to document.body. Click
            outside or the button below to close.
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </ModalPortal>
    </div>
  );
};

export const Default: Story = {
  render: () => <ModalDemo />,
};

export const AlwaysOpen: Story = {
  args: {
    isOpen: true,
    children: (
      <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Static Modal</h2>
        <p className="text-gray-600">
          This modal is always open for demonstration purposes.
        </p>
      </div>
    ),
  },
};
