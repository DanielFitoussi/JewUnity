const express = require('express')
const app = express()
const connectDB = require('./config/db')

const userRoutes = require('./routes/user');
const testRoutes = require('./routes/test')
const postsRoutes = require('./routes/posts')
const { connect } = require('mongoose')

const groupRoutes = require('./routes/groups');




connectDB ();

app.use(express.json())
app.use('/api/groups', groupRoutes);
app.use('/', testRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postsRoutes)


app.get('/api', (req, res) => {
  res.send('API is alive');
});




app.listen(3005, () => {
  console.log('✅ Server running on http://localhost:3005');
});
