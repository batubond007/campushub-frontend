import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  invalid?: boolean
  disabled?: boolean
  describedBy?: string
}

/**
 * One box per digit. Typing moves to the next box, Backspace goes back,
 * and pasting a whole code fills every box at once.
 */
function OtpInput({ value, onChange, length = 6, invalid, disabled, describedBy }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const focus = (index: number) => inputs.current[Math.max(0, Math.min(index, length - 1))]?.focus()

  // After a wrong code the boxes are cleared and re-enabled: put the cursor back in the first one.
  useEffect(() => {
    if (!disabled && value === '') inputs.current[0]?.focus()
  }, [disabled, value])

  // The code is kept as one string with no gaps: boxes are always filled from the left.
  function setDigit(index: number, digit: string) {
    if (!digit) {
      onChange(value.slice(0, index))
      return
    }
    const next = digits.slice()
    next[index] = digit
    onChange(next.join('').slice(0, length))
  }

  function handleInput(index: number, raw: string) {
    const typed = raw.replace(/\D/g, '')
    if (!typed) return
    if (typed.length > 1) {
      // Autofill (e.g. the code from an SMS/e-mail suggestion) can put several digits in one box.
      onChange((digits.slice(0, index).join('') + typed).slice(0, length))
      focus(index + typed.length)
      return
    }
    setDigit(index, typed)
    focus(index + 1)
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (digits[index]) setDigit(index, '')
      else if (index > 0) {
        setDigit(index - 1, '')
        focus(index - 1)
      }
    } else if (event.key === 'ArrowLeft') {
      focus(index - 1)
    } else if (event.key === 'ArrowRight') {
      focus(index + 1)
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    event.preventDefault()
    onChange(pasted)
    focus(pasted.length)
  }

  return (
    <div className="otp-input" role="group" aria-label="Verification code" aria-describedby={describedBy}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el
          }}
          value={digit}
          onChange={(e) => handleInput(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => {
            // Clicking an empty box further right jumps to the first empty one, so no gaps appear.
            if (index > value.length) focus(value.length)
            else e.target.select()
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid ? true : undefined}
          disabled={disabled}
          autoFocus={index === 0}
        />
      ))}
    </div>
  )
}

export default OtpInput
