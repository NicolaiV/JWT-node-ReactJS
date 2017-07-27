'use strict';
var token = undefined;

function registration(name, password, callback) {
  var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
  var xhr = new XHR();
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

function authorization(name, password, callback) {
  var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
  var xhr = new XHR();
  xhr.open('POST', '/authenticate', true);
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

function getData(callback) {
  
  var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
  var xhr = new XHR();
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

function disconnect(callback) {
  token = undefined;
  callback(0);
}

window.ee = new EventEmitter();



var AuthenticationAndRegistration = React.createClass({
  getInitialState: function() {
    return {
      hasLogin: token !== undefined
    };
  },
  render: function() {
    var hasLogin = this.state.hasLogin;
	var authTemp;
	if (hasLogin) {
	  authTemp = <div className='add cf'>
		<button onClick={
			() => disconnect((code) => {
				console.log(code)
				this.setState({hasLogin: false})
				token = undefined;
				window.ee.emit('DataUpdate');
			})
		}>Отключение</button>
	  </div>
	} else {
	  authTemp = <div> </div>
	  authTemp = <div className='add cf'>
        <input
          type='text'
          className='add__login'
          placeholder='Ваше имя'
          ref='name'
        />
        <input
          type='text'
          className='add__login'
          placeholder='Ваш пароль'
          ref='password'
        />
		<button onClick={(e) => {
			var name = ReactDOM.findDOMNode(this.refs.name).value
			var password = ReactDOM.findDOMNode(this.refs.password).value
			registration(name, password, (code, data) => { if(data.success === false) alert(data.message)})
		}}>Регистрация</button>
		<button onClick={(e) => {
			var name = ReactDOM.findDOMNode(this.refs.name).value
			var password = ReactDOM.findDOMNode(this.refs.password).value
			e.preventDefault();
			authorization(name, password, (code, data) => {
			  if(data.success) {
				  this.setState({hasLogin: true})
				  window.ee.emit('DataUpdate');
			  } else {
				  alert(data.message)
			  }
			})
		}}>Авторизация</button>
	  </div>
	}
	return <div>{authTemp}</div>
  }
});



var Data = React.createClass({
  
  render: function() {
    var data = this.props.data;
    return <div >
	{data.map((item, index) => {
		var res = []
		for(var i in item) {
			res.push(<p key={i}> {i + ': ' + item[i]} </p> )
		}
		return <div key={index} className='article'>{res}</div>
	})}
    </div>
  }
});

var App = React.createClass({
  getInitialState: function() {
    return {
      data: []
    };
  },
  componentDidMount: function() {
    var self = this;
    window.ee.addListener('DataUpdate', function() {
	  getData((code, data) => {
		if (code === 0 && data.success) {
		  console.log(data)
		  if(data.value){
			  console.log('data.value ')
			  console.log(data.value)
			  self.setState({data: data.value});
		  }
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

ReactDOM.render(
  <div>
    <h1>Тест авторизации</h1>
    <App/>
  </div>,
  document.getElementById('root')
);
window.ee.emit('DataUpdate');