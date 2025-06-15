const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'mySecretKey123';

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

    // ולידציה 1: אורך סיסמה מינימלי
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // ולידציה 2: פורמט username (אותיות, מספרים וקו תחתון בלבד)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers and underscores' });
    }

    // ולידציה 3: תאריך לידה אינו בעתיד
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    if (birthDateObj > today) {
      return res.status(400).json({ error: 'Birth date cannot be in the future' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username,
      password: hashedPassword,
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
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }


    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'User logged in successfully', token });  // 🚀 כאן החזרת הטוקן נוספה
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
