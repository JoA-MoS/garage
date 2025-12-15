interface ColorPickerFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  defaultColor?: string;
}

/**
 * A reusable color picker field component that provides both
 * a native color picker and a text input for hex values.
 */
export const ColorPickerField = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  defaultColor = '#3b82f6',
}: ColorPickerFieldProps) => {
  const currentValue = value || defaultColor;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs text-gray-500">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          id={id}
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-gray-300"
          disabled={disabled}
        />
        <input
          type="text"
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 font-mono text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder={defaultColor}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

interface TeamColorsPickerProps {
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
