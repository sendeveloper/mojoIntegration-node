
var _ = require('lodash');

module.exports = function(agenda, environmentId){
	console.log('environment is ' + environmentId );
	var _agenda = agenda;
	var _envId = environmentId;

	var setupJobs = function(){
		var self = this;

		var aPromise = new Parse.Promise();

		fs = require('fs');

		fs.readFile('./jobDef.json', 'utf8', 
			function (err,fileData) {
				if (err) {
					console.log(err);
					aPromise.reject(err);
				} else {
					// console.log(fileData);
					var jobConfig = JSON.parse(fileData);
					//now that we have the JSON 
					//lets schedule all the jobs using agenda
					console.log('Found ' + jobConfig.jobs.length + ' jobs in Job Config');
					
					var prettyCron = require('prettycron');

					_agenda.on('start', function(job) {
						console.log();
						console.log("**********************************");
						console.log("** Job %s starting at %s", job.attrs.name, new Date().toString());
						console.log('');
						if (job.attrs.data && job.attrs.data.hcheckId){
							var https = require('https');
							https.get(job.attrs.data.hcheckId);							
						} else {
							console.log('Batch Job ' + job.attrs.name + ' does not have a check ID. Thats probably NOT right');
						}

					});

					_agenda.on('complete', function(job) {
						console.log();
						console.log("Job %s finished at %s", job.attrs.name, new Date().toString());
						console.log("**********************************");
						console.log();
					});

					_agenda.on('fail', function(error, job) {
						console.log();
						console.log("Job %s failed at %s", job.attrs.name, new Date().toString());
						console.log("**********************************");
						console.log();

						//now send a notification email
						var TrkUtil = require('./utility.js').trkUtility;
						var trkUtil = new TrkUtil();
						  
						var mailParams = {
						  	template_name: "batchJobError",
						 	message:{
						 		global_merge_vars:[
							 		{	name: 'jobName', content:job.attrs.name },
							 		{	name: 'jobEnv', content:_envId },
							 		{	name: 'jobFailReason', content:job.attrs.failReason },
							 		{	name: 'JOBDATA', content:JSON.stringify(job.attrs) }
						 		]
						 	}
						};

						trkUtil.sendEmail(mailParams, 'alon@getyomojo.com');


					});

					_.each(jobConfig.jobs, function(aJobDef){
						
						console.log();
						if (aJobDef.cronTerm != 'NOW' && aJobDef.cronTerm != 'NEVER'){
							console.log('Defining Job : ' + aJobDef.id + ' ' + prettyCron.toString(aJobDef.cronTerm));
							console.log(aJobDef.id + ' first run will be ' + prettyCron.getNext(aJobDef.cronTerm));
						};
						console.log();

						_agenda.define(aJobDef.id, function(job, done){
							var rootModule = require(aJobDef.modulePath);
							var rootAttrib;

							if (aJobDef.rootAttribute)
								rootAttrib = new rootModule[aJobDef.rootAttribute];
							else
								rootAttrib = new rootModule;

							if (!aJobDef.data)
								aJobDef.data = {};

							rootAttrib[aJobDef.method](job, aJobDef.data)
							.then(function(){
								done();
							}, function(error){
								console.log(error);
								if (!error  || !error.message)
									var error = {message:'Error running Job' + aJobDef.id};

								job.fail(error.message);
								job.save();

								//now send a notification email
								var TrkUtil = require('./utility.js').trkUtility;
								var trkUtil = new TrkUtil();
								  
								var mailParams = {
								  	template_name: "batchJobError",
								 	message:{
								 		global_merge_vars:[
									 		{	name: 'jobName', content:job.attrs.name },
									 		{	name: 'jobFailReason', content:job.attrs.failReason },
									 		{	name: 'JOBDATA', content:JSON.stringify(job.attrs) }
								 		]
								 	}
								};

								trkUtil.sendEmail(mailParams, 'alon@getyomojo.com');
							});
						});
										
						if (aJobDef.cronTerm == 'NOW'){
							var Moment = require('moment');
							var nowMoment = new Moment().add(2, 'minutes');

							console.log('Scheduling ONE-OFF run in 2 minutes from Now');
							_agenda.schedule(nowMoment.toDate(), aJobDef.id, aJobDef.data);
						} else {
							if (aJobDef.cronTerm != 'NEVER'){
								if (aJobDef.hcheckId){
									if (!aJobDef.data) aJobDef.data = {}; 
									
									aJobDef.data.hcheckId = aJobDef.hcheckId;
								}
								_agenda.every(aJobDef.cronTerm, aJobDef.id, aJobDef.data);
							};
						}
					})
					aPromise.resolve();
				}
			}
		);

		return aPromise;
	};

	var init = function(){
		// in case any jobs are locked, we will manually unlock them
	    _agenda._collection.update({
	        lockedAt: {
	            $exists: true
	        }
	    }, {
	        $set: {
	            lockedAt: null
	        }
	    }, {
	        multi: true
	    }, null);
	}

	return {
		setupJobs:setupJobs,
		init:init
	}
}