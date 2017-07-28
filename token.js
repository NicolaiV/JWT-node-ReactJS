// работа с токеном вынесена в отдельный модуль для упрощения логики
// таким обрзом проще заменить модуль jwt на что-то другое
const jwt = require('jsonwebtoken'); // модуль для работы с jwt
const config = require('./config'); // конфиг файл

module.exports = {
  verify: (token, callback) => jwt.verify(token, config.secret, callback),
  sign: (user, options) => jwt.sign(user, config.secret, options)
}