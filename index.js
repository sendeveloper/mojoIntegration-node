// Example express application adding the parse-server module to expose Parse
// compatible API routes.
console.log('hello world. Mojo server is starting...');

var loadLogonRegPage = function(req, res, passThruParams){

	if (!passThruParams)
		passThruParams = {};

	if (!passThruParams.logo){
		passThruParams.logo = 'images/MOJO_logo_Cropped.png'; //default T&M logo
	};

	console.log('Paramters are ' + JSON.stringify(passThruParams));
	
	res.set('Content-Type', 'text/html');
	res.render('index', passThruParams);

};

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var requestStats = require('request-stats');

var Buffer = require('buffer').Buffer;
var bodyParser = require('body-parser');
var Agenda = require('agenda');
// require('dotenv').config({path:"config.env"});



var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

console.log('Connecting to DB ' + databaseUri);
console.log('server url is ' + process.env.SERVER_URL);
console.log('master key is ' + process.env.MASTER_KEY);
console.log('App ID is ' + process.env.APP_ID);
console.log('FIle Key is ' + process.env.S3_FILE_KEY);

var api = new ParseServer({
	databaseURI: databaseUri,
	cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
	appId: process.env.APP_ID,
	masterKey: process.env.MASTER_KEY, //Add your master key here. Keep it secret!
	serverURL: process.env.SERVER_URL,  // Don't forget to change to https if needed
	fileKey: process.env.S3_FILE_KEY,
	publicServerURL: process.env.SERVER_URL
	// liveQuery: {
	//   classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
	// }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

app.set('views', __dirname + '/cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
 
//tell Express that it is being run behind a proxy and thus can trust incoming requests
app.enable('trust proxy');

//Enforce SSL connection for ALL resources
app.use(function(req, res, next) {

	if(!req.secure && app.get('env') != 'local') {
		console.log('Connection is NOT secure. Redirecting to ' + ['https://', req.get('Host'), req.url].join(''));
		return res.redirect(['https://', req.get('Host'), req.url].join(''));
	}
	next();
});

//URL encoded forms
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json 
app.use(bodyParser.json({limit: '50mb'}))

app.get('/u/:trkUrlId', function(req, res){
	//console.log('processing url request');
	TrkUtils = require('cloud/utility.js').trkUtility;
	var trkUtils = new TrkUtils();
	trkUtils.translateTrkUrl(req.params.trkUrlId)
	.then(function(targetUrl){
		//console.log('targetUrl is ' + targetUrl);
		res.redirect(targetUrl);
	});

});

//Handle HTTP GET requests
app.get('/schedule', function(req, res) {
	//console.log('HTTP GET. Vendor is : ' + req.param("vendorid"));  
	res.set('Content-Type', 'text/html');
	//console.log('Crew ID is ' + req.param("crewid"));
	var jsonParams = {};

	if (req.param("crewid") != "undefined")
		jsonParams.crewIDParam = req.param("crewid");

	if (req.param("vendorid") != "undefined")
		jsonParams.vendorIDParam = req.param("vendorid");

	if (req.param("defaultView") != "undefined")
		jsonParams.defaultViewParam = req.param("defaultView");

	//console.log('JSON parameters are ' + JSON.stringify(jsonParams));

	//now load the vendor
	var Vendor = Parse.Object.extend("Vendor");
	var query = new Parse.Query(Vendor);
	query.get(jsonParams.vendorIDParam, {useMasterKey:true})
	.then(function(aVendor){
		if (aVendor){
			var settings = aVendor.get("settings");
			jsonParams.appleAppIdParam = settings.appleAppStoreURL;
			jsonParams.androidAppIdParam = settings.androidAppId;
			
			// console.log('Apple App ID: ' + jsonParams.appleAppIdParam);
			// console.log('Android App ID: ' + jsonParams.androidAppIdParam);
			res.render('schedule', jsonParams); 
		}
		
	});
	
});

app.get('/web/styles/common', function(req, res){
	// console.log('styles/web/' + req.params.fileName);
	res.set('Content-Type', 'text/css');
	//console.log('Crew ID is ' + req.param("crewid"));
	var jsonParams = {};

	if (req.param("webId") != "undefined")
		jsonParams.webId = req.param("webId");

	//now load the vendor
	var VendorWeb = Parse.Object.extend("VendorWeb");
	var query = new Parse.Query(VendorWeb);
	query.get(jsonParams.webId)
	.then(function(aVendorWebRecord){
		if (aVendorWebRecord){
			console.log(aVendorWebRecord.toJSON());
			res.render('styles/common', aVendorWebRecord.toJSON()); 
		} else {
			//show 404 error
		}
		
	});

});

app.get('/kds.htm', function(req, res) {
	//console.log('HTTP GET. Vendor is : ' + req.param("vendorid"));  
	res.set('Content-Type', 'text/html');
	//console.log('Crew ID is ' + req.param("crewid"));
	var jsonParams = {};

	res.render('kds', {});  

});

app.get('/pincreateupdate.htm', function(req, res) {
	//console.log('HTTP GET. Vendor is : ' + req.param("vendorid"));  
	res.set('Content-Type', 'text/html');
	//console.log('Crew ID is ' + req.param("crewid"));
	var jsonParams = {};

	if (req.param("crewRequestid") != "undefined")
		jsonParams.crewRequestid = req.param("crewrequestid");

	//now load the vendor
	var CrewPinRequest = Parse.Object.extend("crewPinRequest");
	var query = new Parse.Query(CrewPinRequest);
	query.include("crewMember.vendor")
	console.log('loading crew request record');
	query.get(jsonParams.crewRequestid)
	.then(function(crewRequestRecord){
		console.log('crew request record found');
		console.log(crewRequestRecord);
		if (crewRequestRecord)    
			if (req.param("crewrequestid") != "undefined"){
				jsonParams.vendorIDParam = crewRequestRecord.get("crewMember").get("vendor").get("description");
				res.render('pincreateupdate', jsonParams);  
			};
		
	});
	
});

app.get('/app.htm', function(req, res){
	console.log('secure is ' + req.secure);
	res.set('Content-Type', 'text/html');
	res.render('app', {});
});

app.get('/', function(req, res){
	loadLogonRegPage(req, res);
});

app.get('/index.htm', function(req, res){
	loadLogonRegPage(req, res);
});

// Handle HTTP POST requests (like from FB)
app.post('/schedule', function(req, res) {
	//console.log('HTTP POST Processing....');  
	res.set('Content-Type', 'text/html');
	// var fbData = req.params.signed_request.split('.')[1];
	var fbData = req.body.signed_request.split('.')[1];

	var buf = new Buffer(fbData, 'base64');

		fbData = JSON.parse(buf.toString('utf8'));
		//console.log('fbData is ' + JSON.stringify(fbData));
		//console.log('FB Page ID is ' + fbData.page.id);

		//now given the page ID, get the vendor
	var Secrets = Parse.Object.extend("Secret");
	var socialQuery = new Parse.Query(Secrets);
	socialQuery.equalTo("keyName", 'fb_page_id');
	socialQuery.equalTo("secretValue", fbData.page.id);
	//socialQuery.include('vendor');
	socialQuery.find()
	.then(function(aSecretRecords){
		//console.log('Secret records found: ' + JSON.stringify(aSecretRecords[0]));
		//assume only one record
	
		var vendor = aSecretRecords[0].get("vendor");

		var jsonVendor = vendor.toJSON();

		res.render('schedule',  {   vendorIDParam: jsonVendor.objectId, 
									crewIDParam: "", 
									defaultViewParam:"basicDay",
									appleAppIdParam: "",
									androidAppIdParam:""
								});
	});
});

// Serve static assets from the /public folder
app.use('/', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);



// Parse Server plays nicely with the rest of your web routes
app.get('/mojo', function(req, res) {
		loadLogonRegPage(req, res, {});
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);

requestStats(httpServer, function (stats) {
	// this function will be called every time a request to the server completes
	delete stats.res.headers['access-control-allow-origin'];
	delete stats.res.headers['access-control-allow-methods'];
	delete stats.res.headers['access-control-allow-headers'];
	delete stats.res.headers['x-powered-by'];

	console.log(' ');  console.log(' ');
	console.log('*********************************************');
	console.log('Request URL is ' + stats.req.method + ' for ' + stats.req.path);
	console.log(' ');
	console.log('Response is ' + stats.res.status);
	console.log('*********************************************');
	// console.log(stats);
});

//setup basic authentication
var auth = require('http-auth');
var basic = auth.basic({realm: "Web."}, function (username, password, callback) { // Custom authentication method.
				// callback(username === "userName" && password === "password");
	Parse.User.logIn(username, password)
	.then(function(aUser){
		//now check if the user is an admin
		var queryRole = new Parse.Query(Parse.Role);
		queryRole.equalTo('name', 'Administrator');
		return queryRole.first({useMasterKey:true})
		.then(function(adminRole){

				var adminRelation = adminRole.getUsers();
				 var queryAdmins = adminRelation.query();
				 queryAdmins.equalTo('objectId', aUser.id);
				 return queryAdmins.first({useMasterKey:true})
				 .then(function(aResult){
					if (aResult)
						return Parse.Promise.as(true);
					else 
						return Parse.Promise.as(false);
				 }, function(){
					return Parse.Promise.as(false);
				 });

		}).then(function(aResult){
			callback(aResult);
		});         
	}, function(error){
		console.log(error);
		callback(false);
	});
});

var allowInsecureHTTP = false;
var isProd = true;
var environmentId = app.get('env');

if ( app.get('env') == 'local'){
  allowInsecureHTTP = true;
  isProd = false;
}

if ( app.get('env') == 'development'){
  allowInsecureHTTP = false;
  isProd = false;
};

if ( app.get('env') == 'production'){
  allowInsecureHTTP = false;
  isProd = true;
};

console.log('Node Environment is ' + app.get('env'));


var dashboardPassword = '$2a$08$fLwoKV8CVsyGp2APj/WaGePzf7mSCz2RORcHUO7UswiOEt0O3LP5O';
if (isProd === true)
	dashboardPassword = '$2a$08$ZA45tyn0TSCPoVDfqMUire58rxz1RtSxHPEMU4Xujy7FCwg/mChFy';;
	

var ParseDashboard = require('parse-dashboard');
var dashboard = new ParseDashboard({
	apps:[
		{
	  "serverURL": process.env.SERVER_URL, // Hosted on Parse.com
      "appId": process.env.APP_ID,
      "masterKey": process.env.MASTER_KEY,
      "appName": "Mojo",
      "production": isProd
  	}
  ],  
  users:[
  	{
    	user:'admin',
    	pass: dashboardPassword
    }
  ],
  useEncryptedPasswords:true
}, allowInsecureHTTP);

app.use('/dashboard', dashboard);

httpServer.listen(port, function() {
		console.log('Mojo Server is now running on port ' + port + '.');
});

// ******************************************************************************//
//  ******************************************************************************//
//  ********************** Mojo Batch Jobs ***************************************//
//  ******************************************************************************//
//  ******************************************************************************//
var agenda = new Agenda({db: {address: databaseUri}, defaultConcurrency: 15});

agenda.on('ready', function() {
	console.log('Agenda is ready at ' + new Date().toString());

	var MojoJobServer = require('./cloud/mojojobserver');
	var amojoJobServer = new MojoJobServer(agenda, environmentId);
	// console.log(amojoJobServer);
	amojoJobServer.init();
	amojoJobServer.setupJobs();

	agenda.start();

	var Agendash = require('agendash');
	app.use('/agendash', auth.connect(basic), Agendash(agenda)); 

	function failGracefully() {
		console.log('shutting down....');
		agenda.stop(() => process.exit(0));
	}

	process.on('SIGTERM', failGracefully);
	process.on('SIGINT', failGracefully);

});