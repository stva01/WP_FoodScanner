// server/seed.js
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Product = require('./models/Product');

dotenv.config();

const products = [
  {
    barcode: '3017620422003',
    name: 'Nutella',
    brand: 'Ferrero',
    image: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.633.400.jpg',
    nutritionGrade: 'E',
    ingredients: 'Sugar, Palm Oil, Hazelnuts, Cocoa, Milk, Lecithin, Vanillin',
    allergens: 'Milk, Nuts',
    nutrition: { calories: '546 kcal/100g', fat: '31g', carbs: '57g', protein: '6g' }
  },
  {
    barcode: '5449000000996',
    name: 'Coca-Cola',
    brand: 'Coca-Cola',
    image: 'https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.957.400.jpg',
    nutritionGrade: 'E',
    ingredients: 'Carbonated Water, Sugar, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine',
    allergens: 'None',
    nutrition: { calories: '42 kcal/100ml', sugar: '10.6g', fat: '0g', protein: '0g' }
  },
  {
    barcode: '7622210449283',
    name: 'Milka Chocolate',
    brand: 'Milka',
    image: 'https://images.openfoodfacts.org/images/products/762/221/044/9283/front_en.605.400.jpg',
    nutritionGrade: 'E',
    ingredients: 'Sugar, Cocoa Butter, Skimmed Milk Powder, Cocoa Mass, Whey Powder',
    allergens: 'Milk, Soy',
    nutrition: { calories: '530 kcal/100g', fat: '30g', carbs: '55g', protein: '6g' }
  },
  {
    barcode: '0028400199148',
    name: 'Lays Classic Potato Chips',
    brand: 'Lays',
    image: 'https://images.openfoodfacts.org/images/products/002/840/019/9148/front_en.82.400.jpg',
    nutritionGrade: 'D',
    ingredients: 'Potatoes, Vegetable Oil, Salt',
    allergens: 'None',
    nutrition: { calories: '536 kcal/100g', fat: '34g', carbs: '53g', protein: '7g' }
  }
];

const seedDB = async () => {
  try {
    await connectDB();
    await Product.deleteMany({});
    console.log('Cleared existing products');
    await Product.insertMany(products);
    console.log(`Added ${products.length} products`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDB();
