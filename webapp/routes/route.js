var express = require('express');
var router = express.Router();

router.get('/index', function(req, res, next) {

    res.render("index", {title: 'Planearium'});  
});


module.exports = router;