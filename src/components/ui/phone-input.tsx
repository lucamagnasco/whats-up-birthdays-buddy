import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countryCodes, CountryCode, formatPhoneNumber, parsePhoneNumber, getDefaultCountry } from "@/lib/country-codes";

export interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  onCountryChange?: (country: CountryCode) => void;
  defaultCountry?: CountryCode;
  showFlag?: boolean;
  className?: string;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ 
    value = "", 
    onChange, 
    onCountryChange,
    defaultCountry = getDefaultCountry(),
    showFlag = true,
    className,
    placeholder = "Phone number",
    ...props 
  }, ref) => {
    const [selectedCountry, setSelectedCountry] = React.useState<CountryCode>(defaultCountry);
    const [phoneNumber, setPhoneNumber] = React.useState("");

    // Parse initial value if provided
    React.useEffect(() => {
      if (value) {
        const parsed = parsePhoneNumber(value);
        if (parsed) {
          setSelectedCountry(parsed.countryCode);
          setPhoneNumber(parsed.phoneNumber);
        } else {
          // If we can't parse it, assume it's just a phone number with default country
          setPhoneNumber(value.replace(/^\+/, ''));
        }
      }
    }, [value]);

    // Update parent when country or phone number changes
    React.useEffect(() => {
      const fullNumber = formatPhoneNumber(selectedCountry, phoneNumber);
      onChange?.(fullNumber);
    }, [selectedCountry, phoneNumber, onChange]);

    const handleCountryChange = (countryCode: string) => {
      const country = countryCodes.find(c => c.code === countryCode);
      if (country) {
        setSelectedCountry(country);
        onCountryChange?.(country);
      }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.replace(/\D/g, '');
      setPhoneNumber(newValue);
    };

    return (
      <div className={cn("flex gap-2", className)}>
        {/* Country Code Selector */}
        <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-[140px] flex-shrink-0">
            <SelectValue>
              <div className="flex items-center gap-2">
                {showFlag && <span className="text-base">{selectedCountry.flag}</span>}
                <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {countryCodes.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  {showFlag && <span className="text-base">{country.flag}</span>}
                  <span className="text-sm">{country.name}</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {country.dialCode}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Phone Number Input */}
        <Input
          ref={ref}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className="flex-1"
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput }; 