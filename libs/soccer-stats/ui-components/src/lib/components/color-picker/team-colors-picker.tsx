import { ColorPickerField } from './color-picker-field';

export interface TeamColorsPickerProps {
  homePrimaryColor?: string;
  homeSecondaryColor?: string;
  awayPrimaryColor?: string;
  awaySecondaryColor?: string;
  onHomePrimaryChange: (value: string) => void;
  onHomeSecondaryChange: (value: string) => void;
  onAwayPrimaryChange: (value: string) => void;
  onAwaySecondaryChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * A complete team colors picker component with home and away kit colors.
 */
export const TeamColorsPicker = ({
  homePrimaryColor,
  homeSecondaryColor,
  awayPrimaryColor,
  awaySecondaryColor,
  onHomePrimaryChange,
  onHomeSecondaryChange,
  onAwayPrimaryChange,
  onAwaySecondaryChange,
  disabled = false,
}: TeamColorsPickerProps) => {
  return (
    <div className="space-y-4">
      {/* Home Kit Colors */}
      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">
          Home Kit Colors
        </span>
        <div className="grid grid-cols-2 gap-4">
          <ColorPickerField
            id="homePrimaryColor"
            label="Primary"
            value={homePrimaryColor || '#3b82f6'}
            onChange={onHomePrimaryChange}
            disabled={disabled}
            defaultColor="#3b82f6"
          />
          <ColorPickerField
            id="homeSecondaryColor"
            label="Secondary"
            value={homeSecondaryColor || '#ffffff'}
            onChange={onHomeSecondaryChange}
            disabled={disabled}
            defaultColor="#ffffff"
          />
        </div>
        {/* Home Kit Preview */}
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-xs text-gray-500">Preview:</span>
          <div
            className="h-6 w-6 rounded-full border border-gray-300"
            style={{ backgroundColor: homePrimaryColor || '#3b82f6' }}
          />
          <div
            className="h-6 w-6 rounded-full border border-gray-300"
            style={{ backgroundColor: homeSecondaryColor || '#ffffff' }}
          />
        </div>
      </div>

      {/* Away Kit Colors */}
      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">
          Away Kit Colors
        </span>
        <div className="grid grid-cols-2 gap-4">
          <ColorPickerField
            id="awayPrimaryColor"
            label="Primary"
            value={awayPrimaryColor || '#ffffff'}
            onChange={onAwayPrimaryChange}
            disabled={disabled}
            defaultColor="#ffffff"
          />
          <ColorPickerField
            id="awaySecondaryColor"
            label="Secondary"
            value={awaySecondaryColor || '#3b82f6'}
            onChange={onAwaySecondaryChange}
            disabled={disabled}
            defaultColor="#3b82f6"
          />
        </div>
        {/* Away Kit Preview */}
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-xs text-gray-500">Preview:</span>
          <div
            className="h-6 w-6 rounded-full border border-gray-300"
            style={{ backgroundColor: awayPrimaryColor || '#ffffff' }}
          />
          <div
            className="h-6 w-6 rounded-full border border-gray-300"
            style={{ backgroundColor: awaySecondaryColor || '#3b82f6' }}
          />
        </div>
      </div>
    </div>
  );
};
