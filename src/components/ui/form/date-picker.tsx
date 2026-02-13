import { useEffect } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../../icons";

type DatePickerProps = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  defaultDate?: Date | null;
  label?: React.ReactNode;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
};

export default function DatePicker({
  id,
  mode = "single",
  value,
  onChange,
  label,
  placeholder,
}: DatePickerProps) {
  useEffect(() => {
    const fp = flatpickr(`#${id}`, {
      mode,
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: value ?? undefined,
      onChange: (selectedDates) => {
        onChange?.(selectedDates[0] ?? null);
      },
    });

    return () => {
      if (Array.isArray(fp)) {
        fp.forEach((instance) => instance.destroy());
      } else {
        fp.destroy();
      }
    };
  }, [id, mode, value, onChange]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          readOnly
          className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm
            bg-transparent text-gray-800 border-gray-300
            focus:border-brand-300 focus:ring-brand-500/20
            dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <CalenderIcon className="size-6 text-gray-500" />
        </span>
      </div>
    </div>
  );
}
