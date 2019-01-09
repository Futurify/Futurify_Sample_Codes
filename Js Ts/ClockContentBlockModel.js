;(function() {

	"use strict";

	const _ = window._;

	const ContentBlockModel = _.get(window,"DW.Classes.ContentBlocks.Base.Models.ContentBlockModel");

	const AnimationType = {
		"SLIDE": 0,
		"TICK": 1,
		"length": 2
	};

	const ClockType = {
		"TWELVE_HOUR": 0,
		"TWENTY_FOUR_HOUR": 1,
		"length": 2
	};

	const CssRuleIds = {
		// clock
		"CLOCK_ACTIVE": "clock-active",
		"CLOCK_DEFAULT": "clock-default",
		"CLOCK_DISABLED": "clock-disabled",
		"CLOCK_FOCUS": "clock-focus",
		"CLOCK_HOVER": "clock-hover",
		// face
		"FACE_ACTIVE": "face-active",
		"FACE_DEFAULT": "face-default",
		"FACE_DISABLED": "face-disabled",
		"FACE_FOCUS": "face-focus",
		"FACE_HOVER": "face-hover",
		// hand-hub
		"HAND_HUB_ACTIVE": "hand-hub-active",
		"HAND_HUB_DEFAULT": "hand-hub-default",
		"HAND_HUB_DISABLED": "hand-hub-disabled",
		"HAND_HUB_FOCUS": "hand-hub-focus",
		"HAND_HUB_HOVER": "hand-hub-hover",
		// hour-hand
		"HOUR_HAND_ACTIVE": "hour-hand-active",
		"HOUR_HAND_DEFAULT": "hour-hand-default",
		"HOUR_HAND_DISABLED": "hour-hand-disabled",
		"HOUR_HAND_FOCUS": "hour-hand-focus",
		"HOUR_HAND_HOVER": "hour-hand-hover",
		// hour-notch
		"HOUR_NOTCH_ACTIVE": "hour-notch-active",
		"HOUR_NOTCH_DEFAULT": "hour-notch-default",
		"HOUR_NOTCH_DISABLED": "hour-notch-disabled",
		"HOUR_NOTCH_FOCUS": "hour-notch-focus",
		"HOUR_NOTCH_HOVER": "hour-notch-hover",
		// minute-hand
		"MINUTE_HAND_ACTIVE": "minute-hand-active",
		"MINUTE_HAND_DEFAULT": "minute-hand-default",
		"MINUTE_HAND_DISABLED": "minute-hand-disabled",
		"MINUTE_HAND_FOCUS": "minute-hand-focus",
		"MINUTE_HAND_HOVER": "minute-hand-hover",
		// minute-notch
		"MINUTE_NOTCH_ACTIVE": "minute-notch-active",
		"MINUTE_NOTCH_DEFAULT": "minute-notch-default",
		"MINUTE_NOTCH_DISABLED": "minute-notch-disabled",
		"MINUTE_NOTCH_FOCUS": "minute-notch-focus",
		"MINUTE_NOTCH_HOVER": "minute-notch-hover",
		// second-hand
		"SECOND_HAND_ACTIVE": "second-hand-active",
		"SECOND_HAND_DEFAULT": "second-hand-default",
		"SECOND_HAND_DISABLED": "second-hand-disabled",
		"SECOND_HAND_FOCUS": "second-hand-focus",
		"SECOND_HAND_HOVER": "second-hand-hover",
	};

	const CssRuleStyles = {
		"clock-default": {
			"align-items": "center",
			"justify-content": "center"
		},
		"face-default": {
			"background-color": "#f3f3f3",
			"border-color": "#ccc",
			"border-width": "4px",
			"border-style": "solid",
			"font-size": "40px"
		},
		"hand-hub-default": {
			"background-color": "#cccccc",
			// "width": "40px",
			// "height": "40px",
			// "margin-top": "-20px",
			// "margin-left": "-20px"
		},
		"hour-hand-default": {
			"background-color": "#cccccc",
			"height": "4px",
			"margin-top": "-2px"
		},
		"hour-notch-default": {
			"background-color": "#666666",
			"color": "#666666",
			"height": "4px",
			"margin-top": "-2px"
		},
		"minute-hand-default": {
			"background-color": "#cccccc",
			"height": "4px",
			"margin-top": "-2px"
		},
		"minute-notch-default": {
			"background-color": "#cccccc",
			"height": "4px",
			"margin-top": "-2px"
		},
		"second-hand-default": {
			"background-color": "#cccccc",
			"height": "2px",
			"margin-top": "-1px"
		},
	};

	const Events = {
		"SET_ANIMATION_TYPE": "set-animation-type"
	};

	const HourNotchType = {
		"DOTS": 0,
		"LINES": 1,
		"NUMBERS": 2,
		"NUMBERS_WITH_ZERO": 3,
		"NUMERALS": 4,
		"length": 5
	};

	class ClockContentBlockModel extends ContentBlockModel {

		get animationType() { return this.__data.animationType; }
		get clockType() { return this.__data.clockType; }
		get hourNotchType() { return this.__data.hourNotchType; }
		get isHourNotchTypeDots() { return this.__data.hourNotchType === HourNotchType.DOTS; }
		get isHourNotchTypeLines() { return this.__data.hourNotchType === HourNotchType.LINES; }
		get isAnimationTypeTick() { return this.__data.animationType === AnimationType.TICK; }
		get isClockType24Hour() { return this.__data.clockType === ClockType.TWENTY_FOUR_HOUR; }
		get timezone() { return this.__data.timezone; }
		
		_addConstants() {
			super._addConstants();
			this.AnimationType = AnimationType;
			this.ClockType = ClockType;
			this.CssRuleIds = _.merge(this.CssRuleIds || {}, CssRuleIds);
			this.CssRuleStyles = _.merge(this.CssRuleStyles || {}, CssRuleStyles);
			this.Events = _.merge(this.Events || {}, Events);
			this.HourNotchType = HourNotchType;
		}

		_initData( params ) {
			super._initData( params );
			this.setClockType(ClockType.TWELVE_HOUR);
			this.setHourNotchType(HourNotchType.NUMBERS);
			this.setTimezone(-(new Date().getTimezoneOffset() / 60));
			this.setState( this.States.READY );
		}

		_registerCssRules() {
			super._registerCssRules();
			this._registerComponentRules("CLOCK",".designware-content-block-clock");
			this._registerComponentRules("FACE","#designware-face");
			this._registerComponentRules("HAND_HUB","#designware-hand-hub");
			this._registerComponentRules("HOUR_HAND","#designware-hour-hand");
			this._registerComponentRules("MINUTE_HAND","#designware-minute-hand");
			this._registerComponentRules("SECOND_HAND","#designware-second-hand");
			this._registerComponentRules("MINUTE_NOTCH","#designware-minute-notches .designware-minute-notch");
			this._registerComponentRules("HOUR_NOTCH","#designware-hour-notches .designware-hour-notch-wrapper #designware-hour-notch");
		}

		setAnimationType( animationType ) {
			if( this.__data.animationType === animationType ) return;
			if( typeof(animationType) !== "number" || isNaN(animationType) ) throw new Error("Unexpected type for 'animationType'.");
			if( animationType < 0 || animationType > AnimationType.length ) throw new Error("Unknown value for 'animationType'.");
			this.__data.animationType = animationType;
			this.fire(Events.SET_ANIMATION_TYPE, { "animationType": this.__data.animationType });
		}

		setClockType( clockType ) {
			if( this.__data.clockType === clockType ) return;
			if( typeof(clockType) !== "number" || isNaN(clockType) ) throw new Error("Unexpected type for 'clockType'.");
			if( clockType < 0 || clockType > ClockType.length ) throw new Error("Unknown value for 'clockType'.");
			this.__data.clockType = clockType;
			this.fire(Events.SET_CLOCK_TYPE, { "clockType": this.__data.clockType });
		}

		setHourNotchType( hourNotchType ) {
			if( this.__data.hourNotchType === hourNotchType ) return;
			if( typeof(hourNotchType) !== "number" || isNaN(hourNotchType) ) throw new Error("Unexpected type for 'hourNotchType'.");
			if( hourNotchType < 0 || hourNotchType > HourNotchType.length ) throw new Error("Unknown value for 'hourNotchType'.");
			this.__data.hourNotchType = hourNotchType;
			this.fire(Events.SET_HOUR_NOTCHES_TYPE, { "hourNotchType": this.__data.hourNotchType });
		}

		setTimezone(timezone) {
			if( this.__data.timezone === timezone ) return;
			if( typeof(timezone) !== "number" || isNaN(timezone) ) throw new Error("Unexpected type for 'timezone'.");
			this.__data.timezone = timezone; 
			this.fire(Events.SET_TIMEZONE, { "timezone": this.__data.timezone });
		}

	}

	_.set(window,"DW.Classes.ContentBlocks.Clock.Models.ClockContentBlockModel",ClockContentBlockModel);

})();