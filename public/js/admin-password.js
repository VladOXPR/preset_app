// Admin Password Input Handler
document.addEventListener('DOMContentLoaded', function() {
    const passwordInputs = document.querySelectorAll('.password-digit');
    const ADMIN_PASSWORD = '1234'; // Default admin password
    
    // Focus first input on load
    passwordInputs[0].focus();
    
    // Handle input events
    passwordInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            const value = e.target.value;
            
            // Only allow digits
            if (!/^\d$/.test(value)) {
                e.target.value = '';
                return;
            }
            
            // Move to next input if current is filled
            if (value && index < passwordInputs.length - 1) {
                passwordInputs[index + 1].focus();
            }
            
            // Check if all inputs are filled
            checkPassword();
        });
        
        input.addEventListener('keydown', function(e) {
            // Handle backspace
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                passwordInputs[index - 1].focus();
            }
            
            // Handle arrow keys
            if (e.key === 'ArrowLeft' && index > 0) {
                passwordInputs[index - 1].focus();
            }
            if (e.key === 'ArrowRight' && index < passwordInputs.length - 1) {
                passwordInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text');
            const digits = pastedData.replace(/\D/g, '').slice(0, 4);
            
            digits.split('').forEach((digit, i) => {
                if (passwordInputs[i]) {
                    passwordInputs[i].value = digit;
                }
            });
            
            // Focus last filled input or last input
            const lastFilledIndex = Math.min(digits.length - 1, passwordInputs.length - 1);
            passwordInputs[lastFilledIndex].focus();
            
            checkPassword();
        });
    });
    
    function checkPassword() {
        const enteredPassword = Array.from(passwordInputs)
            .map(input => input.value)
            .join('');
        
        if (enteredPassword.length === 4) {
            validatePassword(enteredPassword);
        }
    }
    
    function validatePassword(password) {
        // Show loading state
        passwordInputs.forEach(input => {
            input.style.borderColor = '#666666';
            input.disabled = true;
        });
        
        // Send password to server for validation
        fetch('/api/validate-admin-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ password: password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Password correct - redirect to admin page
                window.location.href = '/admin';
            } else {
                // Password incorrect - show error and reset
                showError();
            }
        })
        .catch(error => {
            console.error('Error validating password:', error);
            showError();
        });
    }
    
    function showError() {
        // Show error state
        passwordInputs.forEach(input => {
            input.style.borderColor = '#ff4444';
            input.value = '';
            input.disabled = false;
        });
        
        // Focus first input
        passwordInputs[0].focus();
        
        // Reset error state after a delay
        setTimeout(() => {
            passwordInputs.forEach(input => {
                input.style.borderColor = '#666666';
            });
        }, 1000);
    }
});
