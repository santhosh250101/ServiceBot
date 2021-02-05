const express=require("express");
const {WebhookClient}=require("dialogflow-fulfillment");
const {Payload}=require("dialogflow-fulfillment");
const app=express();

const MongoClient =require('mongodb').MongoClient;
console.log("connected");
var url ="mongodb://localhost:27017/";
var randomstring=require("randomstring");
var user_name="";

app.post("/dialogflow",express.json(),(req,res)=>{
    const agent =new WebhookClient({request:req,response:res});

async function identify_user(agent)
{
    const acct_num=agent.parameters.account_number;
    const client =new MongoClient(url);
    await client.connect();
    console.log("connected");
    console.log("acct_num is"+acct_num);
    const snap=await client.db("chatbot").collection("user_table").findOne({account_number:acct_num});

    if(snap==null)
    {
        await agent.add("Re-enter yout account number");
    }
    else
    {
        user_name=snap.username;
        await agent.add("Welcome "+user_name+"!! how can i help you");

    }
}

function report_issue(agent)
{
    var issue_vals={1:"Internet Down",2:"slow Internet",3:"Buffering problem",4:"No connectivity"};
    const intent_val=agent.parameters.issue_num;
    var val=issue_vals[intent_val];
    var trouble_ticket= randomstring.generate(7);

    MongoClient.connect(url,function(err,db){
        if(err) throw err;
        var dbo=db.db("chatbot");

        var u_name=user_name;
        var issue_val=val;
        var status="pending";

        let ts=Date.now();
        let date_ob=new Date(ts);
        let date=date_ob.getDate();
        let month=date_ob.getMonth()+1;
        let year =date_ob.getFullYear();

        var time_date=year+"-"+month+"-"+date;
        var myobj={username:u_name,issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket};
        dbo.collection("user_issues").insertOne(myobj,function(err,res){
            if(err) throw err;
            db.close();
        });
    });
    agent.add("The issue reported is:"+val+"\n The ticket number is"+trouble_ticket);
}


//trying to load rich response
//trying to load rich response
function custom_payload(agent)
{
	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Internet Down",   
        "subtitle": "Press '1' for Internet is down",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Press '2' Slow Internet",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Buffering problem",
        "subtitle": "Press '3' for Buffering problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "No connectivity",
        "subtitle": "Press '4' for No connectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}
var intentMap = new Map();
intentMap.set("service_intent", identify_user);
intentMap.set("service_intent - custom - custom", report_issue);
intentMap.set("service_intent - custom", custom_payload);

agent.handleRequest(intentMap);

});//Closing tag of app.post

app.listen(process.env.PORT || 8080);