import * as React from "react"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
    value?: string; // Format: YYYY-MM-DD
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
    ({ className, value, onChange, ...props }, ref) => {
        const inputRef = React.useRef<HTMLInputElement>(null);
        const textInputRef = React.useRef<HTMLInputElement>(null);
        const [isEditing, setIsEditing] = React.useState(false);
        const [textValue, setTextValue] = React.useState('');

        // Combine refs
        React.useImperativeHandle(ref, () => inputRef.current!);

        // Format date from YYYY-MM-DD to DD/MM/YYYY for display
        const formatDisplayDate = (dateStr: string | undefined): string => {
            if (!dateStr) return '';
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dateStr;
        };

        // Parse DD/MM/YYYY to YYYY-MM-DD
        const parseInputDate = (input: string): string | null => {
            // Remove any non-digit characters except /
            const cleaned = input.replace(/[^\d/]/g, '');
            
            // Try to parse DD/MM/YYYY format
            const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (match) {
                const day = match[1].padStart(2, '0');
                const month = match[2].padStart(2, '0');
                const year = match[3];
                
                // Validate date
                const dayNum = parseInt(day);
                const monthNum = parseInt(month);
                const yearNum = parseInt(year);
                
                if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum >= 1900 && yearNum <= 2100) {
                    // Check if date is valid
                    const testDate = new Date(yearNum, monthNum - 1, dayNum);
                    if (testDate.getDate() === dayNum && testDate.getMonth() === monthNum - 1) {
                        return `${year}-${month}-${day}`;
                    }
                }
            }
            return null;
        };

        // Auto-format while typing
        const formatInputValue = (input: string): string => {
            // Remove non-digits
            const digits = input.replace(/\D/g, '');
            
            // Format as DD/MM/YYYY while typing
            if (digits.length <= 2) {
                return digits;
            } else if (digits.length <= 4) {
                return `${digits.slice(0, 2)}/${digits.slice(2)}`;
            } else {
                return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
            }
        };

        const displayValue = formatDisplayDate(value);

        // Sync textValue when value changes from outside
        React.useEffect(() => {
            if (!isEditing) {
                setTextValue(displayValue);
            }
        }, [displayValue, isEditing]);

        const handleClick = () => {
            setIsEditing(true);
            setTextValue(displayValue);
            setTimeout(() => {
                textInputRef.current?.focus();
                textInputRef.current?.select();
            }, 0);
        };

        const handleCalendarClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            inputRef.current?.showPicker();
        };

        const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatInputValue(e.target.value);
            setTextValue(formatted);

            // Try to parse and update parent if valid
            if (formatted.length === 10) {
                const parsed = parseInputDate(formatted);
                if (parsed && onChange) {
                    const syntheticEvent = {
                        target: { value: parsed },
                        currentTarget: { value: parsed },
                    } as React.ChangeEvent<HTMLInputElement>;
                    onChange(syntheticEvent);
                }
            }
        };

        const handleTextBlur = () => {
            setIsEditing(false);
            
            // Try to parse the current text value
            if (textValue) {
                const parsed = parseInputDate(textValue);
                if (parsed && onChange) {
                    const syntheticEvent = {
                        target: { value: parsed },
                        currentTarget: { value: parsed },
                    } as React.ChangeEvent<HTMLInputElement>;
                    onChange(syntheticEvent);
                } else {
                    // Reset to original value if invalid
                    setTextValue(displayValue);
                }
            }
        };

        const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                textInputRef.current?.blur();
            } else if (e.key === 'Escape') {
                setTextValue(displayValue);
                setIsEditing(false);
            }
        };

        return (
            <div className="relative">
                {isEditing ? (
                    /* Text input for manual typing */
                    <div
                        className={cn(
                            "flex h-10 w-full items-center justify-between rounded-md border border-cyan-400 bg-white px-3 py-2 text-sm text-slate-900 ring-2 ring-cyan-200",
                            "dark:bg-slate-800 dark:border-cyan-500 dark:text-white dark:ring-cyan-800 transition-colors",
                            className
                        )}
                    >
                        <input
                            ref={textInputRef}
                            type="text"
                            value={textValue}
                            onChange={handleTextChange}
                            onBlur={handleTextBlur}
                            onKeyDown={handleTextKeyDown}
                            placeholder="DD/MM/YYYY"
                            maxLength={10}
                            className="flex-1 bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 uppercase"
                        />
                        <button
                            type="button"
                            onClick={handleCalendarClick}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                            <Calendar className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                        </button>
                    </div>
                ) : (
                    /* Display view */
                    <div
                        onClick={handleClick}
                        className={cn(
                            "flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background cursor-pointer",
                            "hover:border-cyan-400 dark:hover:border-cyan-500",
                            "dark:bg-slate-800 dark:border-slate-600 dark:text-white transition-colors",
                            className
                        )}
                    >
                        <span className={displayValue ? "text-slate-900 dark:text-white uppercase" : "text-slate-400 dark:text-slate-500"}>
                            {displayValue || "DD/MM/YYYY"}
                        </span>
                        <button
                            type="button"
                            onClick={handleCalendarClick}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
                )}

                {/* Hidden native date input for picker */}
                <input
                    type="date"
                    ref={inputRef}
                    value={value || ''}
                    onChange={onChange}
                    className="absolute inset-0 opacity-0 pointer-events-none"
                    tabIndex={-1}
                    {...props}
                />
            </div>
        );
    }
);

DateInput.displayName = "DateInput";

export { DateInput };
