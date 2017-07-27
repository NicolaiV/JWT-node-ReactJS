/*TODO: 
  Cекретный ключ рандомно генерировать при создании каждого токена и писать в БД;
  Хешировать пароль
  Сверять данные из токена с данными пользователя
  Подключить сетевую БД
  Использовать линтер
  Перечетсть стаьи по теме и реализовать средства защиты
  Комментировать
  Промисы и async/await Промисы и async/await
  
*/

const express = require('express'); //фреймворк
const bodyParser = require('body-parser'); //модуль для парсинга параметров запросов
const jwt = require('jsonwebtoken'); //модуль для работы с jwt
const config = require('./config');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
Promise = bluebird;
mongoose.Promise = bluebird;
const User = require('./models/user'); // get our mongoose model

const app = express();
const port = process.env.PORT || 8080;
mongoose.connect(config.database, { useMongoClient: true }); 
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

const fs = require('fs');

//User.collection.drop();


app.post('/add_user', function(req, res) {
  User.findOne({name: req.body.name}, (err, finded) => {
	  if (finded) {
		  res.json({ success: false, message:'Пользователь с таким именем уже существует'})
		  return;
	  }
	  if(!req.body) return res.sendStatus(400);
	   const user = new User({ 
		name: req.body.name,
		password: req.body.password
	  });
	   user.save(function(err) {
		if (err) throw err;
		console.log('User saved successfully');
		res.json({ success: true });
	  });
  })
});


app.post('/authenticate', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;
    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {
        const token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 1440 // expires in 24 hours
        });
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token
        });
      }   
    }
  });
});

app.use(function(req, res, next) {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (token) {
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        req.decoded = decoded;    
        next();
      }
    });
  } else {
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
  }
});

app.get('/data', function(req, res) {
  User.find({}, function(err, users) {
    res.json({ success: true, value: [{'Некие даннные':'секретные данные'}]});
  });
});   


app.listen(port);
console.log('Приложение запущено на http://localhost:' + port);