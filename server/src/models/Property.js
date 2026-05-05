const mongoose = require('mongoose');

const codeEntrySchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true }
}, { _id: false });

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  codes: [codeEntrySchema],
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, { timestamps: true });

// Full-text index for search
propertySchema.index({ name: 'text', notes: 'text' });

module.exports = mongoose.model('Property', propertySchema);
