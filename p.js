var system = require('system');
var args = system.args;
var fs = require('fs');
var urls = JSON.parse(fs.read(args[1]));

var counter = 0;

urls.forEach(function (url) {
    var page = require('webpage').create();

    page.open(url, function (response) {
        var json;

        if (response !== 'success') {
            phantom.exit(1);
        }

        try {
            json = page.evaluate(function () {
                return JSON.parse(document.querySelector('pre').innerHTML);

            });
        } catch (e) {
            phantom.exit(1);
        }

        if (!json.jobId) {
            phantom.exit(1);
        }
        counter++;
        page.close();

        if (counter === urls.length) {
            phantom.exit(0);
        }
    });    
});

