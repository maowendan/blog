var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

// var indexRouter = require('./routes/index');
var routes = require('./routes/index');
var usersRouter = require('./routes/users');

var settings = require('./settings');
var flash = require('connect-flash');

var multer = require('multer');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},
  resave:false,
  saveUninitialized:true,
  store: new MongoStore({
    db: settings.db,
    host: settings.host,
    port: settings.port,
    url: 'mongodb://localhost/blog'
  })
}));
// app.use('/', indexRouter);
// app.use('/users', usersRouter);
routes(app);

//增加文件上传功能
app.use(multer({
  dest: './public/images',
  rename:function(fieldname, filename){
    return filename;
  }
}))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
