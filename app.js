// RiveScript-JS
//
// Node.JS Web Server for RiveScript
//
// Run this and then communicate with the bot using `curl` or your favorite
// REST client. Example:
//
// curl -i \
//    -H "Content-Type: application/json" \
//    -X POST -d '{"username":"soandso","message":"hello bot"}' \
//    http://localhost:2001/reply

require("babel-polyfill");
var express = require("express"),
	bodyParser = require("body-parser"),
	RiveScript = require("rivescript");
var request = require("request");
	//RiveScript = require("../../lib/rivescript.js");

// Create the bot.
var bot = new RiveScript({utf8: true});

var R = require('./routine.js');

bot.setSubroutine("getDog", function (rs, args)  {
	return new bot.Promise(function(resolve, reject) {
		R.getDog(args.join(' '), function(error, data){
			if(error) {
				// console.log(error);
				reject(error);
			} else {
				// console.log(data)
				const answer = JSON.stringify({'type' : 'img' , 'data' : data});
				// console.log(answer);
				resolve(answer);
			}
		});
	});
});

bot.setSubroutine("getMarket", function (rs, args)  {
	return new bot.Promise(function(resolve, reject) {
		R.getMarket(args.join(' '), function(error, data){
			if(error) {
				// console.log(error);
				reject(error);
			} else {
				const answer = JSON.stringify({'type' : 'img' , 'data' : data});
				// console.log(answer)
				resolve(answer);
			}
		});
	});
});

function returnBotPromise(method, data_type, args){
	return new bot.Promise(function(resolve, reject) {
		if(data_type==='text'){
			console.log(args);
			R[method](args.join(' '), returnText);
		}else{
			R[method](args.join(' '), returnImg);
		}
		// R.getItemPrice(args.join(' '), returnText);
		function returnText(error, data){
			if(error) {
				reject(error);
			} else {
				const answer = JSON.stringify({'type' : 'text' , 'data' : data});
				resolve(answer);
			}
		};
	
		function returnImg(error, data){
			if(error) {
				reject(error);
			} else {
				const answer = JSON.stringify({'type' : 'text' , 'data' : data});
				resolve(answer);
			}
		};
	
	});

}


bot.setSubroutine("getItemPrice", function (rs, args)  {
	return returnBotPromise("getItemPrice", "text", args);
	// return new bot.Promise(function(resolve, reject) {
	// 	R.getItemPrice(args.join(' '), returnText);
	// });
});

bot.setSubroutine("getItemPriceWeekAgo", function (rs, args)  {
	return returnBotPromise("getItemPriceWeekAgo", "text",args);
	// return new bot.Promise(function(resolve, reject) {
	// 	R.getItemPriceWeekAgo(args.join(' '), returnText);
	// });
});

// bot.setSubroutine("getDog", function (rs, args)  {
// 	return new bot.Promise(function(resolve, reject) {
// 		R.getDog(args.join(' '), function(error, data){
// 			if(error) {
// 				// console.log(error);
// 				reject(error);
// 			} else {
// 				console.log(data)
// 				resolve({'type' : 'text' , 'data' : data.message});
// 			}
// 		});
// 	});
// });

// function textCallback(error, data){
// 	return new bot.Promise(function(resolve, reject) {
// 		R[routine](args.join(' '), function(error, data){
// 		if(error) {
// 			// console.log(error);
// 			reject(error);
// 		} else {
// 			console.log(data)
// 			resolve({'type' : 'text' , 'data' : data});
// 		}
// 	})
// 	});
// }

// bot.setSubroutine("getItemPrice", function (rs, args)  {
// 	return textCallback(rs, args, "getItemPrice");
// 	// return new bot.Promise(function(resolve, reject) {
// 	// 	R.getItemPrice(args.join(' '), function(error, data){
// 	// 		if(error) {
// 	// 			// console.log(error);
// 	// 			reject(error);
// 	// 		} else {
// 	// 			console.log(data)
// 	// 			resolve({'type' : 'text' , 'data' : data});
// 	// 		}
// 	// 	});
// 	// });
// });


bot.unicodePunctuation = new RegExp(/[.,!?;:]/g);
bot.loadDirectory("./brain").then(success_handler).catch(error_handler);


var app = express();
var manageRoute = require('./router/manage');
function success_handler() {
	console.log("Brain loaded!");
	bot.sortReplies();

	// Set up the Express app.
	

	// Parse application/json inputs.
	app.use(bodyParser.json());
	app.set("json spaces", 4);

	// Set up routes.
	app.use("/", manageRoute);
	app.post("/reply", getReply);
	app.get("/", showUsage);
	app.get("*", showUsage);

	// Start listening.
	// app.listen(2001, function() {
	// 	console.log("Listening on http://localhost:2001");
	// });
}


function isJSON(data) {
	var ret = true;
	try {
	   JSON.parse(data);
	}catch(e) {
	   ret = false;
	}
	return ret;
 }


function error_handler (loadcount, err) {
	console.log("Error loading batch #" + loadcount + ": " + err + "\n");
}

// POST to /reply to get a RiveScript reply.
function getReply(req, res) {
	// Get data from the JSON post.
	var username = req.body.username;
	var message  = req.body.message;
	var vars     = req.body.vars;

	// Make sure username and message are included.
	if (typeof(username) === "undefined" || typeof(message) === "undefined") {
		return error(res, "username and message are required keys");
	}

	// Copy any user vars from the post into RiveScript.
	if (typeof(vars) !== "undefined") {
		for (var key in vars) {
			if (vars.hasOwnProperty(key)) {
				bot.setUservar(username, key, vars[key]);
			}
		}
	}

	// Get a reply from the bot.
	bot.reply(username, message, this).then(function(reply) {
		// Get all the user's vars back out of the bot to include in the response.
		var answer = {}
		answer.status = "ok";
		answer.vars = vars;

		vars = bot.getUservars(username);
		// console.log(type(reply)==='string');
		// console.log(reply);
		console.log(isJSON(reply));
		if(isJSON(reply)){
			var body = JSON.parse(reply);
			console.log(JSON.stringify(body));
		
			answer.type = body.type;
			answer.reply = body.data; 
		// }else if( typeof reply ==='string' ){
		}else{
			// console.log("TEST");
			var body = {'type' : 'text' , 'data' : reply};
			answer.type = 'text';
			answer.reply = body.data; 
			console.log(answer);

		}
		console.log(answer);
		// Send the JSON response.
		res.json(answer);
	}).catch(function(err) {
		console.log(JSON.stringify(err));
		res.json({
			"status": "error",
			"error": JSON.stringify(err)
		});
	});
}

// All other routes shows the usage to test the /reply route.
function showUsage(req, res) {
	var egPayload = {
		"username": "soandso",
		"message": "Hello bot",
		"vars": {
			"name": "Soandso"
		}
	};
	res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
	res.write("<h1>Paas-Ta는 챗봇 서버로 활용</h1>");
	res.write("모바일 어플이기 때문에 다음과 같이 영상 링크 제출 합니다. 클릭 후 시청 부탁 드립니다.");
	res.write("<a href='https://www.youtube.com/watch?v=hox7d4SoqlM'>챗봇 기반 전통시장 주문 및 상담 플랫폼</a>");
	res.end();
}

// Send a JSON error to the browser.
function error(res, message) {
	res.json({
		"status": "error",
		"message": message
	});
}

module.exports = app;

