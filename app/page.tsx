"use client"
export default function Page() {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden`}
    >
      {/* Background elements */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-950/30 via-transparent to-purple-950/30'></div>
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent'></div>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-30 animate-pulse'></div>
      <div className='absolute inset-0 bg-[linear-gradient(90deg,#2d3748_1px,transparent_1px),linear-gradient(180deg,#2d3748_1px,transparent_1px)] bg-[size:24px_24px] opacity-5'></div>
      <div className='absolute top-1/3 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-20 animate-[float_25s_ease-in-out_infinite]'></div>
      <div className='absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl opacity-20 animate-[float_30s_ease-in-out_infinite_reverse]'></div>
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-full blur-3xl'></div>

      <div className='relative z-10 w-full max-w-lg'>
        {/* Logo/Brand*/}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center justify-center mb-8'>
            <div className='relative'>
              <div className='absolute -inset-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-30'></div>
              <h1 className='text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent relative'>Vitae</h1>
            </div>
          </div>
          <p className='text-zinc-100 text-2xl font-medium tracking-wide'>Resume Version Control</p>
          <p className='text-gray-300 text-xl mt-4'>Track and manage your entire career history</p>
        </div>
      </div>

      {/* Add float animation keyframes to global styles */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(30px, -30px);
          }
          66% {
            transform: translate(-20px, 20px);
          }
        }
      `}</style>
    </div>
  )
}
