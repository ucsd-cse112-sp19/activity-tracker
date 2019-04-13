//Resources:
//https://www.youtube.com/watch?v=bSAhw7TukuU   (~23:00)
//https://api.slack.com/tutorials/events-api-using-aws-lambda

//npm i request 
//npm i request-promise


const request = require('request-promise');
// Before anything, make sure to create a Slack app in Slack, add to specific channels


//Insert the Slack app's incoming webhook for specific channel, only paste end of URL string
const slackAppHook = '..../...../.... etc';



//Example of getting json data from source
//Need to actually first implement Slack events on a server to recieve message (youtube link)
/*
const getSlackData = async function(){
    const jsonData = await request({
        url: '(some url pointing to json data)',
        json: true
    });
    return jsonData;
};
*/


//function
(async function () {
    try{
    //const data1 = await getSlackData();  

    //Slack message body text
    const slackMessage = {
        mkdwn: true, //add this for slack to recognize styles (bold etc..) 
        text: 'testing this new slack post'
    }
    
    //Post call to Slack 
    const slackResult = await request({
        url: `https://hooks.slack.com/services/${slackAppHook}`,
        method: 'POST',
        body: slackMessage,
        json: true
    });

    //print result of POST call to Slack
    console.log(slackResult);

    }
    catch (e){
        console.log('Error Occurred: ', e);
    }

})();
