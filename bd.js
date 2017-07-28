const mongoose = require('mongoose');// интерфейс базы данных
const bluebird = require('bluebird'); // модуль для промисов
const config = require('./config'); // конфиг файл

mongoose.Promise = bluebird;

module.exports = {
  connect: () => mongoose.connect(config.database, { useMongoClient: true }), // подключение к базе данных
  mongoose
};