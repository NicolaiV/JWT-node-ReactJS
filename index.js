'use strict';

const express = require('express'); // фреймворк
const bodyParser = require('body-parser'); // модуль для парсинга параметров запросов
const jwt = require('jsonwebtoken'); // модуль для работы с jwt
const config = require('./config'); // конфиг файл
const mongoose = require('mongoose');// интерфейс базы данных
const fs = require('fs'); // модуль файловой системы
const User = require('./models/user'); // get our mongoose model

const app = express();
const port = process.env.PORT || 8080; // установка порта

mongoose.Promise = Promise;

mongoose.connect(config.database, { useMongoClient: true }); // подключение к базе данных
app.set('superSecret', config.secret); // установка ключа шифрования токенов
// настройка парсинга запросов
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// настройка доступка к html
app.use(express.static(`${__dirname}/public`));

// проверка токена
app.use((req, res, next) => {
  // токен передаётся через заголовок
  const token = req.headers['x-access-token'];
  if (token) {
    jwt.verify(token, app.get('superSecret'), (err, decoded) => {
      if (err) {
        next();
      } else {
        // когда токен не содержит ошибок, его декодированное значение прикрепляется к объекту req,
        // который будет передаваться дальше
        req.decoded = decoded;
        next();
      }
    });
  } else {
    next();
  }
});

// добавление нового пользователя к БД
app.post('/add_user', (req, res) => {
  // проверка наличия пользователя с таким же именем
  User.findOne({ name: req.body.name }, (err, finded) => {
    if (err) throw err;
    if (finded) {
      return res.json({ success: false, message: 'Пользователь с таким именем уже существует.' });
    }
    // создание и запись пользователя в БД
    const user = new User({
      name: req.body.name,
      password: req.body.password,
    });
    return user.save((err) => {
      if (err) throw err;
      res.json({ success: true, message: 'Пользователь успешно создан.' });
    });
  });
});

// аутентификация и авторизация
app.post('/authorization', (req, res) => {
  // поиск пользователя в БД
  User.findOne({
    name: req.body.name,
  }, (err, user) => {
    if (err) throw err;
    if (!user) {
      res.json({ success: false, message: 'Авторизация невозможна. Пользователь не найден.' });
    } else if (user) {
      // проверка пароля
      if (!user.checkPassword(req.body.password)) {
        res.json({ success: false, message: 'Авторизация невозможна. Неверный пароль.' });
      } else {
        // генерация токена
        const token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 86400, // сутки, в секундах
        });
        res.json({
          success: true,
          token,
        });
      }
    }
  });
});

// обработка запроса данных
app.get('/data', (req, res) => {
  const authorization = req.decoded !== undefined;
  let value = [];
  // данные берутся из файла data.json
  fs.readFile('./data.json', (err, data) => {
    if (err) {
      return res.json({ success: false, message: 'Ошибка чтения данных.' });
    }
    value = JSON.parse(data.toString());
    if (!authorization) {
      // если пользователь не авторизирован на сайте, то нужна фильтрация
      // ему будут доступны только публичные элементы
      value = value.filter(item => (item.public));
    }
    return res.json({ success: true, value });
  });
});

app.listen(port);
console.log(`Приложение запущено на http://localhost:${port}`);
