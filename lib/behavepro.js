#!/usr/bin/env node
'use strict'
var request = require('request');
var unzip = require('unzip2');
var fs = require('fs');
var mkdir = require('mkdirp');
var _ = require('underscore');

module.exports.fetchFeaturesFromConfig = function(settings, callback) {
    fs.exists(process.cwd() + '/' + settings.config, function(exists) {
        if (exists) {
            var configuration = require(process.cwd() + '/' + settings.config);
            configuration.forEach(function(config) {
                _.extend(settings, config);
                fetchFeatures(settings, callback);
            });
        } else {
            var err  = new Error('Could not find config at ' + process.cwd() + '/' + settings.config);
            throw err;
        }
    });
}

var fetchFeatures = function(settings, callback) {
    var url = settings.host + '/rest/cucumber/1.0/project/' + settings.id+ '/features?manual=' + settings.manual;
    var path = settings.output + '/' + settings.id;

    ensureSettingsExist(settings.id, settings.userId, settings.apiKey, function() {
        console.log('Downloading features from JIRA project ' + settings.id + '...');
        request({
            url: url,
            headers: {
                Authorization: 'Basic ' + new Buffer(settings.userId + ':' + settings.apiKey).toString('base64')
            },
            encoding: null
        }, function(error, response, body) {
            if (error) throw error;
            var err = null;
            switch(response.statusCode) {
                case 500:
                    err = new Error('Server error - Are you using the correct host?');
                    throw err;
                    return;
                case 401:
                    err = new Error('Unauthorized - ensure keys are valid');
                    throw err;
                    return;
                case 200:
                    break;
                default:
                    err = new Error(response.statusCode + ' http error when downloading');
                    throw err;
                    return;
            }

            mkdir(path, function(err) {
                if (err) throw err;
                writeFeatures(body, path, function() {
                    countFeatures(path, function(files) {
                        console.log('Saved ' + files.length + ' ' + (files.length > 1 ? 'features' : 'feature') + ' to ' + process.cwd() + '/' + path + '/');
                    });
                    if (callback) callback();
                });
            });
        });
    });
}

module.exports.fetchFeatures = fetchFeatures;

function writeFeatures(body, path, callback) {
    fs.writeFile(path + '.zip', body, function(err) {
        if (err) throw err;
        var stream = fs.createReadStream(path + '.zip').pipe(
            unzip.Extract({
                path: path
            })
        );

        stream.on('close', function() {
            removeZip(path + '.zip');
            callback();
        });
    });
}

function ensureSettingsExist(id, userId, apiKey, callback) {
    var err = null;
    if (!id) {
        err = new Error('Project id missing');
        throw err;
    }
    if (!userId) {
        err = new Error('User id missing');
        throw err;
    }
    if (!apiKey) {
        err = new Error('API key missing');
        throw err;
    }
    if (callback) callback();
}

function countFeatures(path, callback) {
    fs.readdir(path, function(err, files) {
        callback(files);
    });
}

function removeZip(file, callback) {
    fs.unlink(file, function(err) {
        if (err) throw err;
        if (callback) callback();
    });
}