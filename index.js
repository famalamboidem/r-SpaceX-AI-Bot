'use strict';
//a version from scratch built using Actions on Google Client Library

process.env.DEBUG = 'actions-on-google:*';
const ApiAiApp = require('actions-on-google').ApiAiApp;
const https = require('https');
const http = require('http');
const queryString = require('query-string');

//Links
const API_URL = 'https://api.spacexdata.com';

// API.AI actions
const UNRECOGNIZED_DEEP_LINK = 'deeplink.unknown';
const GET_COMPANY_INFO = 'get.companyInformation';
const GET_VEHICLE_INFO = 'get.vehicleInformation';
const GET_LAUNCH_INFO = 'get.launchInformation';
const GET_LAUNCHPAD_INFO = '';


// API.AI parameter names
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
const ENTITY_SEARCH = {
  'Vehicles':'rocket',
  'LaunchPads':'launch_site',
  'LaunchOrdinal':'flight_number',
};
const LAUNCH_PAD_ID = {
  
};

function companyInfoTemplate (data, parameter) {
  const COMPANY_INFO = {
    "name": `The company is called Space Exploration Technologies or ${data.name} for short.`,
    "founder": `${data.name}'s founder was ${data.founder} in ${data.founded}`,
    "founded": `${data.name} was founded in ${data.founded} by ${data.founder}`,
    "employees": `${data.name} currently has about ${data.employees} employees`,
    "vehicles": `${data.name} currently has ${data.vehicles} different vehicles`,
    "launch_sites": `${data.name} currently operates ${data.launch_sites} independant launch sites`,
    "test_sites": `${data.name} currently operates ${data.test_sites} test site`,
    "ceo": `The current Chief Executive Officer of ${data.name} is ${data.ceo}`,
    "cto": `The current Chief Technology Officer of ${data.name} is ${data.cto}`,
    "coo": `The current Chief Operating Officer of ${data.name} is ${data.coo}`,
    "cto_propulsion": `${data.name}'s current Chief Technology Officer of Propulsion is ${data.cto_propulsion}`,
    "valuation": `${data.name} is currently valued at ${data.valuation}USD`,
    "headquarters": `${data.name}'s headquarters is based in ${data.headquarters.city},${data.headquarters.state}, its address is ${data.headquarters.address}`,
    "summary": `${data.summary}`
  };
  return COMPANY_INFO[parameter]
}
function launchInfoTemplate (data, parameter, past) {
  let tense = past? "is due to take place at" :"took place at"
  const LAUNCH_INFO = {
    "flight_number": `${data.flight_number}.`,
    "launch_year": `${data.launch_year}.`,
    "launch_date": `The launch of ${data.payload_1} aboard SpaceX's ${data.rocket} from ${data.launch_site} ${tense} ${data.time_utc}UTC on ${data.launch_date}.`,
    "time_utc": `${data.time_utc}`,
    "time_local": `${data.time_local}`,
    "rocket": `${data.rocket}`,
    "rocket_type": `${data.type}`,
    "core_serial": `${data.core_serial}`,
    "cap_serial": `${data.cap_serial}`,
    "launch_site": `${data.launch_site}`,
    "payload_1": `${data.payload_1}`,
    "payload_2": `${data.payload_2}`,
    "payload_type": `${data.payload_type}`,
    "payload_mass_kg": `${data.payload_mass_kg}`,
    "payload_mass_lbs": `${data.payload_mass_lbs}`,
    "orbit": `${data.orbit}`,
    "customer_1": `${data.customer_1}`,
    "customer_2": `${data.customer_2}`,
    "launch_success": `${data.launch_success}`,
    "reused": `${data.reused}`,
    "land_success": `${data.land_success}`,
    "landing_type": `${data.landing_type}`,
    "landing_vehicle": `${data.landing_vehicle}`,
    "mission_patch": `${data.mission_patch}`,
    "article_link": `${data.article_link}`,
    "video_link": `${data.video_link}`,
    "details": `${data.details}`
  }
  return LAUNCH_INFO[parameter]
}

exports.SpaceXFulfillment = (request, response) => {
  const app = new ApiAiApp({ request, response });

  //let requestHeader = JSON.stringify(request.headers);
  //console.log('Request headers: ' + requestHeader);
  //let requestBody = JSON.stringify(request.body);
  //console.log('Request body: ' + requestBody);

  function unrecognised (app) {
    app.ask("Sorry I didn't get that");
  }

  function getCompanyInfo (app){
    function callbackCompany (app, data){
      let companyParameter = request.body.result.parameters.CompanyParams;
      let botResponse = {
        'speech':companyInfoTemplate(data, companyParameter),
        'displayText':companyInfoTemplate(data, companyParameter),
      }
      app.ask(botResponse);
    }
    APIrequest(app, '/info', callbackCompany);
  }
  
  function getVehicleInfo (app){
    function callbackVehicle (app, data){}
    APIrequest(app, '/vehicles', callbackVehicle);
  }
  
  function getLaunchInfo (app){
    function callbackLaunch (app, data){
      
      let launchQueryParameter = request.body.result.parameters.LaunchQueryParams;
      
      let masterResults = data;
      let paramsList = request.body.result.parameters;
      let cleanedParamsList = [];
      // looks through the parameters sent in the JSON request picks out the ones to be used for searching then adds them to a list
      for (var key in paramsList) {
        if (key !== 'LaunchQueryParams' && key !== 'LaunchTemporal' && paramsList.key !== ''){
          cleanedParamsList.push(paramsList.key);
        }
      }
      
      // goes through each of the searchable paramenters, searches for them in the list of launches and then shortens the list to the ones that satisfy the search
      for (var i = 0; i < cleanedParamsList.length; i++) {
        let element = cleanedParamsList[i];
        let results = [];
        // gets the search field from the Parameter:api_term pairing made in the header
        let searchField = ENTITY_SEARCH[element];
        // this may also need a pairing dictionary as the line above does
        let searchVal = paramsList[element];
        
        // loops through each of the launches in the data array and sees if the seach field matches the value, is true then appends to results
        for (let x = 0; x < data.length; x++) {
          if (masterResults[x][searchField] == searchVal) {
            results.push(masterResults[x]);
          }
        }
        masterResults = results;
      }
      
      let speech = '';
      for (let n = 0; n < masterResults.length; n++) {
        let ele = masterResults[n];
        speech += launchInfoTemplate(ele, launchQueryParameter, true);
      }
      let botResponse = {
        'speech': speech,
        'displayText': speech,
      }
      app.ask(botResponse);
    }
    APIrequest(app, '/launches', callbackLaunch);
    APIrequest(app, '/launches/upcoming', callbackLaunch);
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
          console.log(parsedData);
          // some code to pick the relevant company data from the user request (request.body.result.parameters.CompanyParams)
          callback(app, parsedData)
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
