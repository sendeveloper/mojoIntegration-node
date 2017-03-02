
var moment = require('moment-timezone');

var _ = require('lodash');

var trkTruck = function(){
    
    var truckDiscountListGet = function(request, response){
        response.success({
            discounts:[
                {
                    name:"Fixed $ Amount",
                    type:01,
                    value:1.50
                },
                {
                    name:"Fixed %",
                    type:02,
                    value:9.10
                },
                {
                    name:"Variable $ amount",
                    type:01,
                    value:0
                },
                {
                    name:"Variable % amount",
                    type:02,
                }
            ]
        });
    }

	var truckScheduleGet = function(request, response){

		// var requestParams = request.params;
        var requestParams = request.params;

		return this._truckScheduleGet(requestParams)
		.then(function(events){
			response.success(events);
		}, function(error){
			response.error(error);
		});
	}

    var _truckScheduleGet = function(requestParams){
		try{ 

            if (!(requestParams.truckId || requestParams.vendorId)){
                throw {
                    message: 'Truck Id or Vendor ID are not specified',
                    code: '400'
                };          
            };
 
            if(!(requestParams.fromTimeStamp && requestParams.toTimeStamp)) {
                throw {
                    message: 'Start and End time stamps required',
                    code: '400'
                };
            };
 
            var events = [];
 
            var TruckScheduleEvents = Parse.Object.extend("TruckScheduleEvent");
            var query = new Parse.Query(TruckScheduleEvents);
 
            if (requestParams.truckId){
                var Truck = Parse.Object.extend("Truck");
                var truckObject = new Truck();
                truckObject.id = requestParams.truckId;
                query.equalTo("truck", truckObject);
            };
 
            var publishPrivateEvents;
 
            if (requestParams.vendorId){
                var Vendor = Parse.Object.extend("Vendor");
                var vendorObject = new Vendor();
                vendorObject.id = requestParams.vendorId;
                //publishPrivateEvents = vendorObject.get('settings').publishPrivateEvents;
                query.equalTo("vendor", vendorObject);
                // console.log('vendor is ' + requestParams.vendorId);
 
            };
 
            var rangeStart=moment(requestParams.fromTimeStamp).utc().toDate();
            var rangeEnd=moment(requestParams.toTimeStamp).utc().toDate();
            // var rangeStart=moment().utc(requestParams.fromTimeStamp).toDate();
            // var rangeEnd=moment().utc(requestParams.toTimeStamp).toDate();
            // console.log(rangeStart);
            // console.log(rangeEnd);
 
            query.include('vendor', 'truck', 'overrideMenu', "bulkMenuHeader");
            // query.include('truck', 'overrideMenu');
            query.limit(1000);
 
            return query.find({useMasterKey:true})
            .then(function(scheduleResults){
                // console.log('No of schedule events found for truck ' + requestParams.truckId + 'are: ' + scheduleResults.length);
                console.log('from time stamp is ' + requestParams.fromTimeStamp);
                console.log('to time stamp is ' + requestParams.toTimeStamp);
 
                // var rangeStart=moment(requestParams.fromTimeStamp).utc().toDate();
                // var rangeEnd=moment(requestParams.toTimeStamp).utc().toDate();
                
                //convert to date-time object
                for(var i=0;i<scheduleResults.length;i++){

                    recordHit = false;
                    var aScheduleRecord = scheduleResults[i];
                    // console.log(JSON.stringify(aScheduleRecord.get("truck")));
                    // console.log(JSON.stringify(aScheduleRecord.get("truck").get("vendor")));

                    //do not load schedule for deleted trucks 
                    if (requestParams.ignoreDeletedTrucks == true){
                        if (aScheduleRecord.get("truck") && aScheduleRecord.get("truck").get("deleted") == true)
                            continue;  
                    }

                    var settings = aScheduleRecord.get('vendor').toJSON().settings;
                    var vendorTimeZone = aScheduleRecord.get('vendor').get("timeZone");
                     
                    if (requestParams.crewId){
                        //if a crew member ID has been specified then check if this event
                        //is relevant to this crew member
                        //also, we ignore the private flag since we are fetching
                        // all assigned events for a crew member schedule
                        var assignedCrew = aScheduleRecord.get("crewData");
                        if (assignedCrew){
                            var matchingCrewObjects = _.filter(assignedCrew.members, function(crewMemberEntry){ 
                                //console.log('Comparing ' + crewMemberEntry.id + ' with crewId Param ' + requestParams.crewId);
                                if (crewMemberEntry.id == requestParams.crewId)
                                    return true
                                        else return false;
                            });
                            //console.log('Is applicable : ' + JSON.stringify(isApplicable));
                            if (matchingCrewObjects.length == 0)
                                continue;
                        }
 
                    } else {
 
                        //console.log('settings are ' + JSON.stringify(settings.publishPrivateEvents));
                        //console.log('private event ' + aScheduleRecord.get("isPrivate"));
                        if (!requestParams.ignorePrivateSettings)
                            if (settings)
                                if (!settings.publishPrivateEvents && aScheduleRecord.get("isPrivate")){
                                    //console.log('Private event! do not return');
                                    continue;
                                }
                    }
 
                    var isRecurring = false;
                    if ( aScheduleRecord.get("recurrence") > 0)
                        isRecurring = true;
         
                    // console.log('Start of event is ' + aScheduleRecord.get("startDateTime"));
                    // console.log('end of event is ' + aScheduleRecord.get("endDateTime"));

                    // if (aScheduleRecord.get("startDateTime") >= rangeStart)
                    //     console.log('record start is >= rangeStart')
                    // else console.log('Not');

                    // var scheduleStartMoment = new moment(aScheduleRecord.get("startDateTime"));
                    // var scheduleEndMoment = new moment(aScheduleRecord.get("endDateTime"));

                    // if (scheduleStartMoment.isSameOrAfter(rangeStart))
                    //     console.log('record start is >= rangeStart')
                    // else console.log('Not');                        

                    // process non recurring events here
                    if (isRecurring == false)
                        if (    (aScheduleRecord.get("startDateTime") >= rangeStart && aScheduleRecord.get("startDateTime")  <= rangeEnd) ||
                                (aScheduleRecord.get("startDateTime") <= rangeStart && aScheduleRecord.get("endDateTime") >= rangeStart) ||
                                (aScheduleRecord.get("endDateTime") >= rangeStart && aScheduleRecord.get("endDateTime") <= rangeEnd) ){
 
                            events.push({
                                'objectId' : aScheduleRecord.id,
                                'startDateTime': aScheduleRecord.get("startDateTime"),
                                'endDateTime': aScheduleRecord.get("endDateTime"),
                                'name': aScheduleRecord.get("name"),
                                'locationData': aScheduleRecord.get("locationData"),
                                'crewData': aScheduleRecord.get("crewData"),
                                'isRecurring' :isRecurring,
                                'recurrence': aScheduleRecord.get("recurrence"),
                                'editRecurringEvent': aScheduleRecord.get("editRecurringEvent"),
                                'recurrenceConstraints': aScheduleRecord.get("recurrenceConstraints"),
                                'isPrivate': aScheduleRecord.get('isPrivate'),
                                'truck': aScheduleRecord.get('truck'),
                                'overrideMenu': aScheduleRecord.get('overrideMenu'),
                                'overrideBulkMenu': aScheduleRecord.get('overrideBulkMenu')
 
                            });
                        };
 
                    //if this is a recurring event then calculate the recurrence events
                    // that fall within this range and add them to the result set
                    if (isRecurring == true){
                        // console.log('++++++++++++++Processing Schedule Record +++++++++++++++++');
 
                        var addDays = 0;
                        var testDate = new Date(rangeStart);
 
                       switch(aScheduleRecord.get("recurrence")) {
                         case 1:
                           addDays=1;
                           break;
                            
                         case 2: 
                           addDays=7;
                           break;
                            
                         case 3:
                           addDays=14;
                           break;
                            
                         case 4:
                           addDays=30;
                           break;
                        };
 
                        //we have found a recurring event
                        //need to calculate out all the events and see if any of the events
                        //full into the requested date range
                        var getOut = false;
                        var startDateTime = new moment(aScheduleRecord.get("startDateTime"));
                        var endDateTime = new moment(aScheduleRecord.get("endDateTime"));
                        var testDateStart = startDateTime.clone();
                        var testDateEnd = endDateTime.clone();
 
                        // console.log('range start is ' + rangeStart.toString());
                        // console.log('range end is ' + rangeEnd.toString());
 
                        while (!getOut){
                            var skipRecurrence = false;
 
                            var overlap = false;
 
                            if (testDateStart.isBetween(rangeStart, rangeEnd))
                                overlap = true;
 
                            if (testDateEnd.isBetween(rangeStart, rangeEnd))
                                overlap = true;
 
                            if (testDateStart.isSame(rangeStart))
                                overlap = true;
 
                            if (testDateStart.isSame(rangeEnd))
                                overlap = true;
 
                            if (testDateEnd.isSame(rangeStart))
                                overlap = true;
 
                            if (testDateEnd.isSame(rangeEnd))
                                overlap = true;
 
                            //ok now check if the testDate is within (or equal to) the requested range
                            // console.log('TEST DATE is ' + testDate.toString());
                             
                            // var momentRange = require("cloud/moment-range.js");
                            // console.log(momentRange);
                            // var requestedRange = new momentRange.range(rangeStart, rangeEnd);
                            // var testRange = new momentRange.range(testDateStart, testDateEnd);
 
 
                            // var isSameAsEnd = testDate.isSame(rangeEnd);
                            // var isSameAsStart = testDate.isSame(rangeStart);
 
                            // var isAfterStart = testDate.isAfter(rangeStart);
                             
                            // if (testDate.date() == 5)
                            //  console.log('range start is ' + rangeStart + ' when testDate is ' + moment(testDate).toString() + ' Is After start is ' + isAfterStart);
 
                            // var isBeforeEnd = testDate.isBefore(rangeEnd);
                             
                            // console.log(testDate.date());
 
                            // if (aScheduleRecord.id == 'kPFucZQ8Yf')
                            // console.log(testDate.toString() + ':' + isSameAsStart + ' ' + isSameAsEnd + ' ' + isAfterStart + ' ' + isBeforeEnd);
                             
                            // if (isSameAsEnd || isSameAsStart || (isAfterStart && isBeforeEnd) ){
                                // if (testDate.date() == 4)
                                //  console.log('bingo. checking constraints...');
                            if (overlap == true){
                                if(aScheduleRecord.get("recurrenceConstraints")) {
                                    for(var j=0;j<aScheduleRecord.get("recurrenceConstraints").length;j++) {
                                        var currentDate = new Date(testDateStart.toDate());
                                        var skipDate = new Date(aScheduleRecord.get("recurrenceConstraints")[j].date);
                                        currentDate.setHours(0,0,0,0);
                                        skipDate.setHours(0,0,0,0);
                      
                                        if (+currentDate == +skipDate && aScheduleRecord.get("recurrenceConstraints")[j].action=="SKIP")
                                            skipRecurrence=true;
                                                else
                                                    if(+currentDate>=+skipDate && aScheduleRecord.get("recurrenceConstraints")[j].action=="STOP")
                                                        skipRecurrence=true;
                                    }
 
                                };
 
                                // if (testDate.date() == 4)
                                //  console.log(testDate.date() + 'Skip Recurrence should be false and it is ' + skipRecurrence);
 
                                if (!skipRecurrence){
                                     
                                    //calculate the end date time of this instance of the recurring event
                                    var duration= aScheduleRecord.get("endDateTime").getTime() - aScheduleRecord.get("startDateTime").getTime();
                                    // console.log('duration is ' + duration);
 
                                    var eventEndDateTime = new moment.tz(testDateStart.clone(), vendorTimeZone);
                                    var eventStartDateTime = new moment.tz(testDateStart.clone(), vendorTimeZone);
 
                                    // console.log('after clone, event end is ' + eventEndDateTime.toString());
 
                                    eventEndDateTime.add(duration, 'milliseconds');
                                    // console.log('event start is ' + eventStartDateTime.toDate());
                                    // console.log('event end is ' + eventEndDateTime.toDate());
 
                                    //get the vendor's timezone, and see if the schedule record start date had DST or not
                                    // console.log('time zone is ' + aScheduleRecord.get('vendor').get("timeZone"));
 
                                    var scheduleStartDateTimeMoment = new moment.tz(aScheduleRecord.get("startDateTime").toISOString(), vendorTimeZone );
 
                                    var scheduleStartIsDst = scheduleStartDateTimeMoment.isDST();
 
                                    //now is this event the same as the schedule record start date
                                    var eventStartIsDst = eventStartDateTime.isDST();
                                    // console.log('schedule start is dst: ' + scheduleStartIsDst);
 
                                    if (eventStartIsDst != scheduleStartIsDst){
                                        // if (testDate.date() == 4)
                                        //  console.log('DST change! Adjusting...');
                                        //we have had a DST change and we need to adjust the UTC time accordingly
 
                                        //the offsetDif is the number of mimnutes that the UTC offset has changed
                                        var offsetDiff =  scheduleStartDateTimeMoment.utcOffset() - eventStartDateTime.utcOffset();
                                        // console.log('utc offset is ' + eventStartDateTime.utcOffset());
                                        // console.log('2nd utc offset is ' + scheduleStartDateTimeMoment.utcOffset());
                                         
                                        // console.log('offset difference is ' + offsetDiff);
                                        //now add the offset to the eventstart date time and event end date time
                                        eventStartDateTime.add(offsetDiff, 'minutes');
                                        eventEndDateTime.add(offsetDiff, 'minutes');
                                        //remmeber that the offsetDiff might be negative so this 'addition' could really be a subtraction
 
                                    };
 
                                    // console.log('Adding RECURRENCE ' + aScheduleRecord.id + ' to result');
 
                                    // if (testDate.date() == 4){
                                    //  console.log('event start date time ' + eventStartDateTime.utc().toString());
                                    //  console.log('event end date time ' + eventEndDateTime.utc().toString());
                                    // }

                                    events.push({
                                        objectId: aScheduleRecord.id,
                                        name: aScheduleRecord.get("name"),
                                        startDateTime: eventStartDateTime.utc().toDate(), //convert from moment to JS Date Object
                                        endDateTime: eventEndDateTime.utc().toDate(),
                                        locationData:aScheduleRecord.get("locationData"),
                                        crewData: aScheduleRecord.get("crewData"),
                                        isRecurring: true,
                                        recurrence: aScheduleRecord.get("recurrence"),
                                        editRecurringEvent: aScheduleRecord.get("editRecurringEvent"),
                                        recurrenceConstraints: aScheduleRecord.get("recurrenceConstraints"),
                                        isPrivate: aScheduleRecord.get('isPrivate'),
                                        truck:aScheduleRecord.get('truck'),
                                        overrideMenu: aScheduleRecord.get('overrideMenu'),
                                        overrideBulkMenu: aScheduleRecord.get('overrideBulkMenu')
                                    });         
                                }
 
                            };
 
                            //if we are beyond the end of the range requested, then we are done.
                            var isAfterEnd = moment(testDateStart).isAfter(rangeEnd);
                            if (isAfterEnd){
                                getOut = true;
                                // console.log('get out is TRUE' + testDateStart.toString());
                            };
 
                            testDateStart.add(addDays, 'days');
                            testDateEnd.add(addDays, 'days');
                        } 
                         
                    }        
                }
                // console.log(events);
                return Parse.Promise.as();
 
	    	}).then(function(){
	    		console.log('returning ' + events.length + ' events');
	      		return Parse.Promise.as(events);	    		
	    	}, function(error){
                return Parse.Promise.error({"message":error.message, "code":error.code});
            });

		} catch(error){
			return Parse.Promise.error({"message":error.message, "code":error.code});
		}
    };

    var truckSetStatus = function(request, response) {

    	try {
    		console.log('in truck set status');
    		// var requestParams = request.params;
            var requestParams = request.params;
    		var lat,lng;

    		lat=requestParams.latitude?requestParams.latitude:0;
    		lng=requestParams.longitude?requestParams.longitude:0;


			if (!requestParams.truckId){
			    throw {
	      			message: 'truckId is required',
			      	code: 400
			    }			
			}

			if(!requestParams.status) {
				throw {
					message: 'Truck status is required',
					code: 400
				}
			}

  			var query= new Parse.Query("Truck");

  			query.get(requestParams.truckId, {sessionToken: request.user.get("sessionToken")})
  				.then(
  					
  					function(truckObj) {		//success getting the truck
  						truckObj.set("currentStatus",requestParams.status);

  						if(requestParams.status=="OPEN" && lat!=0 && lng!=0) {			//update the location
  							var coord = new Parse.GeoPoint(lat, lng);
  							truckObj.set("lastLocation",coord);
  							truckObj.set("locationUpdateStamp",new Date());
  						}

  						return truckObj.save({}, {sessionToken: request.user.get("sessionToken")});
  					},
  					
  					function(error) {			//error
  						return Parse.Promise.error(error);
  					
  					}

  				)

  				.then(
  					function(result) {			//all good! return success response
  						response.success({code:200,message:"Truck status updated"});
  					},

  					function(error) {
  						response.error(error);
  					}
  				);


    	}

    	catch(error) {
    		response.error(error);
    	}
    };

    var truckDeleteById = function(request, response){
    	var requestParams = request.params;

    	//if any of the crew records have this truck, blank it out
  		var Truck = Parse.Object.extend("Truck");
  		var truckObject = new Truck();
    	truckObject.id = requestParams.truckId;

    	var CrewMember = Parse.Object.extend("CrewMember");
    	var query = new Parse.Query(CrewMember);
    	query.equalTo("truck", truckObject);
    	query.find({sessionToken:request.user.get("sessionToken")})
    	.then(function(crewRecords){
    		var promise = Parse.Promise.as();
    		_.each(crewRecords, function(crewRecord){
    			promise = promise.then(function(){
    				crewRecord.set("truck", null);
    				return crewRecord.save();
    			});
    		});
    		return promise;
    	}).then(function(){
    		var TruckScheduleEvent = Parse.Object.extend("TruckScheduleEvent");
    		var query = new Parse.Query(TruckScheduleEvent);
    		query.equalTo("truck", truckObject);
    		query.find()
    		.then(function(truckScheduleEvents){
	    		var promise = Parse.Promise.as();
	    		_.each(truckScheduleEvents, function(truckScheduleEvent){
                    console.log('Processing schedule event ' + truckScheduleEvent.id);

	    			promise = promise.then(function(){
                        var SocialPosting = Parse.Object.extend("SocialPosting");
                        var socialPostingQuery = new Parse.Query(SocialPosting);
                        socialPostingQuery.equalTo("parentColl", {"collName":"truckScheduleEvents","id":truckScheduleEvent.id})
                        socialPostingQuery.first()
                        .then(function(socialPostingRecord){
                            
                            if (socialPostingRecord){
                                console.log('deleting social posting' + socialPostingRecord.id);
                                return socialPostingRecord.destroy(); //there should only be 1 record per event
                            } else 
                                return Parse.Promise.as();
                        
                        }).then(function(){
                            console.log('deleting schedule event ' + truckScheduleEvent.id);
                            return truckScheduleEvent.destroy();
                        });
	    			});
	    		});
	    		return promise;
            });    			
    	}).then(function(){
    		//all is well, delete the truck
    		console.log('deleting truck (settings delete flag to true...)');
    		// truckObject.destroy()
            truckObject.save({deleted:true}, {sessionToken:request.user.get("sessionToken")})
    		.then(function(){
    			response.success({deleteId:requestParams.truckId});
    		});
    	}, function(error){
            response.error(error);
        });
    };

    var sendCrewPinRequest = function(request, response){
		
		var requestParams = request.params;

		var aCrewMember = null;
		var smsText = null;
 		var parseConfig = {};
 		var crewReuest = null;
 		var expiresOn = moment().utc().add(12, 'hours').toDate();

 		console.log('looking for crew member id ' + requestParams.crewId);
 		var CrewMember = Parse.Object.extend("CrewMember");
		var query = new Parse.Query(CrewMember);
		query.get(requestParams.crewId)
		.then(function(resultCrewMember){
			aCrewMember = resultCrewMember;
			//now create a PIN request
			var CrewPinRequest = Parse.Object.extend("crewPinRequest");
			var CrewPinRequest = new CrewPinRequest();
			return CrewPinRequest.save({crewMember:aCrewMember, expirationDateTime:expiresOn});
		}).then(function(aCrewRequest){
			crewRequest = aCrewRequest;

			return Parse.Config.get()
		}).then(function(aConfig){
			parseConfig = aConfig;

			var smsInterface = require('./smsInterface.js');
			smsInterface.init(parseConfig);			

			smsText = 'Hi ' + aCrewMember.get("firstName") 
			+ '. Please click on the link to create/update your PIN. This link will expire in 12 hours.';
			//each crew member has a different URL because the parameters will be different

			TrkUtils = require('./utility.js').trkUtility;
			var trkUtils = new TrkUtils();
			// set expirate date to 12 hours from now
			return trkUtils.createTrkUrl('/pincreateupdate.htm?crewrequestid=' + crewRequest.id, expiresOn)
		}).then(function(resultUrl){

			smsText = smsText + ' ' + resultUrl;
			//console.log('SMS is ' + smsText);
			console.log('Sending SMS to Crew Member ' + aCrewMember.id);
			var smsInterface = require('./sms-interface.js');
			return smsInterface.sendSMS(aCrewMember.get("phoneNumber"), smsText)

    	}).then(function(){
    		response.success();
    	}, function(error){
    		response.error(error);
    	});
	};

    var completeCrewPinRequest = function(request, response){
		
		var requestParams = request.params;
		console.log(requestParams);

		var aCrewRequestRecord = null;

		var CrewPinRequest = Parse.Object.extend("crewPinRequest");
		var query = new Parse.Query(CrewPinRequest);
		query.include('crewMember.vendor');
		query.get(requestParams.pinRequestId)
		.fail(function(){
			return Parse.Promise.error('Request has expired. Please ask your manager to re-send the request.');
		}).then(function(crewRequestRecord){
			aCrewRequestRecord = crewRequestRecord;

			if (crewRequestRecord){
				//now check if the PIN is unique. If it is not then reject and prompt the user
				//to select another PIN
				var crewQuery = new Parse.Query('CrewMember');
				console.log('vendor is ' + JSON.stringify(crewRequestRecord.get("crewMember").get("vendor")));
				crewQuery.equalTo('vendor', crewRequestRecord.get("crewMember").get("vendor"));
				crewQuery.equalTo('pin', parseInt(requestParams.pin));
				return crewQuery.find()
				.then(function(matchingCrewRecords){
					if (matchingCrewRecords.length > 0)
						return Parse.Promisecerror("Selected PIN not allowed. Please try a different code")
					else 
						return Parse.Promise.as();
				});
			};
		}).then(function(){
			var crewMember = aCrewRequestRecord.get("crewMember");
			crewMember.set("pin", parseInt(requestParams.pin));
			return crewMember.save();
		}).then(function(){
			return aCrewRequestRecord.destroy();
		}).then(function(){
			response.success('PIN has been set succesfully. You can now log into the POS using your PIN.')
		}, function(error){
			response.error(error);
		});
	};

	verifyCrewPin = function(request, response){
		var requestParams = request.params;
		console.log(requestParams);

		var aCrewRequestRecord = null;

		var CrewMember = Parse.Object.extend("CrewMember");
		var query = new Parse.Query(CrewMember);
		query.equalTo('crewMember.vendor', {__type:"Pointer", className:"Vendor", objectId: requestParams.vendorId });
		query.equalTo('pin', requestParams.pin);
		query.find()
		.fail(function(){
			return Parse.Promise.error('PIN not found.');
		}).then(function(crewRecords){

			if (crewRecords.length > 0)
				response.success(crewRecords[0].toJSON());
			else
				response.error('PIN not found');

		}, function(error){
			response.error(error);
		});
	};

    var notifyCrewSchedule = function(request, status){
		//this batch job will find all the crew that 
		//need to receive a weekly schedule and send a SMS
		//to them with a link to their schedule
 		var aCrewList = [];
 		var errorCrewList = [];
 		var vendorList = [];
 		var parseConfig = {};

 		var CrewMember = Parse.Object.extend("CrewMember");
		var query = new Parse.Query(CrewMember);
		query.equalTo("sendScheduleSMS", true);
		query.notEqualTo("phoneNumber", null);
		query.ascending('vendor');
		query.include('vendor');
		query.find()
		.then(function(crewRecords){
			aCrewList = crewRecords;
			status.message(crewRecords.length + ' crew members found.');
			console.log(crewRecords.length + ' crew members found.');
			return Parse.Config.get()
		}).then(function(aConfig){
			parseConfig = aConfig;

			var smsInterface = require('./sms-interface.js');
			smsInterface.init(parseConfig);
			
			var promise = Parse.Promise.as();
			//for each crew member, put the url together and send the text 
			_.each(aCrewList, function(aCrewMember){
				var crewVendor = aCrewMember.get("vendor");
				var vendorJSON;

				var vendorInList = _.find(vendorList, function(aVendorEntry) { 

					//console.log('vendor entry id is ' + aVendorEntry.vendorJSON.objectId);
					//console.log('vendor JSON id is ' + vendorJSON.objectId);
					if (aVendorEntry.vendorJSON.objectId == crewVendor.id)
						return aVendorEntry;
				});

				//add vendor to the vendor array
				if (!vendorInList){
					console.log('adding vendor to Vendor list ' + crewVendor.id);
					vendorJSON = crewVendor.toJSON();
					vendorList.push({vendorObject: crewVendor, vendorJSON:vendorJSON});
				} else {
					crewVendor = vendorInList.vendorObject;
					vendorJSON = vendorInList.vendorJSON;
				}

				var smsText = 'Hi ' + aCrewMember.get("firstName") 
				+ '. Here is this weeks schedule for ' 
				+ vendorJSON.description;
				//each crew member has a different URL because the parameters will be different

				promise = promise.then(function() {
					TrkUtils = require('cloud/utility.js').trkUtility;
					var trkUtils = new TrkUtils();
					// set expirate date to 7 days from now
					var expiresOn = moment().utc().add(7, 'days').toDate();
					return trkUtils.createTrkUrl('/schedule?vendorid=' + vendorJSON.objectId 
												+ '&crewid=' + aCrewMember.id + '&defaultView=basicWeek', expiresOn)
					.then(function(resultUrl){
						smsText = smsText + ' ' + resultUrl;
						//console.log('SMS is ' + smsText);
    					console.log('Sending SMS to Crew Member ' + aCrewMember.id);
	    				return smsInterface.sendSMS(aCrewMember.get("phoneNumber"), smsText)
	    				.fail(function(httpError){
							return Parse.Promise.as(httpError); 					
	    				}).then(function(xhrResponse){
	    					console.log('xhrResponse is ' + JSON.stringify(xhrResponse));
	    					//telAPI returns queued for succesful send, replace this with OK
	    					if (xhrResponse.data.status == "queued"){
	    						xhrResponse.data.message = 'Sent succesfully';
	    					}

	    					console.log('RESPONSE from telAPI is ' + JSON.stringify(xhrResponse.data));
	    					if (!vendorJSON.crewSMSList)
								vendorJSON.crewSMSList = [];
								
							console.log('Pushing crew member ' + aCrewMember.id);

	 						vendorJSON.crewSMSList.push({	crew: aCrewMember, 
															smsResponseObj: {	
																code: xhrResponse.data.status, 
																message: xhrResponse.data.message
															}
														});	 

							return Parse.Promise.as(); 
	    				});
					});
    			});
    		});
			return promise;
    	}).then(function(){
    		var promise = Parse.Promise.as();

    		//console.log('All SMS are sent. Process email for ' + vendorList.length + ' vendors');
    		_.each(vendorList, function(aVendor){
    			promise = promise.then(function() {
	    			console.log('Finding user for vendor ' + JSON.stringify(aVendor.vendorObject));
					//get the email address to send to
					var User = Parse.Object.extend("User");
					var userQuery = new Parse.Query(User);
					userQuery.equalTo("vendor", aVendor.vendorObject);
					console.log('finding first record...');
					userQuery.first({
						useMasterKey: true, 
						success: function(foundRecords){
							console.log('success getting user record' + JSON.stringify(foundRecords));
						},
						error: function(errorObj){
							console.log('error getting user record: ' + JSON.stringify(errorObj));
						}
					}).then(function(resultUser){
						//now send en email to the vendor 
						//notifying them of the schedule sent
					//	console.log('user(s) found!' + JSON.stringify(resultUser));
						console.log('Sending email to ' + resultUser.getEmail());
					 	
					 	var mandrillAPIKey = parseConfig.get("MandrillAPIKey");
				  		var Mandrill = require('mandrill');
				  		Mandrill.initialize(mandrillAPIKey);

				  		var mailParams = {
				  			async:true, 
				  			template_name: "schedulesendnotify",
				  			template_content:[{
				  				name:'smsSendResponse',
				  				content:''
				  			}],
				  			message: {
				  				to: [{
				  					email: resultUser.getEmail(),
				  					type: 'to'
				  				}]
				  			}
				  		};

				  		console.log('Crew SMS list is ' + JSON.stringify(aVendor.vendorJSON.crewSMSList));
						_.each(aVendor.vendorJSON.crewSMSList, function(smsCrewResponse, recordIndex){
							var fullName = smsCrewResponse.crew.get('firstName') + ' ' + smsCrewResponse.crew.get('lastName');
							var aMsg = smsCrewResponse.smsResponseObj.message;
							var content = mailParams.template_content[0].content;

							mailParams.template_content[0].content = content + '<p>' + fullName  +  ' : ' + aMsg + '</p>'
						});
						
						console.log('Calling Mandrill with ' + JSON.stringify(mailParams));

					  	return mandrill_client.messages.sendTemplate( mailParams, {
					  		success: function(httpResponse){
					  			//return a response to the user
					  			console.log('Mandril response is ...' + JSON.stringify(httpResponse[0]));
					  		},
					  		error: function(httpResponse){
					  			console.log('Error sending Mandril Email...' + JSON.stringify(httpResponse));
					  			//promise.error(httpResponse.data);
					  		}
					  	});	

					});
				});

    		});
			console.log('All SMS has been processed.');
			return Parse.Promise.as();
    	}).then(function(){
    		status.success();
    	}, function(error){
    		status.error(error);
    	});
	};
    
    return {
        truckScheduleGet : truckScheduleGet,
        _truckScheduleGet: _truckScheduleGet,
        truckDeleteById: truckDeleteById,
        truckSetStatus: truckSetStatus,
        notifyCrewSchedule: notifyCrewSchedule,
        sendCrewPinRequest: sendCrewPinRequest,
        completeCrewPinRequest:completeCrewPinRequest
    };

}

exports.trkTruck = trkTruck;