import { useState, useEffect } from 'react';

export const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Napredna detekcija mobilnih uređaja
    const checkMobile = () => {
      // 1. User Agent detekcija - najpouzdanija metoda za većinu slučajeva
      const userAgent = 
        navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Prošireni regex koji pokriva više mobilnih uređaja
      const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(userAgent);
      
      // 2. Provera veličine ekrana - dodatna metoda koja hvata neke edge slučajeve
      const mobileScreenSize = window.innerWidth <= 768;
      
      // 3. Provera orijentacije - portrait mode je često indikacija mobilnog uređaja
      const isPortrait = window.innerHeight > window.innerWidth;
      
      // 4. Touch API detekcija - većina mobilnih uređaja podržava touch
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Kombinujemo više signala za što precizniju detekciju
      // Glavna detekcija: User agent ili (mala veličina ekrana u portrait modu sa touch podrškom)
      const result = mobileUserAgent || (mobileScreenSize && isPortrait && hasTouch);
      
      // Logujemo rezultate za transparentnost
      console.log("Device Detection:", {
        userAgent,
        mobileUserAgent,
        mobileScreenSize,
        isPortrait,
        hasTouch,
        finalDecision: result
      });
      
      // Čuvamo odluku u localStorage za debugging
      localStorage.setItem('deviceDetection', JSON.stringify({
        mobileUserAgent,
        mobileScreenSize,
        isPortrait,
        hasTouch, 
        result
      }));
      
      return result;
    };

    // Set initial state
    setIsMobile(checkMobile());

    // Update state when window is resized
    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener('resize', handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isMobile };
};

export default useDeviceDetection; 