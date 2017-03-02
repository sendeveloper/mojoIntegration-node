    // Schedule
    var ScheduleDataSource = function(appModel) {
        return new kendo.data.DataSource({

        transport: {

            read: function(options) {
                    if (!options.data.fromTimeStamp || !options.data.toTimeStamp)
                        options.error('Start and End Dates are not defined')
                    else 
                        $.ajax({
                            url: "/parse/functions/truckScheduleGet",
                            dataType: "json",
                            type:"POST",
                            headers: appModel.parse._headers,

                            data:kendo.stringify({
                                vendorId: appModel.userInfo.vendorID,
                                fromTimeStamp: options.data.fromTimeStamp,
                                toTimeStamp: options.data.toTimeStamp,
                                truckId:options.data.truckId,
                                showRecurringDuplicate: options.data.showRecurringDuplicate
                            }),
                            
                            success: function(response) {
                                options.success(response.result);
                                
                            },

                            error: function(jqXHR,textStatus,errorThrown) {
                                options.error(jqXHR.responseJSON);
                                
                            }

                        });

            },           
            // read: function(options) {
            //     $.ajax({
                    
            //         url: "/parse/classes/TruckScheduleEvent/",
            //         dataType: "json",
            //         type:"GET",
            //         headers: appModel.parse._headers,

                    
            //        data:{where: kendo.stringify({'vendor':appModel.getParsePointer(appModel.parse._vendor, "Vendor")})},
            //         success: function(jsonResponse) {
            //             options.success(jsonResponse.results);
                        
            //         },

            //         error: function(jqXHR,textStatus,errorThrown) {
            //             var responseObj = {};
            //             responseObj = $.extend( responseObj, options.data, jqXHR.responseJSON);
            //             options.error( responseObj );
            //         }
            //     });

            // },

            create: function(options) {
                
                var _options=this.prepareDataForSave($.extend({},options.data));

                $.ajax({
                    url: "/parse/classes/TruckScheduleEvent/",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(_options),
                    
                    success: function(jsonResponse) {
                        options.data.objectId=jsonResponse.objectId;
                        options.success(options.data);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        var responseObj = {};
                        responseObj = $.extend( responseObj, options.data, jqXHR.responseJSON);
                        options.error( responseObj );
                    }
                });
            },

            update: function(options) {
                
                var url="/parse/classes/TruckScheduleEvent/"+options.data["objectId"];
                var _options=this.prepareDataForSave($.extend({},options.data));

                $.ajax({
                    url: url,
                    dataType: "json",
                    type:"PUT",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(_options),
                    
                    success: function(jsonResponse) {
                        options.success(options.data);
                        
                    },
                    error: function(jqXHR,textStatus,errorThrown) {
                        var responseObj = {};
                        responseObj = $.extend( responseObj, options.data, jqXHR.responseJSON);
                        options.error( responseObj );
                    }
                });
            },

            destroy: function(options) {
                
                var url="/parse/classes/TruckScheduleEvent/"+options.data["objectId"];

                $.ajax({
                    url: url,
                    dataType: "json",
                    type:"DELETE",
                    headers: appModel.parse._headers,
                    
                    success: function(jsonResponse) {
                        options.success(options.data);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        var responseObj = {};
                        responseObj = $.extend( responseObj, options.data, jqXHR.responseJSON);
                        options.error( responseObj );
                    }
                });
            },

            prepareDataForSave: function(options) {
                
                $(options).removeProp("objectId").removeProp("createdAt").removeProp("updatedAt").removeProp("menuHeaders")
                .removeProp("isRecurring");
                
                options["vendor"]= appModel.getParsePointer(appModel.parse._vendor, "Vendor");

                if(!options.truck.objectId) {
                    $(options).removeProp("truck");
                    options.truck=null;
                } else {
                    //make sure that the truck we pass is a pointer
                    options["truck"]= appModel.getParsePointer(options["truck"], "Truck");

                }


                if (options.overrideMenu){
                    if(!options.overrideMenu.objectId ) {
                        $(options).prop("overrideMenu", null);
                    } else {
                        //convert to Parse Pointer
                        options["overrideMenu"]= appModel.getParsePointer(options["overrideMenu"], "MenuHeader");
                    }


                } else {
                    $(options).prop("overrideMenu", null);
                };

                if (options.overrideBulkMenu){
                    if(!options.overrideBulkMenu.objectId ) {
                        $(options).prop("overrideBulkMenu", null);
                    } else {
                        //convert to Parse Pointer
                        options["overrideBulkMenu"]= appModel.getParsePointer(options["overrideBulkMenu"], "MenuHeader");
                    }
                } else 
                    $(options).prop("overrideBulkMenu", null);

                if (options.startDateTime)
                    options.startDateTime={"__type":"Date","iso":options.startDateTime.toISOString()};
                if (options.endDateTime)
                    options.endDateTime={"__type":"Date","iso":options.endDateTime.toISOString()};

                if(options.recurrenceEndDate) options.recurrenceEndDate={"__type":"Date","iso":options.recurrenceEndDate.toISOString()};
                
                //delete any records that are not checked as there
                //is no point in stored in the back end
                if (options.crewData.members.length > 0){
                    for (var i = 0; i < options.crewData.members.length; i++){
                        if (options.crewData.members[i].isChecked == false){
                            options.crewData.members.splice(i, 1);
                            i--;
                            continue;
                        };
                        delete options.crewData.members[i].isChecked;
                        delete options.crewData.members[i].name;
                    }

                };

                if (options.recurrence)
                    options.recurrence = parseInt(options.recurrence);

                return options;
            } 
        },

        requestStart: function () {
            kendo.ui.progress($('body'), true);
        },
        requestEnd: function () {
            kendo.ui.progress($('body'), false);

        },

        schema: {

                   parse: function(data) {

                        for (var i = 0; i < data.length; i++) {

                           if(!data[i].hasOwnProperty("truck")) {
                                    data[i].truck={};
                                    data[i].truck.objectId=null;
                                    data[i].truck.className="Truck";
                            };
                           
                           data[i].startDateTime=new Date(data[i].startDateTime.iso);
                           data[i].endDateTime=new Date(data[i].endDateTime.iso);

                           if(data[i].recurrenceEndDate) data[i].recurrenceEndDate=new Date(data[i].recurrenceEndDate.iso);

                           if(!data[i].recurrenceConstraints) data[i].recurrenceConstraints=[];
                        }

                        
                        return data;
                    },

                    model: {
                    id: "objectId",      //model identifier

                    fields: {
                               "objectId": {
                                        nullable:true,
                                        editable:false
                               },

                               isPrivate: {
                                    from: "isPrivate",
                                    type: "boolean",
                                    editable: true
                               },

                                name: {
                                        from:"name",
                                        editable:true,
                                        type:'string'
                                        
                                },

                                truck: {
                                    from: "truck",
                                    editable: true
                                },

                                startDateTime: {
                                    from:"startDateTime",
                                    editable:true

                                },

                                endDateTime: {
                                    from:"endDateTime",
                                    editable:true
                                },

                                recurrence: {
                                    from: "recurrence",
                                    editable:true,
                                    type:"number"
                                    
                                },

                                recurrenceEndDate:{
                                    from: "recurrenceEndDate",
                                    editable: true
                                },

                                recurrenceConstraints: {
                                    from: "recurrenceConstraints",
                                    editable: true
                                },

                                locationData: {
                                    from: "locationData",
                                    editable: true
                                },

                                crewData: {
                                    from: "crewData",
                                    editable: true
                                },

                                social: {
                                    from: "social",
                                    editable: true
                                },

                                vendor: {
                                    from: "vendor",
                                    editable: true
                                }

                    }

                }
            }
        });
    }