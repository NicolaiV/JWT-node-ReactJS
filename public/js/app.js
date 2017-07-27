'use strict';

var my_news = [
  {
    author: 'Саша Печкин',
    text: 'В четчерг, четвертого числа...',
    bigText: 'в четыре с четвертью часа четыре чёрненьких чумазеньких чертёнка чертили чёрными чернилами чертёж.'
  },
  {
    author: 'Просто Вася',
    text: 'Считаю, что $ должен стоить 35 рублей!',
    bigText: 'А евро 42!'
  },
  {
    author: 'Гость',
    text: 'Бесплатно. Скачать. Лучший сайт - http://localhost:3000',
    bigText: 'На самом деле платно, просто нужно прочитать очень длинное лицензионное соглашение'
  }
];

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

/*getData((code, data) => {
  console.log(data)
  authorization('wwweeerrrr', 'wwweeerrrr', (code, data) => {
	console.log(data);
	getData((code, data) => console.log(data))
  })
})*/


var Article = React.createClass({
  propTypes: {
    data: React.PropTypes.shape({
      author: React.PropTypes.string.isRequired,
      text: React.PropTypes.string.isRequired,
      bigText: React.PropTypes.string.isRequired
    })
  },
  getInitialState: function() {
    return {
      visible: false
    };
  },
  readmoreClick: function(e) {
    e.preventDefault();
    this.setState({visible: true});
  },
  render: function() {
    var author = this.props.data.author,
        text = this.props.data.text,
        bigText = this.props.data.bigText,
        visible = this.state.visible;

    return (
      <div className='article'>
        <p className='news__author'>{author}:</p>
        <p className='news__text'>{text}</p>
        <a href="#"
          onClick={this.readmoreClick}
          className={'news__readmore ' + (visible ? 'none': '')}>
          Подробнее
        </a>
        <p className={'news__big-text ' + (visible ? '': 'none')}>{bigText}</p>
      </div>
    )
  }
});

var News = React.createClass({
  propTypes: {
    data: React.PropTypes.array.isRequired
  },
  getInitialState: function() {
    return {
      counter: 0
    }
  },
  render: function() {
    var data = this.props.data;
    var newsTemplate;

    if (data.length > 0) {
      newsTemplate = data.map(function(item, index) {
        return (
          <div key={index}>
            <Article data={item} />
          </div>
        )
      })
    } else {
      newsTemplate = <p>К сожалению новостей нет</p>
    }

    return (
      <div className='news'>
        {newsTemplate}
        <strong
          className={'news__count ' + (data.length > 0 ? '':'none') }>Всего новостей: {data.length}</strong>
      </div>
    );
  }
});

var Add = React.createClass({
  getInitialState: function() {
    return {
      agreeNotChecked: true,
      authorIsEmpty: true,
      textIsEmpty: true
    };
  },
  componentDidMount: function() {
    ReactDOM.findDOMNode(this.refs.author).focus();
  },
  onBtnClickHandler: function(e) {
    e.preventDefault();
    var textEl = ReactDOM.findDOMNode(this.refs.text);

    var author = ReactDOM.findDOMNode(this.refs.author).value;
    var text = textEl.value;

    var item = [{
      author: author,
      text: text,
      bigText: '...'
    }];

    window.ee.emit('News.add', item);

    textEl.value = '';
    this.setState({textIsEmpty: true});
  },
  onCheckRuleClick: function(e) {
    this.setState({agreeNotChecked: !this.state.agreeNotChecked});
  },
  onFieldChange: function(fieldName, e) {
    if (e.target.value.trim().length > 0) {
      this.setState({[''+fieldName]:false})
    } else {
      this.setState({[''+fieldName]:true})
    }
  },
  render: function() {
    var agreeNotChecked = this.state.agreeNotChecked,
        authorIsEmpty = this.state.authorIsEmpty,
        textIsEmpty = this.state.textIsEmpty;
    return (
      <form className='add cf'>
        <input
          type='text'
          className='add__author'
          onChange={this.onFieldChange.bind(this, 'authorIsEmpty')}
          placeholder='Ваше имя'
          ref='author'
        />
        <textarea
          className='add__text'
          onChange={this.onFieldChange.bind(this, 'textIsEmpty')}
          placeholder='Текст новости'
          ref='text'
        ></textarea>
        <label className='add__checkrule'>
          <input type='checkbox' ref='checkrule' onChange={this.onCheckRuleClick}/>Я согласен с правилами
        </label>

        <button
          className='add__btn'
          onClick={this.onBtnClickHandler}
          ref='alert_button'
          disabled={agreeNotChecked || authorIsEmpty || textIsEmpty}
          >
          Опубликовать новость
        </button>
      </form>
    );
  }
});

var App = React.createClass({
  getInitialState: function() {
    return {
      news: my_news
    };
  },
  componentDidMount: function() {
    var self = this;
    window.ee.addListener('News.add', function(item) {
      var nextNews = item.concat(self.state.news);
      self.setState({news: nextNews});
    });
  },
  componentWillUnmount: function() {
    window.ee.removeListener('News.add');
  },
  render: function() {
    return (
      <div className='app'>
		<button onClick={() => registration('rrr','rrr', (code, data) => console.log(data))}>Регистрация</button>
		<button onClick={() => authorization('rrr','rrr', (code, data) => console.log(data))}>Авторизация</button>
		<button onClick={() => getData((code, data) => console.log(data))}>Данные</button>
		<button onClick={() => disconnect((code) => console.log(code))}>Отключение</button>
        <Add />
        <h3>Авторизация</h3>
        <h3>Публичные данные</h3>
        <News data={this.state.news} />
        <h3>Приватные данные</h3>
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