// Prevent zoom and pinch gestures on iOS and other touch devices
(function() {
    'use strict';
    
    // Prevent pinch zoom (only when multiple fingers)
    document.addEventListener('gesturestart', function (event) {
        event.preventDefault();
    });
    
    document.addEventListener('gesturechange', function (event) {
        event.preventDefault();
    });
    
    document.addEventListener('gestureend', function (event) {
        event.preventDefault();
    });
    
    // Prevent zoom on multi-touch (pinch gestures)
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    });
    
    // Prevent zoom on input focus (iOS Safari)
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(function(input) {
        input.addEventListener('focus', function() {
            // Set viewport to prevent zoom
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        });
    });
    
    // Additional prevention for iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // Disable zoom on orientation change
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
            }, 100);
        });
        
        // Prevent zoom on scroll (only when scaling)
        document.addEventListener('touchmove', function(event) {
            if (event.scale && event.scale !== 1) {
                event.preventDefault();
            }
        }, { passive: false });
    }
})();
