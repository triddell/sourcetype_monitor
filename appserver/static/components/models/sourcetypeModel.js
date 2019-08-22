define([
    'underscore',
    'backbone',
], function (_, Backbone) {
    "use strict";

    var SourcetypeModel = Backbone.Model.extend({

        defaults: {
            _key: "",
            comments: "",
            contact: "",
            index: "",
            lateSecs: "",
            sourcetype: "",
        }

    });

    return new SourcetypeModel();

});