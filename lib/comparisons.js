/*jslint node: true */
/*jslint nomen: true */
"use strict";
var _ = require('lodash');
var moment = require('moment');
var requireDir = require('require-dir');
var all = requireDir('./data');

var cs = {}, csLists = {};
// Loop for having events & members as a collections for each community (easier)
_.forEach(all, function (v, k) {
	cs[k] = v[k];
	csLists[k] = {
		"events"	: _.map(_.keys(cs[k].events.list), function (current) {
							return cs[k].events.list[current];
						}),
		"members"	: _.map(_.keys(cs[k].members.list), function (current) {
							return cs[k].members.list[current];
						})
		};
});

var communities = _.keys(csLists);

/**
 * [[Description]]
 * @param   {[[Type]]} community [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function checkMembersWithoutRsvp (community) {
	return _.filter(csLists[community].members, function (m) { return !_.has(m, "rsvp");});
}

/**
 * [[Description]]
 * @param   {Object}   conf  has to contain community and type('event', 'member')
 * @returns {[[Type]]} [[Description]]
 */
function maxRsvps (conf) {
	switch(conf.type) {
		case 'event':
			return _.max(csLists[conf.community].events, function(event) { return event.rsvp.list.length; } );
		case 'member':
			return _.max(csLists[conf.community].members, function(member) { 

					return _.has(member,"rsvp") ? member.rsvp.list.length : 0; 
				});
	}
}

function sort ( list, filter) {
	return _.sortBy(list, function(m) { return moment(m.joined)[filter](); });
}

function groupByYear (list, year) {

	return _.filter(sort(list, "year"), function (obj) { return moment(obj.joined).year() === year; });
}

function membersSignedFromDate (community,date) {
	var originDate = moment(date);
	return _.filter(csLists[community].members, function(m) { return moment(m.joined).isAfter(originDate);});
}


function overlappedMembers (list,sorted) {

	var results = {};
	var lists = {};
	// Caching all lists
	_.forEach(list, function(c) {
		lists[c] = _.keys(cs[c].members.list);
	});
	for(var i = 0 , len = list.length ; i < len ; i++) {
		for(var x = 0 ; x < len; x++) {
			if (x !== i) {
				var key = list[i] + "_" + list[x];
				var common = _.intersection(lists[list[i]], lists[list[x]]);
				results[key] = { "list" : common, "count" : common.length };				
			}			
		}
	}
	if (sorted) {
		return  _.sortBy(_.map(results, function(v,k) {
			results[k].info = k;
			return results[k];
		}), function(c) { return c.count; });
	} else {
		return results;
	}

}

function overlappedEvents (list,sorted) {
	var results = {};
	var lists = {};
	// Caching all lists
	_.forEach(list, function(c) {
		lists[c] = _.map(csLists[c].events, function(event) {
				return {
					"time"		: moment(event.time).format("DDMMYYYY"),
					"eventId"	: event.id,
					"eventUrl"	: event.event_url 
				};
		});
	});
	for(var i = 0 , len = list.length ; i < len ; i++) {
		for(var x = 0 ; x < len; x++) {
			if (x !== i) {
				var key = list[i] + "_" + list[x];

				var common = _.intersection(_.pluck(lists[list[i]],"time"), _.pluck(lists[list[x]],"time"));
				var eventsUrlA = _.filter(lists[list[i]],function(e) {
					return _.contains(common, e.time);
				});
				var eventsUrlB = _.filter(lists[list[x]],function(e) {
					return _.contains(common, e.time);
				});
				results[key] = { 
					 "list" : {
					 	 "A" : eventsUrlA,
					 	 "B" : eventsUrlB
					 },
					 "count" : common.length };				
			}			
		}
	}
	if (sorted) {
		return  _.sortBy(_.map(results, function(v,k) {
			results[k].info = k;
			return results[k];
		}), function(c) { return c.count; });
	} else {
		return results;
	}
	
}

function MostWaitListed (community) {
    return _.max(csLists[community].events, function(event) { return event.waitlist_count; } );
}

function report (c) {
	
		console.log("Community: %s", c);
		console.log("-----------");
		
		var withoutRsvp = checkMembersWithoutRsvp(c);
		var only2014 = groupByYear(withoutRsvp,2014);

		//console.log("Members without RSVP's in the last year [%d]", only2014.length);
		/*
		console.log("\n");
		for(var x= 0, len = only2014.length; x < len; x++) {
			console.log("%s [%d] since [%s]", only2014[x].name, only2014[x].id , only2014[x].joined);
		};
		*/
		//console.log("\n");
		var signed2014 = _.sortBy(membersSignedFromDate(c, '2014-01-01'),function(m){ return m.joined; });
		//console.log("Members who signed last year [%d]", signed2014.length);
		/*
		console.log("\n");
		for(var x= 0, len = signed2014.length; x < len; x++) {
			console.log("%s [%d] since [%s]", signed2014[x].name, signed2014[x].id , signed2014[x].joined);
		};
		
		console.log("\n");
		console.log("Signed Members evolution grouped by years")
		console.log("\n");
		*/
		var evolution = _.groupBy(membersSignedFromDate(c, '2012-02-01'), function(m) {return moment(m.joined).year(); });
		/*
		var years = _.keys(evolution);
		for(var j= 0, len = years.length; j < len ; j++) {
			console.log("[%s] : %d", years[j], evolution[years[j]].length);
		}


		console.log("\n");
		console.log("Member who rsvped more (any time) :");
		console.log("\n");
		*/
		var mostRsvped = maxRsvps({"community" : c , "type": "member"});
    
        var mostRsvpedEvent = maxRsvps({"community" : c , "type": "event"});
    
        var mostwait = MostWaitListed(c);
		/*
		console.log("%s [%d] #[%s] - Ratio (yes/no) : %d / %d ", mostRsvped.name, 
				mostRsvped.id, mostRsvped.rsvp.list.length, mostRsvped.rsvp.total_yes,
				mostRsvped.rsvp.total_no);
		console.log("\n");
		console.log("Overlapping Members between communities");
		console.log("\n");
		*/
		var re = new RegExp("^" + c + "_.+$","g");
		
		var overlappingMembers = overlappedMembers(_.keys(csLists),true).reverse();
		
		var overlappingMembers_filtered = [];
		for(var s = 0, len = overlappingMembers.length; s < len; s++) {
			if (overlappingMembers[s].info.match(re)){
				if (overlappingMembers[s].count > 0) {
					//console.log ("%s -> %d", overlappingMembers[s].info, overlappingMembers[s].count );	
					overlappingMembers_filtered.push(overlappingMembers[s]);
				}
				
			}	
		}
		/*
		console.log("\n");
		
		console.log("Overlapped Events between communities");
		*/
		var overlappingEvents = overlappedEvents(_.keys(csLists),true).reverse();
		var overlappingEvents_filtered = [];
		for(var s = 0, len = overlappingEvents.length; s < len; s++) {
			if (overlappingEvents[s].info.match(re)){
				if (overlappingEvents[s].list.A.length > 0){
					/*
					console.log("\n");
					console.log ("%s -> %d", overlappingEvents[s].info, overlappingEvents[s].count);
					console.log ("%j", _.pluck(_.sortBy(overlappingEvents[s].list.A,"time"),"eventUrl"));
					console.log ("%j", _.pluck(_.sortBy(overlappingEvents[s].list.B,"time"),"eventUrl"));
					console.log("\n");
					*/
					overlappingEvents_filtered.push(overlappingEvents[s]);
				}
			}	
		}
		/*
		console.log("-----------");
		console.log("\n");
		*/

		return {
			"members" : {
				"withoutRvsp" : {
					"count" : only2014.length,
					"data" : only2014

				},
				"signedLastYear" : {
					"count" : signed2014.length,
					"data" : signed2014
				},
				"evolution" : evolution,
				"mostRvsped" : mostRsvped,
				"overlappingMembers" : overlappingMembers_filtered
			},
			"events" : {
                "mostRsvpedEvent" : mostRsvpedEvent,
                "mostWaitlisted" : mostwait,
				"overlappingEvents" : overlappingEvents_filtered
			}
		};

}



module.exports = report;
