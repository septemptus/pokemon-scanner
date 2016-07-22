var express = require('express');
var phantomjs = require('phantomjs');
var path = require('path');
var fs = require('fs');
var request = require('request');
var childProcess = require('child_process');
var q = require('q');
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

function send(urls) {
    var deferred = q.defer();

    fs.writeFile(path.join(__dirname, 'urls.json'), JSON.stringify(urls), function (err) {
        if (err) {
            return deferred.reject(err);
        }

        childProcess.execFile(phantomjs.path, [
            path.join(__dirname, 'p.js'),
            path.join(__dirname, 'urls.json')
        ], function (err, stdout, stderr) {
            if (!err) {
                console.log('processed');
                return deferred.resolve();
            }
            console.log(err, stderr);
            deferred.reject();
        });        
    });

    return deferred.promise;
}

function scan(position, range, spacing) {
    var scanPoints = getScanPoints(position, range, spacing);

    console.log('Requesting ' + scanPoints.length + ' points');
    return send(scanPoints.map(function (scanPoint) {
        return 'https://pokevision.com/map/scan/' + scanPoint;
    }));
}

router.route('/:pos').get(function (req, res) {
    try {
        scan(req.params.pos, Number(req.query.range), Number(req.query.spacing))
            .then(function () {
                res.send('OK');
            })
            .fail(function () {
                res.send('NOK');
            });
    } catch (e) {
        res.send('NOK' + e);
    }
});

app.use('/', express.static('pub'));
app.use('/scan', router);
app.listen(process.env.PORT || 80);