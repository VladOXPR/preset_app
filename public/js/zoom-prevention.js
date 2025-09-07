// Prevent zoom and pinch gestures on iOS and other touch devices
(function() {
    'use strict';
    
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Prevent pinch zoom
    document.addEventListener('gesturestart', function (event) {
        event.preventDefault();
    });
    
    document.addEventListener('gesturechange', function (event) {
        event.preventDefault();
    });
    
    document.addEventListener('gestureend', function (event) {
        event.preventDefault();
    });
    
    // Prevent zoom on input focus (iOS Safari)
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    });
    
    let lastTouchStart = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchStart <= 300) {
            event.preventDefault();
        }
    }, false);
    
    document.addEventListener('touchstart', function(event) {
        lastTouchStart = (new Date()).getTime();
    }, false);
    
    // Prevent zoom on input focus
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
        
        // Prevent zoom on scroll
        document.addEventListener('touchmove', function(event) {
            if (event.scale !== 1) {
                event.preventDefault();
            }
        }, { passive: false });
    }
})();
