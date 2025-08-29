// Remember Me functionality
document.addEventListener('DOMContentLoaded', function() {
  const rememberMeCheckbox = document.getElementById('remember-me');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginForm = document.querySelector('form[action="/login"]');

  // Load saved credentials on page load
  loadSavedCredentials();

  // Save credentials when form is submitted
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      if (rememberMeCheckbox && rememberMeCheckbox.checked) {
        saveCredentials();
      } else {
        clearSavedCredentials();
      }
    });
  }

  // Function to save credentials to localStorage
  function saveCredentials() {
    if (usernameInput && passwordInput) {
      const credentials = {
        username: usernameInput.value,
        password: passwordInput.value,
        timestamp: Date.now()
      };
      localStorage.setItem('cuub_credentials', JSON.stringify(credentials));
      console.log('Credentials saved to localStorage');
    }
  }

  // Function to load saved credentials from localStorage
  function loadSavedCredentials() {
    const savedCredentials = localStorage.getItem('cuub_credentials');
    
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        
        // Check if credentials are less than 30 days old
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        if (credentials.timestamp > thirtyDaysAgo) {
          if (usernameInput) {
            usernameInput.value = credentials.username;
          }
          if (passwordInput) {
            passwordInput.value = credentials.password;
          }
          if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
          }
          console.log('Saved credentials loaded');
        } else {
          // Clear expired credentials
          clearSavedCredentials();
          console.log('Expired credentials cleared');
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
        clearSavedCredentials();
      }
    }
  }

  // Function to clear saved credentials
  function clearSavedCredentials() {
    localStorage.removeItem('cuub_credentials');
    console.log('Saved credentials cleared');
  }

  // Handle checkbox change
  if (rememberMeCheckbox) {
    rememberMeCheckbox.addEventListener('change', function() {
      if (!this.checked) {
        clearSavedCredentials();
      }
    });
  }
});
