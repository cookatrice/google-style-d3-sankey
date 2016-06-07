/**
 * Created by cookatrice on 2015. 9. 1..
 */


var App = angular.module('myApp', ['app.constants', 'app.controllers']);

/**
 * Application constants
 */
angular.module('app.constants', [])
    .constant('APP_VERSION', '0.11');

/**
 * App config run & block
 */
App.config(function($logProvider) {
    // log for debug
    $logProvider.debugEnabled(false);
}).run(function () {

});

