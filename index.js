'use strict';

const express = require('express'); // фреймворк
const bodyParser = require('body-parser'); // модуль для парсинга параметров запросов
const config = require('./config'); // конфиг файл
const mongoose = require('mongoose');// интерфейс базы данных
const bluebird = require('bluebird'); // модуль для промисов
const handlers = require('./handlers'); // модуль обработчиков
const log4js = require('log4js'); // модуль логгирования

const app = express();
const port = process.env.PORT || config.port; // установка порта
const logger = log4js.getLogger();
logger.level = 'info';

mongoose.Promise = bluebird;

mongoose.connect(config.database, { useMongoClient: true }); // подключение к базе данных
app.set('superSecret', config.secret); // установка ключа шифрования токенов
// настройка парсинга запросов
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// настройка доступка к html
app.use(express.static(`${__dirname}/public`));

handlers.setApp(app, logger);
app.use(handlers.checkToken);
app.post('/add_user', handlers.addUser);
app.post('/authorization', handlers.authorization);
app.get('/data', handlers.getData);

app.listen(port);
logger.info(`Приложение запускается на http://localhost:${port}`);
