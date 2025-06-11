const User = require('../models/user');

// רישום משתמש
const registerUser = async (req, res) => {
  const { username, password, gender, birthDate, firstName, lastName } = req.body;

  if (!username || !password || !gender || !birthDate || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const newUser = new User({
      username,
      password,
      gender,
      birthDate,
      firstName,
      lastName
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// התחברות משתמש
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'User logged in successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ניקוי כל המשתמשים (למטרת בדיקות)
const clearUsers = async (req, res) => {
  try {
    await User.deleteMany({});
    res.status(200).json({ message: 'All users have been deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  clearUsers,
};
