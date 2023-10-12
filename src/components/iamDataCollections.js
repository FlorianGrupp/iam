/*  This file provides core functionalities to import, export, store and access the core data elements used by the interactive map */

import {KML, GeoJSON} from 'ol/format';

import {IAMTranslatorFactory} from './iamBase'
import {getMinOfArray, getMaxOfArray, ExtendedFeature, FeatureType, FeatureProperty, FeatureAttribute, FeatureSettings, PointSettings, LineStringSettings, PolygonSettings} from './iamDataCoreElements'

/**
 * Wrapper class to store results of a process. Consists of a type (INFO, ERROR, WARN), a text and a list of details
 * 
 * @type ProcessResult
 */
class ProcessResult {
    static INFO = 1;
    static WARN = 2;
    static ERROR = 3;
    
    status;
    text;
    details;
    
    /**
     * 
     * @param {ProcessResult.INFO|ProcessResult.WARN|ProcessResult.ERROR} status
     * @param {String} text
     * @returns {ProcessResult} new ProcessResult with specified status and text and empty details
     */
    constructor (status, text) {
        this.status = status;
        this.text = text;
    }
    
    /**
     * adds the given detail and overwrites the overall status with the specified value (only if specified value is worse than existing status, e.g. INFO can become WARNING, but WARNING cannot become INFO
     * @param {type} status
     * @param {type} detail
     * @returns {undefined}
     */
    addDetail (status, detail) {
        if (status>this.status) {
            this.status = status;
            if (status === ProcessResult.WARN) {
                this.text = this.text + IAMTranslatorFactory.getMsg(' with warnings');
            }
        }
        if (this.details) {
            this.details.push(detail);
        }
        else {
            this.details = [detail];
        }    
    }
}
export {ProcessResult}


/**
 * Template class for a data source. A data source may contain feature data, feature properties data, feature attributes data, feature settings data and/or map settings data.  
 * @type type
 */
class DataSource {
    _features;
    _featuresProperties;
    _featuresAttributes;
    _featuresSettings;
    
    _mapSettings;
    
    _rawData;
    
    /**
     * 
     * @param {String} rawData the data in the initial format (e.g. KML, GeoJSON, csv or any other format)
     * @returns {DataSource}
     */
    constructor(rawData) {
        this._rawData = rawData;
        this._features = [];
        this._featuresProperties = [];
        this._featuresAttributes = [];
        this._featuresSettings = [];        
    }
    
    /**
     * returns an array that contains all features within this data source. The template class will not fill the returned array, this has to be done by the implementing class
     * @returns {Array[Feature]}
     */
    getFeatures() {
        return this._features;
    }
    
    /**
     * returns an array that contains all features properties within this data source. The template class will not fill the returned array, this has to be done by the implementing class
     * @returns {Array[FeatureProperty]}
     */
    getFeaturesProperties() {
        return this._featuresProperties;
    }
    
    /**
     * returns an array that contains all features attributes within this data source. The template class will not fill the returned array, this has to be done by the implementing class
     * @returns {Array[FeatureAttribute]}
     */
    getFeaturesAttributes() {
        return this._featuresAttributes;
    }
    
    /**
     * returns an array that contains all features settings within this data source. The template class will not fill the returned array, this has to be done by the implementing class
     * @returns {Array[FeatureSettings]}
     */
    getFeaturesSettings() {
        return this._featuresSettings;
    }
    
    /**
     * returns an object that contains all map settings within this data source. The template class will not fill the returned array, this has to be done by the implementing class
     * @returns {Object}
     */
    getMapSettings() {
        return this._mapSettings;
    }
    
    /**
     * returns the raw data of this data source
     * @returns {String}
     */
    getRawData() {
        return this._rawData;
    }
    
    /**
     * function to read feature, feature attribute and feature property data from an external format using an Open Layers feature reader implementation. Will call methods processProperties, processAttributes and processSettings for each feature or settings object. Those methods have to implemented by the sub-classes extending this class
     * @param {ol.Format.FeatureFormat} oLreader Open Layers implementation of a reader to transform 
     * @param {ProcessResult} processResult process result to store the result of the reading process
     * @returns {undefined}
     */
    _readFeatures (oLreader, processResult) {
        try {
            const olfeatures = oLreader.readFeatures(this.getRawData());

            let counter = 0;
            for (const olfeature of olfeatures) {
                counter++;
                const id = olfeature.get('id')?? (olfeature.get('name')?? 'iam_' + counter);

                if (id !== '_iam_Settings') {
                    const feature = new ExtendedFeature({
                        type: this._mapType(olfeature.getGeometry().getType()), 
                        id: id, 
                        coordinates: olfeature.getGeometry().getCoordinates()
                    });
                    this._features.push(feature);
                    this.processProperties(feature, olfeature, processResult);
                    this.processAttributes(feature, olfeature, processResult);
                }
                else {
                    this.processSettings(olfeature, processResult);                    
                }
            }
            processResult.addDetail(ProcessResult.INFO,counter + '' + IAMTranslatorFactory.getMsg(' features successfully read from data source.'));
        }
        catch (e) {
            processResult.text = IAMTranslatorFactory.getMsg('Data has no valid format. No features were loaded.');
            processResult.addDetail(ProcessResult.ERROR,e.message);
        }
    }
    
    /**
     * maps the Open Layers feature name to the internal FeatureType
     * @param {String} olType
     * @returns {FeatureType.POLYGON|FeatureType.LINESTRING|FeatureType.POINT}
     */
     _mapType (olType) {
        if (olType === 'Point') {
            return FeatureType.POINT;
        }
        if (olType === 'Polygon') {
            return FeatureType.POLYGON;
        }
        return FeatureType.LINESTRING;
    }
}

/**
 * This class transforms data in GeoJSON format into the internal format used by the interactive map. All Point, LineString and Polygon features are taken from the data as well as all properties and attributes assigned to the features. If a feature with id '_iam_Settings' exists, the feature settings and map settings are also read
 * 
 * @type GeoJSONFeaturesSource
 */
class GeoJSONFeaturesSource extends DataSource {
    
    /**
     * 
     * @param {String} rawData the data in GeoJSON format
     * @param {ProcessResult} processResult to which results are written to
     * @returns {GeoJSONFeaturesSource}
     */
    constructor (rawData, processResult) {
        super(rawData);
        this._readFeatures(new GeoJSON(),processResult);
    }
    
    /**
     * Extracts all properties from the GeoJSON feature and adds it to the internal list of properties
     * @param {Feature} feature internal representation of the feature, to which the properties are assigned
     * @param {ol.Feature} olFeature Open Layers representation of the feature
     * @param {ProcessResult} processResult to which results are written to
     * @returns {undefined}
     */
    processProperties(feature, olFeature, processResult){
        try {
            if (olFeature !== null) {
                const props = olFeature.getProperties();
                [...Object.keys(props)]
                        .forEach((key) => {
                            //no attributes (starting with '_iam'), only properties; GeoJSON property 'geometry' is also ignored
                            if (key !== 'geometry' && !key.startsWith('_iam')) {
                                if (key !== 'id') {
                                    this._featuresProperties.push(new FeatureProperty({
                                        featureType : feature.getType(),
                                        featureId: feature.getId(),
                                        propertyName: key,
                                        propertyValue: props[key]                               
                                    }));
                                }
                            }
                });
            }            
        }
        catch (e) {
            processResult.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: Unable to process properties of feature ') + feature.getId() + IAMTranslatorFactory.getMsg(' due to ') + e.message);
        }
    }
    
    /**
     * Extracts all attributes from the GeoJSON feature and adds it to the internal list of properties
     * @param {Feature} feature internal representation of the feature, to which the properties are assigned
     * @param {ol.Feature} olFeature Open Layers representation of the feature
     * @param {ProcessResult} processResult to which results are written to
     * @returns {undefined}
     */
    processAttributes(feature, olFeature, processResult){
        try {
            if (olFeature !== null) {
                const atts = olFeature.getProperties()['_iamAttributes'];
                if (atts) {
                    atts.forEach((att) => {
                        const attObj = new FeatureAttribute({
                                featureType : feature.getType(),
                                featureId: feature.getId(),
                                propertyName: att._propertyName,
                                propertyValue: att._propertyValue,                               
                                fromYear: att._fromYear,
                                fromMonth: att._fromMonth,
                                fromDay: att._fromDay,
                                toYear: att._toYear,
                                toMonth: att._toMonth,
                                toDay: att._toDay
                        });
                        this._featuresAttributes.push(attObj);
                    });
                }
            }            
        }
        catch (e) {
            processResult.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: Unable to process attributes of feature ') + feature.getId() + IAMTranslatorFactory.getMsg(' due to ') + e.message);
        }        
    }
    
    /**
     * Extracts all settings from the GeoJSON feature and adds it to the internal list of settings
     * @param {ol.Feature} olFeature Open Layers representation of the feature
     * @param {ProcessResult} processResult to which results are written to
     * @returns {undefined}
     */
    processSettings(olFeature, processResult){
        try {
            if (olFeature) {
               if (olFeature.getProperties()['_iam_FeatureSettings']) {
                   olFeature.getProperties()['_iam_FeatureSettings'].forEach((setting) => {
                       if (setting.featureType === FeatureType.POINT) {
                           this._featuresSettings.push(new PointSettings(setting));                       
                       }
                       else if (setting.featureType === FeatureType.LINESTRING) {
                           this._featuresSettings.push(new LineStringSettings(setting));                       
                       }
                       else if (setting.featureType === FeatureType.POLYGON) {
                           this._featuresSettings.push(new PolygonSettings(setting));                       
                       }
                   });
                }
                
                
                this._mapSettings = olFeature.getProperties()['_iam_MapSettings'];
            }            
        }
        catch (e) {
            processResult.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: Unable to load settings due to ') + e.message);
        }    
    }
}
export {GeoJSONFeaturesSource}


/**
 * This class transforms data in KML format into the internal format used by the interactive map. All Point, LineString and Polygon features are taken from the data as well as all properties assigned to the features (taken from the KML-description tag). Attributes and settings will not be read or processed!
 * 
 * @type KMLFeaturesSource
 */
class KMLFeaturesSource extends DataSource {
    
    /**
     * 
     * @param {String} rawData the data in KML format
     * @param {ProcessResult} processResult to which results are written to
     * @returns {KMLFeaturesSource}
     */
    constructor (rawData, processResult) {
        super(rawData);
        this._readFeatures(new KML(),processResult);
    }
    
    /**
     * Extracts all properties from the KML description tag of a feature (Placemark) and adds it to the internal list of properties. Properties have to be separated by semicolon, key and value have to be separated with '='
     * @param {Feature} feature internal representation of the feature, to which the properties are assigned
     * @param {ol.Feature} olFeature Open Layers representation of the feature
     * @param {ProcessResult} processResult to which results are written to
     * @returns {undefined}
     */
    processProperties(feature, olFeature, processResult){
        try {
            if (feature !== null) {
                    //get description from kml and store as properties
                   const desc = olFeature.get('description');
                   if (desc) {
                       const properties = desc.split(';');
                       for (const property of properties) {
                            const keyVal = property.split('=');
                            if (keyVal.length === 2) {
                                if (keyVal[0] === 'id') {
                                    feature._id = keyVal[1];
                                }
                                else {
                                    this._featuresProperties.push(new FeatureProperty({
                                        featureType : feature.getType(),
                                        featureId: feature.getId(),
                                        propertyName: keyVal[0],
                                        propertyValue: keyVal[1]                               
                                    }));                                    
                                }
                            }
                            else {
                                processResult.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: Invalid property structure KML description tag: ') + property);
                            }
                       }
                   }
            }            
        }
        catch (e) {
            processResult.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: Unable to process properties of feature ') + feature.getId + IAMTranslatorFactory.getMsg(' due to ') + e.message);
        }
    }
    
    /**
     * Attributes are not being processed!
     * @param {type} feature
     * @param {type} olFeature
     * @param {type} processResult
     * @returns {undefined}
     */
    processAttributes(feature, olFeature, processResult){
    }
    
    /**
     * Settings are not being processed!
     * @param {type} olFeature
     * @param {type} processResult
     * @returns {undefined}
     */
    processSettings(olFeature, processResult){
    }
}
export {KMLFeaturesSource}


/**
 * Checks, whether the header of the csv file (first row) complies with the given template
 * @param {Array[String]} header
 * @param {Array[String]} headerTemplate
 * @param {ProcessResult} processResult
 * @returns {undefined}
 */
function _checkHeader (header, headerTemplate, processResult) {
        if (headerTemplate) {
            if (header.length < headerTemplate.length) {
                throw new Error(IAMTranslatorFactory.getMsg('File must have at least ') + headerTemplate.length + IAMTranslatorFactory.getMsg(' columns in csv format'));
            }
            headerTemplate.forEach( (element,index) => {
                if (element !== header[index]) {
                    processResult.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: colum ') + index + IAMTranslatorFactory.getMsg(' should be named ') + element + IAMTranslatorFactory.getMsg('. Instead found ') + header[index]);
                }                
            });
        }
};

/**
 * Parses the given raw data assuming a csv-format
 * 
 * @param {String} rawData the data to be parsed
 * @param {Object} opts options with attributes delimiter (delimiter used in csv-format; if not specified, either ',' or ';' is used based on the occurence in the raw data), headers (boolean indicating whether csv columns have a header) and headers (Array[String] containing the expected column names)
 * @param {ProcessResult} processResult
 * @param {Function} checkContent optional check function which will be called on each parsed item
 * @returns {Array} if no headers in options, a two-dimensional array with the parse items is returned. If headers and headerTemplate specified in options, one dimensional array where each row is represented by an object with keys taken from the headerTemplate
 */
function _parseCsv(rawData, opts = {}, processResult, checkContent) {
        try {
            //check delimiter
            if (!opts.delimiter) {
                opts.delimiter = ',';
                if (rawData.indexOf(';') !== -1 ) {
                   opts.delimiter = ';';
                }   
            }
            //from https://gist.github.com/atomkirk/eccb66f77b306d0d1fcecb2c605bd22e
            let arr = [];
            let quote = false;  // true means we're inside a quoted field
            let col, c;

            // iterate over each character, keep track of current row and column (of the returned array)
            for (var row = col = c = 0; c < rawData.length; c++) {
                var cc = rawData[c], nc = rawData[c+1];        // current character, next character
                arr[row] = arr[row] || [];             // create a new row if necessary
                arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary

                // If the current character is a quotation mark, and we're inside a
                // quoted field, and the next character is also a quotation mark,
                // add a quotation mark to the current column and skip the next character
                if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }

                // If it's just one quotation mark, begin/end quoted field
                if (cc === '"') { quote = !quote; continue; }

                // If it's a comma and we're not in a quoted field, move on to the next column
                if (cc === opts.delimiter && !quote) { ++col; continue; }

                // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
                // and move on to the next row and move to column 0 of that new row
                if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }

                // If it's a newline (LF or CR) and we're not in a quoted field,
                // move on to the next row and move to column 0 of that new row
                if (cc === '\n' && !quote) { ++row; col = 0; continue; }
                if (cc === '\r' && !quote) { ++row; col = 0; continue; }

                // Otherwise, append the current character to the current column
                arr[row][col] += cc;
            }

            if (opts.headers) {
                let header = arr[0];
                //first check whether header is valid
                _checkHeader(header,opts.headerTemplate, processResult);
                let rest = arr.slice(1);
                const ret = rest.map(r => {
                  return r.reduce((acc, v, i) => {
                    let key = header[i];
                    if (v !== '') {
                        //check specific content requirements
                        if (checkContent && checkContent(key,v,processResult)) {
                            acc[key] = v;
                        } 
                    }
                    return acc;
                  }, {});
                });
                return ret;
            }
            else {
                return arr;
            }
        }
        catch (e) {
            processResult.text = IAMTranslatorFactory.getMsg('File has no valid format. No data was loaded.');
            processResult.addDetail(ProcessResult.WARN,e.message);
            return null;            
        }
}  

/**
 * This class transforms attributes in csv format into the internal format used by the interactive map. The csv-file must have 10 columns named 'feature','featureId','propertyName','propertyValue','fromYear','fromMonth','fromDay','toYear','toMonth','toDay'
 * 
 * @type FeatureAttributesCSVDataSource
 */
class FeatureAttributesCSVDataSource extends DataSource {
    
    /**
     * @param {String} rawData the data in csv format
     * @param {ProcessResult} processResult to which results are written to
     * @returns {FeatureAttributesCSVDataSource}
     */
    constructor (rawData, processResult) {
        super(rawData);
        this._loadFeatureAttributes(processResult);
    }
    
    /**
     * Parses the csv data, checks the content and writes the successfully parsed attributes into the internal array. Warning messages are written to the specified ProcessResult
     * @param {ProcessResult} processResult
     * @returns {undefined}
     */
    _loadFeatureAttributes (processResult) {
        const checkContent = (key, value, msg) => {
            if (key === 'feature') {
                if (value !== 'Point' && value !== 'LineString' && value !== 'Polygon') {
                    msg.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: value of column \'feature\' should be either \'Point\', \'LineString\' or \'Polygon\'. Instead found \'') + value + IAMTranslatorFactory.getMsg('\'. Row will be ignored!'));
                    return false;
                }
            }
            else if (key === 'fromYear') {
                if (isNaN(parseInt(value))) {
                    msg.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: value of column \'fromYear\' has to be a valid integer number. Instead found \'') + value + IAMTranslatorFactory.getMsg('\'. Value will be ignored!'));
                    return false;                    
                }
            }
            else if (key === 'toYear') {
                if (isNaN(parseInt(value))) {
                    msg.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: value of column \'toYear\' has to be a valid integer number. Instead found \'') + value + IAMTranslatorFactory.getMsg('\'. Value will be ignored!'));
                    return false;                    
                }
            }
            return true;
        };
        const parseResult = _parseCsv(
            this.getRawData(),
            { 
                headers: true, 
                headerTemplate: ['feature','featureId','propertyName','propertyValue','fromYear','fromMonth','fromDay','toYear','toMonth','toDay']
            }, 
            processResult,
            checkContent
        );
        parseResult.forEach((attribute) => {
            Object.assign(attribute,{
                featureType: 
                        (attribute.feature === 'Point')? FeatureType.POINT : (attribute.feature === 'LineString')? FeatureType.LINESTRING : FeatureType.POLYGON
            });          
            this._featuresAttributes.push(new FeatureAttribute(attribute));
        });
    }
} 
export {FeatureAttributesCSVDataSource}


/**
 * This class transforms properties in csv format into the internal format used by the interactive map. The csv-file must have at least 4 columns named 'feature','featureId','propertyName1','propertyValue1'. Additional column pairs ''propertyName[n]','propertyValue[n]' are possible
 * 
 * @type FeaturePropertiesCSVDataSource
 */
class FeaturePropertiesCSVDataSource extends DataSource {
    
    /**
     * @param {String} rawData the data in csv format
     * @param {ProcessResult} processResult to which results are written to
     * @returns {FeaturePropertiesCSVDataSource}
     */
    constructor (rawData, processResult) {
        super(rawData);
        this._loadFeatureProperties(processResult);
    }
    
    /**
     * Parses the csv data, checks the content and writes the successfully parsed properties into the internal array. Warning messages are written to the specified ProcessResult
     * @param {ProcessResult} processResult
     * @returns {undefined}
     */
    _loadFeatureProperties (processResult) {
        const checkContent = (key, value, msg) => {
            if (key === 'feature') {
                if (value !== 'Point' && value !== 'LineString' && value !== 'Polygon') {
                    msg.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: value of column \'feature\' should be either \'Point\', \'LineString\' or \'Polygon\'. Instead found \'') + value + IAMTranslatorFactory.getMsg('\'. Row will be ignored!'));
                    return false;
                }
            }
            return true;
        };
        const parseResult = _parseCsv(
            this.getRawData(),
            {
                headers: true, 
                headerTemplate: ['feature','featureId','propertyName1','propertyValue1']
            }, 
            processResult,
            checkContent
        );
        parseResult.forEach((property) => {
            for (let i=1;i<10;i++) {
                const prop = {
                    featureType: (property.feature === 'Point')? FeatureType.POINT : (property.feature === 'LineString')? FeatureType.LINESTRING : FeatureType.POLYGON,
                    featureId: property.featureId
                };
                if (property['propertyName' + i] && property['propertyValue' + i]) {
                    prop.propertyName = property['propertyName' + i];
                    prop.propertyValue = property['propertyValue' + i];
                    this._featuresProperties.push(new FeatureProperty(prop));
                }
                else {
                    i = 10;
                }
            }
        });
    }    
}
export {FeaturePropertiesCSVDataSource}

/**
 * This class parses settings from JSON formatted rawData into the internal format used by the interactive map. The following data is taken from the JSON format: _iam_FeatureSettings (containg the object notation of the features settings) and _iam_MapSettings (containg the object notation of the map settings)
 * @type typ
 */
class FeatureSettingsJSONDataSource extends DataSource {

    /**
     * @param {String} rawData the data in csv format
     * @param {ProcessResult} processResult to which results are written to
     * @returns {FeaturePropertiesCSVDataSource}
     */
    constructor (rawData, processResult) {
        super(rawData);
        this._loadFeatureSettings(processResult);
    }
    
    /**
     * Parses the csv data and writes the successfully parsed settings into the internal representation. Warning messages are written to the specified ProcessResult
     * @param {ProcessResult} processResult
     * @returns {undefined}
     */
    _loadFeatureSettings (processResult) {
        const parseResult = JSON.parse(this.getRawData());
        if (parseResult._iam_FeatureSettings) {
            let counter =0;
            parseResult._iam_FeatureSettings.forEach((setting) => {
                if (setting.featureType === FeatureType.POINT) {
                    this._featuresSettings.push(new PointSettings(setting));       
                }
                else if (setting.featureType === FeatureType.LINESTRING) {
                    this._featuresSettings.push(new LineStringSettings(setting));       
                }
                else if (setting.featureType === FeatureType.POLYGON) {
                    this._featuresSettings.push(new PolygonSettings(setting));       
                }
                counter ++;
            });
            processResult.addDetail(ProcessResult.INFO,counter + ' Settings loaded successfully');
        }
        if (parseResult._iam_MapSettings) {
            this._mapSettings = parseResult._iam_MapSettings;
            processResult.addDetail(ProcessResult.INFO,'Map Settings loaded successfully');
        }
    }
}
export {FeatureSettingsJSONDataSource} 


/**
 * Simple file loader to load the content of a file into a simple String
 * @type type
 */
class FileLoader {
    _file;
    _fileContent;

    /**
     * Only sets the file (either a File object or the URL of the file as a String). No loading is happening at this point of time
     * @param {File|String} file
     * @returns {FileLoader}
     */
    constructor(file) {
        this._file = file;
    }
    
    /**
     * async method to load the content of the file
     * @returns {undefined}
     */
    async init() {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            if (this._file instanceof File) {
                this._fileContent = await this._file.text();     
            }
            else {
                let response = await fetch (this._file);
                this._fileContent = await response.text().then(( str ) => {
                    return str;    
                });
            }
        }
	else {
	  alert('The File APIs are not fully supported in this browser. Please use another browser that supports File APIs under HTML5 to use this functionality');
	} 
    }
    
    /**
     * 
     * @returns {String} loaded file content
     */
    loadData () {
        return this._fileContent;
    }
}
export {FileLoader}

/**
 * Simple implementation of a database like object table with an recursive Map approach for performant data access. A list of primary keys can be defined, each primary key should correspond to a key in the object to be stored. The object itsself is kept at the lowest level
 * 
 * @type IAMMapTable 
 */
class IAMMapTable {
    _primaryKeys;
    _mapTable;
    
    /**
     * 
     * @param {Array[String]} primaryKeys names of the object keys 
     * @returns {IAMMapTable}
     */
    constructor (primaryKeys) {
        this._primaryKeys = primaryKeys;
        this._mapTable = new Map();
    }
    
    /**
     * Adds the specified item to the table
     * @param {Object} item item to be stored. Already stored items will be compared with this item using the equals function. If the function exitss and returns true, the existing item will be overwritten  
     * @returns {undefined}
     */
    addItem (item) {
        this._addItem(item, this._mapTable,0);
    }
    
    /**
     * Internal recursive function to add the item. Climbs down the tree. If there is yet no map or key existing, it will be added accordingly and the method will be re-called
     * @param {Object} item
     * @param {Map} map Map at current level
     * @param {Number} index current level
     * @returns {undefined}
     */
    _addItem (item, map, index) {
        const found = map.get(item[this._primaryKeys[index]]);
        if (index === (this._primaryKeys.length -1)) {
            if (found) {
                let overwritten = false;
                found.forEach((storedItem,index,array) => {
                   if (storedItem.equals && storedItem.equals(item)) {
                       array[index] = item;
                       overwritten = true;
                   } 
                });
                if (!overwritten) {
                    found.push(item);
                }
            }
            else {
                map.set(item[this._primaryKeys[index]],[item]);
            }
        }
        else {
            if (found) {
                this._addItem(item, found, index+1);
            }
            else {              
                map.set(item[this._primaryKeys[index]],new Map());
                this._addItem (item, map, index);
            }
        }
    }
    
    /**
     * gets the item which has its primaryKeys set to the specified values 
     * @param {Array[String]} values
     * @returns {Object} the item which primaryKeys match the specified values. If no matching item is found, undefined is returned. If several matching items are found, the item first entered into the table is returned
     */
    getItem (values) {
        return this._getItem(values, this._mapTable, 0);
    }
    
    /**
     * Internal recursive function to get the item with its primary keys set to the specified values
     * @param {Array[String]} values
     * @param {Map} map Map at current level
     * @param {Number} index current level
     * @returns {Object}
     */
    _getItem (values, map, index) {
        const found = map.get(values[index]);
        if (!found) {
            return undefined;
        }
        else if (index === (values.length -1)) {         
            if (found.length > 0) {        
                return found[0];
            }
            else {
                return found;
            }
        }
        else {
            return this._getItem (values, found, index+1);
        }
    }

    /**
     * returns all keys, that match the primary keys specified in the values parameter
     * @param {Array[String]} values if an empty array is specified, the keys on the top level (e.g. values of first primary key) are returned
     * @returns {Array[String]}
     */
    getKeys (values) {
        return this._getKeys (values, this._mapTable,0);
    }
    
    /**
     * Internal recursive function to get the keys with its primary keys set to the specified values
     * @param {Array[String]} values
     * @param {Map} map Map at current level
     * @param {Number} index current level
     * @returns {Object}
     */
    _getKeys (values, map, index) {
        if (index === values.length) {
            return [...map.keys()];
        }
        const found = map.get(values[index]);
        if (!found) {
            return [];
        }
        else {
            return this._getKeys (values, found, index+1 );
        }
    }
    
    /**
     * returns all items, whose primary keys adhere to the filter functions specified in the parameter
     * @param {Array[Function]} filters filter function for each primary key (function should return true or false). If no filter function is specified for a primary key, all values of the primary key at this level are taken into account
     * @returns {Array[Object]}
     */
    getAllItems (filters) {
        if (filters.length !== this._primaryKeys.length) {
            return [];
        }
        const ret = [];
        this._getAllItems (filters, this._mapTable,0,ret);
        return ret.flat(Infinity);
    }
    
    /**
     * internal recursive function to get all items, whose primary keys adhere to the filter functions specified in the parameter
     * @param {Array[Function]} filters
     * @param {Map} map current Map
     * @param {Number} index current level
     * @param {Array} ret array, in which all matching items should be stored
     * @returns {undefined}
     */
    _getAllItems (filters,map, index, ret) {
        const keys = filters[index]? [...map.keys()].filter(filters[index]) : [...map.keys()];
        if (index === (filters.length-1)) {
            keys.forEach((key) => {
                ret.push(map.get(key));
            });   
        }
        else {
            keys.forEach((key) => {
                this._getAllItems (filters, map.get(key), index+1, ret);
            });               
        }
    }
    
    /**
     * returns all keys, whose primary keys adhere to the filter functions specified in the parameter
     * @param {Array[Function]} filters filter function for each primary key (function should return true or false). If no filter function is specified for a primary key, all values of the primary key at this level are taken into account
     * @returns {Array[Object]}
     */
    getAllKeys (filters) {
        const ret = new Map();
        this._getAllKeys (filters, this._mapTable,0,ret);
        return [...ret.keys()];        
    }
    
    /**
     * internal recursive function to get all keys, whose primary keys adhere to the filter functions specified in the parameter
     * @param {Array[Function]} filters
     * @param {Map} map current Map
     * @param {Number} index current level
     * @param {Array} ret array, in which all matching items should be stored
     * @returns {undefined}
     */
    _getAllKeys (filters,map, index, ret) {
        const keys = filters[index]? [...map.keys()].filter(filters[index]) : [...map.keys()];
        if (index === (filters.length-1)) {
            keys.forEach((key) => {ret.set(key,key);});
        }
        else {
            keys.forEach((key) => {
                this._getAllKeys (filters, map.get(key), index+1, ret);
            });               
        }
    }
    
    /**
     * Basically a SQL group by statement like select [groupBy] [aggFunc] from table where [filters]
     * 
     * @param {Array[function]} filters
     * @param {Array[String]} groupBy
     * @param {Function} aggFunc gets an array with all matching items and has to return a value (e.g. sum, min, length, count function etc )
     * @returns {IAMMapTable}
     */
    getAllItemsGroupBy (filters, groupBy, aggFunc) {
        const resultSet = new IAMMapTable(groupBy);
        this.getAllItems(filters).forEach((item) => {
            resultSet.addItem(item);
        });
        resultSet._map(aggFunc);
        return resultSet;
    }
    
    _map (mapFunc) {
        this._mapRec (mapFunc, this._mapTable, 0);
    }
    
    _mapRec(mapFunc, map, index) {
        if (index === (this._primaryKeys.length -1)) {
            [...map.keys()].forEach((key) => {
                const newItem = mapFunc(map.get(key));
                map.set(key, newItem);
            });            
        }
        else {
            [...map.keys()].forEach((key) => {
                this._mapRec(mapFunc, map.get(key), index+1);
            });
        }
    }
}

/**
 * Factory class to receive the data storage which contains all necessary feature and settings data
 * @type type
 */
class IAMData {
    static _db;
    static OVERWRITE = 1;
    static DROPTABLE = 2;

    /**
     * get the currenmt data storage which contains all necessary feature and settings data
     * @returns {IAMStorage}
     */
    static getDatabase() {
        if (!this._db) {
            this._db = new IAMStorage();
        }
        return this._db;
    }
}
export {IAMData}

/**
 * Basic class to store and access all relevant data (features, properties, attributes, settings)
 * 
 * @type IAMStorage
 */
class IAMStorage {    
    _features;
    _featureAttributes;
    _featureProperties;
    _featureSettings;
    
    static _featuresTableDef = ['featureType','_id'];
    static _featureAttributesTableDef = ['featureType','_featureId','_propertyName','_propertyValue'];
    static _featurePropertiesTableDef = ['featureType','_featureId','_propertyName'];
    static _featureSettingsTableDef = ['featureType','levelType','levelName','levelValue']
    
    /**
     * Inits the data storage, e.g. creates the tables and fills the settings table with standard settings
     * @returns {IAMStorage}
     */
    constructor () {
        this._init ();
    }
    
    _init () {
        //create all necessary tables
        this._features = new IAMMapTable(IAMStorage._featuresTableDef);
        this._featureAttributes = new IAMMapTable(IAMStorage._featureAttributesTableDef);
        this._featureProperties = new IAMMapTable(IAMStorage._featurePropertiesTableDef);
        this._featureSettings = new IAMMapTable(IAMStorage._featureSettingsTableDef);
        //add standard settings to settings table
        this._initStandardSettings ();
    }
    
    _initStandardSettings () {
        //add standard settings for Point, LineString and Polygon to settings table
        this._featureSettings.addItem(PointSettings.getStandard());
        this._featureSettings.addItem(LineStringSettings.getStandard());
        this._featureSettings.addItem(PolygonSettings.getStandard());         
    }
    
    /**
     * adds the specified feature setting to the according table
     * @param {FeatureSettings} featuresSettings
     * @returns {undefined}
     */
    addSetting(featuresSettings) {
        this._featureSettings.addItem(featuresSettings); 
    }
    
    
    /**
     * Loads features from the datasource and inserts them into the database
     * 
     * @param {DataSource} datasource
     * @param {IAMData.OVERWRITE|IAMData.DROPTABLE} insertType
     * @param {ProcessResult} processResult
     * @returns {undefined}
     */
    loadFeatures (datasource, insertType = IAMData.OVERWRITE, processResult = new ProcessResult(ProcessResult.INFO,IAMTranslatorFactory.getMsg('Features loaded successfully!'))) {
        //create new table instances in case of DROPTABLE
        if (insertType === IAMData.DROPTABLE) {
            this._init ();
        }
        //take features from datasource and insert them into the according table
        try {
            let counter = 0;
            datasource.getFeatures().forEach((feature) => {
                this._features.addItem(feature);
                counter++;
            });
            processResult.addDetail(ProcessResult.INFO, counter + IAMTranslatorFactory.getMsg(' features successfully loaded into database.')); 
        }
        catch (e) {
            processResult.text = IAMTranslatorFactory.getMsg('Error during upload of Features data into database.');
            processResult.addDetail(ProcessResult.ERROR,e.message);            
        }
    }
    
    /**
     * Loads feature properties from the datasource and inserts them into the database
     * 
     * @param {DataSource} datasource
     * @param {IAMData.OVERWRITE|IAMData.DROPTABLE} insertType
     * @param {ProcessResult} processResult
     * @returns {undefined}
     */
    loadFeaturesProperties (datasource, insertType = IAMData.OVERWRITE, processResult = new ProcessResult(ProcessResult.INFO,IAMTranslatorFactory.getMsg('Features Properties loaded successfully!'))) {
        //create new table instance in case of DROPTABLE
        if (insertType === IAMData.DROPTABLE) {
            this._featureProperties = new IAMMapTable(IAMStorage._featurePropertiesTableDef);
            //delete all properties from all features to ensure consistency
            this.getAllFeatures().forEach( (extFeature) => {
                extFeature.clearProperties();
            });
        }
        //take properties from datasource and insert them into the according table
        try {
            let counter = 0;
            datasource.getFeaturesProperties().forEach((featuresProperty) => {
                //check whether feature assigned to property exists in database
                const foundFeatures = this.getFeature(featuresProperty.getFeatureType(),featuresProperty.getFeatureId());
                if (!foundFeatures) {
                    processResult.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: Property not added as no feature found for featureId/featureType ') + featuresProperty.getFeatureId() + '/' + featuresProperty.getFeatureType()); 
                }
                else {
                    this._featureProperties.addItem(featuresProperty);
                    foundFeatures.addProperty(featuresProperty.getName(),featuresProperty.getValue());
                    counter++;                    
                }
            });
            processResult.addDetail(ProcessResult.INFO, counter + IAMTranslatorFactory.getMsg(' feature properties successfully loaded into database.'));
        }
        catch (e) {
            processResult.text = IAMTranslatorFactory.getMsg('Error during upload of Features Properties data into database.');
            processResult.addDetail(ProcessResult.ERROR,e.message);            
        }
    }
    
    /**
     * Loads feature attributes from the datasource and inserts them into the database
     * 
     * @param {DataSource} datasource
     * @param {IAMData.OVERWRITE|IAMData.DROPTABLE} insertType
     * @param {ProcessResult} processResult
     * @returns {undefined}
     */
    loadFeaturesAttributes (datasource, insertType = IAMData.OVERWRITE, processResult = new ProcessResult(ProcessResult.INFO,IAMTranslatorFactory.getMsg('Features Attributes loaded successfully!'))) {
        //create new table instance in case of DROPTABLE
        if (insertType === IAMData.DROPTABLE) {
            //delete all attributes from all features to ensure consistency
        this._featureAttributes = new IAMMapTable(IAMStorage._featureAttributesTableDef);
            this.getAllFeatures().forEach( (extFeature) => {
                extFeature.clearAttributes();
            });
        }
        //take attributes from datasource and insert them into the according table
        try {
            let counter = 0;
            datasource.getFeaturesAttributes().forEach((featuresAttribute) => {
                //check whether feature assigned to property exists in database
                const foundFeatures = this.getFeature(featuresAttribute.getFeatureType(),featuresAttribute.getFeatureId());
                if (!foundFeatures) {
                    processResult.addDetail(ProcessResult.WARN,IAMTranslatorFactory.getMsg('WARNING: Attribute not added as no feature found for featureId/featureType ') + featuresAttribute.getFeatureId() + '/' + featuresAttribute.getFeatureType()); 
                }
                else {
                    this._featureAttributes.addItem(featuresAttribute);                   
                    foundFeatures.addAttribute(featuresAttribute);
                    counter++;                    
                }
            });
            processResult.addDetail(ProcessResult.INFO, counter + IAMTranslatorFactory.getMsg(' feature attributes successfully loaded into database.'));
        }
        catch (e) {
            processResult.text = IAMTranslatorFactory.getMsg('Error during upload of Features Attributes data into database.');
            processResult.addDetail(ProcessResult.ERROR,e.message);            
        }
    }
    
    /**
     * Loads feature settings from the datasource and inserts them into the database
     * 
     * @param {DataSource} datasource
     * @param {IAMData.OVERWRITE|IAMData.DROPTABLE} insertType
     * @param {ProcessResult} processResult
     * @returns {undefined}
     */
    loadSettings (datasource, insertType = IAMData.OVERWRITE, processResult = new ProcessResult(ProcessResult.INFO,IAMTranslatorFactory.getMsg('Settings loaded successfully!'))) {
        if (insertType === IAMData.DROPTABLE) {
            this._featureSettings = new IAMMapTable(IAMStorage._featureSettingsTableDef);
            this._initStandardSettings();
        }
        try {
            let counter = 0;
            datasource.getFeaturesSettings().forEach((featuresSettings) => {
                this._featureSettings.addItem(featuresSettings);
                counter++;
            });
            processResult.addDetail(ProcessResult.INFO, counter + IAMTranslatorFactory.getMsg(' settings successfully loaded into database.')); 
        }
        catch (e) {
            processResult.text = IAMTranslatorFactory.getMsg('Error during upload of settings data into database.');
            processResult.addDetail(ProcessResult.ERROR,e.message);            
        } 
    }
    
    /**
     * returns the feature with the given type and id or undefined, if no matching feature was found
     * 
     * @param {FeatureType.POINT|FeatureType.LINESTRING|FeatureType.POLYGON} featureType
     * @param {String} featureId
     * @returns {Feature}
     */
    getFeature (featureType, featureId) {
        return this._features.getItem([parseInt(featureType), featureId]);
    }
    
    /**
     * returns all features irrespective of type
     * 
     * @returns {Array[Feature]}
     */
    getAllFeatures() {
        return this._features.getAllItems([undefined, undefined]);
    }
    
    /**
     * returns all features with the given type
     * 
     * @param {FeatureType.POINT|FeatureType.LINESTRING|FeatureType.POLYGON} featureType
     * @returns {Array[Feature]}
     */
    getAllFeaturesWithType(featureType) {
        return this._features.getAllItems([(x) => parseInt(x) === parseInt(featureType), undefined]);
    }
    
    /**
     * returns all property names (keys) from features with the given type
     * 
     * @param {FeatureType.POINT|FeatureType.LINESTRING|FeatureType.POLYGON} featureType
     * @returns {Array[String]}
     */
    getAllPropertyNames(featureType) {
        return this._featureProperties.getAllKeys([(x) => parseInt(x) === parseInt(featureType), undefined, undefined]);
    }
    
    /**
     * returns all attribute names (keys) from features with the given type
     * 
     * @param {FeatureType.POINT|FeatureType.LINESTRING|FeatureType.POLYGON} featureType
     * @returns {Array[String]}
     */
    getAllAttributeNames(featureType) {
        return this._featureAttributes.getAllKeys([(x) => parseInt(x) === parseInt(featureType), undefined, undefined]);
    }

    /**
     * returns all attribute values for attributes with the given name assigned to a feature with the given feature type
     * 
     * @param {FeatureType.POINT|FeatureType.LINESTRING|FeatureType.POLYGON} featureType
     * @param {String} attributeName
     * @returns {Array[String]}
     */
    getAllAttributeValues(featureType, attributeName) {
        return this._featureAttributes.getAllKeys([(x) => parseInt(x) === parseInt(featureType), undefined, (x) => x === attributeName, undefined]);
    }

    /**
     * returns all feature attributes with given name and value assigned to a feature with the given feature type and optionally within the given timeframe
     * 
     * @param {FeatureType.POINT|FeatureType.LINESTRING|FeatureType.POLYGON} featureType
     * @param {String} attributeName
     * @param {String} attributeValue
     * @param {Number} yearFrom
     * @param {Number} yearTo
     * @returns {Array[{FeaturesAttributes: {FeatureAttribute},Features: {Feature}]}
     */
    getAllFeaturesWithAttributes (featureType, attributeName, attributeValue, yearFrom, yearTo) {
        const startYear = isNaN(parseInt(yearFrom))? parseInt(this.getAttributesMinimumYear()) : parseInt(yearFrom);
        const endYear = isNaN(parseInt(yearTo))? parseInt(this.getAttributesMaximumYear()) : parseInt(yearTo);
        const attributes = this._featureAttributes
            .getAllItems([
                (x) => parseInt(x) === parseInt(featureType), 
                undefined, 
                (x) => x === attributeName, 
                (x) => x === attributeValue])
            .filter((att) => {
                return (att._fromYear >= startYear && att._fromYear <= endYear);})
            .map((att) => {
                return {FeaturesAttributes: att, Features: this.getFeature(att.getFeatureType(),att.getFeatureId())};
            })
        ;
        return attributes;
    }
    
    /**
     * returns all feature settings
     * 
     * @returns {Array[FeatureSettings]}
     */
    getAllSettings () {
        return this._featureSettings.getAllItems([undefined,undefined,undefined,undefined]);        
    }
    
    /**
     * returns the standard settings for the given feature type (or undefined, if no standard settings exist
     * 
     * @param {FeatureType.POINT|FeatureType.LINESTRING|FeatureType.POLYGON} featureType
     * @returns {FeatureSettings}
     */
    getStandardSettings (featureType) {
        const ret =  this._featureSettings.getAllItems([(x) => parseInt(x) === parseInt(featureType),(x) => parseInt(x) === FeatureSettings.LEVEL_STANDARD,undefined,undefined]);        
        if (ret.length>0) {
            return ret[0];
        }
    }    
    
    /**
     * returns the settings for the given parameters (or undefined, if noch such settings is found
     * 
     * @param {FeatureType.POINT|FeatureType.LINESTRING|FeatureType.POLYGON} featureType
     * @param {FeatureSettings.LEVEL_STANDARD|FeatureSettings.LEVEL_ATTRIBUTE|FeatureSettings.LEVEL_FEATURE} levelType
     * @param {String} levelName
     * @param {String} levelValue
     * @returns {Array[FeatureSettings]}
     */
    getSettings (featureType,levelType,levelName,levelValue) {
        return this._featureSettings.getAllItems([
            (x) => parseInt(x) === parseInt(featureType),
            (x) => parseInt(x) === parseInt(levelType),
            (x) => levelName? x === levelName : true,
            (x) => levelValue? x === levelValue : true
        ]);   
    }    
    
    /**
     * returns the settings for the feature of given id and type. It first takes the standard settings for the given feature type, overwrites them with the settings of the attributes assigned to the feature (optionally narrowed down to the specified timeframe) and finally overwrites them with the individual feature settings (if they exist).
     * Non-undefined values are not overwritten with undefined values. 
     * 
     * @param {FeatureType.POINT|FeatureType.LINESTRING|FeatureType.POLYGON} featureType
     * @param {String} featureId
     * @param {Number} yearFrom
     * @param {Number} yearTo
     * @returns {FeatureSettings}
     */
    getSettingsOfFeature(featureType, featureId, yearFrom, yearTo) {
        //first get standard settings
        let ret = this.getStandardSettings (featureType);
        
        //merge with attribute settings
        const feature = this.getFeature(featureType, featureId);
        if (feature) {
            const atts = 
                feature.getAttributes((attribute) => {
                    if (
                        (attribute.getFromYear() && parseInt(attribute.getFromYear()) > yearTo) ||
                        (attribute.getToYear() && parseInt(attribute.getToYear()) < yearFrom)
                        ){
                        return false;
                    }
                    return true;
                })
                .sort((x,y) => parseInt(x._fromYear) - parseInt(y._fromYear));        
            atts.forEach( (attribute) => {
                const attributeSettings = this.getSettings(featureType,FeatureSettings.LEVEL_ATTRIBUTE, attribute.getName(), attribute.getValue());
                if (attributeSettings && attributeSettings.length > 0) {
                    ret = ret.merge(attributeSettings[0]);
                    //hasChanged in given timeframe?
                    if (attribute.getFromYear() >= yearFrom && attribute.getFromYear() <= yearTo) {
                        const hasChangedSettings = this.getSettings(featureType,FeatureSettings.LEVEL_ATTRIBUTE, attribute.getName(), '_iam_hasChanged');
                        if (hasChangedSettings && hasChangedSettings.length > 0) {
                            ret = ret.merge(hasChangedSettings[0]);
                        }
                    }
                }
            });
        }
        
        //merge with individual feature settings
        const featureSettings = this.getSettings(featureType,FeatureSettings.LEVEL_FEATURE,featureId);
        if (featureSettings && featureSettings.length > 0) {
            ret = ret.merge(featureSettings[0]);
        }
        
        return ret;
    }

    /**
     * returns an aggreagted view for the specified attributes which can be used to display a chart
     * 
     * @param {FeatureType.POINT|FeatureType.LINESTRING|FeatureType.POLYGON} featureType
     * @param {String} attributeName
     * @param {String} attributeValues
     * @param {Number} yearFrom
     * @param {Number} yearTo
     * @param {'sum'|'count'} aggType
     * @param {'point in time'|'time interval'} course
     * @returns {Boolean}
     */
    getAttributeAggregationPerYear (featureType, attributeName, attributeValues, yearFrom, yearTo, aggType, course) {
        const sum = (array) => {
                    let sum =0;
                    array.forEach((att) => {
                        sum +=this.getFeature(att.getFeatureType(),att.getFeatureId()).getLength();

                    });
                    return sum;
        };
        
        const count = (array) => array.length;

        const fromYears = this._featureAttributes
            .getAllItemsGroupBy (
                [
                        (x) => x === featureType, 
                        undefined, 
                        (x) => x === attributeName,
                        (x) => attributeValues.find((y) => y === x ) !== undefined
                ],
                ['_fromYear','_propertyValue'],
                (aggType === 'sum')? sum : count
            );

        if (course === 'point in time') {
            return this._expand(fromYears, attributeValues, yearFrom, yearTo);
        }    
        const toYears = this._featureAttributes
            .getAllItemsGroupBy (
                [
                        (x) => x === featureType, 
                        undefined, 
                        (x) => x === attributeName,
                        (x) => attributeValues.find((y) => y === x ) !== undefined
                ],
                ['_toYear','_propertyValue'],
                (aggType === 'sum')? sum : count
        );
        const startYearFrom = yearFrom?? Math.min(...([...fromYears.getAllKeys([undefined])]).filter((x) => x !== undefined));
        const endYearFrom   = yearTo??   Math.max(...([...fromYears.getAllKeys([undefined])]).filter((x) => x !== undefined));
        const startYearTo = yearFrom?? Math.min(...([...toYears.getAllKeys([undefined])]).filter((x) => x !== undefined));
        const endYearTo   = yearTo??   Math.max(...([...toYears.getAllKeys([undefined])]).filter((x) => x !== undefined));
        const startYear = Math.min(startYearFrom,startYearTo);
        const endYear = Math.max(endYearFrom, endYearTo);
        return this._substract(
                this._expand(fromYears, attributeValues, startYear, endYear), 
                this._expand(toYears, attributeValues, startYear, endYear), 
                attributeValues
        );
    };
    
    _expand (resultSet, attributeValues, yearFrom, yearTo) {
        const startYear = yearFrom?? Math.min(...([...resultSet.getAllKeys([undefined])]).filter((x) => x !== undefined));
        const endYear   = yearTo??   Math.max(...([...resultSet.getAllKeys([undefined])]).filter((x) => x !== undefined));
        const ret = [];
        for (let year=startYear;year<=endYear;year++) {
            const item = {year: year};
            attributeValues.forEach((attVal) => {
                const yearStr = ''+year;
                const length = resultSet.getItem([yearStr,attVal]);
                item[attVal] = length? length:0;
            });
            ret.push(item);
        }
        return ret;
    };

    _substract (fromYearResultSet, toYearResultSet, attributeValues) {
        const temp = new Map();
        fromYearResultSet.forEach((item) => {
            temp.set(item.year,item);
        });
        toYearResultSet.forEach((item) => {
            attributeValues.forEach((attVal) => {
                if (temp.get(item.year)) {
                    temp.get(item.year)[attVal] -= item[attVal];                
                }
                else {
                    const newObj = {year: item.year};
                    newObj[attVal] = (-1) * item[attVal];
                    temp.set(item.year,newObj);


                }
            });
        });
        [...temp.values()].forEach((item,index,array) => {
            if (index>0) {
                attributeValues.forEach((attVal) => {
                    temp.get(item.year)[attVal] += array[index-1][attVal];
                });
            };  
        });
        return [...temp.values()];
    };
    

    /**
     * returns the minimum longitude for all features currently stored. Can be used to center/fit the map
     * 
     * @returns {Number}
     */
    getMinLongitude () {
        return getMinOfArray(this.getAllFeatures()
            .map((feature) => {
                return feature.getMinLongitude();
            }));
    }
    
    /**
     * returns the minimum latitude for all features currently stored. Can be used to center/fit the map
     * 
     * @returns {Number}
     */
    getMinLatitude () {
        return getMinOfArray(this.getAllFeatures()
            .map((feature) => {
                return feature.getMinLatitude();
            }));
    }
    
    /**
     * returns the maximum longitude for all features currently stored. Can be used to center/fit the map
     * 
     * @returns {Number}
     */
    getMaxLongitude () {
        return getMaxOfArray(this.getAllFeatures()
            .map((feature) => {
                return feature.getMaxLongitude();
            }));
    }
    
    /**
     * returns the maximum latitude for all features currently stored. Can be used to center/fit the map
     * 
     * @returns {Number}
     */
    getMaxLatitude () {
        return getMaxOfArray(this.getAllFeatures()
            .map((feature) => {
                return feature.getMaxLatitude();
            }));
    }
    
    /**
     * returns the minimum fromYear of all features currently stored. Can be used to set the minimum of the time bar
     * 
     * @returns {Number}
     */
    getAttributesMinimumYear () {
        const years = this._featureAttributes.getAllItems([undefined, undefined, undefined, undefined]).map((att) => att.getFromYear());
        if (years.length === 0) {
            (new Date()).getFullYear();
        }
        return years.sort((year1,year2) => {return year1-year2;})[0];
    }
    
    /**
     * returns the maximum fromYear of all features currently stored. Can be used to set the maximum of the time bar
     * 
     * @returns {Number}
     */
    getAttributesMaximumYear () {
        const years = this._featureAttributes.getAllItems([undefined, undefined, undefined, undefined]).map((att) => att.getFromYear());
        if (years.length === 0) {
            (new Date()).getFullYear();
        }
        return years.sort((year1,year2) => {return year2-year1;})[0];
    }
    
    /**
     * returns all features whose property values contain the given search string ignoring case
     * 
     * @param {String} searchString
     * @returns {Array[Feature]}
     */
    search(searchString) {
        const ret = [];
        this.getAllFeatures().forEach( (feature) => {
            if (feature.matches(searchString)) {
                ret.push(feature);
            }
        });
        return ret;
    }
    
    /**
     * returns all settings currently stored in an object alongside the given map settings within one Object. This can then be used to store the settings in a file using JSON
     * @param {Object} mapSettings
     * @returns {Object{_iam_MapSettings: {Object}, _iam_FeatureSettings: {Array[FeatureSettings]}}
     */
    getSettingsAsObject (mapSettings) {
        const ret = {_iam_FeatureSettings: []};
        if (mapSettings) {
            ret['_iam_MapSettings'] = mapSettings;
            this.getAllSettings().forEach((setting) => {
                ret['_iam_FeatureSettings'].push(setting);
            });
        }
        return ret;
    }
    
    /**
     * returns a GeoJSON representation of all features currently stored. If according flags are set, attributes and/or properties will also be stored underneath the GeoJSON properties of each feature. Settings will be stored underneath an artificial GeoJSON Point geometry located at the center of all features. 
     * If specified, the map settings are included in these settings
     * 
     * @param {Boolean} addProperties
     * @param {Boolean} addAttributes
     * @param {Boolean} addSettings
     * @param {Object} mapSettings
     * @returns {String}
     */
    toGeoJSON(addProperties, addAttributes, addSettings, mapSettings) {
        const ret = {
            type: 'FeatureCollection',
            features: []
        };
        this.getAllFeatures().forEach((extFeature) => {
           ret.features.push(extFeature.toGeoJSON(addProperties, addAttributes)); 
        });
        if (addSettings) {
            const helper = new ExtendedFeature({
                type: FeatureType.POINT,
                id: '_iam_Settings',
                coordinates: [this.getMinLongitude(), this.getMinLatitude()]
            });
            
            helper.addProperty('_iam_FeatureSettings', this.getSettingsAsObject (mapSettings)._iam_FeatureSettings);
            if (mapSettings) {
                helper.addProperty('_iam_MapSettings',mapSettings);
            }
            ret.features.push(helper.toGeoJSON(true,false));
        }
        return JSON.stringify(ret,undefined,undefined/*'\t'*/);
    }
}