var express = require('express');
var router = express.Router();
var http = require('http');
var request = require('request');
var queryString = require('query-string');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
//var NutritionixClient = require('nutritionix');
//var nutritionix = new NutritionixClient({
//	appId: '20765c9b',
//	appKey: 'e440958fb9e3402f58f4c3609bc5fb31'	
//});
		//url: 'https://api.nutritionix.com/v1_1/search/' + search_query + '?' + authorization,
		//url: 'http://apibeta.nutritionix.com/v2/search?q=' + search_query + '&limit=50&offset=0&' + authorization,
router.get('/food', function(req, res){ //http://stackoverflow.com/questions/26278077/node-js-get-id-of-href-in-app-js
	//console.log(req.query.id);
	//res.write("" + req.query.id);
	//res.end();
	var search_query = req.query.id;
	search_query = {nix_item_id: search_query};
	search_query = queryString.stringify(search_query);
	//var temp = {nix_item_id: '23cb59492691b7e43efa59ac'};
	//temp = queryString.stringify(temp);
	//	url: 'https://trackapi.nutritionix.com/v2/search/item?' + search_query,
	var options = {
		url: 'https://trackapi.nutritionix.com/v2/search/item?' + search_query,
		method: 'GET',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-APP-ID': '20765c9b',
			'X-APP-KEY': 'e440958fb9e3402f58f4c3609bc5fb31'
		}
	}
	
	request(options, function (error, response, body) {
		if (!error) {
			var percentArray = [];
			var data = JSON.parse(body);
			console.log(body);
			percentArray.push(Math.floor((data.foods[0].nf_calories / 2000) * 100));
			percentArray.push(Math.floor((data.foods[0].nf_total_fat / 65) * 100));
			percentArray.push(Math.floor((data.foods[0].nf_saturated_fat / 20) * 100));
			percentArray.push(Math.floor((data.foods[0].nf_cholesterol / 300) * 100));
			percentArray.push(Math.floor((data.foods[0].nf_sodium / 2400) * 100));
			percentArray.push(Math.floor((data.foods[0].nf_total_carbohydrate / 300) * 100));
			percentArray.push(Math.floor((data.foods[0].nf_dietary_fiber / 25) * 100));
			percentArray.push(Math.floor((data.foods[0].nf_protein / 50) * 100));
			data.foods[0].percentages = {calories: percentArray[0],
				total_fat: percentArray[1],
				saturated_fat: percentArray[2],
				cholesterol: percentArray[3],
				sodium: percentArray[4],
				total_carbohydrate: percentArray[5],
				dietary_fiber: percentArray[6],
				protein: percentArray[7]
			};
			res.render('food', data); //http://codepen.io/chriscoyier/pen/egHEK
			//res.write(JSON.stringify(data));
		} else {
			res.write(error.toString());
		}
		//res.end();
	});
});

router.post('/searchfood', function(req, res){
	/*var search_query = {query: req.body.search_query,
		branded: true,
		common: false
		//limit: 50,
		//offset: 0
	};*/
	//search_query = queryString.stringify(search_query);
	var authorization = 'appId=20765c9b&appKey=e440958fb9e3402f58f4c3609bc5fb31';
	var search_query = req.body.search_query;	
	var data = "";
	req.checkBody('search_query', 'Valid entry required').notEmpty();
	search_query = search_query.trim();
	search_query = search_query.replace(" ", "%20");
	var imagesArray = [];
	//var temp = {query: 'cheese'};
	//temp = queryString.stringify(temp);
	//https://trackapi.nutritionix.com/v2/search/instant?
	//https://apibeta.nutritionix.com/v2/search?
	/*var options = {
		url: 'https://trackapi.nutritionix.com/v2/search/instant?' + search_query,
		method: 'GET',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-APP-ID': '20765c9b',
			'X-APP-KEY': 'e440958fb9e3402f58f4c3609bc5fb31'
		}
	}*/
	//curl -v  -X GET "https://api.nutritionix.com/v1_1/search/taco?results=0%3A50&cal_min=0&cal_max=50000&fields=*&appId=20765c9b&appKey=e440958fb9e3402f58f4c3609bc5fb31"
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*	
	var options = {

		url: 'https://apibeta.nutritionix.com/v2/search?q=' + search_query + '&limit=50&offset=0&' + authorization,
		method: 'GET'
	}
	//console.log(search_query)
	request(options, function (error, response, body) {
		if (!error) {
			data = JSON.parse(body);
			data.search = {query: req.body.search_query};
			//console.log(data);
			res.render('searchfood', data);
		} else {
			res.write(error.toString());
		}
		//res.end();
	});
*///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var options = {
		url: 'https://api.nutritionix.com/v1_1/search/' + search_query + '?results=0%3A50&cal_min=0&cal_max=50000&fields=*&' + authorization,
		method: 'GET'
	}
	request(options, function (error, response, body) {
		if (!error) {
			data = JSON.parse(body);
			data.search = {query: req.body.search_query};
			res.render('searchfood', data);
		} else {
			res.write(error.toString());
		}
		//res.end();
	});	
	/*for (hit in data.hits) {
		var query = {nix_item_id: data.hits[hit].nix_item_id};
		query = queryString.stringify(query);
		var options2 = {
			url: 'https://trackapi.nutritionix.com/v2/search/item?' + query,
			method: 'GET',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-APP-ID': '20765c9b',
				'X-APP-KEY': 'e440958fb9e3402f58f4c3609bc5fb31'
			}
		}
		request(options2, function (error, response, body) {
			if (!error) {
				var temp = JSON.parse(body);
				imagesArray.push(temp.foods[0].photo.thumb);
			} else {
				res.write(error.toString());
			}
			//res.end();
		});					
	}
	data.photos = {thumbs: imagesArray};
	res.write(JSON.stringify(data));
	res.end();*/
});

module.exports = router;
/*
var options = {
		host: 'https://trackapi.nutritionix.com/v2/search/instant',
		//path: '/v2/search/instant',
		port: 80,
		//url: 'https://trackapi.nutritionix.com/v2/search/instant',
		headers: {
			'X-APP-ID': '20765c9b',
			'X-APP-KEY': 'e440958fb9e3402f58f4c3609bc5fb31'
		},
		method: 'GET',
		json: true,
		body: JSON.stringify({'query': 'cheese'})
	}	
	var request = http.request(options, function(response) {
		var body = ""
		response.on('data', function(data) {
			body += data;
		});
		response.on('end', function() {
			res.send(JSON.parse(body));
		});
	});
	request.on('error', function(e) {
		console.log('Problem with request:  ' + e.message);
	});
	request.end();
	
	// GET https://api.nutritionix.com/v1_1/search/mcdonalds?results=0:1 
	nutritionix.search({
	  q:'salad',
	  // use these for paging
	  limit: 10,
	  offset: 0,
	  // controls the basic nutrient returned in search
	  search_nutrient: 'calories'
	}).then(successHandler, errorHandler)
	  .catch(uncaughtExceptionHandler);
	 res.send(successHandler);
	*/
	
	/*var options = {
		//host: 'https://trackapi.nutritionix.com',
		//path: '/v2/search/instant',
		//port: 80,
		url: 'https://api.nutritionix.com/v1_1/search',		
		//qs: {phrase: 'cheese'},
		auth: {
			'x-app-id': '20765c9b',
			'x-app-key': 'e440958fb9e3402f58f4c3609bc5fb31'
		},
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'x-user-jwt': '0',
			'x-app-id': '20765c9b',
			'x-app-key': 'e440958fb9e3402f58f4c3609bc5fb31',
			'appId': '20765c9b',
			'appKey': 'e440958fb9e3402f58f4c3609bc5fb31'
		},

		
		json: {query: 'cheese'}		
		//body: JSON.stringify({'query': 'cheese'})
		//body: 'cheese'
	}	
	request(options, function (error, response, body) {
		if (!error) {
			res.write(body);
		} else {
			res.write(error);
		}
		res.end();
	});*/