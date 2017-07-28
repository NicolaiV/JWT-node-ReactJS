const User = require('./models/user'); // get our mongoose model
const fs = require('fs'); // модуль файловой системы
const tokenInterface = require('./token'); // интерфейс для работы с токеном
const logger = require('./logger'); // модуль логгера

// добавление нового пользователя к БД
function addUser(req, res) {
  logger.info(`Регистрация пользователя ${req.body.name}`);
  // проверка наличия пользователя с таким же именем
  User.findOne({ name: req.body.name }, (err, found) => {
    if (err) throw err;
    if (found) {
      const message = `Пользователь ${req.body.name} уже существует`;
      logger.info(message);
      return res.json({ success: false, message });
    }
    // создание и запись пользователя в БД
    const user = new User({
      name: req.body.name,
      password: req.body.password,
    });
    return user.save((err) => {
      const message = `Пользователь ${req.body.name} успешно создан`;
      if (err) throw err;
      logger.info(message);
      res.json({ success: true, message });
    });
  });
};

// аутентификация и авторизация
function authorization(req, res) {
  // поиск пользователя в БД
   logger.info(`Авториация пользователя ${req.body.name}`);
  User.findOne({
    name: req.body.name,
  }, (err, user) => {
    if (err) throw err;
    if (!user) {
      const message = `Авторизация невозможна. Пользователь ${req.body.name} не найден`;
      logger.info(message);
      res.json({ success: false, message });
    } else if (user) {
      // проверка пароля
      if (!user.checkPassword(req.body.password)) {
        const message = 'Авторизация невозможна. Неверный пароль';
        logger.info(message);
        res.json({ success: false, message: message });
      } else {
        // генерация токена
        const token = tokenInterface.sign(user, {
          expiresIn: 86400, // сутки, в секундах
        });
        res.json({
          success: true,
          token,
        });
      }
    }
  });
};

// обработка запроса данных
function getData(req, res) {
  logger.info('Запрос данных');
  const authorization = req.decoded !== undefined;
  let value = [];
  // данные берутся из файла data.json
  fs.readFile('./data/data.json', (err, data) => {
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
};

module.exports = {
  addUser,
  authorization,
  getData
}