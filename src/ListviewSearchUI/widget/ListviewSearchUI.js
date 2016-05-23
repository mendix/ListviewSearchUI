/*global logger*/
/*
    ListviewSearchUI
    ========================

    @file      : ListviewSearchUI.js
    @version   : 1.1.1
    @author    : Willem Gorisse
    @date      : 1/3/2016
    @copyright : Mendix 2016
    @license   : Apache 2

    Documentation
    ========================
    Provides an extension of the searchfield of a listview: show/hide functionality as well as moving the searchfield to a different location.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "dojo/text!ListviewSearchUI/widget/template/ListviewSearchUI.html"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoQuery, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoEvent, widgetTemplate) {
    "use strict";

    // Declare widget's prototype.
    return declare("ListviewSearchUI.widget.ListviewSearchUI", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        toggleButton: null,
        listviewSearchContainer: null,
        targetListview: null,
        targetListviewNode: null,
        targetSearchField: null,

        // Parameters configured in the Modeler.
        targetListviewName: "",
        widgetMode: "",
        missingMode: "",
        searchHidden: false,
        buttonGlyphicon: "",
        buttonLabel: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _events: null,
        _contextObj: null,
        _navigationListener: null,
        _startSearchHidden: false,
        _noSearchAvailable: false,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function() {
            // Uncomment the following line to enable debug messages
            //logger.level(logger.DEBUG);
            logger.debug(this.id + ".constructor");
            this._handles = [];
            this._events = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            this._startSearchHidden = this.searchHidden; // for reset purposes

            // allready set some options that only need to occur once via settings
            switch(this.widgetMode) {
                case "positionMode":
                    dojoConstruct.destroy(this.toggleButton);

                    // safety check for lacking ways of showing it.
                    this.searchHidden = false;
                    this._startSearchHidden = this.searchHidden;
                    break;
                case "fullMode":
                    // put logic for positionMode in here as well...
                    this._renderButton();
                    break;
                case "buttonMode":
                default:
                    this._renderButton();
                    dojoConstruct.destroy(this.listviewSearchContainer);
            }

            // set the listener for page navigation due to OPR page reloading could mean
            // the new widget is already present before the old one is removed
            var currentForm = null;
            if (mx.router && mx.router.getContentForm) {
                currentForm = mx.router.getContentForm();
            } else if (mx.ui.getCurrentForm) {
                currentForm = mx.ui.getCurrentForm();
            }

            if (currentForm) {
                this._navigationListener = dojo.connect(currentForm, "onNavigation", dojoLang.hitch(this,this._onPageNavigation));
            }
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        // note: due to difficulties with object creation order the _setup method is used for this widget as it ensures a present listview
        update: function(obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();

            callback();
        },

        // method called by onNavigation of the current page
        _onPageNavigation: function() {
            var name = ".mx-name-" + this.targetListviewName;
            this.targetListviewNode = document.querySelector(name);

            if (this.targetListviewNode) {
                this.targetListview = dijit.byNode(this.targetListviewNode);
				/* TODO: even verder */
				this.targetSearchField = this.targetListviewNode.querySelector(".mx-listview-searchbar");

                this.targetListview.addOnLoad(dojoLang.hitch(this,function(){
                    this._setup();
                }))
                 this.targetListview.addOnDestroy(dojoLang.hitch(this,function(){
                    this._resetWidget();
                }))
            } else {
                this._disableWidget();
            }
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function() {
            logger.debug(this.id + ".uninitialize");
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
            // get rid of the page navigation listener subscription
            dojo.disconnect(this._navigationListener);
        },

        // The new update function for usage
        _setup: function() {
            if (this.targetSearchField) {
                // for when setup is called again but the state is still wrong
                if (this._noSearchAvailable) {
                    this._enableWidget();
                }
                this._updateRendering();
            } else {
                this._disableWidget();
            }
        },

        // Rerender the interface.
        _updateRendering: function() {
            logger.debug(this.id + "._updateRendering");

            // add a class to the listview as well for possible custom css layout solutions
            if (!dojoClass.contains(this.targetListviewNode,"listview-search-ui-extended")) {
                dojoClass.add(this.targetListviewNode,"listview-search-ui-extended");
            }

            if (!dojoClass.contains(this.targetSearchField,"listview-search-ui-extended")) {
                dojoClass.add(this.targetSearchField,"listview-search-ui-extended");
            }

            switch(this.widgetMode) {
                case "positionMode":
                    this._moveSearchBar();
                    break;
                case "fullMode":
                    // put logic for positionMode in here as well...
                    this._moveSearchBar();
                case "buttonMode":
                default:
                    this._setupEvents();
                    if(this.searchHidden) {
                        this._hideSearchField();
                    } else {
                        this._showSearchField();
                    }
            }
        },

        // render the button with options
        _renderButton: function() {
            if (this.buttonGlyphicon && this.buttonGlyphicon !== "") {
                // set the new glyphicon class
                if (dojoClass.contains(this.toggleButtonIcon, "glyphicon-search")) {
                    dojoClass.remove(this.toggleButtonIcon, "glyphicon-search");
                }
                if (!dojoClass.contains(this.toggleButtonIcon, this.buttonGlyphicon)) {
                    dojoClass.add(this.toggleButtonIcon, this.buttonGlyphicon);
                }
            }
            if (this.buttonLabel && this.buttonLabel !== "") {
                // create the new button label
                var buttonLabelNode = document.createTextNode(this.buttonLabel);
                dojoConstruct.place(buttonLabelNode, this.toggleButton, "last");

                //remove icon-btn class
                if (dojoClass.contains(this.toggleButton,"icon-btn")) {
                    dojoClass.remove(this.toggleButton,"icon-btn");
                }
            }
        },

        // move the searchbar to the container
        _moveSearchBar: function() {
            if (this.targetSearchField && (!this.listviewSearchContainer.innerHTML || this.listviewSearchContainer.innerHTML === "")) {
                this.listviewSearchContainer.appendChild(this.targetSearchField);
            }
        },

        // Switch visibility of the widget
        _switchVisibility: function() {
            if (this.searchHidden) {
                this._showSearchField();
                this.searchHidden = false;
            } else {
                this._hideSearchField();
                this.searchHidden = true;
            }
            // in future we might need resize() method of a dijit element
        },

        _showSearchField: function() {
            if (!dojoClass.contains(this.toggleButton,"active")) {
                dojoClass.add(this.toggleButton, "active");
            }
            if (dojoClass.contains(this.targetSearchField,"hidden")) {
                dojoClass.remove(this.targetSearchField, "hidden");
            }
            // add a class to the listview as well for possible custom css layout solutions
            if (dojoClass.contains(this.targetListviewNode,"listview-search-ui-extended-hidden")) {
                dojoClass.remove(this.targetListviewNode,"listview-search-ui-extended-hidden");
            }
        },

        _hideSearchField: function() {
            if (dojoClass.contains(this.toggleButton,"active")) {
                dojoClass.remove(this.toggleButton, "active");
            }
            if (!dojoClass.contains(this.targetSearchField,"hidden")) {
                dojoClass.add(this.targetSearchField, "hidden");
            }
            // add a class to the listview as well for possible custom css layout solutions
            if (!dojoClass.contains(this.targetListviewNode,"listview-search-ui-extended-hidden")) {
                dojoClass.add(this.targetListviewNode,"listview-search-ui-extended-hidden");
            }
        },

        // Attach events to HTML dom elements
        _setupEvents: function() {
            logger.debug(this.id + "._setupEvents");

            var buttonEvent = this.connect(this.toggleButton, "click", function(e) {
                // Only on mobile stop event bubbling!
                this._stopBubblingEventOnMobile(e);

                this._switchVisibility();
            });
            this._events.push(buttonEvent);
        },

         // We want to stop events on a mobile device
        _stopBubblingEventOnMobile: function(e) {
            logger.debug(this.id + "._stopBubblingEventOnMobile");
            if (typeof document.ontouchstart !== "undefined") {
                dojoEvent.stop(e);
            }
        },

        // if no listview or listview search field could be found
        _disableWidget: function(){
            this._noSearchAvailable = true;
            switch (this.missingMode) {
                case "disabledMode":
                    if (!dojoClass.contains(this.toggleButton,"disabled")) {
                        dojoClass.add(this.toggleButton,"disabled");
                    }
                    if (dojoClass.contains(this.toggleButton,"active")) {
                        dojoClass.remove(this.toggleButton,"active");
                    }
                    // events are already handled in the setup of the widget
                    break;
                case "hideMode":
                default:
                    if (!dojoClass.contains(this.domNode,"hidden")) {
                        dojoClass.add(this.domNode,"hidden");
                    }

            }
        },

        // if the disabled state is on whilst a listviewsearch widget is available
        _enableWidget: function() {
            this._noSearchAvailable = false;

            switch (this.missingMode) {
                case "disabledMode":
                    if (dojoClass.contains(this.toggleButton,"disabled")) {
                        dojoClass.remove(this.toggleButton,"disabled");
                    }
                    // check if the button should have an active state
                    if (!this.searchHidden) {
                        if (!dojoClass.contains(this.toggleButton,"active")) {
                            dojoClass.add(this.toggleButton,"active");
                        }
                    }
                    // events are already handled in the setup of the widget
                    break;
                case "hideMode":
                default:
                    if (dojoClass.contains(this.domNode,"hidden")) {
                        dojoClass.remove(this.domNode,"hidden");
                    }
            }



        },

        _resetWidget:function() {
            logger.debug(this.id + " resetting widget");

            this._resetEvents();
            if (this.targetSearchField && this.listviewSearchContainer) {
                this.listviewSearchContainer.removeChild(this.targetSearchField);
            }

            switch(this.widgetMode) {
                case "positionMode":

                    break;
                case "fullMode":
                    // put logic for positionMode in here as well...

                case "buttonMode":
                default:
                    this.searchHidden = this._startSearchHidden;
                    if (this.toggleButton){
                        if (this.searchHidden){
                            if (dojoClass.contains(this.toggleButton,"active")) {
                                dojoClass.remove(this.toggleButton,"active");
                            }
                        }else if (!dojoClass.contains(this.toggleButton,"active")){
                            dojoClass.add(this.toggleButton,"active");
                        }
                    }
            }
        },
        // Reset Events.
        _resetEvents: function() {
            logger.debug(this.id + "._resetEvents");
            // Release handles on previous object, if any.
            if (this._events) {
                dojoArray.forEach(this._events, dojo.disconnect);
                this._events = [];
            }
        },

        // Reset subscriptions.
        _resetSubscriptions: function() {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            if (this._handles) {
                dojoArray.forEach(this._handles, function (handle) {
                    mx.data.unsubscribe(handle);
                });
                this._handles = [];
            }

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                var objectHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: dojoLang.hitch(this, function(guid) {
                        this._updateRendering();
                    })
                });

                this._handles = [ objectHandle ];
            }
        }
    });
});

require(["ListviewSearchUI/widget/ListviewSearchUI"], function() {
    "use strict";
});
