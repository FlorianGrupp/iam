/*  This file provides all dialogues used by the interactive map */

import React, { useState, useRef, useEffect} from "react";

/* for creation of charts */
import Chart from 'chart.js/auto';

/* for image export of chart */
import html2canvas from 'html2canvas';

import {IAMBaseSelect , IAMBaseInput, IAMBaseInputNumber, IAMBaseInputCheck, IAMBaseSlider, IAMBaseInputFile, IAMBaseInputColor, IAMBorderSettings} from './iamBaseComponents'
import {IAMTranslatorFactory, formatNumber, formatDate, roundNumber, transform2Table, download} from './iamBase'
import {ProcessResult,IAMData} from './iamDataCollections'
import {FeatureType, FeatureSettings, PointSettings, LineStringSettings, PolygonSettings, TextSettings, Color, Border} from './iamDataCoreElements'

/************************************************* Helper components ******************************************************************/
/** creates a title bar for a window including closing button. 
 * @param {Object} props - expected properties:
 *      - hideCallBack: function that will be called once close button is clicked
 *      - windowTitle: title to display in the window bar. Will be translated using IAMTranslatorFactory
 *      - addTitle: additional title. Will not be translated!
 */
function IAMWindowTitle (props) {
    
    function handleCancel(e) {
        e.preventDefault();
        props.hideCallback();
    }
    
    return (
        <div className="_iamWindowTitle" id={props.windowTitle} >
            <span className="_iamWindowTitle">{IAMTranslatorFactory.getMsg(props.windowTitle) + '' + ((props.addTitle)? props.addTitle : '')}</span>
            <span className="_iamWindowClose" onClick={handleCancel}>&#10799;</span>
        </div>
    );
}
export {IAMWindowTitle}


/** creates a side menu. 
 * @param {Object} props - expected properties:
 *      - id of the menu
 *      - tiles: array of objects with keys imgName (name of the tile image), title (title to be displayed onmouseover, will be translated), handleClick (function to be invoked whem menu tile is clicked)
 */
function IAMSideMenu (props) {
    
    const tiles = props.tiles.map( (tile) => {
        return <IAMSideMenuTile key={props.id + '_' + tile.imgName} onClick={tile.handleClick} imgName={tile.imgName} title={tile.title}/>;
    });
    
    return (
        <div className="_iamSideMenu" id={props.id}>
        {tiles}
        </div>
    );    
}
export {IAMSideMenu}


function IAMSideMenuTile (props) {
    return (
        <div className="_iamSideMenuTile" onClick={props.onClick}>                
            <img src={require('../img/' + props.imgName)} alt={props.title} title={IAMTranslatorFactory.getMsg(props.title)}/>
        </div>
    );    
}

/******************************************************************************************************************************/
/************************************************* Dialogues ******************************************************************/
/******************************************************************************************************************************/

/************************************************* Import Dialogue ******************************************************************/
/** provides a dialogue to upload data into the map. It supports loading of feature data (kml or GEOJSON), property and attribute data (csv) and settings (JSON) as well as JSON file that contains features, properties, attributes and/or settings.
 * @param {Object} props - expected properties:
 *      - toggleFeaturesLoad: boolean to indicate, whether dialogue should be displayed or not
 *      - hideCallback: function to be invoked, when close or cancel button is clicked
 *      - loadFeatures: will be called to load the features (including attributes, properties and/or settings if specified) from the selected file
 *      - loadAttributes: will be called to load the attributes from the selected file
 *      - loadProperties: will be called to load the properties from the selected file
 *      - loadSettings: will be called to load the settings from the selected file
 */
function IAMImportDialogue(props) {
    
    const [file,setFile] = useState(null);
    const [fileType,setFileType] = useState('Features');
    
    const [includeProperties,setIncludeProperties] = useState(true);
    const [includeAttributes,setIncludeAttributes] = useState(true);
    const [includeSettings,setIncludeSettings] = useState(true);
    const [insertType,setInsertType] = useState(IAMData.OVERWRITE);
    
    //required to reset file value in input after upload/cancel 
    const fileRef = useRef();
    
    const fileTypes = [
        {id: 'Features', name: IAMTranslatorFactory.getMsg('Features')},
        {id: 'Properties', name: IAMTranslatorFactory.getMsg('Properties')},
        {id: 'Attributes', name: IAMTranslatorFactory.getMsg('Attributes')},
        {id: 'Settings', name: IAMTranslatorFactory.getMsg('Settings')},
        {id: 'OSMEnhancer', name: 'OSM Enhancer'}
    ];
    
    const insertTypes = [
        {id: IAMData.OVERWRITE, name: IAMTranslatorFactory.getMsg('Overwrite')},
        {id: IAMData.DROPTABLE, name: IAMTranslatorFactory.getMsg('Delete')}
    ];
    
    const getAccept = () => {
        if (fileType === 'Features') {
            return '.kml,.json';
        }
        else if (fileType === 'Settings') {
            return  '.json';
        }
        else {
            return '.csv';          
        }
    };
    
    const fileTypeChanged = (e) => {
        e.preventDefault();
        setFileType(e.target.value);
        clear();
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) {
            alert(IAMTranslatorFactory.getMsg('Please specify file to import'));
        }
        else {
            (fileType === 'Features') && props.loadFeatures(file, includeProperties, includeAttributes, includeSettings, insertType);
            (fileType === 'Properties') && props.loadProperties(file, insertType);
            (fileType === 'Attributes') && props.loadAttributes(file, insertType);
            (fileType === 'Settings') && props.loadSettings(file, insertType);
            (fileType === 'OSMEnhancer') && props.loadOSMEnhancements(file);
 
            clear(true);
        }
    };
    
    const clear = (hide) => {
            fileRef.current.value = '';
            setFile(null);
            hide && props.hideCallback();
    };
    
    const addParam = (fileType === 'Features') && ([
        <IAMBaseInputCheck className="_iamWindowFormInput" key="iam_Load_includeProperties" value={includeProperties} label={IAMTranslatorFactory.getMsg('Include Properties')} handleChange={(e) => setIncludeProperties(e.target.checked)} />,
        <IAMBaseInputCheck className="_iamWindowFormInput" key="iam_Load_includeAttributes" value={includeAttributes} label={IAMTranslatorFactory.getMsg('Include Attributes')} handleChange={(e) => setIncludeAttributes(e.target.checked)} />,
        <IAMBaseInputCheck className="_iamWindowFormInput" key="iam_Load_includeSettings" value={includeSettings} label={IAMTranslatorFactory.getMsg('Include Settings')} handleChange={(e) => setIncludeSettings(e.target.checked)} />            
    ]);
      
    return (
        <div id="_iam_window_load" className="_iamWindow" style={{display: props.toggleFeaturesLoad ? 'block' : 'none'}}> 
            <IAMWindowTitle windowTitle='Import data' hideCallback={props.hideCallback}/>
            <div className="_iamWindowBody">
                <form id="_iam_Load_Form" onSubmit={handleSubmit}>
                    <div className="_iamWindowForm">
                        <IAMBaseSelect className="_iamWindowFormInput" id='iam_Load_FileType' value={fileType} values={fileTypes} label='File Content' nullOption={false} handleChange={fileTypeChanged}/>
                        <IAMBaseInputFile className="_iamWindowFormInput" id="_iam_Load_FileName" Ref={fileRef} handleChange={(e) => setFile(e.target.files[0])} accept={getAccept()} label='File Name'/>
                        <IAMBaseSelect className="_iamWindowFormInput" id='iam_Load_InsertType' value={insertType} values={insertTypes} label='Existing Data' nullOption={false} handleChange={(e) => setInsertType(parseInt(e.target.value))}/>
                        {addParam}
                    </div>
                    <div className="_iamWindowFooter">
                        <span className="_iamWindowFooterButton" id="_iam_Load_submit" onClick={handleSubmit}>{IAMTranslatorFactory.getMsg("Import")}</span>
                        <span className="_iamWindowFooterButton" id="_iam_Load_cancel" onClick={() => clear(true)}>{IAMTranslatorFactory.getMsg("Cancel")}</span>
                    </div>
                </form>
            </div>
        </div> 
    );
}
export {IAMImportDialogue} 
    
    
/************************************************* Export Dialogue ******************************************************************/
/** provides a dialogue to export data from the map. 
 * @param {Object} props - expected properties:
 *      - toggleFeaturesSave: boolean to indicate, whether dialogue should be displayed or not
 *      - hideCallback: function to be invoked, when close or cancel button is clicked
 *      - saveFeatures: will be called to save the features (including attributes, properties and/or settings if specified) to the selected file
 *      - saveSettings: will be called to save the settings to the selected file
 */    
function IAMExportDialogue(props) {
    const [fileName,setFileName] = useState('mapData.json');
    const [fileType,setFileType] = useState('Features');

    const [includeProperties,setIncludeProperties] = useState(true);
    const [includeAttributes,setIncludeAttributes] = useState(true);
    const [includeSettings,setIncludeSettings] = useState(true);

    const fileTypes = [
        {id: 'Features', name: IAMTranslatorFactory.getMsg('Features')},
        {id: 'Settings', name: IAMTranslatorFactory.getMsg('Settings')}
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!fileName || fileName === '') {
            alert(IAMTranslatorFactory.getMsg('Please specify file name for export file'));            
        }
        else if (fileType === 'Features') {
            props.saveFeatures(fileName,includeProperties, includeAttributes, includeSettings);            
        }
        else if (fileType === 'Settings') {
            props.saveSettings(fileName);            
        }
     };
      
    const addParam = (fileType === 'Features') && ([
        <IAMBaseInputCheck className="_iamWindowFormInput" key="iam_Load_includeProperties" value={includeProperties} label={IAMTranslatorFactory.getMsg('Include Properties')} handleChange={(e) => setIncludeProperties(e.target.checked)} />,
        <IAMBaseInputCheck className="_iamWindowFormInput" key="iam_Load_includeAttributes" value={includeAttributes} label={IAMTranslatorFactory.getMsg('Include Attributes')} handleChange={(e) => setIncludeAttributes(e.target.checked)} />,
        <IAMBaseInputCheck className="_iamWindowFormInput" key="iam_Load_includeSettings" value={includeSettings} label={IAMTranslatorFactory.getMsg('Include Settings')} handleChange={(e) => setIncludeSettings(e.target.checked)} />            
    ]);

    return (
        <div id="_iam_window_save" className="_iamWindow" style={{display: props.toggleFeaturesSave ? 'block' : 'none'}}> 
            <IAMWindowTitle windowTitle="Export Data" hideCallback={props.hideCallback}/>
            <div className="_iamWindowBody">
                <form id="_iam_Save_Form" onSubmit={handleSubmit}>
                    <div className="_iamWindowForm">
                        <IAMBaseSelect className="_iamWindowFormInput" id='iam_Save_FileType' value={fileType} values={fileTypes} label='File Content' nullOption={false} handleChange={(e) => setFileType(e.target.value)}/>
                        <IAMBaseInput className="_iamWindowFormInput" id="_iam_Save_FileName" value={fileName} handleChange={(e) => {setFileName(e.target.value);}} label='File Name'/>
                        {addParam}
                    </div>
                    <div className="_iamWindowFooter">
                        <span className="_iamWindowFooterButton" id="_iam_Save_submit" onClick={handleSubmit}>{IAMTranslatorFactory.getMsg("Export")}</span>
                        <span className="_iamWindowFooterButton" id="_iam_Save_cancel" onClick={props.hideCallback}>{IAMTranslatorFactory.getMsg("Cancel")}</span>
                    </div>
                </form>
            </div>
        </div> 
    );
}
export {IAMExportDialogue}


/************************************************* Settings Dialogue ******************************************************************/
/** asserts all key/values from source into the target 
 * @param {Object} target 
 * @param {Object} source 
 */
function assertParams (target, source) {
    [...Object.keys(source)].forEach((key) => {
       target[key] = source[key];
    });
};

/* returns a name for the specified setting. Return value depends on the LEVEL of the settings */
const getName = (setting) => {
    if (!setting) {
        return '';
    }
    const name = 
        setting.getLevelType() === 
            FeatureSettings.LEVEL_STANDARD? setting.getLevelName() : 
            (setting.getLevelType() === FeatureSettings.LEVEL_ATTRIBUTE? setting.getLevelName() + ' -> ' + (setting.getLevelValue() === '_iam_hasChanged' ? IAMTranslatorFactory.getMsg('has Changed') : setting.getLevelValue()): 
            setting.getLevelValue());
    return name;
};

/* returns the DOM structure for a tab. Expected properties
 *      - id: unique id of tab
 *      - toggle: defined, whether tab is active or inactive
 *      - handleClick: function, that will be invoked, when tab is clicked
 */
function IAMTab(props) {
    return (
        <div className={props.toggle ? '_iamTab_active' : '_iamTab_inactive'} id={props.id + "_div"}  onClick={props.handleClick}>
            <span id={props.id + "_div"}>{IAMTranslatorFactory.getMsg(props.title)}</span>
        </div>
    );
}

/* provides a dialogue to edit all values of a setting. Layout and input elements depend on the underlying feature type. Changes are directly set in the setting and the underlying map will be updated. 
 * @param {Object} props - expected properties:
 *      - getCurrentSettings: function, will be called to retrieve the latest setting that should be edited in this dialogue
 *      - hideCallback: function to be invoked, when close or cancel button is clicked
 *      - updateMap: function to becalled to update map after setting has changed
 *      - showTextSettings: function to be called to display dialogue to eedit text settings of feature
 *      - toggleSettings: boolean to indicate, whether dialogue should be displayed or not
 *      - id: unique id of dialogue      
 */
function IAMSettingsEditDialogue(props) {

    //used to force re-render in case that cancel button is being pressed
    const [trigger, setTrigger] = useState(false);
    const settings = props.getCurrentSettings();

    const handleSubmit = (e) => {
        e.preventDefault();
        const params = {
            showFeature: e.target.elements.settings_showFeature.value === ''? undefined : (e.target.elements.settings_showFeature.value === 'true'? true : false), 
            showText: e.target.elements.settings_showText.value === ''? undefined : (e.target.elements.settings_showText.value === 'true'? true : false)            
        };
        
        if (settings.getFeatureType() === FeatureType.POINT) {
            params.pointShapeType = (e.target.elements.settings_pointShapeType.value === ''? undefined : parseInt(e.target.elements.settings_pointShapeType.value)); 
            params.pointRadius = (e.target.elements.settings_pointRadius.value === ''? undefined : parseInt(e.target.elements.settings_pointRadius.value));
            params.pointFill = (e.target.elements.settings_pointFill_noColor.checked? undefined : new Color([e.target.elements.settings_pointFill.value,e.target.elements.settings_pointFill_opacity.value]));
            
            params.pointBorder = new Border({
                color : e.target.elements.settings_pointBorder_color_noColor.checked? undefined : new Color([e.target.elements.settings_pointBorder_color.value,e.target.elements.settings_pointBorder_color_opacity.value]),
                width : e.target.elements.settings_pointBorder_width.value === '' ? undefined : parseInt(e.target.elements.settings_pointBorder_width.value),
                lineDash1: e.target.elements.settings_pointBorder_lineDash1.value === '' ? undefined : parseInt(e.target.elements.settings_pointBorder_lineDash1.value),
                lineDash2: e.target.elements.settings_pointBorder_lineDash2.value === '' ? undefined : parseInt(e.target.elements.settings_pointBorder_lineDash2.value),
                lineDash3: e.target.elements.settings_pointBorder_lineDash3.value === '' ? undefined : parseInt(e.target.elements.settings_pointBorder_lineDash3.value),
                lineDash4: e.target.elements.settings_pointBorder_lineDash4.value === '' ? undefined : parseInt(e.target.elements.settings_pointBorder_lineDash4.value),
                lineDashOffset: e.target.elements.settings_pointBorder_lineDashOffset.value === '' ? undefined : parseInt(e.target.elements.settings_pointBorder_lineDashOffset.value),
                lineCap: e.target.elements.settings_pointBorder_lineCap.value === '' ? undefined : e.target.elements.settings_pointBorder_lineCap.value
            });
        
            params.pointDisplacementX = (e.target.elements.settings_pointDisplacementX.value === ''? undefined : parseInt(e.target.elements.settings_pointDisplacementX.value)); 
            params.pointDisplacementY = (e.target.elements.settings_pointDisplacementY.value === ''? undefined : parseInt(e.target.elements.settings_pointDisplacementY.value)); 
            params.pointRotation = (e.target.elements.settings_pointRotation.value === ''? undefined : (parseFloat(e.target.elements.settings_pointRotation.value))); 

            params.pointPoints = (e.target.elements.settings_pointPoints.value === ''? undefined : parseInt(e.target.elements.settings_pointPoints.value)); 
            params.pointStarRadius = (e.target.elements.settings_pointStarRadius.value === ''? undefined : parseInt(e.target.elements.settings_pointStarRadius.value)); 
        }
        else if (settings.getFeatureType() === FeatureType.LINESTRING) {
            params.lineBorder1 = new Border({
                color : e.target.elements.settings_lineStringBorder1_color_noColor.checked? undefined : new Color([e.target.elements.settings_lineStringBorder1_color.value,e.target.elements.settings_lineStringBorder1_color_opacity.value]),
                width : e.target.elements.settings_lineStringBorder1_width.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder1_width.value),
                lineDash1: e.target.elements.settings_lineStringBorder1_lineDash1.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder1_lineDash1.value),
                lineDash2: e.target.elements.settings_lineStringBorder1_lineDash2.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder1_lineDash2.value),
                lineDash3: e.target.elements.settings_lineStringBorder1_lineDash3.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder1_lineDash3.value),
                lineDash4: e.target.elements.settings_lineStringBorder1_lineDash4.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder1_lineDash4.value),
                lineDashOffset: e.target.elements.settings_lineStringBorder1_lineDashOffset.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder1_lineDashOffset.value),
                lineCap: e.target.elements.settings_lineStringBorder1_lineCap.value === '' ? undefined : e.target.elements.settings_lineStringBorder1_lineCap.value
            });

            params.lineBorder2 = new Border({
                color : e.target.elements.settings_lineStringBorder2_color_noColor.checked? undefined : new Color([e.target.elements.settings_lineStringBorder2_color.value,e.target.elements.settings_lineStringBorder2_color_opacity.value]),
                width : e.target.elements.settings_lineStringBorder2_width.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder2_width.value),
                lineDash1: e.target.elements.settings_lineStringBorder2_lineDash1.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder2_lineDash1.value),
                lineDash2: e.target.elements.settings_lineStringBorder2_lineDash2.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder2_lineDash2.value),
                lineDash3: e.target.elements.settings_lineStringBorder2_lineDash3.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder2_lineDash3.value),
                lineDash4: e.target.elements.settings_lineStringBorder2_lineDash4.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder2_lineDash4.value),
                lineDashOffset: e.target.elements.settings_lineStringBorder2_lineDashOffset.value === '' ? undefined : parseInt(e.target.elements.settings_lineStringBorder2_lineDashOffset.value),
                lineCap: e.target.elements.settings_lineStringBorder2_lineCap.value === '' ? undefined : e.target.elements.settings_lineStringBorder2_lineCap.value
            }); 
        }
        else if (settings.getFeatureType() === FeatureType.POLYGON) {
            params.polygonFill = (e.target.elements.settings_polygonFill_noColor.checked? undefined : new Color([e.target.elements.settings_polygonFill.value,e.target.elements.settings_polygonFill_opacity.value]));

            params.polygonBorder = new Border({
                color : e.target.elements.settings_polygonBorder_color_noColor.checked? undefined : new Color([e.target.elements.settings_polygonBorder_color.value,e.target.elements.settings_polygonBorder_color_opacity.value]),
                width : e.target.elements.settings_polygonBorder_width.value === '' ? undefined : parseInt(e.target.elements.settings_polygonBorder_width.value),
                lineDash1: e.target.elements.settings_polygonBorder_lineDash1.value === '' ? undefined : parseInt(e.target.elements.settings_polygonBorder_lineDash1.value),
                lineDash2: e.target.elements.settings_polygonBorder_lineDash2.value === '' ? undefined : parseInt(e.target.elements.settings_polygonBorder_lineDash2.value),
                lineDash3: e.target.elements.settings_polygonBorder_lineDash3.value === '' ? undefined : parseInt(e.target.elements.settings_polygonBorder_lineDash3.value),
                lineDash4: e.target.elements.settings_polygonBorder_lineDash4.value === '' ? undefined : parseInt(e.target.elements.settings_polygonBorder_lineDash4.value),
                lineDashOffset: e.target.elements.settings_polygonBorder_lineDashOffset.value === '' ? undefined : parseInt(e.target.elements.settings_polygonBorder_lineDashOffset.value),
                lineCap: e.target.elements.settings_polygonBorder_lineCap.value === '' ? undefined : e.target.elements.settings_polygonBorder_lineCap.value
            });            
        }
        //update vaslues in setting
        assertParams(settings,params);
        //close dialogue
        props.hideCallback();
        //update map
        props.updateMap();
    };
    
    const handleCancel = () => {
        //force refresh of input values
        setTrigger((prev) => !prev);
        props.hideCallback();        
    };
    
    const showDropdown = [
        {id: 'true', name: IAMTranslatorFactory.getMsg('Yes')},
        {id: 'false', name: IAMTranslatorFactory.getMsg('No')}        
    ];
    
    return (
        settings && <div id="_iam_window_settings_dialogue" className="_iamWindow" style={{display: props.toggleSettings ? 'block' : 'none'}}> 
            <IAMWindowTitle windowTitle="Change feature settings" addTitle={': ' + (settings && IAMTranslatorFactory.getMsg(FeatureType.geoJSONName[settings.getFeatureType()])) + ' -> ' + getName(settings)} hideCallback={props.hideCallback}/>
            <div className="_iamWindowBody">
                    <form onSubmit={handleSubmit} id={props.id}>
                        <div className="_iamWindowHeading">
                            <span>{IAMTranslatorFactory.getMsg('General Settings')}</span>
                        </div>               
                        <div className="_iamWindowForm4col">
                            <IAMBaseSelect trigger={trigger} id={props.id + '_showFeature'} value={settings && settings.showFeature !== undefined? settings.showFeature: ''} values={showDropdown} className="_iamWindowFormInput" label="Show Feature on map" nullOption={true} />
                            <IAMBaseSelect trigger={trigger} id={props.id + '_showText'} value={settings && settings.showText !== undefined? settings.showText: ''} values={showDropdown} className="_iamWindowFormInput" label="Show Feature Label on map" nullOption={true} />
                        </div>
                        {settings.getFeatureType() === FeatureType.POINT &&
                        <div>
                            <div className="_iamWindowHeading">
                                <span>{IAMTranslatorFactory.getMsg('Shape & Filling Color')}</span>
                            </div> 
                            <div className="_iamWindowForm6col">
                                <IAMBaseSelect trigger={trigger} id={props.id + '_pointShapeType'} value={settings && settings.pointShapeType? settings.pointShapeType : ''} values={PointSettings.pointShapeTypeValues} className="_iamWindowFormInput" label="Shape Type" nullOption={true} />
                                <IAMBaseInputNumber trigger={trigger} id={props.id + '_pointRadius'} value={settings && settings.pointRadius? settings.pointRadius : ''} numberType="int" maxlength="2" className="_iamWindowFormInput" label="Radius"/>
                                <IAMBaseInputColor trigger={trigger} id={props.id + '_pointFill'} value={settings && settings.pointFill? settings.pointFill.toCSSHex() : ''} opacity={settings && settings.pointFill? settings.pointFill.opacity : 1} className="_iamWindowFormInput" label="Filling Color" nullOption={true}/>
                            </div> 
                            <div className="_iamWindowHeading">
                                <span>{IAMTranslatorFactory.getMsg('Border')}</span>
                            </div> 
                            <div className="_iamWindowForm6col">
                                <IAMBorderSettings trigger={trigger} id={props.id + '_pointBorder'} border={settings && settings.pointBorder? settings.pointBorder : undefined} className="_iamWindowFormInput"/>
                            </div> 
                            <div className="_iamWindowHeading">
                                <span>{IAMTranslatorFactory.getMsg('Placement')}</span>
                            </div> 
                            <div className="_iamWindowForm6col">
                                <IAMBaseInputNumber trigger={trigger} id={props.id + '_pointDisplacementX'} value={settings && settings.pointDisplacementX? settings.pointDisplacementX : ''} numberType="int" maxlength="3" className="_iamWindowFormInput" label="Shift horizontal" />
                                <IAMBaseInputNumber trigger={trigger} id={props.id + '_pointDisplacementY'} value={settings && settings.pointDisplacementY? settings.pointDisplacementY : ''} numberType="int" maxlength="3" className="_iamWindowFormInput" label="Shift vertical"/>
                                <IAMBaseInputNumber trigger={trigger} id={props.id + '_pointRotation'} value={settings && settings.pointRotation? settings.pointRotation : ''} numberType="float" maxlength="6" className="_iamWindowFormInput"  label="Rotate (rad*PI)" />    
                            </div> 
                            <div className="_iamWindowHeading">
                                <span>{IAMTranslatorFactory.getMsg('Special settings for Polygon & Star')}</span>
                            </div> 
                            <div className="_iamWindowForm6col">
                                <IAMBaseInputNumber trigger={trigger} id={props.id + '_pointPoints'} value={settings && settings.pointPoints? settings.pointPoints : ''} numberType="int"  maxlength="2" className="_iamWindowFormInput" label="# points"/>
                                <IAMBaseInputNumber trigger={trigger} id={props.id + '_pointStarRadius'} value={settings && settings.pointStarRadius? settings.pointStarRadius : ''} numberType="int"  maxlength="3" className="_iamWindowFormInput" label="2nd Radius star"/>
                            </div> 
                        </div> 
                        }
                        {settings.getFeatureType() === FeatureType.LINESTRING &&
                        <div>
                           <div className="_iamWindowHeading">
                               <span>{IAMTranslatorFactory.getMsg('Line 1')}</span>
                           </div> 
                           <div className="_iamWindowForm6col">
                               <IAMBorderSettings trigger={trigger} id={props.id + '_lineStringBorder1'} border={settings && settings.lineBorder1? settings.lineBorder1 : undefined} className="_iamWindowFormInput"/>
                           </div> 
                           <div className="_iamWindowHeading">
                               <span>{IAMTranslatorFactory.getMsg('Line 2')}</span>
                           </div> 
                           <div className="_iamWindowForm6col">
                               <IAMBorderSettings trigger={trigger} id={props.id + '_lineStringBorder2'} border={settings && settings.lineBorder2? settings.lineBorder2 : undefined} className="_iamWindowFormInput"/>
                           </div> 
                        </div>
                        }
                        {settings.getFeatureType() === FeatureType.POLYGON &&
                        <div>        
                           <div className="_iamWindowHeading">
                               <span>{IAMTranslatorFactory.getMsg('Filling Color')}</span>
                           </div> 
                           <div className="_iamWindowForm6col">
                               <IAMBaseInputColor trigger={trigger} id={props.id + '_polygonFill'} value={settings && settings.polygonFill? settings.polygonFill.toCSSHex() : ''} opacity={settings && settings.polygonFill? settings.polygonFill.opacity : 1} className="_iamWindowFormInput" label="Filling Color" nullOption={true}/>
                           </div> 
                           <div className="_iamWindowHeading">
                               <span>{IAMTranslatorFactory.getMsg('Border')}</span>
                           </div> 
                           <div className="_iamWindowForm6col">
                               <IAMBorderSettings trigger={trigger} id={props.id + '_polygonBorder'} border={settings && settings.polygonBorder? settings.polygonBorder : undefined} className="_iamWindowFormInput"/>
                           </div>
                        </div>
                        }
                        <div className="_iamWindowFooter">
                            <button type="submit" className="_iamWindowFooterButton" id="_iam_settings_submit" >{IAMTranslatorFactory.getMsg('Save')}</button>
                            <span className="_iamWindowFooterButton" id="_iam_settings_textSettings" onClick={props.showTextSettings}>{IAMTranslatorFactory.getMsg('Edit Text Settings')}</span>
                            <span className="_iamWindowFooterButton" id="_iam_settings_cancel" onClick={handleCancel}>{IAMTranslatorFactory.getMsg('Cancel')}</span>
                        </div>
                    </form>
            </div>    
        </div>
    );
}

/* provides a dialogue to edit all text values of a setting. Layout and input elements do not!!! depend on the underlying feature type. Changes are directly set in the setting and the underlying map will be updated. 
 * @param {Object} props - expected properties:
 *      - getCurrentTextSettings: function, will be called to retrieve the latest text setting that should be edited in this dialogue
 *      - hideCallback: function to be invoked, when close or cancel button is clicked
 *      - updateMap: function to becalled to update map after setting has changed
 *      - toggleTextSettings: boolean to indicate, whether dialogue should be displayed or not
 *      - id: unique id of dialogue      
 */
function IAMTextSettingsEditDialogue(props) {

    //used to force re-render in case that cancel button is being pressed
    const [trigger, setTrigger] = useState(false);
    const textSettings = props.getCurrentTextSettings();
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const params = {
            textFillColor: e.target.elements.textSettings_textFillColor_noColor.checked? undefined : new Color([e.target.elements.textSettings_textFillColor.value,e.target.elements.textSettings_textFillColor_opacity.value]),
            textBorder: new Border({
                color : e.target.elements.textSettings_textBorder_color_noColor.checked? undefined : new Color([e.target.elements.textSettings_textBorder_color.value,e.target.elements.textSettings_textBorder_color_opacity.value]),
                width : e.target.elements.textSettings_textBorder_width.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBorder_width.value),
                lineDash1: e.target.elements.textSettings_textBorder_lineDash1.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBorder_lineDash1.value),
                lineDash2: e.target.elements.textSettings_textBorder_lineDash2.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBorder_lineDash2.value),
                lineDash3: e.target.elements.textSettings_textBorder_lineDash3.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBorder_lineDash3.value),
                lineDash4: e.target.elements.textSettings_textBorder_lineDash4.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBorder_lineDash4.value),
                lineDashOffset: e.target.elements.textSettings_textBorder_lineDashOffset.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBorder_lineDashOffset.value),
                lineCap: e.target.elements.textSettings_textBorder_lineCap.value === '' ? undefined : e.target.elements.textSettings_textBorder_lineCap.value                
            }),
            textFontStyle: (e.target.elements.textSettings_textFontStyle.value === ''? undefined : e.target.elements.textSettings_textFontStyle.value),
            textFontWeight: (e.target.elements.textSettings_textFontWeight.value === ''? undefined : e.target.elements.textSettings_textFontWeight.value),
            textFontSize: (e.target.elements.textSettings_textFontSize.value === ''? undefined : parseFloat(e.target.elements.textSettings_textFontSize.value)),
            textFontSizeType: (e.target.elements.textSettings_textFontSizeType.value === ''? undefined : e.target.elements.textSettings_textFontSizeType.value),
            textFontFamily: (e.target.elements.textSettings_textFontFamily.value === ''? undefined : e.target.elements.textSettings_textFontFamily.value),
            textFont: (e.target.elements.textSettings_textFont.value === ''? undefined : e.target.elements.textSettings_textFont.value),            

            textOffsetX: (e.target.elements.textSettings_textOffsetX.value === ''? undefined : parseInt(e.target.elements.textSettings_textOffsetX.value)),
            textOffsetY: (e.target.elements.textSettings_textOffsetY.value === ''? undefined : parseInt(e.target.elements.textSettings_textOffsetY.value)),
            textRotation: (e.target.elements.textSettings_textRotation.value === ''? undefined : (parseFloat(e.target.elements.textSettings_textRotation.value))),
            textAlign: (e.target.elements.textSettings_textAlign.value === ''? undefined : e.target.elements.textSettings_textAlign.value),
            textPlacement: (e.target.elements.textSettings_textPlacement.value === ''? undefined : e.target.elements.textSettings_textPlacement.value),

            textBackgroundFillColor: (e.target.elements.textSettings_textBackgroundFillColor_noColor.checked? undefined : new Color([e.target.elements.textSettings_textBackgroundFillColor.value,e.target.elements.textSettings_textBackgroundFillColor_opacity.value])),

            textBackgroundBorder: new Border({
                color : e.target.elements.textSettings_textBackgroundBorder_color_noColor.checked? undefined : new Color([e.target.elements.textSettings_textBackgroundBorder_color.value,e.target.elements.textSettings_textBackgroundBorder_color_opacity.value]),
                width : e.target.elements.textSettings_textBackgroundBorder_width.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBackgroundBorder_width.value),
                lineDash1: e.target.elements.textSettings_textBackgroundBorder_lineDash1.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBackgroundBorder_lineDash1.value),
                lineDash2: e.target.elements.textSettings_textBackgroundBorder_lineDash2.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBackgroundBorder_lineDash2.value),
                lineDash3: e.target.elements.textSettings_textBackgroundBorder_lineDash3.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBackgroundBorder_lineDash3.value),
                lineDash4: e.target.elements.textSettings_textBackgroundBorder_lineDash4.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBackgroundBorder_lineDash4.value),
                lineDashOffset: e.target.elements.textSettings_textBackgroundBorder_lineDashOffset.value === '' ? undefined : parseInt(e.target.elements.textSettings_textBackgroundBorder_lineDashOffset.value),
                lineCap: e.target.elements.textSettings_textBackgroundBorder_lineCap.value === '' ? undefined : e.target.elements.textSettings_textBackgroundBorder_lineCap.value
            }),   
            
            textBackgroundPaddingTop: (e.target.elements.textSettings_textBackgroundPaddingTop.value === ''? undefined : parseInt(e.target.elements.textSettings_textBackgroundPaddingTop.value)),
            textBackgroundPaddingRight: (e.target.elements.textSettings_textBackgroundPaddingRight.value === ''? undefined : parseInt(e.target.elements.textSettings_textBackgroundPaddingRight.value)),
            textBackgroundPaddingBottom: (e.target.elements.textSettings_textBackgroundPaddingBottom.value === ''? undefined : parseInt(e.target.elements.textSettings_textBackgroundPaddingBottom.value)),
            textBackgroundPaddingLeft: (e.target.elements.textSettings_textBackgroundPaddingLeft.value === ''? undefined : parseInt(e.target.elements.textSettings_textBackgroundPaddingLeft.value)),

            textMaxAngle: (e.target.elements.textSettings_textMaxAngle.value === ''? undefined : (parseFloat(e.target.elements.textSettings_textMaxAngle.value))),
            textOverflow: (e.target.elements.textSettings_textOverflow.checked),
            textRepeat: (e.target.elements.textSettings_textRepeat.value === ''? undefined : parseInt(e.target.elements.textSettings_textRepeat.value))

        };
        assertParams(textSettings,params);
        props.hideCallback();
        props.updateMap();                
    };
        
    const handleCancel = () => {
        setTrigger((prev) => !prev);
        props.hideCallback();        
    };
    
    return (
        <div id="_iam_window_text_settings" className="_iamWindow" style={{display: props.toggleTextSettings ? 'block' : 'none'}}> 
            <IAMWindowTitle windowTitle="Edit Text Settings" hideCallback={props.hideCallback}/>
            <div className="_iamWindowBody">
                <form onSubmit={handleSubmit} id={props.id}>
                    <div className="_iamWindowHeading">
                        <span>{IAMTranslatorFactory.getMsg('Color')}</span>
                    </div> 
                    <div className="_iamWindowForm8col">
                        <IAMBaseInputColor trigger={trigger} id={props.id + '_textFillColor'} value={textSettings && textSettings.textFillColor ? textSettings.textFillColor.toCSSHex() : ''} className="_iamWindowFormInput" label="Text Color" nullOption={true}/>
                        <IAMBorderSettings trigger={trigger} id={props.id + '_textBorder'} border={textSettings && textSettings.textBorder? textSettings.textBorder : undefined} className="_iamWindowFormInput"/>
                    </div> 
                    <div className="_iamWindowHeading">
                        <span>{IAMTranslatorFactory.getMsg('Font')}</span>
                    </div> 
                    <div className="_iamWindowForm6col">
                        <IAMBaseSelect trigger={trigger} id={props.id + '_textFontStyle'} value={textSettings && textSettings.textFontStyle? textSettings.textFontStyle : ''} values={TextSettings.textFontStyleValues} className="_iamWindowFormInput" label="Font Style" nullOption={true} />
                        <IAMBaseSelect trigger={trigger} id={props.id + '_textFontWeight'} value={textSettings && textSettings.textFontWeight? textSettings.textFontWeight : ''} values={TextSettings.textFontWeightValues} className="_iamWindowFormInput" label="Font Weight" nullOption={true} />
                        <label className="_iamWindowFormInput" htmlFor={props.id + '_textFontSize'}>{IAMTranslatorFactory.getMsg('Font Size')}</label>
                        <span className="_iamWindowFormBracket2Col">
                            <IAMBaseInputNumber trigger={trigger} id={props.id + '_textFontSize'} value={textSettings && textSettings.textFontSize? textSettings.textFontSize : ''} numberType="float" maxlength="5"/>
                            <IAMBaseSelect trigger={trigger} id={props.id + '_textFontSizeType'} value={textSettings && textSettings.textFontSizeType? textSettings.textFontSizeType : ''} values={TextSettings.textFontSizeTypeValues} />
                        </span>
                        <IAMBaseSelect trigger={trigger} id={props.id + '_textFontFamily'} value={textSettings && textSettings.textFontFamily? textSettings.textFontFamily : ''} values={TextSettings.textFontFamilyValues} className="_iamWindowFormInput" label="Font Family" nullOption={true} />
                        <IAMBaseInput trigger={trigger} id={props.id + '_textFont'} value={textSettings && textSettings.textFont? textSettings.textFont : ''} className="_iamWindowFormInput" label="Font (css value)" nullOption={true} />
                    </div>
                    <div className="_iamWindowHeading">
                        <span>{IAMTranslatorFactory.getMsg('Alignment')}</span>
                    </div> 
                    <div className="_iamWindowForm6col">
                        <IAMBaseInputNumber trigger={trigger} id={props.id + '_textOffsetX'} value={textSettings && textSettings.textOffsetX? textSettings.textOffsetX : ''} numberType="int" maxlength="5" className="_iamWindowFormInput"  label="Shift horizontal" />    
                        <IAMBaseInputNumber trigger={trigger} id={props.id + '_textOffsetY'} value={textSettings && textSettings.textOffsetY? textSettings.textOffsetY : ''} numberType="int" maxlength="5" className="_iamWindowFormInput"  label="Shift vertical" />    
                        <IAMBaseInputNumber trigger={trigger} id={props.id + '_textRotation'} value={textSettings && textSettings.textRotation? textSettings.textRotation : ''} numberType="float" maxlength="5" className="_iamWindowFormInput"  label="Rotate (rad*PI)" />    
                        <IAMBaseSelect trigger={trigger} id={props.id + '_textAlign'} value={textSettings && textSettings.textAlign? textSettings.textAlign : ''} values={TextSettings.textAlignValues} className="_iamWindowFormInput" nullOption={true} label="Text Align" />
                        <IAMBaseSelect trigger={trigger} id={props.id + '_textPlacement'} value={textSettings && textSettings.textPlacement? textSettings.textPlacement : ''} values={TextSettings.textPlacementValues} className="_iamWindowFormInput" nullOption={true} label="Text Placement" />
                    </div>
                    <div className="_iamWindowHeading">
                        <span>{IAMTranslatorFactory.getMsg('Settings for Background (only Point Placement)')}</span>
                    </div> 
                    <div className="_iamWindowForm8col">
                        <IAMBaseInputColor trigger={trigger} id={props.id + '_textBackgroundFillColor'} value={textSettings && textSettings.textBackgroundFillColor? textSettings.textBackgroundFillColor.toCSSHex() : ''} className="_iamWindowFormInput" label="Color" nullOption={true}/>
                        <IAMBorderSettings trigger={trigger} id={props.id + '_textBackgroundBorder'} border={textSettings && textSettings.textBackgroundBorder? textSettings.textBackgroundBorder : undefined} className="_iamWindowFormInput"/>
                        <span></span><span></span>
                        <label htmlFor={props.id + '_textBackgroundPaddingTop'} className="_iamWindowFormInput">{IAMTranslatorFactory.getMsg('Offset (top/right/bottom/left)')}</label>
                        <span className="_iamWindowFormBracket4Col">
                            <IAMBaseInputNumber trigger={trigger} id={props.id + '_textBackgroundPaddingTop'} value={textSettings && textSettings.textBackgroundPaddingTop? textSettings.textBackgroundPaddingTop : ''} numberType="int" maxlength="2"/>    
                            <IAMBaseInputNumber trigger={trigger} id={props.id + '_textBackgroundPaddingRight'} value={textSettings && textSettings.textBackgroundPaddingRight? textSettings.textBackgroundPaddingRight : ''} numberType="int" maxlength="2"/>    
                            <IAMBaseInputNumber trigger={trigger} id={props.id + '_textBackgroundPaddingBottom'} value={textSettings && textSettings.textBackgroundPaddingBottom? textSettings.textBackgroundPaddingBottom : ''} numberType="int" maxlength="2"/>    
                            <IAMBaseInputNumber trigger={trigger} id={props.id + '_textBackgroundPaddingLeft'} value={textSettings && textSettings.textBackgroundPaddingLeft? textSettings.textBackgroundPaddingLeft : ''} numberType="int" maxlength="2"/>    
                        </span>
                    </div> 
                    <div className="_iamWindowHeading">
                        <span>{IAMTranslatorFactory.getMsg('Settings for Line Placement)')}</span>
                    </div> 
                    <div className="_iamWindowForm6col">
                        <IAMBaseInputNumber trigger={trigger} id={props.id + '_textMaxAngle'} value={textSettings && textSettings.textMaxAngle? textSettings.textMaxAngle : ''} numberType="float" maxlength="5" className="_iamWindowFormInput"  label="Max Angle (rad*PI)" />    
                        <IAMBaseInputCheck trigger={trigger} id={props.id + '_textOverflow'} value={textSettings && textSettings.texOverflow? textSettings.texOverflow : ''} label="Text Overflow" className="_iamWindowFormInput" />
                        <IAMBaseInputNumber trigger={trigger} id={props.id + '_textRepeat'} value={textSettings&& textSettings.textRepeat? textSettings.textRepeat : ''} numberType="int" maxlength="5"className="_iamWindowFormInput"  label="Text Repeat" />    
                    </div> 
                    <div className="_iamWindowFooter">
                        <button type="submit" className="_iamWindowFooterButton" id="_iam_settings_submit" >{IAMTranslatorFactory.getMsg('Save')}</button>
                        <span className="_iamWindowFooterButton" id="_iam_textSettings_cancel" onClick={handleCancel}>{IAMTranslatorFactory.getMsg('Cancel')}</span>
                    </div>
                </form>
            </div>    
        </div>
    );
}

/* provides a dialogue to display all settings. Via two tabs, the underlying feature type and level of the setting can be selected. All matching settings are displayed in a list. 
 * Alongside all stored settings, empty settings are displayed for attributes and feature that do net yeat have a setting specified. 
 * @param {Object} props - expected properties:
 *      - hideCallback: function to be invoked, when close or cancel button is clicked
 *      - updateMap: function to becalled to update map after setting has changed
 *      - toggleFeaturesSettings: boolean to indicate, whether dialogue should be displayed or not
 */
 function IAMSettingsDialogue(props) {
      
    const [featureType, setFeatureType] = useState(FeatureType.LINESTRING);
    const [levelType, setLevelType] = useState(FeatureSettings.LEVEL_STANDARD);
    
    const [toggleTextSettings,  setToggleTextSettings] = useState(false);
    const [toggleSettings,  setToggleSettings] = useState(false);

    const [currentSettings, setCurrentSettings]  = useState();

    /* returns setting selected by user for edit */
    const getCurrentSettings = () => {
        return currentSettings;
    };
    
    /* returns text setting of setting selected by user for edit */
    const getCurrentTextSettings = () => {
console.log(currentSettings);        
        return currentSettings? currentSettings.getTextSettings():undefined;
    };
    
    /* invoked, when an empty setting (not yet saved) should be edited */
    const handleAddClick = (settings) => {
        IAMData.getDatabase().addSetting(settings);
        setCurrentSettings(settings);
        setToggleSettings(true);
    };
    
    /* invoked, when an existing setting should be edited */
    const handleEditClick = (featureType, levelType, levelName, levelValue) => {
        const temp = IAMData.getDatabase().getSettings(featureType, levelType, levelName, levelValue);
        
        if (temp && temp.length > 0) {
            setCurrentSettings(temp[0]);
            setToggleSettings(true);
        }
    };
    
    /* returns a list of all settings, that match the feature type and level selected via the tabs. It includes empty settings for attributes/features, that do not yet have a setting */
    const getPreview = () => {
        
        let ret = [];
        const settings = IAMData.getDatabase().getSettings(featureType,levelType);

        settings.forEach((setting) => {
            ret = ret.concat(getSettingPreview (setting));
        });
        
        if (levelType === FeatureSettings.LEVEL_ATTRIBUTE) {
            //add empty settings for all attributes that do not have setting yet
            IAMData.getDatabase().getAllAttributeNames(featureType).forEach((attName) => {
                IAMData.getDatabase().getAllAttributeValues(featureType,attName).forEach((attVal) => {
                    const found = settings.find((setting) => setting.getLevelName() === attName && setting.getLevelValue() === attVal);
                    if (!found) {
                        const newSettings = getEmptySettings(attName,attVal);
                        ret = ret.concat(getSettingPreview (newSettings,true));

                    }
                });
                //check for hasChanged
                const found = settings.find((setting) => setting.getLevelName() === attName && setting.getLevelValue() === '_iam_hasChanged');
                if (!found) {
                    const newSettings = getEmptySettings(attName,'_iam_hasChanged');
                    ret = ret.concat(getSettingPreview (newSettings,true));
                } 
            });           
        }

        if (levelType === FeatureSettings.LEVEL_FEATURE) {
            //add empty settings for all features that do not have setting yet
            IAMData.getDatabase().getAllFeaturesWithType(featureType).forEach((feature) => {
                const found = settings.find((setting) => setting.getLevelName() === feature.getId());
                if (!found) {
                    const newSettings = getEmptySettings(feature.getId(),feature.getName());
                    ret = ret.concat(getSettingPreview (newSettings,true));
                }
            });
        }
        return ret;
    };
    
    /* returns an empty setting for the given levelName and levelValue. Feature/level type will be taken from the currently active tab */
    const getEmptySettings = (levelName, levelValue) => {
        const param = {
            levelType: levelType,
            levelName: levelName,
            levelValue: levelValue           
        };
    
        if (featureType === FeatureType.POINT) {
            return new PointSettings(param);
        }
        else if (featureType === FeatureType.LINESTRING) {
            return new LineStringSettings(param);
        }
        else {
            return new PolygonSettings(param);
        }
    };
    
    /* returns the DOM structure for the specified setting. Major attributes of the setting are displayed depending on the underlying feature type */
    const getSettingPreview = (setting, newSetting) => {
        const ret = [];
            const id = setting.getLevelName() + '_' + setting.getLevelValue();
            const name = getName(setting);
            ret.push(<span className="_iamWindowSettingsList_Content" key={id}>{name} </span>);
            ret.push(<span className="_iamWindowSettingsList_Content" key={id + '_showFeature'}>{setting.getShowFeature() !== undefined && <input readOnly={true} type="checkbox" checked={setting.getShowFeature()} id={name  + '_showFeature'}></input>} </span>);
            ret.push(<span className="_iamWindowSettingsList_Content" key={id + '_showText'}>{setting.getShowText() !== undefined && <input readOnly={true} type="checkbox" checked={setting.getShowText()} id={name  + '_showText'}></input>} </span>);
            
            const item4 = setting.getFeatureType() === FeatureType.POINT? 
                <span className={setting.pointFill? '_iamWindowSettingsList_Content_Color': '_iamWindowSettingsList_Content'} key={id + '_pointFill'} style={{backgroundColor: (setting.pointFill? setting.pointFill.toCSSHex ():'#FFFFFF')}}></span>
                : (setting.getFeatureType() === FeatureType.LINESTRING?
                <span className={(setting.lineBorder1 && setting.lineBorder1.color) ? '_iamWindowSettingsList_Content_Color': '_iamWindowSettingsList_Content'} key={id + '_lineBorder1_color'} style={{backgroundColor: (setting.lineBorder1.color? setting.lineBorder1.color.toCSSHex ():'#FFFFFF')}}></span>
                :
                <span className={setting.polygonFill? '_iamWindowSettingsList_Content_Color': '_iamWindowSettingsList_Content'} key={id + '_polygonFill'} style={{backgroundColor: (setting.polygonFill? setting.polygonFill.toCSSHex ():'#FFFFFF')}}></span>
            );
            ret.push(item4);
            
            const item5 = setting.getFeatureType() === FeatureType.POINT? 
                <span className="_iamWindowSettingsList_Content" key={id + '_pointShapeType'}>{setting.pointShapeType? IAMTranslatorFactory.getMsg(PointSettings.shapeNames[setting.pointShapeType]):''}</span>
                : (setting.getFeatureType() === FeatureType.LINESTRING?
                <span className={(setting.lineBorder2 && setting.lineBorder2.color) ? '_iamWindowSettingsList_Content_Color': '_iamWindowSettingsList_Content'} key={id + '_lineBorder2_color'} style={{backgroundColor: (setting.lineBorder2.color? setting.lineBorder2.color.toCSSHex ():'#FFFFFF')}}></span>
                :
                <span className={(setting.polygonBorder && setting.polygonBorder.color) ? '_iamWindowSettingsList_Content_Color': '_iamWindowSettingsList_Content'} key={id + '_polygonBorder_color'} style={{backgroundColor: (setting.polygonBorder.color? setting.polygonBorder.color.toCSSHex ():'#FFFFFF')}}></span>
            );
            ret.push(item5);
            
            const item6 = setting.getFeatureType() === FeatureType.POINT? 
                <span className="_iamWindowSettingsList_Content" key={id + '_pointRadius'}>{setting.pointRadius??''}</span>
                : (setting.getFeatureType() === FeatureType.LINESTRING?
                <span className="_iamWindowSettingsList_Content" key={id + '_lineBorder1_width'}>{(setting.lineBorder1 && setting.lineBorder1.width)??''}</span>
                :
                <span className="_iamWindowSettingsList_Content" key={id + '_polygonBorder_width'}>{(setting.polygonBorder && setting.polygonBorder.width)??''}</span>           
            );
            ret.push(item6);            
            
            ret.push(<span className="_iamWindowSettingsList_Content" key={id + '_edit'}><img className="_iamWindowSettingsList_Edit" onClick={newSetting? (e) => handleAddClick(setting) : (e) => handleEditClick(setting.getFeatureType(), setting.getLevelType(), setting.getLevelName(), setting.getLevelValue())} src={require('../img/buttonEdit.png')} alt="edit" title={IAMTranslatorFactory.getMsg("Edit")}/></span>);
        
        return ret;
    };
    
    /* returns DOM structure of settings table list */
    const getHeader = () => {
        return [
                <span key="_iamWindowSettingsList_Header_Name" className="_iamWindowSettingsList_Header">{IAMTranslatorFactory.getMsg('Name')}</span>,
                <span key="_iamWindowSettingsList_Header_Show" className="_iamWindowSettingsList_Header">{IAMTranslatorFactory.getMsg('Show')}</span>,
                <span key="_iamWindowSettingsList_Header_Label" className="_iamWindowSettingsList_Header">{IAMTranslatorFactory.getMsg('Label')}</span>,
                <span key="_iamWindowSettingsList_Header_Color" className="_iamWindowSettingsList_Header">{IAMTranslatorFactory.getMsg('Color')}</span>,
                <span key="_iamWindowSettingsList_Header_Item1" className="_iamWindowSettingsList_Header">{featureType === FeatureType.POINT? IAMTranslatorFactory.getMsg('Type'): (featureType === FeatureType.LINESTRING? IAMTranslatorFactory.getMsg('Color')+'2' : IAMTranslatorFactory.getMsg('Border Color'))}</span>,
                <span key="_iamWindowSettingsList_Header_Item2" className="_iamWindowSettingsList_Header">{featureType === FeatureType.POINT? IAMTranslatorFactory.getMsg('Radius'): (featureType === FeatureType.LINESTRING? IAMTranslatorFactory.getMsg('Width') : IAMTranslatorFactory.getMsg('Border Width'))}</span>,
                <span key="_iamWindowSettingsList_Header_Edit" className="_iamWindowSettingsList_Header">{IAMTranslatorFactory.getMsg('Edit')}</span>
        ];
    };
    
    return (
        <div>
            <div className="_iamWindow" id="_iam_window_settings" style={{display: props.toggleFeaturesSettings ? 'block' : 'none'}}> 
                <IAMWindowTitle windowTitle="Feature Settings Overview" hideCallback={props.hideCallback}/>
                <div className="_iamWindowBody">
                    <div className="_iamTabs">
                        <IAMTab id="_iamTab_point" handleClick={(e) => setFeatureType(FeatureType.POINT)} title="Point" toggle={featureType === FeatureType.POINT}/>
                        <IAMTab id="_iamTab_lineString" handleClick={(e) => setFeatureType(FeatureType.LINESTRING)} title="Line" toggle={featureType === FeatureType.LINESTRING}/>
                        <IAMTab id="_iamTab_polygon" handleClick={(e) => setFeatureType(FeatureType.POLYGON)} title="Polygon" toggle={featureType === FeatureType.POLYGON}/>
                    </div>
                    <div className="_iamTabContent">
                        <div className="_iamTabs">
                            <IAMTab id="_iamTab_standard" handleClick={(e) => setLevelType(FeatureSettings.LEVEL_STANDARD)} title="Standard" toggle={levelType === FeatureSettings.LEVEL_STANDARD}/>
                            <IAMTab id="_iamTab_standard" handleClick={(e) => setLevelType(FeatureSettings.LEVEL_ATTRIBUTE)} title="Attribute" toggle={levelType === FeatureSettings.LEVEL_ATTRIBUTE}/>
                            <IAMTab id="_iamTab_standard" handleClick={(e) => setLevelType(FeatureSettings.LEVEL_FEATURE)} title="Feature" toggle={levelType === FeatureSettings.LEVEL_FEATURE}/>
                        </div>            
                        <div className="_iamTabContent2">
                            <div>
                                <div className="_iamWindowSettingsList">
                                    {getHeader()}
                                    {getPreview()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> 
            
            <IAMSettingsEditDialogue
                toggleSettings={toggleSettings} 
                getCurrentSettings={getCurrentSettings}
                showTextSettings={(e) => setToggleTextSettings(true)} 
                hideCallback={(e) => setToggleSettings(false)}
                id="settings"
                updateMap={props.updateMap}
            />
            
            <IAMTextSettingsEditDialogue
                toggleTextSettings={toggleTextSettings} 
                getCurrentTextSettings={getCurrentTextSettings}
                hideCallback={(e) => setToggleTextSettings(false)}
                id="textSettings"
                updateMap={props.updateMap}
            />
        </div>            
    );
}
export {IAMSettingsDialogue}


/************************************************* Time Dialogue ******************************************************************/
/**
 * provides a dialogue to edit time related data such as start and end year of period, for which map should be displayed, simulation speed and whether the time bar at the bottom of the map should be displayed
 * @param {Object} props - expected properties:
 *      - getFromYear: function to retrieve the current start year value
 *      - getToYear: function to retrieve the current end year value 
 *      - simspeed: current sim speed value (ms waiting time, before next year is displayed)
 *      - showTimeBar: indicates, whether time bar should be displayed at the bottom of the map
*/
function IAMTimeSettings(props) {
    const [yearFrom, setYearFrom] = useState(props.getFromYear());
    const [yearTo, setYearTo] = useState(props.getToYear());
    const [simSpeed, setSimSpeed] = useState(props.simSpeed);
    const [showTimeBar, setShowTimeBar] = useState(props.showTimeBar);

    useEffect(() => {
        setYearFrom(props.getFromYear());
        setYearTo(props.getToYear());
        setSimSpeed(props.simSpeed);
        setShowTimeBar(props.showTimeBar);
    }, [props]);
         
    const handleSimSpeedChange = (e) => {
        setSimSpeed(parseInt(e.target.value));
    };
    
    function handleCancel(e) {
      e.preventDefault();
      props.hideCallback();
    }
   
    function handleSubmit(e) {
        e.preventDefault();
        props.setYear(yearFrom, yearTo);
        props.setSimSpeed(simSpeed);
        props.setShowTimeBar(showTimeBar);
        props.hideCallback();
    }

    return (
        <div className="_iamWindowBody">
            <form id="_iam_timeSettings_Form" onSubmit={handleSubmit}>
                <div className="_iamWindowHeading">
                    <span>{IAMTranslatorFactory.getMsg('Year Settings')}</span>
                </div>
                <div className="_iamWindowForm">
                    <IAMBaseInputNumber value={yearFrom?? ''} numberType="int" className="_iamWindowFormInput" label="Year from" handleChange={(e) => setYearFrom(parseInt(e.target.value))} id={'_iam_timeSettings_Form_yearFrom'}/>
                    <IAMBaseInputNumber value={yearTo?? ''} numberType="int" className="_iamWindowFormInput" label="Year to" handleChange={(e) => setYearTo(parseInt(e.target.value))} id={'_iam_timeSettings_Form_yearTo'}/>
                </div>
                <div className="_iamWindowHeading">
                    <span>{IAMTranslatorFactory.getMsg('Display Settings')}</span>
                </div>
                <div className="_iamWindowForm">
                    <IAMBaseInputCheck value={showTimeBar} className="_iamWindowFormInput" label="Show time bar" handleChange={(e) => setShowTimeBar(e.target.checked)} id={'_iam_timeSettings_Form_showTimeBar'}/>
                </div>
                <div className="_iamWindowHeading">
                    <span>{IAMTranslatorFactory.getMsg('Simulations Settings')}</span>
                </div>
                <div className="_iamWindowForm">
                    <IAMBaseSlider id='iam_timeSettings_simSpeed' value={simSpeed} className="_iamWindowFormInput" step={100} min={100} max={2000} label="Simulation speed" handleChange={handleSimSpeedChange}/>
                </div>
                <div className="_iamWindowFooter">
                    <span className="_iamWindowFooterButton" id="_iam_MapSettings_submit" onClick={handleSubmit}>{IAMTranslatorFactory.getMsg('Save')}</span>
                    <span className="_iamWindowFooterButton" id="_iam_MapSettings_cancel" onClick={handleCancel}>{IAMTranslatorFactory.getMsg('Cancel')}</span>
                </div>
            </form>
        </div>
    );
}

/**
 * provides a time bar at the bottom of the map. The current year can be changed be changed via a slider, in addition, the simulation can be started and stopped. The dialogue to edit the time related setting is included in this component.
 * After change of a value, the updatemap method propvided via the props will be used to update the map
 * @param {Object} props - expected properties:
 *      - toggleTimeSettings: boolean value to define whether edit dialogue should be displayed or not
 *      - hideCallback: will be invoked once cancel or close button of the time editing dialogue is pressed
 *      - getFromYear: function to retrieve the current start year from the master component
 *      - getToYear: function to retrieve the current end year from the master component
 *      - setYear: function to set updated year values in the master component
 *      - toggleTimeBar: boolean value to define whether time bar at the bottom should be displayed or not
 *      - trigger: boolean value to force re-rendering of the time bar
 *      - updateMap: function to update map. Will be invoked once a change in the values has occured
 *      - trigger: boolean value to force re-rendering of the time bar
*/    
function IAMTimeDialogue(props) {
    const [trigger, setTrigger] = useState(props.trigger);

    const year = useRef((new Date()).getFullYear());
    const minYear = useRef((new Date()).getFullYear());
    const maxYear = useRef((new Date()).getFullYear());
    
    const runSimulation = useRef(false);
    const simSpeed = useRef(500);

    const handleYearChange = (e) => {
        e.preventDefault();
        setNewYear(parseInt(e.target.value));
    };
    
    useEffect(() => { 
        year.current = (props.getToYear());
        minYear.current = IAMData.getDatabase().getAttributesMinimumYear()? parseInt(IAMData.getDatabase().getAttributesMinimumYear()) : (new Date()).getFullYear();
        maxYear.current = IAMData.getDatabase().getAttributesMaximumYear()? parseInt(IAMData.getDatabase().getAttributesMaximumYear()) : (new Date()).getFullYear();
        setTrigger((prev) => !prev);
    }, [props]);
   
    const startSimulation = () => {
        //only start simulation if not already running
        if (!runSimulation.current) {
            runSimulation.current = true;    
            runSim();
        }     
    };
    
    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    };

    const runSim = async()  => {      
        while (runSimulation.current) {
            if (parseInt(year.current)===parseInt(maxYear.current)) {
                setNewYear(minYear.current);
            }
            else {
                setNewYear(parseInt(year.current)+1);               
            }
            await sleep(parseInt(simSpeed.current));
        }        
    };
    
    const stopSimulation = () => {
        runSimulation.current = false;        
    };
    
    const setNewYear = (yearFrom,yearTo) => {
        year.current = yearTo? yearTo: yearFrom;
        props.setYear(yearFrom,yearTo? yearTo: yearFrom);
        setTrigger((prev) => !prev);
        if (props.updateMap) {
            props.updateMap();
        }
    };

    const setSimSpeed = (ms) => {
        simSpeed.current = parseInt(ms);
    };
    
    return (
        <div>
            <div id="_iam_window_timeSettings" className="_iamWindow" style={{display: props.toggleTimeSettings ? 'block' : 'none'}}> 
                    <IAMWindowTitle windowTitle="Edit Time Settings" hideCallback={props.hideCallback}/>
                    <IAMTimeSettings getFromYear={props.getFromYear} getToYear={props.getToYear} simSpeed={simSpeed.current} showTimeBar={props.toggleTimeBar} setSimSpeed={setSimSpeed} setYear={setNewYear} setShowTimeBar={props.setToggleTimeBar} hideCallback={props.hideCallback}/>
            </div>
            {year &&
                <div className="_iamTimeBar" style={{display: props.toggleTimeBar ? 'block' : 'none'}}>
                    <span className="_iamTimeBar_bar">
                        <IAMBaseSlider trigger={trigger} className="_iamTimeBar_bar_slider" id='_iamTimeTile_yearSlider' value={parseInt(year.current)} step={1} min={minYear.current} max={maxYear.current} handleChange={handleYearChange}/>
                    </span>
                    <span className="_iamTimeBar_bar">
                        <input readOnly={true} size="4" type="text" value={year.current}/>
                    </span>
                    <span className="_iamTimeBar_bar_buttons">
                        <span className="_iamTimeBar_button" title="Start simulation" onClick={startSimulation}>
                            <img className="_iamTimeBar_button_img" src={require('../img/buttonSimulation.png')} alt="start"/>
                        </span>
                        <span className="_iamTimeBar_button" title="Stop simulation" onClick={stopSimulation}>
                            <img  className="_iamTimeBar_button_img" src={require('../img/buttonSimulationStop.png')} alt="stop"/>
                        </span>
                    </span>
                </div>
            }

        </div>
    );
}
export {IAMTimeDialogue}


/************************************************* Feature Info ******************************************************************/
/**
 * provides a pop-up to display all properties and attributes of a feature. The logic when to display/close the pop-up has to be handled by the parent component
 * @param {Object} props - expected properties:
 *      - feature: the feature whose properties and attributes should be displayed
 *      - registerSetMethod: register functionality in parent component that allows the parent component to set the current feature. The function will be invoked upon each render of this component
*/
function IAMFeatureInfoDialogue (props) {
    const [feature, setFeature] = useState(props.feature);

    if (props.registerSetMethod) {
        props.registerSetMethod(setFeature);
    }
    
    /* provides a table with all attribute values of the specified attribute */ 
    const featureAttributesVals = (vals) => {
        return vals
            .sort(
                (a,b) => {
                    if (parseInt(a.getFromYear()) < parseInt(b.getFromYear())) {
                        return -1;
                    }
                    return 1;
                }
            )
            .map(
                (val) => {
                    return ([
                        <span className="_iamFeatureInfoListItem" key={val.getValue()}>{val.getValue()}</span>,
                        <span className="_iamFeatureInfoListItem" key={val.getValue() + '_from'}>{formatDate(val.getFromYear(),val.getFromMonth(),val.getFromDay())}</span>,
                        <span className="_iamFeatureInfoListItem" key={val.getValue() + '_dash'}>-</span>,
                        <span className="_iamFeatureInfoListItem" key={val.getValue() + '_to'}>{formatDate(val.getToYear(), val.getToMonth(),val.getToDay(), 'today')}</span>
                    ]);                    
                }
            );
    };

    /* provides a table with all attributes (including values) of the current feature */ 
    const featureAttributes = feature? 
        feature.getAttributesNames()
                .map(
                    (val) => {
                        return (
                            <div key={val}>
                                <div className="_iamFeatureInfoHeading2">
                                    <span>{val}</span>
                                </div>
                                <div className="_iamFeatureInfoList4Col" key={val}>
                               {featureAttributesVals(feature.getAttributes((attribute) => attribute.getName() === val))}
                                </div>
                            </div>
                        );
                    }
                )
        : [];

    /* provides a table with all properties of the current feature */ 
    const featureProperties = feature?
        Object.entries(feature.getProperties())
                .filter(
                    (val) => {
                        return val[0] !== '_iamAttributes';
                    }
                )
                .map(
                    (val) => {
                        return (val[0] !== 'name' && val[0] !== 'id' && !(!val[1] || val[1] === '') ) && ([
                            <span className="_iamFeatureInfoListItem" key={val[0]}>{val[0]}</span>,
                            <span className="_iamFeatureInfoListItem" key={val[1]}>{val[0] === 'length'? formatNumber(val[1]):val[1]}</span>
                        ]);
                    }
                )
        : []; 
        
    return (
            <div className="_iamFeatureInfo">
                <div className="_iamFeatureInfoHeading">
                    <span>{feature? feature.getName() : 'Properties'}</span>
                </div>
                <div className="_iamFeatureInfoList">
                {featureProperties}
                </div>
                {featureAttributes}
            </div>  
    );
}
export {IAMFeatureInfoDialogue}
    

/************************************************* Search Dialogue ******************************************************************/
/**
 * provides a dialogue to search for a feature. After each entry of a character into the search fielkd, the component searches for features that contain the entered charactes in their properties. Matching features will be displayed in a list (max 50)
 * for each matching feature, there is a link to focus the map on this feature. 
 * @param {Object} props - expected properties:
 *      - focusOnFeature: function to focus the map on the given feature
 *      - toggleSearch: boolean value to define whether edit dialogue should be displayed or not
 *      - hideCallback: will be invoked once cancel or close button of thedialogue is pressed
 */
function IAMSearchDialogue(props) {
    const [searchResults,setSearchResults] = useState(null);
    const [toggleCurrentFeature,setToggleCurrentFeature] = useState(false);
    
    let setFeatureMethod = useRef(null);

    const search = (e) => {
        e.preventDefault();
        setSearchResults(IAMData.getDatabase().search(e.target.value));
    };
    
    const showDetails = (e, feature) => {
        e.preventDefault();
        setFeatureMethod(feature);
        document.getElementById('_iam_window_search_featureInfo').style.left = (parseInt(e.clientX)+10) + 'px';
        document.getElementById('_iam_window_search_featureInfo').style.top = (parseInt(e.clientY)+10) + 'px';
        setToggleCurrentFeature(true);
    };
    
    const hideDetails = () => {
        setToggleCurrentFeature(false);        
    };
    
    const focusOnFeature = (e,feature) => {
        props.focusOnFeature(feature);
    };
    
    const registerSetFeatureMethod = (meth) => {
        setFeatureMethod = meth;
    };
    
    const resultList = 
         (searchResults && searchResults.length<50 && searchResults.length>0)? 
            searchResults.map(feature => {
                    return ([
                       <span className="_iamSearchResult" key={feature.getId() + '_type'}>{IAMTranslatorFactory.getMsg(FeatureType.geoJSONName[feature.getType()])}</span>,
                       <span className="_iamSearchResult" key={feature.getId() + '_name'} onMouseEnter={(e) => {showDetails(e,feature);}} onMouseLeave={hideDetails}>{feature.getName()} </span>,
                       <span className="_iamSearchResult" key={feature.getId() + '_link'}><button onClick={(e) => {focusOnFeature(e,feature);}}>{IAMTranslatorFactory.getMsg('Focus on map')}</button></span>
                    ]);
               })
            :
            (searchResults && searchResults.length>50)? 
                <span>{IAMTranslatorFactory.getMsg('Too many results')}</span>
                : 
                <span key="no result">{IAMTranslatorFactory.getMsg('No results')}</span>;
      
    return (
        <div>
            <div id="_iam_window_search" className="_iamWindow" style={{display: props.toggleSearch ? 'block' : 'none'}}> 
                <IAMWindowTitle windowTitle="Search" hideCallback={props.hideCallback}/>
                    <div className="_iamWindowBody">
                        <form id={"_iam_window_search_searchTerm"} >
                            <IAMBaseInput value="" className="_iamWindowFormInput" label="Search" onInput={search} id={'_iam_window_search_searchTerm_value'}/>
                        </form>
                        <div className="_iamWindowHeading">
                            <span>{IAMTranslatorFactory.getMsg('Search Results')}</span>
                        </div> 
                        <div className="_iamSearchResults">
                            {resultList}
                        </div>
                    </div>
            </div> 
            <div id="_iam_window_search_featureInfo" style={{display: toggleCurrentFeature ? 'block' : 'none'}} > 
                <IAMFeatureInfoDialogue registerSetMethod={registerSetFeatureMethod}/>
            </div> 
        </div>
     );
}
export {IAMSearchDialogue}


/************************************************* Chart Dialogue ******************************************************************/
/**
* provides a dialogue to draw charts based on the attributes of LineString features. It allows to define filter criteria (attribute name/values, time period), aggregation criteria (sum/count, point in time/time period) and diagram settings.
* Alongside the chart, the data displayed in the chart is provided in a table. The diagram can be downloaded as an image (png or jpeg) and the table can be copied to the clipboard in various formats (HTML, BB code, csv with tabs as separators to paste into Excel) 
* @param {Object} props - expected properties:
*      - toggleChart: boolean value to define whether edit dialogue should be displayed or not
*      - hideCallback: will be invoked once cancel or close button of the dialogue is pressed
*      - showMessage: function to display info message
*/
function IAMChartDialogue(props) {
    /* currently only digrams for LineStrings supported */
    const featureType = FeatureType.LINESTRING;
    
    const [resultSet,setResultSet] = useState();

    const [attributeName,setAttributeName] = useState('');
    const [attributeValues,setAttributeValues] = useState({});
    const [fromYear,setFromYear] = useState('');
    const [toYear,setToYear] = useState('');
    
    const [developing,setDeveloping] = useState('point in time');
    const [aggregation,setAggregation] = useState('sum');
    const [stackBars,setStackBars] = useState(true);
    const [selectAll,setSelectAll] = useState(true);

    let chart = useRef(null);
    
    const aggregationValues = [
        {id: 'sum', name: IAMTranslatorFactory.getMsg('sum')},
        {id: 'count', name: IAMTranslatorFactory.getMsg('count')}
    ];

    const developingValues = [
        {id: 'point in time', name: IAMTranslatorFactory.getMsg('point in time')},
        {id: 'time interval', name: IAMTranslatorFactory.getMsg('time interval')}
    ];

    /* invoked when attributeName selected */
    const selectedAttributeName = (e) => {
        e.preventDefault();
        if (e.target.value === '') {
            clear();
        }
        else {
            setAttributeName(e.target.value);
            /* for each attributeValue of selected attributeName, set filter to true */
            const settings = {};
            IAMData.getDatabase().getAllAttributeValues(featureType,e.target.value).forEach( (attValue) => {
                settings[attValue] = true;
            });
            setAttributeValues(settings);
        }
    };

    /* creates the chart */
    const createChart = (e) => {
        e.preventDefault();
        
        //no chart is displayed as long as no attribute name is specified
        if (attributeName === '') {
            return;
        }
        
        //get data based on filter and aggregation criteria
        let temp = IAMData.getDatabase().getAttributeAggregationPerYear (
                featureType, 
                attributeName, 
                [...Object.keys(attributeValues)].filter((col) => attributeValues[col]), 
                fromYear !== ''? parseInt(fromYear):undefined, 
                toYear!== ''? parseInt(toYear):undefined, 
                aggregation, 
                developing
        );
        setResultSet(temp);
        
        //options of chart
        const options = 
            stackBars? 
            {
                scales: {
                    x: {
                       stacked: true
                    },
                    y: {
                        stacked: true
                    }
                }
            }
            :
            {};
        
        //calculate data rows for chart
        const dataSets =[];
        const cols = [...Object.keys(attributeValues)].filter((col) => attributeValues[col]);
        cols.forEach((col) => {
            dataSets.push({
                label: col,
                data: temp.map ((dataItem) => {return roundNumber(parseFloat(dataItem[col]));})
                });                    
        });

        //if it exists, remove existing chart
        if (chart.current) { 
            chart.current.destroy();
        }
        
        //create new chart
        chart.current = new Chart(
            document.getElementById('_iam_window_chart_canvas'),
            {
              type: 'bar',
              data: {
                labels: temp.map( (dataItem) => {return dataItem.year;}),
                datasets: dataSets
              },
              options: options
            }
        );
    };
    
    //returns the DOM table structure of the data displayed in the chart
    const getDataTable = () => {
        if (resultSet) {

            const ret = [];
            const cols = [...Object.keys(attributeValues)].filter((col) => attributeValues[col]);

            ret.push(<span key="_iam_window_chart_year" className="_iamSearchResultHeader">{IAMTranslatorFactory.getMsg('Year')}</span>);
            ret.push(cols.map((col) => { return <span key={'_iam_window_chart_' + col} className="_iamSearchResultHeader">{col}</span>;}));
            resultSet.forEach( dataItem => {
                ret.push(<span key={'_iam_window_chart_year' + dataItem.year} className="_iamSearchResult">{dataItem.year}</span>);                  
                cols.forEach( attVal => {
                    ret.push(<span key={'_iam_window_chart_'+ attVal + '_' + dataItem.year} className="_iamSearchResult" >{formatNumber(dataItem[attVal])}</span>);                  
                });
            });          

           return ret;            
        }
    };
    
    //creates a screenshot of the chart and puts it into a download file
    const getScreenShot = (exportImageType) => {
        const exportOptions = {
          useCORS: true,
          allowTaint: true
        };
        
        html2canvas(document.getElementById('_iam_window_chart_canvas'), exportOptions).then(function (canvas) {
                download(
                    canvas.toDataURL('image/' + exportImageType),
                    'chart.' + exportImageType
                );
            });  
    };
    
    //copies the data in the specified data type structure from the table into the clipboard
    const getData = (dataType) => {
        //round values
        const temp = resultSet.map((item) => {
            [...Object.keys(attributeValues)].filter((col) => attributeValues[col]).forEach((colName) => {
                item[colName] = formatNumber(roundNumber(item[colName]));
            });
            return item;
        });
        
        const cols = ['year'].concat([...Object.keys(attributeValues)].filter((col) => attributeValues[col]));
        const colsHeader = [IAMTranslatorFactory.getMsg('Year')].concat([...Object.keys(attributeValues)].filter((col) => attributeValues[col]));
        navigator.clipboard.writeText(transform2Table(
                                        temp,
                                        cols,
                                        colsHeader,
                                        [],
                                        dataType));
        
        props.showMessage && props.showMessage(new ProcessResult(ProcessResult.INFO,IAMTranslatorFactory.getMsg('Table data copied to clipboard')));
    };
    
    //clears the filter criteria
    const clear = () => {
        setAttributeName('');
        setAttributeValues({});
    };
    
    //functionality to select/deselect all attribute values
    const de_selectAll = (e) => {
        setSelectAll((prev) => !prev);

        Object.keys(attributeValues).forEach((attVal) => {
            attributeValues[attVal] = !selectAll;
        });
    };
   
    //creates a checkbox input element for each attribuzte value of selected attribute
    const attNamesFilter = Object.keys(attributeValues).sort().map((attVal) => {
        return <IAMBaseInputCheck key={'_iam_window_chart_attributeValues_' + attVal} id={'_iam_window_chart_attributeValues_' + attVal} value={attributeValues[attVal]} handleChange={(e) => {attributeValues[attVal] = !attributeValues[attVal];}}  className="_iamWindowFormInput" label={attVal}/>;
    });
    
    return (
        <div className="_iamWindow" id="_iam_window_chart" style={{display: props.toggleChart ? 'block' : 'none'}}> 
            <IAMWindowTitle windowTitle="Chart view" hideCallback={props.hideCallback}/>
                <div className="_iamWindowBody">
                    <div className="_iamWindowHeading">
                        <span>{IAMTranslatorFactory.getMsg("Diagram filter & Properties")}</span>
                    </div> 
                        <div className="_iamWindowForm4col">
                            <IAMBaseSelect value={attributeName} handleChange={selectedAttributeName} values={IAMData.getDatabase().getAllAttributeNames(featureType)} className="_iamWindowFormInput" label="Attribute name" nullOption={true} id={'_iam_window_chart_attributeNames'}/>
                            <span className="_iamWindowFormInput">{IAMTranslatorFactory.getMsg('Attribute name')}</span>                        
                            <div className="_iamFlexibleDisplay" style={{ "--ItemPerRow": 10 }}>
                                <IAMBaseInputCheck value={selectAll} handleChange={de_selectAll}  className="_iamWindowFormInput" label="all" id={'_iam_window_chart_all'}/>
                                {attNamesFilter}
                            </div> 
                            <IAMBaseInputNumber value={fromYear} handleChange={(e) => {setFromYear(e.target.value);}} numberType="int"  maxlength="4" className="_iamWindowFormInput" label="From year" id={'_iam_window_chart_yearFrom'}/>
                            <IAMBaseInputNumber value={toYear} handleChange={(e) => {setToYear(e.target.value);}} numberType="int"  maxlength="4" className="_iamWindowFormInput" label="To year" id={'_iam_window_chart_yearTo'}/>
                            <IAMBaseSelect value={developing} handleChange={(e) => {setDeveloping(e.target.value);}} values={developingValues} className="_iamWindowFormInput" label="developing" nullOption={false} id={'_iam_window_chart_developing'}/>
                            <IAMBaseSelect value={aggregation} handleChange={(e) => {setAggregation(e.target.value);}} values={aggregationValues} className="_iamWindowFormInput" label="aggregation" nullOption={false} id={'_iam_window_chart_aggregation'}/>
                            <IAMBaseInputCheck value={stackBars} handleChange={(e) => {setStackBars((prev) => !prev);}}  className="_iamWindowFormInput" label="Stack bars" id={'_iam_window_chart_stackBars'}/>
                        </div> 
                    <div className="_iamWindowFooter">
                        <span className="_iamWindowFooterButton" id="_iam_window_table_search" onClick={createChart}>{IAMTranslatorFactory.getMsg('Show')}</span>
                        <span className="_iamWindowFooterButton" id="_iam_window_table_search" onClick={(e) => getScreenShot('jpeg')}>{IAMTranslatorFactory.getMsg('Diagram as JPEG')}</span>
                        <span className="_iamWindowFooterButton" id="_iam_window_table_search" onClick={(e) => getScreenShot('png')}>{IAMTranslatorFactory.getMsg('Diagram as PNG')}</span>
                        <span className="_iamWindowFooterButton" id="_iam_window_table_search" onClick={(e) => getData('html')}>{IAMTranslatorFactory.getMsg('Data as <html>')}</span>
                        <span className="_iamWindowFooterButton" id="_iam_window_table_search" onClick={(e) => getData('bb')}>{IAMTranslatorFactory.getMsg('Data as [BB]')}</span>
                        <span className="_iamWindowFooterButton" id="_iam_window_table_search" onClick={(e) => getData('tab')}>{IAMTranslatorFactory.getMsg('Data as Tab')}</span>
                    </div>  
                    
                    <div id="_iam_window_chart_chart">
                        <div className="_iamWindowHeading">
                            <span>{IAMTranslatorFactory.getMsg("Diagram")}</span>
                        </div> 
                        <div className="_iamWindowBody">
                            <canvas id="_iam_window_chart_canvas"/>
                        </div> 
                    </div>
                    
                    <div  >
                        <div className="_iamWindowHeading">
                            <span>{IAMTranslatorFactory.getMsg("Data")}</span>
                        </div> 
                        <div id="_iam_window_chart_data" className="_iamSearchResults4Col" style={{ "--ItemPerRow": ([...Object.keys(attributeValues)].filter((col) => attributeValues[col]).length +1) }}>
                        {getDataTable()}
                        </div> 
                    </div>
                </div>
        </div>
    );
}
export {IAMChartDialogue}


/************************************************* Table Dialogue ******************************************************************/
/**
* provides a dialogue to search attributes based on entered filter criteria. The result set is displayed in a table that can be downloaded in various formats. In addition, tehre is a link to focus the map on each feature of the result set
* @param {Object} props - expected properties:
*      - toggleTable: boolean value to define whether edit dialogue should be displayed or not
*      - hideCallback: will be invoked once cancel or close button of the dialogue is pressed
*      - focusOnFeature: function to focus the map on the given feature
*      - showMessage: function to display info message
* 
*/
function IAMTableDialogue(props) {
    const [attributeNames,setAttributeNames] = useState([]);
    const [attributeValues,setAttributeValues] = useState([]);
    
    const [featureType,setFeatureType] = useState('');
    const [attributeName,setAttributeName] = useState('');
    const [attributeValue,setAttributeValue] = useState('');
    const [fromYear,setFromYear] = useState('');
    const [toYear,setToYear] = useState('');

    const [searchResults,setSearchResults] = useState(null);
    const [sumLength,setSumLength] = useState(0);
    const [toggleCurrentFeature,setToggleCurrentFeature] = useState(false);
    
    let setFeatureMethod = useRef(null);

    const selectedFeatureType = (e) => {
        e.preventDefault();
        if (e.target.value === '') {
            clear();
        }
        else {
            setFeatureType(parseInt(e.target.value));
            setAttributeNames(IAMData.getDatabase().getAllAttributeNames(parseInt(e.target.value)));
            setAttributeValues([]);            
        }
    };

    const selectedAttributeName = (e) => {
        e.preventDefault();
        if (e.target.value === '') {
            clear();
        }
        else {
            setAttributeName(e.target.value);
            setAttributeValues(IAMData.getDatabase().getAllAttributeValues(featureType,e.target.value));
        }
    };

    const selectedAttributeValue = (e) => {
        e.preventDefault();
        if (e.target.value === '') {
            clear();
        }
        else {
            setAttributeValue(e.target.value);
        }
    };
    
    const enteredYearFrom = (e) => {
        e.preventDefault();
        if (e.target.value !== '') {
            setFromYear(parseInt(e.target.value));            
        }
        else {
            setFromYear(null);                        
        }
    };
    
    const enteredYearTo = (e) => {
        e.preventDefault();
        if (e.target.value !== '') {
            setToYear(parseInt(e.target.value));            
        }
        else {
            setToYear(null);                        
        }
    };
    
    const clear = () => {
        setFeatureType('');
        setAttributeName('');
        setAttributeValue('');
        setAttributeNames([]);
        setAttributeValues([]);
    };

    const search = (e) => {
        e.preventDefault();
        const resultSet = IAMData.getDatabase().getAllFeaturesWithAttributes (featureType, attributeName, attributeValue, fromYear, toYear);
        let sum = 0;
        const featureCol = 'Features';
        const attCol = 'FeaturesAttributes';
        setSearchResults(
            resultSet.map((row) => {
                sum += row[featureCol].getLength();
                return {
                    feature: row[featureCol],
                    name: row[featureCol].getName(),
                    length: formatNumber(row[featureCol].getLength(),2),
                    date: formatDate(row[attCol].getFromYear(), row[attCol].getFromMonth(), row[attCol].getFromDay()),
                    fromYear: row[attCol].getFromYear(),
                    fromMonth: row[attCol].getFromMonth(),
                    fromDay: row[attCol].getFromDay()
                };
            })
        );
        setSumLength(sum);
    };
    
    const sort = (col,order) => {
        const sorted = searchResults.sort( (x,y) => {
            const sign = order === 'desc'? -1:1;
            if (col === 'name') {
                return x.name.localeCompare(y.name) * sign;
            }
            else if (col === 'length') {
                return (parseFloat(x.length)-parseFloat(y.length)) * sign;
            }
            else if (col === 'date') {
                if (x.fromYear !== y.fromYear ) {
                    return (parseInt(x.fromYear) - parseInt(y.fromYear)) * sign;
                }
                else if (x.fromMonth !== y.fromMonth ) {
                    return (parseInt(x.fromMonth) - parseInt(y.fromMonth)) * sign;
                }
                else if (x.fromDay !== y.fromDay ) {
                    return (parseInt(x.fromDay) - parseInt(y.fromDay)) * sign;
                }
            }
            return 1;
        });   
        setSearchResults([...sorted]);      
    };
    
    const showDetails = (e, feature) => {
        e.preventDefault();
        setFeatureMethod(feature);
        document.getElementById('_iam_window_table_featureInfo').style.left = (parseInt(e.clientX)+10) + 'px';
        document.getElementById('_iam_window_table_featureInfo').style.top = (parseInt(e.clientY)+10) + 'px';
        setToggleCurrentFeature(true);
    };
    
    const hideDetails = () => {
        setToggleCurrentFeature(false);        
    };
    
    const focusOnFeature = (e,feature) => {
        props.focusOnFeature(feature);
    };
    
    const registerSetFeatureMethod = (meth) => {
        setFeatureMethod = meth;
    };
    
    const getHeader = () => {
        if (searchResults && searchResults.length>0) {
            return ([    
                        <span key="_iamSearchResultHeader_name" className="_iamSearchResultHeader">
                            <span key="_iamSearchResultHeader_name1">{IAMTranslatorFactory.getMsg('Name')}</span>
                            <img key="_iamSearchResultHeader_name2" src={require('../img/buttonAsc.png')} onClick={(e) => {sort('name','asc');}} alt="sort asc" title={IAMTranslatorFactory.getMsg('Sort ascending')}/>
                            <img key="_iamSearchResultHeader_name3" src={require('../img/buttonDesc.png')} onClick={(e) => {sort('name','desc');}} alt="sort desc" title={IAMTranslatorFactory.getMsg('Sort descending')}/>
                        </span>,
                        <span key="iamSearchResultHeader_length" className="_iamSearchResultHeader">
                            <span key="iamSearchResultHeader_length1">{IAMTranslatorFactory.getMsg('Length')}</span>
                            <img key="iamSearchResultHeader_length2" src={require('../img/buttonAsc.png')} onClick={(e) => {sort('length','asc');}} alt="sort asc" title={IAMTranslatorFactory.getMsg('Sort ascending')}/>
                            <img key="iamSearchResultHeader_length3" src={require('../img/buttonDesc.png')} onClick={(e) => {sort('length','desc');}} alt="sort desc" title={IAMTranslatorFactory.getMsg('Sort descending')}/>
                        </span>,
                        <span key="_iamSearchResultHeader_date" className="_iamSearchResultHeader">
                            <span key="_iamSearchResultHeader_date1">{IAMTranslatorFactory.getMsg('Date')}</span>
                            <img key="_iamSearchResultHeader_date2" src={require('../img/buttonAsc.png')} onClick={(e) => {sort('date','asc');}} alt="sort asc" title={IAMTranslatorFactory.getMsg('Sort ascending')}/>
                            <img key="_iamSearchResultHeader_date3" src={require('../img/buttonDesc.png')} onClick={(e) => {sort('date','desc');}} alt="sort desc" title={IAMTranslatorFactory.getMsg('Sort descending')}/>
                        </span>,
                        <span key="_iamSearchResultHeader_action" className="_iamSearchResultHeader">
                            <button key="_iamSearchResultHeader_action1" onClick={(e) => getData('html')}>&lt;html&gt;</button>
                            <button key="_iamSearchResultHeader_action2" onClick={(e) => getData('bb')}>[BB]</button>
                            <button key="_iamSearchResultHeader_action3" onClick={(e) => getData('tab')}>Tab</button>
                        </span>   
            ]);  
        }
    };
    
    const getData = (dataType) => {
        navigator.clipboard.writeText(transform2Table(
                                        searchResults,
                                        ['name','length','date'],
                                        [IAMTranslatorFactory.getMsg('Name'),IAMTranslatorFactory.getMsg('Length'),IAMTranslatorFactory.getMsg('Date')],
                                        ['',formatNumber(sumLength,2),''],
                                        dataType));
        props.showMessage && props.showMessage(new ProcessResult(ProcessResult.INFO,IAMTranslatorFactory.getMsg('Table data copied to clipboard')));
    };
    
    const resultList = (searchResults && searchResults.length>0) ?
        searchResults.map(result => {
            return ([
                <span className="_iamSearchResult" key={result.feature.getId() + '_name_' + result.fromYear}  onMouseEnter={(e) => {showDetails(e,result.feature);}} onMouseLeave={hideDetails}>{result.name}</span>,
                <span className="_iamSearchResult" key={result.feature.getId() + '_length_' + result.fromYear}>{result.length}</span>,
                <span className="_iamSearchResult" key={result.feature.getId() + '_date_' + result.fromYear}>{result.date}</span>,
                <span className="_iamSearchResult" key={result.feature.getId() + '_link' + result.fromYear}><button onClick={(e) => {focusOnFeature(e,result.feature);}}>{IAMTranslatorFactory.getMsg('Focus on map')}</button></span>
            ]);
        })
        : 
        <span key="no result">{IAMTranslatorFactory.getMsg('No results')}</span>;
    
    const getFooter = () => {
        if (searchResults && searchResults.length > 0) {
            return [
                    <span className="_iamSearchResultFooter" key="_iamSearchResultFooter1"></span>,
                    <span className="_iamSearchResultFooter" key="_iamSearchResultFooter2">{formatNumber(sumLength,2)}</span>,
                    <span className="_iamSearchResultFooter" key="_iamSearchResultFooter3"></span>,
                    <span className="_iamSearchResultFooter" key="_iamSearchResultFooter4"></span>                        
            ];
        }
    };
    
    return (
        <div>
            <div id="_iam_window_table" className="_iamWindow" style={{display: props.toggleTable ? 'block' : 'none'}}> 
                <IAMWindowTitle windowTitle="Table view" hideCallback={props.hideCallback}/>
                <div className="_iamWindowBody">
                    <form id={"_iam_window_table_form"} >
                        <div className="_iamWindowForm6col">
                            <IAMBaseSelect value={featureType} values={FeatureType.dropdown} handleChange={selectedFeatureType} className="_iamWindowFormInput" label="Feature type" nullOption={true} id={'_iam_window_table_featureType'}/>
                            <IAMBaseSelect value={attributeName} handleChange={selectedAttributeName} values={attributeNames} className="_iamWindowFormInput" label="Attribute name" nullOption={true} id={'_iam_window_table_attributeNames'}/>
                            <IAMBaseSelect value={attributeValue} handleChange={selectedAttributeValue} values={attributeValues} className="_iamWindowFormInput" label="Attribute value" nullOption={true} id={'_iam_window_table_attributeValues'}/>
                            <IAMBaseInputNumber value={fromYear} handleChange={enteredYearFrom} numberType="int"  maxlength="4" className="_iamWindowFormInput" label="From year" id={'_iam_window_table_yearFrom'}/>
                            <IAMBaseInputNumber value={toYear} handleChange={enteredYearTo} numberType="int"  maxlength="4" className="_iamWindowFormInput" label="To year" id={'_iam_window_table_yearTo'}/>
                        </div>
                    </form>
                </div>        
                <div className="_iamWindowFooter">
                    <span className="_iamWindowFooterButton" id="_iam_window_table_search" onClick={search}>{IAMTranslatorFactory.getMsg('Search')}</span>
                    <span className="_iamWindowFooterButton" id="_iam_window_table_cancel" onClick={props.hideCallback}>{IAMTranslatorFactory.getMsg('Cancel')}</span>
                </div> 

                <div className="_iamWindowBody">
                    <div className="_iamWindowHeading">
                        <span>{IAMTranslatorFactory.getMsg('Search Results')}</span>
                    </div> 
                </div>
                <div className="_iamWindowBody">

                    <div className="_iamSearchResults4Col" style={{ "--ItemPerRow": 4 }}>
                            {getHeader()}
                            {resultList}
                            {getFooter()}                       
                    </div>
                </div>        
            </div> 
            <div id="_iam_window_table_featureInfo" style={{display: toggleCurrentFeature ? 'block' : 'none'}} > 
                <IAMFeatureInfoDialogue registerSetMethod={registerSetFeatureMethod}/>
            </div> 
        </div>
     );
}
export {IAMTableDialogue}


/************************************************* Info Dialogue ******************************************************************/
/**
* provides a div to display Info, Warning and Error messages. Info messages will automatically disappear after 3s, Warning and Error messages have to be closed by the user
* @param {Object} props - expected properties:
*       - registerShowMsg: register method of parent component. This component registers its display method with the parent component. The parent component can then call the display method of this component  
*/
function IAMInfoDialogue(props) {
    
    const [toggle, setToggle] = useState(false);
    const [status, setStatus] = useState(1);
    const [text, setText] = useState(false);
    const [details, setDetails] = useState(null);

    const showMsg = (msg) => {
        setStatus(msg.status);
        setText(msg.text);
        setDetails(msg.details);
        setToggle(true);
        if (msg.status === ProcessResult.INFO) {
            setTimeout(() => {setToggle(false);},3000);            
        }
    };
    props.registerShowMsg(showMsg);

    const detailsList = details? details.map((val, index) => {
        return <li key={index}>{val}</li>;
    }) : '';
    
    return (
        <div className={status === ProcessResult.INFO? '_iam_info_msg' : (status === ProcessResult.WARN? '_iam_warning_msg':'_iam_error_msg')}  style={{display: toggle ? 'block' : 'none'}} id="_iam_window_info_msg">
            <p>{text}</p>
            <ul>
                {detailsList}
            </ul>
            {status !== ProcessResult.INFO && <p><span className="_iamWindowFooterButton" id="_iam_info_msg_ok" onClick={() => setToggle(false)}>OK</span></p>}
        </div>
    );
}
export {IAMInfoDialogue}