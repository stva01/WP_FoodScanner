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
  allergens: String
});

module.exports = mongoose.model('Product', productSchema);