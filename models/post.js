var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, post){
    this.name = name;
    this.title = title;
    this.post = post;
}
module.exports = Post;

//存储一篇文章及其其他信息
Post.prototype.save = function(callback){
    var date = new Date();
    //存储各种事件格式，方便以后扩展
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear()+'-'+(date.getMonth() + 1),
        day: date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
        minute: date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+" "+date.getHours()+":"+(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())
    }

    //要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        post: this.post,
        comments:[]
    };
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //将文章插入posts集合
            collection.insert(post, {
                safe: true
            }, function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
}

//读取文章及其内容
Post.getAll = function(name, callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            //根据query对象查阅文章
            collection.find(query).sort({
                time: -1
            }).toArray(function(err, docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                docs.forEach(function(doc){
                    doc.post = markdown.toHTML(doc.post);
                })
                callback(null, docs);//成功，以数组的形式返回查阅结果
            });
        });
    });
};

//获取一篇文章
Post.getOne = function(name, day, title, callback) {
    //打开数据库
    mongodb.open(function(err, db) {
        if(err){
            console.log('这也出错了')
            return callback(err);
        };
        //读取posts集合
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名以及发表日期文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            },function(err, doc) {
                mongodb.close();
                if(err){
                    return callback(err); 
                }
                //解析markdown格式文件
                if(doc){
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment) {
                        comment.content = markdown.toHTML(comment.content)
                    })
                }
                callback(null, doc);//返回查询到的文章
            });
        });
    });
};

//返回原始编辑文章内容，进行内容编辑并保存
Post.edit = function(name, day, title, callback) {
    //打开数据库
    mongodb.open(function(err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根据用户名，发表时间以及文章名称进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, doc) {
                mongodb.close();
                if(err) {
                    return callback(err)
                };
                callback(null, doc);//返回查询到的一篇文章（原始格式）
            })
        })
    })
}

//保存并更新修改后的文章
Post.update = function(name, day, title,post, callback) {
    //打开数据库
    mongodb.open(function(err, db) {
        if(err){
            return callback(err);
        };
        //读取posts集合
        db.collection('posts', function(err, collection) {
            if(err){
                console.log('报错1')
                mongodb.close();
                return callback(err);
            };
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $set: {post: post}
            }, function(err) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};
Post.remove = function(name, day, title, callback) {
    mongodb.open(function(err, db) {
       if(err){
           return callback(err)
       }
       db.collection('posts', function(err, collection) {
           if(err){
               mongodb.close()
               return callback(err) 
           }
           collection.remove({
               "name": name,
               "time.day":day,
               "title":title
           },{
               w:1
           },function(err){
               mongodb.close()
               if(err){
                   return callback(err);
               }
               callback(err)
           })
       }) 
    })
}
//获取10篇文章
Post.getTen = function(name, page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err)
        }
        //读取posts集合
        db.collection('posts', function(err, collection) {
            if(err){
                mongodb.close()
                return callback(err)
            }
            //定义空对象
            var query = {};
            if(name){
                query.name = name
            }
            //使用count返回特定查询文档数 total
            collection.count(query, function(err, total) {
                //根据query对象查询，并跳过（page-1）*10个结果，返回之后的10个结果
                collection.find(query, {
                    skip: (page - 1)*10,
                    limit:10
                }).sort({
                    time:-1
                }).toArray(function(err, docs) {
                    mongodb.close()
                    if(err){
                        return callback(err);
                    }
                    //解析markdown文件为html
                    docs.forEach(function(doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs, total)
                })
            })
        })
    })
}

//返回所有文章的存档信息
Post.getArchive = function(callback) {
    //打开数据库
    mongodb.open(function(err, db) {
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.find({}, {
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs)
            });
        });
    });
};
