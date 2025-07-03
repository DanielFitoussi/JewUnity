require('dotenv').config(); // ← טוען את המפתחות מתוך .env
const express = require('express')
const app = express()
const connectDB = require('./config/db')

const userRoutes = require('./routes/user');
const testRoutes = require('./routes/test')
const postsRoutes = require('./routes/posts')
const { connect } = require('mongoose')

const groupRoutes = require('./routes/groups');



const cors = require('cors');

connectDB ();

app.use(cors());
app.use(express.json())
app.use(express.static('public'));
app.use('/api/groups', groupRoutes);
app.use('/', testRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postsRoutes)
app.use('/uploads', express.static('uploads'));





app.get('/api', (req, res) => {
  res.send('API is alive');
});

app.get('/api/weather-key', (req, res) => {
  res.json({ apiKey: process.env.OPENWEATHER_API_KEY });
});





app.listen(3005, () => {
  console.log('✅ Server running on http://localhost:3005');
});
