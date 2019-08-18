var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var r = require('./routes/route');
app.use('/', r);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error(req.url+' : Not Found');
  err.status = 404;
  next(err);
});

app.listen(8080);

module.exports = app;