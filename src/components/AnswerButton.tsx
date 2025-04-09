interface AnswerButtonProps {
  answer: string;
  selected: boolean;
  onClick: () => void;
  color?: 'highlight' | 'special' | 'secondary' | 'primary';
}

const getColorClasses = (color: string, selected: boolean) => {
  const baseClasses = 'w-full h-96 rounded-lg text-7xl font-bold transition-all font-basteleur';
  
  if (selected) {
    switch (color) {
      case 'highlight':
        return `${baseClasses} bg-highlight text-white scale-95`;
      case 'special':
        return `${baseClasses} bg-special text-white scale-95`;
      case 'primary':
        return `${baseClasses} bg-primary text-white scale-95`;
      default:
        return `${baseClasses} bg-secondary text-white scale-95`;
    }
  }

  // Not selected - show color immediately
  switch (color) {
    case 'highlight':
      return `${baseClasses} bg-highlight text-white hover:opacity-90`;
    case 'special':
      return `${baseClasses} bg-special text-white hover:opacity-90`;
    case 'primary':
      return `${baseClasses} bg-primary text-white hover:opacity-90`;
    default:
      return `${baseClasses} bg-secondary text-white hover:opacity-90`;
  }
};

const AnswerButton: React.FC<AnswerButtonProps> = ({ answer, selected, onClick, color = 'secondary' }) => {
  return (
    <button
      onClick={onClick}
      disabled={selected}
      className={getColorClasses(color, selected)}
    >
      {answer}
    </button>
  );
};

export default AnswerButton; 