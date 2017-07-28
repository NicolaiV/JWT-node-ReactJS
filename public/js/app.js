'use strict';

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
    localStorage["token"] = data.token;
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
  if (localStorage["token"]) {
    xhr.setRequestHeader('x-access-token', localStorage["token"]);
  }
  xhr.onload = function() {
    const data = JSON.parse(this.responseText);
    if (!data.success) {
      alert(data.message);
      window.ee.emit('disconnect');
    }
    callback(0, data)
  }
  xhr.onerror = function() {
    callback(1);
  }
  xhr.send();
}

window.ee = new EventEmitter();

const AuthenticationAndRegistration = React.createClass({
  componentDidMount: function() {
    const self = this;
    window.ee.addListener('disconnect', function() {
      localStorage["token"] = undefined;
      self.setState({hasLogin: false})
      window.ee.emit('DataUpdate');
    });
  },
  componentWillUnmount: function() {
    window.ee.removeListener('disconnect');
  },
  self: this,
  getInitialState: function() {
    return {
      hasLogin: localStorage["token"] !== undefined && localStorage["token"] !== 'undefined',
      nameIsEmpty: true,
      passwordIsEmpty: true
    };
  },
  exit: function(e) {
    e.preventDefault();
    window.ee.emit('disconnect');
  },
  registration: function(e) {
    e.preventDefault();
    const name = ReactDOM.findDOMNode(this.refs.name).value
    const password = ReactDOM.findDOMNode(this.refs.password).value
    registration(name, password, (code, data) => {
      if (data.success === false) {
        alert(data.message)
	  } else {
        alert(`Пользователь ${name} успешно зарегистрирован`)
	  }
    })
  },
  authorization: function(e) {
    e.preventDefault();
    const name = ReactDOM.findDOMNode(this.refs.name).value;
    const password = ReactDOM.findDOMNode(this.refs.password).value;
    authorization(name, password, (code, data) => {
      if(data.success) {
        this.setState({
          hasLogin: true,
          nameIsEmpty: true,
          passwordIsEmpty: true
        })
        window.ee.emit('DataUpdate');
        alert(`Вы вошли как пользователь ${name}`)
      } else {
        alert(data.message)
      }
    })
  },
  onFieldChange: function(fieldName, e) {
    if (e.target.value.trim().length > 0) {
      this.setState({[''+fieldName]:false})
    } else {
      this.setState({[''+fieldName]:true})
    }
  },
  render: function() {
    let nameIsEmpty = this.state.nameIsEmpty;
    let passwordIsEmpty = this.state.passwordIsEmpty;
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
            onChange={this.onFieldChange.bind(this, 'nameIsEmpty')}
            ref='name'
          />
          <input
            type='text'
            className='add__text'
            placeholder='Ваш пароль'
            onChange={this.onFieldChange.bind(this, 'passwordIsEmpty')}
            ref='password'
          />
          <button onClick={this.registration} disabled={nameIsEmpty || passwordIsEmpty}>Регистрация</button>
          <button onClick={this.authorization}  disabled={nameIsEmpty || passwordIsEmpty}>Авторизация</button>
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
