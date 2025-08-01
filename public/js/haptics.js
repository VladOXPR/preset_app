// Haptic Feedback Utility
class Haptics {
  constructor() {
    this.isSupported = 'vibrate' in navigator;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Light haptic feedback (button press)
  light() {
    if (this.isSupported) {
      navigator.vibrate(50);
    }
  }

  // Medium haptic feedback (success)
  medium() {
    if (this.isSupported) {
      navigator.vibrate(100);
    }
  }

  // Heavy haptic feedback (error)
  heavy() {
    if (this.isSupported) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  // Success haptic feedback
  success() {
    if (this.isSupported) {
      navigator.vibrate([50, 50, 100]);
    }
  }

  // Error haptic feedback
  error() {
    if (this.isSupported) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  // Navigation haptic feedback
  navigation() {
    if (this.isSupported) {
      navigator.vibrate(30);
    }
  }

  // Chat message haptic feedback
  message() {
    if (this.isSupported) {
      navigator.vibrate(40);
    }
  }

  // Form submission haptic feedback
  submit() {
    if (this.isSupported) {
      navigator.vibrate([50, 50, 50]);
    }
  }
}

// Create global haptics instance
window.haptics = new Haptics();

// Add haptic feedback to all buttons
document.addEventListener('DOMContentLoaded', function() {
  // Add haptic feedback to all buttons
  const buttons = document.querySelectorAll('button, .primary, .secondary, .chat-btn, .user-card-btn, .delete-btn, .back-btn, .send-btn');
  
  buttons.forEach(button => {
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
    link.addEventListener('click', function() {
      haptics.navigation();
    });
  });
}); 