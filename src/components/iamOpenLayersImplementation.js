import React, {useState, useRef, useEffect} from "react";

/* for image export of map */
import html2canvas from 'html2canvas';

/*OpenLayers imports */
import {Map as OLMap, View, Feature} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {fromLonLat} from 'ol/proj';
import {OSM,Stamen,Vector, XYZ} from 'ol/source';
import {ScaleLine} from 'ol/control';
/*  This file provides the Open Layers implementation of the map */

import {Point,Polygon, LineString} from 'ol/geom';
import {ATTRIBUTION} from 'ol/source/OSM';

//for unique ids of layers
import { v4 as uuidv4 } from 'uuid';

import {IAMWindowTitle, IAMSideMenu, IAMFeatureInfoDialogue} from './iamDialogues';
import {IAMBaseInput, IAMBaseSlider, IAMBaseSelect, IAMBaseInputCheck} from './iamBaseComponents';
import {IAMTranslatorFactory, download, switchValues, deleteValue} from './iamBase';
import {IAMData} from './iamDataCollections'
import {FeatureType} from './iamDataCoreElements'

//possible values for scale line types
const scaleLineTypeValues = [
        {id: 'bar', name: IAMTranslatorFactory.getMsg('Bar')},
        {id: 'line', name: IAMTranslatorFactory.getMsg('Line')},
        {id: 'none', name: IAMTranslatorFactory.getMsg('None')}      
];

//possible values for scale line units
const scaleLineUnitsValues = [
        {id: 'metric', name: IAMTranslatorFactory.getMsg('Metric')},
        {id: 'imperial', name: IAMTranslatorFactory.getMsg('Imperial')},
        {id: 'degrees', name: IAMTranslatorFactory.getMsg('Degrees')},      
        {id: 'nautical', name: IAMTranslatorFactory.getMsg('Nautical')},
        {id: 'us', name: IAMTranslatorFactory.getMsg('US')}
];

//possible values for scale line steps
const scaleLineStepsValues = [
        {id: '3', name: '3'},
        {id: '4', name: '4'},      
        {id: '5', name: '5'},
        {id: '6', name: '6'}
];
    
/**
 * This component is used to edit general settings of the map. These include:
 *      - base layers to be used in the background including their order and opacity opacity
 *      - scale line: use or no use, type (line or bar), units (e.g. metric or imperial) and number of steps
 * Changes are directly reflected in the parent's component map
 * 
 * @param {Object} props - expected properties:      
 *      - trigger: boolean to define whether dialogue ishould be displayed or not 
 *      - getSettings: function to be called to retrieve the settings to be edited (scaleLineType, scaleLineUnits, scaleLineSteps, show feature information pop-up) 
 *      - getLayers: function to get the list of layers to be edited (only usage, opacity and order of layers can be edited. There is a separate component to add/remove layers
 *      - settingsChangedCallback: method to reflect the saved settings in the map. The changes in the settings are performed by the component itsself, but this component has no reference to the current ol.MAP in the parent component  
 *      - hideCallback: function to hide the window containing this component. Will be called when cancel button is pressed
 *      
 * This component directly updates the settings and calls the settingsChangedCallback method provided in the properties to update the ol.MAP accordingly.
 */
function IAMOLMapSettingsDialogue(props) {
   
    const [updateTrigger, setUpdateTrigger] = useState(false);
    
    const displayFeatureInfoChanged = (e) => {
        props.getSettings().displayFeatureInfo = e.target.checked;
        props.settingsChangedCallback(true,false);
    };
    
    const scaleLineTypeChanged = (e) => {
        props.getSettings().scaleLineType = e.target.value;
        props.settingsChangedCallback(true,false);
    };
    
    const scaleLineUnitsChanged = (e) => {
        props.getSettings().scaleLineUnits = e.target.value;
        props.settingsChangedCallback(true,false);
    };
    
    const scaleLineStepsChanged = (e) => {
        props.getSettings().scaleLineSteps = e.target.value;
        props.settingsChangedCallback(true,false);
    };
    
    const opacityChanged = (e,id) => {
        props.getLayers().filter((layer) => layer.id === id).forEach((layer) => layer.opacity = parseFloat(e.target.value));
        props.settingsChangedCallback(false,true);
    };
    
    const layerUseChanged = (e,id) => {
        props.getLayers().filter((layer) => layer.id === id).forEach((layer) => layer.use = e.target.checked);
        props.settingsChangedCallback(false,true);
    };
    
    const up = (id) => {
        const layers = props.getLayers();
        const oldIndex = layers.map((layer) => layer.id).indexOf(id);
        if (oldIndex > 0) {
            switchValues(layers, oldIndex, oldIndex-1);
        }
        setUpdateTrigger(!updateTrigger);
        props.settingsChangedCallback(false,true);
    };
    
    const down = (id) => {
        const layers = props.getLayers();
        const oldIndex = layers.map((layer) => layer.id).indexOf(id);
        if (oldIndex < layers.length-1) {
            switchValues(layers, oldIndex, oldIndex+1);
        }
        setUpdateTrigger(!updateTrigger);
        props.settingsChangedCallback(false,true);
    };
    
    const getLayersList = () => {
        if (props.getLayers()) {
            return props.getLayers().map((layer) => {
                return ([
                    <span key={layer.id + '_name'} className="_iamWindowFormInput">{layer.name}</span>,
                    <IAMBaseSlider key={layer.id + '_opacity'} id={layer.id + '_opacity'} value={layer.opacity} handleChange={e => opacityChanged(e,layer.id)} className="_iamWindowFormInput" step={0.1} min={0} max={1} />,
                    <IAMBaseInputCheck key={layer.id + '_use'} id={layer.id + '_use'} value={layer.use} handleChange={e => layerUseChanged(e,layer.id)} className="_iamWindowFormInput"/>,
                    <img key={layer.id + '_up'} src={require('../img/buttonAsc.png')} onClick={e => up(layer.id)} alt="up" title="Up"/>,
                    <img key={layer.id + '_down'} src={require('../img/buttonDesc.png')} onClick={e => down(layer.id)} alt="down desc" title="Down"/>
                ]);
            });
        }
    };
          
    return (
        <div id="_iam_window_map_settings" className="_iamWindow" style={{display: props.trigger ? 'block' : 'none'}}>
            <IAMWindowTitle windowTitle={"Edit map settings"} hideCallback={props.hideCallback}/>
            <div className="_iamWindowBody">
                    <div className="_iamWindowHeading">
                        <span id="_iam_MapSettings_layer_header">{IAMTranslatorFactory.getMsg('Layer Settings')}</span>
                    </div>
                    <div className="_iamSearchResults4Col" style={{ "--ItemPerRow": 5 }}>
                        {getLayersList()}
                    </div>                      
                     <div className="_iamWindowHeading">
                        <span id="_iam_MapSettings_scale_header">{IAMTranslatorFactory.getMsg('Scale Settings')}</span>
                    </div>               
                    <div className="_iamWindowForm">
                        <IAMBaseSelect id="_iam_MapSettings_scale_type" value={props.getSettings().scaleLineType} values={scaleLineTypeValues} className="_iamWindowFormInput" label="Scale Type" nullOption={false} handleChange={scaleLineTypeChanged} />
                        <IAMBaseSelect id="_iam_MapSettings_scale_units" value={props.getSettings().scaleLineUnits} values={scaleLineUnitsValues} className="_iamWindowFormInput" label="Units" nullOption={false} handleChange={scaleLineUnitsChanged} />
                        <IAMBaseSelect id="_iam_MapSettings_scale_label" value={props.getSettings().scaleLineSteps} values={scaleLineStepsValues} className="_iamWindowFormInput" label="Steps" nullOption={false} handleChange={scaleLineStepsChanged} />
                    </div>
                     <div className="_iamWindowHeading">
                        <span id="_iam_MapSettings_scale_header">{IAMTranslatorFactory.getMsg('Feature Info')}</span>
                    </div>               
                    <div className="_iamWindowForm">
                        <IAMBaseInputCheck id="_iam_MapSettings_display_featureInfo" value={props.getSettings().displayFeatureInfo} handleChange={displayFeatureInfoChanged} className="_iamWindowFormInput" label="Show"/>
                    </div>
            </div>
        </div>
    );
}


/*
 * This component can be used to export the map canvas (including scale line and attributions) to an jpeg- or png-image. The export uses the html2canvas library.
 * @param {Object} props - expected properties:      
 *      - trigger: boolean to define whether dialogue ishould be displayed or not 
 *      - hideCallback: function to hide the window containing this component. Will be called when cancel button is pressed
 *      - mapRef: reference to the ol.MAP which should be exported
 *      
 * When the export button is being pressed, the map canvas is exported into a temporary HTML-link for automatic download     
 */
function IAMOLMapExportDialogue(props) {
    const [exportFileName, setExportFileName] = useState('mapExport');
    const [exportImageType, setExportImageType] = useState('jpeg');
    const [useCORS, setUseCORS] = useState(true);
    const [allowTaint, setAllowTaint] = useState(true);
    
    //exports the map using the given file name, file type (jpeg or png) and export options (useCORS, allowTaint). For some layers and some export options an export might not be possible or will only produce exports without the base layer in the background
    const exportMap = (e) => {
        e.preventDefault();
        
        const exportOptions = {
          useCORS: useCORS,
          allowTaint: allowTaint,
          ignoreElements: function (element) {
            const className = element.className || '';
            return (
              className.includes('ol-control') &&
              !className.includes('ol-scale') &&
              (!className.includes('ol-attribution') /*||
                !className.includes('ol-uncollapsible')*/)
            );
          }
        };
        
        props.mapRef.once('rendercomplete', function() {
            html2canvas(props.mapRef.getViewport(), exportOptions).then(function (canvas) {
                download(
                    canvas.toDataURL('image/' + exportImageType),
                    exportFileName + '.' + exportImageType
                );
            });
        });
        props.mapRef.renderSync(); 
        props.hideCallback();
    };
    
    const fileTypes = [{name: 'JPEG', id: 'jpeg'},{name: 'PNG', id: 'png'}];
    
    return (
        <div id="_iam_window_map_export" className="_iamWindow" style={{display: props.trigger ? 'block' : 'none'}}>
            <IAMWindowTitle windowTitle="Export map to image file" hideCallback={props.hideCallback}/>
            <form id="_iam_MapExport_Form" onSubmit={exportMap}>
                <div className="_iamWindowBody">
                    <div className="_iamWindowForm">
                        <IAMBaseSelect id="_iam_MapExport_fileType" value={exportImageType} values={fileTypes} className="_iamWindowFormInput" label="Image type" nullOption={false} handleChange={(e) => setExportImageType(e.target.value)} />
                        <IAMBaseInput id="_iam_MapExport_fileName" value={exportFileName} handleChange={(e) => setExportFileName(e.target.value)} className="_iamWindowFormInput" label="File name"/>
                        <IAMBaseInputCheck id="_iam_MapExport_useCORS" value={useCORS} handleChange={(e) => setUseCORS(e.target.checked)} className="_iamWindowFormInput" label="Use CORS"/>
                        <IAMBaseInputCheck id="_iam_MapExport_allowTaint" value={allowTaint} handleChange={(e) => setAllowTaint(e.target.checked)} className="_iamWindowFormInput" label="Allow taint"/>
                    </div>
                </div>
                <div className="_iamWindowFooter">
                    <button className="_iamWindowFooterButton" id="_iam_MapExport_submit" type="submit">{IAMTranslatorFactory.getMsg('Export')}</button>
                    <span className="_iamWindowFooterButton" id="_iam_MapExport_cancel" onClick={props.hideCallback}>{IAMTranslatorFactory.getMsg('Cancel')}</span>
                </div>
            </form>
        </div>    
    );
}

/*
 * This component provides a user interface to create and deleted base layers based on ARCGIS REST services. The following attributes have to be specified for a base layer:
 *      - name: used to display in select menu for setting base layer in. Should thus be unique, an unique id is created internally using the current timestamp
 *      - sourceURL: the URL of the REST service including {z}/{x}/{y}, e.g. https://tile.opentopomap.org/{z}/{x}/{y}.png
 *      - key: optional individual key if the ARCGIS requires a key/token. Will be added to the end of the sourceURL as key={key}
 *      - attributions: the attributions to be displayed in the map; may contain html code  
 *      - crossOrigin: value of the HTML crossOrigin attribute. Depends on the ARCGIS REST service. If no value is specified, the canvas cannot be exported as it is tainted
 *      
 * @param {Object} props - expected properties:      
 *      - trigger: boolean to define whether dialogue ishould be displayed or not 
 *      - getLayers: function to get the list of layers to be edited (only adding of new layers and deleting of existing layers). There is a separate component to edit settings of the layers themselves
 *      - hideCallback: function to hide the window containing this component. Will be called when cancel button is pressed
 *
 * When the save button is clicked, the added and/or deleted base layers will be updated accordingly in the baseLayerList provided in the properties. Non-individual base layers, which are preset in the MapWrapper module (e.g. OSM) as well as layers currently being used in the map, cannot be deleted 
 */
function IAMOLMapLayerSettingsDialogue(props) {
    const [name, setName] = useState('');
    const [sourceURL, setSourceURL] = useState('');
    const [key, setKey] = useState('');
    const [attributions, setAttributions] = useState('');
    const [crossOrigin, setCrossOrigin] = useState('anonymous');
    
    const [updateTrigger, setUpdateTrigger] = useState(false);
        
    const layerType = 'individual';
    
    //invoked, when the add button is clicked -> adds a new base layer based on the entered attributes into the base layer list
    const addLayer = (e) => {
        e.preventDefault();
        //create new base layer
        props.getLayers().push({
            id: uuidv4(),
            type: layerType,
            use: false,
            opacity: 0.8,
            name: name,
            sourceURL: sourceURL,
            key: key,
            crossOrigin: crossOrigin ===''? undefined: crossOrigin,
            attributions: attributions
        });
        //update list
        setUpdateTrigger(!updateTrigger);

        //reset the entry fields to empty values
        setName('');
        setSourceURL('');
        setKey('');
        setAttributions('');
        setCrossOrigin('');
    };
    
    //invoked, when the delete button of an individual base layer is being pressed -> deletes the base layer from the list
    const deleteLayer = (e, layerId) => {
        e.preventDefault();
        const index = props.getLayers().map((layer) => layer.id).indexOf(layerId);
        deleteValue(props.getLayers(),index);  
        setUpdateTrigger(!updateTrigger);
        
    };
    
    //returns the dom element (button) to delete a layer. No button is returned for layers, which cannot be deleted (e.g. standard layers or layers currently being used in the map
    const deleteButton = (layer) => {
        if (layer.type === layerType && !layer.use) {
            return <span key={layer.id} className="_iamWindowFooterButton" onClick={(e) => deleteLayer(e,layer.id)}>{IAMTranslatorFactory.getMsg('Delete')}</span>;
        }
        else if (layer.use) {
            return <span key={layer.id} className="_iamWindowFormInput">{IAMTranslatorFactory.getMsg('in use')}</span>;
        }
        else {
            return <span key={layer.id} className="_iamWindowFormInput">{IAMTranslatorFactory.getMsg('standard')}</span>;
        }
    };
  
    //transforms the base layer list into an according HTML representation; note, that only individual base layers receive a delete button
    const getLayerList = () => {
        if (props.getLayers()) {
            return props.getLayers().map((layer) => {
                return [
                    <span key={layer.id+'_name'} className="_iamWindowFormInput">{layer.name}</span>,
                    deleteButton(layer)
                ];            
            });            
        }
    };
    
    return (
        <div id="_iam_window_map_layerSettings" className="_iamWindow" style={{display: props.trigger ? 'block' : 'none'}}>
            <IAMWindowTitle windowTitle="Edit map layers" hideCallback={props.hideCallback}/>
            <div className="_iamWindowBody">
                <div className="_iamWindowHeading">
                    <span>{IAMTranslatorFactory.getMsg('Available layers')}</span>
                </div>
                <div className="_iamSearchResults4Col" style={{ "--ItemPerRow": 2 }}>
                        {getLayerList()}
                </div>
                <div className="_iamWindowHeading">
                    <span>{IAMTranslatorFactory.getMsg('Add ARCGIS based layer')}</span>
                </div>
                <form id="_iam_MapLayerSettings_Form_Add" onSubmit={addLayer}>
                    <div className="_iamWindowForm4col">
                        <IAMBaseInput id="_iam_MapLayerSettings_name" value={name} handleChange={(e) => setName(e.target.value)} className="_iamWindowFormInput" label="Name of Layer"/>
                        <IAMBaseInput id="_iam_MapLayerSettings_url" value={sourceURL} handleChange={(e) => setSourceURL(e.target.value)} className="_iamWindowFormInput" label="Source URL"/>
                        <IAMBaseInput id="_iam_MapLayerSettings_key" value={key} handleChange={(e) => setKey(e.target.value)} className="_iamWindowFormInput" label="Key (if required)"/>
                        <IAMBaseInput id="_iam_MapLayerSettings_attributions" value={attributions} handleChange={(e) => setAttributions(e.target.value)} className="_iamWindowFormInput" label="Attributions"/>
                        <IAMBaseSelect id="_iam_MapLayerSettings_crossOrigin" value={crossOrigin} values={['anonymous','use-credentials']} className="_iamWindowFormInput" label="CrossOrigin" nullOption={true} handleChange={(e) => setCrossOrigin(e.target.value)} />
                    </div>
                    <div className="_iamWindowFooter">
                        <button className="_iamWindowFooterButton" id="_iam_MapLayerSettings_add" type="submit">{IAMTranslatorFactory.getMsg('Add')}</button>
                    </div>              
                </form>
            </div>
        </div>
    );
};


//defines the standard layers which can be used in the map. The user cannot edit the list of standard layers, but can add/delete individual layers
const standardOlLayers = new Map();
    standardOlLayers.set('osm', new TileLayer({source: new OSM() }));
    standardOlLayers.set('stamen_terrain',new TileLayer({source: new Stamen({layer: 'terrain-background'})}));
    standardOlLayers.set('stamen_toner',new TileLayer({source: new Stamen({layer: 'toner-background'})}) );
    standardOlLayers.set('orm',
        new TileLayer({
            title: 'OpenRailwayMap',
            visible: true,
            source : new XYZ({
                        attributions : [
                            ATTRIBUTION,
                            'Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap'
                        ],
                        url : 'http://{a-c}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
                        crossOrigin: null, //make it work inside canvas
                        tilePixelRatio: 2, //server returns 512px img for 256 tiles
                        maxZoom: 19, // XYZ's default is 18
                        opaque: true
            })
        })
);    

/**
 * returns a OL TileLayer for the given parameters (either the layer from the standard list or a new Object is being created based on the provided parameters)
 * @param {Object} layer - object with keys: 
 *      - type (mandatory, 'standard' or 'individual')
 *      - id (mandatory, only in case of standard layer)
 *      - crossOrigin (optional, only in case of individual layer)
 *      - attributions (mandatory, only in case of individual layer)
 *      - sourceURL (mandatory, only in case of individual layer)
 *      - key (optional, only in case of individual layer)
 *      
 * @returns {Object} OL TileLayer
 */
const getOlLayer = (layer) => {
    if (layer.type === 'standard') {
        return standardOlLayers.get(layer.id);
    }
    else {
        return new TileLayer({
                source: new XYZ({
                    crossOrigin: layer.crossOrigin?? undefined, 
                    attributions: layer.attributions,
                    url: layer.sourceURL + (layer.key !== ''? 'key=' + layer.key:'')
                })
        });
    }
};

/**
 * This component wraps a map based on OpenLayers for the use in the parent component IAMap by providing the following methods (this component registers these methods automatically with the parent component):
 *      - initMap: creates a map with the given map settings (base layer as background, scale line) and features (provided by the parent component) 
 *      - updateMap: updates the features on the map with the given features settings
 *      - getMapSettings: returns the map settings to the parent component to save them in a file
 *      - focusOnFeature: focusses the map on the given feature
 * 
 * @param {Object} props - must provide the following properties
 *          - registerInitMap: function to register this component's initMap method at the parent component
 *          - registerUpdateMap: function to register this component's updateMap method at the parent component 
 *          - registerMapSettingsMethod: function to register this component's updateMap method at the parent component
 *          - registerFocusOnFeatureMethod: function to register this component's focusOnFeature method at the parent component
 * @returns the DOM containing the map including all its features alongside the sub-components MapSettings, MapLayerSettings and MapExport to edit the map settings and to export the map into an image file
 * 
 */
function IAMOLMap(props) {
    //used for initialization of map canvas to avoid double rendering of map
    const ref = useRef(null);
    const mapRef = useRef(null);
    
    //scale line; const not possible as type of scale lione cannot be set directly, instead new scale line has to be created
    let scaleLine = useRef(null);
    
    //used for feature info pop up
    const currentFeature = useRef(null);
    let setFeatureMethod = useRef(null);
    
    //these are the ol.Vector to store all ol.Features
    const olPoints = useRef(null);
    const olLineStrings = useRef(null);
    const olPolygons = useRef(null);
    
    //toggles for the windows used for editing the map, map layer and map image export settings. Cannot be edited and are handled via the according show/hide-methods
    const [toggleMapSettings, setToggleMapSettings] = useState(null);
    const [toggleMapLayerSettings, setToggleMapLayerSettings] = useState(null);
    const [toggleMapExport, setToggleMapExport] = useState(null);  
    //info pop up for features
    const [toggleMapFeatureInfo, setToggleMapFeatureInfo] = useState(null);  

    //basic settings for the background layers as well as for the scale line. Can be edited via the MapSettings module
    const settings = useRef({
        scaleLineType: 'bar',
        scaleLineUnits: 'metric',
        scaleLineSteps: 4,
        displayFeatureInfo: true
    });

    //standard layers
    const layers = useRef([
        {
            id: 'osm',
            type: 'standard',
            use: true,
            opacity: 0.8,
            name: 'Open Street Maps'
        },
        {
            id: 'stamen_terrain',
            type: 'standard',
            use: false,
            opacity: 0.8,
            name: 'Stamen Terrain'
        },   
        {
            id: 'stamen_toner',
            type: 'standard',
            use: false,
            opacity: 0.8,
            name: 'Stamen Toner'
        },
        {
            id: 'orm', 
            type: 'standard',
            use: false,
            opacity: 0.8,
            name: 'OpenRailwayMap' 
        }
    ]);
    
    //initializes the map with an OSM layer centered to [0,0] and zoom level 1 (in other words: the world map). 
    //The two references are required as the map would be displayed twice otherwise due to the REACT rendering algorithm (see https://stackoverflow.com/questions/73441404/open-layer-renders-map-component-twice-in-react)
    useEffect(() => {
        if (ref.current && !mapRef.current) {
            mapRef.current = new OLMap({
              target: ref.current
            });
            _layerSettingsChanged();
            _centerMap();
            
            const showFeatureInfo = (pixel, target) => {
                const feature = target.closest('.ol-control')
                  ? undefined
                  : mapRef.current.forEachFeatureAtPixel(pixel, function (feature) {
                      return feature;
                    }, {hitTolerance: 2});
                if (feature && settings.current.displayFeatureInfo) {
                    //adjust pixel
                    document.getElementById('_iam_window_map_featureInfo').style.left = Math.floor(pixel[0]) + 'px';
                    document.getElementById('_iam_window_map_featureInfo').style.top = Math.floor(pixel[1]) + 'px';
                    if (feature !== currentFeature) {
                        setFeatureMethod(feature.get('_iamFeature')); 
                    }
                    showMapFeatureInfo();
                }
                else {
                    hideMapFeatureInfo();
                }
                currentFeature.current = feature;
            };
    
            mapRef.current.on('pointermove', function (evt) {
                if (evt.dragging) {
                    hideMapFeatureInfo();
                    currentFeature.current = undefined;
                    return;
                }
                const pixel = mapRef.current.getEventPixel(evt.originalEvent);
                showFeatureInfo(pixel, evt.originalEvent.target);
            });
            
            mapRef.current.on('click', function (evt) {
                showFeatureInfo(evt.pixel, evt.originalEvent.target);
            });

            mapRef.current.getTargetElement().addEventListener('pointerleave', function () {
                hideMapFeatureInfo();
                currentFeature.current = undefined;
            });
        }
    }, [ref, mapRef, settings.current.displayFeatureInfo]);
    
    //updates the map (layer and scale line) based on the current settings
    const settingsChanged = (settingsChanged,layersChanged) => {
        if (layersChanged) {
            _layerSettingsChanged();            
        }
        if (settingsChanged) {
            _updateScaleLine();              
        }
    };
    
    //updates scale line
    const _updateScaleLine = () => {
        if (scaleLine.current) {
            mapRef.current.removeControl(scaleLine.current);  
        }
        if (settings.current.scaleLineType !== 'none') {
            scaleLine.current = new ScaleLine({
                    units: settings.current.scaleLineUnits,
                    bar: settings.current.scaleLineType === 'bar'? true:false,
                    steps: settings.current.scaleLineSteps
            });
            mapRef.current.addControl(scaleLine.current); 
        }        
    };
    
    //update layers
    const _layerSettingsChanged = () => {
        const toDelete = [];
        mapRef.current.getLayers().forEach((layer) => {
            if (layer && !layer.get('id')) {
                toDelete.push(layer);                
            }
        });
        toDelete.forEach((layer) => {
            mapRef.current.removeLayer(layer);
        });
        layers.current.forEach((layer) => {
           if (layer.use) {
               mapRef.current.getLayers().insertAt(0,getOlLayer(layer));
               mapRef.current.getLayers().item(0).setOpacity(layer.opacity);
           } 
        });
    };
    
    //centers and fits the map based on the given parameters. If no parameters are specified, map is centered ad longitude/latitude 0/0 and zoom level 1
    const _centerMap = (params) => {
        if (params) {
            mapRef.current.getView().fit(
                    new LineString([
                           fromLonLat([
                               params.minX,
                               params.minY
                           ]),
                           fromLonLat([
                               params.maxX,
                               params.maxY
                           ])],
                       'XY'),
                       {padding: [50, 50, 50, 50]}
            );   
        }
        else {
            mapRef.current.setView(new View({ center: [0, 0], zoom: 1 }));
        }
    };
    
    //methods to show and hide the sub-component showing feature info     
    const showMapFeatureInfo = () => {
        setToggleMapFeatureInfo(true);
    };
  
    const hideMapFeatureInfo = () => {
        setToggleMapFeatureInfo(false);
    };
    
    const addFeatures = (features, olList, fromYear, toYear) => {
        features.forEach( (feature) =>  {
            const olFeature = new Feature({
                geometry: 
                    (feature.getType() === FeatureType.POINT)? 
                        new Point(fromLonLat(feature.getCoordinates())) :
                        ((feature.getType() === FeatureType.LINESTRING)?
                            new LineString(feature.getCoordinates().map( (val) => fromLonLat(val))) :
                            new Polygon([feature.getCoordinates()[0].map( (val) => fromLonLat(val))])        
                        )        
            });
            olFeature.set('_iamFeature',feature);
            const style = IAMData.getDatabase().getSettingsOfFeature(feature.getType(), feature.getId(), fromYear, toYear);
            style && olFeature.setStyle(style.toOLStyle(feature.getName()));
            olList.addFeature(olFeature);
        });
    };
    
    /*
     * This method will be called by the parent component IAMMap whenever a new set of features was loaded. If the features settings change, the updateMap method will be called.
     * The parent component provides the following parameters:
     *      - fromYear: optional start year of the time frame that the map should display. Use this parameter to get time-specific settings from the featuresSettings
     *      - toYear: optional end year of the time frame that the map should display. Use this parameter to get time-specific settings from the featuresSettings
     *      - mapSettings: optional settings of the map. This parameter contains exactly the values provided by the getMapSettings() method of this component
     *      
     * If mapSettings are specified, the settings of the map are updated accordingly. 
     * Afterwards all features provided in the parameter features are added to the map using three different layers (one layer for each feature type: Point, LineString, Polygon).
     * The style for display of each feature is taken from the feature settings provided in the parameter featuresSettings taking the fromYear and toYear values into account. If no settings are found, the standard ol settings are being used for display
     * Finally the map is being centered and zoomed in using the min and max longitudes/latitudes of the features
     */
    const initMap = (mapSettings, fromYear, toYear) => {
        //remove any existing layers
        // if settings are provided, do set them
        mapRef.current.setLayers([]);
        if (mapSettings) {
            if (mapSettings.settings) {
                settings.current = mapSettings.settings;
                settingsChanged(true,false);      
            }
            if (mapSettings.layers) {
                layers.current = mapSettings.layers;
                settingsChanged(false,true);                
            }
        }
        //if no layers in map settings specified, use standard
        if ( mapRef.current.getLayers().getLength()===0) {
            _layerSettingsChanged();
        }
        
        //init points
        olPoints.current = new Vector();
        addFeatures(
                IAMData.getDatabase().getAllFeaturesWithType(FeatureType.POINT), 
                olPoints.current,
                fromYear,
                toYear);

        //init lineStrings
        olLineStrings.current = new Vector(); 
        addFeatures(
                IAMData.getDatabase().getAllFeaturesWithType(FeatureType.LINESTRING), 
                olLineStrings.current,
                fromYear,
                toYear);
        
        //init polygons
        olPolygons.current = new Vector(); 
        addFeatures(
                IAMData.getDatabase().getAllFeaturesWithType(FeatureType.POLYGON), 
                olPolygons.current,
                fromYear,
                toYear);
        
        //add layers
        mapRef.current.addLayer(new VectorLayer({id: '_iam_LineStrings', source: olLineStrings.current}));
        mapRef.current.addLayer(new VectorLayer({id: '_iam_Polygons',source: olPolygons.current}));
        mapRef.current.addLayer(new VectorLayer({id: '_iam_Points',source: olPoints.current}));
        
        //center and fit map
        _centerMap({
            minX: IAMData.getDatabase().getMinLongitude(),
            minY: IAMData.getDatabase().getMinLatitude(),
            maxX: IAMData.getDatabase().getMaxLongitude(),
            maxY: IAMData.getDatabase().getMaxLatitude()
        });
    };
    //register method at parent component
    props.registerInitMap(initMap);
    
    /*
     * This method will be called by the parent component IAMMap whenever settings (feature settings or time settings) have changed.
     * The parent component provides the following parameters:
     *      - fromYear: optional start year of the time frame that the map should display. Use this parameter to get time-specific settings from the featuresSettings
     *      - toYear: optional end year of the time frame that the map should display. Use this parameter to get time-specific settings from the featuresSettings
     *  
     * The method retrieves the settings for each feature by using the provided featuresSettings, fromYear and toYear parameters and applies them to the style of each feature.
     * If no settings are found for one feature, the style of the feature is not being updated.         
     */
    const updateMap = (fromYear, toYear) => {

        olPoints.current.forEachFeature((olPoint) => {
            const style = IAMData.getDatabase().getSettingsOfFeature(FeatureType.POINT, olPoint.get('_iamFeature').getId(), fromYear, toYear);
            style && olPoint.setStyle(style.toOLStyle(olPoint.get('_iamFeature').getName()));               
        });
        
        olLineStrings.current.forEachFeature((olLineString) => {
            const style = IAMData.getDatabase().getSettingsOfFeature(FeatureType.LINESTRING, olLineString.get('_iamFeature').getId(), fromYear, toYear);
            style && olLineString.setStyle(style.toOLStyle(olLineString.get('_iamFeature').getName())); 
        });
        
        olPolygons.current.forEachFeature((olPolygon) => {
            const style = IAMData.getDatabase().getSettingsOfFeature(FeatureType.POLYGON, olPolygon.get('_iamFeature').getId(), fromYear, toYear);
            style && olPolygon.setStyle(style.toOLStyle(olPolygon.get('_iamFeature').getName()));               
        });
    };
    //register method at parent component
    props.registerUpdateMap(updateMap);
   
    /*
     * This method will be called by the parent component if the settings are being saved to the file. The method provides an object with all necessary map settings.
     * The parent component will store it in the saved settings file using JSON. Upon load of the settings file, the parent component will provide the saved map settings 
     * via the initMap()-method parameter mapSettings. 
     */
    const getMapSettings = () => {
        return {
            settings : settings.current,
            layers: layers.current
        };
    };
    //register method at parent component
    props.registerMapSettingsMethod(getMapSettings);
    
    const registerSetFeatureMethod = (meth) => {
        setFeatureMethod = meth;
    };
    
    //focusses the map on the given feature
    const focusOnFeature = (feature) => {
        if (feature) {
            const delta = 0.002;
            _centerMap({
                minX: feature.getMinLongitude()- ((feature.getType() === FeatureType.POINT)? delta: 0),
                minY: feature.getMinLatitude()- ((feature.getType() === FeatureType.POINT)? delta: 0),
                maxX: feature.getMaxLongitude()+ ((feature.getType() === FeatureType.POINT)? delta: 0),
                maxY: feature.getMaxLatitude()+ ((feature.getType() === FeatureType.POINT)? delta: 0)
            });              
        }
    };   
    props.registerFocusOnFeatureMethod(focusOnFeature);
    
    //returns the current settings
    const _getSettings = () => {
        return settings.current;
    };
    
    //returns the current layers list
    const _getLayers = () => {
        return layers.current;
    };
    
    return (
        <div ref={ref} className="map-container">

            <IAMSideMenu
                id="_iamSideMenuTile_MapSettings"
                tiles={[
                    {imgName: 'buttonMapSettings.png', title: 'Edit map settings', handleClick: (e) => {setToggleMapSettings(true);}},
                    {imgName: 'buttonMapFoto.png', title: 'Export map to image file', handleClick: (e) => {setToggleMapExport(true);}},
                    {imgName: 'buttonMapSettingsEdit.png', title: 'Edit map layers', handleClick: (e) => {setToggleMapLayerSettings(true);}}                    
                ]}
            />

            <IAMOLMapSettingsDialogue 
                trigger={toggleMapSettings} 
                settingsChangedCallback={settingsChanged} 
                hideCallback={(e) => setToggleMapSettings(false)} 
                getSettings={_getSettings} 
                getLayers={_getLayers}
            />
            
            <IAMOLMapExportDialogue 
                trigger={toggleMapExport} 
                hideCallback={(e) => setToggleMapExport(false)} 
                mapRef={mapRef.current}
            />
            
            <IAMOLMapLayerSettingsDialogue 
                trigger={toggleMapLayerSettings} 
                hideCallback={(e) => setToggleMapLayerSettings(false)} 
                getLayers={_getLayers}
            />
            
            <div id="_iam_window_map_featureInfo" style={{display: toggleMapFeatureInfo ? 'block' : 'none'}} > 
                <IAMFeatureInfoDialogue registerSetMethod={registerSetFeatureMethod}/>
            </div> 
            
        </div>
    );
}
export {IAMOLMap}