const users = []

function addUser(user) {
  users.push(user);
}

// פונקציה לחיפוש לפי שם משתמש וסיסמה
function findUser(username, password) {
  return users.find(u => u.username === username && u.password === password);
}

// פונקציה לבדוק אם שם משתמש כבר קיים
function isUsernameTaken(username) {
  return users.some(u => u.username === username);
}

function clearUsers() {
  users.length = 0;
}


module.exports = {
  addUser,
  findUser,
  isUsernameTaken,
  clearUsers
};