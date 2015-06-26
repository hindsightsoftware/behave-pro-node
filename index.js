#!/usr/bin/env node
'use strict'
var BehavePro = require('./lib/behavepro');
var _ = require('underscore');

var defaultSettings = {
    host: 'https://behave.pro',
    output: 'features',
    manual: false,
    config: 'config.json'
};

module.exports = function(settings, callback) {
    _.defaults(settings, defaultSettings);
    BehavePro.fetchFeatures(settings, function() {
        console.log(settings);
        if (callback) callback();
    });
}