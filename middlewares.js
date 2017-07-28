const tokenInterface = require('./token'); // интерфейс для работы с токеном
const logger = require('./logger'); // модуль логгера

// проверка токена
function checkToken(req, res, next) {
  // токен передаётся через заголовок
  logger.info('Проверка токена');
  const token = req.headers['x-access-token'];
  if (token && token!=='undefined') {
    tokenInterface.verify(token, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          logger.info('Токен устарел');
          return res.json({ success: false, message: 'Токен устарел. Повторите авторизацию.' });
        } else {
          logger.info('Токен не валиден');
          next(); 
        }
      } else {
        // когда токен не содержит ошибок, его декодированное значение прикрепляется к объекту req,
        // который будет передаваться дальше
        logger.info('Токен валиден');
        req.decoded = decoded;
        next();
      }
    });
  } else {
    logger.info('Токена нет');
    next();
  }
};

module.exports = {
  checkToken
}
