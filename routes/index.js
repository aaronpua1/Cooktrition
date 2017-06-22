var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.createConnection('mongodb://cooktrition:webdev@ds139937.mlab.com:39937/cooktrition');
var db = mongoose.connection;

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	var user = req.user.agent_id;
	var d = new Date();
	d.setUTCHours(14, 0, 0, 0);
	var month = d.getMonth() + 1;
	var day = d.getDate();
	var year = d.getFullYear();
	var currentDate = month.toString() + "/" + day.toString() + "/" + year.toString();	
	
	db.collection('dailynutrition').findOne({userid: user, date: currentDate}, function(err, result){
		if (err) return console.log(err);
		
		if (result) {
			db.collection('foods').find({userid: user, date: currentDate}).toArray(function(err, resultArray1) {
				if (err) return console.log(err);
				db.collection('recipes').find({userid: user}).toArray(function(err, resultArray2) {
					result.user = {username: user};
					result.hits = {foods: resultArray1};
					result.recipes = resultArray2;
					res.render('index', result);
				});
			});						
		} else {
			db.collection('dailynutrition').insert({
				"username": req.user.agent_name,
				"userid": user,
				"date": currentDate,
				"calories": 0,
				"caloriespercent": 0,
				"totalfat": 0,
				"totalfatpercent": 0,
				"saturatedfat": 0,
				"saturatedfatpercent": 0,
				"cholesterol": 0,
				"cholesterolpercent": 0,
				"sodium": 0,
				"sodiumpercent": 0,
				"totalcarbohydrate": 0,
				"totalcarbohydratepercent": 0,
				"dietaryfiber":	0,	
				"dietaryfiberpercent": 0,
				"protein": 0,
				"proteinpercent": 0
			}, function(err, result) {
				if (err) return console.log(err);
				db.collection('foods').find({userid: user, date: currentDate}).toArray(function(err, resultArray1) {
					if (err) return console.log(err);
					db.collection('recipes').find({userid: user}).toArray(function(err, resultArray2) {
						result.user = {username: user};
						result.hits = {foods: resultArray1};
						result.recipes = resultArray2;
						res.render('index', result);
					});
				});	
			});	
		}
	});
});

function ensureAuthenticated(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	} else {
		res.redirect('/users/login');
	}
}

module.exports = router;
