import './App.css';


// components
import {InteractiveMap} from './components/iamCore'

function App() {
    const getUrlParam = (name) => {
        var url_string = window.location;
        var url = new URL(url_string);
        var c = url.searchParams.get(name);
        return c;
    };

    const featuressource = getUrlParam('source');
    //const featuressource = 'Ireland_complete.json';
    //const featuressource = 'http://localhost:3000/Ireland_complete.json';

    return (    
        <div className="App" >
            <InteractiveMap featuressource={featuressource} />
        </div>
    );
}

export default App