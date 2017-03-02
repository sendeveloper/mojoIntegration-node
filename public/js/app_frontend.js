+function($,undefined){

    function setScrollingHeight(targetElement){
        // console.log(e);
        
        // var desiredHeight;
        //e.sender.element[0]).offset().top

        if ( $('#appFooter').is(":visible") )
            desiredHeight = window.innerHeight - $(targetElement).offset().top - $('#appFooter').height() -20; //20 is the fudge factor
        else
            desiredHeight = window.innerHeight - $(targetElement).offset().top - 20; //

        $(targetElement).css("max-height", desiredHeight );
    };

    function deferredCalcHeight(targetElement) {
        setTimeout(function(){
            setScrollingHeight(targetElement);
        },500);
    };

    function getDateObjectFromISO(isoDateString){

        var dtstr = isoDateString.replace(/\D/g," ");
        var dtcomps = dtstr.split(" ");

        // modify month between 1 based ISO 8601 and zero based Date
        dtcomps[1]--;
        return new Date(Date.UTC(dtcomps[0],dtcomps[1],dtcomps[2],dtcomps[3],dtcomps[4],dtcomps[5]));

        //return newDate;
    };

    // Defaults
    var appDefaults={};

    var kendoNotification=null;      // main window notification object

    /*  Data Sources
            -- all the kendoUI data sources are declared below
            -- need to create a new object of a data source to use it
    */

    // Trucks

var usStates = [
    {
        "name": "Alabama",
        "abbreviation": "AL"
    },
    {
        "name": "Alaska",
        "abbreviation": "AK"
    },
    {
        "name": "American Samoa",
        "abbreviation": "AS"
    },
    {
        "name": "Arizona",
        "abbreviation": "AZ"
    },
    {
        "name": "Arkansas",
        "abbreviation": "AR"
    },
    {
        "name": "California",
        "abbreviation": "CA"
    },
    {
        "name": "Colorado",
        "abbreviation": "CO"
    },
    {
        "name": "Connecticut",
        "abbreviation": "CT"
    },
    {
        "name": "Delaware",
        "abbreviation": "DE"
    },
    {
        "name": "District Of Columbia",
        "abbreviation": "DC"
    },
    {
        "name": "Federated States Of Micronesia",
        "abbreviation": "FM"
    },
    {
        "name": "Florida",
        "abbreviation": "FL"
    },
    {
        "name": "Georgia",
        "abbreviation": "GA"
    },
    {
        "name": "Guam",
        "abbreviation": "GU"
    },
    {
        "name": "Hawaii",
        "abbreviation": "HI"
    },
    {
        "name": "Idaho",
        "abbreviation": "ID"
    },
    {
        "name": "Illinois",
        "abbreviation": "IL"
    },
    {
        "name": "Indiana",
        "abbreviation": "IN"
    },
    {
        "name": "Iowa",
        "abbreviation": "IA"
    },
    {
        "name": "Kansas",
        "abbreviation": "KS"
    },
    {
        "name": "Kentucky",
        "abbreviation": "KY"
    },
    {
        "name": "Louisiana",
        "abbreviation": "LA"
    },
    {
        "name": "Maine",
        "abbreviation": "ME"
    },
    {
        "name": "Marshall Islands",
        "abbreviation": "MH"
    },
    {
        "name": "Maryland",
        "abbreviation": "MD"
    },
    {
        "name": "Massachusetts",
        "abbreviation": "MA"
    },
    {
        "name": "Michigan",
        "abbreviation": "MI"
    },
    {
        "name": "Minnesota",
        "abbreviation": "MN"
    },
    {
        "name": "Mississippi",
        "abbreviation": "MS"
    },
    {
        "name": "Missouri",
        "abbreviation": "MO"
    },
    {
        "name": "Montana",
        "abbreviation": "MT"
    },
    {
        "name": "Nebraska",
        "abbreviation": "NE"
    },
    {
        "name": "Nevada",
        "abbreviation": "NV"
    },
    {
        "name": "New Hampshire",
        "abbreviation": "NH"
    },
    {
        "name": "New Jersey",
        "abbreviation": "NJ"
    },
    {
        "name": "New Mexico",
        "abbreviation": "NM"
    },
    {
        "name": "New York",
        "abbreviation": "NY"
    },
    {
        "name": "North Carolina",
        "abbreviation": "NC"
    },
    {
        "name": "North Dakota",
        "abbreviation": "ND"
    },
    {
        "name": "Northern Mariana Islands",
        "abbreviation": "MP"
    },
    {
        "name": "Ohio",
        "abbreviation": "OH"
    },
    {
        "name": "Oklahoma",
        "abbreviation": "OK"
    },
    {
        "name": "Oregon",
        "abbreviation": "OR"
    },
    {
        "name": "Palau",
        "abbreviation": "PW"
    },
    {
        "name": "Pennsylvania",
        "abbreviation": "PA"
    },
    {
        "name": "Puerto Rico",
        "abbreviation": "PR"
    },
    {
        "name": "Rhode Island",
        "abbreviation": "RI"
    },
    {
        "name": "South Carolina",
        "abbreviation": "SC"
    },
    {
        "name": "South Dakota",
        "abbreviation": "SD"
    },
    {
        "name": "Tennessee",
        "abbreviation": "TN"
    },
    {
        "name": "Texas",
        "abbreviation": "TX"
    },
    {
        "name": "Utah",
        "abbreviation": "UT"
    },
    {
        "name": "Vermont",
        "abbreviation": "VT"
    },
    {
        "name": "Virgin Islands",
        "abbreviation": "VI"
    },
    {
        "name": "Virginia",
        "abbreviation": "VA"
    },
    {
        "name": "Washington",
        "abbreviation": "WA"
    },
    {
        "name": "West Virginia",
        "abbreviation": "WV"
    },
    {
        "name": "Wisconsin",
        "abbreviation": "WI"
    },
    {
        "name": "Wyoming",
        "abbreviation": "WY"
    }
];

    
    // Vendor
    var VendorDataSource = function(){ 
        return new kendo.data.DataSource({
            transport: {
               
                read: function(options) {
                    $.ajax({
                        // url:  "/parse/functions/vendorGetInfo",
                        url: "/parse/functions/vendorGetInfo",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,
                        // headers:{
                        //     'X-Parse-Application-Id': "myAppId", 
                        //     "Content-Type": "application/json"
                        // },
                        data:kendo.stringify({"vendorId":appModel.userInfo.vendorID}),
                        success: function(jsonResponse) {
                            options.success([jsonResponse.result]);
                            //options.success(jsonResponse.result);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(options.data);
                        }
                    }); 
                }
            }
        });
    }


    //Tax Codes
    var TaxCodesDataSource = function() { 
        return new kendo.data.DataSource({
        
        transport: {
           
            read: function(options) {
                $.ajax({
                    
                    url:  "/parse/classes/TaxCode/",
                    dataType: "json",
                    type:"GET",
                    headers: appModel.parse._headers,

                    data:{where: kendo.stringify({"vendor":appModel.getParsePointer(appModel.parse._vendor, "Vendor")}),order: "-applyToAll"},

                    success: function(jsonResponse) {
                        options.success(jsonResponse.results);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });

            },

            create: function(options) {
                
                var _options=this.prepareDataForSave($.extend({},options.data));

                $.ajax({
                    url:  "/parse/classes/TaxCode/",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(_options),
                    
                    success: function(jsonResponse) {
                        options.data.objectId=jsonResponse.objectId;
                        options.success(options.data);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            update: function(options) {
                
                var url= "/parse/classes/TaxCode/"+options.data["objectId"];
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
                        options.error(options.data);
                    }
                });
            },

            destroy: function(options) {
                
                var url= "/parse/classes/TaxCode/"+options.data["objectId"];

                $.ajax({
                    url: url,
                    dataType: "json",
                    type:"DELETE",
                    headers: appModel.parse._headers,
                    
                    success: function(jsonResponse) {
                        options.success(options.data);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            prepareDataForSave: function(options) {
               
                $(options).removeProp("id").removeProp("createdAt")
                .removeProp("updatedAt").removeProp("dirty");
                
                options["vendor"]=appModel.getParsePointer(appModel.parse._vendor, "Vendor");

                return options;
            }
        },

        schema: {
                
                model: {
                    id: "objectId",      //model identifier

                    fields: {
                               "objectId": {
                                        nullable:true,
                                        editable:false
                               },

                                description:"description",
                                percentage:"percentage",
                                applyToAll:"applyToAll",
                                vendor:"vendor",
                                extTaxId:"extTaxId"

                        }

                }
            }
        });
    }

    // Staff
    var StaffDataSource = function() {
        return new kendo.data.DataSource({

        transport: {
           
            read: function(options) {
                $.ajax({
                    
                    url:  "/parse/classes/CrewMember/",
                    dataType: "json",
                    type:"GET",
                    headers: appModel.parse._headers,

                    data:{where: kendo.stringify({'vendor':appModel.getParsePointer(appModel.parse._vendor, "Vendor")}),order:"firstName"},
                    success: function(jsonResponse) {
                        options.success(jsonResponse.results);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
            });

            },

            create: function(options) {
                
                var _options=this.prepareDataForSave($.extend({},options.data));

                $.ajax({
                    url:  "/parse/classes/CrewMember/",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(_options),
                    
                    success: function(jsonResponse) {
                        options.data.objectId=jsonResponse.objectId;
                        options.success(options.data);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            update: function(options) {
                
                var url= "/parse/classes/CrewMember/"+options.data["objectId"];
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
                        options.error(options.data);
                    }
                });
            },

            destroy: function(options) {
                
                var url= "/parse/classes/CrewMember/"+options.data["objectId"];

                $.ajax({
                    url: url,
                    dataType: "json",
                    type:"DELETE",
                    headers: appModel.parse._headers,
                    
                    success: function(jsonResponse) {
                        options.success(options.data);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            prepareDataForSave: function(options) {

                if(!options.truck.objectId) {
                    $(options).removeProp("truck");
                    options.truck=null;
                }

                $(options).removeProp("objectId").removeProp("createdAt").removeProp("updatedAt");
                
                options["vendor"]=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
                
                //parse expects the date to be a json object
                if (options.dateHired){
                    var tempDate = options.dateHired;
                    options.dateHired = {"__type":"Date", "iso": tempDate.toISOString() }
                };
                
                if (options.dateLeft){
                    var tempDate = options.dateLeft;
                    options.dateLeft = {"__type":"Date", "iso": tempDate.toISOString() }
                };

                return options;
            } 
        },

        schema: {

            parse: function(data) {
                if (data.length)
                    for(var i=0; i<data.length;i++) {
                        if (!data[i].hasOwnProperty("phoneNumber"))
                            data[i].phoneNumber=""

                        if((!data.hasOwnProperty("truck") || data[i].truck == null)){
                            data[i].truck={};
                            data[i].truck.__type="Pointer";
                            data[i].truck.objectId=null;
                            data[i].truck.className="Truck";
                        }

                        if(data[i].dateHired)
                            data[i].dateHired = getDateObjectFromISO(data[i].dateHired.iso);

                            //data[i].dateHired=new Date(data[i].dateHired.iso);

                        if(data[i].dateLeft)
                            data[i].dateLeft= getDateObjectFromISO(data[i].dateLeft.iso);
                    }
                else {
                    if (!data.hasOwnProperty("phoneNumber"))
                        data.phoneNumber=""

                    if(!data.hasOwnProperty("truck")) {
                        data.truck={};
                        data.truck.__type="Pointer";
                        data.truck.objectId=null;
                        data.truck.className="Truck";
                    }

                    if (data.dateHired)
                        if(data.dateHired.iso)
                            data.dateHired = getDateObjectFromISO(data.dateHired.iso);

                    if (data.dateLeft)
                        if(data.dateLeft.iso)
                            data.dateLeft= getDateObjectFromISO(data.dateLeft.iso);
                    
                };

                return data;
            },
                
                model: {
                    id: "objectId",      //model identifier

                    fields: {
                               "objectId": {
                                        nullable:true,
                                        editable:false
                               },

                                firstName: {
                                        from:"firstName",
                                        editable:true,
                                        type:'string'
                                        
                                },

                                lastName: {
                                    from:"lastName",
                                    editable:true,
                                    type:'string'
                                },

                                email: {
                                    from:"email",
                                    editable:true,
                                    type:'string'
                                },

                                truck: {
                                    from: "truck",
                                    editable: true
                                },

                                phoneNumber: {
                                    from:"phoneNumber",
                                    editable:true,
                                    type:"string"
                                },

                                active: {
                                    from:"active",
                                    editable:true,
                                    type:'boolean'
                                },

                                dateHired: {
                                    from:"dateHired",
                                    editable:true,
                                    
                                },

                                dateLeft: {
                                    from:"dateLeft",
                                    editable:true,
                                    
                                },

                                picture: {
                                    from: "picture",
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

    //Social Posts
    var SocialPostsDataSource = function() { 
        return new kendo.data.DataSource({
        
        transport: {
            
            read: function(options) {
                console.log(kendo.stringify({'vendor':appModel.getParsePointer(appModel.parse._vendor, "Vendor"), 'autoGenerated':options.data.autoGenerated}));
                $.ajax({
                    
                    url:  "/parse/classes/SocialPosting/",
                    dataType: "json",
                    type:"GET",
                    headers: appModel.parse._headers,

                    data:   {  where: kendo.stringify({'vendor':appModel.getParsePointer(appModel.parse._vendor, "Vendor"), 'autoGenerated':options.data.autoGenerated}),
                               order:"createdAt"
                            },
                    
                    success: function(jsonResponse) {
                        options.success(jsonResponse.results);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });

            },

            create: function(options) {
                
                var _options=this.prepareDataForSave($.extend({},options.data));

                $.ajax({
                    url:  "/parse/classes/SocialPosting/",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(_options),
                    
                    success: function(jsonResponse) {
                        options.data.objectId=jsonResponse.objectId;
                        options.success(options.data);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            destroy: function(options) {
                
                var url= "/parse/classes/SocialPosting/"+options.data["objectId"];

                $.ajax({
                    url: url,
                    dataType: "json",
                    type:"DELETE",
                    headers: appModel.parse._headers,
                    
                    success: function(jsonResponse) {
                        options.success(options.data);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            prepareDataForSave: function(options) {
               
                $(options).removeProp("objectId").removeProp("createdAt").removeProp("updatedAt");
                options["vendor"]=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
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
                
                model: {
                    id: "objectId",      //model identifier

                    fields: {
                               "objectId": {
                                        nullable:true,
                                        editable:false
                               },

                                vendor:"vendor",
                                post: "post",
                                url: "url",
                                facebook:"facebook",
                                twitter:"twitter",
                                appPush: "appPush",
                                parentColl:"parentColl",
                                autoGenerated:"autoGenerated"
                                // postDateTime: {
                                //     from:"postDateTime",
                                //     type:"date"
                                // }

                        }

                }
            }
        });
    }


    /*  Models
            -- each view in the application is supplied its own model
            -- model definitions are declared below
    */

    // App Model
    // static shared model only instantiated once during the life of the app.
    // defines variables and functions used by models
    
    var appModel= kendo.observable({
        //vendorDataSource: {},

        //parse data & defaults
        // _underscore before property name so that it's not wrapped into a kendo observable
        parse: {
            "_headers":{},
            "_vendor":{}
        },
        isLoading:false,
        //logged in user info
        userInfo: {
            userID: null,
            userName: null,
            sessionToken: null,
            vendorID: null,
            emailValidated: null,
            currentRoute: null
        },

        //Application settings
        // sysSettings: {
        //     logoFile: null,
        //     appleBundleId: null,
        //     androidAppId: null
        // },

        sysSettings:null,
        payInfo:[],
        modelParams:null,
        currentRoute:null,

        fbAPIInit: false,
        

        onListViewDataBound: function(e){
            console.log(e);
        },

        getParsePointer: function(object, className){
            if (object.hasOwnProperty('objectId')){
                return {className:className, __type:"Pointer", objectId:object.objectId};
            } else 
                return null;
        },

        // initialize the app model. called only once -
        init: function() {
            var deferred= $.Deferred();
            
            var self=this;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    self.set("mapWindow.currentLocation.lat",position.coords.latitude);
                    self.set("mapWindow.currentLocation.lng",position.coords.longitude);
                });
            }

            // fetch system settings for the vendor
            if(this.userInfo.vendorID) {
                appModel.vendorDataSource = new VendorDataSource();

                appModel.vendorDataSource.fetch(function(responseArray){

                    //UPGRADE
                    // var responseObject = responseArray.items[0];
                    var responseObject = this.data()[0];
                     appModel.parse._vendor = responseObject.vendorInfo;
                     appModel.vendorInfo = responseObject.vendorInfo;
                     appModel.parse.truckList =  _.map(responseObject.truckList, _.clone);//copy the array

                     if (appModel.parse._vendor.settings){
                        // self.set("sysSettings.appleBundleId",appModel.parse._vendor.settings.appleBundleId);
                        // self.set("sysSettings.androidAppId",appModel.parse._vendor.settings.androidAppId);
                        self.set("sysSettings", responseObject.vendorInfo.settings);
                     };

                     self.set("payInfo", responseObject.vendorInfo.paymentInfo);

                    if(appModel.parse._vendor.pictureLogo) {
                        self.set("sysSettings.logoFile",appModel.parse._vendor.pictureLogo.url)
                    }
                    deferred.resolve();
                });

            }

            return deferred.promise();

        },



        //nav bar
        navBar: {
           signOut: function(e) {
            e.preventDefault();
            $('#linkUserInfo').dropdown('toggle');
            amplify.store("trcked.com",null);
            window.location.replace("index.htm")

            },

            showHelp: function(e) {
                $("#appHelp").show();
            },

            hideHelp: function(e) {
                $("#appHelp").hide();
            },

            getImage: function(){
                if(this.parent().get("sysSettings.logoFile"))
                    return this.parent().sysSettings.logoFile;
                else
                    return "";

            } 
        },

        // social
        social: {

            verifySocialNetworks:function(onlyFacebook, onlyTwitter) {

                var deferred=$.Deferred();

                // verify social network connections
                $.ajax({
                        url:  "/parse/functions/socialNetworkVerify",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,

                        data:kendo.stringify({
                            vendorId: appModel.userInfo.vendorID,
                            onlyTwitter: onlyTwitter,
                            onlyFacebook: onlyFacebook
                        }),
                        
                        success: function(jsonResponse) {

                           deferred.resolve(jsonResponse.result);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            kendoNotification.show({title:"Error!",message:"An error occured while verifying social network connection"},"error")
                            handleAjaxError(jqXHR,textStatus,errorThrown);
                            deferred.resolve({errorCode:jqXHR.status,errorMsg: textStatus});
                        }
                
                });

                return deferred.promise();

            },

            postSocial: function(twitter,facebook, appPush) {

                var deferred=$.Deferred();
                var self=this;

                var data= {
                    vendorId: appModel.userInfo.vendorID
                };

                
                if(twitter) data.twitter=twitter;
                if(facebook) data.facebook=facebook;
                if (appPush) data.appPush = appPush;

                $.ajax({
                    url:  "/parse/functions/socialPostingCreate",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(data),
                    
                    success: function(jsonResponse) {
                        deferred.resolve(jsonResponse);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        kendoNotification.show({title:"Error!",message:"An error occured while posting to social network"},"error")
                        handleAjaxError(jqXHR,textStatus,errorThrown);
                        deferred.resolve({errorCode:jqXHR.status,errorMsg: textStatus});
                    }
                });

                return deferred.promise();
            },

            getFacebookPages: function(accessToken) {
                    
                var arrPages=[];
                var deferred=$.Deferred();

                // FB API to get list of pages user is admin for
                FB.api("me/accounts",{access_token:accessToken},function(response){
                    if(response.data.length) {
                        
                        for(var i=0;i<response.data.length;i++) {

                            //make sure user is an admin of this page
                            if(response.data[i].perms.indexOf("ADMINISTER") > -1) {
                                arrPages.push({id:response.data[i].id,name:response.data[i].name,access_token:response.data[i].access_token})
                            }
                        }

                    }

                    deferred.resolve(arrPages);
                });

                return deferred.promise();
                    
            },

            connectTwitter: function() {
                
                var deferred=$.Deferred();

                $.ajax({
                    url:  "/parse/functions/twitterRequestTokenForVendor",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify({
                        vendorId: appModel.userInfo.vendorID,
                        baseUrl: getBaseUrl()
                    }),
                    
                    success: function(jsonResponse) {

                        deferred.resolve(jsonResponse.result); 
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        kendoNotification.show({title:"Error!",message:"An error occured while connecting to twitter"},"error")
                        handleAjaxError(jqXHR,textStatus,errorThrown);
                        deferred.resolve({errorCode:jqXHR.status,errorMsg: textStatus});
                    }
                });

                return deferred.promise();
            },

            connectFacebook: function() {
                
                var deferred=$.Deferred();
                //we call getLoginStatus because if FB.init failed then this will return a null
                try{
                    if (appModel.fbAPIInit == false){
                        console.log('FB API is not initialized');
                        kendoNotification.show({title:"Error!",message:"An error occured while connecting to facebook. Please try refreshing this page in your browser."},"error")
                        return false;
                    };

                    FB.getLoginStatus(function(response){
                        // if (response.status =! 'connected') //  || response.status == 'not_authorized')
                            FB.login(function(response){
                                if(response.status==="connected") {
                                    
                                    $.ajax({
                                        url:  "/parse/functions/facebookGetAccessToken",
                                        dataType: "json",
                                        type:"POST",
                                        headers:appModel.parse._headers,

                                        data:kendo.stringify({
                                            vendorId: appModel.userInfo.vendorID,
                                            shortLivedToken: response.authResponse.accessToken
                                        }),
                                        
                                        success: function(httpResponse) {
                                            
                                            deferred.resolve(httpResponse.result);
                                            
                                        },

                                        error: function(jqXHR,textStatus,errorThrown) {
                                            kendoNotification.show({title:"Error!",message:"An error occured while connecting to facebook"},"error")
                                            handleAjaxError(jqXHR,textStatus,errorThrown);
                                            deferred.resolve({errorCode:jqXHR.status,errorMsg: textStatus});
                                            
                                        }
                        
                                    });

                                }

                                else
                                    deferred.resolve(response);

                            },{scope: 'publish_pages,manage_pages'});
                        

                    }, true); //the true forces our app to get the login status from the server
                } catch(e){
                    console.log(e);
                }
                return deferred.promise();
            },

            searchTwitterFacebookPlaces: function(lat,long,accuracy,query) {

                var deferred=$.Deferred();
                
                $.ajax({
                    url:  "/parse/functions/socialPlaceIdGet",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify({
                        vendorId: appModel.userInfo.vendorID,
                        lat:lat,
                        long:long,
                        accuracy: accuracy,
                        query: query
                    }),
                    
                    success: function(jsonResponse) {
                        deferred.resolve(jsonResponse.result);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        kendoNotification.show({title:"Error!",message:"An error occured while fetching places"},"error")
                        handleAjaxError(jqXHR,textStatus,errorThrown);
                        deferred.resolve({errorCode:jqXHR.status,errorMsg: textStatus});
                    }
            
                });

                return deferred.promise();

            },

            setFacebookPage: function(fbPageId,fbPageAccessToken) {
                var deferred=$.Deferred();

                $.ajax({
                    url:  "/parse/functions/facebookSetPageInfo",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify({
                        vendorId: appModel.userInfo.vendorID,
                        fbPageId: fbPageId,
                        fbPageAccessToken: fbPageAccessToken
                    }),
                    
                    success: function(jsonResponse) {
                        deferred.resolve(jsonResponse);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        kendoNotification.show({title:"Error!",message:"An error occured while setting facebook default page"},"error")
                        handleAjaxError(jqXHR,textStatus,errorThrown);
                        deferred.resolve({errorCode:jqXHR.status,errorMsg: textStatus});
                    }
                });

                return deferred.promise();
            }
        },

        socialWindow: {

            // properties
            socialPost: null,
            socialPostURL: null,
            twitterPost: null,
            
            postDateTime:null,
            
            parentColl:null,
            imgURL:"",

            isEvent:false,
            postOffset:null,
            eventDate:null,

            locationData:null,

            twitterAuth:null,
            twitterConnected: false,
            twitterName:null,
            facebookConnected: false,
            facebookAccessToken: null,
            facebookSelectedPageID:null,
            facebookPages: [],
            facebookDefaultPageID:null,
            
            currentLocation: {lat:"29.7601927",lng:"-95.36938959999998"},
            

            postOffsetList: [{text:"Open for Business",value:"-1"},{text:"On Event Start",value:"0"},{text:"15 Minutes",value:"15"},{text:"30 Minutes",value:"30"},{text:"45 Minutes",value:"45"},
                    {text:"1 Hour",value:"60"},{text:"2 Hours",value:"120"},{text:"3 Hours",value:"180"},{text:"4 Hours",value:"240"},{text:"5 Hours",value:"300"}],        

            showTwitterTextArea: false,

            mapInfo: {

                distance: null,
                lat: null,
                lng: null,
                query: null,
                twitterPlaces:[],
                facebookPlaces:[],
                selectedTwitterPlace:{id:null,name:"",address:""},
                selectedFacebookPlace:{id:null,name:"",address:""}
            },

            // functions
            reset: function(e) {

                e && e.preventDefault();

                this.set("socialPost",null);
                this.set("socialPostURL",null);
                this.set("twitterPost",null);
                this.set("showTwitterTextArea",false);
                this.set("mapInfo.selectedFacebookPlace",{id:null,name:"",address:""});
                this.set("mapInfo.selectedTwitterPlace",{id:null,name:"",address:""});
                this.set("parentColl",null);
                this.set("imgURL",null);
                this.set("isEvent",null);
                this.set("eventDate",null);
                this.set("postDateTime",null);
                // this.set("postOffset",null);
                this.set("locationData",null);

                $("#g-facebookPostArea").removeClass().addClass("col-md-12");
                $("#g-twitterPostArea").hide();
            },

            open: function(params) {
            
                var self=this;
                var socialWindow = $("#g-windowSocial");

                if(!socialWindow.data("kendoWindow")) {
                    socialWindow.kendoWindow({
                        width: "1024px",
                        height: "640px",
                        title: "Post to Social Networks",
                        modal: true,
                        open: function(){

                        }
                    });
                }

                self.reset();

                if(params && typeof params==="object") {

                    self.set("socialPost",params.facebookPost);
                    self.set("twitterPost",params.twitterPost);
                    self.set("parentColl",params.parentColl);
                    self.set("imgURL",params.hasOwnProperty("imgURL")?params.imgURL:"");
                    self.set("locationData",params.hasOwnProperty("locationData")?params.locationData:null);
                    self.set("eventDate",params.hasOwnProperty("date")?params.date:null);
                    self.set("isEvent",params.hasOwnProperty("isEvent")?params.isEvent:null);

                }

                $.when(appModel.social.verifySocialNetworks()).then(function(serverResponse){
                    if(serverResponse.twitter && serverResponse.facebook) {
                        self.set("twitterConnected",serverResponse.twitter.connected);
                        self.set("facebookConnected",serverResponse.facebook.connected);
                        self.set("twitterName",serverResponse.twitter.screen_name);
                    }

                    if(serverResponse.facebook.connected) {
                        self.set("facebookConnected",true);
                        self.set("facebookAccessToken",serverResponse.facebook.userAccessToken);
                        self.set("facebookDefaultPageID",serverResponse.facebook.pageId);

                        // ensure that FB object is available before calling getFacebookPages
                        var timerFB = setInterval(function(){

                            if(typeof FB!="undefined") {
                                clearInterval(timerFB);

                                $.when(appModel.social.getFacebookPages(serverResponse.facebook.userAccessToken)).then(function(result) {
                                    if(result.length) {
                                        self.set("facebookPages",result);
                                        //set default page if any
                                        if (self.facebookDefaultPageID)
                                            $("#g-lstFacebookPages").data("kendoDropDownList").value(self.facebookDefaultPageID);
                                    }
                                });
                                
                            }


                        }, 1000);
                    }

                });

                socialWindow.data("kendoWindow").center().open();

            },

            copyFacebookTextToTwitter:function() {
                if(!this.get("socialWindow.socialPost") || this.get("socialWindow.showTwitterTextArea")) return;
                this.set("socialWindow.twitterPost",this.socialWindow.socialPost.substring(0,140));
            },

            setTwitterTextAreaVisibility: function() {
                
                if(this.get("socialWindow.showTwitterTextArea") && this.get("socialWindow.twitterConnected") && this.get("socialWindow.facebookConnected")) {

                    $("#g-facebookPostArea").removeClass().addClass("col-md-8");
                    $("#g-twitterPostArea").show();

                }

                else {

                    $("#g-facebookPostArea").removeClass().addClass("col-md-12");
                    $("#g-twitterPostArea").hide();

                }
            },

            clearFacebookPlace: function(e) {
                e.preventDefault();
                this.set("socialWindow.mapInfo.selectedFacebookPlace",{id:null,name:"",address:""});
            },

            clearTwitterPlace: function(e) {
                e.preventDefault();
                this.set("socialWindow.mapInfo.selectedTwitterPlace",{id:null,name:"",address:""});

            },

            setFacebookPage: function() {

                var self=this;
                var selectedVal=$("#g-lstFacebookPages").data("kendoDropDownList").value();

                if (!selectedVal) {
                    this.set("socialWindow.facebookSelectedPageID",null);
                    return;
                }

                var data = $.grep(this.get("socialWindow.facebookPages"), function (e) {
                    return e.id === selectedVal;
                });

                $.when(appModel.social.setFacebookPage(data[0].id,data[0].access_token)).then(function(result) {
                    self.set("socialWindow.facebookDefaultPageID",data[0].id);
                });

            },

            allowPost: function() {

                if(this.get("socialPost") && (this.get("twitterConnected") || this.get("facebookConnected")))
                    return true;

            },

            getTwitterPostLength: function() {
                return this.get("socialWindow.twitterPost")?this.get("socialWindow.twitterPost").length+"/140":"0/140";
            },

            connectTwitter: function() {
                
                var self=this;

                $.when(appModel.social.connectTwitter()).then(function(serverResponse) {
                    if (serverResponse.result.hasOwnProperty("authUrl")) {
                            
                        amplify.store("trcked_twitter_authenticated",false);
                        var windowSocialConnect=window.open(serverResponse.result.authUrl,"_blank","width=600,height=600,location=no");
                        var timer=setInterval(function() {
                            if(amplify.store("trcked_twitter_authenticated")) {
                                clearInterval(timer);
                                amplify.store("trcked_twitter_authenticated",null);
                                self.set("socialWindow.twitterConnected",true);
                                self.set("socialWindow.twitterName",amplify.store("trcked_twitter_screen_name"));
                                amplify.store("trcked_twitter_screen_name",null);

                            }

                            if(windowSocialConnect.closed) clearInterval(timer);

                        }, 1000);
                            
                    }

                    else
                        kendoNotification.show({title:"Error!",message:"An error occured while trying to get twitter authentication URL"},"error")

                });

            },

            connectFacebook: function() {
                
                var self=this;

                $.when(appModel.social.connectFacebook()).then(function(result) {
                    if(result.hasOwnProperty("access_token")) {
                        self.set("socialWindow.facebookAccessToken",result.access_token);
                        self.set("socialWindow.facebookConnected",true);
                        self.set("socialWindow.facebookDefaultPageID",null);
                        self.set("socialWindow.facebookSelectedPageID",null);
                        
                        $.when(appModel.social.getFacebookPages(result.access_token)).then(function(result) {
                            if(result.length) {
                                self.set("socialWindow.facebookPages",result);
                                //set default page if any
                                if (self.facebookDefaultPageID)
                                    $("#g-lstFacebookPages").data("kendoDropDownList").value(self.socialWindow.facebookDefaultPageID);
                            }
                        });

                    }

                    else
                        kendoNotification.show({title:"Error!",message:"An error occured while trying to connect with Facebook"},"error")

                });

            },

            showMap: function() {

                var self=this;

                appModel.mapWindow.showMap({
                    onSelect: function(data) {
                        self.set("socialWindow.mapInfo",data);
                    },

                    onCancel: function() {
                        
                    },

                    locationData:this.socialWindow.locationData
                });
            },

            showSavedSocialPosts: function(e) {
                
                var self=this;
                e.preventDefault();
                
                appModel.socialPostsWindow.showSocialPosts({
                    onSelect: function(dataItem) {
                        
                        self.socialWindow.reset();

                        self.set("socialWindow.socialPostID",dataItem._id);
                        self.set("socialWindow.socialPost",dataItem.post);
                        self.set("socialWindow.socialPostURL",dataItem.url);

                        if(dataItem.facebook && dataItem.facebook.place)
                            self.set("socialWindow.mapInfo.selectedFacebookPlace",$.extend({},dataItem.facebook.place));

                        if (dataItem.twitter){
                            self.set("socialWindow.twitterPost",dataItem.twitter.post);

                            if(dataItem.twitter && dataItem.twitter.place_id)
                                self.set("socialWindow.mapInfo.selectedTwitterPlace",$.extend({},dataItem.twitter.place_id));
                        };
                            


                    }
                });
            },

            saveSocialPost: function(e) {

                var self=this;
                var method= this.socialPostID?"PUT":"POST";
                var ajaxURL= "/parse/classes/SocialPosting/";

                if(this.socialWindow.postDateTime) {     // make sure date-time is +30min from now

                    var today=new Date();
                    var diffMs=this.postDateTime-today;
                    var diffMins = Math.round(diffMs/(60*1000)); // minutes

                    if(diffMins <= 31) {
                        kendo.ui.ExtAlertDialog.show({ title: "Invalid Date/Time", message: "Scheduled post must be atleast 30minutes from now!",icon:"k-ext-information" });
                        return;
                    }
                }

                if(this.socialWindow.socialPostID)
                    ajaxURL+=this.socialWindow.socialPostID;

                var btnSave=$(e.target);
                var data={
                    post: "",
                    url: "",
                    facebook:{post:"",url:"",place:{id:null,name:"",address:""}},
                    twitter:{post:"",place:{id:null,name:"",address:""}},
                    appPush: {},
                    postDateTime: null,
                    parentColl: null
                    // postOffset:0
                };

                btnSave.button("loading");

                data.post=this.socialWindow.socialPost;
                data.url=this.socialWindow.socialPostURL;
                data.vendor=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
                //
                if (data.postDateTime)
                    data.postDateTime= {iso:this.socialWindow.postDateTime.toISOString(), "__type":"Date"};
                
                data.parentColl=this.socialWindow.parentColl;
                // data.postOffset=this.socialWindow.postOffset;
                
                data.facebook.post=this.socialWindow.socialPost;
                if(this.socialWindow.mapInfo.selectedFacebookPlace.id) 
                    data.facebook.place=this.socialWindow.mapInfo.selectedFacebookPlace;
                        else data.facebook.place;

                data.twitter.post=this.socialWindow.twitterPost;
                
                if(this.socialWindow.mapInfo.selectedTwitterPlace.id) 
                    data.twitter.place=this.socialWindow.mapInfo.selectedTwitterPlace;
                        else delete data.twitter.place;

                if (this.appPush)
                    data.appPush = this.appPush;
                        else delete data.appPush;

                $.ajax({
                    
                    url: ajaxURL,
                    dataType: "json",
                    type:method,
                    headers: appModel.parse._headers,

                    data: kendo.stringify(data),
                    
                    success: function(result) {
                       kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");
                       setTimeout(function() {
                        self.socialWindow.reset();
                    }, 10);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                            kendoNotification.show({title:"Error!",message:"An error occured while saving the post"},"error")
                            handleAjaxError(jqXHR,textStatus,errorThrown);
                            
                    },

                    complete: function() {
                        btnSave.button("reset");
                    }


                });
                
               
            },

            postSocial: function(e) {

                var self=this;

                if(this.socialWindow.facebookConnected && !$("#g-lstFacebookPages").data("kendoDropDownList").value()) {
                    kendo.ui.ExtAlertDialog.show({ title: "Select Facebook Page", message: "Please select the Facebook page to post",icon:"k-ext-information" });
                    return;
                }

                if(this.socialWindow.postOffset || this.postDateTime) {          // future dated post. Save to DB
                    
                    $.when(kendo.ui.ExtYesNoDialog.show({ title: "Save this Post?", message: "This post will be sent at the alloted time. Continue?",icon:"k-ext-information" }))
                        .done(function (response) {
                            if(response.button=="Yes") 
                                $("#g-btnSaveSocialPost").trigger("click");
                        });
                    
                }

                else {

                    var btnPost=$(e.target);
                    btnPost.button("loading");

                    var twitter= null;
                    var facebook=null;

                    if(this.socialWindow.twitterConnected){
                        twitter={
                                    status:this.socialWindow.get("twitterPost"),
                                    //place_id: this.socialWindow.mapInfo.selectedTwitterPlace.id
                                };
                        if (this.socialWindow.mapInfo.selectedTwitterPlace.id)
                                twitter.place_id = this.socialWindow.mapInfo.selectedTwitterPlace.id;
                    };

                    if(this.socialWindow.facebookConnected){
                        facebook={
                                    //pageId:this.socialWindow.get("facebookSelectedPageID"),
                                    message: this.socialWindow.get("socialPost"),
                                    // link: this.socialWindow.get("socialPostURL"),
                                    // place:this.socialWindow.mapInfo.selectedFacebookPlace.id
                                };
                        if (this.socialWindow.get("socialPostURL"))
                            facebook.link = this.socialWindow.get("socialPostURL");
                        
                        if (this.socialWindow.mapInfo.selectedFacebookPlace.id)
                            facebook.place = this.socialWindow.mapInfo.selectedFacebookPlace.id;
                    }
                    $.when(appModel.social.postSocial(twitter,facebook)).then(function(result){

                        self.socialWindow.reset();
                        btnPost.button("reset"); 

                        // notify post result based on response received

                        if(self.socialWindow.twitterConnected) {
                            if(result.twitter && result.twitter.code=="200")
                                kendoNotification.show({title:"Posted",message:"Tweet sent to your twitter account"},"success");
                            else
                                kendoNotification.show({title:"Error posting to Twitter",message:result.twitter.message},"error");
                        }

                        if(self.socialWindow.facebookConnected) {
                            if(result.facebook && result.facebook.code=="200")
                                kendoNotification.show({title:"Posted",message:"Posted to the selected Facebook page"},"success");
                            else
                                kendoNotification.show({title:"Error posting to Facebook",message: result.facebook.message},"error");
                        }
                        
                    });

                }
         
            },

            closeWindow: function() {

                $("#g-windowSocial").data("kendoWindow").close();
            }


        },

        mapWindow: {

            callbackOnSelect: null,
            callbackOnCancel: null,
            currentLocation: {lat:"29.7601927",lng:"-95.36938959999998"},

            onSelect: function(e) {

                var selectedFacebookIndex=$("#g-kendoLVFacebookPlaces").data("kendoListView").select().index();
                var selectedTwitterIndex=$("#g-kendoLVTwitterPlaces").data("kendoListView").select().index();

                if(selectedFacebookIndex<0 && selectedTwitterIndex<0) {
                kendo.ui.ExtAlertDialog.show({ title: "No places selected!", message: "You must select one place",icon:"k-ext-information" });
                return;
                }

                $("#g-windowMapSocial").data("kendoWindow").close();

                if(selectedFacebookIndex>=0) {
                this.set("mapWindow.mapInfo.selectedFacebookPlace",{id:this.mapWindow.mapInfo.facebookPlaces[selectedFacebookIndex].id,
                    name:this.mapWindow.mapInfo.facebookPlaces[selectedFacebookIndex].name,
                    address:this.mapWindow.mapInfo.facebookPlaces[selectedFacebookIndex].location.street});
                }

                if(selectedTwitterIndex>=0) {
                this.set("mapWindow.mapInfo.selectedTwitterPlace",{id:this.mapWindow.mapInfo.twitterPlaces[selectedTwitterIndex].id,
                    name:this.mapWindow.mapInfo.twitterPlaces[selectedTwitterIndex].name,
                    address:this.mapWindow.mapInfo.twitterPlaces[selectedTwitterIndex].attributes.street_address});
                }

                //call the callback func if exists
                this.mapWindow.callbackOnSelect && typeof this.mapWindow.callbackOnSelect==="function" && this.mapWindow.callbackOnSelect(this.mapWindow.mapInfo);
            },

            onCancel: function(e) {
                 $("#g-windowMapSocial").data("kendoWindow").close()
                 this.mapWindow.callbackOnCancel && typeof this.mapWindow.callbackOnCancel==="function" && this.mapWindow.callbackOnCancel();
            },

            mapInfo: {

                distance: null,
                lat: null,
                lng: null,
                query: null,
                twitterPlaces:[],
                facebookPlaces:[],
                selectedTwitterPlace:{id:null,name:"",address:""},
                selectedFacebookPlace:{id:null,name:"",address:""}
            },

            resetMap: function() {
               
                this.set("mapInfo.query",null);
                this.set("mapInfo.twitterPlaces",[]);
                this.set("mapInfo.facebookPlaces",[]);
                this.set("mapInfo.selectedTwitterPlace",{id:null,name:"",address:""});
                this.set("mapInfo.selectedFacebookPlace",{id:null,name:"",address:""});

            },

            showMap: function(options) {

                var self=this;

                if(typeof options!=null &&  typeof options==="object") {

                    // set the options
                    if(options.onSelect && typeof options.onSelect==="function") {
                        this.callbackOnSelect=options.onSelect;
                    }

                    else {
                        this.callbackOnSelect=null;
                    }

                    if(options.onCancel && typeof options.onCancel==="function") {
                        this.callbackOnCancel=options.onCancel;
                    }

                    else {
                        this.callbackOnCancel=null;
                    }

                    // set the map location
                    // if location data is provided, geo location to be skipped.
                    
                    if(options.locationData && typeof options.locationData==="object") {
                        this.currentLocation.lat=this.mapInfo.lat=options.locationData.lat;
                        this.currentLocation.lng=this.mapInfo.lng=options.locationData.lng;
                        this.mapInfo.distance=10000;
                        this.mapInfo.query=options.locationData.name;

                        $("#g-inputSocialPlacesQuery").val(this.mapInfo.query);
                        $("#g-btnSearchSocialPlaces").trigger("click");
                    }

                    // open the map window

                    var mapWindow = $("#g-windowMapSocial");

                    if(!mapWindow.data("kendoWindow")) { 
                        mapWindow.kendoWindow({
                            width: "950px",
                            height: "700px",
                            title: "Select Social Place(s)",
                            modal: true,

                            open: function () {
                                
                            },

                            activate: function(){
                                self.set("mapInfo.twitterPlaces",[]);
                                self.set("mapInfo.facebookPlaces",[]);
                                $("#g-inputMapSocialSearchQuery").val("");
                                $("#g-inputMapSocialSearchQuery").focus();
                            }
                        });

                    }

                    mapWindow.data("kendoWindow").center().open();

                    // load the map
                    var mapLatLng=new google.maps.LatLng(this.currentLocation.lat, this.currentLocation.lng)
                    
                    var mapOptions = {
                        center: mapLatLng,
                        zoom: 13
                    };

                    var map = new google.maps.Map(document.getElementById('g-mapCanvasSocial'), mapOptions);
                    
                    var marker = new google.maps.Marker({
                      position: mapLatLng,
                      map: map,
                      title: ''
                    });

                    var contentString="<div style='width:200px;height:auto'><h4>Select a search area</h4><p>Zoom in/out of the map to narrow in on a region to search - Enter the search query to find associated Facebook and Twitter places.</p></div>"

                    var infoWindow = new google.maps.InfoWindow({
                        content: contentString
                    });

                    infoWindow.open(map,marker)
                    
                    // var input = document.getElementById('inputMapSearch');
                    
                    // var autocomplete = new google.maps.places.Autocomplete(input);
                    // autocomplete.bindTo('bounds', map);

                    // var marker = new google.maps.Marker({
                    //                 map: map,
                    //                 anchorPoint: new google.maps.Point(0, -29)
                    //             });

                    // google.maps.event.addListener(autocomplete, 'place_changed', function() {
                    //     marker.setVisible(false);
                    //     var place = autocomplete.getPlace();
                    //     if (!place.geometry) {
                    //       return;
                    //     }

                    //     // If the place has a geometry, then present it on a map.
                    //     if (place.geometry.viewport) {
                    //       map.fitBounds(place.geometry.viewport);
                    //     } else {
                    //       map.setCenter(place.geometry.location);
                    //       map.setZoom(17); 
                    //     }
                    //     marker.setIcon(/** @type {google.maps.Icon} */({
                    //       url: place.icon,
                    //       size: new google.maps.Size(71, 71),
                    //       origin: new google.maps.Point(0, 0),
                    //       anchor: new google.maps.Point(17, 34),
                    //       scaledSize: new google.maps.Size(35, 35)
                    //     }));
                    //     marker.setPosition(place.geometry.location);
                    //     marker.setVisible(true);

                    //     var address = '';
                    //     if (place.address_components) {
                    //       address = [
                    //         (place.address_components[0] && place.address_components[0].short_name || ''),
                    //         (place.address_components[1] && place.address_components[1].short_name || ''),
                    //         (place.address_components[2] && place.address_components[2].short_name || '')
                    //       ].join(' ');
                    //     }

                    //     self.set("mapInfo.query",place.name);

                        
                    //   });
                    
                    google.maps.event.addListener(map, 'idle', function() {
                        bounds = map.getBounds();

                        center = bounds.getCenter();
                        ne = bounds.getNorthEast();

                        // r = radius of the earth in statute miles
                        var r = 3963.0;  

                        // Convert lat or lng from decimal degrees into radians (divide by 57.2958)
                        var lat1 = center.lat() / 57.2958; 
                        var lon1 = center.lng() / 57.2958;
                        var lat2 = ne.lat() / 57.2958;
                        var lon2 = ne.lng() / 57.2958;

                        // distance = circle radius from center to Northeast corner of bounds
                        var dis = r * Math.acos(Math.sin(lat1) * Math.sin(lat2) + 
                        Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1));

                        self.set("mapInfo.lat",center.lat());
                        self.set("mapInfo.lng",center.lng());
                        self.set("mapInfo.distance",Math.round(dis*1609.34));

                    });
                
                }


            },

            searchPlaces: function() {
                var self=this;

                var searchQuery=$("#g-inputMapSocialSearchQuery").val();
                
                $("#g-btnFacebookNext").data("url","");
                $("#g-btnFacebookPrev").data("url","");

                $("#g-btnMapSocialSearch").button("loading");

                $.when(appModel.social.searchTwitterFacebookPlaces(this.mapWindow.mapInfo.lat.toString(),this.mapWindow.mapInfo.lng.toString(),this.mapWindow.mapInfo.distance.toString(),searchQuery))
                    .then(function(result){

                        $("#g-btnMapSocialSearch").button("reset");

                        if (result.facebook.code){
                            kendoNotification.show({title:'Facebook error', message:result.facebook.message},"error"); 
                            self.set("mapWindow.mapInfo.facebookPlaces",[]);
                        };

                        if (result.twitter.code){
                            kendoNotification.show({title:"Twitter Error", message:result.twitter.message},"error"); 
                            self.set("mapWindow.mapInfo.twitterPlaces",[]);
                        };

                        if (result.facebook.data && result.facebook.data.length == 0){
                            kendoNotification.show({title: 'Twitter', message: 'No matching Facebook places were found'},"info"); 
                            self.set("mapWindow.mapInfo.facebookPlaces",[]);
                        }

                        if (result.twitter.result && result.twitter.result.places.length  == 0){
                            kendoNotification.show({title:'Facebook', message:'No matching Twitter places were found'},"info"); 
                            self.set("mapWindow.mapInfo.twitterPlaces",[]);
                        }                        

                        if((result.facebook.data &&result.facebook.data.length > 0) || (result.twitter.result &&result.twitter.result.places.length > 0)) {
                            if(result.facebook.data) {
                                self.set("mapWindow.mapInfo.facebookPlaces",result.facebook.data);

                                if(result.facebook.paging) {
                                    if(result.facebook.paging.next) $("#g-btnFacebookNext").data("url",result.facebook.paging.next);

                                }
                            };

                            if(result.twitter.result) {
                                for (var i = 0; i < result.twitter.result.places.length ; i++){
                                    var twitterPlace = result.twitter.result.places[i];
                                    if (!twitterPlace.attributes.street_address){
                                        twitterPlace.attributes.street_address = 'Address not available';
                                        result.twitter.result.places[i] = twitterPlace;
                                    }
                                };

                                self.set("mapWindow.mapInfo.twitterPlaces",result.twitter.result.places);   
                            };

                        };

                    });
            },

            onFacebookPlacesDataBound: function() {

                if(this.mapWindow.mapInfo.facebookPlaces.length==0) {
                    
                    $("#g-kendoLVFacebookPlaces").append("<div>No places found</div>");
                    $("#g-kendoLVFacebookPlaces div").toggleClass('k-selectable');

                }
            },

            onTwitterPlacesDataBound: function() {

                if(this.mapWindow.mapInfo.twitterPlaces.length==0) {
                    
                    $("#g-kendoLVTwitterPlaces").append("<div>No places found</div>");
                    $("#g-kendoLVTwitterPlaces div").toggleClass('k-selectable');

                }
            },

            hasFacebookTwitterPlaces: function() {
                return this.get("mapInfo.facebookPlaces").length||this.get("mapInfo.twitterPlaces").length?true:false;
            },

            getFacebookPlacesPaging: function(e) {
                
                var self=this;
                var btn=$(e.target);

                if(btn.data("url")) {
                    
                    // call FB API to get records
                    $.ajax({
                        url: btn.data("url"),
                        dataType: "json",
                        type:"GET",
                        headers: {
                            "Content-Type": "application/json"
                        },

                        success: function(result) {
                            if(result.data) {
                                self.set("mapWindow.mapInfo.facebookPlaces",result.data);

                                if(result.paging) {
                                    result.paging.next? $("#g-btnFacebookNext").data("url",result.paging.next):$("#g-btnFacebookNext").data("url","");
                                    result.paging.previous? $("#g-btnFacebookPrev").data("url",result.paging.previous):$("#g-btnFacebookPrev").data("url","");
                                }
                            }
                        },

                        error: function(xhr,status,error) {
                            alert("error paging")
                        }
                    });
                }
            }
        },

        socialPostsWindow: {
            callbackOnSelect: null,
            callbackOnCancel: null,
            savedSocialPosts: [],

            // init: function() {
            //     var deferred = $.Deferred();
                 
            //     this.set("savedSocialPosts",SocialPostsDataSource());
                 
            //     $.when([ this.get("savedSocialPosts").fetch() ])
            //     .then(function() {
            //         deferred.resolve();
            //     })

            //     return deferred.promise();
            // },

            showSocialPosts: function(options) {
                // this.init()
                // .then(function(){
                var self = this;

                this.set("savedSocialPosts",SocialPostsDataSource());
                
                

                $.when(this.get("savedSocialPosts").read({autoGenerated:false}))
                .then(function() {
                    var postWindow = $("#gwindowSocialPosts");

                    if(typeof options!=null &&  typeof options==="object") {

                        // set the options
                        if(options.onSelect && typeof options.onSelect==="function") {
                            self.callbackOnSelect=options.onSelect;
                        }

                        else {
                            self.callbackOnSelect=null;
                        }

                        if(options.onCancel && typeof options.onCancel==="function") {
                            self.callbackOnCancel=options.onCancel;
                        }

                        else {
                            self.callbackOnCancel=null;
                        }

                        if(!postWindow.data("kendoWindow")) {
                            postWindow.kendoWindow({
                                title: "Select a post",
                                resizable: false,
                                modal: true
                            });
                        }

                        postWindow.data("kendoWindow").open().center();

                    };

                });

                


                // });


            },

            deleteSocialPost: function(e) {
                var self=this;

                $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete the selected post",icon:"k-ext-warning" }))
                    .done(function (response) {
                        if(response.button=="Yes") {
                            var dataItem = self.get("socialPostsWindow.savedSocialPosts").get(e.data.id);
                            self.get("socialPostsWindow.savedSocialPosts").remove(dataItem);
                    
                            $.when(self.get("socialPostsWindow.savedSocialPosts").sync()).then(function() {
                               kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success"); 
                                
                            })
                        }

                    });
            },

            onSelect: function(e) {

                $("#gwindowSocialPosts").data("kendoWindow").close();

                var selectedPostIndex=$("#kendoLVSocialPosts").data("kendoListView").select().index();
                
                if(selectedPostIndex<0)  {
                    kendo.ui.ExtAlertDialog.show({ title: "No post selected!", message: "Please select a Post from the list",icon:"k-ext-information" });
                    return;
                }

                var dataItem=this.socialPostsWindow.savedSocialPosts.at(selectedPostIndex);
                

                //call the callback func if exists
                this.socialPostsWindow.callbackOnSelect && typeof this.socialPostsWindow.callbackOnSelect==="function" && this.socialPostsWindow.callbackOnSelect(dataItem);
            },

            onCancel: function(e) {
                 $("#gwindowSocialPosts").data("kendoWindow").close()
                 this.socialPostsWindow.callbackOnCancel && typeof this.socialPostsWindow.callbackOnCancel==="function" && this.socialPostsWindow.callbackOnCancel();
            }

        }

    });


    var DashboardModel=function(){

        return kendo.observable({
            
            //properties
            infoMessages:[],
            infoMessagesAll:[],
            dashboardMessagesConstraints:{showInformationMessages:true,showWarningMessages:true,showSuccessMessages:true},
            msgsExist: false,
            allSetFlag: false,
            loadingMsgs: true,
            loadingTwPosts: false,
            loadingFbPosts: false,
            loadingPosOrders: false,
            loadingSchedule: false,
            noSocialConnected: false,
            noPosOrdersFound: false,
            noScheduleEntriesFound: false,
            facebookPosts:[],
            twitterPosts:[],
            eventList:[],
            orders:[],
            selectedOrder:{orderItems:[]},

            //functions
            init: function() {
                var deferred= $.Deferred();
                var self = this;

                //set some of the settings attributes form the appModel.parse.vendor 
                //since that object holds all the 
                self.set("dashboardMessagesConstraints", appModel.parse._vendor.dashboardMessagesConstraints);
                self.set("noPosOrdersFound", false);
                self.set("loadingPosOrders", false);


                deferred.resolve();
            

                return deferred.promise();
            },

            setMessages: function() {

                var arr=[];

                for(var i=0; i< this.infoMessagesAll.length;i++) {

                    if(this.dashboardMessagesConstraints.showWarningMessages && parseInt(this.infoMessagesAll[i].code)>=100 && parseInt(this.infoMessagesAll[i].code)<200)
                        arr.push(this.infoMessagesAll[i]);
                }

                this.set("infoMessages",arr);

            },

            saveSettings: function() {
                this.setMessages();

                var vendorInfo = appModel.get('vendorInfo');
                vendorInfo.dashboardMessagesConstraints = this.dashboardMessagesConstraints;
                appModel.set('vendorInfo', vendorInfo);
                //appModel.vendorDataSource.sync();

                //appModel.set("parse._vendor.dashboardMessagesConstraints", this.dashboardMessagesConstraints);

                $.ajax({
                    url:  "/parse/classes/Vendor/"+appModel.userInfo.vendorID,
                    dataType: "json",
                    type:"PUT",
                    headers: appModel.parse._headers,

                    data: kendo.stringify({dashboardMessagesConstraints:this.dashboardMessagesConstraints}),

                    success: function(result) {
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        kendoNotification.show({title:"Error!",message:"An error occured while saving settings"},"error")
                        handleAjaxError(jqXHR,textStatus,errorThrown);
                        
                    }
            
                });
            },

            setViewData: function() {
                // $('#appMain').addClass('cssload-thecube');

                var self=this;
                self.set("loadingFbPosts", true);
                self.set("loadingTwPosts", true);

                //get info messages
                $.ajax({
                    url:  "/parse/functions/vendorGetInfoMessages",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify({
                        vendorId: appModel.userInfo.vendorID
                    }),
                    
                    success: function(httpResponse) {
                        
                        
                        if(httpResponse.result.length) {
                            self.set("infoMessagesAll",httpResponse.result);
                            self.set("msgsExist", true);
                            self.set("allSetFlag", false);
                        } else {
                            self.set("msgsExist", false);
                            self.set("allSetFlag", true);
                        };
                        self.setMessages();
                        self.set("loadingMsgs", false);                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        kendoNotification.show({title:"Error!",message:"An error occured while getting vendor info messages"},"error")
                        handleAjaxError(jqXHR,textStatus,errorThrown);
                        $('#infoMessageStatus').html('Ummm. So sorry about this...');
                    }
            
                })

                .always(function(){
                    //get social posts
                    return $.ajax({

                        url:  "/parse/functions/socialPostingsGet",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,

                        data:kendo.stringify({
                            vendorId: appModel.userInfo.vendorID
                        }),
                        
                        success: function(httpResponse) {

                            if(httpResponse.result.facebookPosts) {

                                var facebookPosts=[];
                                for(var i=0; i<httpResponse.result.facebookPosts.length;i++){
                                    if(httpResponse.result.facebookPosts[i].message) {

                                        var arr=httpResponse.result.facebookPosts[i].id.split("_");
                                        if(arr.length==2)
                                            facebookPosts.push({postID:arr[1],pageID:arr[0]});
                                    }
                                }

                                self.set("facebookPosts",facebookPosts);
                                FB.XFBML.parse(document.getElementById('facebookPosts'), function(){
                                    self.set("loadingFbPosts", false); //all done
                                });

                            }

                            if(httpResponse.result.twitterPosts){
                                
                                twttr.events.bind('rendered',function (event) {
                                    self.set("loadingTwPosts", false); //all done
                                });

                                for(var i=0;i<httpResponse.result.twitterPosts.length;i++){
                                    $( "#twitterPosts" ).append(httpResponse.result.twitterPosts[i]);
                                    twttr.widgets.load(document.getElementById('twitterPosts'))
                                          
                                }

                            }

                            if (!httpResponse.result.twitterPosts && !httpResponse.result.facebookPosts){
                                //if nothing is returned then update the 'loading...' UI to 'all done'
                                self.set("loadingFbPosts", false); //all done
                                self.set("loadingTwPosts", false); //all done
                                self.set("noSocialConnected", true);
                                
                            } else {
                                self.set("noSocialConnected", false); //one ore more networks is connected
                            }
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            var errorJSON = JSON.parse(jqXHR.responseText);
                            kendoNotification.show({title:"Error!",message:"Error getting social posts - " + errorJSON.error },"error")
                            handleAjaxError(jqXHR,textStatus,errorThrown);
                            
                        }

                    })
                })

                .always(function(){
                    // fetch orders for truck
                    self.set("loadingPosOrders", true);
                    return $.ajax({

                        url:  "/parse/functions/posGetOrders",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,

                        data:kendo.stringify({
                            vendorId: appModel.userInfo.vendorID,
                            orderState: "C",
                            dateFrom: moment().subtract(7,"days").format("YYYY-MM-DD HH:mm:ss"),
                            dateTo: moment().format("YYYY-MM-DD HH:mm:ss"),
                            limit:10
                        }),
                        
                        success: function(response) {
                            var orderList = [];

                            if(response.result && response.result.length > 0) {
                                self.set("noPosOrdersFound", false);
                                
                                // format data to be shown in dashboard
                                $.each(response.result,function(index,order){
                                    order.truckName = order.truckName;
                                    if(order.saleMode==appDefaults.saleMode.online) {
                                        order.orderId="M-"+order.orderId;
                                        order.createdAt=order.requestedPickupDateTime.iso;
                                    }

                                    var orderItemsStr="";

                                    if(order.orderItems && order.orderItems.length) {
                                        $.each(order.orderItems,function(index,orderItem) {
                                            if(orderItemsStr.length)
                                                orderItemsStr+=", ";
                                            orderItemsStr+=orderItem.description+"("+orderItem.qty+")";
                                        })
                                    }

                                    order.orderItemsStr=orderItemsStr;
                                    orderList.push(order);

                                });

                                //self.set("orders",response.result);
                                self.set("orders",orderList);
                                
                            } else {
                                self.set("noPosOrdersFound", true);
                            };
                            self.set("loadingPosOrders", false);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            self.set("loadingPosOrders", false);
                            var errorJSON = JSON.parse(jqXHR.responseText);
                            kendoNotification.show({title:"Error!",message:"Error getting orders - " + errorJSON.error },"error")
                            handleAjaxError(jqXHR,textStatus,errorThrown);
                        }

                    })    
                })

                .always(function(){
                    

                    self.set("loadingSchedule", true);
                    // get schedule for next one month
                    return $.ajax({

                        url:  "/parse/functions/truckScheduleGet",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,

                        data:kendo.stringify({
                            vendorId: appModel.userInfo.vendorID,
                            fromTimeStamp: moment().format("YYYY-MM-DD HH:mm:ss"),
                            toTimeStamp: moment().add(1,"months").format("YYYY-MM-DD HH:mm:ss"),
                        }),
                        
                        success: function(response) {
                            if(response.result && response.result.length >0) {
                                
                                self.set("noScheduleEntriesFound", false);

                                for(var i=0;i<response.result.length;i++){
                                    response.result[i].startDateTime=new Date(response.result[i].startDateTime.iso);
                                    response.result[i].endDateTime=new Date(response.result[i].endDateTime.iso);
                                    if (response.result[i].truck)
                                        response.result[i].truckName = response.result[i].truck.name;
                                }

                                //sort array by date
                                response.result.sort(function(a, b) {
                                   return (a.startDateTime > b.startDateTime) ? 1 : -1;
                                });

                                self.set("eventList",response.result);
                                self.set("loadingSchedule", false);
                            }

                            if (response.result.length == 0 )
                                self.set("noScheduleEntriesFound", true);

                            self.set("loadingSchedule", false);
                            
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            self.set("loadingSchedule", false);
                            var errorJSON = JSON.parse(jqXHR.responseJSON.error);
                            kendoNotification.show({title:"Error!",message:"Error getting schedule - " + errorJSON.message },"error")
                            handleAjaxError(jqXHR,textStatus,errorThrown);
                            
                        }

                    })
                })

                .always(function(){
                    $('#appMain').removeClass('cssload-thecube');
                    
                    var pusher = new Pusher(appDefaults.pusherAPIKey);
                    _.each(appModel.parse.truckList, function(aTruck){
                        var channel = pusher.subscribe(aTruck.objectId);

                        channel.bind(appDefaults.pusherEventName, function(response) {
                          
                          if(response.code && response.code==101){          //update orders
                            var order= response.data;

                            if(order.saleMode!=appDefaults.saleMode.pos) {
                                order.orderId="M-"+order.orderId;
                            }

                            order.createdAt=order.pickUpDateTime;

                            var orderItemsStr="";

                            if(order.items && order.items.length) {
                                $.each(order.items,function(index,orderItem) {
                                    if(orderItemsStr.length)
                                        orderItemsStr+=", ";
                                    orderItemsStr+=orderItem.desc+"("+orderItem.qty+")";

                                    orderItem.description=orderItem.desc;
                                })
                            }

                            //get Truck name
                            _.each(appModel.parse.truckList, function(aTruck){
                                if (aTruck.objectId == order.truckId)
                                    order.truckName = aTruck.name;
                            });

                            order.orderItemsStr=orderItemsStr;
                            order.orderItems=order.items;

                            self.orders.splice(0,0,order);
                            $('#panelOrder').animate({scrollTop: 0}, 'slow');
                          }
                        });
                    });
                })
                
            },


            fixIssue: function(e) {
                
                var data=e.data;
                var self=this;

                switch (data.code) {

                    case 101:
                        appRouter.navigate(appDefaults.routeNames.settings + '/paymentsTabAnchor', false);
                        break;

                    case 102:
                        appRouter.navigate(appDefaults.routeNames.trucks);
                        break;

                    case 103:
                        appRouter.navigate(appDefaults.routeNames.menu);
                        break;

                    case 104:
                        appModel.modelParams={"objectId": data.extraInfo,"action":"OPEN_MENU_DROPDOWN"};
                        appRouter.navigate(appDefaults.routeNames.trucks+"/getParams");
                        break;

                    case 105:                        

                        appRouter.navigate(appDefaults.routeNames.settings + '/socialTabAnchor', false);

                        break;

                    case 106:
                        // $(window).on("hashchange", function(e){
                        //     $('#socialTabAnchor').trigger("click");
                        //     // $("#settingsTabPanel li:eq(1)").tab('show');
                        // });
                        appRouter.navigate(appDefaults.routeNames.settings + '/socialTabAnchor', false);
                        break;


                }

            },

            setReminder: function(e) {
                
                var target=$(e.target);
                
                e.preventDefault();

                kendoNotification.show({title:"Reminder set",message:"You will be reminded after "+target.data("reminder")},"info")
                

            },

            openFacebookPage: function(e) {
                e.preventDefault();
                window.open("https://www.facebook.com/"+this.facebookDefaultPageID,"_blank");
            },

            openFacebookPost: function(e){
                window.open("https://www.facebook.com/"+e.data.id,"_blank");
            },

            openEvent: function(e){
                e.preventDefault();
                appModel.modelParams={"objectId": e.data.objectId,"startDateTime":e.data.startDateTime,"endDateTime":e.data.endDateTime,
                    "isRecurring":e.data.isRecurring, "action":""};
                appRouter.navigate(appDefaults.routeNames.schedule+"/getParams");
            },

            //order details

            showOrderDetails: function(e) {

                var self=this;
                var selectedOrder= $.extend(true,{},e.data).toJSON();
                
                selectedOrder.formattedAmount=kendo.toString(selectedOrder.amount, "$##,#.00");
                selectedOrder.formattedTaxAmount=kendo.toString(selectedOrder.taxAmount, "$##,#.00");
                selectedOrder.formattedGrandAmount=kendo.toString(selectedOrder.taxAmount+selectedOrder.amount, "$##,#.00");

                selectedOrder.createdAt=moment(selectedOrder.createdAt).format('MM/DD/YY, h:mm a');
                if(selectedOrder.saleMode==appDefaults.saleMode.online)
                    selectedOrder.createdAt= "P/U:"+selectedOrder.createdAt;

                if(selectedOrder.orderItems && selectedOrder.orderItems.length) {

                    $.each(selectedOrder.orderItems,function(index,orderItem) {
                        if(!(orderItem.modifiers && orderItem.modifiers.length))
                            orderItem.modifiers=[];
                    });
                }

                self.set("selectedOrder",selectedOrder);

                var orderDetailsWindow = $("#windowOrderDetails");
                if(!orderDetailsWindow.data("kendoWindow")) {
                    orderDetailsWindow.kendoWindow({
                        // width: "80%",
                        // height: "575",
                        title: "Order Details",
                        modal: true

                    });
                }

                orderDetailsWindow.data("kendoWindow").open();
            },

            closeSelectedOrderWindow: function() {
                $("#windowOrderDetails").data("kendoWindow").close();
            }

        });
    }

    var dashboardModel=null;

    // User Model
    var UserModel = function() { 
            return kendo.observable({
            
            init: function() {
                
                this.set("email","");
                this.set("password","");
                var deferred = $.Deferred();
                deferred.resolve();
                return deferred.promise();
            },

            email: "",
            password: "",
            rememberMe: true,
            vendorName:"",
            validatorSignIn: null,
            validatorSignUp: null,
            validatorResetPassword:null,
            emailVerificationState:false,
            paymentProcessorFirstData: true,
            resetRequestID: null,

            attachValidator: function() {
                this.validatorSignUp=$("#frmSignUp").kendoValidator({
                    validateOnBlur: false,
                    rules:{
                        verifyPasswords: function(input){
                            var ret = true;
                            if (input.is("#txtPassword2"))
                                ret = input.val() === $("#txtPassword1").val();
                            return ret;
                        }
                    },
                    messages:{
                        verifyPasswords: "Password do not match"
                    }
                }).data("kendoValidator");

                this.validatorSignIn=$("#frmSignIn").kendoValidator({
                    validateOnBlur:false
                }).data("kendoValidator");

                this.validatorResetPassword=$("#frmResetPassword").kendoValidator({
                    validateOnBlur: false,
                    rules:{
                        verifyPasswords: function(input){
                            var ret = true;
                            if (input.is("#txtResetPassword2"))
                                ret = input.val() === $("#txtResetPassword1").val();
                            return ret;
                        }
                    },
                    messages:{
                        verifyPasswords: "Password do not match"
                    }
                }).data("kendoValidator");

            },

            toggleViews: function(e){
                
                e.preventDefault();

                this.validatorSignUp.hideMessages();
                this.validatorSignIn.hideMessages();

                $("#frmSignUp").toggle();
                $("#frmSignIn").toggle();

            },


            completeSignInSignUp: function(isNewAccount) {

                if(appModel.userInfo.emailValidated) {
                    appRouter.navigate(appDefaults.routeNames.home);
                    return;
                }

                this.set("emailVerificationState",true);
            },

            verifyEmail: function(e) {

                var self=this;
                var btnVerify=$(e.target);

                btnVerify.button("loading");

                if (appModel){
                     $.ajax({
                        url:  "/parse/users/" + appModel.userInfo.userID,
                        dataType: "json",
                        type:"GET",
                        headers:appModel.parse._headers,                    
                        
                        success:function(result){
                           if(result.emailValidated) {

                                var store=amplify.store("trcked.com");
                                store.emailValidated=true;
                                appModel.userInfo.emailValidated=true;
                                amplify.store("trcked.com",store);
                            }

                           else
                                kendoNotification.show({ title:'Not Verified', message:"Your email address is not verified" },"error"); 
                        },
                        error:function(result){
                            kendoNotification.show({ title:'Error', message:"An error occured...try again" },"error");                        
                        },
                        complete:function(){
                            
                            if(appModel.userInfo.emailValidated)
                                appRouter.navigate(appDefaults.routeNames.home);
                            
                            btnVerify.button("reset");
                        }
                    });
                } else {
                    //if appmodel does not exist then it means the user has not yet validated
                    //display an appropriate message
                    kendoNotification.show({ title:'Error', message:"You must verify your email address first." },"error"); 
                }       

            },

            resendEmail: function(e) {
                var self=this;
                var btnResend=$(e.target);

                btnResend.button("loading");

                 $.ajax({
                    url:  "/parse/functions/userVerifyEmailResend",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data: kendo.stringify({
                        userId: appModel.userInfo.userID
                    }),
                    success:function(httpResponse){
                       console.log(httpResponse);
                       if(httpResponse.result.sendStatus)
                           kendoNotification.show({ title:'Email Sent', message:"Please check your inbox" },"success");
                       else
                            kendoNotification.show({ title:'Error', message:"Error occured while sending email" },"error"); 
                    },
                    error:function(result){
                        kendoNotification.show({ title:'Error', message:"An error occured...try again" },"error");                        
                    },
                    complete:function(){
                       
                        btnResend.button("reset");
                    }

                });         

            }

        }); 
    }

    var userModel=null;

    // Logged in User profile
    var UserProfileModel=function() {
        return kendo.observable({

            //properties
            email: null,
            password: null,
            firstName: null,
            lastName: null,
            phoneNumber: null,

            validator: null,

            //functions
            attachValidator: function() {
                this.validator=$("#frmUserProfile").kendoValidator({
                    validateOnBlur: true,
                    rules:{
                        verifyPasswords: function(input){
                            var ret = true;
                            if (input.is("#txtPassword2"))
                                ret = input.val() === $("#txtPassword1").val();
                            return ret;
                        }
                    },
                    messages:{
                        verifyPasswords: "Passwords do not match"
                    }
                }).data("kendoValidator");
            },
            
            init: function() {
                var deferred= $.Deferred();
                var self=this;
                
                //get fields of the logged in user
                $.ajax({
                        url:  "/parse/users/"+appModel.userInfo.userID,
                        dataType: "json",
                        type:"GET",
                        headers: appModel.parse._headers,
                        
                        success: function(result) {
                           
                           self.set("email",result.username);
                           self.set("firstName",result.firstName);
                           self.set("lastName",result.lastName);
                           self.set("phoneNumber",result.phoneNumber);

                           deferred.resolve(result);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            kendoNotification.show({title:"Error!",message:"An error occured while fetching user profile"},"error")
                            handleAjaxError(jqXHR,textStatus,errorThrown);
                            deferred.resolve({errorCode:jqXHR.status,errorMsg: textStatus});
                        }
                
                });
                
                return deferred.promise();
            },

            saveUserProfile: function(e) {

                var self=this;
                var btnSave=$(e.target);
                var data={};

                if(this.validator.validate()==false) return;

                btnSave.button("loading");

                data.username=this.email;
                data.firstName=this.firstName;
                data.lastName=this.lastName;
                data.phoneNumber=this.phoneNumber && this.phoneNumber.replace(/\(|\)|_|-|\s/g,"");

                if(this.password)
                    data.password=this.password;

                //ajax call data save
                //ajax call data save
                $.ajax({
                        url:  "/parse/users/"+appModel.userInfo.userID,
                        dataType: "json",
                        type:"PUT",
                        headers: appModel.parse._headers,

                        data: kendo.stringify(data),
                        
                        success: function(result) {
                           kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");

                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            kendoNotification.show(appDefaults.notificationMessages.saveError,"error");
                            handleAjaxError(jqXHR,textStatus,errorThrown);
                            deferred.resolve({errorCode:jqXHR.status,errorMsg: textStatus});
                        },

                        complete: function() {
                            self.set("password",null);
                             $("#txtPassword2").val("");

                            btnSave.button("reset");
                        }
                
                });

            }

        });
    }

    var userProfileModel=null;

    var InventoryModel = function(){
        return kendo.observable({
            inventoryList:InventoryDataSource(appModel),
            truckList:appModel.parse.truckList,
            showActiveOnly: false,
            allMenuItems: MenuItemDataSource(appModel),

            editorModel:{
                selectedTruck:null,
                selectedInventoryItem:null,

                  deleteInventoryAssignment:function(e){
                    console.log(e);
                        var newInventoryAssignments;
                        newInventoryAssignments = _.filter(inventoryModel.editorModel.selectedInventoryItem.assignedItems, function(item, idx){
                            if (e.data.uid === item.uid)
                                return false 
                            else 
                                return true;
                        });

                        inventoryModel.editorModel.selectedInventoryItem.set("assignedItems", newInventoryAssignments);
                },
                addMenuAssignment:function(){
                    if (!inventoryModel.editorModel.selectedInventoryItem.get("assignedItems"))
                        inventoryModel.editorModel.selectedInventoryItem.set("assignedItems", []);

                    //create a new datasource so they dont impact each other
                    // var 
                    inventoryModel.editorModel.selectedInventoryItem.get("assignedItems").push({menuItem:{objectId:null}, decQty:0});
                },
                selectedLocationName:function(){


                        var editorModel = inventoryModel.get("editorModel");

                        locationObject = _.find(inventoryModel.get("truckList"), {objectId:editorModel.get("selectedTruck").objectId});

                        if (locationObject)
                            return locationObject.get("name");

                },

                getAssignedMenuItems:function(){
                    var deferred= $.Deferred();

                    $.when(inventoryModel.get("allMenuItems").fetch())
                    .then(function(){
                        if (inventoryModel.editorModel.selectedInventoryItem){
                            $.ajax({
                                url:  "/parse/functions/getAssignedMenuItems",
                                dataType: "json",
                                type:"POST",
                                headers: appModel.parse._headers,

                                data: kendo.stringify({
                                    inventoryItem:inventoryModel.editorModel.selectedInventoryItem
                                }),
                                success:function(httpResponse){
                                    console.log(httpResponse);
                                    var assignedMenuItems = [];

                                    _.each(httpResponse.result, function(anIventoryAssignment){

                                        assignedMenuItems.push({    menuItem:anIventoryAssignment.menuItem, 
                                                                    decQty:anIventoryAssignment.decQty,
                                                                    allMenuItems:inventoryModel.get("allMenuItems").data()
                                                                    // selectedMenuItem:null
                                                                });
                                    });
                                    inventoryModel.editorModel.selectedInventoryItem.set("assignedItems", assignedMenuItems);
                                    deferred.resolve(httpResponse.result);
                                },
                                error:function(result){
                                    kendoNotification.show({ title:'Error', message:"Assigned Menu items could not be retrieved. Please try again." },"error");
                                    deferred.resolve([]);                     
                                }

                            });  
                        } else 
                            return deferred.resolve();                        
                    });


                    return deferred.promise();

                },


            },

            init:function(){

            },
            attachValidator:function(){

            },
            setViewState:function(){
                //set a deault filter on the invitory list (if it has a value)
                if (this.get("inventoryList").filter())
                    this.get("inventoryList").filter({truck:null});
            },

            onInventoryLocationChange:function(e){
                // filter by selected truck/location
                var filterArray = [];

                var eventObj = e;
                //bind the inventorylist datasource to the listview
                //we could bind it in MVVM but then it will load all the data
                //which we do not want. We only want to load the items for thie location/truck

                if (eventObj.sender.value() != ""){
                    
                    kendo.bind($("#locationInventoryList"), this);

                    var selectedTruck = appModel.getParsePointer({objectId:eventObj.sender.value()}, "Truck");
                    inventoryModel.set("editorModel.selectedTruck", selectedTruck);
                    
                    $.when(this.get("inventoryList").read({truck:selectedTruck}))
                    .then(function() {                      
                        filterArray.push({
                            field: "truck",
                            operator: function(item, value){
                                if (item && item.objectId == value){
                                    inventoryModel.set("editorModel.selectedTruck", item);
                                    return true
                                
                                } else 
                                    return false;
                            },
                            value:eventObj.sender.value()
                        });

                        if (inventoryModel.get("showActiveOnly")){
                            filterArray.push({  field:"currentLevel", 
                                                    operator:function(item, value){
                                                        if (item == value)
                                                            return false
                                                        else 
                                                            return true;
                                                    },
                                                    value:null
                                                });
                        };

                        inventoryModel.inventoryList.filter(filterArray);
                    });

                }

            },

            getAlertRecipients:function(){
                return appModel.vendorInfo.get("settings").inventoryAlarmPhoneList;
            },
             
            toggleShowActiveButtons:function(){
                this.set("showActiveOnly", !this.get("showActiveOnly"));
                this.updateShowActiveButtons();
                //now set the filter
                var filterObject = inventoryModel.inventoryList.filter();
                if (!filterObject){
                    if (this.get("showActiveOnly"))
                        inventoryModel.inventoryList.filter({field:"currentLevel", operator:"neq", value:null});                    
                } else {
                    if (this.get("showActiveOnly"))
                        filterObject.filters.push({  field:"currentLevel", 
                                                operator:function(item, value){
                                                    if (item == value)
                                                        return false
                                                    else 
                                                        return true;
                                                },
                                                value:null
                                            });
                    else {
                        filterObject.filters = _.without(filterObject.filters, _.find(filterObject.filters, {field: 'currentLevel'}));
                    };

                    inventoryModel.inventoryList.filter(filterObject);              
                };
                
            },

            updateShowActiveButtons:function(){

                if (this.get("showActiveOnly")){
                    $('#ShowActiveInventoryOnly').addClass('btn-primary');
                } else {
                    $('#ShowActiveInventoryOnly').removeClass('btn-primary');
                };                
            },

            isInitialLevelSet: function(data){
                if (data.currentLevel == null)
                    return true
                else return false;
            },

            isStockAdjustEnabled: function(data){
                if (data.currentLevel == null)
                    return false
                else return true;
            },

            // getInventoryButtonText:function(data){
            //     if (data.currentLevel == null)
            //         return 'Set Inventory Alert'
            //     else
            //         return 'Adjust Inventory';
            // },

            addInventoryRecord:function(e){
                //make sure that a truck/location has been selected
                if (!this.editorModel.get("selectedTruck")){
                    kendoNotification.show({title:"Inventory",message: "Please select a location"},"info");
                } else {
                    //initialize selectedInventoryItem as initial since we are creating one
                    this.set("editorModel.selectedInventoryItem", {objectId:null, assignedItems:[{menuItem:{objectId:null}, decQty:0}]} );
                    this.editInventoryItem();
                };
            },

            onInventoryListDatabound: function(e){
                setScrollingHeight(e.sender.element[0]);
            },

            editInventoryItem:function(e){

                if (e && e.data){
                    
                    if (!e.data.assignedItems)
                        e.data.assignedItems = [];

                    this.set("editorModel.selectedInventoryItem", e.data);

                    //default the 'new' level to the current level
                    this.set("editorModel.selectedInventoryItem.newLevel", e.data.currentLevel);

                    //set adjustment reason to initial.
                    this.set("editorModel.selectedInventoryItem.adjustReason", "");

                }

                kendo.bind($("#inventoryStockAdjustment"), this);

                var inventoryAdjustWindow = $("#inventoryStockAdjustment");

                //add a kendo validator to the popup window
                inventoryAdjustWindow.kendoValidator({
                    validateOnBlur: true,
                    errorTemplate: "<div style='color:red'>#=message#</div>",
                    rules:{
                        
                        inventoryLevelChanged:function(input){
                            if (input.is('[id=inventoryAdjustReason]')) {
                            //if the invenotry level has changed, make sure an adjustment reason has been entered
                                if ((inventoryModel.editorModel.selectedInventoryItem.currentLevel != inventoryModel.editorModel.selectedInventoryItem.newLevel) && (!inventoryModel.editorModel.selectedInventoryItem.adjustReason))
                                    return false
                                else return true;
                            } 
                                return true;

                        },
                        checkUniqueMenuItem:function(input){
                            if (input.is('[id=assignInventoryTo]')) {

                                var numMatches = 0;
                                _.each(inventoryModel.editorModel.selectedInventoryItem.assignedItems, function(anAssignedItem){
                                    if (anAssignedItem.menuItem.objectId == input.val()){
                                        numMatches++;
                                    };

                                });

                                if (numMatches > 1)
                                    return false
                                else 
                                    return true;

                            } else
                                 return true;                       

                        },
                        checkDecrementQty:function(input){
                            if (input.is('[id=assignDecQty]')) {
                                var isValid = true;

                                _.every(inventoryModel.editorModel.selectedInventoryItem.assignedItems, function(anAssignedItem){
                                    
                                    if (anAssignedItem.decQty == 0)
                                        isValid = false
                                    else
                                        isValid = true;

                                    return isValid;
                                });

                                return isValid;

                            } else
                                 return true;                                
                        },
                        checkPricePointSelected:function(input){
                            var isValid = true;
                            if (input.is('[id=assignPriceText]')) {
                                
                                _.every(inventoryModel.editorModel.selectedInventoryItem.assignedItems, function(anAssignedItem){
                                    
                                    if (anAssignedItem.menuItem.prices.length > 0 && input.val() == "")
                                        isValid = false;
                                    else
                                        isValid = true;

                                    return isValid
                                });
                            };
                            return isValid;
                        }

                    },
                    messages:{
                        inventoryLevelChanged: "Please enter an Adjustment Reason",
                        checkUniqueMenuItem: "Menu Item is all ready assigned",
                        checkDecrementQty:"Please enter decrement quantity greater than zero"
                    }
                }).data("kendoValidator");

                if(!inventoryAdjustWindow.data("kendoWindow")) {
                    inventoryAdjustWindow.kendoWindow({
                        title: "Adjust Inventory",
                        modal: true,
                        // width:"75%",
                        scrollable:true,
                        // height:"50%",
                        resizable:true,
                        visible:false,
                        open:function(){
                            var self = this;
                            if (inventoryModel.editorModel.selectedInventoryItem && inventoryModel.editorModel.selectedInventoryItem.objectId)
                                inventoryModel.editorModel.getAssignedMenuItems()
                                .then(function(){
                                    self.center(); //now that the assigned menu items are loaded, re-center the window
                                });

                        }
                    });
                };

                inventoryAdjustWindow.data("kendoWindow").center().open(); 


            },
            closeStockAdjustWindow:function(){
                var inventoryAdjustWindow = $("#inventoryStockAdjustment").data("kendoWindow");
                inventoryAdjustWindow.close();  
            },
            closeAndSaveStockAdjustWindow:function(e){
                var validatable = $("#inventoryStockAdjustment").data("kendoValidator");
                if (validatable.validate()){
                    
                    var btnSave=$(e.target);
                    btnSave.button("loading");

                    if (!e.data.editorModel.selectedInventoryItem.objectId){
                        // var data = $.extend(e.data.editorModel.selectedInventoryItem, {truck: e.data.editorModel.selectedTruck});

                        e.data.editorModel.selectedInventoryItem.truck = e.data.editorModel.selectedTruck;
                        e.data.editorModel.selectedInventoryItem.currentLevel = null;

                        inventoryModel.get("inventoryList").add(e.data.editorModel.selectedInventoryItem);
                    }
                    //if 'new level ' is not set (null) then just default the value to the current level so now adjustment islogged
                    if (!e.data.editorModel.selectedInventoryItem.newLevel)
                        e.data.editorModel.selectedInventoryItem.newLevel = e.data.editorModel.selectedInventoryItem.currentLevel; 

                    $.when(inventoryModel.inventoryList.sync())
                    .then(function(){
                        kendoNotification.show({title:"Inventory",message: "Inventory has been updated"},"success");
                        inventoryModel.closeStockAdjustWindow();
                        btnSave.button("reset");
                    }, function(error){
                        inventoryModel.inventoryList.cancelChanges();
                        var message;
                        if (error.message)
                            message = error.message;
                        
                        if (error.error)
                            message = error.error;

                        kendoNotification.show({title:"Inventory Error",message: message},"error");
                        btnSave.button("reset");
                    });
                };

            },
        });
    };

    var inventoryModel = null; 

    // Truck Model
    var TruckModel = function() {
        return kendo.observable({
        
        initAction: null,

        init: function() {
             var deferred = $.Deferred();
             
             this.set("truckList", TruckDataSource(appModel));
             this.set("menuHeaders", MenuHeaderDataSource(appModel));

             this.set("bulkMenuHeaders", 
                function(){
                    var bulkMenuHeaderArray = [];

                    _.each(this.get("menuHeaders").data(), function(aMenuHeader){
                        //return all the bulk menu headers
                        if (aMenuHeader.get("isBulk") == true)
                            bulkMenuHeaderArray.push(aMenuHeader);
                    });
                    return bulkMenuHeaderArray;
                });
             
             $.when(this.get("menuHeaders").fetch(),this.get("truckList").fetch())
             .then(function() {
                deferred.resolve();
             })

             return deferred.promise();
        },

        setViewState: function() {

            if(!appModel.modelParams) return;

            var params=appModel.modelParams;

            if(params.hasOwnProperty("objectId")) {
                var data={data:{}};
                var dropdownlist = $("#lstCurrentMenu").data("kendoDropDownList");

                var dataItem = this.get("truckList").get(params.objectId);
                $.extend(data.data,dataItem.toJSON());

                this.editTruckRecord(data);

                if(params.hasOwnProperty("action") && params.action=="OPEN_MENU_DROPDOWN") {
                    dropdownlist.focus()
                    dropdownlist.open();
                }

            }

        },

        openMenuView: function(e) {
            var link=$(e.target);

            e.preventDefault();
            appModel.modelParams={"selectMenuHeaderID": link.data("id") };
            appRouter.navigate(appDefaults.routeNames.menu+"/getParams");
        },

        attachValidator: function() {

            var self=this;
            
            this.validator=$("#frmTruckRecordEdit").kendoValidator({
                validateOnBlur: false,
                rules: {

                            activeNotZero:function(input){
                                console.log(input);
                                validationResult = true;

                                if (input.is("[data-activeNotZero-msg]")){
                                    if (input.val() == 0){
                                        var parent = input.parents('.form-group');
                                        //now find the checkbox
                                        chkbox = parent.find('input[type=checkbox]')[0];
                                        if (chkbox.checked == true)
                                            validationResult = false;
                                    };                                           

                                };
                                return validationResult;
                            },

                            duplicate: function (input) {

                                var isNotDuplicate=true;
                                
                                if (input.is("[data-duplicate-msg]") && input.val() != "") {                                    
                                    
                                    var truckData=self.truckList.data()
                                    for(var i=0;i<truckData.length;i++) {
                                        if(self.editorModel.name.toUpperCase()==truckData[i].name.toUpperCase() && self.editorModel.objectId!=truckData[i].objectId)
                                            isNotDuplicate=false;
                                    }

                                    return isNotDuplicate;                      
                                }

                                return true;
                            }
                },
                messages:{
                    activeNotZero:'Amount must be greater than zero'
                }
            }).data("kendoValidator");
        },

        hasRecords:function(){
            return this.get("truckList").data().length?true:false;
        },

        getCentralKitchenDescription:function(item){
            var desc;
            if (item.centralKitchen){
                var locationsArray = truckModel.get("truckList").data();
                _.each(locationsArray, function(aLocation){
                    if (aLocation.id == item.centralKitchen.objectId){
                        desc = aLocation.get("name");  
                    }
                });
            };
            return desc;
        },

        getMenuDescription: function(item) {
            
            if(!item.menuHeader.objectId) return "";

            var dataItem=this.menuHeaders.get(item.menuHeader.objectId);

            //should never happen but if the data is corrupted then the following line will cause an exception
            // the IF statement will fix that
            if (dataItem)
                return "<a href='#' class='link-page' data-bind='click: openMenuView' data-id="+ dataItem.objectId + ">"+dataItem.name+"</a>";
                    else return "";
        },

        onTruckListViewDataBound: function(e) {

            var self=this;

            if(this.truckList.data().length==0) {
                
                var divEmptyPlaceholderContent=$("<div/>").attr("class","col-md-12");

                var btnAdd=$("<input/>").attr({type:'button',value:'Add My First Truck/Location',class:'btn btn-default btn-lg'}).click(function(){self.addTruckRecord()});

                divEmptyPlaceholderContent.append("<img src='./images/truck_blue.svg'></img><h2>What! No Truck/Locations??</h2><p>Adding a truck/location is easy<br/>Click 'Add My First Truck/Location' to get started now.</p>")
                .append(btnAdd);

                $("#kendoListView").append($("<div/>").attr("class","row div-norecords-placeholder").append(divEmptyPlaceholderContent));

            };

            setScrollingHeight(e.sender.element[0]);
        },

        editorModel: {
            "objectId" : null,
            "name":null,
            "currentStatus":null,
            "menuHeader":{__type:"Pointer",objectId:null,className:"MenuHeader"},
            "bulkMenuHeader":{__type:"Pointer",objectId:null,className:"MenuHeader"},
            "centralKitchen": {__type:"Pointer",objectId:null,className:"Truck"},
            "retailLocation": true,
            "delivery":{    enabled:false, maxDeliveryDistance:20,
                            minimumOrder:{enabled:false, amount:"0.00"}, 
                            fixedCharge:{enabled:false, amount:"0.00"},
                            distanceCharge:{enabled:false, amount:"0.00"},
                            deliveryTax:{enabled:false, percent:"0.00"}
                        },

            "locations": function(){
                var locationsArray = []
                _.each(truckModel.get("truckList").data(), function(aLocation){
                    //return all the trucks except for the one being edited
                    if (aLocation.objectId != truckModel.editorModel.objectId)
                        locationsArray.push(aLocation);
                });
                return locationsArray;
            },

            loadInventory:function(e){
                
            },

            reset: function() {
                this.set("objectId",null);
                this.set("name",null);
                this.set("centralKitchen",  {__type:"Pointer",objectId:null,className:"Truck"});
                this.set("currentStatus","OPEN");
                this.set("retailLocation",true);
                this.set("delivery",{ enabled:false, maxDeliveryDistance:20,
                            minimumOrder:{enabled:false, amount:"0.00"}, 
                            fixedCharge:{enabled:false, amount:"0.00"},
                            distanceCharge:{enabled:false, amount:"0.00"},
                            deliveryTax:{enabled:false, percent:"0.00",
                            deliveryDescription:""}
                        });
                this.set("menuHeader",{__type:"Pointer",objectId:null,className:"MenuHeader"});
                this.set("bulkMenuHeader",{__type:"Pointer",objectId:null,className:"MenuHeader"});  
                
                //set the toggle button
                this.setupTruckToggleButtons();

            },

            setupTruckToggleButtons: function(){
                if (this.get("retailLocation")){
                    $('#retailLocationOn').addClass('active btn-primary');
                    $('#retailLocationOff').removeClass('active btn-primary');
                } else {
                    $('#retailLocationOff').addClass('active btn-primary');
                    $('#retailLocationOn').removeClass('active btn-primary');
                };

                if (this.get("delivery") && this.get("delivery").enabled == true){
                    $('#deliveryOn').addClass('active btn-primary');
                    $('#deliveryOff').removeClass('active btn-primary');
                    // var inputNumericArray = $('#deliveryChargeType').find("input[type=checkbox]").data("kendoNumericTextBox");
                    // inputNumericArray.enable(true);
                } else {
                    $('#deliveryOff').addClass('active btn-primary');
                    $('#deliveryOn').removeClass('active btn-primary');
                    //disable all input fields and checks boxes
                    // var inputNumericArray = $('#deliveryChargeType').find("input[data-role=numerictextbox]").data("kendoNumericTextBox");
                    // inputNumericArray.enable(false);
                };                    
            },

            toggleDelivery: function(){
                // var self = this;

                if (this.editorModel.delivery.enabled == false){
                    this.editorModel.set("delivery.enabled" , true);
                } else {
                    this.editorModel.set("delivery.minimumOrder.enabled", false);
                    this.editorModel.set("delivery.fixedCharge.enabled", false);
                    this.editorModel.set("delivery.distanceCharge.enabled" , false);
                    this.editorModel.set("delivery.deliveryTax.enabled" , false);
                    this.editorModel.set("delivery.enabled" , false);
                    this.editorModel.set("delivery.deliveryDescription", "");
                }
                this.set("delivery", this.editorModel.get("delivery"));
                this.editorModel.setupTruckToggleButtons();
            }
        },


        toggleIsLocationRetail: function(){
            var self = this;
            self.set("editorModel.retailLocation", !this.editorModel.retailLocation);
            this.editorModel.setupTruckToggleButtons();
        },

        filterTruckStatus:appDefaults.filters.truckStatus,
        
        truckList: null,
        menuHeaders: null,
        stockHeaders: null,
        delivery: null,
        status: [{text:"OPEN",value:"OPEN"},{text:"OPEN-OFFLINE",value:"OPEN-OFFLINE"}],
        validator:null,
        
        // returns the contents for the help section from a html file
        helpContent: function() {       

            var self=this;
            
            $.ajax({
                url: "./help/trucks.htm"

            }).success(function(data) {
               self.set ("helpContent",data);
            });
        },

        // get the button text time
        getButtonText:function(e) {
            var locationUpdateStamp = e.locationUpdateStamp.iso != "" ? e.locationUpdateStamp.iso.substring(0,19):"";
            return '<i class="fa fa-map-marker"></i>&nbsp;'+moment(locationUpdateStamp, "YYYY-MM-DD hh:mm:ss").fromNow()
        },

        // show map for location
        showMap: function(e) {

            // var lat=parseFloat($(e.target).data('latitude'));
            // var long=parseFloat($(e.target).data('longitude'));
            var lat = e.data.lastLocation.latitude;
            var long = e.data.lastLocation.longitude;

            var locationUpdateStamp=e.data.locationUpdateStamp.iso!=""?e.data.locationUpdateStamp.iso.substring(0,19):""
            var truckName=e.data.name;

            var contentString= "<h4>"+truckName+"</h4>"+
                                        "<p>Updated  <span class='badge'>"+ moment(locationUpdateStamp, "YYYY-MM-DD hh:mm:ss").fromNow()+"</span></p>";

            //alert(moment(locationUpdateStamp, "YYYY-MM-DD hh:mm:ss").fromNow());

            var myLatlng = new google.maps.LatLng(lat,long);

            var mapOptions = {
                zoom: 15,
                center: myLatlng
            };

            var mapWindow = $("#mapWindow");

            if(!mapWindow.data("kendoWindow")) { 
                mapWindow.kendoWindow({
                    width: "600px",
                    height: "600px",
                    title: truckName,
                    modal: true
                });                
            }

            mapWindow.data("kendoWindow").center().open();
            map = new google.maps.Map(document.getElementById('mapWindow'),
                mapOptions);

            var marker = new google.maps.Marker({
                position: myLatlng,
                map: map,
                title: moment(locationUpdateStamp, "YYYY-MM-DD hh:mm:ss").format('MMMM Do YYYY, h:mm:ss a'),
            });

            marker.setAnimation(google.maps.Animation.DROP);

            // var infowindow = new google.maps.InfoWindow({
            //                     content: contentString

            //                 });

            // google.maps.event.addListener(marker, 'click', function() {
            //     infowindow.open(map,marker);
            // });
        },

        // record filter
        onStatusChange:function(e) {
            switch($("#lstStatus").val()){
                case "0":      //reset
                    this.get("truckList").filter( { /*clears the filters */});
                    break;
                case "1":      //OPEN
                    this.get("truckList").filter( { field: "currentStatus", operator: "eq", value: $("#lstStatus").data("kendoDropDownList").text() });
                    break;
                case "2":      //OPEN-OFFLINE
                    this.get("truckList").filter( { field: "currentStatus", operator: "eq", value: $("#lstStatus").data("kendoDropDownList").text()  });
                    break;

            }
            
        },

        searchData:function() {
            this.get("truckList").filter( { /*clears the filters */});
            this.get("truckList").filter( { field: "description", operator: "startswith", value: $("#txtSearch").val() });
        },

        searchDataReset:function() {
            $("#txtSearch").val('');
            this.get("truckList").filter( { /*clears the filters */});

        },

        onTruckSelectionChange: function () {
            
        },

        
        // CRUD operations
        addTruckRecord: function(e) {
            
            //set the editor model data
            this.editorModel.reset(); 

            toggleEditor();
             
        },

        editTruckRecord: function(e) {
            
            //set the editor model data
            this.editorModel.set("objectId",e.data.objectId);
            this.editorModel.set("name",e.data.name);
            this.editorModel.set("currentStatus",e.data.currentStatus);
            this.editorModel.set("menuHeader",e.data.menuHeader);

            this.editorModel.set("bulkMenuHeader",e.data.bulkMenuHeader);
            this.editorModel.set("centralKitchen",e.data.centralKitchen);
            this.editorModel.set("retailLocation",e.data.retailLocation);
            if (!e.data.delivery){
                this.editorModel.set("delivery",{ enabled:false, maxDeliveryDistance:20,
                            minimumOrder:{enabled:false, amount:"0.00"}, 
                            fixedCharge:{enabled:false, amount:"0.00"},
                            distanceCharge:{enabled:false, amount:"0.00"},
                            deliveryTax:{enabled:false, percent:"0.00",
                            deliveryDescription:""}
                        });
            } else 
                this.editorModel.set("delivery",e.data.delivery);
            
            //reCalculate the values in the drop down list
            var dropdownlist = $("#lstLocations").data("kendoDropDownList");
            if (dropdownlist){
                var locationListDataSource = new kendo.data.DataSource({
                    data: this.editorModel.get("locations")()
                });
                dropdownlist.setDataSource(locationListDataSource);
            }

            this.editorModel.setupTruckToggleButtons();
            this.validator.hideMessages(); //in case any were showing from a previous attempt

            toggleEditor();

        },

        saveTruckRecord: function(e) {
            
            var self=this;
            var btnSave=$(e.target);

            // validate
            if(this.validator.validate()==false){
               return;
            };

            btnSave.button("loading");

            if (this.editorModel.objectId!=null) {
                var dataItem = this.get("truckList").get(this.editorModel.objectId);
                $.extend(dataItem,this.editorModel);
                dataItem.dirty=true;
                
            }

            else {
                this.truckList.add(this.editorModel.toJSON());
                
            }

            $.when(this.get("truckList").sync()).then(

                function(result) {
                    kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");
                },  

                function(result){
                    kendoNotification.show(appDefaults.notificationMessages.saveError,"error");
                    self.truckList.read();
                }
            ).always(function(){
                toggleEditor();
                btnSave.button("reset");

            });

            
        },

        cancelSaveTruckRecord: function(e) {
            this.validator.hideMessages();
            toggleEditor();
        },

        deleteTruckRecord: function(e) {
            e.preventDefault();
            var self=this;
            //var delTruck = self.editorModel.truckData;

            $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete <span class='badge alert-danger'>"+self.editorModel.name+"</span>",icon:"k-ext-warning" }))
                .done(function (response) {
                        if(response.button=="Yes") {
                            var dataItem = self.get("truckList").get(self.editorModel.objectId);
                            self.get("truckList").remove(dataItem);
                    
                            $.when(self.get("truckList").sync()).then(function() {
                               kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success");
                               toggleEditor();
                                
                            }, function() {
                                   kendoNotification.show(appDefaults.notificationMessages.deleteError,"error");
                                   self.truckList.read();
                            })
                        }

                    });

        }
      })
    }

    var truckModel=null;

    // Menu Model
    var MenuModel = function() { 
        return kendo.observable({
        
        init: function() {
             var deferred = $.Deferred();
             var self=this;
             
             this.set("menuHeaders", MenuHeaderDataSource(appModel));
             this.set("menuItemOptions", MenuItemOptionsDataSource(appModel));
             this.set("menuCategories", MenuCategoryDataSource(appModel));
             this.set("taxCodes", TaxCodesDataSource());
             this.set("truckList", TruckDataSource(appModel));

             $.when(    this.get("menuHeaders").fetch(),this.get("taxCodes").fetch(),
                        this.get("truckList").fetch(),this.get("allMenuItems").fetch()
               ).then(function() {
                    deferred.resolve();
             });

            return deferred.promise();
        },

        setViewState: function() {

            if(!appModel.modelParams) return;

            var params=appModel.modelParams;

            if(params.hasOwnProperty("selectMenuHeaderID")) {     // select menu header by ID

                var dropdownlist = $("#lstMenues").data("kendoDropDownList");
                // dropdownlist.select(dropdownlist.dataSource.indexOf(dropdownlist.dataSource.get(params.selectMenuHeaderID)));
                dropdownlist.value(params.selectMenuHeaderID);
                dropdownlist.trigger("change");
                // var lv = $("#lstMenues").data("kendoListView");
                // var listViewItem = lv.element.children("[data-uid='" + lv.dataSource.get(params.selectMenuHeaderID).uid + "']");
                // lv.select(listViewItem);

            }

        },

        attachValidator: function() {

            var self=this;

            this.menuOptionsGroupValidator=$("#frmMenuItemOptionGroup").kendoValidator({
                validateOnBlur: false,
                rules: {
                            duplicate: function (input) {

                                var isNotDuplicate=true;
                                
                                if (input.is("[data-duplicate-msg]") && input.val() != "") {                                    
                                    
                                    var headerData=self.menuItemOptions.data()
                                    for(var i=0;i<headerData.length;i++) {
                                        if(self.editorModel.menuOptionGroup.name.toUpperCase()==headerData[i].name.toUpperCase() && self.editorModel.menuOptionGroup.objectId!=headerData[i].objectId)
                                            isNotDuplicate=false;
                                    }

                                    return isNotDuplicate;                      
                                }

                                return true;
                            },
                            isOptionBlank:function(input){
                                var isValid = true;
                                if (input.is("[name=optionDesc]")){
                                    if (input.val() == "")
                                        return false;
                                }
                                return isValid;
                            }
                        },
                messages:{
                    isOptionBlank:"Please enter an option name"
                }
            }).data("kendoValidator");

            this.menuHeaderValidator=$("#frmMenuHeaderRecordEdit").kendoValidator({
                validateOnBlur: false,
                rules: {
                            duplicate: function (input) {

                                var isNotDuplicate=true;
                                
                                if (input.is("[data-duplicate-msg]") && input.val() != "") {                                    
                                    
                                    var headerData=self.menuHeaders.data()
                                    for(var i=0;i<headerData.length;i++) {
                                        if(self.editorModel.menuHeader.name.toUpperCase()==headerData[i].name.toUpperCase() && self.editorModel.menuHeader.objectId!=headerData[i].objectId)
                                            isNotDuplicate=false;
                                    }

                                    return isNotDuplicate;                      
                                }

                                return true;
                            }
                        }
            }).data("kendoValidator");

            this.menuCategoryValidator=$("#frmMenuCategoryRecordEdit").kendoValidator({
                validateOnBlur: false,
                rules: {
                            duplicate: function (input) {

                                var isNotDuplicate=true;
                                
                                if (input.is("[data-duplicate-msg]") && input.val() != "") {                                    
                                    
                                    var data=self.menuCategories.data()
                                    for(var i=0;i<data.length;i++) {
                                        if(self.editorModel.menuCategory.name.toUpperCase()==data[i].name.toUpperCase() && self.editorModel.menuCategory.objectId!=data[i].objectId)
                                            isNotDuplicate=false;
                                    }

                                    return isNotDuplicate;                      
                                }

                                return true;
                            }
                        }
            }).data("kendoValidator");

            this.menuItemValidator=$("#frmMenuItemRecordEdit").kendoValidator({
                validateOnBlur: false,
                rules: {
                            duplicate: function (input) {

                                var isNotDuplicate=true;
                                
                                if (input.is("[data-duplicate-msg]") && input.val() != "") {                                    
                                    
                                    var data=self.allMenuItems.data()
                                    for(var i=0;i<data.length;i++) {
                                        if(self.editorModel.menuItem.name.toUpperCase()==data[i].name.toUpperCase() && self.editorModel.menuItem.objectId!=data[i].objectId)
                                            isNotDuplicate=false;
                                    }

                                    return isNotDuplicate;                      
                                }

                                return true;
                            }
                        }
            }).data("kendoValidator");
        },

        setDropTargetAreas: function(){

            var self=this;

            $("#kendoLVMenuCategory").kendoDropTargetArea({
                filter: ".row",
                // hoverCategoryA:null,
                // hoverCategoryB:null,
                drop: function(e){
                    // console.log('Empty Category - dropped on top of...');
                    // console.log(e);
                    var draggedCategory = self.menuCategories.getByUid($(e.draggable.currentTarget[0].parentNode.parentNode).attr("data-uid"));
                    // console.log(draggedCategory);
                    if (!draggedCategory){
                        e.preventDefault();
                        return false;
                    };

                    var dropTargetCategory = self.menuCategories.getByUid($(e.dropTarget).attr('data-uid'));
                    // console.log(dropTargetCategory);

                    //we use pushDestory as it will update
                    self.menuCategories.pushDestroy(draggedCategory);
                    var targetIndex = self.menuCategories.indexOf(dropTargetCategory);
                    targetIndex++; //add 1 so we drop the item AFTER the target
                    
                    self.menuCategories.insert(targetIndex, draggedCategory);                 
                    

                    //now re-number the display order on each item and save
                    _.each(self.menuCategories.data(), function(aCategory, index){
                        var displayOrder = index + 1;
                        aCategory.set("displayOrder", displayOrder);
                    });

                    //now sync to the back end
                    $.when(self.menuCategories.sync())
                    .then(function(){
                        self.menuCategories.sort({field:'displayOrder'});
                        kendoNotification.show({title:"Menu Category",message: "Menu category order has been updated"},"success");
                    }, function(error){
                        console.log('Error: ' + JSON.stringify(error));
                        kendoNotification.show({title:"Menu Category",message: "Unexpected error. Category not updated"},"error");
                        self.menuCategories.cancelChanges();
                        self.menuCategories.sort({field:'displayOrder'})
                    });
                },
                dragenter:function(e){
                    // console.log(e);
                    // console.log(e.dropTarget[0].textContent);
                    
                    // $(e.dropTarget[0]).animate({opacity: 0.5});
                    var draggedCategory = self.menuCategories.getByUid($(e.draggable.currentTarget[0].parentNode.parentNode).attr("data-uid"));
                    if (draggedCategory){
                        $(e.dropTarget[0]).css('border-bottom-width', "10px");
                        // $(e.dropTarget[0]).css('border-bottom-style', "solid");
                    };
                },
                dragleave:function(e){
                    var draggedCategory = self.menuCategories.getByUid($(e.draggable.currentTarget[0].parentNode.parentNode).attr("data-uid"));
                    if (draggedCategory){
                        $(e.dropTarget[0]).css('border-bottom', '1px solid #E2E4E7');
                        // $(e.dropTarget[0]).css('border-bottom-style', "none");
                    };
                }
            });

            $("#kendoLVAssignedMenuItems").kendoDropTargetArea({
                filter: ".row",
                // hoverCategoryA:null,
                // hoverCategoryB:null,
                drop: function(e){
                    // console.log('Empty Category - dropped on top of...');
                    // console.log(e);
                    var draggedMenuItem = self.assignedMenuItems.getByUid($(e.draggable.currentTarget[0]).parents('.trkListRow').attr("data-uid"));
                    console.log(draggedMenuItem);

                    if (!draggedMenuItem){
                        e.preventDefault();
                        return false;
                    };

                    var dropTargetMenuItem = self.assignedMenuItems.getByUid($(e.dropTarget).attr('data-uid'));
                    // console.log(dropTargetCategory);

                    var targetIndex = self.assignedMenuItems.indexOf(dropTargetMenuItem);
                   
                    //we use pushDestory as it will prevent update to the server
                    self.assignedMenuItems.pushDestroy(draggedMenuItem);

                    if (targetIndex == 0)
                        incrementedIndex = targetIndex + 1;
                    else
                        incrementedIndex = targetIndex; //drop the item AFTER the target

                    //now insert the drop category at that index
                    self.assignedMenuItems.insert(incrementedIndex, draggedMenuItem);
                    
                    //now re-number the display order on each item and save
                    _.each(self.assignedMenuItems.data(), function(aMenuItem, index){
                        var displayOrder = index + 1;
                        aMenuItem.set("displayOrder", displayOrder);
                        aMenuItem.set("menuCategory", self.itemDragCategory);
                    });

                    //now sync to the back end
                    $.when(self.assignedMenuItems.sync())
                    .then(function(){
                        self.assignedMenuItems.sort({field:'displayOrder'});
                        kendoNotification.show({title:"Menu Item",message: "Menu item order has been updated"},"success");
                    }, function(error){
                        console.log('Error: ' + JSON.stringify(error));
                        kendoNotification.show({title:"Menu Item",message: "Unexpected error. Menu Item not updated"},"error");
                        self.assignedMenuItems.cancelChanges();
                        self.assignedMenuItems.sort({field:'displayOrder'})
                    });
                },
                dragenter:function(e){
                    // console.log(e);
                    // console.log(e.dropTarget[0].textContent);
                    
                    // $(e.dropTarget[0]).animate({opacity: 0.5});
                    var draggedMenuItem = self.assignedMenuItems.getByUid($(e.draggable.currentTarget[0]).parents('.trkListRow').attr("data-uid"));
                    
                    if (draggedMenuItem){
                        $(e.dropTarget[0]).css('border-bottom-width', "10px");
                        // $(e.dropTarget[0]).css('border-bottom-style', "solid");
                    };
                },
                dragleave:function(e){
                    var draggedMenuItem = self.assignedMenuItems.getByUid($(e.draggable.currentTarget[0]).parents('.trkListRow').attr("data-uid"));
                    if (draggedMenuItem){
                        $(e.dropTarget[0]).css('border-bottom', '1px solid #E2E4E7');
                        // $(e.dropTarget[0]).css('border-bottom-style', "none");
                    };

                    // $(e.dropTarget[0]).animate({opacity: 1});
                }
            });
        },

        menuHeaders: null,
        menuCategories: MenuCategoryDataSource(appModel),
        assignedMenuItems: AssignedMenuItemDataSource(appModel),
        menuItemOptions: MenuItemOptionsDataSource(appModel),
        allMenuItems: MenuItemDataSource(appModel),
        assignedMenuHeadrs: MenuCategoryDataSource(appModel),
        taxCodes: null,
        truckList: null,
        itemDragCategory: null,

        menuHeaderValidator:null,
        menuCategoryValidator:null,
        menuItemValidator:null,

        selectedMenuHeader: "0",
        selectedMenuCategory: "0",

        hideForms: function() {
            $(" #frmMenuHeaderRecordEdit,#frmMenuCategoryRecordEdit,#frmMenuItemRecordEdit,#frmMenuItemOverrideRecordEdit,#frmMenuItemOptionGroup,#frmDiscountsRecordEdit")
            .hide();
        },

        // sets visibility of html elements

        hasMenus: function() {
            return this.get("menuHeaders").data().length?true:false;
        },

        hasCategories: function() {
            return this.get("menuCategories").data().length?true:false;
        },

        hasItems: function() {
            return this.get("assignedMenuItems").data().length?true:false;
        },

        onMenuHeadersListViewDataBound: function() {

            var self=this;

            if(this.menuHeaders.data().length==0) {
                
                var divEmptyPlaceholderContent=$("<div/>").attr("class","col-xs-12");
                var btnAdd=$("<input/>").attr({type:'button',value:'Add My First Menu',class:'btn btn-default btn-lg'}).click(function(){self.editorModel.menuHeader.addRecord.apply(self)});

                divEmptyPlaceholderContent.append("<img src='./images/menu_blue.svg'></img><h2>What! No Menus?</h2><p>Adding menus is easy<br/>Click 'Add My First Menu' to get started now.</p>")
                                          .append(btnAdd);

                $("#kendoLVMenuHeader").append($("<div/>").attr("class","row div-norecords-placeholder").append(divEmptyPlaceholderContent));
                $("#kendoLVMenuHeader div:first-child").toggleClass('k-selectable');
            }

        },

        onMenuCategoriesListViewDataBound: function(e) {

            var self=this;

            // if (this.selectedMenuHeader == "UNASSIGN001"){
            //     //disable the 'Add Category' button for 
            //     //unassiged 'menu'
            //     this.editorModel.menuCategory.set("addCategoryDisabled", true);

            // } else {
            //     this.editorModel.menuCategory.set("addCategoryDisabled", false);

            if(this.menuCategories.data().length==0) {
                
                var divEmptyPlaceholderContent=$("<div/>").attr("class","col-xs-12");
                
                var btnAdd=$("<input/>").attr({ type:'button', value:'Add Category',class:'btn btn-default btn-lg'})
                                                .click(function(){self.editorModel.menuCategory.addRecord.apply(self)
                });

                divEmptyPlaceholderContent.append("<img src='./images/menu_categories_blue.svg'></img><h2>No Categories</h2><p>There are no categories in the selected Menu<br/>Click 'Add Category' to create your first Category!</p>")
                                          .append(btnAdd);

                $("#kendoLVMenuCategory").append($("<div/>").attr("class","row div-norecords-placeholder").append(divEmptyPlaceholderContent));
                $("#kendoLVMenuCategory div:first-child").toggleClass('k-selectable');
            }

            else {
                
                $("#kendoLVMenuCategory .draggable").kendoDraggable({
                    
                    // filter: ".col-md-10>span",
                    hint: function(element) {
                        // var dragElement = element.next().clone();
                        var dragElement = element.parents('.trkListRow').clone();
                        
                        dragElement.addClass("dragged-content");
                        dragElement.find('.btn').hide(); //hide all buttons during drag
                        $(dragElement).css('min-width', $(element.parents('.trkListRow')).css('width'));
                        return dragElement;
                    }
                });
            };

            // if ( $('#appFooter').is(":visible") )
            //     desiredHeight = window.innerHeight - $('#kendoLVMenuCategory').offset().top - $('#appFooter').height() -20; //20 is the fudge factor
            // else 
            //     desiredHeight = window.innerHeight - $('#kendoLVMenuCategory').offset().top - 20; //

            // $('#kendoLVMenuCategory').css("max-height", desiredHeight );
            //setScrollingHeight(e.sender.element[0]);

            // }

        },

        selectMenuItem:function(e){
            $(e.currentTarget).toggleClass('k-state-selected');
        },

        onMenuItemsListViewDataBound: function(e) {

            var self=this;

            if(this.assignedMenuItems.data().length==0) {
                
                var divEmptyPlaceholderContent=$("<div/>").attr("class","col-md-12");
                var btnAdd=$("<input/>").attr({type:'button',value:'Add Item',class:'btn btn-default btn-lg'}).click(function(){self.editorModel.menuItem.addMenuItemRecord.apply(self)});

                divEmptyPlaceholderContent.append("<img src='./images/menu_items_blue.svg'></img><h2>No Items</h2><p>There are no Items in the selected Category<br/>Click <i>Assign Menu Item</i> above.</p>");


                $("#kendoLVAssignedMenuItems").append($("<div/>").attr("class","div-norecords-placeholder").append(divEmptyPlaceholderContent));
                $("#kendoLVAssignedMenuItems div:first-child").toggleClass('k-selectable');
            }

            else {
                $("#kendoLVAssignedMenuItems .draggable").kendoDraggable({
                    
                    // filter: ".col-md-10>span",
                    hint: function(element) {
                        //this is the category that is selected when the user STARTS the drag
                        // this is important in the case of menu item removal
                        self.itemDragCategory = self.menuCategories.get(menuModel.selectedMenuCategory);
                        // return element.next().clone().addClass("dragged-content");
                        var dragElement = element.parents('.trkListRow').clone();
                        
                        dragElement.addClass("dragged-content");
                        dragElement.find('.overridePricingBtnWrap').hide(); //hide all buttons during drag
                        // dragElement.find('.unAssignMenuItem').hide(); //hide all buttons during drag
                        // $(dragElement).css('min-width', element.clientWidth );
                        return dragElement;

                        //return element.clone().addClass("dragged-content");
                    }
                });
            };

            setScrollingHeight(e.sender.element[0]);
        },

        openTrucksView: function(e) {

            var link=$(e.target);

            e.preventDefault();
            appModel.modelParams={"objectId": link.data("objectId") };
            appRouter.navigate(appDefaults.routeNames.trucks+"/getParams");
        },


        editorModel: {
            menuOptionGroup:{
                "objectId" : null,
                "name": "",
                "legacy": false,
                "options":[],
                "isDirty": false,

                reset:function(){
                    this.set("objectId",null);
                    this.set("name","");
                    this.set("options",[]);
                    this.set("isDirty",false);
                    this.set("legacy",false);
                },

                addOption:function(e){
                    var that = this;
                    //we create a blank entry which is immediately reflected in the UI
                    // var nextId = this.editorModel.menuOptionGroup.options.length + 1;
                    var sortedArray = _.sortBy(this.editorModel.menuOptionGroup.options, 'id');
                    
                    var lastObject = _.last(sortedArray);
                    var nextId;
                    if (lastObject) 
                        nextId = lastObject.id + 1
                    else 
                        nextId = 1;


                    this.editorModel.menuOptionGroup.options.push({description:"",price:0, id:nextId});
                    this.editorModel.menuOptionGroup.set("isDirty",true);
                    editResizePanel();

                    $('#optionGroupItems').find('input[name=optionDesc]').last().focus();

                },
                deleteOption:function(e){
                    var that = this;

                    var newOptionsArray;
                    newOptionsArray = _.filter(that.editorModel.menuOptionGroup.options, function(item, idx){
                        if (e.data.uid === item.uid)
                            return false 
                        else 
                            return true;
                    });

                    that.editorModel.menuOptionGroup.set("options", newOptionsArray);
                    this.set("isDirty",true);
                   
                    editResizePanel();

                    
                },

                onMenuOptionGroupListViewDataBound:function(e){
                    setScrollingHeight(e.sender.element[0]);
                },

                onMenuItemOptionsGroupChange: function(e){
                   //set the dirty flag to true
                   this.editorModel.menuOptionGroup.set("isDirty",true);
                },

                addMenuItemOptionGroup:function(){
                    this.editorModel.menuOptionGroup.reset(); 
                    this.hideForms();
                    $("#frmMenuItemOptionGroup").show();
                    toggleEditor();
                },
                editMenuItemOptionsRecord:function(e){
                    var data = e.data;
                    if (data){

                        this.editorModel.menuOptionGroup.set("objectId",data.objectId);
                        this.editorModel.menuOptionGroup.set("name",data.name);
                        this.editorModel.menuOptionGroup.set("options",data.options);
                        this.editorModel.menuOptionGroup.set("legacy",data.legacy);
                        this.hideForms();
                        $("#frmMenuItemOptionGroup").show();
                        toggleEditor();
                    }
                },

                assignMenuItemOptionsToItems:function(e){
                    this.editorModel.menuItem.reset();
                    
                    var data = e.data;

                    if (data && data.legacy == true){
                        kendoNotification.show({title:"Legacy modifier",message: "Legacy modifier group can not be assigned to any menu item."},"info");
                        return false;
                    } else {
                        this.editorModel.menuOptionGroup.set("objectId",data.objectId);
                        this.editorModel.menuOptionGroup.set("name",data.name);
                        this.editorModel.menuOptionGroup.set("options",data.options);
                        this.editorModel.menuOptionGroup.set("legacy",false);
                    

                        var menuItemWindow = $('#gMenuItemOptionAssignPopup').kendoWindow({
                            title: "Select Menu Item to Assign",
                            modal: true,
                            open:function(){
                                var listView = $('#kendoLVOptionsAllMenuItems').data("kendoListView");
                                // refreshes the list view
                                //this was done as there seemed to be some (intermittent) scenarios
                                //where the uid associated in the list item did not correspond to a matching
                                //record in the data source. By doing this refresh that the data in the list 
                                //is directly correlated with the datasource data
                                listView.refresh();
                            },
                            close: function(){
                                //set any selected items to unselected
                                //we cant use clearSelection because we are handling the selection event manually
                                //so the user does not have to hold CTRL down while selecting
                                $('#gMenuItemOptionAssignPopup #kendoLVOptionsAllMenuItems').children('.k-state-selected').removeClass('k-state-selected')
                            }
                        }).data("kendoWindow");

                        menuItemWindow.open().center();
                        //use JQuery method scrollTop to ensure that the window is at the top
                        $('#gMenuItemOptionAssignPopup').scrollTop(0);  
                    };
                },

                onMenuItemOptionPopupAssign:function(e){
                    var listView = $('#kendoLVOptionsAllMenuItems').data("kendoListView");
                    var isDirty = false;
                    //1. Get all the selected menu items
                    //we cant call select() because we are handling the selection manually so the
                    //user doesnt need to hold the CTRL key when multi-selecting

                    var selectedElements = $('#gMenuItemOptionAssignPopup #kendoLVOptionsAllMenuItems').children('.k-state-selected');

                    var selectedItems = $.map(selectedElements, function (item){
                        var uid = $(item).attr("data-uid");
                        return e.data.allMenuItems.getByUid(uid);
                    });

                    //2. Get the option group 
                    var optionGroup = this.menuItemOptions.get(this.editorModel.menuOptionGroup.get("objectId"));
                    //check if the menu item all ready has the option group
                    _.each(selectedItems, function(aMenuItem){
                        var matchObject = _.find(aMenuItem.get("optionGroups"), {objectId: optionGroup.objectId});
                        if (matchObject)
                            kendoNotification.show({title:"Option Group all ready assigned",message: optionGroup.name + " all ready assigned to " + aMenuItem.name},"error");
                        else {
                            //assign the option group with default settings
                            if (!aMenuItem.optionGroups)
                                aMenuItem.set("optionGroups", []);

                            aMenuItem.optionGroups.push({amount: 0, defaultValues: [], numberFree: 0, objectId: optionGroup.objectId});
                            isDirty = true;
                        };
                    });

                    //now synch the menu items with the back end\
                    if (isDirty)
                        $.when(menuModel.allMenuItems.sync())
                        .then(function(){
                            kendoNotification.show({title:"Assignment successful",message: optionGroup.name + " assigned to selected menu item(s) "},"success");
                            $("#gMenuItemOptionAssignPopup").data("kendoWindow").close();
                        });
                },

                onMenuItemOptionPopupCancel:function(e){
                    $("#gMenuItemOptionAssignPopup").data("kendoWindow").close();
                },

                cancelSaveMenuOptionsGroup: function(e){
                    this.menuOptionsGroupValidator.hideMessages();
                    toggleEditor();
                },

                deleteMenuOptionsGroup:function(e){
                    e.preventDefault();
                    var self=this;

                    var delMenuOptionsGroup = self.editorModel.menuOptionGroup;

                    $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete <span class='badge alert-danger'>"+delMenuOptionsGroup.name+"</span>",icon:"k-ext-warning" }))
                        .then(function (response) {
                            if(response.button=="Yes") {
                                var dataItem = self.get("menuItemOptions").get(delMenuOptionsGroup.objectId);
                                self.get("menuItemOptions").remove(dataItem);
                        
                                $.when(self.get("menuItemOptions").sync()).then(function() {
                                   kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success"); 
                                   
                                    toggleEditor();
                                })
                            }

                            },

                            //error
                            function(){
                                kendoNotification.show(appDefaults.notificationMessages.deleteError,"error");
                                $.when( self.get("menuItemOptions").read() )
                                .then(function(){
                             
                                });

                            });                    
                },
                saveMenuOptionsGroup:function(e){

                //clear any currently displayed errors
                this.menuOptionsGroupValidator.hideMessages();

                if(this.menuOptionsGroupValidator.validate()==false){
                    //for some reason the span that shows the error message
                    //is hidden (could be a kendo bug)
                    //so as a work around we force display them
                    $('span[data-for=optionDesc]').show();
                    return;
                };

                    var data = {};
                    data.objectId = this.editorModel.menuOptionGroup.objectId;
                    data.name = this.editorModel.menuOptionGroup.name;
                    data.options = this.editorModel.menuOptionGroup.options;
                    data.legacy = false;

                    if (!data.objectId)
                        this.get("menuItemOptions").add(data);
                    else{
                        var menuOptionsGroup = this.get("menuItemOptions").get(data.objectId);
                        menuOptionsGroup.set("name", data.name);
                        menuOptionsGroup.set("options", data.options);
                        //if the dirty flag has been set on the editor then force it to TRUR
                        //on the item
                        if (this.editorModel.menuOptionGroup.get("isDirty"))
                            menuOptionsGroup.dirty = true;
                    }


                        
                    $.when(this.get("menuItemOptions").sync())
                    .then(function(){
                        kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");
                    }, function(error){
                            var jsonResult = JSON.parse(error);
                            var messsageObject = {"title":"Error saving new Menu Options", "message": jsonResult.message }; 
                            kendoNotification.show(messsageObject,"error");                        
                    }).always(function(){
                        toggleEditor();
                    });
                }
            },

            menuHeader: {

                "objectId" : null,
                "name": "",
                "addType" : "0",
                "isBulk": false,
                "minOrderAmt":0,
                "minOrderNotice":0,
                "copyOverridePricing":false,
                

                getDescriptionWithTrucks: function(data) {
                    var retString=data.name;
                    var truckData=this.parent().parent().truckList.data();

                    for(var i=0;i<truckData.length;i++) {
                        if (truckData[i].currentMenu && data.objectId==truckData[i].currentMenu.objectId) {
                            retString+=" <a href='#' class='link-page' data-bind='click:openTrucksView' data-id="+ truckData[i].objectId + ">"+truckData[i].name+"</a>"
                        }
                    }

                    return retString;

                },

                setupMenuHeaderToggleButtons: function(e){
                    if (this.get("isBulk")){
                        $('#bulkMenuOn').addClass('active btn-primary');
                        $('#bulkMenuOff').removeClass('active btn-primary');
                    } else {
                        $('#bulkMenuOff').addClass('active btn-primary');
                        $('#bulkMenuOn').removeClass('active btn-primary');
                    };
                },


                toggleIsBulkMenu:function(){
                    this.editorModel.menuHeader.set("isBulk", !this.editorModel.menuHeader.get("isBulk"));
                    this.editorModel.menuHeader.setupMenuHeaderToggleButtons();
                },

                isNewMenu: function(){
                    return this.get("addType")=="0"? true: false;
                },


                reset: function() {
                    this.set("objectId",null);
                    this.set("name","");
                    this.set("addType","0");
                    this.set("minOrderAmt",0);
                    this.set("minOrderNotice",0);
                    this.set("copyOverridePricing",false);

                    this.setupMenuHeaderToggleButtons();
                },

                addMenuHeaderRecord: function(e) {
                    this.editorModel.menuHeader.reset(); 
                    this.hideForms();
                    
                    this.editorModel.menuHeader.setupMenuHeaderToggleButtons();

                    $("#frmMenuHeaderRecordEdit").show();
                    $("#divAddType").show();
                    toggleEditor();
                },

                editMenuHeaderRecord: function(e) {
                    var data = menuModel.get("menuHeaders").get(e.data.selectedMenuHeader);
                    if (data){
                        this.editorModel.menuHeader.set("objectId",data.objectId);
                        this.editorModel.menuHeader.set("name",data.name);
                        this.editorModel.menuHeader.set("isBulk",data.isBulk);
                        this.editorModel.menuHeader.set("minOrderAmt",data.minOrderAmt);
                        this.editorModel.menuHeader.set("minOrderNotice",data.minOrderNotice);
                        this.set("editorModel.menuHeader.addType","0");
                        this.hideForms();

                        this.editorModel.menuHeader.setupMenuHeaderToggleButtons();


                        $("#frmMenuHeaderRecordEdit").show();
                        $("#divAddType").hide();
                        toggleEditor();
                    } else {
                        var messsageObject = {"title":"Select Menu", "message": 'Please select a menu first.'}; 
                        kendoNotification.show(messsageObject,"info");
                        var dropdownlist = $("#lstMenues").data("kendoDropDownList");
                        dropdownlist.focus();
                    }

                },

                saveMenuHeaderRecord: function(e) {

                    var self=this;
                    var btnSave=$(e.target);

                    if(this.editorModel.menuHeader.addType=="0") {

                         if(this.menuHeaderValidator.validate()==false){
                            return;
                         }

                        btnSave.button("loading");

                        if (this.editorModel.menuHeader.objectId!=null) {
                            var dataItem = this.get("menuHeaders").get(this.editorModel.menuHeader.objectId);
                            $.extend(dataItem,this.editorModel.menuHeader);
                            dataItem.dirty=true;
                            
                        }

                        else {
                            var aMenu = this.editorModel.menuHeader.toJSON();
                            this.get("menuHeaders").add(aMenu);
                            
                        }

                    }

                    else {
                            var selectedMenuHeader=null;
                            
                            if(!$("#lstMenuHeaderSelect").data("kendoDropDownList").value()) return;

                            btnSave.button("loading");

                            selectedMenuHeader=$("#lstMenuHeaderSelect").data("kendoDropDownList").value();
                            var dataItem = this.get("menuHeaders").get(selectedMenuHeader).toJSON();
                            dataItem.name="Copy of "+ dataItem.name;
                            dataItem.copyID=dataItem.objectId;
                            dataItem.objectId=null;
                            dataItem.isCopy=true;
                            dataItem.copyOverridePricing = this.editorModel.menuHeader.copyOverridePricing;
                            this.get("menuHeaders").add(dataItem);
                            
                    }

                    $.when(this.get("menuHeaders").sync()).then(

                        function(result) {
                            kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");

                            //select if add record
                            if(self.editorModel.menuHeader.objectId==null) {
                                var dropdownlist = $("#lstMenues").data("kendoDropDownList");
                                dropdownlist.select(menuModel.menuHeaders.data().length);
                                //calling Select does not trigger the change event so we need to do this manually
                                dropdownlist.trigger("change"); //this will trigger change event

                            }
                        },  

                        function(result){
                            
                            var jsonResult = JSON.parse(result);
                            var messsageObject = {"title":"Error saving new menu header", "message": jsonResult.message }; 
                            kendoNotification.show(messsageObject,"error");

                            // $("#paneMenuHeader").removeClass().addClass("col-md-12");
                            $("#paneMenuCategory").hide();
                            $("#paneMenuItem").hide();
                            self.menuHeaders.read();
                        }

                        ).always(function(){
                            toggleEditor();
                            btnSave.button("reset");

                        });

                },

                cancelSaveMenuHeaderRecord: function(e) {
                    this.menuHeaderValidator.hideMessages();
                    toggleEditor();
                },

                deleteMenuHeaderRecord: function(e){
                    e.preventDefault();
                    var self=this;

                    var delMenuHeader = self.editorModel.menuHeader;

                    $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete <span class='badge alert-danger'>"+delMenuHeader.name+"</span>",icon:"k-ext-warning" }))
                        .then(function (response) {
                            if(response.button=="Yes") {
                                var dataItem = self.get("menuHeaders").get(delMenuHeader.objectId);
                                self.get("menuHeaders").remove(dataItem);
                        
                                $.when(self.get("menuHeaders").sync()).then(function() {
                                   kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success"); 
                                   
                                   // select the first item if there is one
                                   if(self.menuHeaders.data().length) {
                                        var dropdownlist = $("#lstMenues").data("kendoDropDownList");
                                        dropdownlist.select(0);
                                        //calling Select does not trigger the change event so we need to do this manually
                                        dropdownlist.trigger("change"); //this will trigger change event
                                    } else {
                                        self.set("selectedMenuHeader","0");
                                        // $("#paneMenuHeader").removeClass().addClass("col-md-12");
                                        $("#paneMenuCategory").hide();
                                        $("#paneMenuItem").hide();

                                    };
                                    toggleEditor();
                                })
                            }

                            },

                            //error
                            function(){
                                kendoNotification.show(appDefaults.notificationMessages.deleteError,"error");
                                $.when( self.menuHeaders.read() )
                                .then(function(){
                                    self.set("selectedMenuHeader","0");
                                    // $("#paneMenuHeader").removeClass().addClass("col-md-12");
                                    $("#paneMenuCategory").hide();
                                    $("#paneMenuItem").hide();                                    
                                });

                            });
                },

                onMenuHeaderChange: function(e) {
                    
                    // var data = this.get("menuHeaders").view(),


                    selectedMenu = this.menuHeaders.get(e.sender.value());

                    // selected = $.map($("#kendoLVMenuHeader").data("kendoListView").select(), function(item) {
                    //     return data[$(item).index()].objectId;
                    // });
                    if (selectedMenu){
                        if(this.get("selectedMenuHeader")==selectedMenu.objectId)
                            return

                        this.set("selectedMenuCategory","0");
                        this.set("selectedMenuHeader",selectedMenu.objectId);     // set the selected menu header

                        $.when( this.get("menuCategories").read({"menuHeader":{"__type":"Pointer", "className":"MenuHeader","objectId":selectedMenu.objectId}}) )
                        .then(function(){
                            // show the divs
                            $("#paneMenuCategory").show();
                            $("#paneMenuItem").hide();

                            setScrollingHeight('#kendoLVMenuCategory'); //calculate height of list view so that we can scroll in place                   
                        });                        
                    } else {
                        $("#paneMenuCategory").hide();
                        $("#paneMenuItem").hide();
                        this.set("selectedMenuHeader",0);
                        this.set("selectedMenuCategory","0");
                    };



                }

            },

            menuCategory: {
                "objectId" : null,
                "name": "",
                "visible": false,
                "displayOrder":0,
                // addCategoryDisabled: false,
                
                reset: function() {
                    this.set("objectId",null);
                    this.set("name","");
                    this.set("visible",true);
                    this.set("displayOrder",0);
                },

                addRecord: function(e) {
                    this.editorModel.menuCategory.reset();
                    this.editorModel.displayOrder=this.menuCategories.data().length+1;
                    this.hideForms();
                    $("#frmMenuCategoryRecordEdit").show();
                    toggleEditor();
                },

                editRecord: function(e) {
                    this.editorModel.menuCategory.set("objectId",e.data.objectId);
                    this.editorModel.menuCategory.set("name",e.data.name);
                    this.editorModel.menuCategory.set("description",e.data.description);
                    this.editorModel.menuCategory.set("visible",e.data.visible);
                    this.editorModel.menuCategory.set("displayOrder",e.data.displayOrder);
                    this.hideForms();
                    $("#frmMenuCategoryRecordEdit").show();
                    toggleEditor();
                },

                saveMenuCategoryRecord: function(e) {

                    var self=this;
                    var btnSave=$(e.target);
                    

                    // validate
                     if(this.menuCategoryValidator.validate()==false){
                        return;
                     };

                    var isSaveAndNew = btnSave.parent('button').attr("data-saveAndNew");

                    btnSave.button("loading");

                    if (this.editorModel.menuCategory.objectId!=null) {
                        var dataItem = this.get("menuCategories").get(this.editorModel.menuCategory.objectId);
                        $.extend(dataItem,this.editorModel.menuCategory);
                        dataItem.dirty=true;
                        
                    }

                    else {
                        // var dataObj = {
                        //                 menuCategory: this.editorModel.menuCategory.toJSON(),
                        //                 menuHeader: menuModel.get("selectedMenuHeader")
                        //             };
                        var dataObj = this.editorModel.menuCategory.toJSON();
                        dataObj.menuHeader = menuModel.get("selectedMenuHeader");

                        //if no display order has been set then default this as the last item
                        if (dataObj.displayOrder == 0){
                            dataObj.displayOrder = this.menuCategories.data().length+1;
                        };

                        // this.get("menuCategories").add(this.editorModel.menuCategory.toJSON());
                        this.get("menuCategories").add(dataObj);
                        
                    }


                    $.when(this.get("menuCategories").sync()).then(function(result) {
                            kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");

                            //select if add record
                            if(self.editorModel.menuCategory.objectId==null) {
                                var listView = $("#kendoLVMenuCategory").data("kendoListView");
                                listView.select(listView.element.children().last());
                            }
                        }, function(result){
                            kendoNotification.show(appDefaults.notificationMessages.saveError,"error");
                            // $("#paneMenuHeader").removeClass().addClass("col-md-6");
                            // $("#paneMenuCategory").removeClass().addClass("col-md-4");
                            $("#paneMenuItem").hide();
                            self.get("menuCategories").read({"menuHeader":{"__type":"Pointer", "className":"MenuHeader","objectId":self.selectedMenuHeader}});
                        }).always(function(){
                            
                            if( isSaveAndNew == "true" )
                                self.editorModel.menuCategory.reset();
                            else
                                toggleEditor();
                            
                            btnSave.button("reset");

                    });

                },

                cancelSaveRecord: function(e) {
                    this.menuCategoryValidator.hideMessages();
                    toggleEditor();
                },

                deleteRecord: function(e){
                    e.preventDefault();
                    var self=this;
                    var delMenuCategory = this.editorModel.menuCategory;

                   $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete <span class='badge alert-danger'>"+delMenuCategory.name+"</span>",icon:"k-ext-warning" }))
                        .then(function (response) {
                            if(response.button=="Yes") {
                                var dataItem = self.get("menuCategories").get(delMenuCategory.objectId);
                                self.get("menuCategories").remove(dataItem);
                        
                                $.when(self.get("menuCategories").sync()).then(function() {
                                   kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success");

                                    // select the first item if there is one
                                   if(self.menuCategories.data().length) {
                                        var listView = $("#kendoLVMenuCategory").data("kendoListView");
                                        listView.select(listView.element.children().first());
                                    } else {
                                        self.set("selectedMenuCategory","0");
                                        // $("#paneMenuHeader").removeClass().addClass("col-md-6");
                                        // $("#paneMenuCategory").removeClass().addClass("col-md-6");
                                        $("#paneMenuItem").hide();
                                    };
                                    //close the editor
                                    toggleEditor();
                                    
                                })
                            }

                        },

                        //error
                        function(){
                            kendoNotification.show(appDefaults.notificationMessages.deleteError,"error");
                            // $("#paneMenuHeader").removeClass().addClass("col-md-6");
                            // $("#paneMenuCategory").removeClass().addClass("col-md-6");
                            $("#paneMenuItem").hide();
                            self.get("menuCategories").read({"menuObj":{"__type":"Pointer", "className":"menuHeader","objectId":delMenuCategory.objectId}});
                        });

                },

                onMenuCategoryChange: function(e) {

                    var data = this.get("menuCategories").view(),
                    
                    selected = $.map($("#kendoLVMenuCategory").data("kendoListView").select(), function(item) {
                        return data[$(item).index()].objectId;
                    });

                    if(this.get("selectedMenuCategory")==selected[0])
                        return

                    this.set("selectedMenuCategory",selected[0]);     // set the selected menu category

                    $.when ( this.get("assignedMenuItems").read({"menuCategory":{"__type":"Pointer","className":"MenuCategory","objectId":selected[0]}}) )
                    .then(function(){
                        // $("#paneMenuHeader").removeClass().addClass("col-md-4");
                        // $("#paneMenuCategory").removeClass().addClass("col-md-4");
                        // $("#paneMenuItem").removeClass().addClass("col-xs-6").show();
                        $("#paneMenuItem").show();
                        setScrollingHeight($('#kendoLVAssignedMenuItems'));                     
                    });
                    

                },

                hidePanel: function(e) {
                    e.preventDefault();
                    // $("#paneMenuHeader").removeClass().addClass("col-md-12");
                    $("#paneMenuCategory").hide();
                    $("#paneMenuItem").hide();
                    menuModel.selectedMenuCategory = null;

                }
            },

            menuItem:{
                "objectId" : null,
                "name": "",
                "onlineOrderingAvailable":true,
                "description": "",
                "minTotalOrderAmount":null,
                "selectedOptionsGroup":null,
                "optionGroups": [],
                copyFromList:function(){
                    return new kendo.data.DataSource({
                        data: menuModel.get("allMenuItems").data(),
                        sort:{field:"name", dir:"asc"}
                    }); 
                },
                "assignedTo": MenuCategoryDataSource(appModel),
                menuItemPrices:{
                    setOverrideData: false,
                    prices:[],
                    overridePricing:[],
                    add:function(){
                        //we create a blank entry which is immediately reflected in the UI
                        if (!this.editorModel.menuItem.menuItemPrices.get("setOverrideData"))
                            this.editorModel.menuItem.menuItemPrices.prices.push({text:"",price:null});
                        else
                            this.editorModel.menuItem.menuItemPrices.overridePricing.push({text:"",price:null});
                        
                        editResizePanel();

                    },
                    delete:function(e){
                        var that = this;
                        if (!this.parent().menuItemPrices.get("setOverrideData")){
                            var newPriceArray;
                            newPriceArray = _.filter(that.prices, function(item, idx){
                                if (e.data.uid === item.uid)
                                    return false 
                                else 
                                    return true;
                            }); 
                            this.set("prices", newPriceArray);

                        } else {
                            var newPriceArray;
                            newPriceArray = _.filter(that.overridePricing, function(item, idx){
                                if (e.data.uid === item.uid)
                                    return false 
                                else 
                                    return true;
                            });

                            this.set("overridePricing", newPriceArray);
                        };

                        editResizePanel();

                        
                    },
                },

                menuItemOptionsAssignmentDelete:function(e){
                    // console.log(e);
                    var self=this;
                    $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete <span class='badge alert-danger'>"+e.data.name+"</span>",icon:"k-ext-warning" }))
                    .then(function (response) {
                        if (response.button=="Yes"){
                            newArray = _.without(self.editorModel.menuItem.get("optionGroups"), _.find(self.editorModel.menuItem.get("optionGroups"), {objectId: e.data.objectId}));
                            self.editorModel.menuItem.set("optionGroups", newArray);
                        }
                    });
                },

                menuItemOptionsAssignmentAdd:function(e){
                    //1. Get the currently selected options Group
                    var optionsGroupObject = this.editorModel.menuItem.get("selectedOptionsGroup");
                    if (!optionsGroupObject)
                        return;

                    //check if we have all ready added this group to this menu item
                    var tempOptionsGroup = _.find(this.editorModel.menuItem.get("optionGroups"), {objectId: optionsGroupObject.objectId});
                    if (tempOptionsGroup){
                        kendoNotification.show({title:"Modifier group all ready assigned ",message: 'Modifiers groups all ready assigned to menu item'},"error");
                        return;
                    };

                    if (optionsGroupObject){
                        if (optionsGroupObject.legacy == true){
                            kendoNotification.show({title:"Legacy ",message: 'Legacy modifiers can not be used. Please create a new modifier group'},"error");
                            return;
                        } else
                            this.editorModel.menuItem.get("optionGroups").push({    objectId:optionsGroupObject.objectId, 
                                                                                amount:0,
                                                                                numberFree: 0,
                                                                                maxAmount:0,
                                                                                name:optionsGroupObject.name,
                                                                                options: optionsGroupObject.options.slice(0)
                                                                        }); //default to 0 required

                    }

                },

                toggleMenuItemOrdering:function(e){
                    var isAvailalbe = this.editorModel.menuItem.get("onlineOrderingAvailable");
                    this.editorModel.menuItem.set("onlineOrderingAvailable", !isAvailalbe);

                    this.editorModel.menuItem.setupMenuItemToggleButtons();
      
                },

                toggleTaxExempt:function(e){
                    var isExempt = this.editorModel.menuItem.get("globalTaxExempt");
                    this.editorModel.menuItem.set("globalTaxExempt", !isExempt);

                    this.editorModel.menuItem.setupMenuItemToggleButtons(); 
                },

                togglePrintToKT:function(e){
                    var printToKT = this.editorModel.menuItem.get("printToKT");
                    this.editorModel.menuItem.set("printToKT", !printToKT);

                    this.editorModel.menuItem.setupMenuItemToggleButtons(); 
                },

                toggleShowOnDigitalBoard:function(e){
                    var showOnDigitalBoard = this.editorModel.menuItem.get("showOnDigitalBoard");
                    this.editorModel.menuItem.set("showOnDigitalBoard", !showOnDigitalBoard);

                    this.editorModel.menuItem.setupMenuItemToggleButtons();   
                },

                setupMenuItemToggleButtons: function(e){
                    if (this.get("onlineOrderingAvailable")){
                        $('#menuItemOrderingOn').addClass('active btn-primary');
                        $('#menuItemOrderingOff').removeClass('active btn-primary');
                    } else {
                        $('#menuItemOrderingOff').addClass('active btn-primary');
                        $('#menuItemOrderingOn').removeClass('active btn-primary');
                    };

                    if (this.get("globalTaxExempt") === true){
                        $('#globalTaxYes').addClass('active btn-primary');
                        $('#globalTaxNo').removeClass('active btn-primary');
                    } else {
                        $('#globalTaxNo').addClass('active btn-primary');
                        $('#globalTaxYes').removeClass('active btn-primary');
                    };

                    if (this.get("printToKT") === true){
                        $('#printToKTYes').addClass('active btn-primary');
                        $('#printToKTNo').removeClass('active btn-primary');
                    } else {
                        $('#printToKTNo').addClass('active btn-primary');
                        $('#printToKTYes').removeClass('active btn-primary');
                    };

                    if (this.get("showOnDigitalBoard") === true){
                        $('#showOnDigitalBoardYes').addClass('active btn-primary');
                        $('#showOnDigitalBoardNo').removeClass('active btn-primary');
                    } else {
                        $('#showOnDigitalBoardNo').addClass('active btn-primary');
                        $('#showOnDigitalBoardYes').removeClass('active btn-primary');
                    };

                },

                addItemToCategory : function(targetCategoryObject, menuItem){

                    var promise = new Parse.Promise();

                    //should NEVER happen
                    if (!targetCategoryObject || !menuItem){

                        kendoNotification.show({title:"Menu Item Not Added",message: "Unexpected error. Category or Menu Item could not be found."},"error");
                        promise.reject();
                    } else {

                        var aDisplayOrder = 1;
                        var allReadyAssigned = false;
                        
                        if ( menuModel.assignedMenuItems.get(menuItem.get("objectId")) )
                            allReadyAssigned = true;

                        if (allReadyAssigned == false){
                            //we are going to assign the menu item to the category that was passed in

                            var targetMenuItem = null;

                            menuItem.set("displayOrder", menuModel.assignedMenuItems.data().length+1);
                            menuItem.set("menuCategory",  {__type:"Pointer", className:"MenuCategory", objectId:targetCategoryObject.get("objectId")} );
                            menuItem.set("onlineOrderingAvailable", true); //default to true
                            menuItem.set("hasOverridePricing", false); //default to true
                            //manually set the dirty flag
                            menuItem.dirty =  true;

                            menuModel.assignedMenuItems.add(menuItem);
                                                      
                            $.when(menuModel.assignedMenuItems.sync()) //update assigned menu items
                            .then(function(){
                                menuModel.assignedMenuItems.sort({field:"displayOrder", dir:"asc"});//force a sort with the new values specified on
                                kendoNotification.show({title:"Menu Item Added",message: menuItem.get("name") + " added to selected Menu"},"success");
                                promise.resolve();
                            }, function(error){
                                console.log('Error: ' + JSON.stringify(error));
                                menuModel.assignedMenuItems.pushDestroy(menuItem); //put the item back in
                                kendoNotification.show({title:"Menu Item Added",message: "Unexpected error. " + menuItem.get("name") + " not added"},"error");
                                promise.reject();
                            });
                        } else {
                            kendoNotification.show({title:"Item not assigned",message: menuItem.get("name") + " is all ready assigned to this category"},"error");
                            promise.reject();
                        };                        
                    }

                    return promise;
                },


                //remove item from category          
                removeItemFromCategory : function(e){
                    //1. Determine the currently selected category
                    var itemDeleted = false;

                    // var menuCategoryList = $("#kendoLVMenuCategory").data("kendoListView");

                    var currentCategoryObject = menuModel.menuCategories.get(menuModel.selectedMenuCategory);
                    // var menuItem = menuModel.assignedMenuItems.get( e.data.id );

                     $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Remove <span class='badge alert-danger'>"
                        +e.data.name+"</span>?",icon:"k-ext-warning" }))
                    .then(function (response) {
                        //e.data contains the menu item associated with the click
                        if (response.button == "Yes"){
                            console.log('display order for item is ' + e.data.displayOrder);
                            menuModel.assignedMenuItems.remove(e.data);
                            $.when(menuModel.assignedMenuItems.sync())
                            .then(function(){
                                //set the displayOrder on the menuItem back to zero since it is no longer
                                //assigned to this category
                                
                                //reload all the items from the server since their display Order has been updated on the
                                //server.
                                var menuCategoryPointer = appModel.getParsePointer({objectId:currentCategoryObject.id}, "MenuCategory");
                                $.when(menuModel.assignedMenuItems.read({menuCategory:menuCategoryPointer}))
                                .then(function(){
                                    var itemInAllItemsList = menuModel.allMenuItems.get(e.data.id);
                                    var isDirty = itemInAllItemsList.dirty;
                                    itemInAllItemsList.set("displayOrder", 0);
                                    //set the dirty flag back to what it was before the displayOrder update
                                    //because we dont want the displayOrder update to trigger a server synch
                                    //could use pushUpdate instead but this was giving some sort of template syntax error
                                    //hence this workaround
                                    itemInAllItemsList.dirty = isDirty;
                                    kendoNotification.show({title:"Menu Item Removed",message: e.data.name + " removed from selected menu"},"success");
                                });

                            }, function(error){
                                console.log('Error: ' + JSON.stringify(error));
                                menuModel.assignedMenuItems.cancelChanges();
                                // menuModel.assignedMenuItems.pushCreate(e.data); //put the item back in
                                kendoNotification.show({title:"Menu Item not Removed",message: "Unexpected error. Item not removed"},"error");
                            });                        
                        };           
                    });
                },

                menuItemModifiers:{
                    modifiers: [],

                    add: function() {
                        this.editorModel.menuItem.menuItemModifiers.modifiers.push({"modifierText":"","cost":0});
                    },
                    
                    delete: function (e) {
                        var that = this;        
                        // $.each(that.modifiers, function(idx, item) {
                        //     if (e.data.uid === item.uid) {
                        //         that.modifiers.splice(idx, 1);
                        //         return true;
                        //     }
                        // });
                        var newModifierArray;
                        newModifierArray = _.filter(that.modifiers, function(item, idx){
                            if (e.data.uid === item.uid)
                                return false 
                            else 
                                return true;
                        });

                        that.set("modifiers", newModifierArray);

                    }
                },

                taxes:[],

                picture:null,

                displayOrder:0,
                copyFromMenuItem:null,
                
                reset: function() {

                    //make the first tab strip active
                    var tabstrip = $("#menuItemTabStrip").data("kendoTabStrip");
                    if (tabstrip)
                        tabstrip.select(0);

                    this.set("objectId",null);
                    this.set("description","");
                    this.set("name","");
                    this.set("copyFromMenuItem", null);
                    this.set("minTotalOrderAmount", null);
                    //this.set("price",0);
                    this.set("menuItemModifiers.modifiers",[]);
                    this.set("menuItemPrices.prices",[]);
                    this.set("menuItemPrices.overridePricing",[]);
                    this.set("selectedOptionsGroup",null);
                    this.set("optionGroups", []);
                    this.setTaxData([]);
                    this.set("onlineOrderingAvailable",true); //default to true
                    this.set("picture",null);
                    this.set("menuItemImage",null);
                    this.set("displayOrder",0);
                    this.set("globalTaxExempt", false);
                    this.set("printToKT", true);

                    this.set("showOnDigitalBoard", true);

                    //if an image has been loaded, clear it out
                    $(".div-item-image img").attr("src", this.getImageUrl({})); //this should set the image back to no_image.gif
                    $('.div-item-image input:file').val("");
                    
                },

                onCopyFromMenuItemSelect:function(e){
                    console.log(e);
                    console.log(e.data.editorModel.menuItem.copyFromMenuItem);

                    // var jsonMenuItem = this.copyFromMenuItem.toJSON();
                    // jsonMenuItem.name = 'Copy of ' + jsonMenuItem.name;

                    // this.editorModel.menuItem.editMenuItemRecord({data:jsonMenuItem});
                    var cloneMenuItem = new kendo.data.ObservableObject(e.data.editorModel.menuItem.copyFromMenuItem.toJSON());
                    cloneMenuItem.set("name", 'Copy of ' + cloneMenuItem.get("name"));
                    //delete the objectId
                    cloneMenuItem.set("objectId", null);

                    this.editorModel.menuItem.editMenuItemRecord.apply(this, [{data:cloneMenuItem}, true])
                },

                isCopyFromVisible:function(){
                    if (this.get("objectId"))
                        return false
                    else
                        return true;
                },

                onAddMenuItemToCatClick:function(e){

                    this.editorModel.menuItem.reset();

                    var menuItemWindow = $('#gMenuItemPopup').kendoWindow({
                        title: "Select Menu Item to Assign",
                        modal: true,
                        width:"75%",
                        close: function(){
                            //set any selected items to unselected
                            //we cant use clearSelection because we are handling the selection event manually
                            //so the user does not have to hold CTRL down while selecting
                            $('#gMenuItemPopup #kendoLVAllMenuItems').children('.k-state-selected').removeClass('k-state-selected')
                        },
                        open:function(){
                            //clear out the search field
                            $('#inputSearchMenuItems').val("");
                            //clear out any fileters on the data source
                            menuModel.get("allMenuItems").filter({});  
                        },
                        resizable: false,
                    }).data("kendoWindow");

                    menuItemWindow.open().center();
                    //use JQuery method scrollTop to ensure that the window is at the top
                    $('#gMenuItemPopup').scrollTop(0);          
                },

                onMenuItemAssignmentShow:function(e){
                    console.log(e);
                },
                onPopupMenuItemSelect: function(event){
                    var listView = $('#kendoLVAllMenuItems').data("kendoListView");

                    //1. Get all the selected menu items
                    //we cant call select() because we are handling the selection manually so the
                    //user doesnt need to hold the CTRL key when multi-selecting

                    var selectedElements = $('#gMenuItemPopup #kendoLVAllMenuItems').children('.k-state-selected');

                    var selectedItems = $.map(selectedElements, function (item){
                        var uid = $(item).attr("data-uid");
                        return event.data.allMenuItems.getByUid(uid);
                    });

                    //2. Get the selected category
                    var targetCategoryObject = menuModel.menuCategories.get(menuModel.selectedMenuCategory);

                    //3. Assign each menu item in series
                    Parse.Promise.as().then(function(){

                        var promise = Parse.Promise.as();
                        _.each(selectedItems, function(selectedMenuItem){
                            promise = promise.then(function(){
                                return menuModel.editorModel.menuItem.addItemToCategory(targetCategoryObject, selectedMenuItem);
                            });
                        });
                        return promise;                     
                    // }).then(function(){
                    //     $("#gMenuItemPopup").data("kendoWindow").close();                        
                    });
                },

                onPopupMenuItemCancel: function(event){
                    //this method is expected to be overriden if required

                    $("#gMenuItemPopup").data("kendoWindow").close();
                },

                onMenuItemListViewDataBound:function(e){
                    setScrollingHeight(e.sender.element[0]);
                },

                addMenuItemRecord: function(e) {
                    this.editorModel.menuItem.reset();
                    this.editorModel.menuItem.setupMenuItemToggleButtons();

                    this.editorModel.displayOrder=this.assignedMenuItems.data().length+1;
                    // $(".div-item-image img").attr("src", this.editorModel.menuItem.getImage(this.editorModel.menuItem));
                    this.hideForms();
                    $('.div-item-image input:file').val("");
                    $("#frmMenuItemRecordEdit").show();
                    toggleEditor();

                },


                editMenuItemRecord: function(e, noEditorToggle) {

                    //make the first tab strip active
                    var tabstrip = $("#menuItemTabStrip").data("kendoTabStrip");
                    if (tabstrip)
                        tabstrip.select(0);

                    this.editorModel.menuItem.set("objectId",e.data.objectId);
                    this.editorModel.menuItem.set("description",e.data.description);
                    this.editorModel.menuItem.set("name",e.data.name);
                    this.editorModel.menuItem.set("minTotalOrderAmount", e.data.minTotalOrderAmount);
                    this.editorModel.menuItem.set("globalTaxExempt",e.data.globalTaxExempt);
                    this.editorModel.menuItem.set("printToKT",e.data.printToKT);
                    this.editorModel.menuItem.set("showOnDigitalBoard",e.data.showOnDigitalBoard);
                    
                    //this.editorModel.menuItem.set("price",e.data.price);
                    this.editorModel.menuItem.menuItemModifiers.set("modifiers",e.data.modifiers.toJSON());
                    
                    if (e.data.prices)
                        this.editorModel.menuItem.menuItemPrices.set("prices",e.data.prices.toJSON());
                            else
                             this.editorModel.menuItem.menuItemPrices.set("prices",[]);

                    this.editorModel.menuItem.setTaxData(e.data.taxes.toJSON());
                    
                    // if (!e.data.menuItemImage){
                    if (e.data.menuItemImage)
                        this.editorModel.menuItem.set("menuItemImage",e.data.menuItemImage );
                    else 
                        this.editorModel.menuItem.set("menuItemImage", null);

                    this.editorModel.menuItem.set("displayOrder",e.data.displayOrder);
                    if (!e.data.optionGroups)
                        e.data.optionGroups = [];

                    _.each(e.data.optionGroups, function(assignedOptionGroup){
                        masterRecord = _.find(menuModel.get("menuItemOptions").data(), {objectId:assignedOptionGroup.objectId});
                        if (masterRecord){
                            assignedOptionGroup.name = masterRecord.name;
                            //if no max amount is assigned, then default zero
                            if (!assignedOptionGroup.maxAmount && assignedOptionGroup.maxAmount != 0)
                                assignedOptionGroup.maxAmount = 0;

                            //copy the options over too
                            assignedOptionGroup.options = masterRecord.options.slice(0);
                        }
                    });

                    this.editorModel.menuItem.set("optionGroups",e.data.optionGroups);

                    //update the preview image
                    $(".div-item-image img").attr("src", this.editorModel.menuItem.getImageUrl(e.data));

                    $('.div-item-image input:file').val("");
                    
                    this.editorModel.menuItem.setupMenuItemToggleButtons();

                    if (!noEditorToggle){
                        this.hideForms();
                        $("#frmMenuItemRecordEdit").show();
                        toggleEditor();
                        editResizePanel();                        
                    }

                },

                editMenuItemOverrideRecord: function(e) {

                    //make the first tab strip active
                    var tabstrip = $("#menuItemTabStrip").data("kendoTabStrip");
                    if (tabstrip)
                        tabstrip.select(0);
                    
                    this.editorModel.menuItem.set("objectId",e.data.objectId);
                    this.editorModel.menuItem.set("description",e.data.description);
                    this.editorModel.menuItem.set("name",e.data.name);
                    this.editorModel.menuItem.set("onlineOrderingAvailable",e.data.onlineOrderingAvailable);
                    this.editorModel.menuItem.menuItemPrices.set("setOverrideData", true);
                    //this.editorModel.menuItem.set("price",e.data.price);
                    this.editorModel.menuItem.menuItemModifiers.set("modifiers",e.data.modifiers.toJSON());
                    
                    if (e.data.prices)
                        this.editorModel.menuItem.menuItemPrices.set("prices",e.data.prices.toJSON());
                            else
                             this.editorModel.menuItem.menuItemPrices.set("prices",[]);

                    if (e.data.overridePricing)
                        this.editorModel.menuItem.menuItemPrices.set("overridePricing",e.data.overridePricing.toJSON());
                            else
                             this.editorModel.menuItem.menuItemPrices.set("overridePricing",[]);

                    this.editorModel.menuItem.setTaxData(e.data.taxes.toJSON());
                    this.editorModel.menuItem.set("picture",e.data.menuItemImage);
                    this.editorModel.menuItem.set("displayOrder",e.data.displayOrder);
                    
                    //loop through all the option groups and get the name
                    _.each(e.data.optionGroups, function(assignedOptionGroup){
                        masterRecord = _.find(menuModel.get("menuItemOptions").data(), {objectId:assignedOptionGroup.objectId});
                        if (masterRecord){
                            assignedOptionGroup.name = masterRecord.name;
                            //if no max amount is assigned, then default zero
                            if (!assignedOptionGroup.maxAmount && assignedOptionGroup.maxAmount != 0)
                                assignedOptionGroup.maxAmount = 0;
                            //copy the options over too
                            assignedOptionGroup.options = masterRecord.options.slice(0);
                        }
                    });

                    

                    this.editorModel.menuItem.set("optionGroups",e.data.optionGroups);

                    this.editorModel.menuItem.setupMenuItemToggleButtons();

                    $(".div-item-image img").attr("src", this.editorModel.menuItem.getImageUrl(e.data));
                    $('.div-item-image input:file').val("");
                    
                    this.hideForms();
                    $("#frmMenuItemOverrideRecordEdit").show();
                    toggleEditor();
                },

                shareSocial: function(e) {

                    toggleEditor();

                    var params={};
                    var postText="Hey Guys, we just added "+ this.name+ " to our all ready incredible menu. Download our app and order some now!";

                    params.facebookPost=postText;
                    params.twitterPost=postText;

                    if(this.picture) {
                        params.imgURL=this.picture.url;

                    }

                    params.parentColl={id:this.objectId,collName:"MenuItem",description:this.name}
                    
                    appModel.socialWindow.open(params);

                    
                },

                saveMenuItemRecord: function(e) {
                    
                    kendo.ui.progress($(e.currentTarget.form), true);

                    var self=this;
                    var btnSave=$(".btn-group.dropup > button:first-child");
                    
                    //disable the save button so there is no double clicking
                    $(".saveButton").button('loading');

                    e.preventDefault();

                    // validate
                     if(this.menuItemValidator && this.menuItemValidator.validate()==false){
                        $(".saveButton").button("reset");
                        $(".btn-group.dropup > button.dropdown-toggle").removeAttr("disabled");
                        return;
                     }

                    btnSave.button("loading");
                    $(".btn-group.dropup > button.dropdown-toggle").attr("disabled","disabled");

                    // if we have an image upload it first
                    // var fileInput = $('.div-item-image input:file');

                    // if($(fileInput).prop("files") && $(fileInput).prop("files")[0]) {
                        // $(fileInput).val('');


                    if (self.get("editorModel.menuItem.menuItemImageDirty") == true){
                        
                        var fileName = this.get("editorModel.menuItem.newFileName");

                        $.when(uploadMenuItemImage($(".menuItemImageEdit img")[0],fileName)).done(function(pictureObj) {

                            if(pictureObj)
                                self.set("editorModel.menuItem.menuItemImage",{"name":pictureObj.name(),"url":pictureObj.url(),"__type":"File"});
                            
                            finishSave.apply(self);
                        })
                    } else
                        finishSave.apply(self);

                    function finishSave() {
                        var self = this;

                        var isNewItem = false;

                        if (this.editorModel.menuItem.objectId!=null) {
                            var dataItem = this.get("allMenuItems").get(this.editorModel.menuItem.objectId);
                            $.extend(dataItem,this.editorModel.menuItem.formatDataForSave());
                            dataItem.dirty=true;
                        }

                        else {
                            this.get("allMenuItems").add(this.editorModel.menuItem.formatDataForSave());
                            isNewItem = true;
                        }
                        
                        

                        $.when(this.get("allMenuItems").sync()).then(
                            
                            function(result) {
                                kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");

                                // self.get("allMenuItems").sort( [{ field: "updatedAt", dir: "desc" },{ field: "createdAt", dir: "desc" }] );
                                self.get("allMenuItems").sort( [{ field: "name", dir: "asc" }] );

                                if( (self.editorModel.menuItem.menuItemPrices.prices.length==0 && self.editorModel.menuItem.menuItemPrices.setOverrideData == false) 
                                 || (self.editorModel.menuItem.menuItemPrices.overridePricing.length==0 && self.editorModel.menuItem.menuItemPrices.setOverrideData == true) ){
                                
                                    kendoNotification.show(appDefaults.notificationMessages.zeroItemPrice,"info");
                                
                                };

                                //now that the menu item has been succesfully saved, we need to update the 'assigned menu item'
                                //with the new override pricing
                                if (self.editorModel.menuItem.menuItemPrices.setOverrideData == true){
                                    //copy the override pricing from the master list (allMenuItems) to the overridePricing for the 
                                    //asssigned menu items
                                    var assignedItem = self.get("assignedMenuItems").get(self.editorModel.menuItem.objectId);
                                    if (assignedItem){
                                        assignedItem.set("overridePricing", self.editorModel.menuItem.menuItemPrices.overridePricing);
                                        assignedItem.set("onlineOrderingAvailable", self.editorModel.menuItem.onlineOrderingAvailable);
                                    }
                                };

                            },  

                            function(result){
                                kendoNotification.show(appDefaults.notificationMessages.saveError,"error");
                                self.get("allMenuItems").read({"menuObj":{"__type":"Pointer", "className":"menuCategories","objectId":self.selectedMenuCategory}});
                            }

                            ).always(function(result){
                                //set the override flag to False
                                self.editorModel.menuItem.menuItemPrices.set("setOverrideData", false);
                                self.editorModel.menuItem.set("menuItemImageDirty", false);
                                var target=$(e.target);

                                if(target.attr("data-save-new")){
                                    self.editorModel.menuItem.reset();
                                    //sort all menu items by 'createdAt'

                                }

                                else if(target.attr("data-save-share")){
                                    self.editorModel.menuItem.shareSocial()
                                } else
                                    toggleEditor();

                                $(".saveButton").button("reset");
                                $(".btn-group.dropup > button.dropdown-toggle").removeAttr("disabled");

                                //make sure that the filter is correctly set
                                var searchTerm = $('#inputSearchMenuItems').val();
                                menuModel.get("allMenuItems").filter( {field:"name", operator:"contains", value: String(searchTerm)  } );
                                menuModel.get("allMenuItems").fetch();

                                kendo.ui.progress($(e.currentTarget.form), false);

                        });

                    }


                },

                setTaxData: function(data) {
                    
                    this.set("taxes",[]);

                    var taxCodesData=menuModel.get("taxCodes").data();

                    // add all the taxes first
                    for (var i = 0; i < taxCodesData.length; i++) {
                        this.get("taxes").push({
                                        "id":taxCodesData[i].objectId,
                                        "description":taxCodesData[i].description,
                                        "percentage":taxCodesData[i].percentage,
                                        "applyToAll" :taxCodesData[i].applyToAll,
                                        "isChecked": false,
                                        "rowClass":taxCodesData[i].applyToAll==true?"alert-warning":""
                                    });
                    }

                    for(var i=0; i<data.length;i++) {
                        for (var j=0;j<this.taxes.length;j++) {
                            if(data[i].taxId==this.taxes[j].id)
                                this.get("taxes")[j].set("isChecked",true);
                        }
                    }
                   
                    

                },

                formatDataForSave: function() {

                    var data={};
                    var taxItems=this.taxes.toJSON();

                    data.description=this.get("description");
                    data.name=this.get("name");
                    data.minTotalOrderAmount= this.get("minTotalOrderAmount");
                    
                    //data.price=this.get("price");
                    data.displayOrder=this.get("displayOrder");
                    data.taxes=[];

                    for(var i=0;i<taxItems.length;i++) {
                        if(taxItems[i].isChecked) data.taxes.push({taxId: taxItems[i].id});
                    }

                    //save the option Groups
                    data.optionGroups = [];                    
                    _.each(this.get("optionGroups"), function(anOptionGroup){
                        if (!data.optionGroups)
                            data.optionGroups = [];
                        
                        if (!anOptionGroup.defaultValues)
                            anOptionGroup.defaultValues = [];

                        data.optionGroups.push({objectId:anOptionGroup.objectId, 
                                                amount:anOptionGroup.amount,
                                                maxAmount:anOptionGroup.maxAmount,
                                                defaultValues:anOptionGroup.defaultValues.slice(0),
                                                numberFree: anOptionGroup.numberFree
                        });
                    });

                    //data.taxItems=this.get("taxItems").toJSON();
                    
                    if(this.menuItemImage)
                        data.menuItemImage=this.get("menuItemImage");


                    data.modifiers=this.menuItemModifiers.get("modifiers").toJSON();

                    data.prices = this.menuItemPrices.get("prices").toJSON();

                    if (this.get("onlineOrderingAvailable") === undefined)
                        data.onlineOrderingAvailable = true; //default to TRUE
                    else    
                        data.onlineOrderingAvailable = this.get("onlineOrderingAvailable");

                    data.globalTaxExempt = this.get("globalTaxExempt");
                    data.printToKT = this.get("printToKT");
                    data.showOnDigitalBoard = this.get("showOnDigitalBoard");

                    data.overridePricing = this.menuItemPrices.get("overridePricing").toJSON();
                    data.menuCategory = appModel.getParsePointer({objectId:menuModel.selectedMenuCategory}, "MenuCategory");
                    data.menuHeader = appModel.getParsePointer({objectId:menuModel.selectedMenuHeader}, "MenuHeader"); //we need this in the case of override data
                    return data;
                },

                cancelSaveRecord: function(e) {
                    this.editorModel.menuItem.menuItemPrices.set("setOverrideData", false);
                    if (this.menuItemValidator)
                        this.menuItemValidator.hideMessages();
                    toggleEditor();

                    //make sure that the filter is correctly set
                    var searchTerm = $('#inputSearchMenuItems').val();
                    menuModel.get("allMenuItems").filter( {field:"name", operator:"contains", value: String(searchTerm)  } );
                    menuModel.get("allMenuItems").fetch();
                },

                deleteRecord: function(e){
                    e.preventDefault();
                    var self=this;
                    var delMenuItem = this.editorModel.menuItem;

                     $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete <span class='badge alert-danger'>"+delMenuItem.name+"</span>",icon:"k-ext-warning" }))
                        .then(function (response) {
                            if(response.button=="Yes") {
                                var dataItem = self.get("allMenuItems").get(delMenuItem.objectId);
                                self.get("allMenuItems").remove(dataItem);
                        
                                $.when(self.get("allMenuItems").sync()).then(function() {
                                    kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success");
                                    self.get("assignedMenuItems").remove(dataItem); //this refreshes the currently selected category
                                    toggleEditor();
                                }, function(error){
                                    kendoNotification.show(appDefaults.notificationMessages.deleteError,"error"); 
                                    self.get("allMenuItems").read({"menuHeader":{"__type":"Pointer", "className":"MenuCategory","objectId":self.selectedMenuCategory}});                                    
                                });
                            }

                        }, function(){
                            kendoNotification.show(appDefaults.notificationMessages.deleteError,"error"); 
                            self.get("allMenuItems").read({"menuHeader":{"__type":"Pointer", "className":"MenuCategory","objectId":self.selectedMenuCategory}});
                        });
                   
                },

                // onChange: function(e) {
                    
                // },

                getImageUrl: function(data) {
                    
                    if(data.menuItemImage && data.menuItemImage.url){
                        return data.menuItemImage.url;
                    }

                    else
                        return appDefaults.noImageFile;

                },

                showImage: function() {
                    self = this;

                    var fileInputField = $('.div-item-image input:file');

                    var file=$(fileInputField).prop("files")[0];
                    if(file) {

                        this.imageUpload.validateProductImage(file, fileInputField[0].form)
                        .then(function(croppedImage){
                            if (croppedImage){
                                $('.div-item-image img').attr('src', croppedImage.src);
                                //clear out the file upload
                                $(fileInputField).replaceWith($(fileInputField).clone(true));
                                self.set("editorModel.menuItem.menuItemImageDirty", true);
                                self.set("editorModel.menuItem.newFileName", file.name);
                            } else {
                                //the upload failed some validation (probably too big)
                                //since there is no way to clear the input with the offending image 
                                //we replce the input field with a new one 
                                $(fileInputField).replaceWith($(fileInputField).clone(true));
                                self.set("editorModel.menuItem.menuItemImageDirty", false);
                            }
                        }, function(error){
                            //an error has occurred
                            $(fileInputField).replaceWith($(fileInputField).clone(true));
                            self.set("editorModel.menuItem.menuItemImageDirty", false);
                        });                        
                    }
                    
                },

                hidePanel: function(e) {
                    e.preventDefault();
                    // $("#paneMenuHeader").removeClass().addClass("col-md-6");
                    // $("#paneMenuCategory").removeClass().addClass("col-md-6");
                    $("#paneMenuItem").hide();

                }
            }
        },

        imageUpload: {

            // maxWidth: 640,
            // maxHeight: 480,
            maxWidth: 1024,
            maxHeight:768,
            data: null,
            cropBoxData: null,
            cropDeferred:null,
            $image:null,

            validateProductImage: function (file, parentForm){
                // console.log(file);

                if (parentForm) kendo.ui.progress($(parentForm), true);

                cropDeferred = $.Deferred();

                var result = true;
                var reader = new FileReader();

                //ok now create the image so we can check its aspect ratio
                var img = new Image();      
                
                reader.onload = function(e){
                    img.src = e.currentTarget.result;

                    //max size of image
                    // if (e.total > (500*1024)){
                    //     kendoNotification.show({title:"ImageUpload",message: "Image size exceeds 500KBytes. Please upload a smaller file"},"error");

                    //     cropDeferred.resolve(false);
                    // } else {
                        //now check if the iamge is 4:3, if not then it needs to be cropped

                        var ratio = Number(img.width/img.height).toString();
                        if ( (String(ratio).substring(0, 4) != "1.33") 
                            || img.width > menuModel.imageUpload.maxWidth){

                            var imgCropper = $('#cropper-modal');

                            $image = $('#cropper-image-div > img');

                            //$image.cropper('reset');
                            $image.attr("src", img.src);

                            imgCropper.kendoWindow({
                                title: "Crop/Resize Image",
                                modal: true,
                                animation: {
                                    open: { effects: "fade:in"},
                                    close:{ effects: "fade:out"}
                                },
                                open: function(){

                                    $image.cropper({
                                        aspectRatio: 4 / 3,
                                        responsive: true,
                                        highlight: true,
                                        resizable: true,
                                        zoomable: true,
                                        strict: false,
                                        movable:true,
                                        viewMode:1, //the cropbox should be within the canvas 
                                        crop: function(data){
                                            
                                            menuModel.imageUpload.cropBoxData = data;

                                        },
                                        build:function(data){
                                             if (imgCropper) kendo.ui.progress($(imgCropper), true);
                                        },
                                        built:function(data){
                                            if (imgCropper) kendo.ui.progress($(imgCropper), false);
                                        }
                                    });
                                },
                                close: function(){
                                    $image.cropper('destroy');
                                }
                            });


                            imgCropper.data("kendoWindow").center().open();  

                        } else {
                            cropDeferred.resolve(img);
                        }
                    // }

                };

                reader.onloadstart = function(e){
                    if (parentForm) kendo.ui.progress($(parentForm), true);
                };

                reader.onloadend = function(e){
                    if (parentForm) kendo.ui.progress($(parentForm), false);  
                };

                reader.onprogress = function(e){
                    if (parentForm) kendo.ui.progress($(parentForm), true);
                };

                reader.readAsDataURL(file);
                
                return cropDeferred.promise();
            },

            doZoomIn: function(){
                $image.cropper('zoom', 0.1);
            },

            doZoomOut: function(){
                $image.cropper('zoom', -0.1);
            },

            doCrop: function(){
                // var cropBoxData;

                $('#cropper-modal').data("kendoWindow").close();

                var image = $('#cropper-image-div > img')[0];
                // $image.cropper('getCropBoxData', cropBoxData);

                if (this.imageUpload.cropBoxData && image){
                    var cropBoxData = this.imageUpload.cropBoxData;
                    var canvas=document.createElement("canvas");
                    //canvas.width = cropBoxData.width;
                    //canvas.height = cropBoxData.height;

                    canvas.width = menuModel.imageUpload.maxWidth;
                    canvas.height = menuModel.imageUpload.maxHeight;

                    var ctx=canvas.getContext("2d");
                    //ctx.drawImage(image,cropBoxData.x,cropBoxData.y,cropBoxData.width, cropBoxData.height, 
                    //            0,0,cropBoxData.width,cropBoxData.height);

                    ctx.drawImage(image,cropBoxData.x,cropBoxData.y,cropBoxData.width, cropBoxData.height, 
                                0,0,menuModel.imageUpload.maxWidth,menuModel.imageUpload.maxHeight);

                    //var imageData = ctx.getImageData(0,0,640, 480);

                    var croppedImage = new Image();

                    croppedImage.onload = function(){
                        if (croppedImage.width > menuModel.imageUpload.maxWidth){ 
                            croppedImage.width = menuModel.imageUpload.maxWidth;
                            croppedImage.height = menuModel.imageUpload.maxHeight;
                        }
                        //this returns the ArrayBuffer of the cropped image
                        //it is what will be sent to parse
                        console.log('resolving cropeDeferred');
                        if (cropDeferred)
                            cropDeferred.resolve(croppedImage);
                    }

                    //get mime type from image source
                    //1. find the first ;
                    var delimitIndexEnd = image.src.indexOf(';');
                    var delimitIndexStart = image.src.indexOf(':') + 1;
                    var mimeType = image.src.substring(delimitIndexStart, delimitIndexEnd);

                    croppedImage.src = canvas.toDataURL(mimeType, 0.5);

                    //should reset the FILE input so it is no longer storing the massive file

                   

                }
            },

            cancelCrop: function(){
                if (cropDeferred)
                    cropDeferred.resolve(false);
                $("#cropper-modal").data("kendoWindow").close();
            },

            // upload: function() {

            //     var fileInputField = $('.div-item-image input:file');
            //     var file=$(fileInputField).prop("files")[0];
            //     // alert(fileInputField.val());

            //     if(file) {
            //         var self=this;

            //         $.when(uploadImage(".div-item-list-image", this.imageUpload.validateProductImage))
            //         .done(function(pictureObj) {
            //             if (pictureObj){
            //                 var dataItem = self.get("menuItems").get(self.imageUpload.data.objectId);
    
            //                 //The parse JS API returns name and url as methods and not as
            //                 // data elements (the REST API as basic data elements) so we convert
            //                 // them to data elements
            //                 if (typeof pictureObj.name === 'function')
            //                     pictureObj.name = pictureObj.name();

            //                 if (typeof pictureObj.url === 'function')
            //                     pictureObj.url = pictureObj.url();

            //                 if(pictureObj)
            //                     $.extend(dataItem,{picture:{"name":pictureObj.name,"url":pictureObj.url,"__type":"File"}});
                            
            //                 dataItem.dirty=true;

            //                 $.when(self.get("allMenuItems").sync()).then(function() {
            //                     $("#windowImageUpload").data("kendoWindow").close();
            //                     kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success"); 
            //                 });
            //             };
                            
            //         })
            //     }
            // },


            cancel: function() {
                $("#windowImageUpload").data("kendoWindow").close();
            },

            showImage: function() {

                    var file=$('.div-item-list-image input:file').prop("files")[0];
                    if(file) {
                        var reader = new FileReader();

                        reader.onload = function (e) {
                            $('.div-item-list-image img').attr('src', e.target.result);
                        }

                        reader.readAsDataURL(file);
                    
                    }
                    
                },
        }
        });
    }

    var menuModel=null;

    var DiscountsModel = function(){
        return kendo.observable({
            discountTypes:[{id:1, description:"Dollar Amount", applyToId:"A"},{id:1, description:"Dollar Amount", applyToId:"C"}, 
                            {id:2, description:"Percentage Amount",applyToId:"A"}, {id:2, description:"Percentage Amount",applyToId:"B"},
                            {id:2, description:"Percentage Amount",applyToId:"C"}],

            applyToTypes: [{applyToId:"A", description:"Items"},{applyToId:"B", description:"Sub-Total", id:2}, {applyToId:"C", description:"Delivery", id:1}],

            discountList:VendorDiscountsDatasource(appModel),
            editorModel:{
                objectId:null,
                name:null,
                type:null,
                value:0,
                applied:null,
                deleted:false
            },

            setViewState:function(){
                this.init();
            },

            attachValidator:function(){
                this.validator=$("#frmDiscountsRecordEdit").kendoValidator({
                        validateOnBlur: false
                }).data("kendoValidator");
            },
            
            getDiscountDescription:function(data){
                if (!data.value || data.value == 0)
                    return 'User entered';

                if (data.type == 2)
                    return data.value + '%'
                else {
                    return kendo.toString(data.value,"c");
                }
            },
            init:function(){
                var self = this;
                var deferred = $.Deferred();
                 
                 $.when(this.get("discountList").fetch())
                 .then(function() {
                    // bind to the change event
                    self.get("editorModel").bind("change", function(e) {
                        console.log(e.field); // will output the field name when the event is raised
                        if (e.field == "type"){
                            //if the discount type has changed
                            self.set("editorModel.value",null);
                            if (self.editorModel.type == 2){
                                $("#valueDollarGroup").hide();
                                $("#valuePercentGroup").show();
                            } else {
                                $("#valuePercentGroup").hide();
                                $("#valueDollarGroup").show();
                            };
                        };
                        if (e.field == 'applied'){
                            if (self.editorModel.applied == 'B'){ //B = Sub-total discount
                                $("#valueDollarGroup").hide();
                                $("#valuePercentGroup").show();
                                self.set("editorModel.type", 2); //sub-total is only allowed to be percent
                            };  

                            if (self.editorModel.applied == 'A' || self.editorModel.applied == 'C'){ //A = Item level discount
                                // if (self.editorModel.type == 2){
                                    // $("#valueDollarGroup").hide();
                                    // $("#valuePercentGroup").show();
                                    // self.set("editorModel.type", 2);
                                // } else {
                                    
                                self.set("editorModel.type", 1);
                                $("#valuePercentGroup").hide();
                                $("#valueDollarGroup").show();
                                
                                    // };
                            };
                        };
                    });

                    deferred.resolve();
                 })

                 return deferred.promise();

            },

            reset:function(){

                this.editorModel.set("objectId", null);
                this.editorModel.set("name", null);
                this.editorModel.set("type", 1);
                this.editorModel.set("value", 0);
                this.editorModel.set("applied", null);
                this.editorModel.set("deleted", false);
            },

            onDiscountListViewDataBound: function(e){
                setScrollingHeight(e.sender.element[0]);
            },

            addDiscountRecord:function(){
                    this.reset();
                    $("#frmDiscountsRecordEdit").show();
                    toggleEditor();
            },

            cancelDiscountRecord:function(){
                this.reset();
                toggleEditor();
            },

            editDiscountRecord:function(e){
                //set the editor model data
                this.editorModel.set("objectId",e.data.objectId);
                this.editorModel.set("name",e.data.name);
                this.editorModel.set("type",e.data.type);
                this.editorModel.set("value",e.data.value);
                this.editorModel.set("applied",e.data.applied);
                this.editorModel.set("deleted",e.data.deleted);
                $("#frmDiscountsRecordEdit").show();
                toggleEditor();
            },

            saveDiscountRecord:function(e){
                var self = this; 

                var btnSave=$(e.target);
                btnSave.button("loading");

                if (self.validator.validate() == false){
                    btnSave.button("reset");
                    return null;
                };

                if (self.editorModel.objectId!=null) {
                    var dataItem = self.get("discountList").get(self.editorModel.objectId);
                    $.extend(dataItem,self.editorModel);
                    dataItem.dirty=true;
                    
                    
                } else {
                    this.get("discountList").add({
                        name:self.editorModel.get("name"),
                        type:self.editorModel.get("type"),
                        value:self.editorModel.get("value"),
                        applied:self.editorModel.get("applied"),
                        deleted:self.editorModel.get("deleted")
                    });
                };

                $.when(self.get("discountList").sync()).then(

                    function(result) {
                        kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");
                    },  

                    function(result){
                        kendoNotification.show(appDefaults.notificationMessages.saveError,"error");
                        self.get("discountList").read();
                    }
                ).always(function(){
                    // $("#frmDiscountsRecordEdit").hide();
                    toggleEditor();
                    btnSave.button("reset");

                });
            },

            deleteDiscountRecord:function(e){
                    e.preventDefault();
                    var self=this;

                    var delDiscount = self.get("editorModel");

                    $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete <span class='badge alert-danger'>"+self.editorModel.name+"</span>",icon:"k-ext-warning" }))
                        .then(function (response) {
                            if(response.button=="Yes") {
                                var dataItem = self.get("discountList").get(delDiscount.objectId);
                                self.get("discountList").remove(dataItem);
                        
                                $.when(self.get("discountList").sync()).then(function() {
                                   kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success"); 
                                  
                                   toggleEditor();
                                }, function(error){
                                    kendoNotification.show(appDefaults.notificationMessages.deleteError,"error");
                                    self.discountList.read();                                    
                                })
                            }

                            },function(){
                                kendoNotification.show(appDefaults.notificationMessages.deleteError,"error");
                                self.discountList.read();
                            });
            }
        });
    }

    var discountsModel = null;

    // Taxes Model
    var TaxModel = function() { 

        return kendo.observable({
        // externalCodes: externalTaxCodesDataSource(appModel),

        init: function() {
             var deferred = $.Deferred();

             this.set("taxList", TaxCodesDataSource());
             
             $.when(this.get("taxList").fetch())
             .then(function() {
                deferred.resolve();
             })

             return deferred.promise();
        },

        onTaxListViewDataBound: function() {

            var self=this;

            if(this.taxList.data().length==0) {
                
                var divEmptyPlaceholderContent=$("<div/>").attr("class","col-md-12");
                var btnAdd=$("<input/>").attr({type:'button',value:'Add Tax Code',class:'btn btn-default btn-lg'}).click(function(){self.addRecord.apply(self)});

                divEmptyPlaceholderContent.append("<img src='./images/menu_blue.svg'></img><h2>No Records!</h2><p>There are no Tax Codes entered<br/>Click 'Add Tax Code' to create your first tax code.</p>")
                                          .append(btnAdd);

                $("#kendoListView").append($("<div/>").attr("class","row div-norecords-placeholder").append(divEmptyPlaceholderContent));
                $("#kendoListView div:first-child").toggleClass('k-selectable');
            }

        },

        editorModel: {
            "objectId" : null,
            "description": "",
            "percentage":"",
            "applyToAll":"",
            "extTaxId":"",

            reset: function() {
                this.set("objectId",null);
                this.set("description","");
                this.set("percentage",0);
                this.set("applyToAll",false);
                this.set("extTaxId",null);
                
            }
        },

        taxList: null,
        
        // returns the contents for the help section from a html file
        helpContent: function() {       

            var self=this;
            
            $.ajax({
                url: "./help/taxes.htm"

            }).success(function(data) {
               self.set ("helpContent",data);
            });
        },

       
        // CRUD operations
        addTaxRecordRecord: function(e) {
            
            //set the editor model data
            this.editorModel.reset(); 

            toggleEditor();
             
        },

        editTaxRecord: function(e) {
            
            //set the editor model data
            this.editorModel.set("objectId",e.data.objectId);
            this.editorModel.set("description",e.data.description);
            this.editorModel.set("percentage",e.data.percentage);
            this.editorModel.set("applyToAll",e.data.applyToAll);
            this.editorModel.set("extTaxId",e.data.extTaxId);
            toggleEditor();

        },

        saveTaxRecord: function(e) {
            
            var self=this;
            // validate
             if($("#frmTaxRecordEdit").data("kendoValidator").validate()==false){
                return;
             }

            var btnSave=$(e.target);
            btnSave.button("loading");


            if (this.editorModel.objectId!=null) {
                var dataItem = this.get("taxList").get(this.editorModel.objectId);
                $.extend(dataItem,this.editorModel);
                dataItem.dirty=true;
                
                
            }

            else {
                this.get("taxList").add(this.editorModel.toJSON());
                
            }

            $.when(this.get("taxList").sync()).then(

                function(result) {
                    kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");
                },  

                function(result){
                    kendoNotification.show(appDefaults.notificationMessages.saveError,"error");
                    self.taxList.read();
                }
            ).always(function(){
                toggleEditor();
                btnSave.button("reset");

            });

        },

        cancelSaveRecord: function(e) {
            $("#frmTaxRecordEdit").data("kendoValidator").hideMessages();
            toggleEditor();
        },

        deleteRecord: function(e) {
            e.preventDefault();
            var self=this;

            $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete <span class='badge alert-danger'>"+self.editorModel.description+"</span>",icon:"k-ext-warning" }))
                .done(function (response) {
                        if(response.button=="Yes") {

                            var dataItem = self.get("taxList").get(self.editorModel.objectId);
                            self.get("taxList").remove(dataItem);
                    
                            $.when(self.get("taxList").sync()).then(function() {
                               kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success");
                               toggleEditor();
                                
                            },function(){
                                kendoNotification.show(appDefaults.notificationMessages.deleteError,"error");
                                self.taxList.read();
                            })
                        }

                    });
        
        }

        });
    }

    var taxModel=null;

    // Staff Model
    var StaffModel = function() { 

        return kendo.observable({
        
        init: function() {
             var deferred = $.Deferred();
             
             this.set("staffList", StaffDataSource());
             this.set("truckList",TruckDataSource(appModel));
             this.set("sendScheduleSMS",false);
             
             $.when(this.get("staffList").fetch(),this.get("truckList").fetch())
                .then(function() {
                    deferred.resolve();
                })

             return deferred.promise();
        },

        attachValidator: function() {

            var self=this;

            this.validator=$("#frmCrewRecordEdit").kendoValidator({
                    validateOnBlur: false,
                    rules: {
                                duplicate: function (input) {

                                    var isNotDuplicate=true;
                                    
                                    if (input.is("[data-duplicate-msg]") && input.val() != "") {                                    
                                        
                                        var staffData=self.staffList.data()
                                        for(var i=0;i<staffData.length;i++) {
                                            if(self.editorModel.firstName.toUpperCase()==staffData[i].firstName.toUpperCase() && self.editorModel.lastName.toUpperCase()==staffData[i].lastName.toUpperCase()&& self.editorModel.objectId!=staffData[i].objectId)
                                                isNotDuplicate=false;
                                        }

                                        return isNotDuplicate;                      
                                    }

                                    return true;
                                }
                            }
            }).data("kendoValidator");
        

        },

        onStaffListViewDataBound: function(e) {

            var self=this;

            if(this.staffList.data().length==0) {
                
                var divEmptyPlaceholderContent=$("<div/>").attr("class","col-md-12");
                var btnAdd=$("<input/>").attr({type:'button',value:'Add First Staff Member',class:'btn btn-default btn-lg'}).click(function(){self.addRecord.apply(self)});

                divEmptyPlaceholderContent.append("<img src='./images/staff_blue.svg'></img><h2>What! No Staff?</h2><p>Adding Staff member is easy<br/>Click 'Add First Staff Member' to get started now.</p>")
                                          .append(btnAdd);

                $("#kendoLVStaff").append($("<div/>").attr("class","row div-norecords-placeholder").append(divEmptyPlaceholderContent));
                $("#kendoLVStaff div:first-child").toggleClass('k-selectable');
            };

            setScrollingHeight(e.sender.element[0]);

        },

        editorModel: {
            "objectId" : null,
            "firstName": null,
            "lastName":null,
            "email":null,
            "phoneNumber":null,
            "active": null,
            "dateHired": null,
            "dateLeft": null,
            "picture" : null,
            "sendScheduleSMS": false,
            "truck":{objectId:null,className:"Truck",__type:"Pointer"},

            reset: function() {
                this.set("objectId",null);
                this.set("firstName",null);
                this.set("lastName",null);
                this.set("email",null);
                this.set("phoneNumber",null);
                this.set("active",false);
                this.set("dateHired",null);
                this.set("dateLeft",null);
                this.set("picture",null);
                this.set("sendScheduleSMS",false);
                this.set("truck",{objectId:null,className:"Truck",__type:"Pointer"});
                
            },


            showImage: function() {

                    var file=$('.div-item-image input:file').prop("files")[0];
                    if(file) {
                        var reader = new FileReader();

                        reader.onload = function (e) {
                            $('.div-item-image img').attr('src', e.target.result);
                        }

                        reader.readAsDataURL(file);
                    
                    }
                    
            },

            getImage: function(data) {
                    if(data.picture && data.picture.url){
                        return data.picture.url;
                    }

                    else
                        return appDefaults.noImageFile;
            }
        },

        staffList: null,
        truckList: null,
        validator:null,
        

        hasRecords: function() {
            return this.get("staffList").data().length?true:false;
        },

        // returns the contents for the help section from a html file
        helpContent: function() {       

            var self=this;
            
            $.ajax({
                url: "./help/staff.htm"

            }).success(function(data) {
               self.set ("helpContent",data);
            });
        },

       
        // CRUD operations
        addRecord: function(e) {
            
            //set the editor model data
            this.editorModel.reset(); 
            $(".div-item-image img").attr("src", this.editorModel.getImage(this.editorModel));
            $('.div-item-image input:file').val("");
            
            //the call to reset() wil set the default value of sendScheduleSMS
            // the following will update the toggle buttons based on the default value
            if (this.editorModel.get("sendScheduleSMS")){
                $('#sendScheduleOn').addClass('active btn-primary');
                $('#sendScheduleOff').removeClass('active btn-primary');
            } else {
                $('#sendScheduleOff').addClass('active btn-primary');
                $('#sendScheduleOn').removeClass('active btn-primary');
            };
            toggleEditor();
             
        },

        sendPOSActivation: function(e){
                    $.ajax({
                        url:  "/parse/functions/sendCrewPinRequest",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,
                        data:kendo.stringify({
                            vendorId: appModel.userInfo.vendorID,
                            crewId: this.editorModel.objectId
                        }),
                        success: function(httpResponse) {
                            kendoNotification.show({title:"SMS Sent",message:"SMS has been sent. Please notify crew member."},"success");
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                                kendoNotification.show({title:"Error!",message:"An error occured sending SMS. Please confirm the phone number."},"error")
                        }
                    });
            return false;
        },

        toggleScheduleSMS: function(e){

            this.editorModel.set("sendScheduleSMS",!this.editorModel.get("sendScheduleSMS"));
            
            if (this.editorModel.get("sendScheduleSMS")){
                $('#sendScheduleOn').addClass('active btn-primary');
                $('#sendScheduleOff').removeClass('active btn-primary');
            } else {
                $('#sendScheduleOff').addClass('active btn-primary');
                $('#sendScheduleOn').removeClass('active btn-primary');
            };

            return false; //prevent default onClick Handler
        },

        editRecord: function(e) {
            
            //set the editor model data
            this.editorModel.set("objectId",e.data.objectId);
            this.editorModel.set("firstName",e.data.firstName);
            this.editorModel.set("lastName",e.data.lastName);
            this.editorModel.set("email",e.data.email);
            this.editorModel.set("phoneNumber",e.data.phoneNumber);
            this.editorModel.set("active",e.data.active);
            this.editorModel.set("dateHired",e.data.dateHired);
            this.editorModel.set("dateLeft",e.data.dateLeft);
            this.editorModel.set("truck",e.data.truck);
            this.editorModel.set("picture",e.data.pictureObj);
            this.editorModel.set("sendScheduleSMS",e.data.sendScheduleSMS);
            $(".div-item-image img").attr("src", this.editorModel.getImage(e.data));
            $('.div-item-image input:file').val("");

            if (e.data.sendScheduleSMS){
                $('#sendScheduleOn').addClass('active btn-primary');
                $('#sendScheduleOff').removeClass('active btn-primary');
            } else {
                $('#sendScheduleOff').addClass('active btn-primary');
                $('#sendScheduleOn').removeClass('active btn-primary');
            };

            toggleEditor();

        },

        saveRecord: function(e) {
            
            var btnSave=$(e.target);
            var self=this;

            // validate
             if(this.validator.validate()==false){
                return;
             }

             btnSave.button("loading");

             // if we have an image upload it first
             if($('.div-item-image input:file').prop("files")[0]) {
                
                $.when(uploadImage(".div-item-image")).done(function(pictureObj) {
                    if(pictureObj)
                        self.set("editorModel.picture",{"name":pictureObj.name,"url":pictureObj.url,"__type":"File"});
                    finishSave.apply(self);
                })
             }

             else
                finishSave.apply(self);

            function finishSave() {
                if (this.editorModel.objectId!=null) {
                    var dataItem = this.get("staffList").get(this.editorModel.objectId);
                    $.extend(dataItem,this.editorModel.toJSON());
                    dataItem.dirty=true;

                }

                else {
                    this.get("staffList").add(this.editorModel.toJSON());
                    
                }

                $.when(this.get("staffList").sync()).then(

                    function(result) {
                        kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");
                    },  

                    function(result){
                        kendoNotification.show(appDefaults.notificationMessages.saveError,"error");
                        self.staffList.read();
                    }
                ).always(function(){
                    toggleEditor();
                    btnSave.button("reset");

                });
            }


        },

        cancelSaveRecord: function(e) {
            this.validator.hideMessages();
            toggleEditor();
        },

        deleteRecord: function(e) {
            e.preventDefault();
            
            var self=this;

            $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete <span class='badge alert-danger'>"+self.editorModel.firstName+"</span>",icon:"k-ext-warning" }))
                .then(function (response) {
                        if(response.button=="Yes") {
                            var dataItem = self.get("staffList").get(self.editorModel.objectId);
                            self.get("staffList").remove(dataItem);

                            $.when(self.get("staffList").sync()).then(function() {
                               kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success");
                               toggleEditor();
                                
                            })
                        }

                    }, function(){
                        kendoNotification.show(appDefaults.notificationMessages.deleteError,"error");
                        self.staffList.read();

                    });
        
        },

        imageUpload: {

            data: null,

            openUploadWindow: function(e) {

                this.imageUpload.set("data",e.data);

                var uploadWindow = $("#windowImageUpload");
                if(!uploadWindow.data("kendoWindow")) {
                    uploadWindow.kendoWindow({
                        width: "400px",
                        height: "300px",
                        title: "Upload staff picture",
                        modal: true,

                        open: function () {
                            this.wrapper.css({ top: 100, left: 600 });
                        }
                    });
                }

                $(".div-item-list-image img").attr("src", this.editorModel.getImage(e.data));
                $('.div-item-list-image input:file').val("");
                $(".div-item-list-image .progress-bar").data("kendoProgressBar").value(0);
                $(".div-item-list-image .div-upload-progress").css("visibility","hidden");
                uploadWindow.data("kendoWindow").open();
            },

            upload: function() {
                if($('.div-item-list-image input:file').prop("files")[0]) {
                        
                        var self=this;

                        $.when(uploadImage(".div-item-list-image")).done(function(pictureObj) {
                            var dataItem = self.get("staffList").get(self.imageUpload.data.objectId);
                            
                            if(pictureObj)
                                $.extend(dataItem,{picture:{"name":pictureObj.name,"url":pictureObj.url,"__type":"File"}});

                            dataItem.dirty=true;

                            $.when(self.get("staffList").sync()).then(function() {
                                $("#windowImageUpload").data("kendoWindow").close();
                                kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success"); 
                        })
                            
                        })
                     }
            },

            cancel: function() {
                $("#windowImageUpload").data("kendoWindow").close();
            },

            showImage: function() {

                    var file=$('.div-item-list-image input:file').prop("files")[0];
                    if(file) {
                        var reader = new FileReader();

                        reader.onload = function (e) {
                            $('.div-item-list-image img').attr('src', e.target.result);
                        }

                        reader.readAsDataURL(file);
                    
                    }
                    
                },
        }

        });
    }

    var staffModel=null;

    // Truck Schdeule Model
    var ScheduleModel = function() { 

        return kendo.observable({
        
        init: function() {
             var deferred = $.Deferred();
             var self=this;
             
             this.set("scheduleList", ScheduleDataSource(appModel));
             this.set("staffList", StaffDataSource());

             this.set("overrideBulkMenu", {__type:"Pointer",objectId:null,className:"MenuHeader"} );
             
             // $.when(this.get("scheduleList").fetch(),this.get("staffList").fetch())
            $.when(this.get("staffList").fetch())
                .then(function() {
                    deferred.resolve();
                });

             if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    self.set("currentLocation.lat",position.coords.latitude);
                    self.set("currentLocation.lng",position.coords.longitude);
                });
             }

            this.set("bulkMenuHeaders", 
                function(){
                    var bulkMenuHeaderArray = [];

                    _.each(this.get("menuHeaders").data(), function(aMenuHeader){
                        //return all the bulk menu headers
                        if (aMenuHeader.get("isBulk") == true)
                            bulkMenuHeaderArray.push(aMenuHeader);
                    });
                    return bulkMenuHeaderArray;
            });

            return deferred.promise();
        },

        attachValidator: function() {

            var self=this;

            this.validator=$("#frmScheduleRecordEdit").kendoValidator({
                validateOnBlur: false,
                rules: {
                            greaterthanstart: function (input) {

                                if (input.is("[data-greaterthanstart-msg]") && input.val() != "") {                                    
                                    return self.editorModel.endDateTime>self.editorModel.startDateTime;
                                }

                                return true;
                            },

                            greaterthanorequaltoday: function(input) {
                                if (input.is("[data-greaterthanorequaltoday-msg]") && input.val() != "" && !self.editorModel.objectId) {                                    
                                    var today=new Date();
                                    
                                    return self.editorModel.startDateTime>=today;
                                }

                                return true;
                            },

                            truckunassigned: function(input) {

                                var unassigned=true;

                                if(input.is("[data-truckunassigned-msg]") && input.val() && self.editorModel.startDateTime && self.editorModel.endDateTime) {

                                    var data=$('#scheduleCalendar').fullCalendar('clientEvents');
                                    for(var i=0;i<data.length;i++) {

                                        var dataItem=self.scheduleList.get(data[i].id);

                                        if( data[i].id!=self.editorModel.objectId && 
                                            self.editorModel.startDateTime<=data[i].end.toDate() && 
                                            self.editorModel.endDateTime >= data[i].start.toDate() && 
                                            self.editorModel.truck.objectId==dataItem.truck.objectId)

                                            unassigned=false;

                                    }

                                    return unassigned;
                                }

                                return true;
                            },


                        }
            }).data("kendoValidator");

        },

        initCalendar:function() {
            
            // create the calendar and set data
            var self=this;
            var events=[];
            var data=this.get("scheduleList").data();

            //calculate the height of the calendar widget
            if ( $('#appFooter').is(":visible") )
                desiredHeight = window.innerHeight - $('#scheduleCalendar').offset().top - $('#appFooter').height() -50; //50 is the fudge factor
            else
                desiredHeight = window.innerHeight - $('#scheduleCalendar').offset().top - 70; //

            $('#scheduleCalendar').fullCalendar({
                
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'agendaDay,agendaWeek,month'
                },
                defaultView: 'agendaWeek',
                defaultDate: moment().format("YYYY-MM-DD"),
                editable: true,
                selectable: true,
                selectHelper: true,
                unselectAuto: false,
                timezone:"local",
                allDaySlot:false,
                contentHeight:desiredHeight,  //this enables the widget to have in-place scrolling
                ignoreTimezone:false,
                //theme: true,

                dayRender: function(date,cell) {

                    // if (moment(date.format("YYYY-MM-DD")).isBefore(moment().format("YYYY-MM-DD")))
                    //     cell.css("background-color","LightGray")

                },

                events: function(start, end, timezone, callback) {
                    var events = [];

                    //in this Trcked Admin console we want to see the same event if it overlaps the day (starts before and ends after midnight)
                    //so we have to specifically request this from the API by settings showRecurringDuplicate = true
                    
                    start.local(); //ensure that the date is in local format
                    end.local(); //ensure that the date is in local format

                    $.when( scheduleModel.get("scheduleList").read({
                                                                        fromTimeStamp: start.toISOString(), 
                                                                        toTimeStamp: end.toISOString(), 
                                                                        truckId:self.selectedTruckSchedule,
                                                                        showRecurringDuplicate:true 
                                                                    }) 
                    ).then(function(){
                        // console.log(scheduleModel.get("scheduleList").data());
                        _.each(scheduleModel.get("scheduleList").data(), function(aScheduleRecord){
                            events.push({
                                id: aScheduleRecord.objectId,
                                title: aScheduleRecord.name,
                                start: aScheduleRecord.startDateTime,
                                end: aScheduleRecord.endDateTime,
                                backgroundColor: aScheduleRecord.isPrivate?"Crimson":"DeepSkyBlue"
                                
                            }); 
                        });
                        callback(events);
                    }, function(error){
                        kendoNotification.show({title:"Error Loading Schedule",message:"Schedule could not be loaded. Please try again later."},"error");
                    });

                },

                eventClick: function(calEvent, jsEvent, view) {
                    var nowMoment = moment();
                    var eventStart = moment(calEvent.start.local().toDate());
                    var eventEnd = moment(calEvent.end.local().toDate());

                    if (nowMoment.isAfter(eventStart) && nowMoment.isAfter(eventEnd)){
                        kendoNotification.show({title:"Past Event",message:"Event is in the past and can not be edited"},"info");
                    } else {
                        var dataItem=self.scheduleList.get(calEvent.id);
                        var isRecurring=dataItem.get("isRecurring");

                        //set the editor model data
                        self.editorModel.reset();
                        self.editorModel.set("objectId",dataItem.objectId);
                        self.editorModel.set("isPrivate",dataItem.isPrivate);
                        self.editorModel.set("name",dataItem.name);
                        self.editorModel.set("startDateTime",isRecurring?calEvent.start.local().toDate():dataItem.startDateTime);
                        self.editorModel.set("endDateTime",isRecurring?calEvent.end.local().toDate():dataItem.endDateTime);
                        self.editorModel.set("truck",dataItem.truck);
                        self.editorModel.set("overrideMenu",dataItem.overrideMenu);

                        if (!dataItem.overrideBulkMenu)
                            dataItem.set("overrideBulkMenu", {__type:"Pointer", objectId:null, className:"MenuHeader"} );

                        self.editorModel.set("overrideBulkMenu",dataItem.overrideBulkMenu);
                        self.editorModel.set("editRecurringEvent",dataItem.isRecurring);
                        self.editorModel.set("recurrence",isRecurring?"0":dataItem.recurrence);
                        self.editorModel.set("recurrenceEndDate",isRecurring?null:dataItem.recurrenceEndDate);
                        self.editorModel.set("recurrenceConstraints",isRecurring?[]:dataItem.recurrenceConstraints)
                        self.editorModel.set("locationData",dataItem.locationData);
                        self.editorModel.set("social",dataItem.social);
                        self.editorModel.set("crewData",dataItem.crewData);                
                        self.editorModel.setCrewData(dataItem.crewData.members);
                        
                        $("#btnEventDelete").show();
                        $("#tabstrip").data("kendoTabStrip").select(0);
                        
                        $("#lstTruck").data("kendoDropDownList").enable(self.selectedTruckSchedule?false:true);

                        toggleEditor();
                    };
                },

                dayClick: function(date, jsEvent, view) {

                    //self.addRecord(date,date);
                },
                loading:function(isLoading, view){
                    // console.log(isLoading);
                    // if (isLoading == false )  //finished loading
                    //     setScrollingHeight($('#scheduleCalendar'));
                },
                select: function(start,end) {

                    if (moment(start.format("YYYY-MM-DD")).isBefore(moment().format("YYYY-MM-DD"))) {
                        kendoNotification.show({title:"Invalid Date",message:"Cannot create events in the past!"},"error");
                        $('#scheduleCalendar').fullCalendar('unselect');
                    }
                    else
                        self.addRecord(start.local().toDate(),end.local().toDate());
                },

                eventDrop: function(event, delta, revertFunc) {
                    self.modifiedEventSave(event, delta, revertFunc);
                },

                eventResize: function(event, delta, revertFunc) {
                    self.modifiedEventSave(event, delta, revertFunc);
                }

            });

        },

        setViewState: function() {

            if(!appModel.modelParams) return;
            var params=appModel.modelParams;
            var dataItem=this.scheduleList.get(params.objectId);

            $('#scheduleCalendar').fullCalendar("gotoDate",moment(params.startDateTime));

            this.set("editorModel.objectId",params.objectId);
            this.set("editorModel.isPrivate",dataItem.isPrivate);

            this.editorModel.set("name",dataItem.name);
            this.editorModel.set("startDateTime",params.startDateTime);
            this.editorModel.set("endDateTime",params.endDateTime);
            this.editorModel.set("truck",dataItem.truck);
            this.editorModel.set("editRecurringEvent",params.isRecurring);
            this.editorModel.set("recurrence",params.isRecurring?"0":dataItem.recurrence);
            this.editorModel.set("recurrenceEndDate",params.isRecurring?null:dataItem.recurrenceEndDate);
            this.editorModel.set("recurrenceConstraints",params.isRecurring?[]:dataItem.recurrenceConstraints)
            this.editorModel.set("locationData",dataItem.locationData);
            this.editorModel.set("social",dataItem.social);
            this.editorModel.set("crewData",dataItem.crewData);
            this.editorModel.setCrewData(dataItem.crewData.members);

            $("#btnEventDelete").show();
            $("#tabstrip").data("kendoTabStrip").select(0);
            toggleEditor();

        },

        editorModel: {
            "objectId" : null,
            "isPrivate": false,
            "truck":{__type:"Pointer",objectId:null,className:"Truck"},
            "overrideMenu": {__type:"Pointer",objectId:null,className:"MenuHeader"},
            "overrideBulkMenu": {__type:"Pointer",objectId:null,className:"MenuHeader"},
            "name": null,
            "startDateTime": null,
            "endDateTime" : null,
            "editRecurringEvent": false,
            "recurrence" :  0,
            "recurrenceEndDate" : null,
            "recurrenceConstraints": [],
            "locationData" : null,
            //"crewMessageText": null,
            //"crewMessageTextLeadHours":0,
            "crewData" : {members:[]},
            //"social": {autoTweetPost:false,postLead:"0",twitter:{post:null,place:{id:null,name:"",address:""}}, facebook:{post:null,url:null,place:{id:"",name:"",address:""}}}
            
            reset: function() {
                this.set("objectId",null);
                this.set("isPrivate",false);
                this.set("truck",{__type:"Pointer",objectId:null,className:"Truck"});
                this.set("name",null);
                this.set("startDateTime",null);
                this.set("endDateTime",null);
                this.set("editRecurringEvent",false);
                this.set("recurrence",0);
                this.set("menuHeaders",[]);
                this.set("recurrenceEndDate",null);
                this.set("recurrenceConstraints",[]);
                this.set("locationData",null);
                this.set("crewData",{members:[]});
                this.set("overrideMenu",{__type:"Pointer", objectId:null, className:"MenuHeader"});
                this.set("overrideBulkMenu",{__type:"Pointer", objectId:null, className:"MenuHeader"});
                //this.set("social", {autoTweetPost:true,postLead:"0",twitter:{post:null,place:{id:null,name:"",address:""}}, facebook:{post:null,url:null,place:{id:"",name:"",address:""}}});
                
            },

            
            setCrewData: function(data) {
                    
                    this.set("crewData",{members:[]});
                    
                    var crewMembersData=scheduleModel.get("staffList").data();

                    // add all the crew members first
                    for (var i = 0; i < crewMembersData.length; i++) {
                        this.get("crewData.members").push({
                                        "id":crewMembersData[i].objectId,
                                        "name" : crewMembersData[i].firstName+" "+ crewMembersData[i].lastName,
                                        "isChecked": false, 
                                    });
                    }

                    if(data) {
                        for(var i=0; i<data.length;i++) {
                            for (var j=0;j<this.get("crewData.members").length;j++) {
                                if(data[i].id==this.get("crewData.members")[j].id)
                                    this.get("crewData.members")[j].set("isChecked",true);

                            }
                        }
                    }
            },

            displayLocation: function() {

                var locationData=this.get("locationData");

                if(locationData) {
                    return "<img src='https://maps.googleapis.com/maps/api/staticmap?center="+locationData.lat+","+locationData.lng+
                    "&zoom=12&size=100x100'></img>&nbsp&nbsp;<strong>"+locationData.name+"</strong>"

                }

                return "";
               
            },

            showRecurrenceEndDate: function() {
                return this.get("recurrence")>0?true:false;
            },

            testEndDateTime: function() {
                
                if(this.editorModel.startDateTime && this.editorModel.endDateTime && this.editorModel.endDateTime.getTime()<=this.editorModel.startDateTime.getTime()) {
                    
                    var endDate=new Date(this.editorModel.startDateTime.getTime());
                    endDate.setHours(endDate.getHours()+1);
                    this.set("editorModel.endDateTime",endDate);

                }
            },

            isTabsVisible: function() {
                return this.get("truck.objectId") && this.get("name") ? true : false;
            }
        },

        scheduleList: null,
        selectedTruckSchedule: null,
        truckList: TruckDataSource(appModel),
        // overrideMenu: {__type:"Pointer", objectId:null, className:"MenuHeader"},
        menuHeaders: MenuHeaderDataSource(appModel),
        recurrence: [{text:"None",value:0},{text:"Daily",value:1},{text:"Weekly",value:2},{text:"Bi-weekly",value:3},{text:"Monthly",value:4}],
        place: null,
        staffList: null,
        currentLocation: {lat:"29.7601927",lng:"-95.36938959999998"},
        leadTimes: [{text:"On Event Start",value:"0"},{text:"15 Minutes",value:"15"},{text:"30 Minutes",value:"30"},{text:"45 Minutes",value:"45"},
                    {text:"1 Hour",value:"60"},{text:"2 Hours",value:"120"},{text:"3 Hours",value:"180"},{text:"4 Hours",value:"240"},{text:"5 Hours",value:"300"}],        
        validator:null,
        
        
        closeMapWindow: function() {

            $("#mapWindow").data("kendoWindow").close();
                
        },

        // returns the contents for the help section from a html file
        helpContent: function() {       

            var self=this;
            
            $.ajax({
                url: "./help/schedule.htm"

            }).success(function(data) {
               self.set ("helpContent",data);
            });
        },

        // show map
        showMap: function(e) {

            var self=this;
            var lookupSocialPlaces=false;

            $(".map-controls").show();
            $("#mapCanvas").css({left:"0px"});
            $("#inputScheduleMapSearch").val("");

            var mapWindow = $("#windowScheduleMap");
            
            if(!mapWindow.data("kendoWindow")) {
                mapWindow.kendoWindow({
                    maxWidth: "750px",
                    maxHeight: "600px",
                    width:"50%",
                    height:"60%",
                    title: "Select Place",
                    modal: true,

                    open: function () {
                        // this.wrapper.css({ top: 100, left: 100 });
                        // this.center();
                        this.wrapper.css({ top: 100, left: $('#appContentEditContainer').width()/2});
                    }
                });
            }

            mapWindow.data("kendoWindow").open();

            // load the map
            var lat=this.editorModel.get("locationData")?parseFloat(this.editorModel.get("locationData").lat):this.get("currentLocation.lat");
            var lng=this.editorModel.get("locationData")?parseFloat(this.editorModel.get("locationData").lng): this.get("currentLocation.lng");

            var mapOptions = {
                center: new google.maps.LatLng(lat, lng),
                zoom: 13
            };

            var map = new google.maps.Map(document.getElementById('canvasScheduleMap'), mapOptions);

            var input = document.getElementById('inputScheduleMapSearch');
            //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

            var autocomplete = new google.maps.places.Autocomplete(input);
            autocomplete.bindTo('bounds', map);

            var infowindow = new google.maps.InfoWindow();
            var marker = new google.maps.Marker({
                            map: map,
                            anchorPoint: new google.maps.Point(0, -29)
                        });

            google.maps.event.addListener(autocomplete, 'place_changed', function() {
                infowindow.close();
                marker.setVisible(false);
                var place = autocomplete.getPlace();
                if (!place.geometry) {
                  return;
                }

                // If the place has a geometry, then present it on a map.
                if (place.geometry.viewport) {
                  map.fitBounds(place.geometry.viewport);
                } else {
                  map.setCenter(place.geometry.location);
                  map.setZoom(17); 
                }
                marker.setIcon(/** @type {google.maps.Icon} */({
                  url: place.icon,
                  size: new google.maps.Size(71, 71),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(17, 34),
                  scaledSize: new google.maps.Size(35, 35)
                }));
                marker.setPosition(place.geometry.location);
                marker.setVisible(true);

                var address = '';
                if (place.address_components) {
                  address = [
                    (place.address_components[0] && place.address_components[0].short_name || ''),
                    (place.address_components[1] && place.address_components[1].short_name || ''),
                    (place.address_components[2] && place.address_components[2].short_name || '')
                  ].join(' ');
                }

                infowindow.setContent('<div style="width:150px;height:125px"><strong>' + place.name + '</strong><br>' + 
                    address +'<button id="selectPlace" class="btn btn-xs btn-primary" style="display:block;margin-top:10px">Select</button>');
                infowindow.open(map, marker);

                $(document).one("click","#selectPlace",function() {
                    self.selectPlace(lookupSocialPlaces);
                })

                self.set("place",place);


              });

            google.maps.event.addListener(marker, 'click', function() {
                infowindow.open(map, this);
            });

        },

        selectPlace: function(lookupSocialPlaces) {

            var data={};
            var selectedPlace=this.get("place");

            data.placeID=selectedPlace.place_id;
            data.name=selectedPlace.name;
            data.lat=selectedPlace.geometry.location.lat();
            data.lng=selectedPlace.geometry.location.lng();

            this.editorModel.set("locationData",data);

            if(lookupSocialPlaces) {
                $(".map-controls").hide();
                $("#mapCanvas").css({left:"-1000px"});
                $(".divMapPlaceSearch").show();

                this.searchPlaces();
            }

            else
                $("#windowScheduleMap").data("kendoWindow").close();
            
        },

        onTruckChange: function() {

            if(!this.editorModel.truck.objectId) return;

            var staff=this.staffList.data();
            var crewMembers=this.editorModel.crewData.members;

            //reset crew members selection
            for(var i=0;i<crewMembers.length;i++) {
                this.get("editorModel.crewData.members")[i].set("isChecked",false);
            }

            for(var i=0;i<staff.length;i++) {
                if(staff[i].truck.objectId && staff[i].truck.objectId==this.editorModel.truck.objectId) {
                    for(j=0;j<crewMembers.length;j++) {
                        if(crewMembers[j].id==staff[i].objectId)
                            this.get("editorModel.crewData.members")[j].set("isChecked",true);
                    }
                }
            }

        },

        onTruckScheduleChange: function() {
            $('#scheduleCalendar').fullCalendar('refetchEvents');

        },
       
        // CRUD operations
        addRecord: function(start,end) {
            
            //set the editor model data

            this.editorModel.reset();

            $("#lstTruck").data("kendoDropDownList").enable(this.selectedTruckSchedule?false:true);

            if(this.selectedTruckSchedule)
                this.editorModel.set("truck",{__type:"Pointer",objectId:this.selectedTruckSchedule,className:"Truck"});

            this.editorModel.set("startDateTime",start);
            this.editorModel.set("endDateTime",end);
            
            this.editorModel.setCrewData([]);

            $("#tabstrip").data("kendoTabStrip").select(0);
            toggleEditor();
             
        },

        editRecord: function() {
            
            //set the editor model data
            toggleEditor();

        },

        modifiedEventSave: function(event, delta, revertFunc) {
            var dataItem = this.get("scheduleList").get(event.id);
            if (dataItem.get("recurrence") == 0){
                dataItem.startDateTime=event.start.local().toDate();
                dataItem.endDateTime=event.end.local().toDate();
                dataItem.dirty=true;
                $.when(this.get("scheduleList").sync())
                .then(function(){
                    kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");
                }, function(errorObject){
                    var jsonObj = JSON.parse(errorObject.error);

                    kendoNotification.show({message:jsonObj.message, title:"Event NOT updated"}, "error");
                    revertFunc(); //undo the move    
                });
            } else {
                kendoNotification.show({title:"Event can not be updated", message:"Please edit recurring event manually"},"info");
                revertFunc(); //undo the move
            };

        },

        shareSocial: function(e) {
            var params={};
            var postText="Hey Guys, we are having a "+ this.editorModel.name+ " on {DATE_TIME}. Come and join us!";

            params.facebookPost=postText;
            params.twitterPost=postText;
            params.date=moment(this.editorModel.startDateTime).format("dddd, MMMM Do YYYY, h:mm a");
            params.isEvent=true;
            params.parentColl={id:this.editorModel.objectId,collName:"truckScheduleEvents",description:this.editorModel.name}
            //params.locationData = this.editorModel.locationData;

            if(this.editorModel.locationData)
                params.locationData=this.editorModel.locationData;
            
            appModel.socialWindow.open(params);

                    
        },

        saveScheduleRecord: function(e) {
            
            var addNew=false;
            var self=this;
            var btnSave=$(".btn-group.dropup > button:first-child");;

            e.preventDefault();

            // validate
             if(this.validator.validate()==false){
                return;
             }

             btnSave.button("loading");
             $(".btn-group.dropup > button.dropdown-toggle").attr("disabled","disabled");

             //set the crew members to save
             var selectedCrew=[];
             var crewList=this.editorModel.get("crewData.members");

             for(var i=0; i< crewList.length;i++) {
                if(crewList[i].isChecked==true)
                    selectedCrew.push(crewList[i]);
             }
  
             this.editorModel.crewData.members=selectedCrew;

             //save record
             if (this.editorModel.objectId!=null) {

                var dataItem = this.get("scheduleList").get(this.editorModel.objectId);

                if(this.editorModel.get("editRecurringEvent")) {

                    var saveType=0;

                    $.when(kendo.ui.ExtYesNoCancelDialog.show({ 
                        title: "Confirm Save", message:"Update this event only or ALL events in the future?" ,icon:"k-ext-warning",
                        buttons:[{name:"This Event"},{name:"All Events"},{name:"Cancel"}]

                        }

                    )).done(function (response) {
                        //get a copy of the JSON before we start modifying it
                        var savedJSON = self.editorModel.toJSON();

                        if(response.button=="Cancel") 
                            return;
                        else if(response.button=="Yes") {
                            dataItem.recurrenceConstraints.push({action:"SKIP",date:self.editorModel.startDateTime});
                            //in the case of a recurring item we do not want to update the start and end date/time
                            delete dataItem.startDateTime;
                            delete dataItem.endDateTime;

                            //for the new item, do not copy over any recurrence data
                            savedJSON.recurrence = 0;
                            savedJSON.editRecurringEvent = false;
                            savedJSON.recurrenceConstraints = [];
                            
                        } else {
                            //if the startDateTime in the editor is equal to the startDateTime of the event then no need to split
                            // the event into two. Just delete it (and we will re-create a new one)

                            if (dataItem.get("startDateTime").getTime() == self.editorModel.startDateTime.getTime())
                                self.get("scheduleList").remove(dataItem);
                            else 
                                dataItem.get("recurrenceConstraints").push({action:"STOP",date:self.editorModel.startDateTime});
                            
                            //in the case of a recurring item we do not want to update the start and end date/time
                            delete dataItem.startDateTime;
                            delete dataItem.endDateTime;

                            savedJSON.recurrence = dataItem.get("recurrence");

                        }

                        dataItem.dirty=true;

                        delete savedJSON.objectId;
                        self.get("scheduleList").add(savedJSON);

                        self.finishSave(addNew,btnSave,e);
                    })

                }

                else {
                    var savedJSON = self.editorModel.toJSON();
                    
                    $.extend(dataItem,savedJSON);
                    dataItem.dirty=true;
                    this.finishSave(addNew,btnSave,e);
                }

            }

            else {
                this.get("scheduleList").add(this.editorModel.toJSON());
                addNew=true;    
                this.finishSave(addNew,btnSave,e);
            }

        },

        finishSave: function(addNew,btnSave,ev) {

            var self=this;

            $.when(this.get("scheduleList").sync())
            .then(function() {
                
                var event={};
                
                kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");
                // add/update the calendar
                $('#scheduleCalendar').fullCalendar('refetchEvents');

                // share post
                if($(ev.target).attr("data-save-share")){
                    self.shareSocial();    
                }

            }, function(errorResponse) {
                var jsonObj = JSON.parse(errorResponse.error);
                kendoNotification.show({message:jsonObj.message, title:"Event NOT saved"}, "error");
            }).always(function(){
                btnSave.button("reset");
                $(".btn-group.dropup > button.dropdown-toggle").removeAttr("disabled");

                $("#btnEventDelete").hide();
                toggleEditor();

                $('#scheduleCalendar').fullCalendar('unselect');
            });
        },

        cancelSaveScheduleRecord: function(e) {
            this.validator.hideMessages();
            $("#btnEventDelete").hide();
            toggleEditor();
            //check to see if the map window is open, if it is close it too
            var mapWindow = $("#windowScheduleMap").data("kendoWindow");
            if (mapWindow)
                mapWindow.close(); //if it is all ready closed, this wont matter

            $('#scheduleCalendar').fullCalendar('unselect');
        },

        deleteScheduleRecord: function() {
           
            var self=this;
            var dataItem = self.get("scheduleList").get(self.editorModel.objectId);

            if(this.editorModel.get("editRecurringEvent")) {

                $.when(kendo.ui.ExtYesNoCancelDialog.show({ 
                    title: "Confirm Save", message:"Delete this event only or ALL events in the future?" ,icon:"k-ext-warning",
                    buttons:[{name:"This Event"},{name:"All Events"},{name:"Cancel"}]

                    }

                )).done(function (response) {
                        if(response.button=="Cancel") 
                            return;
                        else if(response.button=="Yes") {
                            dataItem.recurrenceConstraints.push({action:"SKIP",date:self.editorModel.startDateTime});
                        }
                        else {

                            //the user is deleting a recurring event.
                            //In this case the deletion could be deleting ALL the events or just deleting events 
                            // in the future (leaving some of the events in the schedule)
                            //if the user is just deleting some of the future events then we need to 
                            //just do a STOP but if all are being deleting then we just need to blow away the 
                            //record from the db
                            if (dataItem.get("startDateTime").getTime() == self.editorModel.startDateTime.getTime())
                                self.get("scheduleList").remove(dataItem);
                            else  
                                dataItem.recurrenceConstraints.push({action:"STOP",date:self.editorModel.startDateTime});
                            
                        }

                        //in the case of a recurring item we do not want to update the start and end date/time
                        delete dataItem.startDateTime;
                        delete dataItem.endDateTime;
                            
                        dataItem.dirty=true;

                        $.when(self.get("scheduleList").sync()).then(function() {
                           kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success");
                                                               
                        },function(){
                            kendoNotification.show(appDefaults.notificationMessages.deleteError,"error");

                        }).always(function(){
                            $("#btnEventDelete").hide();
                            toggleEditor();
                            $('#scheduleCalendar').fullCalendar('refetchEvents');
                        })
                        
                    })

            }

            else {

                $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Delete <span class='badge alert-danger'>"+dataItem.name+"</span>",icon:"k-ext-warning" }))
                .done(function (response) {
                        if(response.button=="Yes") {
                            self.get("scheduleList").remove(dataItem);

                            $.when(self.get("scheduleList").sync()).then(function() {
                               kendoNotification.show(appDefaults.notificationMessages.deleteSuccess,"success");
                                                         
                            },function() {
                                kendoNotification.show(appDefaults.notificationMessages.deleteError,"error");

                            }).always(function(){
                                $("#btnEventDelete").hide();
                                toggleEditor();
                                $('#scheduleCalendar').fullCalendar('refetchEvents');         
                            });
                        };
                    });
                    


            }

        }

    });
    }

    var scheduleModel=null;

    var SalesBreakdownModel = function(){
        return kendo.observable({
            init:function(){

            },
            setViewState:function(){
                //default todays dates

                start = moment().startOf('day');
                this.set("targetDate", start.toDate());

                //if only one location then default it
                if (this.get("truckList").length == 1)
                    this.set("selectedTruck", this.get("truckList").data[0]);

            },


            executeSalesBreakdownReport: function(){
                //validate the reports params
                self = this;
                var validator = $("#reportParams").kendoValidator().data('kendoValidator');
                if (validator.validate()) {

                    var testMoment = new moment(this.startDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Sales Breakdown",message:"Please specify valid Date"},"error");
                        return;
                    }
                        
                    var data = {};
                    $('.userPrompt').hide();
                    $('#pleaseWait').show();

                    this.set("runReportEnabled", false);

                    data.targetDate = moment(this.targetDate).format();
                    data.truck=appModel.getParsePointer({objectId:this.selectedTruck}, "Truck");

                    var ajaxURL= "/parse/functions/executeSalesBreakdownReport";

                    $.ajax({
                        url: ajaxURL,
                        dataType: "json",
                        type:'POST',
                        headers: appModel.parse._headers,

                        data: kendo.stringify(data),
                        
                        success: function(httpResponse) {
                            if (httpResponse.result.noData == true){
                                $('.userPrompt').show();
                                // $('#summaryView').hide();
                                kendoNotification.show({title:"Sales Breakdown",message: 'No Data Found'},"info");
                                return true;
                            }

                            self.set("resultObject", httpResponse.result);
                            // $('#summaryView').show();

                            data.labels = [];
                            data.series = [{name:'Running Total', data:[]}, {name:'Ticket Count', data:[]}];
                            
                            var shiftStarted = false;

                            //delete trailing $0 entries
                            for (var i = self.get("resultObject").timePoints.length; i > 0; i--){
                                var arrayLength = self.get("resultObject").timePoints.length; 
                                console.log(arrayLength);
                                console.log(i);
                                var aTimePoint = self.get("resultObject").timePoints[arrayLength-1];
                                
                                if (aTimePoint.timePointTotal == 0){
                                    //remove the last element of the array
                                    self.get("resultObject").timePoints.pop();
                                } else {
                                    break;
                                }
                            };

                            _.each(self.get("resultObject").timePoints, function(aTimePoint){
                                if (aTimePoint.totalTickets > 0)
                                    shiftStarted = true;

                                if (shiftStarted == true){
                                    var aStartMoment = new moment(aTimePoint.startTime);
                                    var aEndMoment = new moment(aTimePoint.endTime);
                                    data.labels.push(aEndMoment.add(1, 'seconds').format('h:mmA'));
                                    data.series[0].data.push(aTimePoint.timePointTotal);
                                    // data.series[1].data.push(aTimePoint.totalTickets);
                                };

                            });

                            new Chartist.Bar('#salesBreakdownChart', {
                              labels: data.labels,
                              series: data.series
                            }, {
                                height:"400px",
                                series:{
                                },

                                plugins: [
                                    Chartist.plugins.tooltip({
                                        transformTooltipTextFnc:function(value){
                                            return kendo.toString(Number(value), "c");
                                        }
                                    }),
                                ]
                            });
                            
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            var errorObj = jqXHR.responseJSON;
                            kendoNotification.show({title:"Sales Breakdown Report",message: errorObj.error.error},"error");
                            $('.userPrompt').show();
                            $('#summaryView').hide();
                            // $('#terminalSummaryView').hide();
                        },

                        complete: function() {
                            $('#pleaseWait').hide();
                            self.set("runReportEnabled", true);
                        }


                    });
                };
            },
            truckList: appModel.parse.truckList,
            selectedTruck:null,
            targetDate:null,
            runReportEnabled:true,
            resultObject:{
                timePoints:[]
            }

        });
    };

    var TxVolumeReportsModel = function(){
        return kendo.observable({
            init:function(){

            },
            setViewState:function(){
                //default the duration drop down list to 'Custom'
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("1"); //custom
                //default todays dates

                start = moment().startOf('day');
                this.set("startDateTime", start.toDate());

                end = moment().endOf('day');
                this.set("endDateTime", end.toDate());

                //this default sort field is quantity
                this.set("currentSortField", 'quantity');

            },
            onDurationChange:function(eventObj){
                switch( parseInt(eventObj.sender.value()) ){
                    case 1:
                        //today
                        start = moment().startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 2:
                        //yesterday
                        start = moment().subtract('day', 1).startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('day', 1).endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 3:
                        //this week
                        start = moment().startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 4:
                        //last week
                        start = moment().subtract('week', 1).startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('week', 1).endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 5:
                        //this month
                        start = moment().startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 6:
                        //last month
                        start = moment().subtract('month', 1).startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('month', 1).endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 7:
                        this.set("startDateTime", null);
                        this.set("endDateTime", null);
                }
            },
            onFromDateChange: function(eventObj){
                if (!this.endDateTime){
                    //if the user has not selected a date time you should default
                    var eod = new Date(this.startDateTime);
                    eod.setHours(23,59,59);

                    this.set("endDateTime", eod);
                };
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom
            },

            onToDateChange:function(eventObj){
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom  
            },

            sortResults: function(e){
                var nodeClicked = e.currentTarget;
                console.log(nodeClicked.text);

                switch (nodeClicked.id){

                    case 'colHeaderQty':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByAmountDesc", false); 
                        this.set("isSortedByAmountAsc", false); 
                        this.set("isSortedByPercentDesc", false); 
                        this.set("isSortedByPercentAsc", false);                         
                        
                        if (this.isSortedByQtyDesc == false && this.isSortedByQtyAsc == false)
                            this.set("isSortedByQtyDesc", true); 
                        else {
                            this.set("isSortedByQtyDesc", !this.isSortedByQtyDesc); 
                            this.set("isSortedByQtyAsc", !this.isSortedByQtyAsc); 
                        };
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'quantity');
                        
                        if (this.isSortedByQtyDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);
                        this.set("currentSortField", 'quantity');
                        
                        break;
                    case 'colHeaderAmount':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByPercentDesc", false); 
                        this.set("isSortedByPercentAsc", false);  
                        this.set("isSortedByQtyDesc", false); 
                        this.set("isSortedByQtyAsc", false); 

                        if (this.isSortedByAmountDesc == false && this.isSortedByAmountAsc == false)
                            this.set("isSortedByAmountDesc", true); 
                        else {
                            this.set("isSortedByAmountDesc", !this.isSortedByAmountDesc); 
                            this.set("isSortedByAmountAsc", !this.isSortedByAmountAsc); 
                        }
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'amount');
                        
                        if (this.isSortedByAmountDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);
                        this.set("currentSortField", 'amount');
                        break;
                    case 'colHeaderRevenuePercent':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByAmountDesc", false); 
                        this.set("isSortedByAmountAsc", false); 
                        this.set("isSortedByQtyDesc", false); 
                        this.set("isSortedByQtyAsc", false); 

                        if (this.isSortedByPercentDesc == false && this.isSortedByPercentAsc == false)
                            this.set("isSortedByPercentDesc", true); 
                        else {
                            this.set("isSortedByPercentDesc", !this.isSortedByPercentDesc); 
                            this.set("isSortedByPercentAsc", !this.isSortedByPercentAsc); 
                        }
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'percentOfTotal');
                        
                        if (this.isSortedByPercentDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);

                        this.set("currentSortField", 'percentOfTotal');
                        break;
                };
            },

            executetxVolumeReport: function(){
                //validate the reports params
                self = this;
                var validator = $("#reportParams").kendoValidator().data('kendoValidator');
                if (validator.validate()) {

                    var testMoment = new moment(this.startDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Top 5",message:"Please specify valid From Date"},"error");
                        return;
                    }
                        
                    var testMoment = new moment(this.endDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Top 5",message:"Please specify valid To Date"},"error");
                        return;
                    };

                    var data = {};
                    $('.userPrompt').hide();
                    $('#pleaseWait').show();
                    $('#summaryView').hide();
                    // $('#terminalSummaryView').hide();

                    this.set("runReportEnabled", false);

                    data.startDateTime = this.startDateTime;
                    data.endDateTime = this.endDateTime;

                    data.vendor=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
                    if (this.selectedTruck)
                        data.truck=appModel.getParsePointer({objectId:this.selectedTruck}, "Truck");


                    var ajaxURL= "/parse/functions/executetxVolumeReport";

                    $.ajax({
                        url: ajaxURL,
                        dataType: "json",
                        type:'POST',
                        headers: appModel.parse._headers,

                        data: kendo.stringify(data),
                        
                        success: function(httpResponse) {
                            if (httpResponse.result.totalCount == 0){
                                $('.userPrompt').show();
                                $('#summaryView').hide();
                                kendoNotification.show({title:"Transaction Volume Report",message: 'No Data Found'},"info");
                                return true;
                            }

                            self.set("resultObject", httpResponse.result);
                            $('#summaryView').show();

                            var data = {
                              labels: ['Credit', 'Cash', 'Voucher'],
                              series: [httpResponse.result.creditCount, httpResponse.result.cashCount, httpResponse.result.voucherCount]
                            };

                            var options = {
                              labelInterpolationFnc: function(value) {
                                return value[0]
                              },
                              showLabel:true,
                              height:"500px"
                            };

                            var responsiveOptions = [
                              ['screen and (min-width: 640px)', {
                                chartPadding: 30,
                                labelOffset: 100,
                                labelDirection: 'explode',
                                labelInterpolationFnc: function(value) {
                                  return value;
                                }
                              }],
                              ['screen and (min-width: 1024px)', {
                                labelOffset: 80,
                                chartPadding: 20,
                                labelInterpolationFnc: function(value) {
                                  return value;
                                }
                              }]
                            ];

                            new Chartist.Pie('.ct-chart', data, options, responsiveOptions);
                            
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            var errorObj = jqXHR.responseJSON;
                            kendoNotification.show({title:"Transaction Volume Report",message: errorObj.error.error},"error");
                            $('.userPrompt').show();
                            $('#summaryView').hide();
                            // $('#terminalSummaryView').hide();
                        },

                        complete: function() {
                            $('#pleaseWait').hide();
                            self.set("runReportEnabled", true);
                        }


                    });
                };
            },
            truckList: appModel.parse.truckList,
            selectedTruck:null,
            top5Chart:null,
            durationSelection:[
                {id:1, text:"Today"},
                {id:2, text:"Yesterday"},
                {id:3, text:"This Week"},
                {id:4, text:"Last Week"},
                {id:5, text:"This Month"},
                {id:6, text:"Last Month"},
                {id:7, text:"Custom"}
            ],
            startDateTime:null,
            endDateTime:null,
            runReportEnabled:true,
            resultObject:{
                totalCount:0,
                cashCount:0,
                creditCount:0,
                voucherCount:0
            }

        });
    };

    // var Top5ReportsModel = null;
    // requirejs(['./js/models/top5'], function(top5Module){
    //     Top5ReportsModel = top5Module;
    // });

    var DiscountUsageReportsModel = function(){
        return kendo.observable({
            init:function(){

            },
            setViewState:function(){
                //default the duration drop down list to 'Custom'
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("1"); //custom
                //default todays dates

                start = moment().startOf('day');
                this.set("startDateTime", start.toDate());

                end = moment().endOf('day');
                this.set("endDateTime", end.toDate());

                //this default sort field is quantity
                this.set("currentSortField", 'amount');

            },
            onDurationChange:function(eventObj){
                switch( parseInt(eventObj.sender.value()) ){
                    case 1:
                        //today
                        start = moment().startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 2:
                        //yesterday
                        start = moment().subtract('day', 1).startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('day', 1).endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 3:
                        //this week
                        start = moment().startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 4:
                        //last week
                        start = moment().subtract('week', 1).startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('week', 1).endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 5:
                        //this month
                        start = moment().startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 6:
                        //last month
                        start = moment().subtract('month', 1).startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('month', 1).endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 7:
                        this.set("startDateTime", null);
                        this.set("endDateTime", null);
                }
            },
            onFromDateChange: function(eventObj){
                if (!this.endDateTime){
                    //if the user has not selected a date time you should default
                    var eod = new Date(this.startDateTime);
                    eod.setHours(23,59,59);

                    this.set("endDateTime", eod);
                };
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom
            },

            onToDateChange:function(eventObj){
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom  
            },

            sortResults: function(e){
                var nodeClicked = e.currentTarget;
                console.log(nodeClicked.text);

                switch (nodeClicked.id){

                    case 'colHeaderQty':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByAmountDesc", false); 
                        this.set("isSortedByAmountAsc", false); 
                        this.set("isSortedByPercentDesc", false); 
                        this.set("isSortedByPercentAsc", false);                         
                        
                        if (this.isSortedByQtyDesc == false && this.isSortedByQtyAsc == false)
                            this.set("isSortedByQtyDesc", true); 
                        else {
                            this.set("isSortedByQtyDesc", !this.isSortedByQtyDesc); 
                            this.set("isSortedByQtyAsc", !this.isSortedByQtyAsc); 
                        };
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'quantity');
                        
                        if (this.isSortedByQtyDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);
                        this.set("currentSortField", 'quantity');
                        
                        break;
                    case 'colHeaderAmount':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByPercentDesc", false); 
                        this.set("isSortedByPercentAsc", false);  
                        this.set("isSortedByQtyDesc", false); 
                        this.set("isSortedByQtyAsc", false); 

                        if (this.isSortedByAmountDesc == false && this.isSortedByAmountAsc == false)
                            this.set("isSortedByAmountDesc", true); 
                        else {
                            this.set("isSortedByAmountDesc", !this.isSortedByAmountDesc); 
                            this.set("isSortedByAmountAsc", !this.isSortedByAmountAsc); 
                        }
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'amount');
                        
                        if (this.isSortedByAmountDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);
                        this.set("currentSortField", 'amount');
                        break;
                    case 'colHeaderRevenuePercent':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByAmountDesc", false); 
                        this.set("isSortedByAmountAsc", false); 
                        this.set("isSortedByQtyDesc", false); 
                        this.set("isSortedByQtyAsc", false); 

                        if (this.isSortedByPercentDesc == false && this.isSortedByPercentAsc == false)
                            this.set("isSortedByPercentDesc", true); 
                        else {
                            this.set("isSortedByPercentDesc", !this.isSortedByPercentDesc); 
                            this.set("isSortedByPercentAsc", !this.isSortedByPercentAsc); 
                        }
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'percentOfTotal');
                        
                        if (this.isSortedByPercentDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);

                        this.set("currentSortField", 'percentOfTotal');
                        break;
                };
            },
            executeDiscountUsageReport:function(){
                //validate the reports params
                self = this;
                var validator = $("#reportParams").kendoValidator().data('kendoValidator');
                if (validator.validate()) {

                    var testMoment = new moment(this.startDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Top Modifiers",message:"Please specify valid From Date"},"error");
                        return;
                    }
                        
                    var testMoment = new moment(this.endDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Top Modifiers",message:"Please specify valid To Date"},"error");
                        return;
                    };

                    var data = {};
                    $('.userPrompt').hide();
                    $('#pleaseWait').show();
                    $('#summaryView').hide();
                    // $('#terminalSummaryView').hide();

                    this.set("runReportEnabled", false);

                    data.startDateTime = this.startDateTime;
                    data.endDateTime = this.endDateTime;

                    data.vendor=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
                    if (this.selectedTruck)
                        data.truck=appModel.getParsePointer({objectId:this.selectedTruck}, "Truck");

                    data.sortBy = this.get("currentSortField");
                
                    var ajaxURL= "/parse/functions/executeDiscountUsageReport";

                    $.ajax({
                        url: ajaxURL,
                        dataType: "json",
                        type:'POST',
                        headers: appModel.parse._headers,

                        data: kendo.stringify(data),
                        
                        success: function(httpResponse) {
                            if (httpResponse.result.discounts.length == 0){
                                $('.userPrompt').show();
                                $('#summaryView').hide();
                                kendoNotification.show({title:"Discount Usage",message: 'No Sales Data Found'},"info");
                                return true;
                            }

                            self.set("resultObject", httpResponse.result);
                            self.set("isSortedByAmountDesc", true);
                            self.set("isSortedByAmountAsc", false);
                            self.set("isSortedByQtyDesc", false); 
                            self.set("isSortedByQtyAsc", false); 

                            $('#summaryView').show();

                            var chartData = {series:[], labels:[]};
                            var options = {
                                distributeSeries: true,
                                stretch:true,

                            };
                            var responsiveOptions = [
                                  ['screen and (min-width: 641px)', {
                                    // chartPadding: 10,
                                    // labelOffset: 80,
                                    height:400
                                  }],
                                  ['screen and (max-width: 640px)', {
                                    height:200
                                    // chartPadding: 10,
                                    // labelOffset: 35
                                  }]
                                ];


                            var valuesArray = [];
                            _.each(self.get("resultObject").discounts, function(anItemRecord, index){
                                chartData.series.push(anItemRecord.amount);
                                chartData.labels.push(anItemRecord.description); //
                            });

                            self.set("discountUsageChart", new Chartist.Bar('.ct-chart', chartData, options, responsiveOptions));
                            
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            var errorObj = jqXHR.responseJSON;
                            kendoNotification.show({title:"Discount Usage",message: errorObj.error.error},"error");
                            $('.userPrompt').show();
                            $('#summaryView').hide();
                            // $('#terminalSummaryView').hide();
                        },

                        complete: function() {
                            $('#pleaseWait').hide();
                            self.set("runReportEnabled", true);
                        }


                    });
                };
            },
            truckList: appModel.parse.truckList,
            selectedTruck:null,
            discountUsageChart:null,
            durationSelection:[
                {id:1, text:"Today"},
                {id:2, text:"Yesterday"},
                {id:3, text:"This Week"},
                {id:4, text:"Last Week"},
                {id:5, text:"This Month"},
                {id:6, text:"Last Month"},
                {id:7, text:"Custom"}
            ],
            startDateTime:null,
            endDateTime:null,
            runReportEnabled:true,
            resultObject:{
                discounts:[]
            },
            currentSortField : 'amount',
        });
    };

    var TopModifiersReportsModel = function(){
        return kendo.observable({
            init:function(){

            },
            setViewState:function(){
                //default the duration drop down list to 'Custom'
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("1"); //custom
                //default todays dates

                start = moment().startOf('day');
                this.set("startDateTime", start.toDate());

                end = moment().endOf('day');
                this.set("endDateTime", end.toDate());

                //this default sort field is quantity
                this.set("currentSortField", 'quantity');

            },
            onDurationChange:function(eventObj){
                switch( parseInt(eventObj.sender.value()) ){
                    case 1:
                        //today
                        start = moment().startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 2:
                        //yesterday
                        start = moment().subtract('day', 1).startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('day', 1).endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 3:
                        //this week
                        start = moment().startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 4:
                        //last week
                        start = moment().subtract('week', 1).startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('week', 1).endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 5:
                        //this month
                        start = moment().startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 6:
                        //last month
                        start = moment().subtract('month', 1).startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('month', 1).endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 7:
                        this.set("startDateTime", null);
                        this.set("endDateTime", null);
                }
            },
            onFromDateChange: function(eventObj){
                if (!this.endDateTime){
                    //if the user has not selected a date time you should default
                    var eod = new Date(this.startDateTime);
                    eod.setHours(23,59,59);

                    this.set("endDateTime", eod);
                };
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom
            },

            onToDateChange:function(eventObj){
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom  
            },

            sortResults: function(e){
                var nodeClicked = e.currentTarget;
                console.log(nodeClicked.text);

                switch (nodeClicked.id){

                    case 'colHeaderQty':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByAmountDesc", false); 
                        this.set("isSortedByAmountAsc", false); 
                        this.set("isSortedByPercentDesc", false); 
                        this.set("isSortedByPercentAsc", false);                         
                        
                        if (this.isSortedByQtyDesc == false && this.isSortedByQtyAsc == false)
                            this.set("isSortedByQtyDesc", true); 
                        else {
                            this.set("isSortedByQtyDesc", !this.isSortedByQtyDesc); 
                            this.set("isSortedByQtyAsc", !this.isSortedByQtyAsc); 
                        };
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'quantity');
                        
                        if (this.isSortedByQtyDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);
                        this.set("currentSortField", 'quantity');
                        
                        break;
                    case 'colHeaderAmount':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByPercentDesc", false); 
                        this.set("isSortedByPercentAsc", false);  
                        this.set("isSortedByQtyDesc", false); 
                        this.set("isSortedByQtyAsc", false); 

                        if (this.isSortedByAmountDesc == false && this.isSortedByAmountAsc == false)
                            this.set("isSortedByAmountDesc", true); 
                        else {
                            this.set("isSortedByAmountDesc", !this.isSortedByAmountDesc); 
                            this.set("isSortedByAmountAsc", !this.isSortedByAmountAsc); 
                        }
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'amount');
                        
                        if (this.isSortedByAmountDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);
                        this.set("currentSortField", 'amount');
                        break;
                    case 'colHeaderRevenuePercent':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByAmountDesc", false); 
                        this.set("isSortedByAmountAsc", false); 
                        this.set("isSortedByQtyDesc", false); 
                        this.set("isSortedByQtyAsc", false); 

                        if (this.isSortedByPercentDesc == false && this.isSortedByPercentAsc == false)
                            this.set("isSortedByPercentDesc", true); 
                        else {
                            this.set("isSortedByPercentDesc", !this.isSortedByPercentDesc); 
                            this.set("isSortedByPercentAsc", !this.isSortedByPercentAsc); 
                        }
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'percentOfTotal');
                        
                        if (this.isSortedByPercentDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);

                        this.set("currentSortField", 'percentOfTotal');
                        break;
                };
            },

            executeTopModifiersReport:function(){
                //validate the reports params
                self = this;
                var validator = $("#reportParams").kendoValidator().data('kendoValidator');
                if (validator.validate()) {

                    var testMoment = new moment(this.startDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Top Modifiers",message:"Please specify valid From Date"},"error");
                        return;
                    }
                        
                    var testMoment = new moment(this.endDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Top Modifiers",message:"Please specify valid To Date"},"error");
                        return;
                    };

                    var data = {};
                    $('.userPrompt').hide();
                    $('#pleaseWait').show();
                    $('#summaryView').hide();
                    // $('#terminalSummaryView').hide();

                    this.set("runReportEnabled", false);

                    data.startDateTime = this.startDateTime;
                    data.endDateTime = this.endDateTime;

                    data.vendor=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
                    if (this.selectedTruck)
                        data.truck=appModel.getParsePointer({objectId:this.selectedTruck}, "Truck");

                    data.sortBy = this.get("currentSortField");

                    this.set("isSortedByAmountDesc", true);
                    this.set("isSortedByAmountAsc", false);
                    this.set("isSortedByQtyDesc", false); 
                    this.set("isSortedByQtyAsc", false); 

                    var ajaxURL= "/parse/functions/executeTopModifiersReport";

                    $.ajax({
                        url: ajaxURL,
                        dataType: "json",
                        type:'POST',
                        headers: appModel.parse._headers,

                        data: kendo.stringify(data),
                        
                        success: function(httpResponse) {
                            if (httpResponse.result.modifiers.length == 0){
                                $('.userPrompt').show();
                                $('#summaryView').hide();
                                kendoNotification.show({title:"Modifier Performance",message: 'No Sales Data Found'},"info");
                                return true;
                            }

                            self.set("resultObject", httpResponse.result);
                            $('#summaryView').show();

                            var chartData = {labels:[], series:[]};
                            var options = {
                              seriesBarDistance: 5,
                              onlyInteger: true,
                              axisY:{
                                onlyInteger: true
                              },
                              offset:30,
                              stretch:true,
                              distributeSeries: true,
                              width:"100%",
                              height:"100%",
                              chartPadding: {
                                top: 0,
                                right: 15,
                                bottom: 0,
                                left: 15
                              },
                            };

                            var responsiveOptions = [
                                  ['screen and (min-width: 641px) and (max-width: 1024px)', {
                                    seriesBarDistance: 10,
                                    width:"100%",
                                    height:"100%",
                                    axisX: {
                                      labelInterpolationFnc: function (value) {
                                        return value;
                                      }
                                    }
                                  }],
                                  ['screen and (max-width: 640px)', {
                                    seriesBarDistance: 1,
                                    width:"100%",
                                    height:"100%",
                                    axisX: {
                                      labelInterpolationFnc: function (value) {
                                        return value[0];
                                      }
                                    }
                                  }]
                                ];

                            var valuesArray = [];
                            _.each(self.get("resultObject").modifiers, function(anItemRecord, index){
                                //only display the top 5 in the chart
                                if (index < 5){
                                    chartData.labels.push(anItemRecord.description);
                                    chartData.series.push(anItemRecord[data.sortBy]); //
                                }
                            });

                            self.set("topModifierChart", new Chartist.Bar('.ct-chart', chartData, options, responsiveOptions));
                            
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            var errorObj = jqXHR.responseJSON;
                            kendoNotification.show({title:"Modifier Performance",message: errorObj.error.error},"error");
                            $('.userPrompt').show();
                            $('#summaryView').hide();
                            // $('#terminalSummaryView').hide();
                        },

                        complete: function() {
                            $('#pleaseWait').hide();
                            self.set("runReportEnabled", true);
                        }


                    });
                };
            },
            truckList: appModel.parse.truckList,
            selectedTruck:null,
            topModifierChart:null,
            durationSelection:[
                {id:1, text:"Today"},
                {id:2, text:"Yesterday"},
                {id:3, text:"This Week"},
                {id:4, text:"Last Week"},
                {id:5, text:"This Month"},
                {id:6, text:"Last Month"},
                {id:7, text:"Custom"}
            ],
            startDateTime:null,
            endDateTime:null,
            runReportEnabled:true,
            resultObject:{
                items:[]
            },
            currentSortField : 'quantity',
        });
    };

    var Top5ReportsModel = function(){
        return kendo.observable({
            init:function(){

            },
            setViewState:function(){
                //default the duration drop down list to 'Custom'
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("1"); //custom
                //default todays dates

                start = moment().startOf('day');
                this.set("startDateTime", start.toDate());

                end = moment().endOf('day');
                this.set("endDateTime", end.toDate());

                //this default sort field is quantity
                this.set("currentSortField", 'quantity');

            },
            onDurationChange:function(eventObj){
                switch( parseInt(eventObj.sender.value()) ){
                    case 1:
                        //today
                        start = moment().startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 2:
                        //yesterday
                        start = moment().subtract('day', 1).startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('day', 1).endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 3:
                        //this week
                        start = moment().startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 4:
                        //last week
                        start = moment().subtract('week', 1).startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('week', 1).endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 5:
                        //this month
                        start = moment().startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 6:
                        //last month
                        start = moment().subtract('month', 1).startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('month', 1).endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 7:
                        this.set("startDateTime", null);
                        this.set("endDateTime", null);
                }
            },
            onFromDateChange: function(eventObj){
                if (!this.endDateTime){
                    //if the user has not selected a date time you should default
                    var eod = new Date(this.startDateTime);
                    eod.setHours(23,59,59);

                    this.set("endDateTime", eod);
                };
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom
            },

            onToDateChange:function(eventObj){
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom  
            },

            sortResults: function(e){
                var nodeClicked = e.currentTarget;
                console.log(nodeClicked.text);

                switch (nodeClicked.id){

                    case 'colHeaderQty':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByAmountDesc", false); 
                        this.set("isSortedByAmountAsc", false); 
                        this.set("isSortedByPercentDesc", false); 
                        this.set("isSortedByPercentAsc", false);                         
                        
                        if (this.isSortedByQtyDesc == false && this.isSortedByQtyAsc == false)
                            this.set("isSortedByQtyDesc", true); 
                        else {
                            this.set("isSortedByQtyDesc", !this.isSortedByQtyDesc); 
                            this.set("isSortedByQtyAsc", !this.isSortedByQtyAsc); 
                        };
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'quantity');
                        
                        if (this.isSortedByQtyDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);
                        this.set("currentSortField", 'quantity');
                        
                        break;
                    case 'colHeaderAmount':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByPercentDesc", false); 
                        this.set("isSortedByPercentAsc", false);  
                        this.set("isSortedByQtyDesc", false); 
                        this.set("isSortedByQtyAsc", false); 

                        if (this.isSortedByAmountDesc == false && this.isSortedByAmountAsc == false)
                            this.set("isSortedByAmountDesc", true); 
                        else {
                            this.set("isSortedByAmountDesc", !this.isSortedByAmountDesc); 
                            this.set("isSortedByAmountAsc", !this.isSortedByAmountAsc); 
                        }
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'amount');
                        
                        if (this.isSortedByAmountDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);
                        this.set("currentSortField", 'amount');
                        break;
                    case 'colHeaderRevenuePercent':
                        var listView = $("#tableResults").data("kendoListView");

                        this.set("isSortedByAmountDesc", false); 
                        this.set("isSortedByAmountAsc", false); 
                        this.set("isSortedByQtyDesc", false); 
                        this.set("isSortedByQtyAsc", false); 

                        if (this.isSortedByPercentDesc == false && this.isSortedByPercentAsc == false)
                            this.set("isSortedByPercentDesc", true); 
                        else {
                            this.set("isSortedByPercentDesc", !this.isSortedByPercentDesc); 
                            this.set("isSortedByPercentAsc", !this.isSortedByPercentAsc); 
                        }
                        //_.sortBy always returns in Ascending
                        var array =  _.sortBy(listView.dataItems(), 'percentOfTotal');
                        
                        if (this.isSortedByPercentDesc == true)
                            array.reverse();

                        var dataSource = new kendo.data.DataSource({
                            data: array
                        });

                        listView.setDataSource(dataSource);

                        this.set("currentSortField", 'percentOfTotal');
                        break;
                };
            },

            executeTop5Report: function(){
                //validate the reports params
                self = this;
                var validator = $("#reportParams").kendoValidator().data('kendoValidator');
                if (validator.validate()) {

                    var testMoment = new moment(this.startDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Top 5",message:"Please specify valid From Date"},"error");
                        return;
                    }
                        
                    var testMoment = new moment(this.endDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Top 5",message:"Please specify valid To Date"},"error");
                        return;
                    };

                    var data = {};
                    $('.userPrompt').hide();
                    $('#pleaseWait').show();
                    $('#summaryView').hide();
                    // $('#terminalSummaryView').hide();

                    this.set("runReportEnabled", false);

                    data.startDateTime = this.startDateTime;
                    data.endDateTime = this.endDateTime;

                    data.vendor=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
                    if (this.selectedTruck)
                        data.truck=appModel.getParsePointer({objectId:this.selectedTruck}, "Truck");

                    data.sortBy = this.get("currentSortField");

                    switch (data.sortBy){
                        case 'quantity':
                                this.set("isSortedByQtyAsc", false);
                                this.set("isSortedByQtyDesc", true);
                            break;
                        case 'amount':
                                this.set("isSortedByAmountAsc", false);
                                this.set("isSortedByAmountDesc", true);
                            break;
                        case 'percentOfTotal':
                                this.set("isSortedByPercentDesc", true);
                                this.set("isSortedByPercentAsc", false);
                            break;
                    }

                    var ajaxURL= "/parse/functions/executeTop5Report";

                    $.ajax({
                        url: ajaxURL,
                        dataType: "json",
                        type:'POST',
                        headers: appModel.parse._headers,

                        data: kendo.stringify(data),
                        
                        success: function(httpResponse) {
                            if (httpResponse.result.items.length == 0){
                                $('.userPrompt').show();
                                $('#summaryView').hide();
                                kendoNotification.show({title:"Menu Item Performance",message: 'No Sales Data Found'},"info");
                                return true;
                            }

                            self.set("resultObject", httpResponse.result);
                            $('#summaryView').show();

                            var chartData = {labels:[], series:[]};
                            var options = {
                              seriesBarDistance: 5,
                              onlyInteger: true,
                              axisY:{
                                onlyInteger: true
                              },
                              offset:30,
                              stretch:true,
                              distributeSeries: true,
                              width:"100%",
                              height:"100%",
                              chartPadding: {
                                top: 0,
                                right: 15,
                                bottom: 0,
                                left: 15
                              },
                            };

                            var responsiveOptions = [
                                  ['screen and (min-width: 641px) and (max-width: 1024px)', {
                                    seriesBarDistance: 10,
                                    width:"100%",
                                    height:"100%",
                                    axisX: {
                                      labelInterpolationFnc: function (value) {
                                        return value;
                                      }
                                    }
                                  }],
                                  ['screen and (max-width: 640px)', {
                                    seriesBarDistance: 1,
                                    width:"100%",
                                    height:"100%",
                                    axisX: {
                                      labelInterpolationFnc: function (value) {
                                        return value[0];
                                      }
                                    }
                                  }]
                                ];

                            var valuesArray = [];
                            _.each(self.get("resultObject").items, function(anItemRecord, index){
                                //only display the top 5 in the chart
                                if (index < 5){
                                    chartData.labels.push(anItemRecord.description);
                                    if (data.sortBy == 'percentOfTotal'){
                                        chartData.series.push(kendo.toString(anItemRecord[data.sortBy]*100,"n2")); //convert to %
                                    }
                                    else
                                        chartData.series.push(anItemRecord[data.sortBy]); //
                                }
                            });

                            self.set("top5Chart", new Chartist.Bar('.ct-chart', chartData, options, responsiveOptions));
                            
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            var errorObj = jqXHR.responseJSON;
                            kendoNotification.show({title:"Item Menu Performance",message: errorObj.error.error},"error");
                            $('.userPrompt').show();
                            $('#summaryView').hide();
                            // $('#terminalSummaryView').hide();
                        },

                        complete: function() {
                            $('#pleaseWait').hide();
                            self.set("runReportEnabled", true);
                        }


                    });
                };
            },
            truckList: appModel.parse.truckList,
            selectedTruck:null,
            top5Chart:null,
            durationSelection:[
                {id:1, text:"Today"},
                {id:2, text:"Yesterday"},
                {id:3, text:"This Week"},
                {id:4, text:"Last Week"},
                {id:5, text:"This Month"},
                {id:6, text:"Last Month"},
                {id:7, text:"Custom"}
            ],
            startDateTime:null,
            endDateTime:null,
            runReportEnabled:true,
            resultObject:{
                items:[]
            },
            currentSortField : 'quantity',
            isSortedByQtyDesc: true,
            isSortedByQtyAsc: false,
            isSortedByAmountDesc: false,
            isSortedByAmountAsc: false,
            isSortedByPercentDesc:false,
            isSortedByPercentAsc:false

        });
    };

    var TransHistoryReportModel = function(){
        return kendo.observable({
            init:function(){

            },
            setViewState:function(){
                //default the duration drop down list to 'Custom'
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("1"); //custom
                //default todays dates

                start = moment().startOf('day');
                this.set("startDateTime", start.toDate());

                end = moment().endOf('day');
                this.set("endDateTime", end.toDate());

                this.set("currentSkip", 0);
                this.set("isNextBtnVisible", false);
                this.set("isPreviousBtnVisible", false);
                this.set("signatureVisible", false);
                this.set("last4", '');


            },
            onDurationChange:function(eventObj){
                switch( parseInt(eventObj.sender.value()) ){
                    case 1:
                        //today
                        start = moment().startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 2:
                        //yesterday
                        start = moment().subtract('day', 1).startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('day', 1).endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 3:
                        //this week
                        start = moment().startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 4:
                        //last week
                        start = moment().subtract('week', 1).startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('week', 1).endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 5:
                        //this month
                        start = moment().startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 6:
                        //last month
                        start = moment().subtract('month', 1).startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('month', 1).endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 7:
                        this.set("startDateTime", null);
                        this.set("endDateTime", null);
                }
            },
            onFromDateChange: function(eventObj){
                if (!this.endDateTime){
                    //if the user has not selected a date time you should default
                    var eod = new Date(this.startDateTime);
                    eod.setHours(23,59,59);

                    this.set("endDateTime", eod);
                };
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom
            },

            getTransactionRecordsForward: function(){
                this.set("currentSkip", this.currentSkip + this.limit);
                this.executeTransHistoryReport();
            },

            getTransactionRecordsBack: function(){

                if (this.currentSkip > 0 ){
                    this.set("currentSkip", this.currentSkip - this.limit);
                    this.executeTransHistoryReport();
                } else {
                    kendoNotification.show({title:"Transaction History",message: "No previous orders Found"},"info");
                }
            },

            onToDateChange:function(eventObj){
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom  
            },
            executeTransHistoryReport: function(){
                //validate the reports params
                var validator = $("#reportParams").kendoValidator().data('kendoValidator');
                if (validator.validate()) {

                    var testMoment = new moment(this.startDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Transaction History",message:"Please specify valid From Date"},"error");
                        return;
                    }
                        
                    var testMoment = new moment(this.endDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Transaction History",message:"Please specify valid To Date"},"error");
                        return;
                    };

                    var data = {};
                    $('.userPrompt').hide();
                    $('#pleaseWait').show();
                    $('#transHistoryView').hide();

                    this.set("runReportEnabled", false);

                    data.dateFrom = this.startDateTime;
                    data.dateTo = this.endDateTime;

                    data.vendorId =appModel.parse._vendor.objectId;
                    
                    if (this.selectedTruck)
                        data.truckId = this.selectedTruck;

                    data.orderState = 'H'; //H = History
                    data.limit = this.get('limit'); //only return the first X records
                    data.skip = this.get("currentSkip");
                    data.last4 = this.get("last4");
                    // data.getPreviousNext = true;

                    if (aTransHistoryReportModel.selectedTruck)
                        data.truck=appModel.getParsePointer({objectId:aTransHistoryReportModel.selectedTruck}, "Truck");

                    var ajaxURL= "/parse/functions/posGetOrders";

                    $.ajax({
                        url: ajaxURL,
                        dataType: "json",
                        type:'POST',
                        headers: appModel.parse._headers,

                        data: kendo.stringify(data),
                        
                        success: function(httpResponse) {
                            aTransHistoryReportModel.set("resultObject", httpResponse.result);
                            if (httpResponse.result.length == 0){
                                $('.userPrompt').show();
                                $('#transHistoryView').hide();

                                //update the currentSkip
                                if (aTransHistoryReportModel.currentSkip > 0){
                                    kendoNotification.show({title:"Transaction History",message: 'No more orders Found'},"info");
                                    aTransHistoryReportModel.set("currentSkip", aTransHistoryReportModel.currentSkip - aTransHistoryReportModel.limit);
                                    //load the previous result set
                                    aTransHistoryReportModel.executeTransHistoryReport();
                                } else {
                                    kendoNotification.show({title:"Transaction History",message: 'No orders Found'},"info");
                                }

                                return true;
                            } else {
                                $('#transHistoryView').show();
                                //show the next and previous buttons
                                aTransHistoryReportModel.set("isNextBtnVisible", true);
                                aTransHistoryReportModel.set("isPreviousBtnVisible", true);

                            };

                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            var errorObj = jqXHR.responseJSON;
                            kendoNotification.show({title:"Transaction History",message: JSON.parse(errorObj.error).message},"error");
                            $('.userPrompt').show();
                            $('#transHistoryView').hide();
                        },

                        complete: function() {
                            $('#pleaseWait').hide();
                            aTransHistoryReportModel.set("runReportEnabled", true);
                        }


                    });
                };
            },
            
            getTransactionDateTime: function(transDateTime, isShortDate){
                // console.log(transDateTime);
                // return transDateTime;
                if (!isShortDate)
                    return moment(transDateTime).format("ddd, MMM Do YYYY, h:mm:ss a");
                else 
                    return moment(transDateTime).format("M/D, h:mma");
            },

            getSalesModeDesc: function(aSalesMode){
               var resultObject =  _.find(this.saleModeArray, {id:aSalesMode});
               return resultObject.text;

            },

            getPaymentTypeDesc:function(payType){
               var resultObject =  _.find(this.paymentTypes, {id:payType});
               return resultObject.text;                
            },

            getDeliveryAmount:function(orderRow){
                var deliveryAmount = 0;
                if (orderRow.deliveryRequested == true)
                    deliveryAmount = parseFloat(orderRow.deliveryDetail.deliveryAmount);

                return deliveryAmount;
            },

            getTotalTax:function(orderRow){
                var deliveryTax = 0;

                if (orderRow.deliveryRequested == true){
                    deliveryTax = parseFloat(orderRow.deliveryDetail.deliveryTax);
                };

                return orderRow.taxAmount + deliveryTax;
            },

            getGrandTotal:function(orderRow){
                var deliveryAmount = 0;
                var deliveryTax = 0;

                if (orderRow.deliveryRequested == true){
                    deliveryAmount = parseFloat(orderRow.deliveryDetail.deliveryAmount);
                    deliveryTax = parseFloat(orderRow.deliveryDetail.deliveryTax);
                }

                return ((orderRow.amount + deliveryAmount)- orderRow.totalDiscountAmount) + orderRow.taxAmount + orderRow.tipAmount + deliveryTax;

            },

            getOrderStateDescription:function(aState){
               var resultObject =  _.find(this.stateText, {state:aState});
               return resultObject.text; 
            },

            getCSSForOrderRow:function(orderRow){
                return "row " + 'rowState' + orderRow.state;
            },

            showOrderDetails: function(e) {

                var self=this;
                var selectedOrder= $.extend(true,{},e.data).toJSON();

                var grandTotal;

                if (selectedOrder.deliveryRequested == true)
                    grandTotal = ( (selectedOrder.taxAmount + selectedOrder.deliveryDetail.deliveryTax + selectedOrder.amount + selectedOrder.deliveryDetail.deliveryAmount) - selectedOrder.totalDiscountAmount ) - selectedOrder.tipAmount;
                else
                    grandTotal = ( (selectedOrder.taxAmount + selectedOrder.amount) - selectedOrder.totalDiscountAmount) + selectedOrder.tipAmount;

                selectedOrder.formattedAmount=kendo.toString(selectedOrder.amount, "$##,#.00");
                selectedOrder.formattedTaxAmount=kendo.toString(selectedOrder.taxAmount, "$##,#.00");
                selectedOrder.formattedGrandAmount=kendo.toString(grandTotal, "$##,#.00");
                selectedOrder.formattedDiscountAmount = kendo.toString(selectedOrder.totalDiscountAmount, "$##,#.00");
                selectedOrder.createdAt=moment(selectedOrder.createdAt).format('MM/DD/YY, h:mm a');
                
                if(selectedOrder.saleMode==appDefaults.saleMode.online)
                    selectedOrder.createdAt= "P/U:"+selectedOrder.createdAt;

                if(selectedOrder.orderItems && selectedOrder.orderItems.length) {

                    $.each(selectedOrder.orderItems,function(index,orderItem) {
                        if(!(orderItem.modifiers && orderItem.modifiers.length))
                            orderItem.modifiers=[];
                    });
                }

                self.set("signatureVisible", false);
                selectedOrder.signatureImage = null;

                self.set("selectedOrder",selectedOrder);

                kendo.bind($("#windowOrderDetails"), this);

                var orderDetailsWindow = $("#windowOrderDetails");
                if(!orderDetailsWindow.data("kendoWindow")) {
                    orderDetailsWindow.kendoWindow({
                        // width: "715",
                        // height: "575",
                        title: "Order Details",
                        modal: true

                    });
                }

                orderDetailsWindow.data("kendoWindow").center().open();
            },

            closeSelectedOrderWindow: function() {
                $("#windowOrderDetails").data("kendoWindow").close();
            },

            toggleSignature:function(e){
                var self = this;
                var selectedOrder = self.get("selectedOrder");
                

                var signatureVisible = !self.get("signatureVisible");

                if (signatureVisible == true){
                        var ajaxURL= "/parse/functions/orderGetInfo";
                        
                        var data = {}; 
                        data.orders = [];
                        data.orders.push({internalId: selectedOrder.objectId});

                        data.loadSignature = true;

                        $.ajax({
                            url: ajaxURL,
                            dataType: "json",
                            type:'POST',
                            headers: appModel.parse._headers,

                            data: kendo.stringify(data),
                            
                            success: function(httpResponse) {
                                // selectedOrder.signatureImage = 'data:image/png;base64, ' + httpResponse.result.orders[0].signature;
                                // console.log(selectedOrder.signatureImage);
                                // console.log(httpResponse.result.orders[0].signature);

                                if (httpResponse.result.orders[0].signature){
                                    self.set("signatureVisible", signatureVisible);
                                    $('#signatureImg').attr('src', 'data:image/png;base64, ' + httpResponse.result.orders[0].signature);
                                } else {
                                    self.set("signatureVisible", false);
                                    kendoNotification.show({title:"Transaction History",message: 'No Signature found.'} ,"info");
                                }
                            },

                            error: function(jqXHR,textStatus,errorThrown) {
                                var errorObj = jqXHR.responseJSON;
                                kendoNotification.show({title:"Transaction History",message: 'Signature could not be loaded: '  
                                    + JSON.parse(errorObj.error).message + '. Please try again.'} ,"error");
                                self.set("signatureVisible", false);
                            },
                            beforeSend:function(){
                                kendo.ui.progress($('body'), true);
                            },
                            complete:function(){
                                kendo.ui.progress($('body'), false);
                            },

                        });   
                } else {
                    self.set("signatureVisible", signatureVisible); 
                };

                
            },

            refundOrder: function(e){
                var const_orderState_canc = 4;

                $.when(kendo.ui.ExtYesNoDialog.show({ title: "Are you sure?", message: "Cancel/refund this order?",icon:"k-ext-warning" }))
                    .done(function (response) {
                        if(response.button=="Yes") {
                            //call status update to refund the order
                            var ajaxURL= "/parse/functions/orderStateModify";
                            
                            var data = {};
                            data.orderId = e.data.selectedOrder.objectId;
                            data.truckId = e.data.selectedOrder.truckId;
                            data.orderState = const_orderState_canc;

                            $.ajax({
                                url: ajaxURL,
                                dataType: "json",
                                type:'POST',
                                headers: appModel.parse._headers,

                                data: kendo.stringify(data),
                                
                                success: function(httpResponse) {
                                    kendoNotification.show({title:"Transaction History",message: 'Order has been sucessfully cancelled'},"success");
                                    //refresh to the underlying list
                                    aTransHistoryReportModel.executeTransHistoryReport();
                                },

                                error: function(jqXHR,textStatus,errorThrown) {
                                    var errorObj = jqXHR.responseJSON;
                                    kendoNotification.show({title:"Transaction History",message: JSON.parse(errorObj.error).message},"error");
                                },
                                beforeSend:function(){
                                    kendo.ui.progress($('body'), true);
                                },
                                complete:function(){
                                    kendo.ui.progress($('body'), false);
                                },

                            });
                        }

                    });


            },

            emailReceipt: function(e){
            $.when(kendo.ui.ExtInputDialog.show({ 
                title: "Email Receipt", 
                message: "Please E-mail address", 
                required: true })
                ).done(function (response) {
                    if (response.button == "OK") {
                        var ajaxURL= "/parse/functions/emailReceipt";
                        
                        var data = {};
                        data.orderId = e.data.selectedOrder.objectId;
                        data.emailId = response.input;

                        $.ajax({
                            url: ajaxURL,
                            dataType: "json",
                            type:'POST',
                            headers: appModel.parse._headers,

                            data: kendo.stringify(data),
                            
                            success: function(httpResponse) {
                                kendoNotification.show({title:"Transaction History",message: 'E-mail Receipt has been sent'},"success");
                            },

                            error: function(jqXHR,textStatus,errorThrown) {
                                var errorObj = jqXHR.responseJSON;
                                kendoNotification.show({title:"Transaction History",message: JSON.parse(errorObj.error).message},"error");
                            },
                            beforeSend:function(){
                                kendo.ui.progress($('body'), true);
                            },
                            complete:function(){
                                kendo.ui.progress($('body'), false);
                            },

                        });
                    } 
                });
            },

            truckList: appModel.parse.truckList,
            selectedTruck:null,
            showSignatureAnchor: function(){
                //get selectedOrder
                var selOrder = this.get("selectedOrder");
                if (selOrder){
                    var txType = this.getPaymentTypeDesc(selOrder.provider);
                    var saleMode = this.getSalesModeDesc(selOrder.saleMode); 
                    if (txType == 'Credit' && saleMode == 'Walk-up')
                        return true
                    else
                        return false;
                }
                    else return false;
            },
            durationSelection:[
                {id:1, text:"Today"},
                {id:2, text:"Yesterday"},
                {id:3, text:"This Week"},
                {id:4, text:"Last Week"},
                {id:5, text:"This Month"},
                {id:6, text:"Last Month"},
                {id:7, text:"Custom"}
            ],
            paymentTypes: [
                            {id:"CASH", text:"Cash"},
                            {id:"BAMS", text:"Credit"},
                            {id:"HLAND", text:"Credit"},
                            {id:"STRIPE", text:"Credit"},
                            {id:"VOUCH", text:"Voucher"}
                        ],
            saleModeArray:[
                {id:1, text:"Walk-up"},
                {id:2, text:"Mobile"}
            ],

            stateText:[
                {state:0, text:'Pending Acceptance'},
                {state:1, text:'In Process'},
                {state:2, text:'Ready for Pickup or Delivery'},
                {state:3, text:'Picked up or Delivered'},
                {state:4, text:'Refunded'},
            ],
            selectedPayType:null,
            startDateTime:null,
            endDateTime:null,
            runReportEnabled:true,
            resultObject:[],
            selectedOrder:{},
            currentSkip:0,
            limit:10,
            signatureVisible: false,
            isPreviousBtnVisible:false,

            isNextBtnVisible: false
        });
    };

    var PosSalesSummaryReportsModel = function(){
        return kendo.observable({
            
            init:function(){
            },
            setViewState:function(){
                //default the duration drop down list to 'Custom'
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("1"); //custom
                //default todays dates

                start = moment().startOf('day');
                this.set("startDateTime", start.toDate());

                end = moment().endOf('day');
                this.set("endDateTime", end.toDate());

            },
            onDurationChange:function(eventObj){
                switch( parseInt(eventObj.sender.value()) ){
                    case 1:
                        //today
                        start = moment().startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 2:
                        //yesterday
                        start = moment().subtract('day', 1).startOf('day');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('day', 1).endOf('day');
                        this.set("endDateTime", end.toDate());
                        
                        break;
                    case 3:
                        //this week
                        start = moment().startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 4:
                        //last week
                        start = moment().subtract('week', 1).startOf('week');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('week', 1).endOf('week');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 5:
                        //this month
                        start = moment().startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 6:
                        //last month
                        start = moment().subtract('month', 1).startOf('month');
                        this.set("startDateTime", start.toDate());

                        end = moment().subtract('month', 1).endOf('month');
                        this.set("endDateTime", end.toDate());
                        break;
                    case 7:
                        this.set("startDateTime", null);
                        this.set("endDateTime", null);
                }
            },
            onFromDateChange: function(eventObj){
                if (!this.endDateTime){
                    //if the user has not selected a date time you should default
                    var eod = new Date(this.startDateTime);
                    eod.setHours(23,59,59);

                    this.set("endDateTime", eod);
                };

                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom
            },

            onToDateChange:function(eventObj){
                //set dropdown list to custom
                var dropdownlist = $("#srptDuration").data("kendoDropDownList");
                dropdownlist.value("7"); //custom  
            },
            executeSalesReport: function(){
                //validate the reports params
                var validator = $("#salesSummaryReport").kendoValidator().data('kendoValidator');
                if (validator.validate()) {

                    var testMoment = new moment(this.startDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Sales Summary",message:"Please specify valid From Date"},"error");
                        return;
                    }
                        
                    var testMoment = new moment(this.endDateTime);
                    
                    if (testMoment.isValid() == false){
                        kendoNotification.show({title:"Sales Summary",message:"Please specify valid To Date"},"error");
                        return;
                    };


                    var data = {};
                    $('.userPrompt').hide();
                    $('#pleaseWait').show();
                    aSalesSummaryReportsModel.set("resultReceived", false);
                    // $('#summaryView').hide();
                    // $('#terminalSummaryView').hide();

                    this.set("runReportEnabled", false);

                    data.startDateTime = this.startDateTime;
                    data.endDateTime = this.endDateTime;

                    data.vendor=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
                    if (aSalesSummaryReportsModel.selectedTruck)
                        data.truck=appModel.getParsePointer({objectId:aSalesSummaryReportsModel.selectedTruck}, "Truck");

                    var ajaxURL= "/parse/functions/executeSalesReport";

                    $.ajax({
                        url: ajaxURL,
                        dataType: "json",
                        type:'POST',
                        headers: appModel.parse._headers,

                        data: kendo.stringify(data),
                        
                        success: function(httpResponse) {
                            aSalesSummaryReportsModel.set("resultObject", httpResponse.result);
                            aSalesSummaryReportsModel.set("resultReceived", true);
                            // $('#scrollableSalesResult').show();

                            // $('#terminalSummaryView').show();
                            // setScrollingHeight('#scrollableSalesResult');

                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            var errorObj = jqXHR.responseJSON;
                            kendoNotification.show({title:"Sales Summary",message: errorObj.error},"error");
                            $('.userPrompt').show();
                            aSalesSummaryReportsModel.set("resultReceived", false);
                            // $('#scrollableSalesResult').hide();
                            // $('#terminalSummaryView').hide();
                        },

                        complete: function() {
                            $('#pleaseWait').hide();
                            aSalesSummaryReportsModel.set("runReportEnabled", true);
                        }


                    });
                };
            },
            validator:null,
            truckList: appModel.parse.truckList,
            selectedTruck:null,
            durationSelection:[
                {id:1, text:"Today"},
                {id:2, text:"Yesterday"},
                {id:3, text:"This Week"},
                {id:4, text:"Last Week"},
                {id:5, text:"This Month"},
                {id:6, text:"Last Month"},
                {id:7, text:"Custom"}
            ],
            paymentTypes: [
                            {id:"CASH", text:"Cash"},
                            {id:"BAMS", text:"Bank of America"},
                            {id:"HLAND", text:"Heartland Payment Systems"},
                            {id:"STRIPE", text:"Stripe"},
                            {id:"ALL", text:"All"}
                        ],
            selectedPayType:null,
            startDateTime:null,
            endDateTime:null,
            runReportEnabled:true,
            resultReceived:false,
            resultObject:{
                grossSales: 0.00,
                refundTotal:0.00,
                salesDiscountTotal:0.00,
                netSales:0.00, //netTakings = grossTakings - refundTotal;
                prodOrderCount:0,
                averageOrder:0,

                grossDelivery:0.00,
                refundDelivery:0.00,
                discountDelivery:0.00,
                netDelivery:0.00, //netDelivery = grossDelivery - deliveryRefund
                deliveryCount:0,
                averageDelivery:0,
                
                grossTax:0.00,
                refundedTax:0.00,
                netTax:0.00, //netTax = grossTax - refundedTax
                taxOrderCount:0,
                averageTax:0,
                
                grossTips:0.00,
                refundedTips:0.00,
                netTips:0.00, //netTips = grossTips - refundedTips
                tipOrderCount:0,
                averageTip:0,
                
                grossGrandTotal:0.00,
                grandTotalRefunds:0.00,
                netGrandTotal:0.00, //netGrandTotal = grossGrandTotal - totalRefunds - grandTotalDiscount
                grandTotalDiscount:0.00,

                cashGross:0.00,
                cashRefund:0.00,
                cashNet:0.00,
                cashOrderCount:0,
                cashDiscount:0,
                averageCash:0,

                creditGross:0.00,
                creditRefund:0.00,
                creditNet:0.00,
                creditOrderCount:0,
                creditDiscount:0,
                averageCredit:0,

                voucherGross:0.00,
                voucherRefund:0.00,
                voucherNet:0.00,
                voucherOrderCount:0,
                voucherDiscount:0,
                averageVoucher:0,

                walkupGross:0,
                walkupRefund:0,
                walkupNetReceipts:0,
                walkupOrderCount:0,
                walkupDiscount:0,
                averageWalkup:0,

                mobileGross:0,
                mobileRefund:0,
                mobileNet:0,
                mobileOrderCount:0,
                mobileDiscount:0,
                averageMobile:0,

                terminals:[]
            }
        });
    };

    var SocialModel=function() {
        return kendo.observable({
            init: function() {
                
                var self=this;
                var deferred = $.Deferred();
                
                deferred.resolve();
                
                return deferred.promise();
            },

            initSocial: function() {

                //Get the next possible POST time by adding 30 and round to the nearest 30 minutes
                var ROUNDING = 30 * 60 * 1000; /*ms*/
                start = moment();
                start.add('minutes', 30);
                start = moment(Math.ceil((+start) / ROUNDING) * ROUNDING);
                start.format("D YYYY, h:mm:ss a");
                // aMinDateTime.format("D YYYY, h:mm:ss a");              

                $('#kendoDtpPostDate').kendoDateTimePicker({
                    min: start.toDate() //set today as the earliest selectable date
                });
                var self=this;

                $.when(appModel.social.verifySocialNetworks()).then(function(result){
                    if(result.twitter&&result.facebook) {   //API call completed successfully
                        
                        if(result.twitter.connected) {
                            self.set("twitterConnected",true);
                            self.set("twitterName",result.twitter.screen_name);
                            self.set("allowPost", true);
                            
                            var btnGroupTw = $("#btnGroupPostToTwitter")[0];
                            $(btnGroupTw).removeClass('disabled').removeProp('disabled');
                            $(btnGroupTw).find('.btn').removeProp("disabled");
                            
                        } else {
                            //Twitter not connected
                            self.set("twitterConnected",false);
                            var btnGroupTw = $("#btnGroupPostToTwitter")[0];
                            $(btnGroupTw).addClass('disabled').prop('disabled');
                            $(btnGroupTw).find('.btn').prop("disabled","disabled");  
                        }

                        if(result.facebook.connected) {
                            self.set("facebookConnected",true);
                            self.set("facebookAccessToken",result.facebook.userAccessToken);
                            self.set("facebookDefaultPageID",result.facebook.pageId);
                            self.set("allowPost", true);

                            var btnGroupFb = $("#btnGroupPostToFB")[0];
                            $(btnGroupFb).removeClass('disabled').removeProp('disabled');
                            $(btnGroupFb).find('.btn').removeProp("disabled");

                            // ensure that FB object is available before calling getFacebookPages
                            var timerFB = setInterval(function(){

                                if(typeof FB!="undefined") {
                                    clearInterval(timerFB);

                                    $.when(appModel.social.getFacebookPages(result.facebook.userAccessToken)).then(function(result) {
                                        if(result.length) {
                                            self.set("facebookPages",result);
                                            //set default page if any
                                            if (self.facebookDefaultPageID)
                                                $("#lstFacebookPages").data("kendoDropDownList").value(self.facebookDefaultPageID);
                                        }
                                    });
                                    
                                }


                            }, 1000);    
                        } else {
                            //FB not connected
                            self.set("facebookConnected",false);
                            var btnGroup = $("#btnGroupPostToFB")[0];
                            $(btnGroup).addClass('disabled').prop('disabled');
                            $(btnGroup).find('.btn').prop("disabled", "disabled");
                        }

                        //check if we should enable the 'post to App' feature
                        if (result.twitter.connected || result.facebook.connected){
                            if (appModel.sysSettings.androidAppId || appModel.sysSettings.appleBundleId){

                                var btnGroup = $("#btnGroupPostToApp")[0];
                                $(btnGroup).removeClass('disabled').removeProp('disabled');
                                $(btnGroup).find('.btn').removeProp("disabled");
                            } else {
                                var btnGroup = $("#btnGroupPostToApp")[0];
                                $(btnGroup).addClass('disabled').prop('disabled');
                                $(btnGroup).find('.btn').prop("disabled","disabled");
                            }
                        } else {
                                $("#btnGroupPostToApp").addClass('disabled').prop('disabled',true);
                                var btnGroup = $("#btnGroupPostToApp")[0];
                                $(btnGroup).addClass('disabled').prop('disabled');
                                $(btnGroup).find('.btn').prop("disabled","disabled");
                        };

                    }

                    else
                        kendoNotification.show({title:"Error!",message:"An error occured while verifying connection to social networks"},"error")

                    if(self.locationData)
                        $("#btnShowMap").trigger("click");
                });

            },

            socialPostID: null,
            socialPost: null,
            socialPostURL: null,
            twitterPost: null,
            
            postDateTime:null,
            
            parentColl:null,
            imgURL:"",

            isEvent:false,
            // postOffset:null,
            eventDate:null,

            locationData:null,

            twitterAuth:null,
            twitterConnected: false,
            twitterName:null,
            facebookConnected: false,
            facebookAccessToken: null,
            facebookSelectedPageID:null,
            facebookPages: [],
            facebookDefaultPageID:null,
            postToApp: false,
            postToFB: true,
            postToTwitter:true,
            postToAppPossible: false,
            appPush : {network:00},
            postToAppList: [{text:"No", value:"00"},{text:"Twitter",value:"01"}, {text:"Facebook", value:"02"}],
            

            postOffsetList: [{text:"Open for Business",value:"-1"},{text:"On Event Start",value:"0"},{text:"15 Minutes",value:"15"},{text:"30 Minutes",value:"30"},{text:"45 Minutes",value:"45"},
                    {text:"1 Hour",value:"60"},{text:"2 Hours",value:"120"},{text:"3 Hours",value:"180"},{text:"4 Hours",value:"240"},{text:"5 Hours",value:"300"}],        

            showTwitterTextArea: false,

            mapInfo: {

                distance: null,
                lat: null,
                lng: null,
                query: null,
                twitterPlaces:[],
                facebookPlaces:[],
                selectedTwitterPlace:{id:null,name:"",address:""},
                selectedFacebookPlace:{id:null,name:"",address:""}
            },

            reset: function(e) {

                e && e.preventDefault();

                this.set("socialPostID",null);
                this.set("socialPost",null);
                this.set("socialPostURL",null);
                this.set("twitterPost",null);
                this.set("showTwitterTextArea",false);
                this.set("mapInfo.selectedFacebookPlace",{id:null,name:"",address:""});
                this.set("mapInfo.selectedTwitterPlace",{id:null,name:"",address:""});
                this.set("parentColl",null);
                this.set("imgURL",null);
                this.set("isEvent",null);
                this.set("eventDate",null);
                this.set("postDateTime",null);
                // this.set("postOffset",null);
                this.set("locationData",null);
                //this.set("postToApp",false);
                //this.set("postToTwitter",true);
                //this.set("postToFB",true);

                $("#facebookPostArea").removeClass().addClass("col-md-12");
                $("#twitterPostArea").hide();
            },

            getPostOffsetDesc: function() {
                return "this...."
            },

            copyFacebookTextToTwitter:function() {
                if(!this.get("socialPost") || this.get("showTwitterTextArea")) return;
                this.set("twitterPost",this.socialPost.substring(0,140));
            },

            setTwitterTextAreaVisibility: function() {
                if(this.get("showTwitterTextArea") && this.get("twitterConnected") && this.get("facebookConnected")) {

                    $("#facebookPostArea").removeClass().addClass("col-md-8");
                    $("#twitterPostArea").show();

                }

                else {

                    $("#facebookPostArea").removeClass().addClass("col-md-12");
                    $("#twitterPostArea").hide();

                }
            },

            clearFacebookPlace: function(e) {
                e.preventDefault();
                this.set("mapInfo.selectedFacebookPlace",{id:null,name:"",address:""});
            },

            clearTwitterPlace: function(e) {
                e.preventDefault();
                this.set("mapInfo.selectedTwitterPlace",{id:null,name:"",address:""});

            },

            setFacebookPage: function() {

                var self=this;
                var selectedVal=$("#lstFacebookPages").data("kendoDropDownList").value();

                if (!selectedVal) {
                    this.set("facebookSelectedPageID",null);
                    return;
                }

                var data = $.grep(this.get("facebookPages"), function (e) {
                    return e.id === selectedVal;
                });

                $.when(appModel.social.setFacebookPage(data[0].id,data[0].access_token)).then(function(result) {
                    self.set("facebookDefaultPageID",data[0].id);
                    //re-init screen after successful FB Page Set
                    socialModel.initSocial();
                });

            },

            allowPost: function() {

                if(this.get("socialPost") && (this.get("twitterConnected") || this.get("facebookConnected")))
                    return true;

            },

            getTwitterPostLength: function() {
                return this.get("twitterPost")?this.get("twitterPost").length+"/140":"0/140";
            },

            connectTwitter: function() {
                
                var self=this;

                $.when(appModel.social.connectTwitter()).then(function(serverResponse) {
                    if (serverResponse.hasOwnProperty("authUrl")) {
                            
                        amplify.store("trcked_twitter_authenticated",false);
                        var windowSocialConnect=window.open(serverResponse.authUrl,"_blank","width=600,height=600,location=no");
                        var timer=setInterval(function() {
                            if(amplify.store("trcked_twitter_authenticated")) {
                                clearInterval(timer);
                                amplify.store("trcked_twitter_authenticated",null);
                                self.set("twitterConnected",true);
                                self.set("twitterName",amplify.store("trcked_twitter_screen_name"));
                                amplify.store("trcked_twitter_screen_name",null);
                                //re-init screen after successful twitter connection
                                socialModel.initSocial();
                            }

                            if(windowSocialConnect.closed) clearInterval(timer);

                        }, 1000);
                            
                    }

                    else
                        kendoNotification.show({title:"Error!",message:"An error occured while trying to get twitter authentication URL"},"error")

                });

            },

            connectFacebook: function() {
                
                var self=this;

                $.when(appModel.social.connectFacebook()).then(function(result) {
                    if(result.hasOwnProperty("access_token")) {
                        self.set("facebookAccessToken",result.access_token);
                        self.set("facebookConnected",true);
                        self.set("facebookDefaultPageID",null);
                        self.set("facebookSelectedPageID",null);
                        
                        $.when(appModel.social.getFacebookPages(result.access_token)).then(function(result) {
                            if(result.length) {
                                self.set("facebookPages",result);
                                //set default page if any
                                if (self.facebookDefaultPageID)
                                    $("#lstFacebookPages").data("kendoDropDownList").value(self.facebookDefaultPageID);
                            }
                        });

                    }

                    else
                        kendoNotification.show({title:"Error!",message:"An error occured while trying to connect with Facebook"},"error")

                });

            },

            showMap: function() {

                var self=this;

                appModel.mapWindow.showMap({
                    onSelect: function(data) {
                        self.set("mapInfo",data);
                    },

                    onCancel: function() {
                        
                    },

                    locationData:this.locationData
                });
            },

            showSavedSocialPosts: function(e) {
                
                var self=this;
                e.preventDefault();
                
                appModel.socialPostsWindow.showSocialPosts({
                    onSelect: function(dataItem) {
                        
                        self.reset();

                        self.set("socialPostID",dataItem.objectId);
                        self.set("socialPost",dataItem.post);
                        self.set("socialPostURL",dataItem.url);

                        if(dataItem.facebook && dataItem.facebook.place){
                            self.set("mapInfo.selectedFacebookPlace",
                             {
                                id: dataItem.facebook.place,
                                name: dataItem.facebook.placeInfo.name
                            });

                        };

                        self.set("twitterPost",dataItem.twitter.status);

                        if(dataItem.twitter.place_id){
                            self.set("mapInfo.selectedTwitterPlace",
                             {
                                id: dataItem.twitter.place_id,
                                name: dataItem.twitter.placeInfo.name

                            });
                        }

                        if (dataItem.appPush.network != 0)
                            self.togglePublishToAppOn({currentTarget:$('#publishToAppOn')[0]});
                        else 
                            self.togglePublishToAppOff({currentTarget:$('#publishToAppOff')[0]});

                        if (dataItem.appPush.network == '01')
                            self.togglePublishToTwitterOn({currentTarget:$('#publishToTwitterOn')[0]});
                        
                        if (dataItem.appPush.network == '02')
                            self.togglePublishToFBOn({currentTarget:$('#publishToFBOn')[0]});

                        if (dataItem.postDateTime)
                            self.set("postDateTime", new Date(dataItem.postDateTime.iso))
                        else
                            self.set("postDateTime", null);
                    }
                });
            },

            togglePublishToFBOn:function(e){
                self=this;
                self.set("postToFB", true);
                //remove the active class from all the buttons
                $(e.currentTarget.parentElement).find('.btn').removeClass('active btn-primary');
                //now add it to this button
                $(e.currentTarget).addClass('active btn-primary');
            },


            togglePublishToFBOff:function(e){
                
                if ( $(e.currentTarget).prop("disabled") )
                    return; 

                self=this;
                self.set("postToFB", false);

                $(e.currentTarget.parentElement).find('.btn').removeClass('active btn-primary');
                //now add it to this button
                $(e.currentTarget).addClass('active btn-primary');
            },

            // togglePublishToFB:function(e){
            //     self=this;
            //     self.set("postToFB", !this.postToFB);
            // },

            togglePublishToTwitterOn:function(e){
                if ( $(e.currentTarget).prop("disabled") )
                    return; 

                self=this;
                self.set("postToTwitter", true);
                $(e.currentTarget.parentElement).find('.btn').removeClass('active btn-primary');
                //now add it to this button
                $(e.currentTarget).addClass('active btn-primary');
            },

            togglePublishToTwitterOff:function(e){
                if ( $(e.currentTarget).prop("disabled") )
                    return; 

                self=this;
                self.set("postToTwitter", false);
                $(e.currentTarget.parentElement).find('.btn').removeClass('active btn-primary');
                //now add it to this button
                $(e.currentTarget).addClass('active btn-primary');
            },

            // togglePublishToTwitter:function(e){
            //     self=this;
            //     self.set("postToTwitter", !this.postToTwitter);
            // },

            togglePublishToAppOn:function(e){
                if (e)
                    if ( $(e.currentTarget).prop("disabled") )
                        return; 

                self=this;
                self.set("postToApp", true);
                $(e.currentTarget.parentElement).find('.btn').removeClass('active btn-primary');
                //now add it to this button
                $(e.currentTarget).addClass('active btn-primary');
            },

            togglePublishToAppOff:function(e){

                if (e)
                    if ( $(e.currentTarget).prop("disabled") )
                        return; 

                self=this;
                self.set("postToApp", false);
                $(e.currentTarget.parentElement).find('.btn').removeClass('active btn-primary');
                //now add it to this button
                $(e.currentTarget).addClass('active btn-primary');
            },

            saveSocialPost: function(e) {

                var self=this;
                var method= this.socialPostID?"PUT":"POST";
                var ajaxURL= "/parse/classes/SocialPosting/";

                if(this.postDateTime) {     // make sure date-time is +30min from now

                    var today=new Date();
                    var diffMs=this.postDateTime-today;
                    var diffMins = Math.round(diffMs/(60*1000)); // minutes

                    if(diffMins <= 31) {
                        kendo.ui.ExtAlertDialog.show({ title: "Invalid Date/Time", message: "Scheduled post must be atleast 30minutes from now!",icon:"k-ext-information" });
                        return;
                    }
                }

                if (!this.socialPost){
                    //this field can not be blank
                        kendo.ui.ExtAlertDialog.show({ title: "Missing Message", message: "You must enter some text",icon:"k-ext-information" });
                        return;
                }

                if(this.socialPostID)
                    ajaxURL+=this.socialPostID;

                var btnSave=$(e.target);
                var data={
                    post: "",
                    url: "",
                    facebook:{message:"",url:"",place:"", placeInfo:{name:"",address:""}},
                    twitter:{status:"",place_id:"", placeInfo:{name:"",address:""}},
                    postDateTime: null,
                    parentColl: null
                    // postOffset:0
                };

                btnSave.button("loading");

                data.post=this.socialPost;
                data.url=this.socialPostURL;
                data.vendor=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
                if (this.postDateTime)
                    data.postDateTime = {iso:this.postDateTime.toISOString(), "__type":"Date"};
                
                data.parentColl=this.parentColl;
                // data.postOffset=this.postOffset;
                data.autoGenerated = false; //default to false as this was done by a user
                
                data.facebook.message=this.socialPost;

                if(this.mapInfo.selectedFacebookPlace.id) {
                    //place is the var which FB will expect the ID so we leave it there
                    data.facebook.place =this.mapInfo.selectedFacebookPlace.id;
                    //below is just for us so we dont have to go look it up each time
                    data.facebook.placeInfo.name = this.mapInfo.selectedFacebookPlace.name;
                    data.facebook.placeInfo.address = this.mapInfo.selectedFacebookPlace.address;
                } else {
                    delete data.facebook.place;
                    delete data.facebook.placeInfo;

                }

                data.twitter.status=this.twitterPost;
                if (!data.twitter.status)
                    data.twitter.status = data.post;
                
                if(this.mapInfo.selectedTwitterPlace.id) {
                    //the 'place_id' param is what twiter is expecting
                    data.twitter.place_id=this.mapInfo.selectedTwitterPlace.id;
                    //these guys are for our own FYI only. 
                    data.twitter.placeInfo.name = this.mapInfo.selectedTwitterPlace.name;
                    data.twitter.placeInfo.address = this.mapInfo.selectedTwitterPlace.address;
                } else {                
                    delete data.twitter.place_id;
                    delete data.twitter.placeInfo;
                }
                
                if (data.url=="")
                    delete data.url;

                if (data.facebook.url=="")
                    delete data.facebook.url;

                if (this.postToApp == true)
                    data.appPush = {network:'01'}; //twitter
                        else delete data.appPush;

                $.ajax({
                    
                    url: ajaxURL,
                    dataType: "json",
                    type:method,
                    headers: appModel.parse._headers,

                    data: kendo.stringify(data),
                    
                    success: function(result) {
                       kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");
                       setTimeout(function() {
                        self.reset();
                    }, 10);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                            kendoNotification.show({title:"Error!",message:"An error occured while saving the post"},"error")
                            handleAjaxError(jqXHR,textStatus,errorThrown);
                            
                    },

                    complete: function() {
                        btnSave.button("reset");
                    }


                });
                
               
            },

            postSocial: function(e) {

                var self=this;

                if(this.facebookConnected && !$("#lstFacebookPages").data("kendoDropDownList").value()) {
                    kendo.ui.ExtAlertDialog.show({ title: "Select Facebook Page", message: "Please select the Facebook page to post",icon:"k-ext-information" });
                    return;
                }

                if(this.postOffset || this.postDateTime) {          // future dated post. Save to DB
                    
                    $.when(kendo.ui.ExtYesNoDialog.show({ title: "Save this Post?", message: "This post will be sent at the alloted time. Continue?",icon:"k-ext-information" }))
                        .done(function (response) {
                            if(response.button=="Yes") 
                                $("#btnSaveSocialPost").trigger("click");
                        });
                    
                }

                else {

                    var btnPost=$(e.target);
                    btnPost.button("loading");

                    var twitter=null;
                    var facebook=null;

                    if(this.twitterConnected && this.postToTwitter){
                        twitter={
                                    status:this.get("twitterPost")
                                    //place_id: this.socialWindow.mapInfo.selectedTwitterPlace.id
                                };
                        if (this.mapInfo.selectedTwitterPlace.id)
                                twitter.place_id = this.mapInfo.selectedTwitterPlace.id;
                    } else 
                        twitter = null;

                    if(this.facebookConnected && this.postToFB){
                        facebook={
                                    //pageId:this.socialWindow.get("facebookSelectedPageID"),
                                    message: this.get("socialPost"),
                                    // link: this.socialWindow.get("socialPostURL"),
                                    // place:this.socialWindow.mapInfo.selectedFacebookPlace.id
                                };
                        if (this.get("socialPostURL"))
                            facebook.link = this.get("socialPostURL");
                        
                        if (this.mapInfo.selectedFacebookPlace.id)
                            facebook.place = this.mapInfo.selectedFacebookPlace.id;
                    } else 
                        facebook = null;

                    if (!self.postToApp)
                        self.set('appPush', {network:00}); //00 means do not push to App
                            else {
                                if (twitter)
                                    self.set("appPush", {network:"01"});
                                else if (facebook)
                                    self.set("appPush", {network:"02"});
                            } 



                    $.when(appModel.social.postSocial(twitter,facebook, self.get('appPush') )).then(function(httpResponse){

                        self.reset();
                        btnPost.button("reset"); 

                        // notify post result based on response received

                        if(httpResponse.result.twitter && httpResponse.result.twitter.code) {
                            if(httpResponse.result.twitter && httpResponse.result.twitter.code=="200")
                                kendoNotification.show({title:"Twitter",message:"Tweet sent to your twitter account"},"success");
                            else
                                kendoNotification.show({title:"Twitter",message: httpResponse.result.twitter.message},"error");
                        }

                        if(httpResponse.result.facebook) {
                            if(httpResponse.result.facebook.code=="200" && httpResponse.result.facebook.message == "success")
                                kendoNotification.show({title:"Facebook",message:"Posted to the selected Facebook page"},"success");
                            else{
                                var fbMessage;

                                if (httpResponse.result.facebook.message)
                                    fbMessage = httpResponse.result.facebook.message;
                                        else fbMessage = 'Could not post to Facebook';

                                kendoNotification.show({title:"Facebook",message: fbMessage},"error");
                            }
                        };

                        if (httpResponse.result.appPush.code){
                            if(httpResponse.result.appPush && httpResponse.result.appPush.code=="200")
                                kendoNotification.show({title:"Your app",message:httpResponse.result.appPush.message},"success");
                            else
                                kendoNotification.show({title:"Your app",message: httpResponse.result.appPush.message},"error");
                        };
                        
                    });

                }

                
             }
         
            }
    )}

    var socialModel=null;


    var SettingsModel=function() {
        return kendo.observable({

            // properties
            // appleAppStoreURL: null,
            businessName: null,
            accountType: null,
            androidAppId: null,
            appleBundleId: null,
            // googlePlayURL: null,
            logoFile:null,
            isLogoDirty:false,
            originalFileName:null,
            merchUsername: null,
            merchPassword:null,
            twitterConnected: false,
            facebookConnected: false,
            facebookAccessToken: false,
            facebookSelectedPageID: null,
            facebookPages: [],
            allDayHalfHour:[],
            autoPostEventInterval:[{id:0, display:"Do not post"},{id:30, display:"30 minutes before event"},
                                   {id:60, display:"1 hour before event"}],
            twitterName: null,
            pushToApp: false,
            publishPrivateEvents: null,
            publishScheduleToSocial: false,
            publishScheduleToSocialTime: null,
            orderReceivedEmailList:null,
            inventoryAlarmEmailList:null,
            isQBOConnected: false,
            inventoryAlarmPhoneList:null,
            eventPublishTosocialOffset:null,
            vendorID: appModel.userInfo.vendorID,
            bamsApplication: {},
            merchantAccountConnected: false,
            gatewayId:"None",
            qboConnectedCompanyName:"",
            monthOfYear:[
                {value:01, desc:'01'},{value:02, desc:'02'},{value:03, desc:'03'},{value:04, desc:'04'},{value:05, desc:'05'},{value:06, desc:'06'},{value:07, desc:'07'},
                {value:08, desc:'08'},{value:09, desc:'09'},{value:10, desc:'10'},{value:11, desc:'11'},{value:12, desc:'12'}
            ],
            supportedCurrencies:[
                                    {isoId: 'USD', currencyName: 'United States Dollar'},
                                    {isoId: 'CAD', currencyName: 'Canada Dollar'},
                                    {isoId: 'AUD', currencyName: 'Australian Dollar'},
                                ],
            cardTypes:[
              { internalId:"jp-card-visa", payEezyValue:"Visa"},
              { internalId:"jp-card-mastercard", payEezyValue:"MasterCard"},
              { internalId:"jp-card-amex", payEezyValue:"American Express"},
              { internalId:"jp-card-discover", payEezyValue:"Discover"}
            ],
            ccName: "",
            rawCCNumber:null,
            ccNumber:null,
            ccNumberDisplay:null,
            ccExpMonth:null,
            ccExpYear:null,
            ccExpFull:null,
            defaultCurrencyId:null,
            validator:null,
            selectedCardType:null,
            cardObj:null,
            externalCodes: externalTaxCodesDataSource(appModel),
            extTaxId:null,

            expirationYears: function(){
                var counter = 0;
                var thisYear = new Date().getFullYear();
                var resultArray = [];

                resultArray.push({value:String(thisYear).slice(-2), desc:thisYear});

                do{
                    counter++;
                    resultArray.push({value:String(thisYear + counter).slice(-2), desc:thisYear + counter});    
                } while (counter < 7);

                return resultArray;
            },
            init: function() {

                var self=this;
                var deferred=$.Deferred();

                //create date object using todays date starting at midnight
                var d = new Date();
                d.setHours(0,0,0,0);
                var i = 1; //there are 47 half hours in the day 

                while (i < 48){
                    var d = new Date(d.getTime() + 30*60000); //add 30 minutes
                    //this.allDayHalfHour.push({displayTime:d.toLocaleTimeString()});
                    this.allDayHalfHour.push({"ID":moment(d).format("hh:mm A"),"displayTime":moment(d).format("hh:mm A")});
                    i++;
                };
               
                console.log(appModel.sysSettings);

                self.set("appleBundleId",appModel.sysSettings.appleBundleId);
                self.set("androidAppId",appModel.sysSettings.androidAppId);
                self.set("publishPrivateEvents",appModel.sysSettings.publishPrivateEvents);
                self.set("publishScheduleToSocial", appModel.sysSettings.publishScheduleToSocial);
                self.set("publishScheduleToSocialTime", appModel.sysSettings.publishScheduleToSocialTime);
                self.set("eventPublishTosocialOffset", appModel.sysSettings.eventPublishOffset);
                self.set("orderReceivedEmailList", appModel.sysSettings.orderReceivedEmailList);
                self.set("inventoryAlarmEmailList", appModel.sysSettings.inventoryAlarmEmailList);
                self.set("inventoryAlarmPhoneList", appModel.sysSettings.inventoryAlarmPhoneList);

                if (appModel.sysSettings.qbo && appModel.sysSettings.qbo.qboTaxId)
                    self.set("extTaxId", appModel.sysSettings.qbo.qboTaxId);

                if (appModel.get("payInfo").length > 0)
                    self.set("merchantAccountConnected", true);
                else
                    self.set("merchantAccountConnected", false);

                if (self.get("merchantAccountConnected") == true){
                    switch(appModel.get("payInfo")[0].providerId){
                        case 'BAMS':
                            self.set("connectedAccountName",'First Data');
                            self.set("gatewayId", appModel.get("payInfo").gateway_id);
                            break;
                        case 'STRIPE':
                            self.set("connectedAccountName",'STRIPE');
                            self.set("gatewayId","N/A");
                            break;
                        case 'HLAND':
                            self.set("connectedAccountName",'Heartland');
                            self.set("gatewayId","N/A");
                            break;
                    };
                } else{
                    self.set("connectedAccountName",'Not Connected');
                    self.set("gatewayId","None");
                }
                
                if (typeof appModel.sysSettings.publishScheduleToSocial == "undefined"){
                    appModel.sysSettings.publishScheduleToSocial = false;
                };

                //this attribute will dictate whether the select box is enabled or not
                self.set("publishScheduleToSocial", appModel.sysSettings.publishScheduleToSocial);
                //Is QBO Connected
                self.set("isQBOConnected", appModel.sysSettings.isQBOConnected);
                
                self.logoFile= appModel.sysSettings.logoFile;

                self.businessName = appModel.vendorInfo.description;
                self.accountType = appModel.vendorInfo.accountType;

                if (appModel.vendorInfo.isoCurrency){
                    self.set("defaultCurrencyId", appModel.vendorInfo.isoCurrency);
                } else {
                    self.set('defaultCurrencyId', 'USD');
                };

                if (appModel.vendorInfo.vendorToken){
                    self.set("ccOnFile", appModel.vendorInfo.vendorToken.type + ' - ' + String(appModel.vendorInfo.vendorToken.value).slice(-4));
                    self.set("nextBillDate", moment(appModel.vendorInfo.nextBillDate).format("dddd, MMMM Do YYYY"));
                } else {
                    self.set("ccOnFile", 'No card on file');
                    self.set("nextBillDate", 'None');
                };


                deferred.resolve();
                return deferred.promise();
            },

            cancelAccount:function(){
                $.when(kendo.ui.ExtYesNoDialog.show({ 
                    title: "Confirm Account Cancel", message:"Are you sure you wish to cancel this account? You will be unable to process any further transactions." ,icon:"k-ext-warning",
                })).done(function (response) {
                    if(response.button=="No") 
                        return;
                    else if(response.button=="Yes") {
                        $.ajax({
                            
                            url:  "/parse/functions/vendorCancelAccount",
                            dataType: "json",
                            type:"POST",
                            headers: appModel.parse._headers,
                            data:kendo.stringify({
                                vendorId: appModel.userInfo.vendorID
                            }),
                            success: function(result) {

                                amplify.store("trcked.com",null);
                                window.location.replace("index.htm");
                                kendoNotification.show({title:"Account Cancelled",message:"Your account has been cancelled."},"success");

                            },

                            error: function(jqXHR,textStatus,errorThrown) {
                                    kendoNotification.show({title:"Error!",message:"An error occured cancelling your account. Please contact support at support@trcked.com"},"error")
                                    handleAjaxError(jqXHR,textStatus,errorThrown);
                            }
                        }); 
                    };
                });
      
            },


            setFacebookPage: function() {

                var self=this;
                // var selectedVal=$("#g-lstFacebookPages").data("kendoDropDownList").value();
                //lstSettingsFacebookPages
                var selectedVal=$("#lstSettingsFacebookPages").data("kendoDropDownList").value();

                if (!selectedVal) {
                    this.set("facebookSelectedPageID",null);
                    return;
                }

                var data = $.grep(this.get("facebookPages"), function (e) {
                    return e.id === selectedVal;
                });

                $.when(appModel.social.setFacebookPage(data[0].id,data[0].access_token)).then(function(result) {
                    self.set("facebookSelectedPageID",data[0].id);
                });

            },

            connectFacebook: function(){
                //console.log('FB Connect!!');
                var self=this;

                $.when(appModel.social.connectFacebook()).then(function(result) {
                    if(result.hasOwnProperty("access_token")) {
                        self.set("facebookAccessToken",result.access_token);
                        self.set("facebookConnected",true);
                        
                        $.when(appModel.social.getFacebookPages(result.access_token)).then(function(result) {
                            if(result.length) {
                                self.set("facebookPages",result);
                            }
                        });

                    }

                    else
                        kendoNotification.show({title:"Error!",message:"An error occured while trying to connect with Facebook"},"error")

                });

            },

            connectTwitter: function(){
                var self=this;

                $.when(appModel.social.connectTwitter()).then(function(serverResponse) {
                    if (serverResponse.hasOwnProperty("authUrl")) {
                            
                        amplify.store("trcked_twitter_authenticated",false);
                        var windowSocialConnect=window.open(serverResponse.authUrl,"_blank","width=600,height=600,location=no");
                        var timer=setInterval(function() {
                            if (!windowSocialConnect){
                                //this probably means that the popup was blocked
                                kendoNotification.show({title:"Popup was blocked",
                                                        message:"Window was blocked by browser. Please allow popup and try again"}, "warning");
                                clearInterval(timer);
                            };

                            if(amplify.store("trcked_twitter_authenticated")) {
                                clearInterval(timer);
                                amplify.store("trcked_twitter_authenticated",null);
                                amplify.store("trcked_twitter_screen_name",null);
                                self.settingsVerifySocialNetworks();
                            }

                            if(windowSocialConnect.closed) {
                                clearInterval(timer);
                                //self.settingsVerifySocialNetworks();
                            }

                        }, 1000);
                            
                    }

                    else
                        kendoNotification.show({title:"Error!",message:"An error occured while trying to get twitter authentication URL"},"error")

                });
            },

            settingsVerifySocialNetworks: function(onlyFacebook, onlyTwitter){
                var self = this;
                return $.when(appModel.social.verifySocialNetworks(onlyFacebook, onlyTwitter)).then(function(serverResponse){
                    
                    if(serverResponse.twitter){
                        self.set("twitterConnected",serverResponse.twitter.connected);
                        self.set("twitterName",serverResponse.twitter.screen_name);
                    }
                    if (serverResponse.facebook){    
                        self.set("facebookConnected",serverResponse.facebook.connected);
                        
                        if(serverResponse.facebook.connected) {
                            self.set("facebookConnected",true);
                            self.set("facebookAccessToken",serverResponse.facebook.userAccessToken);
                            self.set("facebookDefaultPageID",serverResponse.facebook.pageId);

                            // ensure that FB object is available before calling getFacebookPages
                            var timerFB = setInterval(function(){

                                if(typeof FB!="undefined") {
                                    clearInterval(timerFB);

                                    $.when(appModel.social.getFacebookPages(serverResponse.facebook.userAccessToken)).then(function(result) {
                                        if(result.length) {
                                            self.set("facebookPages",result);
                                            //set default page if any
                                            if (self.facebookDefaultPageID)
                                                $("#lstSettingsFacebookPages").data("kendoDropDownList").value(self.facebookDefaultPageID);
                                        }
                                    });   
                                }
                            }, 1000);
                        }
                        
                    }
                });   
            },

            installScheduleToFacebookPage: function(){
                console.log('installing Schedule on FB');
                var self = this;
                if (!this.facebookConnected){
                    //the 'True' below specified that we should only check FB (leave twitter alone)
                    $.when(self.settingsVerifySocialNetworks(true, false))
                    .then(function(serverResponse){

                        //we have re-confirmed the connection, if still not connected, ask user if they wish to connect
                        if (!settingsModel.facebookConnected){
                            $.when(kendo.ui.ExtYesNoDialog.show({ title: "Connect to Facebook?", 
                            message: "Trcked is not connected to your Facebook page. Do this now?",icon:"k-ext-question" }))
                            .done(function (response) {
                                if(response.button=="Yes"){
                                    $('#socialTabAnchor').tab('show'); //display the settings social connect tab
                                }
                            });
                        } else {
                
                            $.ajax({
                                url:  "/parse/functions/installTrckedTabtoFacebook",
                                dataType: "json",
                                type:"POST",
                                headers: appModel.parse._headers,
                                data:kendo.stringify({
                                    vendorId: appModel.userInfo.vendorID,
                                }),
                                success: function(result) {
                                    kendoNotification.show({title:"Schedule Installation Success",message:"Your schedule is now available on your Facebook Page"},"success")
                                },

                                error: function(jqXHR,textStatus,errorThrown) {
                                        console.log(JSON.stringify(jqXHR.responseJSON));

                                        var errorObj = JSON.parse(jqXHR.responseJSON.error);
                                        //console.log(JSON.stringify(errorObj));

                                        kendoNotification.show({title:"Error",message:"Schedule could not be installed: " + errorObj.message},"error")
                                        
                                        handleAjaxError(jqXHR,textStatus,errorThrown);
                                        
                                }
                            });
                        };

                    });

                } else {
                    $.ajax({
                        url:  "/parse/functions/installTrckedTabtoFacebook",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,
                        data:kendo.stringify({
                            vendorId: appModel.userInfo.vendorID,
                        }),
                        success: function(result) {
                            kendoNotification.show({title:"Schedule Installation Success",message:"Your schedule is now available on your Facebook Page"},"success")
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                                kendoNotification.show({title:"Error",message:"Schedule could not be installed: " + JSON.parse(jqXHR.responseJSON.error).message},"error")
                                handleAjaxError(jqXHR,textStatus,errorThrown);
                                
                        }
                    });      
                };


            },

            toggleScheduleToSocial: function(){
                var self = this;
                self.set("publishScheduleToSocial", !this.publishScheduleToSocial);
            },

            verifyQBOConnection:function(){
                var self = this;

                $.ajax({
                    // url:  "/parse/classes/Vendor/"+appModel.userInfo.vendorID,
                    url: '/parse/functions/qboIsConnected',
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data: kendo.stringify({vendorId : appModel.vendorInfo.objectId}),
                    beforeSend:function(){
                        kendo.ui.progress($('body'), true);
                    },
                    complete:function(){
                        kendo.ui.progress($('body'), false);
                    },
                    success: function(httpResponse) {
                        self.set("isQBOConnected", httpResponse.result.isQBOConnected);
                        self.set("qboConnectedCompanyName", httpResponse.result.companyInfo.CompanyName);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                            kendoNotification.show({title:'Communication Error', message:"Unable to verify connection to QBO. Please try again."},"error")
                            // handleAjaxError(jqXHR,textStatus,errorThrown);
                            
                    }
                });
            },

            qboDisconnect:function(){
                var self = this;

                $.ajax({
                    
                    // url:  "/parse/classes/Vendor/"+appModel.userInfo.vendorID,
                    url: '/parse/functions/qboInterfaceDisconnect',
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data: kendo.stringify({vendorId : appModel.vendorInfo.objectId}),
                    beforeSend:function(){
                        kendo.ui.progress($('body'), true);
                    },
                    complete:function(){
                        kendo.ui.progress($('body'), false);
                    },
                    success: function(httpResponse) {
                        self.set("isQBOConnected", false);
                        self.set("qboConnectedCompanyName", "");
                        self.set("extTaxId", "");
                        kendoNotification.show({title:"QBO Disconnected",message:"Mojo is no longer connected to QuickBooks Online."},"success")
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                            kendoNotification.show({title:'Communication Error', message:"Unable to disconnect from QuickBooks Online. Please try again."},"error")
                           
                    }
                });
            },

            togglePublishPrivateEvents: function(){
                var self = this;
                self.set("publishPrivateEvents", !this.publishPrivateEvents);
            },

            viewActivated: function() {

                var self=this;
                //subscribe the tab to the kendo events
                $("#settingsTabStrip li").on("click", function(eventObj){

                    if (eventObj.currentTarget.id == 'socialTab'){
                        self.settingsVerifySocialNetworks();
                    };

                    if (eventObj.currentTarget.id == 'scheduleTab'){
                            //setup the fb publish toggle based on the data in the model
                            if (self.publishPrivateEvents){
                                $('#publishPrivateOn').addClass('btn-primary active');
                                $('#publishPrivateOff').removeClass('btn-primary active');
                            } else {
                                $('#publishPrivateOff').addClass('btn-primary active');
                                $('#publishPrivateOn').removeClass('btn-primary active');                                
                            };

                            //publishScheduleToSocial
                            if (self.publishScheduleToSocial){
                                $('#publishScheduleToSocialOn').addClass('btn-primary active');
                                $('#publishScheduleToSocialOff').removeClass('btn-primary active');
                            } else {
                                $('#publishScheduleToSocialOff').addClass('btn-primary active');
                                $('#publishScheduleToSocialOn').removeClass('btn-primary active');                                
                            };

                        $('.btn-toggle').click(function() {
                            //toggle btn group
                            $(this).find('.btn').toggleClass('active').toggleClass('btn-primary');
                            return false;   
                        });                                 
                    };  

                    if (eventObj.currentTarget.id == 'AccountTab'){
                        self.verifyQBOConnection();
                    };
                });

                //attach the validator for Online Orders tab
                this.validator =  $("#onlineorders").kendoValidator({
                    validateOnBlur: false,
                    rules:{
                        validateEmail: function(input){
                            var isValid = true;
                            if (input.is("#txtOrderReceivedEmail")){
                                var emailList = input.val().split(',');
                                _.forEach(emailList, function(anEmailAddress){
                                    //stripe out any leading or trailing spaces
                                    var emailAddress = String(anEmailAddress).trim();
                                    if (emailAddress != "")
                                        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailAddress)){
                                            isValid = true;
                                        }  else {
                                            isValid = false;
                                        };
                                    return isValid;
                                });
                            };

                            return isValid;
                        }
                    },
                    messages:{
                        validateEmail: "An invalid email has been entered. Please correct."
                    }
                }).data("kendoValidator");  

                //the card library requries JQuery to be global
                window.jQuery = $;

                settingsModel.set("cardObj", new Card({
                    form: '#payment-info-settings',
                    container: '.settings-card-wrapper',

                    formSelectors: {
                        nameInput: '#ccCardHolderName',
                        cvcInput:'#ccardCVC',
                        expiryInput:'#ccardExpiry',
                        numberInput:'#ccCardNumber'

                    },
                    placeholders: {
                        number: '4111 1111 1111 1111',
                        name: 'John Smith',
                        expiry: '12/16',
                        cvc: '123'
                    }
                }) );

            },



            getImage: function(){
                if(this.get("logoFile"))
                    return this.logoFile;      
            
                else
                    return "";      
            },

            showLogoImage: function(){
                var self = this;

                var file=$('.logoUploadWrapper input:file').prop("files")[0];
                
                if(file) {
                    var reader = new FileReader();

                    this.originalFileName=file.name;

                    reader.onload = function (e) {
                        $('.logoUploadWrapper img').attr('src', e.target.result);
                        self.set("isLogoDirty", true);
                    }

                    reader.readAsDataURL(file);
                
                }

                else {

                    this.originalFileName=null;

                    if(this.logoFile) {
                       $(".div-item-image img").attr("src","").attr("src",appDefaults.filesBasePath+appDefaults.dbID+"/"+this.logoFile); 
                       
                    }

                    else
                        $(".div-item-image img").attr("src","");
                }
            },

            launchQBOConnect:function(e){
                var self = this;
                //get the authorization URL from QBO
                var qboConnectWindow = window.open('./qbo_connect.htm?vendorId=' + amplify.store("trcked.com").vendorID,
                    "_blank","width=800,height=500,location=no");      

                //hate to do this but there seems to be no reliable way 
                //to detect when a popup window is closed
                var timer = setInterval(function() {
                    if(qboConnectWindow.closed) {
                        self.verifyQBOConnection();
                        clearInterval(timer);
                    }
                }, 500);

            },

            launchStripeConnect: function(){
                var self = this;

                if (this.get("merchantAccountConnected") == true && this.get("gatewayId") != ""){
                    //the account is currently connected to another mercahnt. Warn the user that this will disconnect the account
                    //from first data
                    $.when(kendo.ui.ExtYesNoDialog.show({ title: "Connect STRIPE?", 
                        message: "Your current merchant account connection will be deleted. Continue?",icon:"k-ext-warning" }))
                        .done(function (response) {
                            if(response.button=="Yes"){
                                var stripeConnectWindow = window.open("https://connect.stripe.com/oauth/authorize?scope=read_write&response_type=code&client_id=" 
                                            + appDefaults.stripeClientId + '&state=' + amplify.store("trcked.com").vendorID, 
                                            "_blank","width=800,height=600,location=no");
                                
                                stripeConnectWindow.onbeforeunload = function(){
                                    self.init(); //by calling this we reload all teh vendor settings
                                };

                            }
                                
                        });    
                } else {
                    var stripeConnectWindow = window.open("https://connect.stripe.com/oauth/authorize?scope=read_write&response_type=code&client_id=" 
                                + appDefaults.stripeClientId + '&state=' + amplify.store("trcked.com").vendorID, 
                                "_blank","width=800,height=600,location=no");
                                
                    stripeConnectWindow.onbeforeunload = function(){
                        self.init(); //by calling this we reload all teh vendor settings
                    };           
                };

            },


            generateNewToken:function(){
                var apiKey = document.getElementById("apikey").value;
                var js_security_key = document.getElementById("js_security_key").value;
                var ta_token = document.getElementById("ta_token").value;

                var deferred= $.Deferred();

                var classList = settingsModel.get("cardObj").$card[0].className;
                for (var i = 0; settingsModel.get("cardTypes").length -1 ; i++){
                    var testObj = settingsModel.get("cardTypes")[i];
                    
                    if ( String(classList).includes(testObj.internalId) ){
                        settingsModel.set("selectedCardType", testObj.payEezyValue);
                        break;
                    }
                };

                //break the full expiration date into month/year which is how Payeezy expects it
                var expirationArray = settingsModel.get("ccExpFull").split('/');
                settingsModel.set("ccExpMonth", String( expirationArray[0]).trim() );
                settingsModel.set("ccExpYear", String( expirationArray[1]   ).trim() );

                //there seems to be some sort of bug in Kendo where the ccNumberDisplay is null even
                //though a value has been entered
                //so if it is null then go get the value from the DOM
                if (settingsModel.get("ccNumberDisplay") == null)
                    settingsModel.set("ccNumberDisplay", $('#ccCardNumber').val());

                //strip our all or any white spaces 
                settingsModel.set("ccNumber", settingsModel.get("ccNumberDisplay").replace(/\s/g, '') );

                Payeezy.setApiKey(apiKey);
                Payeezy.setJs_Security_Key(js_security_key);
                Payeezy.setTa_token(ta_token);
                Payeezy.setAuth(true);
                Payeezy.createToken(function(status, results){
                    // console.log(status);
                    console.log(results);
                    if (results.status && results.status == 'success')
                        deferred.resolve(status, results);
                    else {
                        deferred.reject(results.Error.messages[0]);
                    };
                });

                return deferred.promise();
            },

            saveSettings: function(e) {

                var self=this;
                var vendorSettings={};
                var btnSave=$(e.target);

                if (this.validator.validate() == false){
                    return false;
                };


                e.preventDefault();
                vendorSettings.settings={};

                // if($("#frmSystemSettings").data("kendoValidator").validate()==false)
                //     return;

                btnSave.button("loading");
                vendorSettings.settings.appleBundleId = this.appleBundleId;
                vendorSettings.settings.androidAppId = this.androidAppId;
                vendorSettings.settings.publishPrivateEvents = this.publishPrivateEvents;
                vendorSettings.settings.orderReceivedEmailList = this.orderReceivedEmailList;
                vendorSettings.settings.inventoryAlarmEmailList = this.inventoryAlarmEmailList;
                vendorSettings.settings.inventoryAlarmPhoneList = this.inventoryAlarmPhoneList;
                
                if (this.extTaxId){
                    vendorSettings.settings.qbo = {};
                    vendorSettings.settings.qbo.qboTaxId = this.extTaxId;
                };
                

                if(!this.publishScheduleToSocialTime) this.set("publishScheduleToSocial",false);

                vendorSettings.settings.publishScheduleToSocial = this.publishScheduleToSocial;
                vendorSettings.settings.eventPublishOffset = this.eventPublishTosocialOffset;
                
                if (!this.publishScheduleToSocial)
                    delete vendorSettings.settings.publishScheduleToSocialTime;
                else {
                    vendorSettings.settings.publishScheduleToSocialTime = this.publishScheduleToSocialTime;
                    //vendorSettings.settings.publishScheduleToSocialTime = $("#lstSchedulePostTime").data("kendoDropDownList").value();
                };

                if (this.defaultCurrencyId){
                    vendorSettings.isoCurrency = this.defaultCurrencyId;
                }


                var deferred=$.Deferred();

                var vendorToken = null;

                //check if we have to generate a new credit card token
                if (this.get("ccName") || this.get("ccNumberDisplay")){
                    $.when(this.generateNewToken())
                    .then(function(status, results){
                        console.log(status, results);
                        if (results.token)
                            vendorToken = results.token;
                        
                        deferred.resolve();
                    }).fail(function(error){
                        console.log(error);
                        deferred.reject({code:error.code, message:error.description});
                    });
                } else 
                     deferred.resolve(); //.promise();

                deferred.then(function(){
                    if (self.get("isLogoDirty") == true)
                        return uploadImage(".logoUploadWrapper");

                        // return uploadImage(".logoUploadWrapper", function(){
                        //     var img = $('.logoUploadWrapper img')[0];
                        //     return Parse.Promise.as(img);
                        // });
                    else 
                        return null;
                }).then(function(pictureObj){

                // $.when.apply($, [deferred, uploadImage(".logoUploadWrapper")])
                // .then(function(pictureObj){

                    if(pictureObj) {
                        // vendorSettings.pictureLogo = pictureObj; //{name:pictureObj.name,__type:"File"};  
                        vendorSettings.pictureLogo = {name:pictureObj.name,__type:"File"};
                    }

                    var vendorObject = {};

                    if (vendorToken)
                        vendorSettings.vendorToken = vendorToken;

                    vendorSettings.vendorId = appModel.vendorInfo.objectId;
                    $.ajax({
                        
                        // url:  "/parse/classes/Vendor/"+appModel.userInfo.vendorID,
                        url: '/parse/functions/vendorSettingsUpdate',
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,

                        data: kendo.stringify(vendorSettings),
                        
                        success: function(result) {
                            kendoNotification.show(appDefaults.notificationMessages.saveSuccess,"success");
                            //update app settings
                            if(pictureObj)
                                appModel.set("sysSettings.logoFile",pictureObj.url);

                            if (vendorToken){
                                appModel.vendorInfo.vendorToken = vendorToken;

                                self.set("ccOnFile", appModel.vendorInfo.vendorToken.type + ' - ' + String(appModel.vendorInfo.vendorToken.value).slice(-4));
                                self.set("nextBillDate", moment(appModel.vendorInfo.nextBillDate).format("dddd, MMMM Do YYYY"));
                            } else {
                                self.set("ccOnFile", 'No card on file');
                                self.set("nextBillDate", 'None');
                            };

                            self.set("isLogoDirty", false);

                            //update the appModel
                            appModel.set("sysSettings", vendorSettings);
                            
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                                kendoNotification.show(appDefaults.notificationMessages.saveError,"error")
                                handleAjaxError(jqXHR,textStatus,errorThrown);
                                
                        },

                        complete: function(result)  {
                            btnSave.button("reset");
                        }
                    });


                }).fail(function(error){
                    kendoNotification.show({title:'Card Not Added', message:error.message},"error");
                    btnSave.button("reset");
                });


            }



        });
    }

    var settingsModel=null;

    /* Private Functions
    
    */

    function isUserLoggedIn(){

        var deferred=$.Deferred();

        if(amplify.store("trcked.com")) {

            appModel.parse._headers["X-Parse-Session-Token"]=amplify.store("trcked.com").sessionToken;

            // ensure that the user session has not expired
            // make a test call to the database
            $.ajax({
                    
                    url:  "/parse/users/"+amplify.store("trcked.com").userID,
                    dataType: "json",
                    type:"GET",
                    headers: appModel.parse._headers,
                    
                    success: function(result) {
                        console.log('logged in user : ' + JSON.stringify(result));
                        deferred.resolve(result.emailValidated);
                    },

                    error: function() {

                        deferred.resolve(false);
                    }
                });
        }

        else
            deferred.resolve(false);

        return deferred.promise();
    }

    function editResizePanel(){
        if (window.innerHeight <= parseInt($("#appContentEditContainer").find('form:visible').css("height")) ){
            // $('#appContentEditContainer').addClass("stopOverflow");
            // $('#appContentEditContainer').height(window.innerHeight);
            // $("#appContentEditContainer").find('form:visible').css({"max-height":window.innerHeight});
            $("#appContentEditContainer").find('form:visible').css({"max-height":"100%"});
            // $('#appContentEditContainer')
            // .find('form:visible')
            // .find('.k-content.k-state-active').css({'max-height': function(){return window.innerHeight * .75}});

            // console.log('1');
            // .find('.k-content.k-state-active').height(window.innerHeight * .75);

        } else {
            // $('#appContentEditContainer').removeClass("stopOverflow");
            $('#appContentEditContainer').height('auto');
            // console.log('2');
            
            // var maxHeight = $('#appContentEditContainer').find('form:visible').find('.k-content.k-state-active').css('max-height');
            // console.log('max-height is ' + maxHeight);

        };

        //resize the content tab to 75% of the window height (which is being resized)
        $('#appContentEditContainer')
        .find('form:visible')
        .find('.k-content.k-state-active').css({'max-height': function(){return window.innerHeight * .75}});

    }

    function toggleEditor() {

        // $('#appContentContainer').toggleClass('col-md-12 col-md-8');
        $('#appContentContainer').toggleClass('col-xs-12');
        $('#appContentEditContainer').toggle();

        if($("#appContentContainer").hasClass("col-xs-12")) {
            $("#divOverlay").remove();
        }

        else {
            // add overlay div
            $("<div/>").css({
                "position": "absolute",
                "width": "100%",
                "height": "100%",
                "top": 0,
                "left": 0,
                "background": "#fff",
                "zIndex": 10000,
                "opacity": 0.7
            }).attr("id","divOverlay").appendTo("#appContentContainer");


            //get the active tab strip (if there is one)
            //and bind to its tab activate event so we can resize the contents
            var tabStrip = $('#appContentEditContainer')
                .find('form:visible')
                .find('.k-tabstrip').data("kendoTabStrip");

            if (tabStrip){
                //set the first tab pane as visible (initial state)
                tabStrip.select(0);

                tabStrip.bind("activate", function(eventObject){
                    //recalculate the height, scroll bars etc
                    $(eventObject.contentElement).css('max-height', window.innerHeight * .75);
                });
            }
        }

        if($('#appContentEditContainer').hasClass("col-xs-12")){
            $(".form-record-edit :input:text:enabled:visible:first").focus()
        };
        editResizePanel();
    }

    function loadHelpContent() {
       
        $.ajax({
                url: "./help"+ appModel.currentRoute+".htm"

                }).success(function(data) {
                   $("#appHelp .help-content").html(data);
                });
    }

    function imageUploadProgress(e,divContainer){

        $(divContainer+" .progress-bar").data("kendoProgressBar").value(parseInt(e.loaded/e.total)*100);
    }

    function blockContent(element,messageHeading,messageText) {
        
        messageHeading=messageHeading || "";
        if(messageHeading.length) messageHeading="<h4>"+messageHeading+"</h4>";

        messageText=messageText || "";
        if(messageText.length) messageText="<p>"+messageText+"</p>";

        element=element?$(element):$(window);

        element.block({message:messageHeading+messageText});

    }

    function showContent(element) {

        element=element?$(element):$(window);
        element.unblock();
    }


    function uploadMenuItemImage(targetImg, newFileName){
        var self = this;

        var deferred = $.Deferred();

        //just upload the src of this image
        payload = targetImg.src;

        payload = payload.substring(payload.indexOf(',')+1);
        var fileObject = new Parse.File(newFileName.replace(/\s+/g, ''), { base64: payload });
        
        // kendo.ui.progress($('#frmMenuItemRecordEdit'), true);

        fileObject.save({
            success:function(fileResult){
                //console.log('file saved...');
                // $(divContainer+" .div-upload-progress").css("visibility","hidden");
                //$(targetobject).closest(" .div-upload-progress").hide();
                //$(targetobject).closest('input:file').val("");
                // kendo.ui.progress($('#frmMenuItemRecordEdit'), false);

                deferred.resolve(fileResult);
            },
            error: function(error){
                console.log(error);
                // $(targetobject).closest(".div-upload-progress").hide();
                // $(targetobject).closest('input:file').val("");
                // kendo.ui.progress($('#frmMenuItemRecordEdit'), false);
                deferred.reject(error);
            }
        });

        return deferred;

    }

    function uploadImage(divContainer, callbackValidation){

        var deferred = $.Deferred();

        var file=$(divContainer+' input:file').prop("files")[0];
        
        if (file) {      // we have a file upload it first
            
            var reader = new FileReader();
            var pictureObj=null;
            var header=$.extend({},appModel.parse._headers);

            header["Content-Type"]=file.type;

            $(divContainer+" .progress-bar").data("kendoProgressBar").value(0);
            // $(divContainer+" .div-upload-progress").css("visibility","visible");
            $(divContainer+" .div-upload-progress").show();

            reader.onload = function(e) {
                var validateDeferred = $.Deferred();

                if (callbackValidation){
                    
                    callbackValidation(file)
                    .done(function(imageObject){
                        if (imageObject != false){
                            validateDeferred.resolve(imageObject);
                        }
                    });
                        
                }   else 
                        validateDeferred.resolve();

                validateDeferred.done(function(imageObject){
                    var payload;

                    if (imageObject){
                        $(".div-item-list-image img").attr("src", imageObject.src);
                        payload = imageObject.src;

                        payload = payload.substring(payload.indexOf(',')+1);
                        var fileObject = new Parse.File(file.name.replace(/\s+/g, ''), { base64: payload });
                        
                        fileObject.save({
                            success:function(fileResult){
                                //console.log('file saved...');
                                // $(divContainer+" .div-upload-progress").css("visibility","hidden");
                                $(divContainer+" .div-upload-progress").hide();
                                $(divContainer+' input:file').val("");
                                deferred.resolve(fileResult);
                            },
                            error: function(error){
                                console.log(error);
                            }
                        });
                    } else {
                        $.ajax({
                                headers: header,
                                url:  'parse/files/'+file.name.replace(/\s+/g, ''),
                                type: 'POST',
                                xhr: function() {
                                    myXhr = $.ajaxSettings.xhr();
                                    if(myXhr.upload){ // if upload property exists
                                        myXhr.upload.addEventListener('progress', imageUploadProgress(e,divContainer));
                                    }
                                    
                                    return myXhr;
                                },
                                
                                //Ajax events
                                success: completeHandler = function(resultData) {
                                    
                                    pictureObj=resultData;
                                    // pictureObj.data = e.target.result; //return the image data as part of the result
                                    /*
                                    * workaround for crome browser // delete the fakepath
                                    */
                                    // if(navigator.userAgent.indexOf('Chrome')) {
                                    //     var catchFile = $(":file").val().replace(/C:\\fakepath\\/i, '');
                                    // }
                                    // else {
                                    //     var catchFile = $(":file").val();
                                    // };

                                    deferred.resolve(pictureObj);
                                    
                                },

                                error: errorHandler = function() {
                                    alert("failed upload");
                                },

                                complete:function() {
                                    
                                    // $(divContainer+" .div-upload-progress").css("visibility","hidden");
                                    $(divContainer+" .div-upload-progress").hide();
                                    $(divContainer+' input:file').val("");
                                    // deferred.resolve(pictureObj);
                                },
                
                                data: e.target.result,
                                //Options to tell JQuery not to process data or worry about content-type
                                cache: false,
                                contentType: false,
                                processData: false
                        }, 'json');  
                    };


                              
                });
            };
            //reader.readAsDataURL(file);
            reader.readAsArrayBuffer(file);
        } else
            deferred.resolve();
            
        return deferred.promise();
    
    }

    function convertUTCDateToLocalDate(date) {
        var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);

        var offset = date.getTimezoneOffset() / 60;
        var hours = date.getHours();

        newDate.setHours(hours - offset);

        return newDate;   
    }

    function getParameterByName(name) {
      name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
      var regexS = "[\\?&]"+name+"=([^&#]*)";
      var regex = new RegExp( regexS );
      var results = regex.exec( window.location.href );
      if( results == null )
        return "";
      else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function cleanURL() {

        var clean_uri = location.protocol + "//" + location.host + location.pathname;
        
        var hash_pos = location.href.indexOf("#");
        if (hash_pos > 0) {
            var hash = location.href.substring(hash_pos, location.href.length);
            clean_uri += hash;
        }
        
        window.history.replaceState({}, document.title, clean_uri);
    }

    function getBaseUrl() {
        var url = location.href;  // entire url including querystring - also: window.location.href;
        var baseURL = url.substring(0, url.indexOf('/', 14));


        if (baseURL.indexOf('http://localhost') != -1) {
            // Base Url for localhost
            var url = location.href;  // window.location.href;
            var pathname = location.pathname;  // window.location.pathname;
            var index1 = url.indexOf(pathname);
            var index2 = url.indexOf("/", index1 + 1);
            var baseLocalUrl = url.substr(0, index2);

            return baseLocalUrl + "/";
        }
        else {
            // Root Url for domain name
            return baseURL + "/";
        }
    }

    function handleAjaxError(jqXHR,textStatus,errorThrown) {

        var errMsg="Status: " + textStatus + "<br/>Error: " +errorThrown +"<br/><br/>Please contact support"; 
        kendoNotification.show({title:"Error Info",message: errMsg},"info");

    }

    function logError(details) {
        
        if(!appDefaults.logErrors) return;

        $.ajax({
            global: false,
            url:  "/parse/classes/errorLog",
            dataType: "json",
            type:"POST",
            headers: appModel.parse._headers,

            data:kendo.stringify({
                context: navigator.userAgent,
                details: details
            }),
            
            success: function(result) {
               
            },

            error: function(jqXHR,textStatus,errorThrown) {
               
            }
                
        });

    }


    /* Layout & Views 
        -- we first define the master layout "tmplMasterLayout"
        -- views are rendered in sections within the masterView
    */
    var masterView = new kendo.Layout("tmplMasterLayout");                      
    var navMenuView = new kendo.View("tmplMainNav",{
                        model:appModel,
                        show: function() {
                            
                        }
                    });          
    
    var UserSignInView = function(model) { 
         return new kendo.View("tmplUserSignIn", {
            model: model,
            show:function(){
                model.attachValidator();
                
                if(getParameterByName("verifyid"))
                    model.completeEmailValidation(getParameterByName("verifyid"));

                if(getParameterByName("resetid")) {
                    model.resetRequestID=getParameterByName("resetid");
                    $("#frmSignIn").hide();
                    $("#frmResetPassword").show();

                }
            }
        });
    }

    var userSignInView=null;

    var UserProfileView = function(model) { 
         return new kendo.View("tmplUserProfile", {
            model: model,
            show:function(){
                model.attachValidator();
                
            }
        });
    }

    var userProfileView=null;
    
    var DashboardView =  function(model) {
        return new kendo.View("tmplDashboard", {
                        model: model,
                        
                        show:function(){
                            model.init()
                            .then(function(){
                                model.setViewData();    
                            });
                            
                        }
                    });
    }

    var dashboardView=null;

    var footerView = new kendo.View("tmplFooter");                           

    var InventoryView =  function(model) {
        return new kendo.View("tmplInventory", {
                        model: model,
                        
                        show:function(){
                            model.attachValidator();
                            model.setViewState();
                        }
                    });

    }

    var inventoryView=null;
    
    var TruckView =  function(model) {
        return new kendo.View("tmplTrucks", {
                        model: model,
                        
                        show:function(){
                            model.attachValidator();
                            model.setViewState();
                        }
                    });
    }

    var truckView=null;

    var SalesSummaryReportsView = function(model){
        return new kendo.View("tmplSalesSummaryReport", {
            model:model,
            show:function(){
                model.setViewState();
            }
        });
    }

    var SalesBreakdownReportsView = function(model){
        return new kendo.View("tmplSalesBreakdownReport", {
            model:model,
            show:function(){
                model.setViewState();
            }
        });
    }

    var salesBreakdownReportsView = null;

    var TransHistoryReportView = function(model){
        return new kendo.View("tmplTransReportHistory", {
            model:model,
            show:function(){
                model.setViewState();
            }
        });
    }

    var transHistoryReportView = null;

    var TopModifiersReportsView = function(model){
        return new kendo.View("tmplModifiersReport", {
            model:model,
            show:function(){
                model.setViewState();
            }
        });
    }

    var topModifiersReportsView = null;

//tmplDiscountUsageReport
    var DiscountUsageReportsView = function(model){
        return new kendo.View("tmplDiscountUsageReport", {
            model:model,
            show:function(){
                model.setViewState();
            }
        });
    }

    var discountUsageReportsView = null;

    var Top5ReportsView = function(model){
        return new kendo.View("tmplTopFiveReport", {
            model:model,
            show:function(){
                model.setViewState();
            }
        });
    }

    var top5ReportsView = null;

    var TxVolumeReportView = function(model){
        return new kendo.View("tmplTxVolumeReport", {
            model:model,
            show:function(){
                model.setViewState();
            }
        });
    }

    var txVolumeReportView = null;
    
    var MenuItemView = function(model) { 
         return new kendo.View("tmplMenuItem", {
            model: model,

            show:function(){
                model.attachValidator();
                // model.setDropTargetAreas();
                model.setViewState();
            }

         });
    }

    var MenuItemOptionsView = function(model) { 
         return new kendo.View("tmplMenuItemOptions", {
            model: model,

            show:function(){
                model.attachValidator();
                model.setViewState();
            }

         });
    }

    var MenuView = function(model) { 
         return new kendo.View("tmplMenu", {
            model: model,

            show:function(){
                model.attachValidator();
                model.setDropTargetAreas();
                model.setViewState();
            }

         });
    }

    var menuView=null;

    var TaxView = function(model) { 
         return new kendo.View("tmplTaxes", {model: model});
    }

    var taxView=null;

    var DiscountsView = function(model){
         return new kendo.View("tmplDiscounts", {model: model,
            show:function(){
                model.attachValidator();
                model.setViewState();
            }
         });
    }

    var discountsView = null;

    var StaffView = function(model) { 
         return new kendo.View("tmplStaff", {
            model: model,
            show: function(){
                model.attachValidator();
            }
        });
    }

    var staffView=null;

    var ScheduleView = function(model) {

         return new kendo.View("tmplSchedule", {
            model: model,
            show:function(){
                model.attachValidator();
                model.initCalendar();
                model.setViewState();
            },

            init: function() {

            }
        });
    }

    var scheduleView=null;

    var SocialView = function(model) { 
        return new kendo.View("tmplSocial", {
            model: model,
            show: function() {
                model.initSocial();
            }
        });
    }

    var socialView=null;

    var SocialConnectView = function(model) { 
        return new kendo.View("tmplSocialConnect", {
            model: model,
            show: function() {
                model.initSocial();
            }
        });
    }

    var socialConnectView=null;

    var SettingsView = function(model) {
         return new kendo.View("tmplSystemSettings", {
            model: model,
            show: function() {
                model.viewActivated();
                deferredCalcHeight(".tab-pane");
            }

         });
    }

    var settingsView=null;


   /* Router
        -- KendoUI Router
        -- SPA design where all views are loaded on demand within the same page
   */
    
    var appRouter = new kendo.Router({
        init: function () {
            masterView.render("#appMain");

        },

        change: function(e) {
            // console.log('App Router change event ');
            // console.log(e);

            // do not allow the user to navigate another page if not signed in!
            if(!(amplify.store("trcked.com") && amplify.store("trcked.com").emailValidated) && e.url!=appDefaults.routeNames.signin) {
                console.log('preventing user from changing to another page without a valid logon! Cheeky!!!');
                window.location.replace("index.htm?force_login=1")
                //alert('booyah!');
                return;
            }

            // KendoUI window may still contain reference to a previous view window
            // hence need to explicity destroy references to any existing modal window
            // if it exist in the DOM!
            $("#mapWindow") && $("#mapWindow").data("kendoWindow") && $("#mapWindow").data("kendoWindow").destroy();

            // destroy all existing views first
            dashboardView && dashboardView.destroy();
            userSignInView && userSignInView.destroy();
            userProfileView && userProfileView.destroy();
            truckView && truckView.destroy();
            inventoryView && inventoryView.destroy();
            menuView && menuView.destroy();
            discountsView && discountsView.destroy();
            staffView && staffView.destroy();
            scheduleView && scheduleView.destroy();
            socialView && socialView.destroy();
            taxView && taxView.destroy();
            socialConnectView && socialConnectView.destroy();
            settingsView && settingsView.destroy();

            appModel.currentRoute=e.url;
            
            //loadHelpContent();

        },

        back: function(e) {
            e.preventDefault();
        }

    });

    // Root View
    appRouter.route('/', function () {

        dashboardModel=DashboardModel();

        $.when(dashboardModel.init()).then(function() {
            // $('#appMain').addClass('cssload-thecube');
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", dashboardView=DashboardView(dashboardModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            // $('#appMain').removeClass('cssload-thecube');
        });
        
    });

    // user profile
    appRouter.route('/profile',function() {
        userProfileModel = UserProfileModel();
        
        $.when(userProfileModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", userProfileView=UserProfileView(userProfileModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
        
        })
    });

    // Trucks
    appRouter.route('/trucks(/:params)', function (params) {
        
        truckModel=  TruckModel();
        
        if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
            appModel.modelParams=null;

        blockContent();
        
        $.when(truckModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", truckView=TruckView(truckModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();
            
        })

        
    });

    // Trucks
    appRouter.route('/inventory(/:params)', function (params) {
        
        inventoryModel=  InventoryModel();
        
        if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
            appModel.modelParams=null;

        blockContent();
        
        $.when(inventoryModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", inventoryView=InventoryView(inventoryModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();

            var onKeyUpHandler = function(eventObj){
                //in the keypress event bind a filter
                console.log(eventObj);
                var searchTerm = eventObj.currentTarget.value; // + String.fromCharCode(eventObj.keyCode);
                inventoryModel.get("inventoryList").filter( {field:"text", operator:"contains", value: String(searchTerm)  } );
                inventoryModel.get("inventoryList").fetch();
            };

            $('#inputSearchInventoryItems').off('keyup', {}, onKeyUpHandler);
            $('#inputSearchInventoryItems').on('keyup', {}, onKeyUpHandler);
        })

        
    });


    //Menu Item Options
    appRouter.route('/menuItemOptions(/:params)', function (params) {
        
        menuModel=  MenuModel();
        blockContent();

        if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
            appModel.modelParams=null;
        
        $.when(menuModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", menuView=MenuItemOptionsView(menuModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();

            var onKeyUpHandler = function(eventObj){
                //in the keypress event bind a filter
                console.log(eventObj);
                var searchTerm = eventObj.currentTarget.value; // + String.fromCharCode(eventObj.keyCode);
                menuModel.get("menuItemOptions").filter( {field:"name", operator:"contains", value: String(searchTerm)  } );
                menuModel.get("menuItemOptions").fetch();
            };

            $('#inputSearchMenuOptionGroups').off('keyup', {}, onKeyUpHandler);
            $('#inputSearchMenuOptionGroups').on('keyup', {}, onKeyUpHandler);
        })

    });

    // Menu Items
    appRouter.route('/menuItems(/:params)', function (params) {
        
        menuModel=  MenuModel();
        blockContent();

        if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
            appModel.modelParams=null;
        
        $.when(menuModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", menuView=MenuItemView(menuModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();

            var onKeyUpHandler = function(eventObj){
                //in the keypress event bind a filter
                console.log(eventObj);
                var searchTerm = eventObj.currentTarget.value; // + String.fromCharCode(eventObj.keyCode);
                menuModel.get("allMenuItems").filter( {field:"name", operator:"contains", value: String(searchTerm)  } );
                menuModel.get("allMenuItems").fetch();
            };

            $('#inputSearchMenuItems').off('keyup', {}, onKeyUpHandler);
            $('#inputSearchMenuItems').on('keyup', {}, onKeyUpHandler);

        })

    });

    // Menus
    appRouter.route('/menu(/:params)', function (params) {
        
        menuModel=  MenuModel();
        blockContent();

        if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
            appModel.modelParams=null;
        
        $.when(menuModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", menuView=MenuView(menuModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();

            var onKeyUpHandler = function(eventObj){
                //in the keypress event bind a filter
                console.log(eventObj);
                var searchTerm = eventObj.currentTarget.value; // + String.fromCharCode(eventObj.keyCode);
                menuModel.get("allMenuItems").filter( {field:"name", operator:"contains", value: String(searchTerm)  } );
                menuModel.get("allMenuItems").fetch();
            };

            $('#inputSearchMenuItems').off('keyup', {}, onKeyUpHandler);
            $('#inputSearchMenuItems').on('keyup', {}, onKeyUpHandler);

        })

    });

    appRouter.route('/discounts(/:params)', function (params) {
        
        discountsModel=  DiscountsModel();
        blockContent();

        if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
            appModel.modelParams=null;
        
        $.when(discountsModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", discountsView=DiscountsView(discountsModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();

        })

    });

    // Taxes
    appRouter.route('/taxes', function () {
        
        taxModel =TaxModel();
        blockContent();
        
        $.when(taxModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", taxView=TaxView(taxModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();
        })
        
    });

    // Staff
    appRouter.route('/staff', function () {
        
        staffModel= StaffModel();
        blockContent();
        
        $.when(staffModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", staffView=StaffView(staffModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();
            
        })

    });

    // Schedule
    appRouter.route('/schedule(/:params)', function (params) {
        
        menuModel=  MenuModel();
        scheduleModel= ScheduleModel();
        
        blockContent();

        if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
            appModel.modelParams=null;
        
        $.when(scheduleModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", scheduleView=ScheduleView(scheduleModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();
            

        })

    });

    // Social
    appRouter.route('/social(/:params)', function (params) {
        

        socialModel= SocialModel();
        blockContent();

        if(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object") {

            socialModel.set("socialPost",appModel.modelParams.facebookPost);
            socialModel.set("twitterPost",appModel.modelParams.twitterPost);
            socialModel.set("parentColl",appModel.modelParams.parentColl);
            socialModel.set("imgURL",appModel.modelParams.hasOwnProperty("imgURL")?appModel.modelParams.imgURL:"");
            socialModel.set("locationData",appModel.modelParams.hasOwnProperty("locationData")?appModel.modelParams.locationData:null);
            socialModel.set("eventDate",appModel.modelParams.hasOwnProperty("date")?appModel.modelParams.date:null);
            socialModel.set("isEvent",appModel.modelParams.hasOwnProperty("isEvent")?appModel.modelParams.isEvent:null);

        };

        $.when(socialModel.init()).then(function() {
        
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", socialView=SocialView(socialModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();

        });
        
    });

    // Schedule
    appRouter.route('/reports(/:params)', function (dummy, params) {
        // console.log(params);

        switch (params.id){
            case 'txVolume':
                atxVolumeReportModel =  TxVolumeReportsModel();
                
                blockContent();

                if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
                    appModel.modelParams=null;
                
                $.when(atxVolumeReportModel.init()).then(function() {
                    masterView.showIn("#appNavBar", navMenuView);
                    masterView.showIn("#appContent", txVolumeReportsView=TxVolumeReportView(atxVolumeReportModel));
                    masterView.showIn("#appFooter", footerView);
                    $(window).trigger('resize');
                    showContent();
                });    
                break;
            case 'salesSum':
                aSalesSummaryReportsModel =  PosSalesSummaryReportsModel();
                
                blockContent();

                if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
                    appModel.modelParams=null;
                
                $.when(aSalesSummaryReportsModel.init()).then(function() {
                    masterView.showIn("#appNavBar", navMenuView);
                    masterView.showIn("#appContent", salesSummaryReportsView=SalesSummaryReportsView(aSalesSummaryReportsModel));
                    masterView.showIn("#appFooter", footerView);
                    $(window).trigger('resize');
                    showContent();
                });
                break;
            case 'salesBreakdown':
                aSalesBreakdownReportsModel =  SalesBreakdownModel();
                
                blockContent();

                if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
                    appModel.modelParams=null;
                
                $.when(aSalesBreakdownReportsModel.init()).then(function() {
                    masterView.showIn("#appNavBar", navMenuView);
                    masterView.showIn("#appContent", salesBreakdownReportsView=SalesBreakdownReportsView(aSalesBreakdownReportsModel));
                    masterView.showIn("#appFooter", footerView);
                    $(window).trigger('resize');
                    showContent();
                });
                break;
            case 'discountUsage':
                aDiscountUsageReportModel =  DiscountUsageReportsModel();
                
                blockContent();

                if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
                    appModel.modelParams=null;
                
                $.when(aDiscountUsageReportModel.init()).then(function() {
                    masterView.showIn("#appNavBar", navMenuView);
                    masterView.showIn("#appContent", aDiscountUsageReportModel=DiscountUsageReportsView(aDiscountUsageReportModel));
                    masterView.showIn("#appFooter", footerView);
                    $(window).trigger('resize');
                    showContent();
                });
                break;   

            case 'topModifiers':
                atopModifiersReportModel =  TopModifiersReportsModel();
                
                blockContent();

                if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
                    appModel.modelParams=null;
                
                $.when(atopModifiersReportModel.init()).then(function() {
                    masterView.showIn("#appNavBar", navMenuView);
                    masterView.showIn("#appContent", topModifiersReportsView=TopModifiersReportsView(atopModifiersReportModel));
                    masterView.showIn("#appFooter", footerView);
                    $(window).trigger('resize');
                    showContent();
                });
                break;            
            case 'top5':
                atop5ReportModel =  Top5ReportsModel();
                
                blockContent();

                if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
                    appModel.modelParams=null;
                
                $.when(atop5ReportModel.init()).then(function() {
                    masterView.showIn("#appNavBar", navMenuView);
                    masterView.showIn("#appContent", top5ReportsView=Top5ReportsView(atop5ReportModel));
                    masterView.showIn("#appFooter", footerView);
                    $(window).trigger('resize');
                    showContent();
                });
                break;
            case 'transHist':
                aTransHistoryReportModel =  TransHistoryReportModel();
                
                blockContent();

                if(!(params && params=="getParams" && appModel.modelParams && typeof appModel.modelParams==="object"))
                    appModel.modelParams=null;
                
                $.when(aTransHistoryReportModel.init()).then(function() {
                    masterView.showIn("#appNavBar", navMenuView);
                    masterView.showIn("#appContent", transHistoryReportView=TransHistoryReportView(aTransHistoryReportModel));
                    masterView.showIn("#appFooter", footerView);
                    $(window).trigger('resize');
                    showContent();
                });
                break;
        }

    });
    // System Settings
    appRouter.route('/settings(/:targetNavAnchor)', function (targetNavAnchor) {

        settingsModel= SettingsModel();
        blockContent();
        
        $.when(settingsModel.init()).then(function() {
            masterView.showIn("#appNavBar", navMenuView);
            masterView.showIn("#appContent", settingsView=SettingsView(settingsModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
            showContent();
            if (targetNavAnchor){
                $('#' + targetNavAnchor).trigger('click');
            };
        })

    });

    /* App Init
        -- this function is called on document ready
        -- perform standard init procedures
    */
    $(function() {
        $('#appMain').addClass('cssload-thecube');
        // appModel.set("isLoading", true);
        //load app defaults
        var trckedConfig;
        if (String(window.location.href).indexOf('//app.') > 0){
            trckedConfig = 'trcked_app.json';
        } else
            trckedConfig = 'trcked_dev.json';
        
        $.ajax({    
            url: trckedConfig,
            type: "GET",
            headers:{"Content-Type":"application/json"},
            
            success:function(result){
                appDefaults = result;
                if (typeof appDefaults == 'string')
                    appDefaults = JSON.parse(appDefaults);

                // Parse.initialize(appDefaults.parse.applicationID, appDefaults.parse.JSKey);

                Parse.initialize(appDefaults.parse.applicationID);
                Parse.serverURL = window.location.origin + '/parse';
                console.log('Parse server URL' + Parse.serverURL);

                 // application wide error handler
                window.onerror = function(message, file, line) {
                    logError(file + ':' + line + '\n\n' + message);
                };

                //subscribe to the window resize
                $(window).resize(function() {
                    //resize just happened, pixels changed
                    editResizePanel();
                });

                $(document).ajaxError(function(e, xhr, settings) {
                    logError(settings.url + ':' + xhr.status + '\n\n' + xhr.responseText);
                });
                
                // load the templates
                templatesLoader.loadExtTemplates([
                    {path:"templates/_user.tmpl.htm",tag:"tmplUserSignIn"},
                    {path:"templates/_userProfile.tmpl.htm",tag:"tmplUserProfile"},
                    {path:"templates/_footer.tmpl.htm",tag:"tmplFooter"},
                    {path:"templates/_dashboard.tmpl.htm",tag:"tmplDashboard"},
                    {path:"templates/_mainNav.tmpl.htm",tag:"tmplMainNav"},
                    {path:"templates/_menu.tmpl.htm",tag:"tmplMenu"},
                    {path:"templates/_discounts.tmpl.htm",tag:"tmplDiscounts"},
                    {path:"templates/_menuItem.tmpl.htm",tag:"tmplMenuItem"},
                    {path:"templates/_menuItemOptions.tmpl.htm",tag:"tmplMenuItemOptions"},
                    {path:"templates/_notifications.tmpl.htm",tag:"tmplNotifications",noWrap:true},
                    {path:"templates/_trucks.tmpl.htm",tag:"tmplTrucks"},
                    {path:"templates/_inventory.tmpl.htm",tag:"tmplInventory"},
                    {path:"templates/_taxes.tmpl.htm",tag:"tmplTaxes"},
                    //{path:"templates/_stocklist.tmpl.htm",tag:"tmplStockList"},
                    // {path:"templates/_stockReport.tmpl.htm",tag:"tmplStockReport"},

                    {path:"templates/_staff.tmpl.htm",tag:"tmplStaff"},
                    {path:"templates/_schedule.tmpl.htm",tag:"tmplSchedule"},
                    {path:"templates/_social.tmpl.htm",tag:"tmplSocial"},
                    {path:"templates/_salesSummaryReport.tmpl.htm",tag:"tmplSalesSummaryReport"},
                    {path:"templates/_salesBreakdownReport.tmpl.htm",tag:"tmplSalesBreakdownReport"},
                    {path:"templates/_top5Report.tmpl.htm",tag:"tmplTopFiveReport"},
                    {path:"templates/_topModifiersReport.tmpl.htm",tag:"tmplModifiersReport"},
                    {path:"templates/_discountUsageReport.tmpl.htm",tag:"tmplDiscountUsageReport"},
                    {path:"templates/_transHistoryReport.tmpl.htm", tag:"tmplTransReportHistory"},
                    {path:"templates/_socialconnect.tmpl.htm",tag:"tmplSocialConnect"},
                    {path:"templates/_systemSettings.tmpl.htm",tag:"tmplSystemSettings"}
                                                    
                ]);


                // start the application after the templates have loaded
                $(document).bind("TEMPLATES_LOADED", function() {

                    //init notifications
                    kendoNotification = $("#kendoNotification").kendoNotification({
                                position: {
                                    pinned: true,
                                    top: 30,
                                    right: 30
                                },
                                autoHideAfter: 4000,
                                stacking: "down",
                                templates: [
                                 {
                                    type: "info",
                                    template: $("#infoTemplate").html()
                                },

                                {
                                    type: "error",
                                    template: $("#errorTemplate").html()
                                }, {
                                    type: "success",
                                    template: $("#successTemplate").html()
                                }]
                    }).data("kendoNotification");

                    // Dimensions
                    // $(window).resize(function(){
                    //     var contentH = $(window).height()-$("#appNavBar").height()-$("#appFooter").height();
                    //     var wrapperH = $('#appContentEditContainer').height();
                    //     if(contentH > wrapperH) {
                    //         $('#appContentEditContainer').css({'height':contentH+'px'});
                    //         $('#appContentContainer').css({'height':contentH+'px'});
                    //     }

                    // });

                    //set parse data
                    appModel.parse._headers["Content-Type"]="application/json";
                    appModel.parse._headers["X-Parse-Application-Id"]=appDefaults.parse.applicationID;                 
                    appModel.parse._headers["X-Parse-REST-API-Key"]=appDefaults.parse.restAPIKey;



                    $.when(isUserLoggedIn()).then(function(loggedIn) {
                        console.log('LoggedIn is ' + loggedIn);
                        if (loggedIn) {
                            appModel.userInfo.userID=amplify.store("trcked.com").userID;
                            appModel.set("userInfo.userName",amplify.store("trcked.com").userName);
                            appModel.userInfo.sessionToken=amplify.store("trcked.com").sessionToken;
                            appModel.userInfo.vendorID=amplify.store("trcked.com").vendorID;
                            appModel.userInfo.emailValidated=amplify.store("trcked.com").emailValidated;

                            appModel.parse._vendor={__type:"Pointer", "objectId":appModel.userInfo.vendorID, "className": "Vendor"};

                            //init the app
                            appModel.init()
                            .then(function(){
                                // start the kendo router
                                appRouter.start();
                                // appModel.set("isLoading", false);
                                $('#appMain').removeClass('cssload-thecube');                              
                            });


                        }

                        else {
                            //redirect to the login page
                            console.log('user is not logged in. Send back to index.htm...');
                            amplify.store("trcked.com",null);
                            window.location.replace("index.htm")
                            $('#appMain').removeClass('cssload-thecube');
                            // appModel.set("isLoading", false);
                        }

                    });
    

                });               
            },
            
            error: function(){
                alert( trckedConfig + ' could not be loaded.');
            }
        });

        //load facebook lib
        //facebook API init
        window.fbAsyncInit = function() {

            FB.init({
              appId      : appDefaults.facebookAppID,
              xfbml      : true,
              version    : 'v2.6',
              cookie     : true,
              status     : true,
              oauth      : true
            });

            //since the above method is synchronous, this will be set to TRUE
            //once all is well.
            appModel.fbAPIInit = true;

        };

        (function(d, s, id){
             var js, fjs = d.getElementsByTagName(s)[0];
             if (d.getElementById(id)) {return;}
             js = d.createElement(s); js.id = id;
             js.src = "//connect.facebook.net/en_US/sdk.js";
             fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
            
    });

}(jQuery);