// FontLoader modul - učitava fontove u aplikaciju
const FontLoader = {
  loadFonts: () => {
    // Create a style element
    const style = document.createElement('style');
    
    // Set the CSS content with absolute paths
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap');
      
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
    
    // Remove any existing FontLoader styles
    const existingStyle = document.getElementById('font-loader-styles');
    if (existingStyle) {
      document.head.removeChild(existingStyle);
    }
    
    // Add ID to the style element for future reference
    style.id = 'font-loader-styles';
    
    // Append the style element to the head
    document.head.appendChild(style);
    
    return true; // Return true to indicate fonts were loaded
  }
};

export default FontLoader; 