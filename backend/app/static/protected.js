document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('access_token');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Fetch user info
    fetch('/users/me/', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('userInfo').textContent = `Hello, ${data.full_name || data.username}`;
    })
    .catch(error => {
        console.error('Error fetching user info:', error);
        window.location.href = '/login';
    });

    // Logout button
    document.getElementById('logoutButton').addEventListener('click', function () {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    });
});
