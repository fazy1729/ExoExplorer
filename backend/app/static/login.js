document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&grant_type=password`
        });
        
        if (!response.ok) {
            throw new Error('Login failed');
        }
        
        const data = await response.json();
        
        // Store the token in localStorage
        localStorage.setItem('access_token', data.access_token);
        
        // Redirect to your protected page
        window.location.href = '/protected-page.html';
    } catch (error) {
        document.getElementById('message').textContent = 'Login failed. Please check your credentials.';
        console.error('Error:', error);
    }
});