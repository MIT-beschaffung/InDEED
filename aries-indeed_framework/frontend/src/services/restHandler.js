const rp = require('request-promise-native');

const baseUri = window.location.protocol+"//"+ window.location.host + '/consumerfrontend';

export function getConsumptionDataHelper() {
    return rp({method: 'GET', uri: baseUri + '/consumptionData'})
}

export function getCompilationDataHelper(numberOfTxnCompilation) {
    const options = {
        method: 'GET',
        uri: baseUri + '/compilationData',
        qs: {
            numberOfTxnCompilation: numberOfTxnCompilation
        }
    };
    return rp(options)
}

export function getLocalConsumptionDataHelper(numberOfTxnCompilation) {
    const options = {
        method: 'GET',
        uri: baseUri + '/localConsumptionData',
        qs: {
            numberOfTxnCompilation: numberOfTxnCompilation
        }
    };
    return rp(options)
}

export function getCompilationAverageDataHelper() {
    const options = {
        method: 'GET',
        uri: baseUri + '/averageCompilationData'
    };
    return rp(options)
}

// Funktion, um "selbst" generierte Emissionsdaten aus der nedb zu ziehen
export function getEmissionDataHelper(numberOfTxn) {
    const options = {
        method: 'GET',
        uri: baseUri + '/emissionData',
        qs: {
            numberOfTxn: numberOfTxn
        }
    };
    return rp(options)
}
// Funktion, um Daten aus der forecast.db von der API ("/forecastData"), wo die Daten von "getForecastData" zur Verfügung gestellt werden, zu ziehen
export function getForecastDataHelper() {
    const options = {
        method: 'GET',
        uri: baseUri + '/forecastData',
    };
    return rp(options)
}

export function getForecastParamHelper() {
    var options = {
        method: 'GET',
        uri: baseUri + '/updateForecastParam',
    }
    return rp(options)
}

export function getForecastHelper() {
    var options = {
        method: 'GET',
        uri: baseUri + '/forecast',
    }
    return rp(options)
}

export function getFootprintDataDataHelper() {
    const options = {
        method: 'GET',
        uri: baseUri + '/footprintData'
    };
    return rp(options)
}

export function sendPrioritizationDataHelper(values) {
    const options = {
        method: 'POST',
        uri: baseUri + '/prioritizationData',
        body: {preference: values},
        json: true
    };
    return rp(options)
}

export function queryPrioritizationDataHelper() {
    const options = {
        method: 'GET',
        uri: baseUri + '/prioritizationData',
    };
    return rp(options)
}

export function getOriginDataHelper() {
    return rp({method: 'GET', uri: baseUri + '/originData'})
}

export function getLocation() {
    return rp({method: 'GET', uri: baseUri + '/location'})
}
