import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ColorPickerField } from './color-picker-field';
import { TeamColorsPicker } from './team-colors-picker';

// Noop function for disabled stories
const noop = () => {
  /* intentionally empty */
};

// ColorPickerField Stories
const colorPickerMeta: Meta<typeof ColorPickerField> = {
  component: ColorPickerField,
  title: 'Components/ColorPickerField',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default colorPickerMeta;
type ColorPickerStory = StoryObj<typeof ColorPickerField>;

export const Default: ColorPickerStory = {
  args: {
    id: 'primary-color',
    label: 'Primary Color',
    value: '#3b82f6',
  },
};

export const CustomDefault: ColorPickerStory = {
  args: {
    id: 'custom-color',
    label: 'Team Color',
    value: '#dc2626',
    defaultColor: '#dc2626',
  },
};

export const Disabled: ColorPickerStory = {
  args: {
    id: 'disabled-color',
    label: 'Disabled Color',
    value: '#9ca3af',
    disabled: true,
  },
};

// Interactive wrapper
const InteractiveColorPicker = () => {
  const [color, setColor] = useState('#3b82f6');

  return (
    <div className="w-64">
      <ColorPickerField
        id="interactive-color"
        label="Pick a Color"
        value={color}
        onChange={setColor}
      />
      <div className="mt-4 text-sm text-gray-600">
        Selected: <code className="font-mono">{color}</code>
      </div>
    </div>
  );
};

export const Interactive: ColorPickerStory = {
  render: () => <InteractiveColorPicker />,
};

// TeamColorsPicker Stories
const InteractiveTeamColorsPicker = () => {
  const [colors, setColors] = useState({
    homePrimary: '#3b82f6',
    homeSecondary: '#ffffff',
    awayPrimary: '#ffffff',
    awaySecondary: '#3b82f6',
  });

  return (
    <div className="w-96 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Team Colors</h3>
      <TeamColorsPicker
        homePrimaryColor={colors.homePrimary}
        homeSecondaryColor={colors.homeSecondary}
        awayPrimaryColor={colors.awayPrimary}
        awaySecondaryColor={colors.awaySecondary}
        onHomePrimaryChange={(v) =>
          setColors((c) => ({ ...c, homePrimary: v }))
        }
        onHomeSecondaryChange={(v) =>
          setColors((c) => ({ ...c, homeSecondary: v }))
        }
        onAwayPrimaryChange={(v) =>
          setColors((c) => ({ ...c, awayPrimary: v }))
        }
        onAwaySecondaryChange={(v) =>
          setColors((c) => ({ ...c, awaySecondary: v }))
        }
      />
    </div>
  );
};

export const TeamColors: StoryObj<typeof TeamColorsPicker> = {
  render: () => <InteractiveTeamColorsPicker />,
};

export const TeamColorsDisabled: StoryObj<typeof TeamColorsPicker> = {
  render: () => (
    <div className="w-96 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Team Colors (Disabled)</h3>
      <TeamColorsPicker
        homePrimaryColor="#a50044"
        homeSecondaryColor="#004d98"
        awayPrimaryColor="#ededed"
        awaySecondaryColor="#a50044"
        onHomePrimaryChange={noop}
        onHomeSecondaryChange={noop}
        onAwayPrimaryChange={noop}
        onAwaySecondaryChange={noop}
        disabled
      />
    </div>
  ),
};
