const jwt = require('jsonwebtoken');   
const JWT_SECRET = 'mySecretKey123';   // ודא שזה הסוד שבו השתמשת ביצירת הטוקן

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; 
  const token = authHeader && authHeader.split(' ')[1];        

  console.log("🛡️ Token Received:", token);

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({ error: 'No token provided' });  
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("❌ Token verification failed:", err.message);
      return res.status(403).json({ error: 'Invalid token' });  
    }

    console.log("✅ Token validated successfully:", user);
    req.user = user;     
    next();
  });
};

module.exports = authenticateToken;
