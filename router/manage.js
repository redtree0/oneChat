var express = require('express');
var router =  express.Router();

router.post('/charge', function(req, res){
    var item = req.body.item;
    var user = req.body.user;
    var pinNum = req.body.pinNum;
    if(pinNum){
        res.json({'charged' : true}); 
    }else{
        res.json({'charged' : false}); 
    }
	// res.send('Hello /p1/r1');		
});

module.exports = router;