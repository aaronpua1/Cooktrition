var express = require('express');
var router = express.Router();
var http = require('http');
var request = require('request');
var queryString = require('query-string');
var unirest = require('unirest');
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.createConnection('mongodb://cooktrition:webdev@ds139937.mlab.com:39937/cooktrition');
var db = mongoose.connection;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


router.get('/recipeinfo', function(req, res){ 
	var search_query = req.query.id;
	unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/"+ search_query +"/information?includeNutrition=true")
	.header("X-Mashape-Key", "HhxW7p9hgJmshyyRXrZBkhJcwAw7p1B7tLljsnuFzVL7BgRoi2")
	.header("Accept", "application/json")
	.end(function (result) {
		for (var i = 0; i < result.body.nutrition.nutrients.length; i++) {
			result.body.nutrition.nutrients[i].amount = Math.floor(result.body.nutrition.nutrients[i].amount);
			result.body.nutrition.nutrients[i].percentOfDailyNeeds = Math.floor(result.body.nutrition.nutrients[i].percentOfDailyNeeds);
		}
		console.log(result);
		res.render('recipe', result);
	});
});

router.get('/searchrecipes', function(req, res){
	var user = req.user.agent_id;
	var d = new Date();
	d.setUTCHours(14, 0, 0, 0);
	var month = d.getMonth() + 1;
	var day = d.getDate();
	var year = d.getFullYear();
	var currentDate = month.toString() + "/" + day.toString() + "/" + year.toString();	
	var search_query = req.query.id;	
	
	db.collection('dailynutrition').findOne({userid: user, date: currentDate}, function(err, result){
		if (err) return console.log(err);
		var calories = 2000 - result.calories;
		var fat = 65 - result.totalfat;
		var carbs = 300 - result.totalcarbohydrate;
		var protein = 50 - result.protein;
		var query = "";
		
		unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/searchComplex?limitLicense=false&cuisine=" + search_query + "&maxCalories=" + calories + "&maxCarbs=" + carbs + "&maxFat=" + fat + "&maxProtein=" + protein + "&number=100&offset=0&query="+ query +"&ranking=1")
		.header("X-Mashape-Key", "HhxW7p9hgJmshyyRXrZBkhJcwAw7p1B7tLljsnuFzVL7BgRoi2")
		.header("Accept", "application/json")
		.end(function (recipes) {
			console.log(calories, fat, carbs, protein);
			res.render('searchrecipes', recipes.body);
		});			
	});
});

router.get('/recipesbynutrition', function(req, res) {
	var user = req.user.agent_id;
	var d = new Date();
	d.setUTCHours(14, 0, 0, 0);
	var month = d.getMonth() + 1;
	var day = d.getDate();
	var year = d.getFullYear();
	var currentDate = month.toString() + "/" + day.toString() + "/" + year.toString();	
	
	db.collection('dailynutrition').findOne({userid: user, date: currentDate}, function(err, result){
		if (err) return console.log(err);
		var calories = 2000 - result.calories;
		var fat = 65 - result.totalfat;
		var carbs = 300 - result.totalcarbohydrate;
		var protein = 50 - result.protein;
		unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/findByNutrients?maxcalories="+ calories +"&maxcarbs="+ carbs +"&maxfat="+ fat +"&maxprotein="+ protein +"&number=10&offset=0&random=true")
		.header("X-Mashape-Key", "HhxW7p9hgJmshyyRXrZBkhJcwAw7p1B7tLljsnuFzVL7BgRoi2")
		.header("Accept", "application/json")
		.end(function (recipes) {
			console.log(calories, fat, carbs, protein);
			var body = {results: recipes.body};
			res.render('searchrecipes', body);
		});			
	});
});

router.get('/saverecipe', function(req, res) {
	var d = new Date();
	d.setUTCHours(14, 0, 0, 0);
	var month = d.getMonth() + 1;
	var day = d.getDate();
	var year = d.getFullYear();
	var currentDate = month.toString() + "/" + day.toString() + "/" + year.toString();	
	var user = req.user.agent_id;
	
	db.collection('recipes').findOne({userid: user, itemname: req.query.title}, function(err, result){
		if (err) return console.log(err);
		
		if (result) {
			res.redirect('/');
		} else {
			db.collection('recipes').insert({
				"username": req.user.agent_name,
				"userid": user,
				"date": currentDate,
				"itemname": req.query.title,
				"url": "/recipe/recipeinfo?id=" + req.query.id
			});	
			res.redirect('/');
		}
	});	
});

module.exports = router;

