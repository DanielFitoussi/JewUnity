const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ✅ הוספת שדה address
  address: { type: String, default: '' },

  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  }],
  location: {
  lat: { type: Number },
  lng: { type: Number }
},

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', groupSchema);
