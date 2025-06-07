const authModel = require('../models/auth')

const registerUser = (req, res) => {
  const { username, password, gender, birthDate, firstName, lastName } = req.body;

  if (!username || !password || !gender || !birthDate || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (authModel.isUsernameTaken(username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  authModel.addUser({ username, password, gender, birthDate, firstName, lastName });
  res.status(201).json({ message: 'User registered successfully' });
};



const loginUser = (req, res) => {
    const { username, password } = req.body

    if (!username || !password)
        return res.status(400).json({ error: 'Username and password are required' });


   const user = authModel.findUser(username, password);

    if (!user)
        return res.status(401).json({ error: 'Invalid username or password' });

    res.status(200).json({ message: 'User logged in successfully' });


}

const clearUsers = (req, res) => {
  authModel.clearUsers();
  res.status(200).json({ message: 'All users have been deleted' });
};


module.exports = {
    registerUser,
    loginUser,
    clearUsers
};