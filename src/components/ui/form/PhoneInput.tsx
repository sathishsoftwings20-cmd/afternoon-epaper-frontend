// src/components/ui/form/PhoneInput.tsx
import React, { useEffect, useState } from "react";

interface CountryCode {
  code: string; // e.g. "IN"
  label: string; // e.g. "+91"
}

interface PhoneInputProps {
  countries?: CountryCode[]; // optional; defaults to India only
  placeholder?: string;
  onChange?: (phoneNumber: string) => void; // returns digits (no spaces) or full e.g. "+911234567890"
  selectPosition?: "start" | "end";
  defaultCountry?: string; // "IN"
  defaultNumber?: string; // initial digits (no plus)
}

const defaultCountries: CountryCode[] = [{ code: "IN", label: "+91" }];

const PhoneInput: React.FC<PhoneInputProps> = ({
  countries = defaultCountries,
  placeholder = "9123456789",
  onChange,
  selectPosition = "start",
  defaultCountry = "IN",
  defaultNumber = "",
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>(defaultCountry);
  // store digits only (no +)
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultNumber.replace(/\D/g, ""));

  useEffect(() => {
    // inform parent with normalized value: "+91XXXXXXXXXX" (if digits present)
    const countryLabel = (countries.find((c) => c.code === selectedCountry)?.label || "+91").replace(/\s+/g, "");
    const out = phoneNumber ? `${countryLabel}${phoneNumber}` : "";
    onChange?.(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber, selectedCountry]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
    // when country changes, parent will be notified by effect
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // allow only digits and up to 10-14 digits
    const digits = String(e.target.value || "").replace(/\D/g, "").slice(0, 14);
    setPhoneNumber(digits);
  };

  return (
    <div className="relative flex items-center">
      {selectPosition === "start" && (
        <div className="absolute left-0 h-full flex items-center pl-2">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="appearance-none bg-transparent border-0 pr-2 text-sm"
            aria-label="country-code"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        className={`h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm ${selectPosition === "start" ? "pl-20" : "pr-20"}`}
      />

      {selectPosition === "end" && (
        <div className="absolute right-0 h-full flex items-center pr-2">
          <select value={selectedCountry} onChange={handleCountryChange} className="appearance-none bg-transparent border-0 text-sm" aria-label="country-code-end">
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
