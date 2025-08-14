interface SkunkedAnimationProps {
  show: boolean;
}

export const SkunkedAnimation = ({ show }: SkunkedAnimationProps) => {
  if (!show) return null;
  
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[60] rounded-lg">
      <div className="text-center space-y-4 animate-bounce">
        <div className="text-6xl animate-pulse">🦨</div>
        <div className="text-4xl font-bold text-white animate-pulse">
          SKUNKED!
        </div>
        <div className="text-xl text-yellow-400 font-semibold animate-pulse">
          Someone got shut out!
        </div>
        <div className="flex justify-center space-x-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-victory-gold rounded-full animate-ping"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};