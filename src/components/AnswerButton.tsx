interface AnswerButtonProps {
  answer: string;
  selected: boolean;
  onClick: () => void;
}

const AnswerButton: React.FC<AnswerButtonProps> = ({ answer, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={selected}
      className={`h-32 rounded-lg text-3xl font-bold transition-all ${
        selected 
          ? 'bg-secondary text-white scale-95' 
          : 'bg-white text-primary hover:bg-gray-100'
      }`}
    >
      {answer}
    </button>
  );
};

export default AnswerButton; 