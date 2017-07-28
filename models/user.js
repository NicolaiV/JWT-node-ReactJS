const bd = require('../bd'); // интерфейс БД
const crypto = require('crypto'); // модуль шифрования

// схема записи пользователя
const userSchema = new bd.mongoose.Schema({
  // имя пользователя должно быть уникальным
  name: {
    type: String,
    unique: true,
  },
  passwordHash: String, // пароль хранится в хэщированном виде
  salt: String, // код для хэширования пароля
}, {
  timestamps: true,
});

// работа с паролем, запись его в хэшированном виде
userSchema.virtual('password')
  .set( function(password) {
    this.salt = crypto.randomBytes(128).toString('base64');
    this.passwordHash = crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1');
  });

// функция проверки пароля на соответствие хэшированному
userSchema.methods.checkPassword = function (password) {
  if (!password) return false;
  if (!this.passwordHash) return false;
  return crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1').toString() === this.passwordHash;
};

module.exports = bd.mongoose.model('User', userSchema);
