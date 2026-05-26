const mongoose = require('mongoose');

async function connectDB() {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error('Falta la variable MONGO_URI en el archivo .env');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoURI);
  console.log('Conectado a MongoDB');
}

module.exports = connectDB;
