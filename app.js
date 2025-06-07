const express = require('express')
const app = express()
const authRoutes = require('./routes/auth')
const testRoutes = require('./routes/test')


app.use(express.json())

app.use('/', testRoutes)
app.use('/api', authRoutes);


app.get('/api', (req, res) => {
  res.send('API is alive');
});




app.listen(3005, () => {
  console.log('✅ Server running on http://localhost:3005');
});
