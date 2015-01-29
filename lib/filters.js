var moment = require('moment');
var _ = require('lodash');
var filters = {
    "rating" : function (item) {
        return item.rating.average > 4;
    },
    "pickyRating" : function(pickiness) {
        return function(item) { 
            return item.rating.count > pickiness;
        };
    },
    "byYear" : function(year) {
        return function(item) {
            var field = _.has(item,"time")
                ? item.time // for events
                : item.joined; //for members
            return moment(field).year() === year;
        };
    },
    "withoutRsvp" : function (item) {
        return !_.has(item,"rsvps");
    },
    "hasRsvp" : function (item) {
        return _.has(item,"rsvps");
    },
    "lastVisit" : function(days) {
        return function(item) {
            return moment().diff(moment(item.visited),"days") <= days;
        };
    }
    
};

module.exports = (function () {
  return filters;   
})();