var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Analytics = require('../lib/analytics');


function generateError(endpoint,data) {
    return {
        "error": true,
        "endpoint" : endpoint,
        "description" : data
    };
}


function selector(operation) {
    return function (req,res,next) {
        var opParams = req.body;
        Analytics[operation](opParams,function(err,result) {
            if (err) {
                res.status(500).json(generateError(operation,err));
            } else {
                res.result = result;
                next();
            }
        });  
    }

}



router.post('/hotVenue', selector("hotVenue"), function(req, res) {
  return res.status(200).json(res.result);
});

router.post('/eventsRated',selector("summaryEventsRated"), function(req, res) {
  return res.status(200).json(res.result);
});

router.post('/eventsRatio',selector("eventsRatio"), function(req, res) {
  return res.status(200).json(res.result);
});

router.post('/eventsYearDistribution',selector("eventsYearDistribution"), function(req, res) {
  return res.status(200).json(res.result);
});

router.post('/hotTime', selector("hotTime"), function(req, res) {
  return res.status(200).json(res.result);
});

router.post('/membersWithoutRsvp', selector("membersWithoutRsvp"), function(req, res) {
  return res.status(200).json(res.result);
});

router.post('/membersWhoRsvpMost', selector("membersWhoRsvpMost"), function(req, res) {
  return res.status(200).json(res.result);
});

router.post('/membersTimeFromLastVisit', selector("membersTimeFromLastVisit"), function(req, res) {
  return res.status(200).json(res.result);
});


module.exports = router;
