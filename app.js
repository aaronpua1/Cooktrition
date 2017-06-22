var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
var request = require('request');

mongoose.connect('mongodb://cooktrition:webdev@ds139937.mlab.com:39937/cooktrition');
var db = mongoose.connection;

var routes = require('./routes/index');
var users = require('./routes/users');
var searches = require('./routes/search');
var recipes = require('./routes/recipe');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(flash());

app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/search', searches);
app.use('/recipe', recipes);

app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function(){
	console.log('Server started on port '+app.get('port'));
});


app.get('/get-food', function(req, res) {
	var user = req.user.agent_id;
	
	db.collection('foods').find({userid: user}).toArray(function (err, resultArray) {
		if (err) return console.log(err);
		
		res.render('foodreport', {items: resultArray});
	});
});

app.get('/get-history', function(req, res) {
	var user = req.user.agent_id;
	var items = {};
	db.collection('dailynutrition').find({userid: user}).toArray(function (err1, resultArray) {
		if (err1) return console.log(err1);

		db.collection('foods').aggregate(
		    [
				{
				   $group:
						{
						   _id: {date: "$date"},
						   fooditems: {$push:  {item: "$itemname", date: "$date" } }
						}
				}
		    ], function(err2, result) {
				if (err2) return console.log(err2);
				
				result.reverse();
				var i = 0;
				var j = 0;
				while (i < resultArray.length && j < result.length) {
					if (resultArray[i].date == result[j]._id.date) {
						resultArray[i].foods = result[j];
						i++;
						j++;
					}
					else {
						i++;
					}
				}
				res.render('nutritionreport', {items: resultArray});
			}
		);
	});
});

app.get('/removeitem', function(req, res) {
	var d = new Date();
	d.setUTCHours(14, 0, 0, 0);
	var month = d.getMonth() + 1;
	var day = d.getDate();
	var year = d.getFullYear();
	var currentDate = month.toString() + "/" + day.toString() + "/" + year.toString();	
	var user = req.user.agent_id;
	var item = req.query.id;
	
	db.collection('foods').findOne({userid: user, date: currentDate, itemname: item}, function(err1, result1){ 
		if (err1) return console.log(err1);		
		console.log(result1);
		if (result1) {
			db.collection('dailynutrition').findOne({userid: user, date: currentDate}, function(err, result2){
				if (err) return console.log(err);
				//console.log(result2);
				db.collection('dailynutrition').update({userid: user, date: currentDate}, {$set: {
					"calories": Number(result2.calories) - Number(result1.calories),
					"caloriespercent": Number(result2.caloriespercent) - Number(result1.caloriespercent),
					"totalfat": Number(result2.totalfat) - Number(result1.totalfat),
					"totalfatpercent": Number(result2.totalfatpercent) - Number(result1.totalfatpercent),
					"saturatedfat": Number(result2.saturatedfat) - Number(result1.saturatedfat),
					"saturatedfatpercent": Number(result2.saturatedfatpercent) - Number(result1.saturatedfatpercent),
					"cholesterol": Number(result2.cholesterol) - Number(result1.cholesterol),
					"cholesterolpercent": Number(result2.cholesterolpercent) - Number(result1.cholesterolpercent),
					"sodium": Number(result2.sodium) - Number(result1.sodium),
					"sodiumpercent": Number(result2.sodiumpercent) - Number(result1.sodiumpercent),
					"totalcarbohydrate": Number(result2.totalcarbohydrate) - Number(result1.totalcarbohydrate),
					"totalcarbohydratepercent": Number(result2.totalcarbohydratepercent) - Number(result1.totalcarbohydratepercent),
					"dietaryfiber":	Number(result2.dietaryfiber) - Number(result1.dietaryfiber),	
					"dietaryfiberpercent": Number(result2.dietaryfiberpercent) - Number(result1.dietaryfiberpercent),
					"protein": Number(result2.protein) - Number(result1.protein),
					"proteinpercent": Number(result2.proteinpercent) - Number(result1.proteinpercent)			
				}});
				db.collection('foods').deleteOne({userid: user, date: currentDate, itemname: item});
			});
			res.redirect('/');
		}				
	});		
});

app.post('/', function(req, res) {
	var d = new Date();
	d.setUTCHours(14, 0, 0, 0);
	var month = d.getMonth() + 1;
	var day = d.getDate();
	var year = d.getFullYear();
	var currentDate = month.toString() + "/" + day.toString() + "/" + year.toString();	
	var user = req.user.agent_id;
	
	if (req.body.recipe == "true") {
		db.collection('recipes').findOne({userid: user, itemname: req.body.item_name}, function(err, result){
			if (err) return console.log(err);
			if (!result) {
				db.collection('recipes').insert({
					"username": req.user.agent_name,
					"userid": user,
					"date": currentDate,
					"itemname": req.body.item_name,
					"url": req.body.url
				});				
			}
		});			
	}
	
	db.collection('foods').insert({
		"username": req.user.agent_name,
		"userid": user,
		"date": currentDate,
		"itemname": req.body.item_name,
		"itembrand": req.body.item_brand,
		"id": req.body.id,
		"calories": req.body.calories,
		"caloriespercent": req.body.calories_percent,
		"totalfat": req.body.total_fat,
		"totalfatpercent": req.body.total_fat_percent,
		"saturatedfat": req.body.saturated_fat,
		"saturatedfatpercent": req.body.saturated_fat_percent,
		"cholesterol": req.body.cholesterol,
		"cholesterolpercent": req.body.cholesterol_percent,
		"sodium": req.body.sodium,
		"sodiumpercent": req.body.sodium_percent,
		"totalcarbohydrate": req.body.total_carbohydrate,
		"totalcarbohydratepercent": req.body.total_carbohydrate_percent,
		"dietaryfiber":	req.body.dietary_fiber,	
		"dietaryfiberpercent": req.body.dietary_fiber_percent,
		"protein": req.body.protein,
		"proteinpercent": req.body.protein_percent
	});	
	
	db.collection('dailynutrition').findOne({userid: user, date: currentDate}, function(err, result){
		if (err) return console.log(err);
		
		if (result) {
			db.collection('dailynutrition').update({userid: user, date: currentDate}, {$set: {
					"calories": Number(result.calories) + Number(req.body.calories),
					"caloriespercent": Number(result.caloriespercent) + Number(req.body.calories_percent),
					"totalfat": Number(result.totalfat) + Number(req.body.total_fat),
					"totalfatpercent": Number(result.totalfatpercent) + Number(req.body.total_fat_percent),
					"saturatedfat": Number(result.saturatedfat) + Number(req.body.saturated_fat),
					"saturatedfatpercent": Number(result.saturatedfatpercent) + Number(req.body.saturated_fat_percent),
					"cholesterol": Number(result.cholesterol) + Number(req.body.cholesterol),
					"cholesterolpercent": Number(result.cholesterolpercent) + Number(req.body.cholesterol_percent),
					"sodium": Number(result.sodium) + Number(req.body.sodium),
					"sodiumpercent": Number(result.sodiumpercent) + Number(req.body.sodium_percent),
					"totalcarbohydrate": Number(result.totalcarbohydrate) + Number(req.body.total_carbohydrate),
					"totalcarbohydratepercent": Number(result.totalcarbohydratepercent) + Number(req.body.total_carbohydrate_percent),
					"dietaryfiber":	Number(result.dietaryfiber) + Number(req.body.dietary_fiber),	
					"dietaryfiberpercent": Number(result.dietaryfiberpercent) + Number(req.body.dietary_fiber_percent),
					"protein": Number(result.protein) + Number(req.body.protein),
					"proteinpercent": Number(result.proteinpercent) + Number(req.body.protein_percent)
			}});						
		} else {
			var temp = collectNutrition(user, currentDate);
			db.collection('dailynutrition').insert({
				"username": req.user.agent_name,
				"userid": user,
				"date": currentDate,
				"calories": temp.calories,
				"caloriespercent": temp.caloriespercent,
				"totalfat": temp.totalfat,
				"totalfatpercent": temp.totalfatpercent,
				"saturatedfat": temp.saturatedfat,
				"saturatedfatpercent": temp.saturatedfatpercent,
				"cholesterol": temp.cholesterol,
				"cholesterolpercent": temp.cholesterolpercent,
				"sodium": temp.sodium,
				"sodiumpercent": temp.sodiumpercent,
				"totalcarbohydrate": temp.totalcarbohydrate,
				"totalcarbohydratepercent": temp.totalcarbohydratepercent,
				"dietaryfiber":	temp.dietaryfiber,	
				"dietaryfiberpercent": temp.dietaryfiberpercent,
				"protein": temp.protein,
				"proteinpercent": temp.proteinpercent
			});
		}		
	});	
	res.redirect('/');
});

var collectNutrition = function (user, currentDate) {
	db.collection('foods').find({userid: user, date: currentDate}).toArray(function (err, resultArray) {
		var data = {};
		
		if (err) return console.log(err);
		
		for (var i = 0; i < resultArray.length; i++) {
			data['calories'] += resultArray[i].calories;
			data['caloriespercent'] += resultArray[i].caloriespercent;
			data['totalfat'] += resultArray[i].totalfat;
			data['totalfatpercent'] += resultArray[i].totalfatpercent;
			data['saturatedfat'] += resultArray[i].saturatedfat;
			data['saturatedfatpercent'] += resultArray[i].saturatedfatpercent;
			data['cholesterol'] += resultArray[i].cholesterol;
			data['cholesterolpercent'] += resultArray[i].cholesterolpercent;
			data['sodium'] += resultArray[i].sodium;
			data['sodiumpercent'] += resultArray[i].sodiumpercent;
			data['totalcarbohydrate'] += resultArray[i].totalcarbohydrate;
			data['totalcarbohydratepercent'] += resultArray[i].totalcarbohydratepercent;
			data['dietaryfiber'] += resultArray[i].dietaryfiber;
			data['dietaryfiberpercent'] += resultArray[i].dietaryfiberpercent;
			data['protein'] += resultArray[i].protein;
			data['proteinpercent'] += resultArray[i].proteinpercent;
		}
		
		return data;
	});	
};
