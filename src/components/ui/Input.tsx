import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        // Osnovni Tailwind stilovi slični Shadcn inputu
        // Prilagodite po potrebi vašem dizajnu
        className={`
          flex h-10 w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-sm
          text-white placeholder:text-white/60
          focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary
          disabled:cursor-not-allowed disabled:opacity-50
          ${className} // Omogućava dodavanje ili pregaženje klasa
        `}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
