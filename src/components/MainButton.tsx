import { ReactNode } from 'react';

interface MainButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

const MainButton: React.FC<MainButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 px-6 text-lg font-bold bg-secondary text-white rounded-lg 
      shadow-md hover:bg-opacity-90 transition-all disabled:opacity-50 
      disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export default MainButton; 