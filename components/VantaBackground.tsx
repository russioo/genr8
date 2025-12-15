'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    VANTA: any;
  }
}

export default function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    if (!vantaRef.current) return;
    
    // Wait for VANTA to be available
    const initVanta = () => {
      if (window.VANTA && window.VANTA.FOG) {
        if (vantaEffect.current) {
          vantaEffect.current.destroy();
        }
        vantaEffect.current = window.VANTA.FOG({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          speed: 1.0, // More movement
          zoom: 0.8, // More zoom
          highlightColor: 0xc8ff00, // --accent
          midtoneColor: 0x111111, // --surface
          lowlightColor: 0x0a0a0a, // --bg
          baseColor: 0x0a0a0a, // --bg
          blurFactor: 0.8, // More fog/blur
        });
      } else {
        setTimeout(initVanta, 100);
      }
    };
    
    initVanta();
    
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, []);

  return (
    <>
      <div ref={vantaRef} className="fixed inset-0 -z-10" />
      <div className="fixed inset-0 -z-10 bg-black/40" />
    </>
  );
}

