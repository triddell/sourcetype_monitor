require.config({
    paths: {
        text: "../app/sourcetype_monitor/components/lib/text",
        "sourcetypeTemplate" : "../app/sourcetype_monitor/components/templates/sourcetypeTemplate.html",
        "validate" : "../app/sourcetype_monitor/components/lib/jquery-validation/jquery.validate.min"
    }
});

define([
	"underscore",
	"backbone",
    "jquery",
    "splunkjs/mvc",
    "text!sourcetypeTemplate",
    "validate",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/dropdownview",
    "splunkjs/mvc/timerangeview"
    ], function(_, Backbone, $, mvc, sourcetypeTemplate, validate, SearchManager, DropdownView, TimeRangeView) {

        var ModalView = Backbone.View.extend({
    
            initialize: function(options) {
                this.options = options;
                this.mode = options.mode;
                this.model = options.model;
                this.tokens = options.tokens;
                this.options = _.extend({}, this.defaults, this.options);
				this.eventBus = this.options.eventBus;
				this.childViews = [];
				this.sourcetypeDropdown = "";

                _.bindAll(this, "changed");
            },
            
            events: {
                "click .close": "close",
                "click .modal-backdrop": "close",
                "click #submitData": "validateData",
                "change input" : "changed",
                "change select" : "changed",
                "change textarea" : "changed"
            },

            changed:function (evt) {
                var changed = evt.currentTarget;
                var value = $(evt.currentTarget).val();
                var obj = {};
                obj[changed.id] = value;

                this.model.set(obj);
            },
    
            render: function() {

                $(this.$el).html(_.template(sourcetypeTemplate, this.model.toJSON()));

                return this;

            },

            unsetSplunkComponents: function() {

                this.tokens.unset("index_add_tok");
                this.tokens.unset("comments_add_tok");
                this.tokens.unset("late_secs_add_tok");
                this.tokens.unset("contact_add_tok");
                this.tokens.unset("sourcetype_add_tok");

                this.tokens.unset("index_update_tok");
                this.tokens.unset("comments_update_tok");
                this.tokens.unset("late_secs_update_tok");
                this.tokens.unset("contact_update_tok");
                this.tokens.unset("sourcetype_update_tok");

                _.each(this.childViews, function(childView) {
                    childView.unbind();
                    childView.remove();
                });

            },
    
            show: function() {

                $(document.body).append(this.render().el);

                $(this.el).find(".modal").css({
                    width:"40%",
                    height:"auto",
                    left: "30%",
                    "margin-left": "0"
                });

                $(this.el).find(".modal-body").css({
                    "max-height": "750px"
                });

            },

            validateData: function() {

                var that = this;

                $.validator.addMethod("are_valid_emails",
                    function (value, element) {
                        if (this.optional(element)) {
                            return true;
                        }

                        var emails = value.split(",");
                        var valid = true;
                        var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                        for (var i = 0; i < emails.length; i++) {
                             if( emails[i] == "" || ! regex.test(emails[i])){
                                 valid = false;
                             }
                        }

                    return valid;
                 }, "Invalid email address(es). Please use a comma to separate multiple email addresses.");

                $.validator.addMethod("is_relative_time",
                    function(value, element) {

                        return value.match(/(((?:([-]+)(\d{1,})((seconds$|seconds@|second$|second@|secs$|secs@|sec$|sec@|minutes$|minutes@|minute$|minute@|min$|min@|hours$|hours@|hour$|hour@|hrs$|hrs@|hr$|hr@|days$|days@|day$|day@|weeks$|weeks@|week$|w[0-6]|months$|months@|month$|month@|mon$|mon@|quarters$|quarts@|quarter$|quarter@|qtrs$|qtrs@|qtr$|qtr@|years$|years@|year$|year@|yrs$|yrs@|yr$|yr@|s$|s@|h$|h@|m$|m@|d$|d@|w$|w@|y$|y@|w$|w@|q$|q@){1}))([\@]?)(((seconds|second|secs|sec|minutes|minute|min|hours|hour|hrs|hr|days|day|weeks|week|w[0-6]|months|month|mon|quarters|quarter|qtrs|qtr|years|year|yrs|yr|s$|h$|m$|d$|w$|y$|w$|q$){1})?$)|^0$)|^\d+$)/);

                    }, "Value must be in seconds or Splunk's relative time format.");

                $("#sourcetypeForm", this.el).validate({

                    rules: {
                        sourcetype: 'required',
                        index: 'required',
                        lateSecs: {
                            required: true,
                            number: true,
                            //is_relative_time: true
                        },
                        contact: {
                            are_valid_emails: true,
                            required: true
                        },
                        comments: {
                            required: true,
                        }
                    },

                    messages: {
                        sourcetype: {
                            required: "The Sourcetype field is required."
                        },
                        index: {
                            required: "The Index field is required."
                        },
                        lateSecs: {
                            required: "The Late Seconds field is required.",
                            number: "Late Seconds must be a valid number."
                        },
                        contact: {
                            required: "The Contacts field is required."
                        },
                        comments: {
                            required: "The Comments field is required."
                        }
                    },

                    submitHandler: function(form) {

                        that.submitData();

                    }

                });

            },

            submitData: function() {

				if(this.mode === "New") {

					this.tokens.set("index_add_tok", this.model.get("index"));
					this.tokens.set("comments_add_tok", this.model.get("comments"));
					this.tokens.set("late_secs_add_tok", this.model.get("lateSecs"));
					this.tokens.set("contact_add_tok", this.model.get("contact"));
					this.tokens.set("sourcetype_add_tok", this.model.get("sourcetype"));

					this.eventBus.trigger("add:row");

				} else if(this.mode === "Edit") {

					this.tokens.set("key_update_tok", this.model.get("_key"));
					this.tokens.set("index_update_tok", this.model.get("index"));
					this.tokens.set("comments_update_tok", this.model.get("comments"));
					this.tokens.set("late_secs_update_tok", this.model.get("lateSecs"));
                    this.tokens.set("contact_update_tok", this.model.get("contact"));
					this.tokens.set("sourcetype_update_tok", this.model.get("sourcetype"));
					this.eventBus.trigger("update:row");

				}

                this.close();
            },
    
            close: function() {
                this.unsetSplunkComponents();
                this.unbind();
                this.remove();
            }

        });
        
        return ModalView;

});