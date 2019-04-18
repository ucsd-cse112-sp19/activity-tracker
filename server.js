/*
    Before executing the server, please run "npm install" to fetch all the required packages to run the server
    To run server, execute the command "npm start"
*/

const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const request = require('request');

const port = process.env.PORT || 4000;
const server = express();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));
const good_user = ["Thomas Powell","rkeng", "yiy142", "csynnott", "nonguyen","abehrman","bel060"];
var startTime = new Date();
var validString = '';
var joinQR = '';

server.get('/', (req, res) => {
    res.send('This is the server');
});

server.post('/hello-world', (req, res) => {
    res.json({response:"Hello World"});
});

server.post('/date-time',  (req, res) => {
    const now = new Date();
    res.json({date: now.toDateString(), time: now.toTimeString()});
});


/* -------------AUTHENTICATION -----------------------*/
// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
server.get('/oauth', function(req, res) {
    // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
    if (!req.query.code) {
        res.status(500);
        res.send({"Error": "Looks like we're not getting code."});
        console.log("Looks like we're not getting code.");
    } else {
        // If it's there...

        // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
        request({
            url: 'https://slack.com/api/oauth.access', //URL to hit
            qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret}, //Query string data
            method: 'GET', //Specify the method

        }, function (error, response, body) {
            if (error) {
                console.log(error);
            } else {
                res.json(body);

            }
        })
    }
});

// Route the endpoint that our slash command will point to and send back a simple response to indicate that ngrok is working
server.post('/command', function(req, res) {
    res.send('Your ngrok tunnel is up and running!');
});


server.post('/getAllUsersEmails', function(req, res) {
   request({
      url: 'https://slack.com/api/users.profile.get', //URL to hit
      qs: {token: token}, //Query string data
      method: 'GET', //Specify the method

   }, function (error, response, body) {
         if (error) {
            console.log(error);
         } else {
            bodyJson = JSON.parse(body);
            res.send(bodyJson.profile.email);
         }
   })
});

/* -------------------SLACK COMMAND --------------------*/

function randomkey(length)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    for (var i = 0; i<length; i++)
    {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

server.post('/gen', (req, res) => {

    /* need some authencitation check.*/

    //console.log(req.body.user_name.valueOf());
    //console.log(good_user[0].valueOf());

    var find = false;

    var i = 0;
    for (i = 0; i < good_user.length; i ++){
        if ((req.body.user_name.valueOf() === good_user[i].valueOf())){
            find = true;
            break;
        }
    }
    if (!find){
        res.send("You are not authorized to generate this event");
        return;
    }
    
    startTime = new Date();
    //TODO
    validString = randomkey(5);
    console.log(validString);
    joinQR = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1920px-QR_code_for_mobile_English_Wikipedia.svg.png';

    res.json(
        {
            "text": "Created Event!",
            "attachments": [
                {
                    "text":  "Valid String: " + validString,
                    "image_url": joinQR
                }
            ]
        }
    );
    //res.send('send QR Code and attn string');
});


server.post('/attn', (req, res) => {
    var now = new Date();
    /* check if time > 15 min*/
    var endTime   = new Date();
    var seconds = (endTime.getTime() - startTime.getTime())/1000;
    console.log("time pass: " + seconds);
    if (seconds >= 900){
    	res.send('Time out!');
    	return;
    }
    
    /* check if req.params.text == attn string */
    if (req.body.text.valueOf() === validString.valueOf()){
        
        var username = req.body.user_name;
        var data = JSON.stringify( {
            email: username + "@ucsd.edu",
            source: "attendance",
            description: "" + username + " checked into class on " +
                now.toDateString() + " at " + now.toTimeString(),
        });

        // TODO(Nate): Remove api key from temp option
        var options = {
            uri: 'https://service.statushero.com/api/v1/status_activities',
            body: data,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-TEAM-ID': 'cf075293-90db-400c-96c6-293351155144',
                'X-API-KEY': 'FszdnpfeyksCmLyOimW273G7keVzbgtxnIBnY0BL4X8', 
            },
        }

    	//res.send('successfully attended!');
        request(options, (err, result, body) => {
            res.send("username" + username + "status code: " + body);
        });
    }
    else{
    	res.send('wrong validation enter code!');
    }

});

server.listen(port, () => {
    console.log("Listening on port " + port);
});
