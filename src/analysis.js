/**
 * [TODO] Step 0: Import the dependencies, fs and papaparse
 */

/**
 * [TODO] Step 1: Parse the Data
 *      Parse the data contained in a given file into a JavaScript objectusing the modules fs and papaparse.
 *      According to Kaggle, there should be 2514 reviews.
 * @param {string} filename - path to the csv file to be parsed
 * @returns {Object} - The parsed csv file of app reviews from papaparse.
 */
function parseData(filename) {
    const fs = require('fs');
    const data = fs.readFileSync(filename, 'utf8');

    const Papa = require('papaparse');
    const csv = Papa.parse(data, {
        header: true,
    });
    return csv;
}

/**
 * [TODO] Step 2: Clean the Data
 *      Filter out every data record with null column values, ignore null gender values.
 *
 *      Merge all the user statistics, including user_id, user_age, user_country, and user_gender,
 *          into an object that holds them called "user", while removing the original properties.
 *
 *      Convert review_id, user_id, num_helpful_votes, and user_age to Integer
 *
 *      Convert rating to Float
 *
 *      Convert review_date to Date
 * @param {Object} csv - a parsed csv file of app reviews
 * @returns {Object} - a cleaned csv file with proper data types and removed null values
 */
function cleanData(csv) {
    const rows = csv.data;

    const cleanedRows = rows
        .filter((row) => {
            for (const [k, v] of Object.entries(row)) {
                if (k === 'user_gender') continue;

                if (v === '') return false;
            }
            return true;
        })
        .map((row) => {
            const copyRow = { ...row };
            copyRow.user = {
                user_id: Number(copyRow.user_id),
                user_age: Number(copyRow.user_age),
                user_country: copyRow.user_country,
                user_gender: copyRow.user_gender,
            };
            delete copyRow.user_id;
            delete copyRow.user_age;
            delete copyRow.user_country;
            delete copyRow.user_gender;

            copyRow.review_id = Number(copyRow.review_id);
            copyRow.num_helpful_votes = Number(copyRow.num_helpful_votes);
            copyRow.rating = Number(copyRow.rating);
            copyRow.review_date = new Date(copyRow.review_date);
            copyRow.verified_purchase = copyRow.verified_purchase === 'true';

            return copyRow;
        });

    return cleanedRows;
}

/**
 * [TODO] Step 3: Sentiment Analysis
 *      Write a function, labelSentiment, that takes in a rating as an argument
 *      and outputs 'positive' if rating is greater than 4, 'negative' is rating is below 2,
 *      and 'neutral' if it is between 2 and 4.
 * @param {Object} review - Review object
 * @param {number} review.rating - the numerical rating to evaluate
 * @returns {string} - 'positive' if rating is greater than 4, negative is rating is below 2,
 *                      and neutral if it is between 2 and 4.
 */
function labelSentiment({ rating }) {
    if (rating > 4) return 'positive';
    if (rating < 2) return 'negative';
    return 'neutral';
}

/**
 * [TODO] Step 3: Sentiment Analysis by App
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each app into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{app_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for an app
 */
function sentimentAnalysisApp(cleaned) {
    const appMap = {};

    cleaned.forEach((row) => {
        const app = row.app_name;
        const sentiment = labelSentiment(row);

        if (!appMap[app]) {
            appMap[app] = {
                app_name: app,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        if (sentiment === 'positive') appMap[app].positive++;
        if (sentiment === 'neutral') appMap[app].neutral++;
        if (sentiment === 'negative') appMap[app].negative++;
    });
    return Object.values(appMap);
}

/**
 * [TODO] Step 3: Sentiment Analysis by Language
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each language into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{review_language: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for a language
 */
function sentimentAnalysisLang(cleaned) {
    const languageMap = {};
    cleaned.forEach((row) => {
        const language = row.review_language;
        const sentiment = labelSentiment(row);
        if (!languageMap[language]) {
            languageMap[language] = {
                review_language: language,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        if (sentiment === 'positive') languageMap[language].positive++;
        if (sentiment === 'neutral') languageMap[language].neutral++;
        if (sentiment === 'negative') languageMap[language].negative++;
    });

    return Object.values(languageMap);
}

/**
 * [TODO] Step 4: Statistical Analysis
 *      Answer the following questions:
 *
 *      What is the most reviewed app in this dataset, and how many reviews does it have?
 *
 *      For the most reviewed app, what is the most commonly used device?
 *
 *      For the most reviewed app, what the average star rating (out of 5.0)?
 *
 *      Add the answers to a returned object, with the format specified below.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{mostReviewedApp: string, mostReviews: number, mostUsedDevice: String, mostDevices: number, avgRating: float}} -
 *          the object containing the answers to the desired summary statistics, in this specific format.
 */
function summaryStatistics(cleaned) {
    const answers = {
        mostReviewedApp: '',
        mostReviews: 0,
        mostUsedDevice: '',
        mostDevices: 0,
        avgRating: 0,
    };

    const appMap = {};

    cleaned.forEach((row) => {
        const app = row.app_name;
        if (!appMap[app]) appMap[app] = 0;
        appMap[app]++;
    });

    for (const app in appMap) {
        if (appMap[app] > answers.mostReviews) {
            answers.mostReviews = appMap[app];
            answers.mostReviewedApp = app;
        }
    }

    const deviceMap = {};
    cleaned.forEach((row) => {
        const app = row.app_name;
        if (app === answers.mostReviewedApp) {
            const device = row.device_type;

            if (!deviceMap[device]) deviceMap[device] = 0;
            deviceMap[device]++;
        }
    });

    for (const device in deviceMap) {
        if (deviceMap[device] > answers.mostDevices) {
            answers.mostDevices = deviceMap[device];
            answers.mostUsedDevice = device;
        }
    }

    let sum = 0;
    let num = 0;

    cleaned.forEach((row) => {
        const app = row.app_name;
        if (app === answers.mostReviewedApp) {
            sum += row.rating;
            num++;
        }
    });

    answers.avgRating = sum / num;

    return answers;
}

/**
 * Do NOT modify this section!
 */
module.exports = {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
    labelSentiment,
};
