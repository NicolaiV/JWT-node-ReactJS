'use strict';
let token = undefined;

/**
 * Регистрация пользователя
 * @param name строка содержащяя имя
 * @param password строка содержащая пароль
 * @param callback
 */
 function registration(name, password, callback) {
  const XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
  const xhr = new XHR();
  xhr.open('POST', '/add_user', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
    callback(0, JSON.parse(this.responseText));
  }
  xhr.onerror = function() {
    callback(1);
  }
  xhr.send(JSON.stringify({name, password}));
}

/**
 * Авторизация пользователя
 * @param name строка содержащяя имя
 * @param password строка содержащая пароль
 * @param callback
 */
function authorization(name, password, callback) {
  const XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
  const xhr = new XHR();
  xhr.open('POST', '/authorization', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
    const data = JSON.parse(this.responseText);
    token = data.token;
    callback(0, data);
  }
  xhr.onerror = function() {
    callback(1);
  }
  xhr.send(JSON.stringify({name, password}));
}

/**
 * Получение данных с сервера
 * @param callback
 */
 function getData(callback) {
  const XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
  const xhr = new XHR();
  xhr.open('GET', '/data', true);
  xhr.setRequestHeader('x-access-token', token);
  xhr.onload = function() {
    const data = JSON.parse(this.responseText);
    callback(0, data);
  }
  xhr.onerror = function() {
    callback(1);
  }
  xhr.send();
}

/**
 * Удаление значения токена и отключение автоиизации
 * @param callback
 */
 function disconnect(callback) {
  token = undefined;
  callback(0);
}

window.ee = new EventEmitter();

const AuthenticationAndRegistration = React.createClass({
  self: this,
  getInitialState: function() {
    return {
      hasLogin: token !== undefined
    };
  },
  exit: function(e) {
    e.preventDefault();
    disconnect((code) => {
      // сбросить токен и обновить данные
      this.setState({hasLogin: false})
      token = undefined;
      window.ee.emit('DataUpdate');
    })
  },
  registration: function(e) {
    e.preventDefault();
    const name = ReactDOM.findDOMNode(this.refs.name).value
    const password = ReactDOM.findDOMNode(this.refs.password).value
    registration(name, password, (code, data) => {
      if (data.success === false)
        alert(data.message)
    })
  },
  authorization: function(e) {
    e.preventDefault();
    const name = ReactDOM.findDOMNode(this.refs.name).value;
    const password = ReactDOM.findDOMNode(this.refs.password).value;
    authorization(name, password, (code, data) => {
      if(data.success) {
        this.setState({hasLogin: true})
        window.ee.emit('DataUpdate');
      } else {
        alert(data.message)
      }
    })
  },
  render: function() {
    const hasLogin = this.state.hasLogin;
    let authTemp;
    // эта часть интерфейса меняет вид, в зависимости от того, пройдена ли авторизация
    if (hasLogin) {
      // если да, то нужно отобразить только кнопку выхода
      authTemp =
        <div className='add cf'>
          <button onClick={this.exit}>Выход</button>
        </div>
    } else {
      authTemp =
        <div className='add cf'>
          <input
            type='text'
            className='add__text'
            placeholder='Ваше имя'
            ref='name'
          />
          <input
            type='text'
            className='add__text'
            placeholder='Ваш пароль'
            ref='password'
          />
          <button onClick={this.registration}>Регистрация</button>
          <button onClick={this.authorization}>Авторизация</button>
        </div>
    }
    return <div>{authTemp}</div>
  }
});

// по массиву данных построить для каждого его элемента div с упорядоченным в текстовом виде содержимым
const Data = React.createClass({
  render: function() {
    const data = this.props.data;
    return <div>
    {data.map((item, index) => {
        const res = []
        for(let i in item) {
           res.push(<p key={i}> {i + ': ' + item[i]} </p> )
        }
        return <div key={index} className='article'>{res}</div>
    })}
    </div>
  }
});

// класс приложения
const App = React.createClass({
  // установка начальных данных - пустой массив
  getInitialState: function() {
    return {
      data: []
    };
  },
  componentDidMount: function() {
    const self = this;
    // обработка команды обновления данных
    window.ee.addListener('DataUpdate', function() {
      // асинхронно получить данные с сервера
      getData((code, data) => {
        if (code === 0 && data.success) {
          // разместить данные
          self.setState({data: data.value});
        }
      });
    });
  },
  componentWillUnmount: function() {
    window.ee.removeListener('DataUpdate');
  },
  render: function() {
    return (
      <div className='app'>
        <AuthenticationAndRegistration />
        <h3>Данные</h3>
        <Data data={this.state.data}/>
      </div>
    );
  }
});

// установка корня с которым работает реакт
ReactDOM.render(
  <div>
    <h1>Тест авторизации</h1>
    <App/>
  </div>,
  document.getElementById('root')
);
// вызов асинхронной загурзки данных с сервера
window.ee.emit('DataUpdate');
