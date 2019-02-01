// var express = require('express');
// var router = express.Router();

// var app = express();
/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

//路由设计
/*
 * /:首页
 * /login ：用户登录
 * /reg ：用户注册
 * /post ：发表文章
 * /logout ：登出
*/

// module.exports = router;
var crypto = require('crypto'),
    User = require('../models/user');


module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('index', {
      title: '主页',
      user:req.session.user,
      success: req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
  app.get('/reg', function(req, res) {
    res.render('reg', {
      title: '注册',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
  app.post('/reg', function(req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //校验两次输入的密码是否一致
    if(password_re != password ){
      console.log(name)
      req.flash('error', '两次输入的密码不一致，请重新输入！');
      return res.redirect('/reg');//重新重定向至注册页
    }
    //生产密码的md5值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
    });
    //检查用户名是否已经存在
    User.get(newUser.name, function(err, user) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      if(user){
        req.flash('error', '用户已经存在，请重新注册！');
        return res.redirect('/reg');//重定向至注册页
      }
      //如果不存在则新增用户
      newUser.save(function(err, user){
        if(err){
          req.flash('error', err);
          return res.redirect('/reg');
        }
        req.session.user = user;//用户信息存入session
        console.log(req.session.user)
        req.flash('success', '注册成功！');
        res.redirect('/');//注册成功后返回主页
      });
    });
    
  });
  app.get('/login', function(req, res) {
    res.render('login', {title: '登录'});
  });
  app.get('/post', function(req, res) {
    res.render('post', {title: '发表'});
  });
  app.post('/post', function(req, res) {
  });
  app.get('/logout', function(req, res) {
  })
}
