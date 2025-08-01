// Enhanced Haptic Feedback Utility for iOS and Android
class Haptics {
  constructor() {
    this.isSupported = 'vibrate' in navigator;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    this.isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('Haptics initialized:', {
      isSupported: this.isSupported,
      isIOS: this.isIOS,
      isSafari: this.isSafari,
      isPWA: this.isPWA
    });
  }

  // iOS-specific haptic feedback using Web Audio API
  createHapticAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    return { oscillator, gainNode };
  }

  // iOS haptic feedback using audio
  iosHaptic(intensity = 'light') {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const { oscillator, gainNode } = this.createHapticAudio();
    
    // Different frequencies for different haptic types
    const frequencies = {
      light: 200,
      medium: 150,
      heavy: 100,
      success: [200, 300],
      error: [100, 200, 100]
    };
    
    const freq = frequencies[intensity] || 200;
    
    if (Array.isArray(freq)) {
      // Pattern haptic
      freq.forEach((f, index) => {
        setTimeout(() => {
          oscillator.frequency.setValueAtTime(f, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.1);
        }, index * 50);
      });
    } else {
      // Single haptic
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    }
  }

  // Light haptic feedback (button press)
  light() {
    if (this.isSupported && !this.isIOS) {
      navigator.vibrate(50);
    } else if (this.isIOS) {
      this.iosHaptic('light');
    }
  }

  // Medium haptic feedback (success)
  medium() {
    if (this.isSupported && !this.isIOS) {
      navigator.vibrate(100);
    } else if (this.isIOS) {
      this.iosHaptic('medium');
    }
  }

  // Heavy haptic feedback (error)
  heavy() {
    if (this.isSupported && !this.isIOS) {
      navigator.vibrate([100, 50, 100]);
    } else if (this.isIOS) {
      this.iosHaptic('heavy');
    }
  }

  // Success haptic feedback
  success() {
    if (this.isSupported && !this.isIOS) {
      navigator.vibrate([50, 50, 100]);
    } else if (this.isIOS) {
      this.iosHaptic('success');
    }
  }

  // Error haptic feedback
  error() {
    if (this.isSupported && !this.isIOS) {
      navigator.vibrate([200, 100, 200]);
    } else if (this.isIOS) {
      this.iosHaptic('error');
    }
  }

  // Navigation haptic feedback
  navigation() {
    if (this.isSupported && !this.isIOS) {
      navigator.vibrate(30);
    } else if (this.isIOS) {
      this.iosHaptic('light');
    }
  }

  // Chat message haptic feedback
  message() {
    if (this.isSupported && !this.isIOS) {
      navigator.vibrate(40);
    } else if (this.isIOS) {
      this.iosHaptic('light');
    }
  }

  // Form submission haptic feedback
  submit() {
    if (this.isSupported && !this.isIOS) {
      navigator.vibrate([50, 50, 50]);
    } else if (this.isIOS) {
      this.iosHaptic('medium');
    }
  }

  // iOS-specific impact haptic (if available)
  impact(style = 'light') {
    if (this.isIOS && window.navigator.userAgent.includes('Safari')) {
      // Try to trigger iOS system haptics through user interaction
      this.iosHaptic(style);
    }
  }
}

// Create global haptics instance
window.haptics = new Haptics();

// Add haptic feedback to all buttons with iOS-specific handling
document.addEventListener('DOMContentLoaded', function() {
  // Add haptic feedback to all buttons
  const buttons = document.querySelectorAll('button, .primary, .secondary, .chat-btn, .user-card-btn, .delete-btn, .back-btn, .send-btn');
  
  buttons.forEach(button => {
    button.addEventListener('touchstart', function(e) {
      // Prevent default to avoid double-tap zoom
      e.preventDefault();
      haptics.light();
    }, { passive: false });
    
    button.addEventListener('click', function() {
      haptics.light();
    });
  });

  // Add haptic feedback to form submissions
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function() {
      haptics.submit();
    });
  });

  // Add haptic feedback to links
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('touchstart', function(e) {
      haptics.navigation();
    }, { passive: true });
    
    link.addEventListener('click', function() {
      haptics.navigation();
    });
  });

  // iOS-specific: Add haptic feedback to input focus
  if (haptics.isIOS) {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', function() {
        haptics.light();
      });
    });
  }
}); 