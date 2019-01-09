;(function() {

	"use strict";

	const _ = window._;
	const jQuery = window.jQuery;
	const String = window.String;

	const ContentBlockView = _.get(window,"DW.Classes.ContentBlocks.Base.Views.ContentBlockView");

	
	const HourNotchLabels={
		"2": {
			"0": ["12","1","2","3","4","5","6","7","8","9","10","11"],
			"1": ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23"]
		},
		"3": {
			"0": ["12","01","02","03","04","05","06","07","08","09","10","11"],
			"1": ["00","01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23"]
		},
		"4": {
			"0": ["XII","I","II","III","IV","V","VI","VII","VIII","IX","X","XI"],
			"1": ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI","XXII","XXIII"]
		}
	};

	const DEGREES_PER_MINUTE_SECOND_NOTCH = 6; // 360 / 60
	const DEGREES_PER_24HOUR_NOTCH = 15; // 360 / 24
	const DEGREES_PER_12HOUR_NOTCH = 30; // 360 / 12
	const HTML = [
		"<div class='designware-content-block-clock'>",
			"<div id='designware-face'>",
				"<div id ='designware-minute-notches'></div>",
				"<div id='designware-hour-notches'></div>", 
				"<div id='designware-hands'>",
					"<span id='designware-minute-hand' class='designware-hand'></span>",
					"<span id='designware-hour-hand' class='designware-hand'></span>",
					"<span id='designware-second-hand' class='designware-hand'></span>",
					"<span id='designware-hand-hub'></span>",
				"</div>",				               
			"</div>",
			// TEMPORARY GUIDELINES - FOR DEVELOPMENT ONLY
			"<div id='x-guideline' style='display: inline-block; position: absolute; left: calc(50% - 0.5px); top: 0; bottom: 0; width: 1px; background-color: black'></div>",
			"<div id='y-guideline' style='display: inline-block; position: absolute; left: 0; top: calc(50% - 0.5px); right: 0; height: 1px; background-color: black'></div>",
		"</div>"
	].join("");
	const NUM_MINUTE_NOTCHES = 60;
	const NUM_24HOUR_NOTCHES = 24;
	const NUM_12HOUR_NOTCHES = 12;
	const ONE_SECOND = 1000;


	class ClockContentBlockView extends ContentBlockView {

		_addPermanentListeners() {
			super._addPermanentListeners();
			const ModelEvents = this.__data.model.Events;
			this._addRemovePermanentListenerFunction(this.__data.model.addListener(ModelEvents.SET_ANIMATION_TYPE, this._onModelSetAnimationType.bind(this)));
			this._addRemovePermanentListenerFunction(this.__data.model.addListener(ModelEvents.SET_CLOCK_TYPE, this._onModelSetClockType.bind(this)));
			this._addRemovePermanentListenerFunction(this.__data.model.addListener(ModelEvents.SET_HOUR_NOTCHES_TYPE, this._onModelSetHourNotchType.bind(this)));
			this._addRemovePermanentListenerFunction(this.__data.model.addListener(ModelEvents.SET_TIMEZONE, this._onModelSetTimezone.bind(this)));
		}
		
		_addTemporaryListeners() {
			super._addTemporaryListeners();
		}

		_initData( params ) {
			super._initData( params );
			this.__data.onEnterFrame = this._onEnterFrame.bind(this);
		}

		_initDomReferences() {
			let self = this;
			super._initDomReferences();
			this.__dom.clockWrapper = jQuery(HTML).appendTo(this.__dom.content);
			this.__dom.rawClockWrapper = jQuery(this.__dom.clockWrapper).get(0);
			this.__dom.face = jQuery(this.__dom.wrapper).find("#designware-face");
			// hands
			this.__dom.handHub = jQuery(this.__dom.wrapper).find("#designware-hand-hub");
			this.__dom.hourHand = jQuery(this.__dom.wrapper).find("#designware-hour-hand");
			this.__dom.minuteHand = jQuery(this.__dom.wrapper).find("#designware-minute-hand");
			this.__dom.secondHand = jQuery(this.__dom.wrapper).find("#designware-second-hand");
			// hour notches
			this.__dom.hourNotches = jQuery(this.__dom.wrapper).find("#designware-hour-notches");
			// minute notches
			this.__dom.minuteNotches = jQuery(this.__dom.face).find("#designware-minute-notches");

			this._initHourNotchesDom();
			this._initMinuteNotchesDom();
		}

		_initDomState() {
			super._initDomState();
			this._setCurrentClockTypeSettings();
			this._setCurrentHourNotchTypeAttribute();
			this._setCurrentHourNotchLabels();
			this._redrawHands();
			this._redrawHourNotches();
			this._resizeClockFace();
			this._resizeHourNotches();
		}

		_initHourNotchesDom() {
			this.__dom.hourNotchList = [];
			for( let i=0; i < NUM_24HOUR_NOTCHES; i++ ) {
				let html = [
					"<span class='designware-hour-notch-wrapper'>",
						"<span id='designware-hour-notch'>",
							// "<span id='designware-hour-notch-inner'>",
								"<span id='designware-hour-label'></span>",
							// "</span>",
						"</span>",
					"</span>"
				].join("");
				let hourNotch = jQuery(html).appendTo(this.__dom.hourNotches);
				this.__dom.hourNotchList.push(hourNotch);
			}
		}

		_initMinuteNotchesDom() {
			for( let i=0; i < NUM_MINUTE_NOTCHES; i++ ) {
				let minuteNotch = jQuery("<span class='designware-minute-notch-wrapper'><span class='designware-minute-notch'></span></span>").appendTo(this.__dom.minuteNotches);
				let transform = String.format("rotate({0}deg)", i * DEGREES_PER_MINUTE_SECOND_NOTCH);
				jQuery(minuteNotch).css({
					"transform": transform
				});
			}
		}

		_onEnable() {
			super._onEnable();
			this._startAnimation();
		}

		_onEnterFrame() {
			if( !this.__data.enabled ) return;
			this._redrawHands();
			window.requestAnimationFrame(this.__data.onEnterFrame);
		}

		_onResize( event ) {
			super._onResize( event );
			this._resizeClockFace();
			this._resizeHourNotches();
		}

		_onModelSetAnimationType( event ) {
			this._redrawHands();
		}

		_onModelSetClockType( event ) {
			this._setCurrentClockTypeSettings();
			this._redrawHands();
		}

		_onModelSetHourNotchType( event ) {
			this._setCurrentHourNotchTypeAttribute();
			this._setCurrentHourNotchLabels();
			this._redrawHourNotches();
			this._resizeHourNotches();
		}

		_onModelSetTimezone( event ) {
			this._redrawHands();
		}
		
		_redrawHourHand( date ) { 
			let degrees = -90 + date.getHours() * this.__data.degreesPerHourNotch + ( date.getMinutes() / 60 ) *  this.__data.degreesPerHourNotch;
			let transform = String.format("rotate({0}deg)", degrees);
			if( this.__data.previousHourHandTransform === transform ) return;
			jQuery(this.__dom.hourHand).css({
				"transform": transform
			});
			this.__data.previousHourHandTransform = transform;
		}

		_redrawHourNotches() {
			let i;
			let hourNotch;
			let hourLabel;
			for( i=0; i < this.__dom.hourNotchList.length; i++ ) {
				hourNotch = this.__dom.hourNotchList[i];
				hourLabel = _.get(this.__data.hourNotchLabels,i,"");
				if( i < this.__data.numHourNotches ) {
					let degrees = 90 + i * this.__data.degreesPerHourNotch;
					jQuery(hourNotch)
						.appendTo(this.__dom.hourNotches)
						.css("transform",String.format("rotate({0}deg)",degrees));
					jQuery(hourNotch)
						.find("#designware-hour-label")
							.html(hourLabel);

					degrees = ( this.__data.model.isHourNotchTypeLines ) ? 0 : -degrees;

					jQuery(hourNotch)
						.find("#designware-hour-notch")
							.css("transform",String.format("rotate({0}deg)",degrees));
				} else {
					jQuery(hourNotch).detach();
				}
			}
		}
		
		_redrawMinuteHand( date ) {
			let degrees = -90 + date.getMinutes() * DEGREES_PER_MINUTE_SECOND_NOTCH + ( date.getSeconds() / 60 ) * DEGREES_PER_MINUTE_SECOND_NOTCH;
			let transform = String.format("rotate({0}deg)", degrees);
			if( this.__data.previousMinuteHandTransform === transform ) return;
			jQuery(this.__dom.minuteHand).css({
				"transform": transform
			});
			this.__data.previousMinuteHandTransform = transform;
		}
		
		_redrawSecondHand( date ) {
			let degrees = -90 + date.getSeconds() * DEGREES_PER_MINUTE_SECOND_NOTCH;
			if( !this.__data.model.isAnimationTypeTick ) degrees += (( date.getMilliseconds() / 1000 ) * DEGREES_PER_MINUTE_SECOND_NOTCH);
			let transform = String.format("rotate({0}deg)", degrees);
			if( this.__data.previousSecondHandTransform === transform ) return;
			jQuery(this.__dom.secondHand).css({
				"transform": transform
			});
			this.__data.previousSecondHandTransform = transform;
		}

		_redrawHands() {
			var now = new Date();
			var utcNow = now.getTime() + (now.getTimezoneOffset() * 60000);
			var localNow = new Date(utcNow + (3600000 * this.__data.model.timezone));
			this._redrawSecondHand(localNow);
			this._redrawMinuteHand(localNow);
			this._redrawHourHand(localNow);
		}

		_removeTemporaryListeners() {
			super._removeTemporaryListeners();
		}

		_resizeClockFace() {
			let bounds = this.__dom.rawClockWrapper.getBoundingClientRect();
			let size = Math.min(bounds.height, bounds.width);
			jQuery(this.__dom.face).css({
				"width": size+"px",
				"height": size+"px"
			});
		}

		_resizeHourNotches() {
			let hourNotchHeight;
			let hourNotchMarginTop;
			let hourNotchLineHeight;
			let hourNotchFontSize;
			let hourNotchBounds = jQuery(this.__dom.hourNotchList[0]).find("#designware-hour-notch").get(0).getBoundingClientRect();
			
			let HourNotchType = this.__data.model.HourNotchType;
			switch( this.__data.model.hourNotchType ) {
				case HourNotchType.LINES:
					hourNotchHeight = "";
					hourNotchMarginTop = "";
					hourNotchLineHeight = "";
					hourNotchFontSize = "";
					break;
				case HourNotchType.DOTS:
				case HourNotchType.NUMBERS:
				case HourNotchType.NUMBERS_WITH_ZERO:
				case HourNotchType.NUMERALS:
					hourNotchHeight = hourNotchBounds.width;
					hourNotchMarginTop = -0.5*hourNotchHeight+"px";
					hourNotchLineHeight = hourNotchHeight+"px";
					hourNotchFontSize = 0.8*hourNotchHeight+"px";
					break;
			}

			let i;
			let hourNotch;
			let hourLabel;
			let transform;
			for( i=0; i < this.__data.numHourNotches; i++ ) {
				hourNotch = this.__dom.hourNotchList[i];
				jQuery(hourNotch).find("#designware-hour-notch").css({
					"height": hourNotchHeight,
					"margin-top": hourNotchMarginTop,
					"line-height": hourNotchLineHeight,
					"font-size": hourNotchFontSize
				});
			}
		}
		
		_setCurrentClockTypeSettings() {
			if( this.__data.model.isClockType24Hour ) {
				this.__data.numHourNotches = NUM_24HOUR_NOTCHES;
				this.__data.degreesPerHourNotch = DEGREES_PER_24HOUR_NOTCH;
			} else {
				this.__data.numHourNotches = NUM_12HOUR_NOTCHES;
				this.__data.degreesPerHourNotch = DEGREES_PER_12HOUR_NOTCH;
			}
		}

		_setCurrentHourNotchLabels() {
			this.__data.hourNotchLabels = _.get(HourNotchLabels,this.__data.model.hourNotchType+"."+this.__data.model.clockType);
		}

		_setCurrentHourNotchTypeAttribute() {
			jQuery(this.__dom.hourNotches).attr("designware-hour-notch-type",this.__data.model.hourNotchType);
		}

		_startAnimation() {
			window.requestAnimationFrame(this.__data.onEnterFrame);
		}

	}

	_.set(window,"DW.Classes.ContentBlocks.Clock.Views.ClockContentBlockView",ClockContentBlockView);

})();