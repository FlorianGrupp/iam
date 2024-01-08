/*  This file provides the core controller of the interactive map */

import {useState, useEffect, useRef} from "react";

//open layer implementation of map layer
import {IAMOLMap} from './iamOpenLayersImplementation'
import {IAMSideMenu, IAMImportDialogue, IAMExportDialogue, IAMSettingsDialogue, IAMTimeDialogue, IAMSearchDialogue, IAMTableDialogue, IAMChartDialogue, IAMInfoDialogue} from './iamDialogues';
import {IAMData, FileLoader, GeoJSONFeaturesSource, KMLFeaturesSource, FeatureAttributesCSVDataSource, FeaturePropertiesCSVDataSource, FeatureSettingsJSONDataSource, ProcessResult} from './iamDataCollections'
import {download, IAMTranslatorFactory} from './iamBase'
import {OSMEnhancer} from './iamOSMLoader';

import {unzipRaw} from 'unzipit';


/**
 * Main (controller) class. Invokes the Map implementation and all dialogues, controls all events. 
 * 
 * @param {Object} props parameters, currently only 'featuressource' (URL of source GeoJSON source file) is supported
 * @returns {DOM tree}
 */
function InteractiveMap(props) {
    //toggle flags to indicate, whether according dialogue is currently displayed or not
    const [toggleFeaturesLoad, setToggleFeaturesLoad] = useState(false);
    const [toggleFeaturesSave, setToggleFeaturesSave] = useState(false);
    const [toggleFeaturesSettings, setToggleFeaturesSettings] = useState(false);
    const [toggleTimeSettings, setToggleTimeSettings] = useState(false);
    const [toggleTimeBar, setToggleTimeBar] = useState(false);
    const [toggleSearch, setToggleSearch] = useState(false);
    const [toggleTable, setToggleTable] = useState(false);
    const [toggleChart, setToggleChart] = useState(false);
    const [triggerTimeBar, setTriggerTimeBar] = useState(false);

    //references to methods rsiding outside this class, but called by this class
    let initMapMethod = null;
    let updateMapMethod = null;
    let getMapSettingsMethod = null;
    let showMsg = null;
    let focusOnFeatureMethod = null;
    
    //currenttimeframe
    const fromYear = useRef((new Date()).getFullYear());
    const toYear = useRef();
    
    //required to ensure that data from source is only loaded once during invoke  
    const ref = useRef(null);
    
    //loads feature from GeoJSON file if specified in parameter
    useEffect(() => {
        if (props.featuressource && !ref.current) {
            ref.current = true;
            loadFeatures(props.featuressource,true,true,true,IAMData.DROPTABLE);
        }
    });
    
    /**
     * 
     * @returns {Number} start year of current time period
     */
    const getFromYear = () => {
        if (fromYear.current) {
            return fromYear.current;
        }
        else {
            return (new Date()).getFullYear();
        }
    };
    
    /**
     * 
     * @returns {Number} end year of current time period
     */
    const getToYear = () => {
        if (toYear.current) {
            return toYear.current;
        }
        else {
            return (new Date()).getFullYear();
        }
    };
    
    /**
     * loads features from the specified GeoJSON file and displays them on the map
     * @param {File|String} file GeoJSON file. Either as instance of file or as fully qualified file path and name
     * @param {Boolean} includeProperties indicates, if properties should be read from the file or not
     * @param {Boolean} includeAttributes indicates, if attributes should be read from the file or not
     * @param {Boolean} includeSettings indicates, if settings should be read from the file or not
     * @param {IAMData.OVERWRITE|IAMData.DROPTABLE} insertType indicates, whether already existing data should be deleted before loading (DROPTABLE) or whether existing data should be overwritten
     * @returns {undefined}
     */
    const loadFeatures = async (file, includeProperties, includeAttributes, includeSettings, insertType) => {
        try {        
            const fl = new FileLoader(file);
            await fl.init();
            
            let datasource = null;
            const pr = new ProcessResult(ProcessResult.INFO,IAMTranslatorFactory.getMsg('Successfully loaded ') + IAMTranslatorFactory.getMsg('features from GeoJSON file'));
            
            let dataContent = null;
            let dataType = 'json';
            
            if ((file.name && file.name.endsWith('.kml')) || (file.endsWith && file.endsWith('.kml'))) {
                dataType = 'kml';
            }
            else if ((file.name && file.name.endsWith('.zip')) || (file.endsWith && file.endsWith('.zip'))) {
                dataType = 'zip';
            }
            
            if (dataType !== 'zip') {
                dataContent = fl.loadData();
            }
            else {
                dataContent = await unzipGeoJSON(file);
            }
            
            if ((file.name && file.name.endsWith('.kml')) || (file.endsWith && file.endsWith('.kml'))) {
                datasource = new KMLFeaturesSource(dataContent,pr);
            }
            else {
                datasource = new GeoJSONFeaturesSource(dataContent,pr);
            }       
            
            const db = IAMData.getDatabase();
            db.loadFeatures (datasource,insertType,pr);
       
            if (includeProperties) {
                db.loadFeaturesProperties (datasource,insertType,pr);                
            }
       
            if (includeAttributes) {
                db.loadFeaturesAttributes (datasource,insertType,pr);
                setYear(IAMData.getDatabase().getAttributesMinimumYear() ,IAMData.getDatabase().getAttributesMaximumYear());
            }
      
            if (includeSettings) {
                db.loadSettings (datasource,insertType,pr);                
            }      
            initMap(datasource.getMapSettings());            
            setToggleTimeBar(true);
            showMsg(pr); 
        }
        catch (e) {
            showMsg({status:ProcessResult.ERROR, text: IAMTranslatorFactory.getMsg('Unable to load ') + IAMTranslatorFactory.getMsg('features from GeoJSON file') + + IAMTranslatorFactory.getMsg(' due to ') + e.name, details: [e.message]});
        }
    };
    
    const unzipGeoJSON = async (file_url) => {

        const unzipped = await unzipRaw(file_url);
        let content = '';
        unzipped.entries.forEach((entry) => {
            content = entry.text();
        });
          
        return content;
    };
    
    /**
     * loads features attributes from the specified csv file and displays them on the map
     * @param {File|String} fileName csv file. Either as instance of file or as fully qualified file path and name
     * @param {IAMData.OVERWRITE|IAMData.DROPTABLE} insertType indicates, whether already existing data should be deleted before loading (DROPTABLE) or whether existing data should be overwritten
     * @returns {undefined}
     */
    const loadFeatureAttributes = async (fileName, insertType) => {
        //try {
            const fl = new FileLoader(fileName);
            await fl.init();
            const pr = new ProcessResult(ProcessResult.INFO,IAMTranslatorFactory.getMsg('Successfully loaded ') + IAMTranslatorFactory.getMsg('feature attributess from csv file'));
            const datasource = new FeatureAttributesCSVDataSource(fl.loadData(),pr);
            IAMData.getDatabase().loadFeaturesAttributes (datasource,insertType,pr);                
            setYear(IAMData.getDatabase().getAttributesMaximumYear() ,IAMData.getDatabase().getAttributesMaximumYear());
            updateMap();
            showMsg(pr);             
            setToggleTimeBar(true);
        /*}
        catch (e) {
            showMsg({status:ProcessResult.ERROR, text: IAMTranslatorFactory.getMsg('Unable to load ') + IAMTranslatorFactory.getMsg('feature attributess from csv file') + + IAMTranslatorFactory.getMsg(' due to ') + e.name, details: [e.message]});
        }*/
    };
    
    /**
     * loads features properties from the specified csv file and displays them on the map
     * @param {File|String} fileName csv file. Either as instance of file or as fully qualified file path and name
     * @param {IAMData.OVERWRITE|IAMData.DROPTABLE} insertType indicates, whether already existing data should be deleted before loading (DROPTABLE) or whether existing data should be overwritten
     * @returns {undefined}
     */
    const loadFeatureProperties = async (fileName, insertType) => {
        try {
        
            const fl = new FileLoader(fileName);
            await fl.init();
            const pr = new ProcessResult(ProcessResult.INFO,IAMTranslatorFactory.getMsg('Successfully loaded ') + IAMTranslatorFactory.getMsg('feature properties from csv file'));
            const datasource = new FeaturePropertiesCSVDataSource(fl.loadData(),pr);
            IAMData.getDatabase().loadFeaturesProperties (datasource,insertType,pr);                

            showMsg(pr);             
        }
        catch (e) {
            showMsg({status:ProcessResult.ERROR, text: IAMTranslatorFactory.getMsg('Unable to load ') + IAMTranslatorFactory.getMsg('feature properties from csv file') + + IAMTranslatorFactory.getMsg(' due to ') + e.name, details: [e.message]});
        }
    };
    
    /**
     * loads settings from the specified JSON file and displays them on the map
     * @param {File|String} fileName JSON file. Either as instance of file or as fully qualified file path and name
     * @param {IAMData.OVERWRITE|IAMData.DROPTABLE} insertType indicates, whether already existing data should be deleted before loading (DROPTABLE) or whether existing data should be overwritten
     * @returns {undefined}
     */
    const loadSettings = async (fileName, insertType) => {
        try {
            const fl = new FileLoader(fileName);
            await fl.init();
            const pr = new ProcessResult(ProcessResult.INFO,IAMTranslatorFactory.getMsg('Successfully loaded ') + IAMTranslatorFactory.getMsg('settings from JSON file'));
            const datasource = new FeatureSettingsJSONDataSource(fl.loadData(),pr);
            IAMData.getDatabase().loadSettings (datasource,insertType,pr);                

            updateMap();
            showMsg(pr);             
        }
        catch (e) {
            showMsg({status:ProcessResult.ERROR, text: IAMTranslatorFactory.getMsg('Unable to load ') + IAMTranslatorFactory.getMsg('settings from JSON file') + + IAMTranslatorFactory.getMsg(' due to ') + e.name, details: [e.message]});
        }
    };
    
    /**
     * Saves all features (including properties, attributes and/or settings if specified) in a GeoJSON file. It will automatically start a download
     * @param {String} filename
     * @param {Boolean} addProperties indicates whether properties should be saved alongside the features 
     * @param {Boolean} addAttributes indicates whether attributes should be saved alongside the features
     * @param {Boolean} addSettings  indicates whether settings should be saved alongside the features
     * @returns {undefined}
     */
    const saveFeatures = (filename, addProperties, addAttributes, addSettings) => {
        try {
            const blob = new Blob (
                    [IAMData.getDatabase().toGeoJSON(addProperties, addAttributes, addSettings, getMapSettingsMethod())],
                    {type: 'text/plain'}
            );
            download(window.URL.createObjectURL(blob),filename);
        }
        catch (e) {
            showMsg({status:ProcessResult.ERROR, text: IAMTranslatorFactory.getMsg('Unable to save ') + IAMTranslatorFactory.getMsg(' due to ') + e.name, details: [e.message]});
        }
    };
    
    const loadOSMEnhancements = (file) => {
        const osm = new OSMEnhancer(file);
        osm.loadOSM();
        initMap();
   };
    
    /**
     * Saves all settings (features and map) in JSON file. It will automatically start a download
     * 
     * @param {String} filename
     * @returns {undefined}
     */
    const saveSettings = (filename) => {
        try {
            const blob = new Blob (
                    [JSON.stringify(IAMData.getDatabase().getSettingsAsObject (getMapSettingsMethod()))],
                    {type: 'text/plain'}
            );
            download(window.URL.createObjectURL(blob),filename);
        }
        catch (e) {
            showMsg({status:ProcessResult.ERROR, text: IAMTranslatorFactory.getMsg('Unable to save ') + IAMTranslatorFactory.getMsg(' due to ') + e.name, details: [e.message]});
        }
    };
   
    /**
     * Sets start and end year of the cirrent period to the specified values
     * 
     * @param {Number} yearFrom
     * @param {Number} yearTo
     * @returns {undefined}
     */
    const setYear = (yearFrom, yearTo) => {
        fromYear.current = yearFrom;
        toYear.current = (yearTo?? yearFrom);
        setTriggerTimeBar((prev) => !prev);
    };
 
    /**
     * This method will be passed to the map implementation class. This class should then register its initMap method by calling this method. The InteractiveMap class will then call the registered initMap-method to init the map
     * 
     * @param {Function} initMethod
     * @returns {undefined}
     */
    const registerInitMap = (initMethod) => {
        initMapMethod = initMethod;
    };
    
    /**
     * This method will be passed to the map implementation class. This class should then register its updateMap method by calling this method. The InteractiveMap class will then call the registered updateMap-method to update the map
     * 
     * @param {Function} updateMethod
     * @returns {undefined}
     */
    const registerUpdateMap = (updateMethod) => {
        updateMapMethod = updateMethod;
    };
    
    /**
     * This method will be passed to the map implementation class. This class should then register its getMapSettingsMethod method by calling this method. The InteractiveMap class will then call the registered getMapSettingsMethod to get the map settings in order to save them in a file
     * 
     * @param {Function} settingsMethod
     * @returns {undefined}
     */
    const registerMapSettingsMethod = (settingsMethod) => {
        getMapSettingsMethod = settingsMethod;
    };
    
    /**
     * This method will be passed to the map implementation class. This class should then register its focusOnFeatureMethod method by calling this method. The InteractiveMap class will then call the registered focusOnFeatureMethod to focus the map on a certain feature
     * 
     * @param {Function} settingsMethod
     * @returns {undefined}
     */
    const registerFocusOnFeatureMethod = (focusMethod) => {
        focusOnFeatureMethod = focusMethod;
    };
    
    /**
     * This method will be passed to the InfoDialogue class. This class should then register its showMsg method by calling this method. The InteractiveMap class will then call the registered showMsg method to display messages in the InfoDialogue window
     * 
     * @param {Function} showMethod
     * @returns {undefined}
     */
    const registerShowMsg = (showMethod) => {
        showMsg = showMethod;
    };
    
    /**
     * Passes the specified processResult to the InfoDialogue window for display
     * @param {ProcessResult} processResult
     * @returns {undefined}
     */
    const showMessage = (processResult) => {
        showMsg(processResult);
    };
    
    const initMap = (mapSettings) => {
        try {
            initMapMethod(mapSettings,getFromYear(),getToYear());
        }
        catch (e) {
            showMsg({status:ProcessResult.ERROR, text: IAMTranslatorFactory.getMsg('Unable to init map') + IAMTranslatorFactory.getMsg(' due to ') + e.name, details: [e.message]});            
        }
    };

    const updateMap = () => {
        try {
            updateMapMethod(getFromYear(),getToYear());
        }
        catch (e) {
            showMsg({status:ProcessResult.ERROR, text: IAMTranslatorFactory.getMsg('Unable to update map') + IAMTranslatorFactory.getMsg(' due to ') + e.name, details: [e.message]});            
        }
    };
    
    const focusOn = (feature) => {
        try {
            focusOnFeatureMethod(feature);
        }
        catch (e) {
            showMsg({status:ProcessResult.ERROR, text: IAMTranslatorFactory.getMsg('Unable to focus on feature') + IAMTranslatorFactory.getMsg(' due to ') + e.name, details: [e.message]});            
        }        
    };

    
    return (
            <div>
    
                <IAMapWrapper 
                    registerInitMap={registerInitMap} 
                    registerUpdateMap={registerUpdateMap} 
                    registerMapSettingsMethod={registerMapSettingsMethod} 
                    registerFocusOnFeatureMethod={registerFocusOnFeatureMethod}
                />

                <IAMSideMenu
                    id="_iamSideMenuTile_Features"
                    tiles = {[
                        {imgName: 'buttonLoad.png', title: 'Import data', handleClick: (e) => {setToggleFeaturesLoad(true);}},
                        {imgName: 'buttonSave.png', title: "Export data", handleClick: (e) => {setToggleFeaturesSave(true);}},
                        {imgName: 'buttonSettings.png', title: "Change feature settings", handleClick: (e) => {setToggleFeaturesSettings(true);}},
                        {imgName: 'buttonTime.png', title: "Change time settings", handleClick: (e) => {setToggleTimeSettings(true);}},
                        {imgName: 'buttonSearch.png', title: "Search feature", handleClick: (e) => {setToggleSearch(true);}},
                        {imgName: 'buttonTable.png', title: "Table view", handleClick: (e) => {setToggleTable(true);}},
                        {imgName: 'buttonChart.png', title: "Chart view", handleClick: (e) => {setToggleChart(true);}}
                    ]}
                />
                                
                 <IAMImportDialogue
                    toggleFeaturesLoad={toggleFeaturesLoad}
                    hideCallback={() => setToggleFeaturesLoad(false)}
                    loadFeatures={loadFeatures}
                    loadAttributes={loadFeatureAttributes}
                    loadProperties={loadFeatureProperties}
                    loadSettings={loadSettings}
                    loadOSMEnhancements={loadOSMEnhancements}
                />
 
                 <IAMExportDialogue
                    toggleFeaturesSave={toggleFeaturesSave}
                    hideCallback={() => setToggleFeaturesSave(false)}
                    saveFeatures={saveFeatures}
                    saveSettings={saveSettings}
                />

                <IAMSettingsDialogue
                    toggleFeaturesSettings={toggleFeaturesSettings}
                    hideCallback={() => setToggleFeaturesSettings(false)}
                    updateMap={updateMap}
                />
                
                <IAMTimeDialogue
                    toggleTimeSettings={toggleTimeSettings}
                    hideCallback={() => setToggleTimeSettings(false)}
                    getFromYear={getFromYear}
                    getToYear={getToYear}
                    setYear ={setYear}
                    toggleTimeBar={toggleTimeBar}
                    setToggleTimeBar={setToggleTimeBar}
                    trigger={triggerTimeBar}
                    updateMap={updateMap}
                />
                
                 <IAMSearchDialogue
                    toggleSearch={toggleSearch}
                    hideCallback={() => setToggleSearch(false)}
                    focusOnFeature={focusOn}
                />
                
                 <IAMChartDialogue
                    toggleChart={toggleChart}
                    hideCallback={() => setToggleChart(false)}
                    showMessage={showMessage}
                />
                
                 <IAMTableDialogue
                    toggleTable={toggleTable}
                    hideCallback={() => setToggleTable(false)}
                    focusOnFeature={focusOn}
                    showMessage={showMessage}
                />

                <IAMInfoDialogue
                    registerShowMsg={registerShowMsg}
                />
                        
            </div>
    );
}
export {InteractiveMap}
    
    
function IAMapWrapper (props) {
    
    //currently only Open layers maps are supported. Any other map library has to implement the register methods listed in the parameters
    return (
            <IAMOLMap 
                registerInitMap={props.registerInitMap} 
                registerUpdateMap={props.registerUpdateMap} 
                registerMapSettingsMethod={props.registerMapSettingsMethod} 
                registerFocusOnFeatureMethod={props.registerFocusOnFeatureMethod}
            /> 
    );
}