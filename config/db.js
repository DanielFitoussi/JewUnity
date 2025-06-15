const mongoose = require ('mongoose')

const connectDB = async () =>{
 try {
    await mongoose.connect('mongodb://localhost:27017/jewunity')
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // סוגר את השרת אם יש כשלון
  }
};

module.exports = connectDB;







