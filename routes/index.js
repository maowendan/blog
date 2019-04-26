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
    Post = require('../models/post'),
    Comment = require('../models/comments');


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
    //判断是否为第一页，并把请求的页数转换成number类型
    var page = req.query.p?parseInt(req.query.p):1;
    //查询并返回page页的10篇文章
    Post.getTen(null, page, function(err, posts, total) {
      if(err){
        posts = []
      }
      res.render('index',{
        title:"主页",
        posts:posts,
        page:page,
        isFirstPage:(page-1) == 0,
        isLastPage:((page-1) * 10 + posts.length) == total,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      })
    })
    // Post.getAll(null, function(err, posts){
    //   if(err){
    //     posts= [];
    //   }
    //   res.render('index', {
    //     title: '主页',
    //     user:req.session.user,
    //     posts: posts,
    //     success: req.flash('success').toString(),
    //     error:req.flash('error').toString()
    //   });
    // });
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
    console.log('post')
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
      title: '上传文件',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/upload', checkLogin);
  app.post('/upload', function(req, res){
    console.log('post')
    req.flash('success', '文件上传成功！');
    // res.header("Location"," ")
    res.redirect('/upload');
    // res.location('/upload')
  })
//添加存档路由
  app.get('/archive',function(req, res) {
    Post.getArchive(function(err, posts) {
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render("archive",{
        title:"存档",
        posts:posts,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      })
    })
  })

  app.get('/u/:name', function(req, res) {
    //检查用户是否存在
    var page = req.query.p ? parseInt(req.query.p):1;

    User.get(req.params.name, function(err, user) {
      if(!user){
        req.flash('error', '用户不存在！');
        return res.redirect('/');//用户不存在跳转到主页
      }
      //查询并返回该用户第page页的10篇文章
      Post.getTen(user.name, page, function(err, posts, total) {
        if(err){
          req.flash('error',err);
          return res.redirect('/');
        }
        res.render('user', {
          title:user.name,
          posts:posts,
          page:page,
          user:req.session.user,
          isFirstPage:(page - 1) == 0,
          isLastPage:((page -1) * 10 + posts.length) == total,
          success: req.flash('success').toString(),
          error:req.flash('error').toString()
        })
      })
      // Post.getAll(user.name, function(err, posts) {
      //   if(err){
      //     req.flash('error', err);
      //     return res.redirect('/')
      //   }
      //   res.render('user', {
      //     title: user.name,
      //     posts: posts,
      //     user: req.session.user,
      //     success: req.flash('success').toString(),
      //     error: req.flash('error').toString()
      //   });
      // });
    });
  });
  app.get('/u/:name/:day/:title', function(req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
      if(err){
        console.log('出错了')
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('article', {
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  })
  app.get('/edit/:name/:day/:title', checkLogin)
  app.get('/edit/:name/:day/:title', function(req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
      res.render('edit', {
        title: '编辑',
        post: post,
        user: currentUser,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function(req, res) {
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title,req.body.post, function(err){
      console.log(currentUser.name +'-'+ req.params.day+'-'+req.params.title)
      var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
      if(err){
        req.flash('error', err);
        res.redirect(url)
      }
      req.flash('success', '修改成功');
      res.redirect(url);//修改成功，返回文章首页
    })
  })
  app.get('/remove/:name/:day/:title', checkLogin)
  app.get('/remove/:name/:day/:title', function(req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function(err,) {
      if(err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success','删除成功');
      res.redirect('/')
    })
  })
  app.post('/u/:name/:day/:title', function(req, res) {
    var date = new Date();
    var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
    date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());

    var comment = {
      name: req.body.name,
      email: req.body.email,
      website: req.body.website,
      time: time,
      content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment)
    newComment.save(function(err) {
      if(err){
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '留言成功');
      res.redirect('back')
    })
  })
}
