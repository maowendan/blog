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
    User = require('../models/user'),
    Post = require('../models/post')


//注册checkNotLogin和checkLogin函数来判断是否是登录状态和登出状态
function checkLogin(req, res, next){
  if(!req.session.user){
    req.flash('error', '未登录！');
    res.redirect('/login');//重定向至登录页
  }
  next();
}
function checkNotLogin(req, res, next){
  if(req.session.user){
    req.flash('error','已登录！');
    res.redirect('back');//返回之前的页面
  }
  next();
}
module.exports = function(app) {
  app.get('/', function(req, res) {
    Post.get(null, function(err, posts){
      if(err){
        posts= [];
      }
      res.render('index', {
        title: '主页',
        user:req.session.user,
        posts: posts,
        success: req.flash('success').toString(),
        error:req.flash('error').toString()
      });
    });
  });
  app.get('/reg', checkNotLogin);
  app.get('/reg', function(req, res) {
    res.render('reg', {
      title: '注册',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
  app.post('/reg', checkNotLogin)
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
  app.get('/login', checkNotLogin)
  app.get('/login', function(req, res){
    res.render('login', {
      title: '登录',
      user: req.body.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  })
  app.post('/login', checkNotLogin)
  app.post('/login', function(req, res) {

    //生成密码的md5值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function(err, user){
      if(!user){
        req.flash('error', '该用户不存在');
        return res.redirect('/login');//用户不存在跳转到登录页
      }
      if(user.password != password){
        req.flash('error', '密码错误！');
        return res.redirect('/login')//密码错误重定向到登录页
      }
      //用户名和密码都匹配后，将用户信息存入session
      req.session.user = user;
      req.flash('success', '登录成功！');
      res.redirect('/');//登录成功后跳转到主页
    })
    // res.render('login', {title: '登录'});
  });
  app.get('/post', checkLogin)
  app.get('/post', function(req, res) {
    // res.render('post', {title: '发表'});
    res.render('post', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/post', checkLogin)
  app.post('/post', function(req, res) {
    var currentUser = req.session.user,
        post = new Post(currentUser.name, req.body.title, req.body.post);
    post.save(function(err){
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      req.flash('success','发布成功！');
      res.redirect('/');//发布成功跳转到主页
    })
  });
  app.get('/logout', checkLogin)
  app.get('/logout', function(req, res) {
    req.session.user = null;
    req.flash('success', '登出成功！');
    res.redirect('/');//登出成功后跳转到主页
  });
  app.get('/upload', checkLogin);
  app.get('/upload', function(req, res){
    console.log('get')
    res.render('upload',{
      title: '1111111',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/upload', checkLogin);
  app.post('/upload', function(req, res){
    console.log('post')
    req.flash('success', '文件上传成功！');
    res.redirect('/upload')
  })
}
