const mongoose = require('mongoose')

const rankingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  score: {
    type: Number,
    required: true
  },
  correct: {
    type: Number,
    default: 0
  },
  wrong: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Ranking', rankingSchema)
