import { useEffect } from 'react';

interface FontLoaderProps {}

const FontLoader: React.FC<FontLoaderProps> = () => {
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    
    // Set the CSS content with absolute paths
    style.textContent = `
      @font-face {
        font-family: 'Mainstay';
        src: url('${window.location.origin}/fonts/Basteleur-Bold.ttf') format('truetype');
        font-weight: bold;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Caviar Dreams';
        src: url('${window.location.origin}/fonts/CaviarDreams.woff2') format('woff2'),
             url('${window.location.origin}/fonts/CaviarDreams.woff') format('woff');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Caviar Dreams';
        src: url('${window.location.origin}/fonts/CaviarDreams_Bold.woff2') format('woff2'),
             url('${window.location.origin}/fonts/CaviarDreams_Bold.woff') format('woff');
        font-weight: bold;
        font-style: normal;
        font-display: swap;
      }
    `;
    
    // Append the style element to the head
    document.head.appendChild(style);
    
    // Clean up
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default FontLoader; 