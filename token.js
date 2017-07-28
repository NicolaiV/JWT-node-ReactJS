// работа с токеном вынесена в отдельный модуль для упрощения логики
// таким обрзом проще заменить модуль jwt на что-то другое
const jwt = require('jsonwebtoken'); // модуль для работы с jwt

module.exports = {
  verify: jwt.verify,
  sign: jwt.sign
}