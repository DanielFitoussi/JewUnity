// כתובת השרת שלך (תעדכן אם צריך)
const API_BASE_URL = 'http://localhost:3005/api/users';

// פונקציה להרשמה
async function registerUser(event) {
  event.preventDefault();

  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const gender = document.getElementById('register-gender').value;
  const birthDate = document.getElementById('register-birthdate').value;
  const firstName = document.getElementById('register-firstname').value.trim();
  const lastName = document.getElementById('register-lastname').value.trim();

  const userData = { username, password, gender, birthDate, firstName, lastName };

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(`Registration error: ${data.error}`);
      return;
    }

    alert('User registered successfully!');
    document.getElementById('register-form').reset();
  } catch (err) {
    console.error(err);
    alert('Server error during registration');
  }
}

// פונקציה להתחברות
async function loginUser(event) {
  event.preventDefault();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  const loginData = { username, password };

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(`Login error: ${data.error}`);
      return;
    }

    // אחסון הטוקן ב-localStorage
    localStorage.setItem('token', data.token);

    alert('User logged in successfully!');
    window.location.href = 'feed.html'; // לדוגמה: ננתב לדף הפיד (בהמשך נבנה אותו)
  } catch (err) {
    console.error(err);
    alert('Server error during login');
  }
}

// חיבור הפונקציות לטפסים
document.getElementById('register-form').addEventListener('submit', registerUser);
document.getElementById('login-form').addEventListener('submit', loginUser);

