'use strict';
/*jshint esversion: 6 */
/* jshint node: true */
//a version from scratch built using Actions on Google Client Library

process.env.DEBUG = 'actions-on-google:*';
const DialogflowApp = require('actions-on-google').DialogflowApp;
const https = require('https');
const http = require('http');
const queryString = require('query-string');

//Links
const API_URL = 'https://api.spacexdata.com/v2';

// API.AI actions
const UNRECOGNIZED_DEEP_LINK = 'deeplink.unknown';
const GET_COMPANY_INFO = 'get.companyInformation';
const GET_VEHICLE_INFO = 'get.vehicleInformation';
const GET_LAUNCH_INFO = 'get.launchInformation';
const GET_LAUNCHPAD_INFO = '';


// API.AI parameter names.
const CATEGORY_ARGUMENT = 'category';

// API.AI Contexts/lifespans
const WELCOME = 'welcome';
const DEFAULT_LIFESPAN = 5;
const END_LIFESPAN = 0;

const parameter = {
};

const LINK_OUT_TEXT = 'Learn more';
const NEXT_INFO_DIRECTIVE = 'Would you like to know anything else?';

const NO_INPUTS = [
  'I didn\'t hear that.',
  'Say that again.',
];
const ENTITY_SEARCH_FIELD = {
  'Vehicles':'rocket',
  'LaunchPads':'launch_site',
  'LaunchOrdinal':'flight_number',
  'MissionOutcome':'launch_success'
};

function vehicleInfoTemplate (data, parameter) {
  console.log("Template start");
  console.log(data);
  let date = (data.first_flight == "TBD")? "is yet to be announced":"was on " + new Date(data.first_flight).toDateString();
  const VEHICLE_INFO = {
    "id": ``,
    "name": ``,
    "active": `The ${data.name} is ${data.active?  "active":"not active"}. `,
    "stages": `The ${data.name} has ${data.stages} stages. `,
    "cost_per_launch": `The launch cost of the ${data.name} is ${data.cost_per_launch}. `,
    "success_rate_pct": `The success rate of the ${data.name} is ${data.success_rate_pct}%. `,
    "first_flight": `The first flight of the ${data.name} ${date}. `,
    "country": ``,
    "company": ``,
    // vehicle data structure is inconsistant and that breaks this https://github.com/r-spacex/SpaceX-API/issues/53
    //"size": `The ${data.name} is ${data.height.meters} meters tall and ${data.diameter.meters} meters in diameter. It has a dry mass of ${data.mass.kg} kilograms. `,
    "leo_weight": `The ${data.name} can launch ${data.payload_weights[0].kg} kilograms to ${data.payload_weights[0].name}. `,
    //engine data structure in the API differs over different vehicles. https://github.com/r-spacex/SpaceX-API/issues/53
    //"gto_weight": `The ${data.name} can launch ${data.payload_weights[1].kg} kilograms to ${data.payload_weights[1].name}. `,
    //"mars_weight": `The ${data.name} can launch ${data.payload_weights[2].kg} kilograms to ${data.payload_weights[2].name}. `,
    "first_stage_reusable": `The ${data.name} is ${data.first_stage.reusable? "":"not "}a reusable rocket. `,
    //"engines":`The first stage has ${data.first_stage.engines.number} ${data.engines.type} ${data.engines.version}s. The second stage has ${data.second_stage.engines.number} ${data.second_stage.engines.type}s. `,
    //"engine_stats":`The first stage's ${data.engines.number} ${data.first_stage.engines.type}s can burn for ${data.first_stage.burn_time_sec} with a sea level thrust of ${data.first_stage.engines.thrust_sea_level} and a vacuum thrust of ${data.first_stage.engines.thrust_vacuum}. The second stage's ${data.second_stage.engines.number} ${data.second_stage.engines.type}s can burn for ${data.second_stage.burn_time_sec} with a sea level thrust of ${data.second_stage.engines.thrust_sea_level} and a vacuum thrust of ${data.second_stage.engines.thrust_vacuum}. `,
    //"fuel":`The first satge on the ${data.name} carries ${data.first_stage.fuel_amount_tons} tons of ${data.first_stage.engines.propellant_1} and ${data.first_stage.engines.propellant_2}, The second satge on the carries ${data.second_stage.fuel_amount_tons} tons of ${data.second_stage.engines.propellant_1} and ${data.second_stage.engines.propellant_2}. `,
    "second_stage_payload_options":`${data.second_stage.payloads.option_1} and ${data.second_stage.payloads.option_2}. `,
    "fairing_size":` The fairing is ${data.second_stage.payloads.composite_fairing.height.meters} meters tall and ${data.second_stage.payloads.composite_fairing.diameter.meters} meters in diameter. `,
    //"engine_loss_max":`${data.engines.engine_loss_max} can be lost during flight without causing mission failure. `,
    //"landing_legs":`The ${data.name} has ${data.landing_legs.number} landing legs which are made from ${data.landing_legs.material}. `,
    //
    "description": `${data.description} `
  };
  console.log("Template end");
  return VEHICLE_INFO[parameter];
}
function companyInfoTemplate (data, parameter) {
  const COMPANY_INFO = {
    "name": `The company is called Space Exploration Technologies or ${data.name} for short. `,
    "founder": `${data.name}'s founder was ${data.founder} in ${data.founded}. `,
    "founded": `${data.name} was founded in ${data.founded} by ${data.founder}. `,
    "employees": `${data.name} currently has about ${data.employees} employees. `,
    "vehicles": `${data.name} currently has ${data.vehicles} different vehicles. `,
    "launch_sites": `${data.name} currently operates ${data.launch_sites} independant launch sites. `,
    "test_sites": `${data.name} currently operates ${data.test_sites} test site. `,
    "ceo": `The current Chief Executive Officer of ${data.name} is ${data.ceo}. `,
    "cto": `The current Chief Technology Officer of ${data.name} is ${data.cto}. `,
    "coo": `The current Chief Operating Officer of ${data.name} is ${data.coo}. `,
    "cto_propulsion": `${data.name}'s current Chief Technology Officer of Propulsion is ${data.cto_propulsion}. `,
    "valuation": `${data.name} is currently valued at ${data.valuation}USD. `,
    "headquarters": `${data.name}'s headquarters is based in ${data.headquarters.city}, ${data.headquarters.state}, its address is ${data.headquarters.address}. `,
    "summary": `${data.summary}. `
  };
  return COMPANY_INFO[parameter];
}
function launchInfoTemplate (data, parameter, past) {
  console.log('Addressing flight number:');
  console.log(data.flight_number);
  console.log('The data being used is:');
  console.log(data);
  let tense = past?  "took place":"is due to take place";
  let date = (data.launch_date_utc == "TBD")? "an unannounced time":new Date(data.launch_date_utc).toUTCString().replace(":00", "");
  //let dateString0 = date.toUTCString().replace(":00", ""); //not future proof if API reports seconds
  const LAUNCH_INFO = {
    "flight_number": `${data.flight_number}. `,
    "launch_year": `${data.launch_year}.`,
    "launch_date_local": `The launch of ${data.rocket.second_stage.payloads[0].payload_id} aboard SpaceX's ${data.rocket.rocket_name} from ${data.launch_site.site_name} ${tense} at ${date}. `,
    "launch_date_utc": `${date}`,
    "time_local": `${data.time_local}`,
    "rocket": `${data.rocket.rocket_name}`,
    "rocket_type": `${data.type}`,
    "core_serial": `${data.core_serial}`,
    "cap_serial": `${data.cap_serial}`,
    "launch_site": `${data.launch_site.site_name}`,//could consider adding a google maps rich data reply
    "payload_1": `${data.rocket.second_stage.payloads[0].payload_id}`,
    //"payload_2": `${data.rocket.second_stage.payloads[1]? data.payloads[1].payload_id:'There was no second payload'}`,// not working
    "payload_type": `${data.rocket.second_stage.payloads[0].payload_type}`,
    "payload_mass_kg": `${data.rocket.second_stage.payloads[0].payload_mass_kg}`,
    "payload_mass_lbs": `${data.rocket.second_stage.payloads[0].payload_mass_lbs}`,
    "orbit": `${data.rocket.second_stage.payloads[0].orbit}`,
    "customer_1": `${data.rocket.second_stage.payloads[0].customers[0]}`,
    //"customer_2": `${data.rocket.second_stage.payloads[1].customers[0]}`,
    "launch_success": `${data.launch_success}`,
    "reused": `${data.reused}`,
    "land_success": `${data.land_success}`,
    "landing_type": `${data.landing_type}`,
    "landing_vehicle": `${data.landing_vehicle}`,
    "mission_patch": `${data.links.mission_patch}`,
    "article_link": `${data.links.article_link}`,
    "video_link": `${data.links.video_link}`,
    "details": `The launch of ${data.rocket.second_stage.payloads[0].payload_id} aboard SpaceX's ${data.rocket} from ${data.launch_site.site_name} ${tense} at ${date}. ${data.details}. `
  };
  console.log('launchInfoTemplate() is returning: ' + LAUNCH_INFO[parameter]);
  return LAUNCH_INFO[parameter];
}

exports.SpaceXFulfillment = (request, response) => {
  const app = new DialogflowApp({request: request, response: response});
  const queryResult = request.body.result;
  //for debugging purposes
  console.log("Request:");
  console.log(JSON.stringify(request.body));
  function unrecognised (app) {
    app.ask("Sorry I didn't get that");
  }

  function getCompanyInfo (app){
    function callbackCompany (app, data){
      let companyParameter = queryResult.parameters.CompanyParams;
      let botResponse = {
        'speech':companyInfoTemplate(data, companyParameter)+ "Is there anything else I can help with?",
        'displayText':companyInfoTemplate(data, companyParameter),
      };
      response.json(botResponse);
    }
    APIrequest(app, '/info', callbackCompany);
  }

  function getVehicleInfo (app){

    function callbackVehicle (app, data){
      let vehicleParameters = queryResult.parameters.VehicleQueryParams;
      let vehicles = queryResult.parameters.Vehicles;
      let vehicleData = {};
      let speech  = "";

      for (var vehicle in vehicles) {
        if (vehicles.hasOwnProperty(vehicle)) {
          //loop through the list of all vehicles in the data and retieve only the vehicle in question
          for (var i in data) {
          	if (data.hasOwnProperty(i)) {
            	if (data[i].id == vehicles[vehicle]){
              	vehicleData = data[i];
              }
            }
          }


          for (var vehicleParameter in vehicleParameters) {
            if (vehicleParameters.hasOwnProperty(vehicleParameter)) {
              console.log(vehicleParameters[vehicleParameter]);
              speech += vehicleInfoTemplate(vehicleData, vehicleParameters[vehicleParameter]);
            }
          }
        }
      }
      let botResponse = {
        'speech':speech+ "Is there anything else I can help with?",
        'displayText':speech,
      };
      response.json(botResponse);
    }
    APIrequest(app, '/vehicles', callbackVehicle);
  }

  function getLaunchInfo (app){
  // this function handles GET_LAUNCH_INFO requests

    function callbackLaunch (app, data){
    // this function is called as the callback from within APIrequest(app, '/launches', callbackLaunch)

      // gives a shorthand variabel for the LaunchQueryParams (this is essentially the object of the user's question)
      let launchQueryParameter = queryResult.parameters.LaunchQueryParams;

      // Creates a masterResults copy of the data, this list will be chopped and changed, preserving 'data'
      let masterResults = data;
      // the list of all the parameters, it will include things like the LaunchQueryParams and perhaps some empty parameters, we dont want these.
      let paramsList = queryResult.parameters;
      let cleanedParamsList = [];
      // looks through the parameters sent in the JSON request picks out the ones to be used for searching then adds them to a list
      for (var key in paramsList) {
        if (key !== 'LaunchQueryParams' && key !== 'LaunchTemporal' && key !== 'LaunchOrdinal' && paramsList[key] !== ''){
          cleanedParamsList.push(key);
        }
      }

      // goes through each of the searchable paramenters, searches for them in the list of launches and then shortens the list to the ones that satisfy the search
      for (var i = 0; i < cleanedParamsList.length; i++) {
        let element = cleanedParamsList[i];

        let results = [];
        // gets the search field from the Parameter:api_term pairing made in the header
        let searchField = ENTITY_SEARCH_FIELD[element];

        // this may also need a pairing dictionary as the line above does
        let searchVal = paramsList[element];

        // loops through each of the launches in the data array and sees if the seach field matches the value, is true then appends to results
        for (let x = 0; x < masterResults.length; x++) {
          //if (masterResults[x][searchField] == searchVal) { // not always working since Dragon 1 can be Dragon 1.1 or Dragon 1.0. .toString as values will sometimes be booleen
          if (masterResults[x][searchField].toString().indexOf(searchVal) != -1) {
            results.push(masterResults[x]);
          }
        }
        masterResults = results;
      }

      let past = true;

      if (queryResult.parameters.LaunchTemporal == 'next' && masterResults.length !== 0){
        //makes master results equal to only its first element
        masterResults = [masterResults[0]];
        past = false;

      }else if(queryResult.parameters.LaunchTemporal == 'last' && masterResults.length !== 0){
        //makes master results equal to only its last element
        masterResults = [masterResults[masterResults.length-1]];
      }else if (queryResult.parameters.LaunchOrdinal.ordinal != null && queryResult.parameters.LaunchOrdinal.ordinal !== '' && masterResults.length !== 0){
        //makes master results equal to only its nth element
        masterResults = [masterResults[queryResult.parameters.LaunchOrdinal.ordinal-1]];
      }
      let speech = '';
      for (let n = 0; n < masterResults.length; n++) {
        let ele = masterResults[n];
        speech += launchInfoTemplate(ele, launchQueryParameter, past);
      }
      //below statement is an easter egg to be removed when FH comes into use.
      if (queryResult.parameters.Vehicles == "Falcon Heavy"){
        speech = "I just called Elon, he says six months from now. ";
      };
      speech = (speech === '')? "Unfortunately I couldn't find any launches that met your descriptions. ":speech;

      //replaces below with format agnostic responses. Using app.ask seems to only work with the google assistant
      //let botResponse = {
      //  'speech': speech + "Is there anything else I can help with?",
      //  'displayText': speech,
      //};
      //app.ask(botResponse);

      //this JSON struncture can be used to build rich slack responses with hyperlinks and more https://api.slack.com/docs/messages
      let slackMessage = {
        "text": speech,
        "attachments": [
          {
          "title": "SpaceX",
          "title_link": "http://www.spacex.com/",
          "color": "#36a64f"
          }
        ]
      };
      let botResponse = {};
      botResponse.speech = speech + "Anything else I can help with?";
      botResponse.displayText = speech + "Is there anything else I can help with?";
      //uncomment this line to enable rich slack responses.
      //botResponse.data = {};
      //botResponse.data.slack = slackMessage;
      response.json(botResponse);
    }

    if (queryResult.parameters.LaunchTemporal == 'next'){
      APIrequest(app, '/launches/upcoming', callbackLaunch);
    }else{
      APIrequest(app, '/launches', callbackLaunch);
    }

  }

  function APIrequest (app, path, callback) {
    // this function takes a des
    https.get(API_URL + path, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
                          `Expected application/json but received ${contentType}`);
      }
      if (error) {
        console.error(error.message);
        // consume response data to free up memory
        res.resume();
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          console.log('rawData');
          console.log(rawData);
          console.log('parsedData');
          console.log(parsedData);
          // some code to pick the relevant company data from the user request (queryResult.parameters.CompanyParams)
          callback(app, parsedData);
        } catch (e) {
          console.error(e.message);
        }
      });
    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
    });

  }

  let actionMap = new Map();
  actionMap.set(UNRECOGNIZED_DEEP_LINK, unrecognised);
  actionMap.set(GET_COMPANY_INFO, getCompanyInfo);
  actionMap.set(GET_VEHICLE_INFO, getVehicleInfo);
  actionMap.set(GET_LAUNCH_INFO, getLaunchInfo);

  app.handleRequest(actionMap);

};
