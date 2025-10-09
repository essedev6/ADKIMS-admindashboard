import { WifiIcon } from '@heroicons/react/24/solid';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#020817] z-50 flex items-center justify-center overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[url('/stars-bg.svg')] opacity-30 animate-pulse" />
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full filter blur-[100px] opacity-30 animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full filter blur-[100px] opacity-30 animate-float-slower" />
      <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full filter blur-[80px] opacity-20 animate-float-medium" />
      
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-grid-move" />
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col items-center space-y-6">
        {/* Animated WiFi Icon with Pulse Ring */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" />
          <div className="relative bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
            <WifiIcon className="h-16 w-16 text-blue-400 animate-pulse" />
          </div>
        </div>

        {/* Enhanced Text with Gradient Animation */}
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent bg-size-200 bg-pos-0 animate-gradient-shift">
            ADKIMS SYSTEMS
          </h2>
          <p className="text-blue-300/80 text-lg font-light animate-pulse">
            Connecting to network...
          </p>
        </div>

        {/* Enhanced Loading Dots */}
        <div className="flex space-x-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 100}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-blue-900/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-progress" />
        </div>

        {/* Floating Particles */}
        <div className="absolute -top-20 -left-20 w-40 h-40 opacity-50">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-blue-400/50 animate-fade-in" />
      <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-cyan-400/50 animate-fade-in" />
      <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-blue-400/50 animate-fade-in" />
      <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-cyan-400/50 animate-fade-in" />
    </div>
  );
}