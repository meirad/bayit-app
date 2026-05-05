const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  locale: {
    type: String,
    enum: ['he', 'en'],
    default: 'he'
  },
  householdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
