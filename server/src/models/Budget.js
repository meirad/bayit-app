const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  householdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household',
    required: true
  },
  month: {
    type: String,
    required: true
  },
  categories: [{
    categoryName: {
      type: String,
      required: true
    },
    budgetedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  }]
}, {
  timestamps: true
});

budgetSchema.index({ householdId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
