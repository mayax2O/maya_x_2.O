"use client";

export interface ChipOption {
  value: string;
  label: string;
}

export function ChipMultiSelect({
  id,
  options,
  selected,
  onAdd,
  onRemove,
  placeholder = "Select...",
  emptyMessage = "No options available",
}: {
  id: string;
  options: ChipOption[];
  selected: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
}) {
  const labelByValue = new Map(
    options.map((option) => [option.value, option.label]),
  );
  const available = options.filter(
    (option) => !selected.includes(option.value),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {selected.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1.5 rounded-full border border-brass bg-brass-deep/20 px-3 py-1 text-[12.5px] text-brass"
          >
            {labelByValue.get(value) ?? value}
            <button
              type="button"
              onClick={() => onRemove(value)}
              aria-label={`Remove ${labelByValue.get(value) ?? value}`}
              className="text-brass/70 hover:text-brass"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <select
        id={id}
        value=""
        onChange={(event) => event.target.value && onAdd(event.target.value)}
        disabled={options.length === 0}
        className="w-full rounded-md border border-white/15 bg-ink px-3 py-2.5 text-[14px] text-porcelain focus:border-brass focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled>
          {options.length === 0 ? emptyMessage : placeholder}
        </option>
        {available.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
