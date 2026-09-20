const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-form-submit');
const loginErrorMsg = document.getElementById('login-error-msg');

loginButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();

        if (response.ok && data.success) {
            alert('You have successfully logged in.');
            location.reload();
        } else {
            loginErrorMsg.style.display = 'block';
        }
    } catch (err) {
        console.error('Login request failed:', err);
        loginErrorMsg.style.display = 'block';
    }
});
