var _ = require('lodash');
var Rx = require('rx');
var url = require('url');
var moment = require('moment');

var csLists = require('./utilsAnalytics')({ "dataDir" : 'data' });
var filters = require('./filters');


function membersWhoRsvpMost (options,cb) {
    function getEventById (com, id) {
        return _.pluck(_.filter(csLists[com].events, { "id" : id }),"event_url")[0];
    }
    
    var members = setupObs(_.omit(options,"filters"),"members");
    members = members.map( function(i) {
        var selected = options.filters && options.filters.length > 0 
            ? applyFilters(i.data,options.filters.concat({ "name" : "hasRsvp", "params" : undefined  }))        
            : applyFilters(i.data, [ { "name" : "hasRsvp", "params" : undefined }]);
        
        if(_.isArray(selected)) {
            var ordered = _.sortBy(selected, function (item) {
                return item.rsvps.count;
            }).reverse();
            if (options.rank && typeof options.rank === 'number') {
                ordered = _.first(ordered, options.rank);
            }
            return {
                "community" : i.community,
                "total" : i.data.length,
                "count" : selected.length,
                "members" :  { 
                    "count" : selected.length,
                    "list" : _.map(ordered, function (m) { 
                        return { 
                            "name" : m.name, 
                            "rvsps" : _.assign(_.omit(m.rsvps,"list"), 
                                { 
                                    "list" : _.map(m.rsvps.list, function(eventId) { 
                                        return getEventById(i.community,eventId);
                                    })
                                }
                            )
                        }; 
                    })
                    
                }              
            };
        } else {
            throw(new Error('Error with filters'));
        }
            
    })
    .reduce( function (acc,item) {
        if(!_.has(acc.data,item.community)) {
            acc.data[item.community] = options.full 
                ? _.omit(item,"community")
                : { 
                    "total" : item.total,
                    "count" : item.count
                }
        }
            
        return acc;        
    }, { 
            "data" : {}
        }); 

    var subscription = addSubscription(members,cb);
   
}

function membersTimeFromLastVisit ( options, cb) {
    var members = setupObs(_.omit(options,"filters"),"members");
    members = members.map( function(i) {
        var selected = options.daysFromNow && typeof options.daysFromNow === 'number'
            ? applyFilters(i.data, [{ "name" : "lastVisit", "params" : options.daysFromNow }])
            : applyFilters(i.data, [{ "name" : "lastVisit", "params" : 30 }]);
        
        if(_.isArray(selected)) {
            return {
                "community" : i.community,
                "total" : i.data.length,
                "count" : selected.length,
                "members" :  { 
                    "count" : selected.length,
                    "list" : _.map(selected, function (m) {
                        return m.id;
                        //return "http://www.meetup.com/" + i.community + '/members/' + m.id;
                    }),
                    "globalRatio" : selected.length  / i.data.length 
                }              
            };
        } else {
            throw(new Error('Error with filters'));
        }
            
    })
    .reduce( function (acc,item) {
        if(!_.has(acc.data,item.community)) {
            acc.data[item.community] = options.full 
                ? _.omit(item,"community")
                : { 
                    "total" : item.total,
                    "count" : item.count,
                    "globalRatio" : item.members.globalRatio
                }
                   
        }
            
        return acc;        
    }, { 
            "data" : {}
        }); 

    var subscription = addSubscription(members,cb);
    
}



function membersWithoutRsvp (options, cb) {
    var members = setupObs(_.omit(options,"filters"),"members");
    members = members.map( function(i) {
        var selected = options.filters && options.filters.length > 0 
            ? applyFilters(i.data,options.filters.concat({ "name" : "withoutRsvp", "params" : undefined }))        
            : applyFilters(i.data, [{ "name" : "withoutRsvp", "params" : undefined }]);
        
        if(_.isArray(selected)) {
            return {
                "community" : i.community,
                "total" : i.data.length,
                "count" : selected.length,
                "members" :  { 
                    "count" : selected.length,
                    "list" : _.map(selected, function (m) {
                        return m.id;
                        //return "http://www.meetup.com/" + i.community + '/members/' + m.id;
                    }),
                    "globalRatio" : selected.length  / i.data.length 
                }              
            };
        } else {
            throw(new Error('Error with filters'));
        }
            
    })
    .reduce( function (acc,item) {
        if(!_.has(acc.data,item.community)) {
            acc.data[item.community] =  options.full 
                ? _.omit(item,"community")
                : { 
                    "total" : item.total,
                    "count" : item.count,
                    "globalRatio" : item.members.globalRatio
                }
        }
            
        return acc;        
    }, { 
            "data" : {}
        }); 

    var subscription = addSubscription(members,cb);

}

function eventsYearDistribution (options,cb) {

    var events = setupObs(_.omit(options,"filters"),"events");
    events = events.map( function(i) {
        var selected = options.year && typeof options.year === 'number'
            ? applyFilters(i.data,[{ "name" : "byYear", "params" : options.year }]) 
            : applyFilters(i.data,[{ "name" : "byYear", "params" : 2014 }])
            
        if(_.isArray(selected)) {
            var ordered = _.sortBy(selected,function(item){
                    return item.time;
            });         
            return {
                "community" : i.community,
                "total" : i.data.length,
                "count" : selected.length,
                "summary" : _.mapValues(_.groupBy(selected, function(item) {
                    return moment(item.time).month();            
                }), function (arr) {
                    return _.pluck(arr, "event_url");
                })
            };
        } else {
            throw(new Error('Error with filters'));
        }
            
    })
    .reduce( function (acc,item) {
        if(!_.has(acc.data,item.community)) {
            acc.data[item.community] = _.omit(item,"community");
        }
        acc.ratios.push(item.count / 10);
        acc.globalRatio = _.reduce(acc.ratios, function (acc, i) {
            acc += i; 
            return acc;
        },0) / _.keys(acc.data).length;
            
        return acc;        
    }, { 
            "globalRatio" : 0,
            "ratios" : [],
            "data" : {}
        }); 

    var subscription = addSubscription(events,cb);


}


function eventsRatio (options, cb) {
    function getArrDiffDays (list) {
        var result = [];
        for(i=0,len = list.length; i < len; i++) {
            if ( i != len - 1) {
                result.push( Math.abs(moment(list[i+1].time).diff(moment(list[i].time),"days")));
            }
        }
        return result;
    }
    var events = setupObs(_.omit(options,"filters"),"events");
    events = events.map( function(i) {
        var selected = options.filters && options.filters.length > 0 
            ? applyFilters(i.data,options.filters)        
            : i.data;
        
        if(_.isArray(selected)) {
            var ordered = _.sortBy(selected,function(item){
                    return item.time;
            });         
            return {
                "community" : i.community,
                "total" : i.data.length,
                "count" : selected.length,
                "summary" : _.sortBy(_.map(_.countBy(getArrDiffDays(ordered)), function(v,k) {
                    return { 
                        "daysDiff" : k,
                             "freq" : v
                    }
                }),"freq").reverse()
            };
        } else {
            throw(new Error('Error with filters'));
        }
            
    })
    .reduce( function (acc,item) {
        if(!_.has(acc.data,item.community)) {
            acc.data[item.community] = _.omit(item,"community");
        }
        
            
        return acc;        
    }, { 
            "globalRatio" : 0,
            "data" : {}
        }); 

    var subscription = addSubscription(events,cb);
    
}



function summaryEventsRated ( options, cb ) {
    var events = setupObs(_.omit(options,"filters"),"events");
    events = events.map( function(i) {
        var selected = options.filters && options.filters.length > 0 
            ? applyFilters(i.data,options.filters)        
            : i.data;
        
        if(_.isArray(selected)) {
            return {
                "community" : i.community,
                "total" : i.data.length,
                "count" : selected.length,
                "ratings" :  _.mapValues(_.groupBy(_.map(selected,function(e){
                                  return {  
                                    "rating" : Math.floor(e.rating.average),
                                    "event_url" : e.event_url,
                                    "eventName" : e.name
                                  };
                              }),"rating"),function (arr) {
                                  return { "events" : arr.length,
                                           "list" : _.map(arr,function (el) { 
                                               return _.omit(el,"rating"); 
                                           }),
                                           "globalRatio" : arr.length / selected.length 
                                  };
                              })               
            };
        } else {
            throw(new Error('Error with filters'));
        }
            
    })
    .reduce( function (acc,item) {
        if(!_.has(acc.data,item.community)) {
            acc.data[item.community] = options.full 
                ? _.omit(item,"community")
                : {
                    "total" : item.total,
                    "count" : item.count,
                    "ratings" : _.mapValues(item.ratings , function (obj) {
                          return _.omit(obj,"list");
                    })
                }
        }
        var currentRatio = getRatio(acc.data[item.community].ratings);
        if ( currentRatio > acc.betterAvg.ratio ) {
            acc.betterAvg = {
                "ratio" : currentRatio,
                "community" : [ item.community ]
            };
        } else {
            if( currentRatio !== 0 && currentRatio === acc.betterAvg.ratio ) {
               acc.betterAvg.community.push(item.community);
            }
        }
            
        return acc;        
    }, { 
            "betterAvg" : {
                "community" : "",
                "ratio" : 0
            },
            "data" : {}
        }); 

    var subscription = addSubscription(events,cb);
  
}



function hotTime (options,cb) { 
    
    function initAccList ( first,last, category) {
        return _.reduce(_.range(first,++last), function(acc,n) {
            acc[n] = {};
            acc[n].times = 0;
            acc[n][category] = n;
            return acc;
        },{});
    }
    
    function weekDay (str) {
        return moment(str).isoWeekday();
    }

    function hour (str) {
        return moment(str).hours();
    }
    
    function getInitObjforHotTime (selector) {
        var initObj = {
                "weekday"  : {       
                    "max" : {
                        "hotweekday" : 1,
                        "list" : initAccList(1,7,"weekday")
                    },
                    "data" : {}
                },
                "hour" : {
                    "max" : {
                        "hothour" : 1,
                        "list" : initAccList(0,23,"hour")
                    },
                    "data" : {}
                }
        };
        return initObj[selector];
    }
        
    var events = setupObs(_.omit(options,"filters"),"events");
    events = events.map( function(i) {
        var selected = options.filters && options.filters.length >0 
            ? applyFilters(i.data,options.filters)        
            : i.data;
        
        
        if(_.isArray(selected)) {
            var timeSelector = options.timeSelector === 'weekday'
                ? weekDay
                : hour;
            return {
                "community" : i.community,
                "total" : i.data.length,
                "count" : selected.length,
                "eventTimes" :  _.mapValues(_.groupBy(_.map(selected,function(e){
                                  return { 
                                      "time" : timeSelector(e.time),
                                      "event_url" : e.event_url,
                                      "eventName" : e.name
                                  };
                              }),"time"),function (arr) {
                                  return { "times" : arr.length,
                                           "list" : _.map(arr,function (el) { 
                                               return _.omit(el,"time"); 
                                           }),
                                           "globalRatio" : arr.length / selected.length 
                                  };
                              })               
            };
        } else {
            throw(new Error('Error with filters'));
        }
            
    })
    .reduce( function (acc,item) {
        if(!_.has(acc.data,item.community)) {
            acc.data[item.community] = _.omit(item,"community");
        }
        _.map(item.eventTimes,function(v,k) {
            acc.max.list[k].times += v.times;
        });
           
        var maxKey = "hot" + options.timeSelector; 
        acc.max[maxKey] = _.max(acc.max.list, function (wd) { return wd.times; })[options.timeSelector];
        return acc;        
    }, getInitObjforHotTime(options.timeSelector)); 

    var subscription = addSubscription(events,cb);

}


function hotVenue (options,cb) {

     function mappingVenues (i) {
            var l = _.groupBy(_.filter(i.data,function(e){
                                  return e.venue !== undefined;
                              }),function(obj){ return obj.venue.id; })
            var list =  _.map(l, function (v,k) { 
                                return { "venue" : v[0].venue,
                                         "eventList" : _.pluck(v,"event_url"),
                                         "times" : v.length}; 
                            });
            return  {
                "community" : i.community,
                "list" : list,
                "max" : _.max(list,function (o) { 
                                return o.times; 
                            })
            };
    }   


    var events =  setupObs(options,"events");
    events = events.map(mappingVenues)
    .reduce(function(acc,item) {
        
        if(!_.has(acc.data,item.community)) {   
            acc.data[item.community] = _.omit(item,"community");
        }
        if (item.max.times > acc.max.times) {
            acc.max = {
                "venue" : item.max.venue,
                "times" : item.max.times
            };
        }
        return acc;
    },{ "max" : { 
            "venue" : "" ,
            "times" : 0
        },
        "data" : {}
    });
   
    var subscription = addSubscription(events,cb);
}


function setupObs (opts,type) {
    var check = opts.communities && opts.communities.length >= 1;
    //var list = _.pluck(csLists,type);
    var list = _.map(csLists, function (v, k) {
        var obj = {};
        obj[k] = v[type];
        return obj;
    });
    return check 
        ?  Rx.Observable.from(list)
            .filter(function(objElem) {
                return _.contains(opts.communities, _.keys(objElem)[0]);
            })
            .map(function (i) {
                return { 
                    "community" : _.keys(i)[0],
                    "data" : _.values(i)[0]
                };           
            })
        : Rx.Observable.from(list)
            .map(function (i) {
                return { 
                    "community" : _.keys(i)[0],
                    "data" : _.values(i)[0]
                };
            }) ; // All Communities
}

function addSubscription ( obs, callback) {
    return obs.subscribe(
        function (r) {
            callback(null,r);
        },
        function (e) {
            callback(e,null);
        }
    );
}

function applyFilters (collection , arr) {
    var cArr = _.clone(arr);
    if (cArr.length === 0) {
        return collection;
    } else {
        var current = getFilter(cArr.shift());
        return current 
            ? applyFilters(_.filter(collection, current),cArr)
            : false;
    }  
}

function getFilter (item) {
    return typeof(item) === 'function'
        ? item
        : _.isPlainObject(item) && _.has(item,"name") && _.has(item,"params")
            ? _.has(filters,item.name)
                ? item.params !== undefined
                    ? filters[item.name](item.params)
                    : filters[item.name]
                : false
            : false;
}

function getRatio ( obj ) {
    var max =  _.max(_.map(obj, function(v,k) { 
            return {
                "rateGroup" : k,
                "events" : v.events,
                "globalRatio" : v.globalRatio
            };
        }), function (o) {
            return o.globalRatio;
        });
    return max.rateGroup * max.globalRatio * max.events;
}


function getCommunities () {
    return _.keys(csLists);   
}


function Analytics () {
    return {
        "getCommunities" : getCommunities,
        "summaryEventsRated" : summaryEventsRated,
        "eventsRatio" : eventsRatio,
        "eventsYearDistribution" : eventsYearDistribution,
        "hotVenue" : hotVenue,
        "hotTime" : hotTime,
        "membersWithoutRsvp" : membersWithoutRsvp,
        "membersWhoRsvpMost" : membersWhoRsvpMost,
        "membersTimeFromLastVisit" : membersTimeFromLastVisit
    };
}

module.exports = Analytics();
