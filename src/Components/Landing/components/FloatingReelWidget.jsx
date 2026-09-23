import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Volume2, VolumeX, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import reelPlaceholderImg from "/images/with_pagarpe1.png";
import logoImg from "/logo.png";

const FloatingReelWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (isDismissed) return null;

  return (
    <>
      {/* Sleek Sober Floating Trigger with Eye-Catching Animation */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: [0, -6, 0], opacity: 1 }}
        transition={{
          opacity: { duration: 0.4 },
          y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
        }}
        className="fixed bottom-6 left-6 z-40 select-none group"
      >
        <div className="relative flex items-center">
          {/* Subtle Glowing Pulse Aura behind pill */}
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] via-[#6c4cf1] to-purple-500 opacity-40 blur-sm group-hover:opacity-80 transition-opacity duration-300 animate-pulse" />

          {/* Main Floating Trigger Pill */}
          <div
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-3 bg-gray-900 text-white p-2 pr-2.5 rounded-xl border border-gray-700/80 shadow-lg cursor-pointer hover:bg-gray-800/90 transition-all duration-200"
          >
            {/* Story Image Avatar with Pulsing Ring */}
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-700">
              <img
                src={reelPlaceholderImg}
                alt="PagarPe reel ad"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                {/* Ping ripple effect */}
                <span className="absolute w-5 h-5 rounded-full bg-white/40 animate-ping opacity-75" />
                <div className="relative w-5 h-5 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center border border-white/60 shadow-sm">
                  <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Label & Subtitle */}
            <div className="flex flex-col text-left pr-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-white tracking-wide">Watch promo reel</span>
              </div>
              <span className="text-[11px] text-gray-300 font-normal">PagarPe demo</span>
            </div>

            {/* Close Button Inside Pill */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="ml-1 w-6 h-6 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-xs transition-colors shrink-0"
              title="Close reel widget"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Sober Clean Reel Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
            onClick={() => setIsOpen(false)}
          >
            {/* Modal Card (9:16 Portrait Reel Container) */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-[9/16] max-h-[85vh] bg-gray-950 rounded-2xl overflow-hidden shadow-lg border border-gray-800 flex flex-col justify-between"
            >
              {/* Top Header Controls */}
              <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 p-1 border border-white/20 flex items-center justify-center">
                    <img src={logoImg} alt="PagarPe logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="text-white text-xs font-semibold">PagarPe Official</h4>
                      <CheckCircle2 className="w-3 h-3 text-blue-400 fill-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/70 text-white flex items-center justify-center border border-white/20 transition-all"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/70 text-white flex items-center justify-center border border-white/20 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Video Container */}
              <div className="relative w-full h-full overflow-hidden bg-gray-950 flex items-center justify-center">
                <iframe
                  src={`https://www.youtube.com/embed/WkS1mger34Q?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=WkS1mger34Q&controls=0&rel=0&modestbranding=1`}
                  title="PagarPe Reel"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                ></iframe>

                {/* Dark Vignette Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />

                {/* Bottom Button */}
                <div className="absolute bottom-4 inset-x-4 z-30">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-sm  flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-opacity"
                  >
                    <span>Get started free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingReelWidget;
