const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({

username: {
    type: String,
    required: true,
    unique: true // לא יאפשר שני משתמשים עם אותו שם
  },
  password: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  }




})

const User = mongoose.models.User || mongoose.model('User', userSchema);


 module.exports = User;