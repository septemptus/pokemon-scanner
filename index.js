var express = require('express');
var request = require('request');
var app = express();
var router = express.Router();

var ONE_KM_IN_DEG_LAT = 1 / 110.574;
var SPACING_KM = 0.5;
var RANGE_KM = 5;

function getOneKmInDegLong(lat) {
    return 1 / (111.320 * Math.cos(lat * Math.PI / 180));
}

function getScanPoints(currentPosition, range, spacing) {
    range = range || RANGE_KM;
    spacing = spacing || SPACING_KM;

    var long = Number(currentPosition.split(',')[1].trim()),
        lat = Number(currentPosition.split(',')[0].trim()),
        downBound = lat - range * ONE_KM_IN_DEG_LAT,
        upBound = lat + range * ONE_KM_IN_DEG_LAT,
        leftBound = long - range * getOneKmInDegLong(lat),
        rightBound = long + range * getOneKmInDegLong(lat),
        scanPoints = [],
        latPointer = downBound,
        longPointer = leftBound;

    while (longPointer < rightBound) {
        while (latPointer < upBound) {
            scanPoints.push(latPointer + '/' + longPointer);
            latPointer += spacing * ONE_KM_IN_DEG_LAT;

        }
        latPointer = downBound;
        longPointer += spacing * getOneKmInDegLong(latPointer);
    }

    return scanPoints;
}

function scan(position, range, spacing) {
    var scanPoints = getScanPoints(position, range, spacing);

    console.log('Requesting ' + scanPoints.length + ' points');
    scanPoints.forEach(function (scanPoint) {
        request.get('https://pokevision.com/map/scan/' + scanPoint);
    });

    return scanPoints.length;
}

router.route('/scan/:pos').get(function (req, res) {
    var scanned;

    try {
        scanned = scan(req.params.pos, Number(req.query.range), Number(req.query.spacing));
    } catch (e) {
        res.send('NOK' + e);
        return;
    }
    res.send('OK ' + scanned);
});

app.use('/', router);
app.listen(80);

module.exports = scan;
