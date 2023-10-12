import React, {useState, useEffect} from "react";

import {Border} from './iamDataCoreElements';
import {IAMTranslatorFactory} from './iamBase'

const createLabel = (props) => {
    if (props.label) {
        return (<label className={props.className} htmlFor={props.id}>{IAMTranslatorFactory.getMsg(props.label)?? props.label}</label>);
    }  
};

/*
 * This file contains basic components used in dialogues. Standard input types are wrapped into React components for easier usage within dialogues.
 */
function IAMBaseInputComponent(props) {
    const [value, setValue] = useState(props.value && props.value !== ''? props.value : '');

    //used to update value, if value has changed from outside
    useEffect(() => {
        setValue(props.value);
    }, [props.value, props.trigger]); 
    
    //handles onchange event
    const handleChange = (e) => {
        e.preventDefault();
        if (props.checkValue && !props.checkValue(e)) {
            return;
        }
        setValue(e.target.value);                        
        props.handleChange && props.handleChange(e);
    };

    return (
        <>
            {createLabel(props)}
            <input 
                className={props.className} 
                id={props.id} 
                type={props.type} 
                value={value} 
                onChange={(e) => handleChange(e)} 
                onInput={props.onInput && props.onInput} 
                maxLength={props.maxlength && props.maxlength} 
                size={props.maxlength && props.maxlength}
                step={props.step && props.step} 
                min={props.min && props.min} 
                max={props.max && props.max} 
            />
        </>
    );
}

/**
 * Wraps an HTML input element 
 * 
 * @param {Object} props: properties for input HTML element:
 *      - id {String}: mandatory - has to contain unique id for HTML element
 *      - className {String}: mandatory - css class name to be used for HTML element
 *      - type {String}: mandatory - HTML type of input field (e.g. text)
 *      - value {String}: mandatory - value of input field (content of input field)
 *      - label {String}: optional - text for label of input field (no label displayed, if value is undefined)
 *      - handleChange {function}: optional - function will be called, when value of input field has changed. Event of the change will be passed as a parameter
 *      - trigger {boolean}: optional - can be used to update value, if value has changed from outside. If trigger value changes, the value of the input field is updated with the value from the properties
 *      - onInput {function}: optional - called upon oninput event
 *      - maxLength {Number}: optional - maxLength and size of input element
 *      - accept {String}: optional - accepted file types
 */
function IAMBaseInput(props) {
    return (
        <IAMBaseInputComponent
            className={props.className && props.className} 
            id={props.id && props.id} 
            type={props.type? props.type : 'text'} 
            value={props.value && props.value !== '' ?  props.value : ''} 
            label = {props.label && props.label}
            handleChange={props.handleChange && props.handleChange}
            trigger={props.trigger && props.trigger}
            onInput={props.onInput && props.onInput} 
            maxLength={props.maxlength && props.maxlength} 
            size={props.maxlength && props.maxlength}
            accept={props.accept && props.accept}
            Ref={props.Ref && props.Ref}
        />
    );
}
export {IAMBaseInput}


/**
 * Wraps an HTML input element for numbers. Entered values are automatically checked for valid numbers
 * 
 * @param {Object} props: properties for input HTML element:
 *      - id {String}: mandatory - has to contain unique id for HTML element
 *      - className {String}: mandatory - css class name to be used for HTML element
 *      - numberType {String}: mandatory - 'float' or 'int'; used for validation of entered value
 *      - value {String}: mandatory - value of input field (content of input field)
 *      - label {String}: optional - text for label of input field (no label displayed, if value is undefined)
 *      - handleChange {function}: optional - function will be called, when value of input field has changed. Event of the change will be passed as a parameter
 *      - trigger {boolean}: optional - can be used to update value, if value has changed from outside. If trigger value changes, the value of the input field is updated with the value from the properties
 *      - maxLength {Number}: maxLength and size of input element
 */
 function IAMBaseInputNumber(props) {
    const checkValue = (e) => {
        e.preventDefault();
        if (e.target.value !== '' && props.numberType === 'float' && isNaN(parseFloat(e.target.value)) ) {
            alert(IAMTranslatorFactory.getMsg('Please insert a valid float number into field ') + IAMTranslatorFactory.getMsg(props.label));
            return false;
        }
        if (e.target.value !== '' && props.numberType === 'int' && isNaN(parseInt(e.target.value)) ) {
            alert(IAMTranslatorFactory.getMsg('Please insert a valid integer number into field ') + IAMTranslatorFactory.getMsg(props.label));
            return false;
        }
        return true;
    };
 
    return (
        <IAMBaseInputComponent
            className={props.className && props.className}
            id={props.id && props.id} 
            numberType={(props.numberType && (props.numberType === 'float' || props.numberType === 'int'))? props.numberType : 'int'}
            type="text" 
            value={props.value && props.value !== '' ?  props.value : ''} 
            label = {props.label && props.label}
            handleChange={props.handleChange && props.handleChange}
            trigger={props.trigger && props.trigger}
            maxLength={props.maxlength && props.maxlength} 
            size={props.maxlength && props.maxlength}
            checkValue={checkValue}
        />
    );
}
export {IAMBaseInputNumber}


/**
 * Wraps an HTML input field of type range (slider)
 * 
 * @param {Object} props: properties for input HTML element:
 *      - id {String}: mandatory - has to contain unique id for HTML element
 *      - className {String}: mandatory - css class name to be used for HTML element
 *      - value {String}: mandatory - selected value 
 *      - label {String}: optional - text for label of input field (no label displayed, if value is undefined)
 *      - handleChange {function}: optional - function will be called, when value of input field has changed. Event of the change will be passed as a parameter
 *      - trigger {boolean}: optional - can be used to update value, if value has changed from outside. If trigger value changes, the value of the input field is updated with the value from the properties
 *      - step {number}: optional - steps of the slider; if not specified, it will be set to 0.1
 *      - min {number}: optional - minimum value of the slider; if not specified, it will be set to 0
 *      - max {number}: optional - maximum value of the slider; if not specified, it will be set to 1
*/
 function IAMBaseSlider(props) {
    
    return (
        <IAMBaseInputComponent
            className={props.className && props.className}
            id={props.id && props.id} 
            type="range" 
            value={props.value && props.value !== '' ?  props.value : false} 
            label = {props.label && props.label}
            handleChange={props.handleChange && props.handleChange}
            trigger={props.trigger && props.trigger}
            step={props.step??'0.1'} 
            min={props.min??'0'} 
            max={props.max??'1'} 
        />
    );
}
export {IAMBaseSlider}


/**
 * Wraps an HTML input element with type checkbox
 * 
 * @param {type} props: properties for input HTML element:
 *      - id {String}: mandatory - has to contain unique id for HTML element
 *      - className {String}: mandatory - css class name to be used for HTML element
 *      - value {boolean}: optional - value of input field (checked value of input field). Not checked, if value is undefined
 *      - label {String}: optional - text for label of input field (no label displayed, if value is undefined)
 *      - handleChange {function}: optional - function will be called, when value of input field has changed. Event of the change will be passed as a parameter
 *      - trigger {boolean}: optional - can be used to update value, if value has changed from outside. If trigger value changes, the value of the input field is updated with the value from the properties
  */
function IAMBaseInputCheck(props) {
    
    const [value, setValue] = useState(props.value && props.value !== '' ?  props.value : false);

    useEffect(() => {
       setValue(props.value);
    }, [props.value, props.trigger]);
    
    const handleChange = (e) => {
        setValue((prev) => !prev);
        props.handleChange && props.handleChange(e);       
    };

    return (
        <>
            {createLabel(props)}
            <input className={props.className} id={props.id} checked={value} type="checkbox" onChange={handleChange}/>
        </>
    );
}
export {IAMBaseInputCheck}



/**
 * Wraps an HTML input file type element 
 * 
 * @param {Object} props: properties for input HTML element:
 *      - id {String}: mandatory - has to contain unique id for HTML element
 *      - className {String}: mandatory - css class name to be used for HTML element
 *      - label {String}: optional - text for label of input field (no label displayed, if value is undefined)
 *      - handleChange {function}: optional - function will be called, when value of input field has changed. Event of the change will be passed as a parameter
 *      - accept {String}: optional - accepted file types
 *      - Ref {useRef}: optional - can be specified to control the component, e.g. to clear the selcted file
 */
function IAMBaseInputFile(props) {
    return (
        <>
            {createLabel(props)}
            <input
                className={props.className && props.className} 
                id={props.id && props.id} 
                type='file'
                label={props.label && props.label}
                onChange={props.handleChange && props.handleChange}
                accept={props.accept && props.accept}
                ref={props.Ref && props.Ref}
            />
        </>
    );
}
export {IAMBaseInputFile}


/**
 * Wraps an HTML Select element (including options)
 * 
 * @param {Object} props: properties for input HTML element:
 *      - id {String}: mandatory - has to contain unique id for HTML element
 *      - className {String}: mandatory - css class name to be used for HTML element
 *      - value {String}: mandatory - selected value 
 *      - label {String}: optional - text for label of input field (no label displayed, if value is undefined)
 *      - handleChange {function}: optional - function will be called, when value of input field has changed. Event of the change will be passed as a parameter
 *      - trigger {boolean}: optional - can be used to update value, if value has changed from outside. If trigger value changes, the value of the input field is updated with the value from the properties
 *      - values {Array of String or Object}: mandatory - contains the values in the dropdown section of the select element (option elements). Either specified as an Array of Strings (then name and id of options are set to the String value) or as an Array of Objects with attributes name and id (name will be displayed and id will be returned as value for a selected option)
        - nullOption {boolean}: optional - if set, an additional option with empty name and id=empty string will be displayed
 */
 function IAMBaseSelect(props) {

    const [value, setValue] = useState(props.value !== '' ? props.value : '');

    useEffect(() => {
       setValue(props.value);
    }, [props.value, props.trigger]);
       
    const handleChange = (e) => {
        e.preventDefault();
        setValue(e.target.value);
        props.handleChange && props.handleChange(e);       
    };

    const options = props.values.map((val) => {
        if (val.id) {
            return (<option key={props.id + '_' + val.id} id={props.id + '_' + val.id} value={val.id}>{val.name}</option>);
        }
        else {
            return (<option key={props.id + '_' + val} id={props.id + '_' + val} value={val}>{val}</option>);
        }     
    });

    return (
        <>
            {createLabel(props)}
            <select 
                className={props.className} 
                id={props.id} 
                value={value} 
                onChange={handleChange}>
                {props.nullOption && <option key={props.id + '_null'} id={props.id + '_null'} value={''}></option>}
                {options}
            </select>
        </>
    );
}
export {IAMBaseSelect}


/**
 * Wraps an HTML input element of type color. As the HTML5 color chooser cannot return an empty value and only allows you to select a color, but no opacity, this wrapper enhances the color chooser with a slider to define the opacity of the color and a check box to define whether the color is empty
 * 
 * 
 * @param {Object} props: properties for input HTML element:
 *      - id {String}: mandatory - has to contain unique id for HTML element
 *      - className {String}: mandatory - css class name to be used for HTML element
 *      - value {String}: optional - value of input field in color chooser (color in RGB Hex). Set to #FFFFFF, if value is undefined
 *      - opacity {Number}: optional - value of opacity (float value between 0 and 1). Set to 1.0, if value is undefined
 *      - label {String}: optional - text for label of input field (no label displayed, if value is undefined)
 *      - handleChange {function}: optional - function will be called, when value of input field has changed. Event of the change will be passed as a parameter
 *      - trigger {boolean}: optional - can be used to update value, if value has changed from outside. If trigger value changes, the value of the input field is updated with the value from the properties
 */
function IAMBaseInputColor(props) {
    
    const [noColor, setNoColor] = useState(props.value && props.value !== '' ? false : true);
    const [color, setColor] = useState(props.value && props.value !== '' ? props.value : '#FFFFFF');
    const [opacity, setOpacity] = useState(props.opacity && props.opacity !== '' ? parseInt(props.opacity) : 1);
    
    useEffect(() => {
        setColor(props.value && props.value !== '' ? props.value : '#FFFFFF');
        setNoColor(props.value && 
                props.value !== '' ? false : true);
        setOpacity(props.opacity && props.opacity !== '' ? parseInt(props.opacity) : 1);
    }, [props.value, props.trigger, props.opacity]);
       
    const handleChange = (e) => {
        e.preventDefault();
        setColor(e.target.value); 
        setNoColor(false); 
        props.handleChange && props.handleChange(e);       
    };

    const handleOpacity = (e) => {
        setOpacity(parseInt(e.target.value)); 
        props.handleChange && props.handleChange(e);       
    };

    const handleNoColor = (e) => {
        setNoColor((prev) => !prev);
        props.handleChange && props.handleChange(e);       
    };

    return (
        <>
            {createLabel(props)}
            <span className="_iamWindowFormColor">
                <input id={props.id} value={color} type="color" onChange={handleChange}/>
                <IAMBaseSlider id={props.id+ '_opacity'} trigger={props.trigger} value={opacity} onChange={handleOpacity}/>
                {props.nullOption && <span className="_iamWindowFormBracket2Col"><IAMBaseInputCheck trigger={props.trigger} id={props.id + '_noColor'} value={noColor} onChange={handleNoColor}/><span>{IAMTranslatorFactory.getMsg('None')}</span></span>}
            </span>
        </>
    );
}
export {IAMBaseInputColor}



/**
 * Provides a set of input elements to maintain a border element which consists of the following values:
 *      - border color
 *      - border width
 *      - dash pattern (consisting of four integer values)
 *      - dash offset
 *      - line cap type ('round','butt','square')
 * 
 * @param {Object} props: properties for input HTML element:
 *      - id {String}: mandatory - has to contain unique id for HTML element
 *      - className {String}: mandatory - css class name to be used for HTML element
 *      - value {String}: mandatory - selected value 
 *      - label {String}: optional - text for label of input field (no label displayed, if value is undefined)
 *      - handleChange {function}: optional - function will be called, when value of input field has changed. Event of the change will be passed as a parameter
 *      - trigger {boolean}: optional - can be used to update value, if value has changed from outside. If trigger value changes, the value of the input field is updated with the value from the properties
 *      - values {Array of String or Object}: mandatory - contains the values in the dropdown section of the select element (option elements). Either specified as an Array of Strings (then name and id of options are set to the String value) or as an Array of Objects with attributes name and id (name will be displayed and id will be returned as value for a selected option)
        - nullOption {boolean}: optional - if set, an additional option with empty name and id=empty string will be displayed
 */
function IAMBorderSettings(props) {

    return (
        <>
            <IAMBaseInputColor trigger={props.trigger} id={props.id + '_color'} value={props.border && props.border.color? props.border.color.toCSSHex() : ''} opacity={props.border && props.border.color? props.border.color.alpha : 1} className="_iamWindowFormInput" label="Border Color" nullOption={true}/>
            <IAMBaseInputNumber trigger={props.trigger} id={props.id + '_width'} value={props.border && props.border.width? props.border.width : ''} numberType="int" maxlength="2" className="_iamWindowFormInput" label="Width"/>
            <span></span>
            <span></span>
            <label htmlFor={props.id + '_lineDash1'} className="_iamWindowFormInput">{IAMTranslatorFactory.getMsg('Dash Pattern')}</label>
            <span className="_iamWindowFormBracket4Col">
                <IAMBaseInputNumber trigger={props.trigger} id={props.id + '_lineDash1'} value={props.border && props.border.lineDash1? props.border.lineDash1 : ''} numberType="int" maxlength="2"/>
                <IAMBaseInputNumber trigger={props.trigger} id={props.id + '_lineDash2'} value={props.border && props.border.lineDash2? props.border.lineDash2 : ''} numberType="int" maxlength="2"/>
                <IAMBaseInputNumber trigger={props.trigger} id={props.id + '_lineDash3'} value={props.border && props.border.lineDash3? props.border.lineDash3 : ''} numberType="int" maxlength="2"/>
                <IAMBaseInputNumber trigger={props.trigger} id={props.id + '_lineDash4'} value={props.border && props.border.lineDash4? props.border.lineDash4 : ''} numberType="int" maxlength="2"/>
            </span>
            <IAMBaseInputNumber trigger={props.trigger} id={props.id + '_lineDashOffset'} value={props.border? props.border.lineDashOffset : ''} numberType="int"  maxlength="2" className="_iamWindowFormInput" label="Dash Offset"/>
            <IAMBaseSelect trigger={props.trigger} id={props.id + '_lineCap'} value={props.border && props.border.lineCap? props.border.lineCap : ''} values={Border.lineCapValues} className="_iamWindowFormInput" label="Line Cap" nullOption={true} />
        </>
    );
}
export {IAMBorderSettings}