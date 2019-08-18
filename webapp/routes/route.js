var express = require('express');
var router = express.Router();

//router.get('/browser', function(req, res, next) {
//
//    res.render("draw_view_browser", {title: 'Drawing page'});  
//});

router.get('/index', function(req, res, next) {

    res.render("index", {title: 'Planearium'});  
});



module.exports = router;