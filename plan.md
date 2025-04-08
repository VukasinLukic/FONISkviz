# FONIS Quiz Application Fix Plan

## Current Issues

1. **QR Code Page Issues**
   - Missing decorative assets from `/assets/dodaci/`
   - Background elements not displaying correctly

2. **LobbyPage Issues**
   - Page appears to be empty
   - Missing proper styling and content

3. **SplashScreen Issues**
   - Only shows "FONIS Quiz" text and poor animations
   - Need to remove text and just show logo animation

4. **Route Issues**
   - Navigation pathways are problematic
   - Need to ensure paths are correct and functional

5. **DevControls Visibility**
   - DevControl panel needs to be available on all pages for easier navigation during development

6. **Asset Path Issues**
   - Need to use absolute paths for all assets
   - SVG files and other assets not loading correctly

## Detailed Action Plan

### 1. Fix SplashScreen
- Remove "FONIS Quiz" text
- Enhance logo animation 
- Ensure proper use of AnimatedBackground component with decorative assets
- Fix transition to QR Code page

### 2. Fix QR Code Page
- Add missing decorative assets using AnimatedBackground component
- Ensure all SVG files are loaded with absolute paths
- Fix layout and styling issues
- Make sure navigation to Lobby page works

### 3. Fix Lobby Page
- Implement full content display
- Add team cards and controls
- Fix styling and animations
- Ensure proper navigation to next pages

### 4. Fix Routes Structure
- Update Routes.tsx to ensure proper routing
- Make DevControls visible on all admin pages
- Fix navigation between screens
- Add missing routes if needed

### 5. Fix Asset Loading
- Update all asset paths to use window.location.origin
- Fix SVG loading in AnimatedBackground component
- Ensure all decorative elements use the proper paths

### 6. DevControls Enhancement
- Make DevControls available on all pages
- Update DevControls to include all admin routes
- Ensure routes in DevControls match the actual route structure

## Implementation Order
1. Fix asset path issues first (foundation for other fixes)
2. Update Routes structure
3. Fix SplashScreen
4. Fix QR Code Page
5. Fix Lobby Page
6. Enhance DevControls for better navigation

## Testing Strategy
- Test all routes using DevControls
- Verify asset loading on each page
- Test navigation flow from SplashScreen → QR Code → Lobby
- Ensure animations and transitions work as expected 