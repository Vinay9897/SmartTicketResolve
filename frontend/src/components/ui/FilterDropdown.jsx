import { SelectInput } from "./FormField.jsx";

export default function FilterDropdown({
  id,
  label,
  value,
  onChange,
  options,
  className = "",
  disabled = false,
}) {
  return (
    <SelectInput
      className={className}
      id={id}
      label={label}
      onChange={onChange}
      value={value}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </SelectInput>
  );
}
