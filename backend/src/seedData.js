const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const connectDB = require('./config/db');

dotenv.config();

// Mock product data with working images
const products = [
  {
    barcode: '3017620422003',
    name: 'Nutella',
    brand: 'Ferrero',
    image: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.633.400.jpg',
    nutritionGrade: 'E',
    ingredients: 'Sugar, Palm Oil, Hazelnuts, Cocoa, Milk, Lecithin, Vanillin',
    allergens: 'Milk, Nuts'
  },
  {
    barcode: '5449000000996',
    name: 'Coca-Cola',
    brand: 'Coca-Cola',
    image: 'https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.957.400.jpg',
    nutritionGrade: 'E',
    ingredients: 'Carbonated Water, Sugar, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine',
    allergens: 'None'
  },
 
  {
    barcode: '7622210449283',
    name: 'Milka Chocolate',
    brand: 'Milka',
    image: 'https://images.openfoodfacts.org/images/products/762/221/044/9283/front_en.605.400.jpg',
    nutritionGrade: 'E',
    ingredients: 'Sugar, Cocoa Butter, Skimmed Milk Powder, Cocoa Mass, Whey Powder',
    allergens: 'Milk, Soy'
  },
  {
    barcode: '0028400199148',
    name: 'Lays Classic Potato Chips',
    brand: 'Lays',
    image: 'https://images.openfoodfacts.org/images/products/002/840/019/9148/front_en.82.400.jpg',
    nutritionGrade: 'D',
    ingredients: 'Potatoes, Vegetable Oil, Salt',
    allergens: 'None'
  }
];

// Seed function
const seedDB = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await Product.deleteMany({});
    console.log('  Cleared existing products');
    
    // Insert mock data
    await Product.insertMany(products);
    console.log(' Mock data added successfully!');
    console.log(` Added ${products.length} products to database`);
    
    process.exit();
  } catch (error) {
    console.error(' Error seeding data:', error);
    process.exit(1);
  }
};

seedDB();