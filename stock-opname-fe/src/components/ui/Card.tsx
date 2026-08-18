interface CardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}

export default function Card({ children, className = '', accentColor }: CardProps) {
  return (
    <div
      className={`bg-white border border-kai-gray-200 shadow-sm rounded-lg p-5 ${className}`}
      style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : undefined}
    >
      {children}
    </div>
  );
}