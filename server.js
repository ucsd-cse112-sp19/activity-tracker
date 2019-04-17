/*
    Before executing the server, please run "npm install" to fetch all the required packages to run the server
    To run server, execute the command "npm start"
*/

const express = require('express');
const bodyParser = require('body-parser');

const port = process.env.PORT || 4000;
const server = express();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));

const good_user = ["Thomas Powell"];
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

/*
var app = require('express')();
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); 
*/
server.post('/gen', (req, res) => {

    /* need some authencitation check.*/
    console.log(req.body.user_name.valueOf());
    //check user_name
    //console.log(good_user);
    console.log(good_user[0].valueOf());

    if (! (req.body.user_name.valueOf() === good_user[0].valueOf())){
        res.send("You are not authorized to generate this event");
        return;
    }
    
    startTime = new Date();
    //TODO
    validString = 'randomString';
    joinQR = 'randomQR';

    res.json(
        {
            "attachments": [
                {
                    "text": "Created Event!",
                    "image_url": joinQR,
                    "validString": validString
                }
            ]
        }
    );
    res.send('send QR Code and attn string');
});

server.post('/attn', (req, res) => {
    /* check if time > 15 min*/
    var endTime   = new Date();
    var seconds = (endTime.getTime() - startTime.getTime())/1000;
    if (seconds >= 900){
    	res.send('Time out!');
    	return;
    }
    
    /* check if req.params.text == attn string */
    if (req.params.text == validString){
    	res.send('successfully attended!');
    	/* send post request to count data base with user_name in json format*/
    	/* ingore for now
    	const xhr = new XMLHttpRequest();
    	const url = 'attended-count.com';
        xhr.open("POST", url, true);
        //TEAM ID
        //USER NAME
        //API key
		xhr.setRequestHeader("Content-Type", "application/json");
		var data = JSON.stringify({"user_name": ""+req.params.user_name});
		xhr.send(data);
		*/
    }
    else{
    	res.send('wrong validation enter code!');
    }

});

server.listen(port, () => {
    console.log("Listening on port " + port);
});