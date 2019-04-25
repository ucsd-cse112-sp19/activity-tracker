/*
    Before executing the server, please run "npm install" to fetch all the
    required packages to run the server To run server, execute the command
    "npm start"
*/

const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const request = require('request');
const kue = require('kue');

const port = process.env.PORT || 4000;
const server = express();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
const good_user = ["Thomas Powell", "rkeng", "yiy142", "csynnott", "nonguyen", "abehrman", "bel060"];
var startTime = new Date();
var validString = '';
var joinQR = '';
let jobs = kue.createQueue(); // queue

server.post('/date-time', (req, res) => {
    const now = new Date();
    res.json({ date: now.toDateString(), time: now.toTimeString() });
});

/* -------------------SLACK COMMAND --------------------*/

function randomkey(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

server.post('/gen', (req, res) => {

    /* need some authencitation check.*/
    var find = false;

    var i = 0;
    for (i = 0; i < good_user.length; i++) {
        if ((req.body.user_name.valueOf() === good_user[i].valueOf())) {
            find = true;
            break;
        }
    }
    if (!find) {
        res.send("You are not authorized to generate this event");
        return;
    }

    // TODO(Nate): Add functionallity for own QR code generation here if desired.
    // Currently a dummy QR value.

    startTime = new Date();
    validString = randomkey(5);
    console.log(validString);
    joinQR = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1920px-QR_code_for_mobile_English_Wikipedia.svg.png';

    res.json(
        {
            "text": "Created Event!",
            "attachments": [
                {
                    "text": "Valid String: " + validString,
                    "image_url": joinQR
                }
            ]
        }
    );
});

/* -------------- (Start) Intercept modules  -------------- */
// TODO(Nate): abstract modules into seperate class to preserve functionality
// and proper interface.
function checkTime(req, res) {
    /* check if time > 15 min*/
    const checkinTime = new Date();
    const seconds = (checkinTime.getTime() - startTime.getTime()) / 1000;
    console.debug("seconds passed since code generate: " + seconds);
    const fifteenMinsInSeconds = 60 * 15
    if (seconds >= fifteenMinsInSeconds) {
        res.send('Sorry your code has already expired.');
        return false;
    } else {
        return true;
    }
}
function checkCode(req, res) {
    const userInput = req.body.text.split(' ');
    const userEmail = userInput[0];
    const code = userInput[1];
    /* check if req.params.text == attn string */
    if (code === validString.valueOf()) {
        return true;
    } else {
        res.send('Sorry your code does not match with the generated code');
        return false;
    }
}
/* -------------- (End) Intercept modules  -------------- */

server.post('/attn', (req, res) => {
    const now = new Date();

    const userInput = req.body.text.split(' ');
    if (userInput.length != 2) {
        res.send("Incorrect usage. Please check the command docs.");
        return;
    }
    const intercepts = [checkTime, checkCode];

    if (intercepts.every((interceptFunc) => interceptFunc(req, res))) {
        // Parse text input
        const userEmail = userInput[0];
        const code = userInput[1];
        const username = req.body.user_name;

        // TODO(Nate): display local time rather than GMT time. But use GMT time to track on server.
        const data = JSON.stringify({
            email: userEmail,
            source: "attendance",
            description: "" + username + " checked into class on " +
                now.toLocaleDateString('en-US', {timeZone: 'America/Los_Angeles'}) + 
                " at " + now.toLocaleTimeString('en-US', {timeZone: 'America/Los_Angeles'})
        });

        // TODO(Nate): Remove api key from temp option
        const options = {
            uri: 'https://service.statushero.com/api/v1/status_activities',
            body: data,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-TEAM-ID': 'cf075293-90db-400c-96c6-293351155144',
                'X-API-KEY': 'FszdnpfeyksCmLyOimW273G7keVzbgtxnIBnY0BL4X8'
            },
        }
        console.log("before newJob");
        newJob(options, username, res);
    }
});

function newJob(options, username, res) {
    console.debug("in newJob");
    const job = jobs.create('new job', {
        options: JSON.stringify(options),
        username: username,
        body: ""
    });

    job
        .on('complete', function (body) {
            console.debug('Job', job.id, 'with username', job.data.username, 'is done');
            res.send("Great! " + username + ", you just checked in.\n" + JSON.parse(body).url);
        })
        .on('failed', function (err) {
            console.debug('Job', job.id, 'with username', job.data.username, 'has failed');
            console.error("Error with status code: " + err);
            if (err == 422) {
                res.send("Sorry we did not recognize your email address.");
            } else {
                res.send("There was an error with your request, please check your email and try again");
            }
        })

    job.save(); 
}

// We have at most 10 jobs running at a given time.
jobs.process('new job', 10, function (job, done) {
    /* carry out all the job function here */
    console.debug("in process");
    handleRequest(job, done); // Done is handles by the handleRequest func.
});

function handleRequest(job, done) {
    console.debug("in handleRequest");
    let options = JSON.parse(job.data.options);

    request(options, (err, result, body) => {
        console.debug("in request");
        let statusCode = result.statusCode;                                 
        console.debug("statusCode: " + statusCode);
        if (statusCode != 201) {
            console.error('error call to status hero');
            done(new Error(statusCode));
        } else {
            console.debug('success call to status hero');
            console.debug(JSON.parse(body));
            done(null, body); // Pass the body back if there was no error
        }  
        // TOOD(Nate): Add a timeout here. If the request takes too long, we
        // send back to user notification that the request might have been lost
    });
}

server.listen(port, () => {
    console.debug("Listening on port " + port);
});
