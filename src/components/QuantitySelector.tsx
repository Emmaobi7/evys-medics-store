import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onChange?: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  disabled = false,
}) => {
  const isMin = quantity <= min;
  const isMax = quantity >= max;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      onChange(min);
    } else {
      const clamped = Math.max(min, Math.min(max, val));
      onChange(clamped);
    }
  };

  return (
    <div
      className={`quantity-stepper ${size === 'sm' ? 'quantity-stepper-sm' : ''} ${disabled ? 'disabled' : ''}`}
      role="group"
      aria-label="Quantity selector"
    >
      <button
        type="button"
        className="quantity-btn"
        onClick={onDecrease}
        disabled={disabled || isMin}
        aria-label="Decrease quantity"
        title={isMin ? `Minimum quantity is ${min}` : 'Decrease quantity'}
      >
        <Minus size={size === 'sm' ? 12 : 14} />
      </button>

      {onChange ? (
        <input
          type="number"
          min={min}
          max={max}
          value={quantity}
          disabled={disabled}
          onChange={handleInputChange}
          className="quantity-input"
          aria-label="Quantity value"
        />
      ) : (
        <span className="quantity-value" aria-live="polite">
          {quantity}
        </span>
      )}

      <button
        type="button"
        className="quantity-btn"
        onClick={onIncrease}
        disabled={disabled || isMax}
        aria-label="Increase quantity"
        title={isMax ? `Maximum quantity is ${max}` : 'Increase quantity'}
      >
        <Plus size={size === 'sm' ? 12 : 14} />
      </button>
    </div>
  );
};
