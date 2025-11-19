// server/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  brand: String,
  image: String,
  nutritionGrade: String,
  ingredients: String,
  allergens: String,
  // optional: add nutrition object if you want more structure
  nutrition: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('Product', productSchema);
