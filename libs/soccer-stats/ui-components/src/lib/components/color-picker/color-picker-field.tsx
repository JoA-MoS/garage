export interface ColorPickerFieldProps {
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
