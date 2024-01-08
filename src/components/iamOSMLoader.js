import {FileLoader, ProcessResult, _parseCsv,IAMData} from './iamDataCollections';
import {FeatureType,ExtendedFeature} from './iamDataCoreElements'

class OSMEnhancer {
    csvFile;
    features;
    
    constructor(csvFile) {
        this.csvFile = csvFile;
    }
    
    async loadOSM () {
        const fl = new FileLoader(this.csvFile);
        await fl.init();
        
        const pr = new ProcessResult(ProcessResult.INFO,'Enhancing OSM data');
        const parseResult = _parseCsv(
            fl.loadData (),
            { 
                headers: true, 
                headerTemplate: ['Type','Id','Name','longitude','latitude']
            }, 
            pr,
            () => true
        );
console.log(IAMData.getDatabase().getAllFeatures().length);
        parseResult.forEach((attribute) => {
            //console.log(attribute);
            if (attribute.Type ==='new') {
                const feature = new ExtendedFeature({
                    type: FeatureType.POINT,
                    id: attribute.Id,
                    coordinates: [parseFloat(attribute.longitude),parseFloat(attribute.latitude)]
                });
                IAMData.getDatabase()._features.addItem(feature);
                //console.log(feature);
            }
            else {
                const extFeature = IAMData.getDatabase().getFeature(FeatureType.POINT, attribute.Id);
                if (extFeature) {
                    extFeature.getProperties()['_iam_name'] = attribute.Name;
                }
                else {
                    console.log('WARNING! ' + attribute.Id + ' not found');
                }
                
            }
        });    
console.log(IAMData.getDatabase().getAllFeatures().length);
    }    
}
export {OSMEnhancer}

