/*  This file provides the core data elements (wrapper classes) used by the interactive map */

import {LineString} from 'ol/geom';
import {getLength} from 'ol/sphere.js';
import {fromLonLat} from 'ol/proj';
import {Circle as CircleStyle, RegularShape, Fill, Stroke, Style, Text} from 'ol/style.js';

import {IAMTranslatorFactory} from './iamBase'


//using simple for loop for performance reasons and avoid crashes for large arrays as Math.min would produce
function getMinOfArray (array) {
    let min = Infinity;
    for (let i=0;i<array.length;i++) {
        min = (array[i] < min)? array[i] : min;
    }
    return min;
}
export {getMinOfArray}
    
//using simple for loop for performance reasons and avoid crashes for large arrays as Math.max would produce
function getMaxOfArray (array) {
    let max = -Infinity;
    for (let i=0;i<array.length;i++) {
        max = (array[i] > max)? array[i] : max;
    }
    return max;
}
export {getMaxOfArray} 
 
 
/************************************************************************************************** Feature ***********************************************************/ 
class FeatureType {
    static POINT = 1;
    static LINESTRING = 2;
    static POLYGON = 3;
    
    static geoJSONName = ['','Point','LineString','Polygon'];
    
    static dropdown = [
        {id: FeatureType.POINT, name: IAMTranslatorFactory.getMsg('Point')},
        {id: FeatureType.LINESTRING, name: IAMTranslatorFactory.getMsg('LineString')},
        {id: FeatureType.POLYGON, name: IAMTranslatorFactory.getMsg('Polygon')}
    ];
}
export {FeatureType}

//calculates length in km of a feature. For points, 0 will be returned, for polygons, the length of all coordinate arrays is summed up
function getLengthOfCoordinates (featureType, coordinates) {
    if (featureType === FeatureType.LINESTRING) {
        return _calculateLength(coordinates);
    }
    else if (featureType === FeatureType.POLYGON) {
        let length = 0;
        coordinates().forEach( (array) => {
            length += _calculateLength(array);
        });
        return length;
    }
    return 0;
}
export{getLengthOfCoordinates}
  
//internal method to calculate the length of an array of ccordinates using the OpenLayers getLength method  
function _calculateLength (array) {
    const ls = new LineString(array.map( (val) => fromLonLat(val)));
    return getLength(ls)/1000;
}
    
/**
 * Basic wrapper class for a feature. Consists of the feature type (Point, LineString or Polygon), id and the coordinates
 * @type Feature
 */
class Feature {
    featureType;
    _id;
    _coordinates;
    
    /**
     * 
     * @param {Object} params - object with the following expected attributes:
     *                          - type: one of FeatureType.POINT, FeatureType.LINESTRING or FeatureType.POLYGON
     * @returns {Feature}
     */
    constructor (params) {
        this.featureType = params.type;
        this._id = params.id;
        this._coordinates = params.coordinates;
    }
    
    setCoordinates (coordinates) {
        this._coordinates = coordinates;
    }
    
    getType () {
        return this.featureType;
    }
    
    getId () {
        return this._id;
    }
    
    getCoordinates () {
        return this._coordinates;
    }
    
    /**
     * 
     * @returns {Number} - returns the minimum longitude (or Infinity, if coordinates array is empty):
     *      - For Points, this is simply the longitude. 
     *      - For LineStrings the minimum of all longitudes in the coordinates array is being calculated
     *      - For Polygons the minimum of all longitudes in all of the coordinates arrays is being calculated
     */
    getMinLongitude () {
        if (this.getType() === FeatureType.LINESTRING) {
            return getMinOfArray(this._coordinates.map(val => val[0]));
        }
        else if (this.getType() === FeatureType.POLYGON) {
            const mins = [];
            this.getCoordinates().forEach( (array) => {
                mins.push(getMinOfArray(array.map(val => val[0])));
            });
            return Math.min(...mins);
        }
        return this._coordinates[0];
    }

    /**
     * 
     * @returns {Number} - returns the minimum latitude(or Infinity, if coordinates array is empty):
     *      - For Points, this is simply the latitude. 
     *      - For LineStrings the minimum of all latitudes in the coordinates array is being calculated
     *      - For Polygons the minimum of all longitudes in all of the coordinates arrays is being calculated
     */
    getMinLatitude () {
        if (this.getType() === FeatureType.LINESTRING) {
            return getMinOfArray(this._coordinates.map(val => val[1]));
        }
        else if (this.getType() === FeatureType.POLYGON) {
            const mins = [];
            this.getCoordinates().forEach( (array) => {
                mins.push(getMinOfArray(array.map(val => val[1])));
            });
            return Math.min(...mins);
        }
        return this._coordinates[1];
    }

    /**
     * 
     * @returns {Number} - returns the maximum longitude (or -Infinity, if coordinates array is empty):
     *      - For Points, this is simply the longitude. 
     *      - For LineStrings the maximum of all longitudes in the coordinates array is being calculated
     *      - For Polygons the maximum of all longitudes in all of the coordinates arrays is being calculated
     */
    getMaxLongitude () {
        if (this.getType() === FeatureType.LINESTRING) {
            return getMaxOfArray(this._coordinates.map(val => val[0]));
        }
        else if (this.getType() === FeatureType.POLYGON) {
            const maxs = [];
            this.getCoordinates().forEach( (array) => {
                maxs.push(getMaxOfArray(array.map(val => val[0])));
            });
            return Math.max(...maxs);
        }
        return this._coordinates[0];
    }

    /**
     * 
     * @returns {Number} - returns the maximum latitude(or -Infinity, if coordinates array is empty):
     *      - For Points, this is simply the latitude. 
     *      - For LineStrings the maximum of all latitudes in the coordinates array is being calculated
     *      - For Polygons the maximum of all longitudes in all of the coordinates arrays is being calculated
     */
    getMaxLatitude () {
        if (this.getType() === FeatureType.LINESTRING) {
            return getMaxOfArray(this._coordinates.map(val => val[1]));
        }
        else if (this.getType() === FeatureType.POLYGON) {
            const maxs = [];
            this.getCoordinates().forEach( (array) => {
                maxs.push(getMaxOfArray(array.map(val => val[1])));
            });
            return Math.max(...maxs);
        }
        return this._coordinates[1];
    }
    
    /**
     * 
     * @param {Feature} other
     * @returns {Boolean} returns true, if both objects have the same id and feature type
     */
    equals (other) {
        if (other) {
            return (
                other.getType() === this.getType() &&
                other.getId() === this.getId()      
            );
        }
        return false;
    }
    
    /**
     * 
     * @returns {Object} returns a GeoJSON representation of this Feature
     */
    toGeoJSON () {
        return {
            type: 'Feature',
            id: this.getId(),
            geometry: {
                type: FeatureType.geoJSONName[this.getType()],
                coordinates: this.getCoordinates()
            },
            properties: {
                id: this.getId()
            }
        };
    }
}
export {Feature}

/**
 * This wrapper class enhances a Feature object with properties (simple key-value-pairs) and attributes (key-value-pairs including an optional valid period)
 * @type ExtendedFeature extends Feature
 */
class ExtendedFeature extends Feature {
    _properties;
    _attributes;
    
    /**
     * Call the Feature class constructor with the specified parameters and adds empty properties and attributes
     * 
     * @param {Object} feature - see constructor of class Feature
     * @returns {ExtendedFeature}
     */
    constructor (feature) {
        super(feature);
        this.clearProperties();
        this.clearAttributes();
    }
    
    /**
     * 
     * @returns {Object} - contains all properties as key-value pairs in an object
     */
    getProperties () {
        return this._properties;
    }
    
    /**
     * adds a property with the specifiedkey/name and value
     * 
     * @param {String} name - key of the property
     * @param {String} value - value of the property
     * @returns {undefined}
     */
    addProperty (name, value) {
        this._properties[name] = value;
    }
    
    /**
     * 
     * @param {String} name - key/name of the property
     * @returns {String} - value of the property or undefined, if no property exists for the given key/name
     */
    getPropertyValue (name) {
        return this._properties[name];
    }
    
    /**
     * deletes all properties from this feature
     * @returns {undefined}
     */
    clearProperties () {
        this._properties = {};        
    }
    
    /**
     * 
     * @returns {Array} - returns all keys/names of the properties assigned to this feature
     */
    getPropertyNames () {
        return [...Object.keys(this._properties)];
    }
    
    /**
     * 
     * @param {FeatureAttribute} attribute - the attribute to be added
     * @returns {undefined}
     */
    addAttribute (attribute) {
        if (attribute.getFeatureType() === this.getType() && attribute.getFeatureId() === this.getId()) {
            this._attributes.push(attribute);
        }
    }
    
    /**
     * 
     * @param {type} filterFunc - filter function which will be applied on each FeatureAttribute assigned to this Feature. Function should return true or false 
     * @returns {Array[FeatureAttribute]} - Array with all FeatureAttributes, for which the specified filterFunc returns a true value
     */
    getAttributes (filterFunc) {
        return this._attributes.filter((attribute) => {
            if (filterFunc) {
                return filterFunc(attribute);
            }
            return true;
        });
    }
    
    /**
     * deletes all attributes from this feature
     * @returns {undefined}
     */
    clearAttributes() {
        this._attributes = [];
    }
    
    /**
     * 
     * @returns {Array} - returns all keys/names of the attributes assigned to this feature
     */
    getAttributesNames () {
        const temp = new Map();
        this._attributes.forEach((attribute) => {temp.set(attribute.getName(),null);});
        return [...temp.keys()];
    }
    
    /**
     * @returns {Number} - returns the length of this feature. If a property with name 'length' is assigned to this feature, the parseFloat value of the properties' value is returned. Otherwise the length is calculated based on the coordinates usibng the getLength method of OpenLayers
     */
    getLength () {
        if (this._properties.length) {
            return parseFloat(this._properties.length);
        }
        return getLengthOfCoordinates(this.getType(), this.getCoordinates());
    }
    
    /**
     * 
     * @returns {String} - returns the name of this feature.  If a property with name 'name' is assigned to this feature, its value will be returned. Otherwise the feature's id will be returned
     */
    getName () {
        if (this._properties.name) {
            return this._properties.name;
        }
        return this.getId();        
    }
    
    /**
     * 
     * @param {type} searchString
     * @returns {Boolean} - returns true, if at least one of the properties' value contains the specified searchString ignoring the case
     */
    matches(searchString) {
        return [...Object.values(this._properties)].find((val) => val.toLowerCase().indexOf(searchString.toLowerCase()) !== -1) !== undefined;
    }
    
    /**
     * 
     * @param {Boolean} addProperties
     * @param {Boolean} addAttributes
     * @returns {Object} - returns a GeoJSON representation of this Feature. If addProperties is set to true, all properties' key/value pairs are stored in the properties attribute of the GeoJSON object. If addAttributes is set to true, an array containg all attributes will be stored under key '_iamAttributes' of the GeoJSON object
     */
    toGeoJSON(addProperties, addAttributes) {
        const ret = super.toGeoJSON();
        if (addProperties) {
            [...Object.entries(this._properties)].forEach((keyVal) => {
               ret.properties[keyVal[0]] =  keyVal[1];
            });
        }
        if (addAttributes) {
            ret.properties['_iamAttributes'] = this._attributes;
        }
        return ret;
    }
}
export {ExtendedFeature}


/************************************************************************************************** Feature Property ***********************************************************/ 
/**
 * Wrapper class for a Feature Property. Consists of id and type of feature, to which the proeprty belongs as well as key/name and value of the property itsself
 * 
 * @type FeatureProperty
 */
class FeatureProperty {
    featureType;
    _featureId;
    _propertyName;
    _propertyValue;
   
    /**
     * 
     * @param {Object} params - expected attributes are featureType, featureId, propertyName and propertyValue
     * @returns {FeatureProperty}
     */
    constructor (params) {
        this.featureType = params.featureType;
        this._featureId = params.featureId;
        this._propertyName = params.propertyName;
        this._propertyValue = params.propertyValue;        
    }
    
    getFeatureType () {
        return this.featureType;
    }
    
    getFeatureId () {
        return this._featureId;        
    }
    
    getName() {
        return this._propertyName;
    }
    
    getValue() {
        return this._propertyValue;
    }
    
    /**
     * 
     * @param {FeatureProperty} other
     * @returns {Boolean} returns true, if both properties are assigned to the same feature (vias feature id and feature type) and have the same name (property values might differ!)
     */
    equals (other) {
        if (other) {
            return (
                other.getFeatureType() === this.getFeatureType() &&
                other.getFeatureId() === this.getFeatureId() &&
                other.getName() === this.getName()       
            );
        }
        return false;
    }
}
export {FeatureProperty}


/************************************************************************************************** Feature Attribute ***********************************************************/ 
/**
 * Wrapper class for Feature Attribute. Extends the FeatureProperty class and enhances it with attributes fromYear, fromMonth, fromday and toYear, toMonth, toDay (all optional)
 * 
 * @type FeatureProperty
 */
class FeatureAttribute extends FeatureProperty {
    _fromYear;
    _fromMonth;
    _fromDay;
    _toYear;
    _toMonth;
    _toDay;
    
    /**
     * 
     * @param {Object} params - expected attributes are fromYear, fromMonth, fromday and toYear, toMonth, toDay (all optional)
     * @returns {FeatureAttribute}
     */
    constructor (params) {
        super(params);
        this._fromYear = params.fromYear;
        this._fromMonth = params.fromMonth;
        this._fromDay = params.fromDay;
        this._toYear = params.toYear;
        this._toMonth = params.toMonth;
        this._toDay = params.toDay;
    }
    
    getFromYear() {
        return this._fromYear;
    }
    
    getFromMonth() {
        return this._fromMonth;
    }
    
    getFromDay() {
        return this._fromDay;
    }
    
    getToYear() {
        return this._toYear;
    }
    
    getToMonth() {
        return this._toMonth;
    }
    
    getToDay() {
        return this._toDay;
    }
    
    /**
     * 
     * @param {FeatureAttribute} other
     * @returns {Boolean} - returns true, if both properties are assigned to the same feature (vias feature id and feature type) and have the same name (property values might differ!)
     */
    equals (other) {
        return (super.equals(other) &&
        this.getValue() === other.getValue() &&
        this.getFromYear() === other.getFromYear() &&
        this.getFromMonth() === other.getFromMonth() &&
        this.getFromDay() === other.getFromDay() &&
        this.getToYear() === other.getToYear() &&
        this.getToMonth() === other.getToMonth() &&
        this.getToDay() === other.getToDay());
    }
}
export {FeatureAttribute}


/************************************************************************************************** Feature Setting ***********************************************************/ 

/**
 * Wrapper class for a color. Consists of the three RGB values plus an alpha value (opacity)
 * 
 * @type Color
 */
class Color {
    r;
    g;
    b;
    alpha;
    
    /**
     * 
     * @param {Array|Object} props - RGB- and alpha values. Either as and array with RGB in hex-format (['#rrggbb',alpha]) or an object with attributes r, g, b and alpha
     * @returns {Color}
     */
    constructor (props) {
        if (props instanceof Array) {
            this._setColorValueFromHex(props[0]);
            this.alpha = parseFloat(props[1]);
        }
        else {
            this.r = props.r;
            this.g = props.g;
            this.b = props.b;
            this.alpha = props.alpha;
        }
    }
    
    _setColorValueFromHex(hex) {
        this.r = parseInt(hex.substring(1,3),16);
        this.g = parseInt(hex.substring(3,5),16);
        this.b = parseInt(hex.substring(5,7),16);
    }
    
    /**
     * 
     * @returns {String} RGB values in hex-format as expected in css ('#rrggbb')
     */
    toCSSHex () {
        return '#' + this._numberToHex(this.r) + this._numberToHex(this.g) + this._numberToHex(this.b);
    }
    
    _numberToHex (number) {
        let a = Number(number).toString(16).toUpperCase();
        if ((a.length % 2) > 0) {
            a = '0' + a;
        }
        return a;
    }
    
    /**
     * 
     * @returns {String} RGB and alpha values as expected by OpenLayers ('rgb(rrr,ggg,bbb,alpha)')
     */
    toOLStyle() {
        return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.alpha +')';
    }
}
export {Color}


/**
 * Wraps a border settings A border consists of a color, a width (in pixel), an optional dash pattern (four integers in an array), optional dash offset and an optional line cap ('round','butt','squared')
 * @type Border
 */
class Border {
    color;
    width;
    lineDash1;
    lineDash2;
    lineDash3;
    lineDash4;
    lineDashOffset;
    lineCap;
    
    static lineCapValues = [
        {id: 'round', name: IAMTranslatorFactory.getMsg('round')},
        {id: 'butt', name: IAMTranslatorFactory.getMsg('butt')},
        {id: 'square', name: IAMTranslatorFactory.getMsg('square')}
    ];
    
    /**
     * 
     * @param {Object} props - parameters of border (color as Object with attributes r, g, b and alpha; width as integer, lineDash1 to lineDash4 as integers, lineDashOffset as integer, lineCap as one of ('round','butt','squared'))
     * @returns {Border}
     */
    constructor (props) {
        Object.assign(this,props);
        this.color = props.color? new Color(props.color) : undefined;
        this.width = props.width?  props.width : undefined;
    }

    /**
     * 
     * @returns {ol.style.Stroke} OpenLayers representation of this border. Line dash and line cap values are only set if specified in this object
     */
    toOLStyle() {
        if (!this.color || !this.width) {
            return;
        }
        const ret = new Stroke ({
               color: this.color.toOLStyle(),
               width: this.width
        });
        
        const lineDash = [];
        this.lineDash1 &&  lineDash.push(this.lineDash1);
        this.lineDash2 &&  lineDash.push(this.lineDash2);
        this.lineDash3 &&  lineDash.push(this.lineDash3);
        this.lineDash4 &&  lineDash.push(this.lineDash4);
        lineDash.length>0 && ret.setLineDash(lineDash);
        
        this.lineDashOffset && ret.setLineDashOffset(this.lineDashOffset);
        this.lineCap && ret.setLineCap(this.lineCap);
        return ret;
    }
    
    /**
     * Merges this object with the specified masterBorder. All attributes with value != undefined are taken from the masterBorder. Only attributes specified in this object but not in the master object will be added to the returned Border. Both, this object as well as the master object are not changed. Instead a new iunstance of Border will be returned
     * @param {Border} masterBorder
     * @returns {Border} masterBorder merged with this object in a new instance of Border
     */
    merge (masterBorder) {
        if (masterBorder) {
            const temp = {...masterBorder};
            Object.keys(temp).forEach( key => temp[key] === undefined && delete temp[key]);

            return new Border(Object.assign({...this},temp));          
        }
        return {...this};
    }
}
export {Border}


/**
 * Wraps a text setting. It contains a large range of attributes which were basically taken from the ol.style.Text class
 * 
 * @type TextSettings
 */
class TextSettings {
    
    /* text color */
    textFillColor;
    textBorder;
    
    /*text - font settings */
    textFontStyle;
    textFontWeight;
    textFontSize;
    textFontSizeType;
    textFontFamily;
    textFont;
    
    /* text - general alignment */
    textOffsetX;
    textOffsetY;
    textRotation;
    textAlign;
    textPlacement;
    
    /* text - special settings for point aligmnent */
    textBackgroundFillColor;
    textBackgroundBorder;
    textBackgroundPaddingTop;
    textBackgroundPaddingRight;
    textBackgroundPaddingBottom;
    textBackgroundPaddingLeft;
                
    /*text - special alignment along line*/
    textMaxAngle;
    textOverflow;
    textRepeat;
    
    static textFontStyleValues = [
        {id: 'normal', name : IAMTranslatorFactory.getMsg('normal')},
        {id: 'italic', name : IAMTranslatorFactory.getMsg('italic')}
    ];
    
    static textFontWeightValues = [
        {id: 'normal', name : IAMTranslatorFactory.getMsg('normal')},
        {id: 'bold', name : IAMTranslatorFactory.getMsg('bold')}
    ];
    
    static textFontSizeTypeValues = ['pt', 'em'];
    
    static textFontFamilyValues = ['Arial', 'Verdana', 'Calibri', 'Times New Roman'];

    static textAlignValues = [
        {id: 'left', name : IAMTranslatorFactory.getMsg('left')}, 
        {id: 'right', name : IAMTranslatorFactory.getMsg('right')}, 
        {id: 'center', name : IAMTranslatorFactory.getMsg('center')}, 
        {id: 'end', name : IAMTranslatorFactory.getMsg('end')},
        {id: 'start', name : IAMTranslatorFactory.getMsg('start')}
    ];
    
    static textPlacementValues = [
        {id: 'point', name : IAMTranslatorFactory.getMsg('point')}, 
        {id: 'line', name : IAMTranslatorFactory.getMsg('line')}
    ];
    
    /**
     * 
     * @returns {TextSettings} standard text settings (black, normal style & weight, size 10pt, Arial
     */
    static getStandard () {
        return new TextSettings({
            textFillColor: new Color({r: 0, g: 0, b: 0, alpha: 1}),
            textFonStyle: TextSettings.textFontStyleValues[0],
            textFontWeight: TextSettings.textFontWeightValues[0],
            textFontSize: 10,
            textFontSizeType: TextSettings.textFontSizeTypeValues[0],
            textFontFamily: TextSettings.textFontFamilyValues[0],
            textOffsetY: 10,
            textOverflow: true
        });
    }
    
    /**
     * 
     * @param {Object} props parameter with attributes as specified in this class
     * @returns {TextSettings}
     */
    constructor (props) {
        Object.assign(this, props);
        this.textFillColor = (props && props.textFillColor)? new Color(props.textFillColor) : undefined;
        this.textBorder = new Border((props && props.textBorder)??{});
        this.textBackgroundFillColor = (props && props.textBackgroundFillColor)? new Color(props.textBackgroundFillColor) : undefined;
        this.textBackgroundBorder = new Border((props && props.textBackgroundBorder)??{});         
    }
                       
    /**
     * @param {String} textValue - the text to be displayed
     * @returns {ol.style.Style} OpenLayers representation of this text settings. 
     */
    toOLStyle(textValue) {
        const style = new Style({});
        const olText = new Text ({});
        
        textValue && olText.setText(textValue);
        
        this.textFillColor && olText.setFill(new Fill ({color: this.textFillColor.toOLStyle()}));

        const border = this.textBorder? this.textBorder.toOLStyle() : undefined;
        border && olText.setStroke(border);
        
        olText.setFont((this.textFont)? this.textFont : (this.textFontStyle??'') + ' ' +  (this.textFontWeight??'') + ' ' + (this.textFontSize??'') + '' + (this.textFontSizeType??'') + ' ' + (this.textFontFamily??''));
        
        this.textOffsetX && olText.setOffsetX(this.textOffsetX); 
        this.textOffsetY && olText.setOffsetY(this.textOffsetY);

        this.textRotation && olText.setRotation(this.textRotation * Math.PI);
        this.textAlign && olText.setTextAlign(this.textAlign);

        this.textBackgroundFillColor && olText.setBackgroundFill (new Fill ({color: this.textBackgroundFillColor.toOLStyle()}));
        
        const backgroundBorder = this.textBackgroundBorder? this.textBackgroundBorder.toOLStyle() : undefined;
        backgroundBorder && olText.setBackgroundStroke (backgroundBorder);
        
        if (this.textBackgroundPaddingTop || this.textBackgroundPaddingTop || this.textBackgroundPaddingLeft || this.textBackgroundPaddingRight) {
            const textBackgroundPadding = [];
            this.textBackgroundPaddingTop?  textBackgroundPadding.push(this.textBackgroundPaddingTop) :  textBackgroundPadding.push(0);
            this.textBackgroundPaddingRight?  textBackgroundPadding.push(this.textBackgroundPaddingRight) :  textBackgroundPadding.push(0);
            this.textBackgroundPaddingBottom?  textBackgroundPadding.push(this.textBackgroundPaddingBottom) :  textBackgroundPadding.push(0);
            this.textBackgroundPaddingLeft?  textBackgroundPadding.push(this.textBackgroundPaddingLeft) :  textBackgroundPadding.push(0);
            olText.setPadding(textBackgroundPadding);
        }

        this.textPlacement && olText.setPlacement(this.textPlacement);
        this.maxAngle && olText.setMaxAngle(this.textMaxAngle * Math.PI);
        this.textOverflow && olText.setOverflow(this.textOverflow);
        this.textRepeat && olText.setRepeat(this.textRepeat);
        
        style.setText(olText);  
        
        return style;
    }
    
    /**
     * 
     * Merges this object with the specified masterTextSettings. All attributes with value != undefined are taken from the masterTextSettings. Only attributes specified in this object but not in the master object will be added to the returned TextSetttings. Both, this object as well as the master object are not changed. Instead a new iunstance of TextSettings will be returned
     * 
     * @param {TextSettings} masterTextSettings
     * @returns {TextSettings}
     */
    merge(masterTextSettings) {
        if (masterTextSettings) {
            const temp = {...masterTextSettings};
            Object.keys(temp).forEach( key => temp[key] === undefined && delete temp[key]);

            const ret = new TextSettings(Object.assign({...this},temp));

            console.log(this.textBorder);
            console.log(masterTextSettings.textBorder);

            ret.textBorder = this.textBorder.merge(masterTextSettings.textBorder);
            this.textBackgroundBorder && (ret.textBackgroundBorder = this.textBackgroundBorder.merge(masterTextSettings.textBackgroundBorder));
            return ret;    
        }
        return {...this};
    }
}
export {TextSettings}

/**
 * This class wraps all settings attributes, which are common for all features. Settings for specific features will extend this class. This class should not be instantiated.
 * The following attributes have to create a unique id for each Settings:
 *  - featureType: type of the feature to which this setting is assigned to (Point, LineString, Polygon)
 *  - levelType: specifies, whether this settings are on standrad, attribute or feature level. Should be one of FeatureSettings.LEVEL_STANDARD, FeatureSettings.LEVEL_ATTRIBUTE or FeatureSettings.LEVEL_FEATURE
 *  - levelName: name of the level ('Standard' for LEVEL_STANDARD, attributeName for LEVEL_ATTRIBUTE (including '_iam_hasChanged' or featureId for LEVEL_FEATURE)
 *  - levelValue: value of the level. Only used for LEVEL_ATTRIBUTE (in this case set to attributeValue)
 *  
 * The common settings consists of the following attributes:
 *  - showFeature {Boolean}: indicating whether Feature should be displayed on Map or not
 *  - showText {Boolean}: indicating whether text of Feature should be displayed on Map or not
 *  - textSettings {TextSettings}: TextSettings assigned to this feature settings
 * 
 * @type FeatureSettings
 */
class FeatureSettings {
    
    static LEVEL_STANDARD = 1;
    static LEVEL_ATTRIBUTE = 2;
    static LEVEL_FEATURE = 3;
    
    featureType;
    levelType;
    levelName;
    levelValue;
    
    showFeature;
    showText;
    textSettings;
    
    /**
     * 
     * @param {Object} params parameter with attributes as specified in this class
     * @returns {FeatureSettings}
     */
    constructor (params) {
        Object.assign(this, params);
        params.type && (this.featureType = params.type);
        this.levelType = params.levelType;
        this.levelName = params.levelName;
        this.levelValue = params.levelValue;
        this.showFeature = params.showFeature;
        this.showText = params.showText;
        params.textSettings && (this.textSettings = new TextSettings(params.textSettings));
    }
    
    
    setTextSettings (textSettings) {
        this.textSettings = textSettings;
    }
    
    
    getFeatureType () {
        return this.featureType;
    }
    
    getLevelType () {
        return this.levelType;
    }
    
    getLevelName () {
        return this.levelName;
    }
    
    getLevelValue () {
        return this.levelValue;
    }
    
    getShowFeature () {
        return this.showFeature;
    }
    
    getShowText () {
        return this.showText;
    }
    
    getTextSettings () {
        return this.textSettings;
    }
    
    
    /**
     * @param {String} textValue - the text to be displayed
     * @returns {ol.style.Style} OpenLayers representation of this settings. Only consists of text settings. 
     */
    toOLStyle(textValue) {
        return (this.getShowText())? this.getTextSettings().toOLStyle(textValue) : this.getTextSettings().toOLStyle('');
    }
    
    /**
     * 
     * Merges this object with the specified masterSettings. All attributes with value != undefined are taken from the masterSettings. Only attributes specified in this object but not in the master object will be added to the returned FeatureSettings. Both, this object as well as the master object are not changed. Instead a new iunstance of FeatureSettings will be returned
     * 
     * @param {FeatureSettings} masterSettings
     * @returns {FeatureSettings}
     */
    merge(masterSettings) {
        const temp = {...masterSettings};
        Object.keys(temp).forEach( key => temp[key] === undefined && delete temp[key]);
        
        const ret = new FeatureSettings(Object.assign({...this},temp));
        ret.setTextSettings(this.getTextSettings().merge(masterSettings.getTextSettings())); 
        return ret;
    }
    
    /**
     * Compares this FeatureSettings with another FeatureSettings
     * @param {FeatureSettings} other
     * @returns {Boolean} true, if both FeatureSettings have the same featureType, levelType, levelName and levelValue. Setting attributes itsselves like showFeature are not evaluated!
     */
    equals(other) {
        return (
            this.featureType === other.featureType &&
            this.levelType === other.levelType &&
            this.levelName === other.levelName &&
            this.levelValue === other.levelValue
        );
    }
}
export {FeatureSettings}


/**
 * Wraps settings for a Point feature by enhancing the base class FeatureSettings with the following attributes:
 *  - pointShapeType {Number}: smybol to be used for display. One of PointSettings.CIRCLE, PointSettings.POLYGON or PointSettings.STAR
 *  - pointFill {Color}: color used for filling the symbol of the point feature
 *  - pointBorder {Border}: border to be used for surrounding the symbol of the point feature
 *  - pointRadius {Number}: radius of the symbol in pixel (apllies to all shape types!)
 *  - pointDisplacementX {Number}: horizontal displacement 
 *  - pointDisplacementY {Number}: vertical displacement 
 *  - pointRotation {Number}: rotation of feature (will be multiplied internally with PI). Only applies to symbol types POLYGON and STAR
 *  - pointPoints {Number}: Number of points of symbol (e.g. 5 for a classical star). Only applies to symbol types POLYGON and STAR
 *  - pointStarRadius {Number}: second (smaller) radius. Only applies to symbol type STAR
 *    
 * @type PointSettings
 */
class PointSettings extends FeatureSettings {

    static CIRCLE = 1;
    static POLYGON = 2;
    static STAR = 3;

    static shapeNames = ['','Circle','Polygon','Star'];
    static pointShapeTypeValues = [
        {id: PointSettings.CIRCLE, name: IAMTranslatorFactory.getMsg('Circle')},
        {id: PointSettings.POLYGON, name: IAMTranslatorFactory.getMsg('Polygon')},
        {id: PointSettings.STAR, name: IAMTranslatorFactory.getMsg('Star')}
    ];
    
    pointShapeType;
    
    pointFill;
    pointBorder;
    pointRadius;
    pointDisplacementX;
    pointDisplacementY;

    pointRotation;
    pointPoints;
    
    pointStarRadius;
    
    /**
     * 
     * @returns {PointSettings} standard point settings (feature shown on map without text, standard text settings, symbol style circle with radius 5px and black border 1px, light gray filling)
     */
    static getStandard () {
        return new PointSettings({
            levelType : FeatureSettings.LEVEL_STANDARD,
            levelName : 'Standard',
            levelValue : '',

            showFeature : true,
            showText : false,
            textSettings : TextSettings.getStandard(),
    
            pointShapeType : PointSettings.CIRCLE,
            pointFill : new Color({r: 200, g: 200, b: 200, alpha: 1}),
            pointBorder : new Border({
                color: new Color({r: 0, g: 0, b: 0, alpha: 1}),
                width: 1
            }),
            pointRadius : 5            
        });
    }
    
    /**
     * 
     * @param {Object} props parameters with attributes as specified in this class
     * @returns {PointSettings}
     */
    constructor (props) {
        super(props);
        this.featureType = FeatureType.POINT;
        this.pointFill = (props && props.pointFill)? new Color(props.pointFill) : undefined;
        this.pointBorder = new Border((props && props.pointBorder)??{});            
    }
    
    /**
     * 
     * @param {String} textValue text to be displayed (e.g. name of feature)
     * @returns {Array[ol.style.Style]} OpenLayers representation of this settings. As only one style is possible for point features, the returned array will only contain one element or none, if showFeature=false
     */
    toOLStyle(textValue) {
        if (!this.getShowFeature()) {
            return [];
        }        
        const ret = super.toOLStyle(textValue);
        
        if (this.pointShapeType === PointSettings.CIRCLE) {
            const cStyle = new CircleStyle({});
            this.pointFill && cStyle.setFill(new Fill({color: this.pointFill.toOLStyle()}));
            this.pointBorder && cStyle.setStroke (this.pointBorder.toOLStyle());
            this.pointRadius && cStyle.setRadius (this.pointRadius);
            (this.pointDisplacementX || this.pointDisplacementY) && cStyle.setDisplacement ([this.pointDisplacementX, this.pointDisplacementY]);
            ret.setImage(cStyle);
        }
        else {
            const rStyle = new RegularShape({
                radius: this.showFeature? this.pointRadius : 0,
                radius2: this.pointShapeType === PointSettings.STAR? this.pointStarRadius : undefined,
                points: this.pointPoints? this.pointPoints : 0
            });
            this.pointFill && rStyle.setFill(new Fill({color: this.pointFill.toOLStyle()}));
            this.pointBorder && rStyle.setStroke (this.pointBorder.toOLStyle());

            (this.pointDisplacementX || this.pointDisplacementY) && rStyle.setDisplacement ([this.pointDisplacementX, this.pointDisplacementY]);
            
            this.pointRotation && rStyle.setRotation (this.pointRotation * Math.PI);
            
            ret.setImage(rStyle);            
        }
        
        return [ret];
    }
    
    /**
     * 
     * Merges this object with the specified masterPointSettings. All attributes with value != undefined are taken from the masterPointSettings. Only attributes specified in this object but not in the master object will be added to the returned PointSettings. Both, this object as well as the master object are not changed. Instead a new iunstance of PointSettings will be returned
     * 
     * @param {PointSettings} masterPointSettings
     * @returns {PointSettings}
     */
    merge(masterPointSettings) {
        const ret = new PointSettings(super.merge(masterPointSettings));
        ret.pointBorder = this.pointBorder.merge(masterPointSettings.pointBorder);      
        return ret;
    }
}
export {PointSettings}


/**
 * Wraps settings for a LineString feature by enhancing the base class FeatureSettings with the following attributes:
 *  - lineBorder1 {Border}: border to be used for display of line string
 *  - lineBorder1 {Border}: second border to be used for display of line string, e.g. to allow dotted lines with two different colors
 *    
 * @type PointSettings
 */
class LineStringSettings extends FeatureSettings {
    
    lineBorder1;
    lineBorder2;
    
    /**
     * 
     * @returns {LineStringSettings} standard line string settings (feature shown on map without text, standard text settings, black line with 2px width, no dash pattern)
     */
    static getStandard () {
        return new LineStringSettings({
            levelType : FeatureSettings.LEVEL_STANDARD,
            levelName : 'Standard',
            levelValue : '',

            showFeature : true,
            showText : false,
            textSettings : TextSettings.getStandard(),
    
            lineBorder1 : new Border({
                color: new Color({r: 0, g: 0, b: 0, alpha: 1}),
                width: 2
            })
        });
    }

    /**
     * 
     * @param {Object} props parameters with attributes as specified in this class
     * @returns {LineStringSettings}
     */
    constructor (props) {
        super(props);
        this.featureType = FeatureType.LINESTRING;
        this.lineBorder1 = new Border((props && props.lineBorder1)??{});
        this.lineBorder2 = new Border((props && props.lineBorder2)??{});            
    }
    
    /**
     * 
     * @param {String} textValue text to be displayed (e.g. name of feature)
     * @returns {Array[ol.style.Style]} OpenLayers representation of this settings. Array contains one element or two elements (in case of dash pattern with different colors),; no elemnts if showFeature=false
     */
    toOLStyle(textValue) {
        if (!this.getShowFeature()) {
            return [];
        }  
        const ret = [];
        if (this.lineBorder1) {
            const line1 = super.toOLStyle(textValue);
            line1.setStroke(this.lineBorder1.toOLStyle());
            ret.push(line1);
        }
        if (this.lineBorder2) {
            const line2 = super.toOLStyle(textValue);
            line2.setStroke(this.lineBorder2.toOLStyle());
            ret.push(line2);
        }
        return ret;
    }
    
    /**
     * 
     * Merges this object with the specified masterLineStringSettings. All attributes with value != undefined are taken from the masterLineStringSettings. Only attributes specified in this object but not in the master object will be added to the returned LineStringSettings. Both, this object as well as the master object are not changed. Instead a new iunstance of LineStringSettings will be returned
     * 
     * @param {LineStringSettings} masterLineStringSettings
     * @returns {LineStringSettings}
     */
    merge(masterLineStringSettings) {
        const ret = new LineStringSettings(super.merge(masterLineStringSettings));
        ret.lineBorder1 = this.lineBorder1.merge(masterLineStringSettings.lineBorder1);
        ret.lineBorder2 = this.lineBorder2.merge(masterLineStringSettings.lineBorder2);
        return ret;
    }
}
export {LineStringSettings}


/**
 * Wraps settings for a Polygon feature by enhancing the base class FeatureSettings with the following attributes:
 *  - polygonBorder {Border}: border to be used for surrounding the symbol of the polygon feature
 *  - polygonFill {Color}: color used for filling the symbol of the polygon feature
 * 
 * @type PolygonSettings
 */
class PolygonSettings extends FeatureSettings {
    polygonBorder;
    polygonFill;
    
    /**
     * 
     * @returns {PolygonSettings} standard polygon settings (feature shown on map with text, standard text settings, black line with 1px width, light gray filling)
     */
    static getStandard () {
        return new PolygonSettings({
            levelType : FeatureSettings.LEVEL_STANDARD,
            levelName : 'Standard',
            levelValue : '',

            showFeature : true,
            showText : true,
            textSettings : TextSettings.getStandard(),
    
            polygonFill : new Color({r: 200, g: 200, b: 200, alpha: 1}),
            polygonBorder : new Border({
                color: new Color({r: 0, g: 0, b: 0, alpha: 1}),
                width: 1
            })
        });
    }
    
    /**
     * 
     * @param {Object} props parameters with attributes as specified in this class
     * @returns {LineStringSettings}
     */
    constructor (props) {
        super(props);
        this.featureType = FeatureType.POLYGON;
        this.polygonFill = (props && props.polygonFill)? new Color(props.polygonFill) : undefined;
        this.polygonBorder = new Border((props && props.polygonBorder)??{});            
    }
    
    /**
     * 
     * @param {String} textValue text to be displayed (e.g. name of feature)
     * @returns {Array[ol.style.Style]} OpenLayers representation of this settings. As only one style is possible for polygon features, the returned array will only contain one element or none, if showFeature=false
     */
    toOLStyle(textValue) {
        if (!this.showFeature) {
            return [];
        }
        const ret = super.toOLStyle(textValue);
        if (this.polygonBorder) {
            ret.setStroke(this.polygonBorder.toOLStyle());
        }
        if (this.polygonFill) {
            ret.setFill(new Fill({color: this.polygonFill.toOLStyle()}));
        }
        return ret;
    }    
    
    /**
     * 
     * Merges this object with the specified masterPolygonSettings. All attributes with value != undefined are taken from the masterPolygonSettings. Only attributes specified in this object but not in the master object will be added to the returned PolygonSettings. Both, this object as well as the master object are not changed. Instead a new iunstance of PolygonSettings will be returned
     * 
     * @param {PolygonSettings} masterPolygonSettings
     * @returns {PolygonSettings}
     */
    merge(masterPolygonSettings) {
        const ret = new PolygonSettings(super.merge(masterPolygonSettings));
        ret.polygonBorder = this.polygonBorder.merge(masterPolygonSettings.polygonBorder);
        return ret;
    }
}
export {PolygonSettings}