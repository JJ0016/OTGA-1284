/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/************************************************************************************************
 * * OX Tools Global NSW | OTGN **
 * * OTGN-408 | OX360 Report **
 * * OTGN-409 | UI Development for Dashboard **
 *
 *
 * **********************************************************************************************
 *
 * Author: Jobin & Jismi IT Services LLP
 *
 * Date Created : 01-March-2021
 *
 * Created By: Manu Antony, Jobin & Jismi IT Services LLP
 *
 * Description : Suitelet which will handle Saved Searches necessary to fetch the details for OX360 Dashboard Report
 *
 * REVISION HISTORY
 *
 * OTGN-468 : Added API for Ton Ten Item bought by Customer
 *
 *
 ***********************************************************************************************/
 define(['N/search','N/runtime'],
 /**
  * @param{search} search
  */
 (search,runtime) => {
     /**
      * @description Global variable for storing errors ----> for debugging purposes
      * @type {Array.<Error>}
      * @constant
      */
     const ERROR_STACK = [];

     /**
      * @description NetSuite Config Details
      * @typedef NETSUITE_CONFIG
      * @type {Object}
      * @property {String} date_format - The Date Format used in NetSuite
      * @constant
      */
     const NETSUITE_CONFIG = {
         date_format: ''
     };



     /**
      * @description Check whether the given parameter argument has value on it or is it empty.
      * ie, To check whether a value exists in parameter
      * @author Manu Antony
      * @param {*} parameter parameter which contains/references some values
      * @param {*} parameterName name of the parameter, not mandatory
      * @returns {Boolean} true if there exist a value else false
      */
     const checkForParameter = function checkForParameter(parameter, parameterName) {
         if (parameter !== "" && parameter !== null && parameter !== undefined && parameter !== false && parameter !== "null" && parameter !== "undefined" && parameter !== " " && parameter !== 'false') {
             return true;
         } else {
             if (parameterName)
                 log.debug('Empty Value found', 'Empty Value for parameter ' + parameterName);
             return false;
         }
     }

     /**
      * @description To assign a default value if the value argument is empty
      * @author Manu Antony
      * @param {String|Number|Boolean|Object|Array|null|undefined} value
      * @param {String|Number|Boolean|Object|Array} defaultValue
      * @returns {*} either value or defaultValue
      */
     const assignDefaultValue = function assignDefaultValue(value, defaultValue) {
         if (checkForParameter(value))
             return value;
         else
             return defaultValue;
     }

     /**
      * @description To round a float number
      * @author Manu Antony
      * @param {Number|String} value
      * @param {Number|String} decimals
      * @returns {Number} Floating Point Number with the given precision
      */
     const roundFloat = function roundFloat(value, decimals) {
         decimals = (decimals) ? decimals : 2;
         return Number(Math.round(parseFloat(value) + 'e' + parseInt(decimals)) + 'e-' + parseInt(decimals));
     }

     /**
      * @description To fix a float number to specified decimal parts
      * @author Manu Antony
      * @param {Number|String} value
      * @param {Number|String} decimals
      * @returns {Number|String}
      */
     const fixFloat = function fixFloat(value, decimals) {
         decimals = (decimals) ? decimals : 2;
         // return roundFloat(parseFloat(value), parseInt(decimals)).toFixed(parseInt(decimals));
         return parseFloat(value).toFixed(decimals);
     }

     /**
      * @description Common Try-Catch function, applies to Object contains methods/function
      * @author Manu Antony
      * @param {Object.<string,Function|any>} DATA_OBJ Object contains methods/function
      * @param {String} NAME  Name of the Object
      * @returns {void}
      */
     const applyTryCatch = function applyTryCatch(DATA_OBJ, NAME) {
         /**
          * @description  Try-Catch function
          * @author Manu Antony
          * @param {Function} myfunction - reference to a function
          * @param {String} key - name of the function
          * @returns {Function|false}
          */
         const tryCatch = function(myfunction, key) {
             return function() {
                 try {
                     return myfunction.apply(this, arguments);
                 } catch (e) {
                     log.error("error in " + key, e);
                     ERROR_STACK.push(e.toString());
                     return false;
                 }
             };
         }

         for (let key in DATA_OBJ) {
             if (typeof DATA_OBJ[key] === "function") {
                 DATA_OBJ[key] = tryCatch(DATA_OBJ[key], NAME + "." + key);
             }
         }
     }


     /**
      * @description Methods for different date logic
      */
     const dateLogic = {
         /**
          * @description Check whether we can generate a valid date with the given data
          * @param {*|String[]} dataArray
          * @returns {boolean}
          */
         validateGivenDate(dataArray) {
             //return !(!dateLogic.checkDateFormat(dataArray) || "Invalid Date" === new Date(Number(dataArray[0]), Number(dataArray[1]) - 1, dataArray[2]).toString());
             return dateLogic.checkDateFormat(dataArray) && "Invalid Date" !== dateLogic.generateDate(dataArray).toString();
         },
         /**
          * @typedef dateArray
          * @type {Array}
          * @property {Number} 0 - YYYY, denotes Year
          * @property {Number} 1 - MM, denotes Month
          * @property {Number} 2 - DD, denoted Day
          * /
          /**
          * @description To check whether the given date is in format of [Number,Number,Number]. ie, [YYYY,MM,DD]
          * @param {dateArray} dataArray - format of [Number,Number,Number]. ie, [YYYY,MM,DD]
          * @returns {boolean}
          */
         checkDateFormat(dataArray) {
             //return !(!Array.isArray(dataArray) || 3 !== dataArray.length || !dataArray.reduce(function (i, j) { return Number.isInteger(Number(j)) && i }, !0));
             return Array.isArray(dataArray) && 3 === dataArray.length && dataArray.reduce(function(i, j) {
                 return i && Number.isInteger(Number(j))
             }, true);
         },
         /**
          * @description To check whether the given date range is correct
          * @param {Date} startDate
          * @param {Date} endDate
          * @returns {boolean}
          */
         validateDateRange(startDate, endDate) {
             return (checkForParameter(startDate) && checkForParameter(endDate) && dateLogic.validateGivenDate(startDate) && dateLogic.validateGivenDate(endDate)) &&
                 (dateLogic.generateDate(endDate).getTime() > dateLogic.generateDate(startDate).getTime()); //endDate should be greater than startDate
         },
         /**
          * check whether the given dateObj is instance of Date Object
          * @param {Date} dateObj
          * @returns {boolean}
          */
         isInstanceOfDate(dateObj) {
             //return !(!checkForParameter(dateObj) || '[object Date]' !== Object.prototype.toString.call(dateObj))
             return checkForParameter(dateObj) && '[object Date]' === Object.prototype.toString.call(dateObj)
         },
         /**
          * To generate Date Object with the given data
          * @param {[Number,Number,Number]} dataArray
          * @returns {Date}
          */
         generateDate(dataArray) {
             if (dateLogic.checkDateFormat(dataArray))
                 return new Date(Number(dataArray[0]), Math.abs(Number(dataArray[1]) - 1) % 12, dataArray[2]);
             return new Date('false');
         },
         /**
          * @description To format the Date Object into the given type/format
          * @param {Date} dateObj
          * @param {String} type
          * @returns {boolean|String}
          */
         formatDate(dateObj, type) {
             /*JJ0016 Updated type OTGA-1254*/
             //type='DD/MM/YYYY';
             if (!dateLogic.isInstanceOfDate(dateObj))
                 return false;
             let dateAsKeys = dateLogic.splitDate(dateObj);
             if (dateAsKeys)
                 switch (type) {
                     case 'MM/DD/YYYY':
                         ;
                         /*JJ0016 Added - OTGA-1254*/
                        // return dateLogic.changeDateFormat(dateAsKeys, type, '/');
                     case 'M/D/YYYY':
                         return dateLogic.changeDateFormat(dateAsKeys, type, '/');
                     case 'D/M/YYYY':
                         ;
                     case 'DD/MM/YYYY':
                         return dateLogic.changeDateFormat(dateAsKeys, type, '/');
                     case 'YYYY-MM-DD':
                         return dateLogic.changeDateFormat(dateAsKeys, type, '-');
                     default:
                         return dateLogic.changeDateFormat(dateAsKeys, 'DD/MM/YYYY', '/');
                 };
             return false;
         },
         /**
          * check the dateAsKeys object contain the keys and return the date in given type/format
          * @param {Object<String, Number>} dateAsKeys
          * @param {String} type
          * @param {String} delimiter
          * @returns {string|boolean}
          */
         changeDateFormat(dateAsKeys, type, delimiter) {
             if (!checkForParameter(dateAsKeys.DD) || !checkForParameter(dateAsKeys.MM) || !checkForParameter(dateAsKeys.YYYY) || !checkForParameter(type) || !checkForParameter(delimiter))
                 return false;
             return type.split(delimiter).reduce(function(i, j) {
                 return i.push(dateAsKeys[j]), i;
             }, []).join(delimiter);
         },
         /**
          *  Take the Date Object and return it as {DD:value, MM:value, YYYY:value}
          * @param {Date} dateObj
          * @returns {boolean|{DD: (string|number), MM: string, D: number, YYYY: number, M: number}}
          */
         splitDate: function(dateObj) {
             if (!dateLogic.isInstanceOfDate(dateObj))
                 return false;
             return {
                 D: dateObj.getDate(),
                 DD: dateObj.getDate() < 10 ? ('0' + dateObj.getDate()) : dateObj.getDate(),
                 M: dateObj.getMonth() + 1,
                 MM: (dateObj.getMonth() + 1) < 10 ? ('0' + (dateObj.getMonth() + 1)) : (dateObj.getMonth() + 1),
                 YYYY: dateObj.getFullYear()
             };
         },
         /**
          * Add/Subtract days from Date Object
          * @param {Date} dateObj
          * @param {Number} counter
          * @returns {boolean|Date}
          */
         addDays(dateObj, counter = 0) {
             if (!dateLogic.isInstanceOfDate(dateObj))
                 return false;
             return new Date(dateObj.setDate(dateObj.getDate() + counter));
         },
         /**
          * Take the Date Object and return it as [YYYY,MM,DD]
          * @param {Date} dateObj
          * @returns {[number, string, (string|number)]|boolean}
          */
         dateAsArray(dateObj) {
             if (!dateLogic.isInstanceOfDate(dateObj))
                 return false;
             let dateAsKeys = dateLogic.splitDate(dateObj);
             return [dateAsKeys.YYYY, dateAsKeys.MM, dateAsKeys.DD];
         }
     }
     applyTryCatch(dateLogic, 'dateLogic');


     /**
      * @description dataSets from Saved Search and formatting Saved Search results
      */
     const dataSets = {
         /**
          * @description Object referencing NetSuite Saved Search
          * @typedef {Object} SearchObj
          * @property {Object[]} filters - Filters Array in Search
          * @property {Object[]} columns - Columns Array in Search
          */
         /**
          * @description to format Saved Search column to key-value pair where each key represents each columns in Saved Search
          * @param {SearchObj} savedSearchObj
          * @param {void|String} priorityKey
          * @returns {Object.<String,SearchObj.columns>}
          */
         fetchSavedSearchColumn(savedSearchObj, priorityKey) {
             let columns = savedSearchObj.columns;
             let columnsData = {},
                 columnName = '';
             columns.forEach(function(result, counter) {
                 columnName = '';
                 if (result[priorityKey]) {
                     columnName += result[priorityKey];
                 } else {
                     if (result.summary)
                         columnName += result.summary + '__';
                     if (result.formula)
                         columnName += result.formula + '__';
                     if (result.join)
                         columnName += result.join + '__';
                     columnName += result.name;
                 }
                 columnsData[columnName] = result;
             });
             return columnsData;
         },
         /**
          * @description Representing each result in Final Saved Search Format
          * @typedef formattedEachSearchResult
          * @type {{value:any,text:any}}
          */
         /**
          * @description to fetch and format the single saved search result. ie, Search result of a single row containing both text and value for each columns
          * @param {Object[]} searchResult contains search result of a single row
          * @param {Object.<String,SearchObj.columns>} columns
          * @returns {Object.<String,formattedEachSearchResult>|{}}
          */
         formatSingleSavedSearchResult(searchResult, columns) {
             var responseObj = {};
             for (let column in columns)
                 responseObj[column] = {
                     value: searchResult.getValue(columns[column]),
                     text: searchResult.getText(columns[column])
                 };
             return responseObj;
         },
         /**
          * @description to iterate over and initiate format of each saved search result
          * @param {SearchObj} searchObj
          * @param {void|Object.<String,SearchObj.columns>} columns
          * @returns {[]|Object[]}
          */
         iterateSavedSearch(searchObj, columns) {
             if (!checkForParameter(searchObj))
                 return false;
             if (!checkForParameter(columns))
                 columns = dataSets.fetchSavedSearchColumn(searchObj);

             var response = [];
             var searchPageRanges;
             try {
                 searchPageRanges = searchObj.runPaged({
                     pageSize: 1000
                 });
             } catch (err) {
                 return [];
             }
             if (searchPageRanges.pageRanges.length < 1)
                 return [];

             var pageRangeLength = searchPageRanges.pageRanges.length;
             log.debug('pageRangeLength', pageRangeLength);

             for (let pageIndex = 0; pageIndex < pageRangeLength; pageIndex++)
                 searchPageRanges.fetch({
                     index: pageIndex
                 }).data.forEach(function(result) {
                     response.push(dataSets.formatSingleSavedSearchResult(result, columns));
                 });

             return response;
         },
         /**
          * @description - Saved Search which will retrieve the Customer Sales Data (Sales Summary, OX Support and Component Weighting)
          * @param {Number} CUSTOMER_ID  - Internal Id of the customer
          * @param {String} START_DATE  - Start Date
          * @param {String} END_DATE  - End Date
          * @param {String} LAST_YEAR_START_DATE  - Last Year Start Date
          * @param {String} LAST_YEAR_END_DATE  - Last Year End Date
          * @returns {[]|Object[]}
          */
         executeCustomerSalesSearch({ CUSTOMER_ID, START_DATE, END_DATE, LAST_YEAR_START_DATE, LAST_YEAR_END_DATE }) {
             log.debug('executeCustomerSalesSearch', {
                 CUSTOMER_ID,
                 START_DATE,
                 END_DATE,
                 LAST_YEAR_START_DATE,
                 LAST_YEAR_END_DATE,
             });

             var child_customers = [];
             child_customers = apiMethods.getChildCustomers(CUSTOMER_ID);
             log.debug('customer child', child_customers);


             const customerSearchObj = search.create({
                 type: "customer",
                 isPublic: true,
                 filters: [
                     ["stage", "anyof", "CUSTOMER"], //Stage is Customer
                     "AND",
                     ["transaction.mainline", "is", "F"], //Transaction : Main Line  is false
                     "AND",
                     ["transaction.taxline", "is", "F"], //Transaction : Tax Line    is false
                     "AND",
                     ["transaction.shipping", "is", "F"], //Transaction : Shipping Line  is false
                     "AND",
                     ["transaction.cogs", "is", "F"], //Transaction : COGS Line  is false
                     "AND",
                     ["isinactive", "is", "F"], //Inactive   is false
                     "AND",
                     ["transaction.accounttype", "anyof", "Income"], //Transaction : Account Type    is Income
                     "AND",
                     ["internalid", "anyof", child_customers], //Internal ID is any of CUSTOMER_ID
                     "AND",
                     [`formulanumeric: CASE WHEN {transaction.trandate} >= TO_DATE('${LAST_YEAR_START_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"],
                     "AND",
                     [`formulanumeric: CASE WHEN {transaction.trandate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"]
                 ],
                 columns: [
                     /*search.createColumn({
                         name: "internalid",
                         summary: "GROUP",
                         label: "customerInternalId"
                     }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "SUM",
                         formula: `CASE WHEN {transaction.type} = 'Invoice' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END`,
                         label: "invoiceAmount"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "SUM",
                         formula: `CASE WHEN {transaction.type} = 'Sales Order' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN (({transaction.quantity}-nvl({transaction.quantitycommitted},0)-nvl({transaction.quantityshiprecv},0))*{transaction.rate}) ELSE 0 END`,
                         label: "backOrderedAmount"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "SUM",
                         formula: `CASE WHEN {transaction.type} = 'Sales Order' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END`,
                         label: "soAmount"
                     }),
                     /*search.createColumn({
                         name: "formulapercent",
                         summary: "SUM",
                         formula: "SUM(CASE WHEN {transaction.type} = 'Sales Order' THEN (({transaction.quantity}-nvl({transaction.quantitycommitted},0)-nvl({transaction.quantityshiprecv},0))*{transaction.rate}) ELSE 0 END) / SUM(NULLIF(CASE WHEN {transaction.type} = 'Sales Order' THEN {transaction.amount} ELSE NULL END,0))",
                         label: "backorderedPercentage"
                     }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "SUM",
                         formula: `ROUND((SUM(CASE WHEN {transaction.type} = 'Sales Order' AND  ({transaction.itemtype} = 'InvtPart' OR {transaction.itemtype}='Kit' OR {transaction.itemtype}='Assembly') AND {transaction.closed}='F' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') AND ({transaction.quantity}-NVL({transaction.quantitycommitted}, 0)-NVL({transaction.quantityshiprecv}, 0) )=0  THEN 1 ELSE 0 END) /  SUM(NULLIF(CASE WHEN {transaction.type} = 'Sales Order' AND  ({transaction.itemtype} = 'InvtPart' OR {transaction.itemtype}='Kit' OR {transaction.itemtype}='Assembly') AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END,0)))*100,2)`,
                         label: "backorderedPercentage"
                     }),
                     /*search.createColumn({
                         name: "formulapercent",
                         summary: "SUM",
                         formula: "(SUM(CASE WHEN {transaction.type} = 'Sales Order' THEN (({transaction.quantity}-nvl({transaction.quantitycommitted},0)-nvl({transaction.quantityshiprecv},0))*{transaction.rate}) ELSE 0 END) / SUM(NULLIF(CASE WHEN {transaction.type} = 'Sales Order' THEN {transaction.amount} ELSE NULL END,0)))*0.2",
                         label: "backorderdWeighting"
                     }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "SUM",
                         formula: `ROUND((SUM(CASE WHEN {transaction.type} = 'Sales Order' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN (({transaction.quantity}-nvl({transaction.quantitycommitted},0)-nvl({transaction.quantityshiprecv},0))*{transaction.rate}) ELSE 0 END) / SUM(NULLIF(CASE WHEN {transaction.type} = 'Sales Order' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END,0)))*0.2*100,2)`,
                         label: "backorderdWeighting"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "COUNT",
                         formula: `COUNT(DISTINCT CASE WHEN {transaction.type} = 'Credit Memo' AND {transaction.custbody_cred_reason} != 'Pricing adjustment' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.internalid} ELSE 0 END)`,
                         label: "creditmemoCount"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "SUM",
                         formula: `CASE WHEN {transaction.type} = 'Credit Memo' AND {transaction.custbody_cred_reason} != 'Pricing adjustment' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END`,
                         label: "creditReturns"
                     }),
                     /*search.createColumn({
                           name: "formulapercent",
                           summary: "SUM",
                           formula: "SUM(CASE WHEN {transaction.type} = 'Credit Memo' AND {transaction.custbody_cred_reason} != 'Pricing adjustment' THEN {transaction.amount} ELSE NULL END*-1) /  SUM(NULLIF(CASE WHEN {transaction.type} = 'Sales Order' THEN {transaction.amount} ELSE NULL END,0))",
                           label: "creditReturnsPercentage"
                       }),*/
                     /*search.createColumn({
                         name: "formulanumeric",
                         summary: "SUM",
                         formula: `ROUND((SUM(CASE WHEN {transaction.type} = 'Credit Memo' AND {transaction.custbody_cred_reason} != 'Pricing adjustment' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END * -1) /  SUM(NULLIF(CASE WHEN {transaction.type} = 'Sales Order' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END,0))) * 100,2)`,
                         label: "creditReturnsPercentage"
                     }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "SUM",
                         formula: `ROUND((SUM((CASE WHEN {transaction.type} = 'Credit Memo' AND {transaction.custbody_cred_reason} != 'Pricing adjustment' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END) * -1) /  SUM(NULLIF((CASE WHEN {transaction.type} = 'Sales Order' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END),0))) * 100,2)`,
                         label: "creditReturnsPercentage"

                     }),
                     /* search.createColumn({
                          name: "formulapercent",
                          summary: "SUM",
                          formula: "(SUM(CASE WHEN {transaction.type} = 'Credit Memo' AND {transaction.custbody_cred_reason} != 'Pricing adjustment' THEN {transaction.amount} ELSE NULL END*-1) /  SUM(NULLIF(CASE WHEN {transaction.type} = 'Sales Order' THEN {transaction.amount} ELSE NULL END,0)))*0.15",
                          label: "creditReturnsWeighting"
                      }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "SUM",
                         formula: `ROUND((SUM(CASE WHEN {transaction.type} = 'Credit Memo' AND {transaction.custbody_cred_reason} != 'Pricing adjustment' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END * -1) /  SUM(NULLIF(CASE WHEN {transaction.type} = 'Sales Order' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END,0))) * 0.15 * 100,2)`,
                         label: "creditReturnsWeighting"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} ='${CUSTOMER_ID}' THEN {estimatedbudget} END`,
                         label: "estimatedBudget"
                     }),
                     /* search.createColumn({
                         name: "formulapercent",
                         summary: "MAX",
                         formula: "CASE WHEN {estimatedbudget} is NULL OR  {estimatedbudget}=0 THEN 0 ELSE (SUM(CASE WHEN {transaction.type} = 'Invoice' THEN {transaction.amount} ELSE NULL END)/{estimatedbudget}) END",
                         label: "salesAgainstTarget"
                     }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `NVL2(MAX(CASE WHEN {internalid} = '${CUSTOMER_ID}' THEN {estimatedbudget} END), NVL(ROUND(((SUM(CASE WHEN {transaction.type} = 'Invoice' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END)/MAX(NULLIF((CASE WHEN {internalid} = '${CUSTOMER_ID}' THEN {estimatedbudget} END),0)))* 100),2),0),0)`,
                         label: "salesAgainstTarget"
                     }),
                     /*search.createColumn({
                         name: "formulapercent",
                         summary: "MAX",
                         formula: "(CASE WHEN {estimatedbudget} is NULL OR  {estimatedbudget}=0 THEN 0 ELSE (SUM(CASE WHEN {transaction.type} = 'Invoice' THEN {transaction.amount} ELSE NULL END)/{estimatedbudget}) END)*0.1",
                         label: "salesAgainstTargetWeighting"
                     }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `NVL2(MAX(CASE WHEN {internalid} = '${CUSTOMER_ID}' THEN {estimatedbudget} END), NVL(ROUND(((SUM(CASE WHEN {transaction.type} = 'Invoice' AND {transaction.trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END)/MAX(NULLIF((CASE WHEN {internalid} = '${CUSTOMER_ID}' THEN {estimatedbudget} END),0))) * 0.1 * 100),2),0),0)`,
                         label: "salesAgainstTargetWeighting"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "SUM",
                         formula: `CASE WHEN {transaction.type} = 'Invoice' AND {transaction.trandate}>= TO_DATE('${LAST_YEAR_START_DATE}','YYYY-MM-DD') AND  {transaction.trandate}<= TO_DATE('${LAST_YEAR_END_DATE}','YYYY-MM-DD') THEN {transaction.amount} ELSE 0 END`,
                         label: "previousYearInvoiceAmount"
                     }),
                     /* .....search.createColumn({
                         name: "entityid",
                         summary: "MAX",
                         sort: search.Sort.ASC,
                         label: "customerName"
                     }),*/
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {entityid} END`,
                         label: "customerName"
                     }),
                     /*..search.createColumn({
                         name: "custentity_jj_marketing_support_provided",
                         summary: "MAX",
                         label: "marketingSupportProvided"
                     }),*/
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {custentity_jj_marketing_support_provided} END`,
                         label: "marketingSupportProvided"
                     }),
                     /*....search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: "{custentity_jj_marketing_support}",
                         label: "marketingSupportValue"
                     }),*/
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {custentity_jj_marketing_support} END`,
                         label: "marketingSupportValue"
                     }),
                     /*search.createColumn({
                         name: "formulapercent",
                         summary: "MAX",
                         formula: "CASE WHEN ({custentity_jj_marketing_support_provided} = 'T' ) THEN 0.1 ELSE 0 END",
                         label: "marketingsupportweighting"
                     }),*/
                     /*...search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: "(CASE WHEN ({custentity_jj_marketing_support_provided} = 'T' ) THEN 0.1 ELSE 0 END) * 100",
                         label: "marketingsupportweighting"
                     }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `(CASE WHEN ({internalid} =  '${CUSTOMER_ID}' AND  {custentity_jj_marketing_support_provided} = "T" ) THEN 0.1 ELSE 0 END) * 100`,
                         label: "marketingsupportweighting"
                     }),
                     /*....search.createColumn({
                         name: "custentity_jj_training_conducted",
                         summary: "MAX",
                         label: "trainingConducted"
                     }),*/
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {custentity_jj_training_conducted} END`,
                         label: "trainingConducted"
                     }),
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {custentity_jj_type_of_training_provided} END`,
                         label: "trainingValue"
                     }),
                     /* search.createColumn({
                          name: "formulapercent",
                          summary: "MAX",
                          formula: "CASE WHEN {custentity_jj_training_conducted} = 'T' THEN 0.2 ELSE 0 END",
                          label: "trainingWeighting"
                      }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `(CASE WHEN ({internalid} =  '${CUSTOMER_ID}' AND {custentity_jj_training_conducted} = "T") THEN 0.2 ELSE 0 END) * 100`,
                         label: "trainingWeighting"
                     }),
                     /*..search.createColumn({
                         name: "image",
                         summary: "MAX",
                         label: "merchandisingImage"
                     }),*/
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {image} END `,
                         label: "merchandisingImage"
                     }),
                     /*search.createColumn({
                         name: "formulapercent",
                         summary: "MAX",
                         formula: "CASE WHEN {image} is NULL THEN  0 ELSE 0.1 END",
                         label: "merchandisingWeighting"
                     }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `(CASE WHEN ({internalid} =  '${CUSTOMER_ID}' AND {image} is NULL) THEN  0 ELSE 0.1 END) * 100`,
                         label: "merchandisingWeighting"
                     }),
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: "TO_CHAR({today},'DD/MM/YYYY')",
                         label: "todaysDate"
                     }),
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `TO_CHAR(TO_DATE('${START_DATE}','YYYY-MM-DD'),'YYYY-MM-DD')`,
                         label: "startDate"
                     }),
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `TO_CHAR(TO_DATE('${END_DATE}','YYYY-MM-DD'),'YYYY-MM-DD')`,
                         label: "endDate"
                     }),
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `TO_CHAR(TO_DATE('${LAST_YEAR_START_DATE}','YYYY-MM-DD'),'YYYY-MM-DD')`,
                         label: "lastyearStartdate"
                     }),
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `TO_CHAR(TO_DATE('${LAST_YEAR_END_DATE}','YYYY-MM-DD'),'YYYY-MM-DD')`,
                         label: "lastyearenddate"
                     }),
                     /*... search.createColumn({
                          name: "custentity1",
                          summary: "MAX",
                          label: "customerPrimaryGroup"
                      }),*/
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {custentity1} END `,
                         label: "customerPrimaryGroup"
                     }),
                     /*...search.createColumn({
                         name: "custentity_distribution_channel",
                         summary: "MAX",
                         label: "distributionChannel"
                     }),*/
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {custentity_distribution_channel} END`,
                         label: "distributionChannel"
                     }),
                     /*...search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: "{custentity1.id}",
                         label: "customerPrimaryGroupId"
                     }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {custentity1.id} END`,
                         label: "customerPrimaryGroupId"
                     }),
                     /*search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: "{custentity_distribution_channel.id}",
                         label: "distributionChannelId"
                     })*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {custentity_distribution_channel.id} END`,
                         label: "distributionChannelId"
                     }),
                     /**JJ0016 Updated OTGA-1282*/
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {custentity_incentives_otga1271} END`,
                         label: "performanceIncentive"
                     }),
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `CASE WHEN {internalid} =  '${CUSTOMER_ID}' THEN {custentity_incentive_value_otga1271} END`,
                         label: "performanceIncentiveValue"
                     }),

                 ]
             });
             var backorderqty=customerSearchObj.run();
             backorderqty.each(function (result) {
                 var boqty=result.getValue({
                     name:'formulanumeric',
                     summary: 'SUM',
                     label: 'backorderedPercentage'

                 });


                 log.debug('backorderedpercentage..............',boqty);

             });
             let searchResultCount = customerSearchObj.runPaged().count;
             log.debug("executeCustomerSalesSearch result count", searchResultCount);
             try {
                 //customerSearchObj.save();
             } catch (eee) {
                 log.debug("eee", eee);

             }


             return dataSets.iterateSavedSearch(customerSearchObj, dataSets.fetchSavedSearchColumn(customerSearchObj, 'label'));
         },
         /**
          * @description - Saved Search which will retrieve the Customer's Sales by product category
          * @param {Number} CUSTOMER_ID  - Internal Id of the customer
          * @param {String} START_DATE  - Start Date
          * @param {String} END_DATE  - End Date
          * @returns {[]|Object[]}
          */
         executeSalesByProductCategorySearch({ CUSTOMER_ID, START_DATE, END_DATE, LAST_YEAR_START_DATE, LAST_YEAR_END_DATE }) {
             log.debug('executeSalesByProductCategorySearch', {
                 CUSTOMER_ID,
                 START_DATE,
                 END_DATE,
                 LAST_YEAR_START_DATE,
                 LAST_YEAR_END_DATE

             });

             var sales_prod_category_customerchild = [];
             sales_prod_category_customerchild = apiMethods.getChildCustomers(CUSTOMER_ID);
             log.debug('executeSalesByProductCategorySearch child customers', sales_prod_category_customerchild);
             const transactionSearchObj = search.create({
                 type: "transaction",
                 filters: [
                     ["type", "anyof", "CustInvc"], //Type   is Invoice
                     "AND",
                     ["mainline", "is", "F"], //Main Line    is false
                     "AND",
                     ["taxline", "is", "F"], //Tax Line  is false
                     "AND",
                     ["shipping", "is", "F"], //Shipping Line    is false
                     "AND",
                     ["accounttype", "anyof", "Income"], //Account Type  is Income
                     "AND",
                     ["item.type", "noneof", "Discount", "Markup", "Subtotal"],
                     "AND",
                     ["customer.internalid", "anyof", sales_prod_category_customerchild], //Customer : Internal ID is CUSTOMER_ID
                     "AND",
                     [`formulanumeric: CASE WHEN {trandate} >= TO_DATE('${LAST_YEAR_START_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"],
                     "AND",
                     [`formulanumeric: CASE WHEN {trandate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"]
                 ],
                 columns: [
                     /*search.createColumn({
                         name: "internalid",
                         join: "customer",
                         summary: "GROUP",
                         label: "customerInternalId"
                     }),*/
                     search.createColumn({
                         name: "custbody_ozlink_entity_name",
                         summary: "MAX",
                         label: "customerName"
                     }),
                     search.createColumn({
                         name: "formulatext",
                         summary: "GROUP",
                         formula: "{item.custitem19}",
                         //sort: search.Sort.ASC,
                         label: "primaryGroup"
                     }),
                     search.createColumn({
                         name: "formulacurrency",
                         summary: "SUM",
                         //formula: "{amount}",
                         formula: `CASE WHEN {trandate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') AND  {trandate}<= TO_DATE('${END_DATE}','YYYY-MM-DD') THEN {amount} ELSE 0 END`,
                         sort: search.Sort.DESC,
                         label: "salesByProductCategory"
                     }),
                     search.createColumn({
                         name: "formulacurrency",
                         summary: "SUM",
                         //formula: "{amount}",
                         formula: `CASE WHEN {trandate}>= TO_DATE('${LAST_YEAR_START_DATE}','YYYY-MM-DD') AND  {trandate}<= TO_DATE('${LAST_YEAR_END_DATE}','YYYY-MM-DD') THEN {amount} ELSE 0 END`,
                         label: "previousYearAmount"
                     })
                 ]
             });

             var transactionSearch = transactionSearchObj.run();
             transactionSearch.each(function(result) {
                 var amt = result.getValue({
                     name: 'formulacurrency',
                     summary: 'SUM',
                     label: "previousYearAmount"

                 });


                 log.debug('primary group Amount............................', amt);

             });
             let columns = dataSets.fetchSavedSearchColumn(transactionSearchObj, 'label');
             let searchResultCount = transactionSearchObj.runPaged().count;
             log.debug("executeSalesByProductCategorySearch result count", searchResultCount);
             log.debug('executeSalesByProductCategorySearch results......', transactionSearchObj.run());

             return transactionSearchObj.run().getRange({ start: 0, end: 8 }).reduce((acc, el) => {
                 return acc.push(dataSets.formatSingleSavedSearchResult(el, columns)), acc;
             }, []);

             //return dataSets.iterateSavedSearch(transactionSearchObj, dataSets.fetchSavedSearchColumn(transactionSearchObj, 'label'));
         },
         /**
          * @description - Saved Search which will retrieve the top Sales for customer with same Customer : Customer Primary Group
          * @param {Number} CUSTOMER_ID  - Internal Id of the customer
          * @param {String} START_DATE  - Start Date
          * @param {String} END_DATE  - End Date
          * @param {Number} CUSTOMER_PRIMARY_GROUP  - Customer : Customer Primary Group
          * @returns {[]|Object[]}
          */
         executeSalesByCustomerPrimaryGroupSearch({ CUSTOMER_ID, START_DATE, END_DATE, CUSTOMER_PRIMARY_GROUP_ID, SUBSIDIARY_ID }) {
             log.debug('executeSalesByCustomerPrimaryGroupSearch', {
                 CUSTOMER_ID,
                 START_DATE,
                 END_DATE,
                 CUSTOMER_PRIMARY_GROUP_ID,
                 SUBSIDIARY_ID,
             });
             var sales_cus_primary_group_customerchild = [];
             sales_cus_primary_group_customerchild = apiMethods.getChildCustomers(CUSTOMER_ID);
             log.debug('executeSalesByCustomerPrimaryGroupSearch child customers', sales_cus_primary_group_customerchild);
             log.debug('START_DATE child customers', START_DATE);
             log.debug('eEND_DATE', END_DATE);
             const invoiceSearchObj = search.create({
                 type: "invoice",
                 filters: [
                     ["type", "anyof", "CustInvc"], //Type  is Invoice
                     "AND",
                     ["name", "noneof", sales_cus_primary_group_customerchild], //Name is not CUSTOMER_ID
                     "AND",
                     ["customer.custentity1", "anyof", CUSTOMER_PRIMARY_GROUP_ID], //Customer : Customer Primary Group (Custom)  is any of CUSTOMER_PRIMARY_GROUP
                     "AND",
                     ["mainline", "is", "F"], //Main Line    is false
                     "AND",
                     ["taxline", "is", "F"], //Tax Line  is false
                     "AND",
                     ["shipping", "is", "F"], //Shipping Line    is false
                     "AND",
                     ["accounttype", "anyof", "Income"], //Account Type  is Income
                     "AND",
                     ["item.type", "anyof", "Assembly", "InvtPart", "Group", "Kit"], //Item : Type   is any of Assembly/Bill of Materials, Inventory Item, Item Group, Kit/Package
                     "AND",
                     ["item.subsidiary", "anyof", SUBSIDIARY_ID], //item subsidary based on customer subsidiary
                     "AND",
                     [`formulanumeric: CASE WHEN {trandate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"],
                     "AND",
                     [`formulanumeric: CASE WHEN {trandate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"],
                     "AND",
                     ["item.internalid","noneof","15804","10694","10494","10493","9161"]
                 ],
                 columns: [
                     search.createColumn({
                         name: "item",
                         summary: "GROUP",
                         label: "item"
                     }),
                     search.createColumn({
                         name: "salesdescription",
                         join: "item",
                         summary: "MAX",
                         label: "salesdescription"
                     }),
                     search.createColumn({
                         name: "amount",
                         summary: "SUM",
                         sort: search.Sort.DESC,
                         label: "fxamount"
                     }),

                     search.createColumn({
                         name: "quantity",
                         summary: "SUM",
                         label: "quantity"
                     }),

                     search.createColumn({
                         name: "formulatext",
                         summary: "GROUP",
                         formula: "",
                         label: "Color"
                     })
                 ]
             });
             log.debug('executeSalesByCustomerPrimaryGroupSearch object', invoiceSearchObj);
             //invoiceSearchObj.save();

             let columns = dataSets.fetchSavedSearchColumn(invoiceSearchObj, 'label');
             let searchResultCount = invoiceSearchObj.runPaged().count;
             log.debug("executeSalesByCustomerPrimaryGroupSearch result count", searchResultCount);

             var myResultSet = invoiceSearchObj.run();

             var resultRange = myResultSet.getRange({
                 start: 0,
                 end: 10
             });
             var primaryItemArray=[];

             for (var i = 0; i < resultRange.length; i++) {

                 primaryItemArray.push(resultRange[i].getValue({
                     name: "item",
                     summary: "GROUP",
                     label: "item"
                 }))
             }


             log.debug("primaryItemArray",primaryItemArray);

             // get the item is purchased by the customer
             //JJ0016 -TEST
             var primaryItemArrayAfterCustomer =  dataSets.getPrimaryTopTenPurchase(CUSTOMER_ID,primaryItemArray,sales_cus_primary_group_customerchild);


             var itemArrayWithoutClr= invoiceSearchObj.run().getRange({ start: 0, end: 10 }).reduce((acc, el) => {
                 return acc.push(dataSets.formatSingleSavedSearchResult(el, columns)), acc;
             }, []);
             log.debug("itemArrayWithoutClr",itemArrayWithoutClr)

             var newDataArray = dataSets.combineArrayOfObjects(itemArrayWithoutClr,primaryItemArrayAfterCustomer);

             return newDataArray;
         },
         /**
          * @description - Combining 2 array of objects into 1 array of object
          */
         combineArrayOfObjects(itemArrayWithoutClr,primaryItemArrayAfterCustomer){
             try {

                 log.debug("primaryItemArrayAfterCustomer B4",primaryItemArrayAfterCustomer)
                 log.debug("itemArrayWithoutClr B4",itemArrayWithoutClr)

                 for(var i=0;i<primaryItemArrayAfterCustomer.length;i++){
                     for(var j=0;j<itemArrayWithoutClr.length;j++){
                         if(primaryItemArrayAfterCustomer[i].item ==itemArrayWithoutClr[j]["item"]["value"]){
                             itemArrayWithoutClr[j]["Color"]["value"] =primaryItemArrayAfterCustomer[i].clr;
                         }

                     }



                 }

                 log.debug("AFTER SORTED",itemArrayWithoutClr)
                 return itemArrayWithoutClr;

             }catch (e) {
                 log.debug("Err @ combineArray fn",e)

             }
         },

         /**
          * @description - saved search will retrieve the last purchase date of top 10 items purchased by other customers
          * @param
          *
          */
         getPrimaryTopTenPurchase(CUSTOMER_ID, primaryItemArray,sales_cus_primary_group_customerchild){

             var itemArray=[];

             try{


             //loading search
             var salesOrderSearch = search.load({
                 id: 'customsearch5601'
             });

             var filterArray = salesOrderSearch.filters;

             filterArray.push(search.createFilter({
                 name: 'internalid',
                 join: 'customer',
                 operator: search.Operator.ANYOF,
                 values: sales_cus_primary_group_customerchild
             }),
                 search.createFilter({
                     name: 'internalid',
                     join: 'item',
                     operator: search.Operator.ANYOF,
                     values: primaryItemArray
                 }));



             salesOrderSearch.run().each(function(result){
                 // .run().each has a limit of 4,000 results


                 var obj={};
                 var column=salesOrderSearch.columns;
                 obj.datePurchased  = result.getValue(column[1]);
                 if(obj.datePurchased<=180){
                     obj.clr="color: #5cd65c;"
                 }else if(obj.datePurchased>180){
                     obj.clr="color: #FFBF00;"
                 }else{
                     obj.clr ="color: #e60000;"
                 }
                 obj.item=  result.getValue(column[0])
                 itemArray.push(obj)
              /*   obj.item=  result.getValue(salesOrderSearch.columns[0])
                 obj.datePurchased = result.getValue(salesOrderSearch.columns[1]);
                 itemArray.push(obj)*/
                 return true;
             });

             log.debug("itemArray - JJ0016",itemArray);

             for(var i=0;i<primaryItemArray.length;i++){
                 var count=0;
                 for(var j=0;j<itemArray.length;j++){
                     if(primaryItemArray[i]==itemArray[j]["item"]){
                         count++;
                     }
                 }
                 if(count==0){
                     //add value to itemarray
                     itemArray.push({

                         "datePurchased": "",
                         "clr": "color: #e60000;",
                         "item": primaryItemArray[i]

                     })
                 }
             }
                 log.debug("itemArray - JJ0016 AFTER",itemArray);
                 return itemArray;

             }catch (e) {
                 log.debug("err@getting details",e.message)

             }




         },




         /**
          * @description - Saved Search which will retrieve the top Sales for customer with same Customer : Distribution Channel
          * @param {Number} CUSTOMER_ID  - Internal Id of the customer
          * @param {String} START_DATE  - Start Date
          * @param {String} END_DATE  - End Date
          * @param {Number} DISTRIBUTION_CHANNEL  - Customer : Distribution Channel
          * @returns {[]|Object[]}
          */
         executeSalesByDistributionChannelSearch({ CUSTOMER_ID, START_DATE, END_DATE, DISTRIBUTION_CHANNEL_ID, SUBSIDIARY_ID }) {
             log.debug('executeSalesByDistributionChannelSearch', {
                 CUSTOMER_ID,
                 START_DATE,
                 END_DATE,
                 DISTRIBUTION_CHANNEL_ID,
                 SUBSIDIARY_ID,
             });
             var sales_sales_distribution_customerchild = [];
             sales_sales_distribution_customerchild = apiMethods.getChildCustomers(CUSTOMER_ID);
             const invoiceSearchObj = search.create({
                 type: "invoice",
                 filters: [
                     ["type", "anyof", "CustInvc"], //Type   is Invoice
                     "AND",
                     ["name", "noneof", sales_sales_distribution_customerchild], //Name is not CUSTOMER_ID
                     "AND",
                     ["customer.custentity_distribution_channel", "anyof", DISTRIBUTION_CHANNEL_ID], //Customer : Distribution Channel (Custom)  is any of E-Commerce, Power Tool
                     "AND",
                     ["mainline", "is", "F"], //Main Line    is false
                     "AND",
                     ["taxline", "is", "F"], //Tax Line  is false
                     "AND",
                     ["shipping", "is", "F"], //Shipping Line    is false
                     "AND",
                     ["accounttype", "anyof", "Income"], //Account Type  is Income
                     "AND",
                     ["item.type", "anyof", "Assembly", "InvtPart", "Group", "Kit"], //Item : Type   is any of Assembly/Bill of Materials, Inventory Item, Item Group, Kit/Package
                     "AND",
                     ["item.subsidiary", "anyof", SUBSIDIARY_ID], //item subsidary based on customer subsidiary
                     "AND",
                     [`formulanumeric: CASE WHEN {trandate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"],
                     "AND",
                     [`formulanumeric: CASE WHEN {trandate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"]

                 ],
                 columns: [
                     search.createColumn({
                         name: "item",
                         summary: "GROUP",
                         label: "item"
                     }),
                     search.createColumn({
                         name: "salesdescription",
                         join: "item",
                         summary: "MAX",
                         label: "salesdescription"
                     }),
                     search.createColumn({
                         name: "amount",
                         summary: "SUM",
                         sort: search.Sort.DESC,
                         label: "fxamount"
                     }),
                     search.createColumn({
                         name: "quantity",
                         summary: "SUM",
                         label: "quantity"
                     })
                 ]
             });



             let columns = dataSets.fetchSavedSearchColumn(invoiceSearchObj, 'label');
             let searchResultCount = invoiceSearchObj.runPaged().count;
             log.debug("executeSalesByDistributionChannelSearch result count", searchResultCount);
             return invoiceSearchObj.run().getRange({ start: 0, end: 10 }).reduce((acc, el) => {
                 return acc.push(dataSets.formatSingleSavedSearchResult(el, columns)), acc;
             }, []);
         },
         /**
          * @description - Saved Search which will retrieve the activities and cases for the customer within the given date range
          * @param {Number} CUSTOMER_ID  - Internal Id of the customer
          * @param {String} START_DATE  - Start Date
          * @param {String} END_DATE  - End Date
          * @returns {[]|Object[]}
          */
         executeActivitiesAndCasesSearch({ CUSTOMER_ID, START_DATE, END_DATE }) {
             log.debug('executeActivitiesAndCasesSearch', {
                 CUSTOMER_ID,
                 START_DATE,
                 END_DATE
             });

             var activities_case_child_customers = [];
             activities_case_child_customers = apiMethods.getChildCustomers(CUSTOMER_ID);
             log.debug('executeActivitiesAndCasesSearch child customers', activities_case_child_customers);

             const customerSearchObj = search.create({
                 type: "customer",
                 filters: [
                     ["stage", "anyof", "CUSTOMER"], //Stage is Customer
                     "AND",
                     ["isinactive", "is", "F"], //Inactive   is false
                     "AND",
                     ["internalid", "anyof", activities_case_child_customers], //Internal ID is CUSTOMER_ID
                     "AND",
                     [
                         [
                             [`formulanumeric: CASE WHEN {activity.createddate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"],
                             "AND",
                             [`formulanumeric: CASE WHEN {activity.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"]

                         ],
                         "OR",
                         [
                             [`formulanumeric: CASE WHEN {case.createddate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"],
                             "AND",
                             [`formulanumeric: CASE WHEN {case.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"]
                         ]
                     ]
                 ],
                 columns: [
                     /* search.createColumn({
                          name: "internalid",
                          summary: "GROUP",
                          sort: search.Sort.ASC,
                          label: "customerInternalId"
                      }),*/
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `COUNT(DISTINCT (CASE WHEN ({activity.type} ='Event' AND ({activity.createddate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') AND {activity.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') )) THEN {activity.internalid} ELSE NULL END))`,
                         label: "activityCount"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `COUNT(DISTINCT(CASE WHEN (({activity.type} ='Phone Call' OR {activity.type} ='Event') AND ({activity.createddate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') AND  {activity.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD'))) THEN {activity.internalid} ELSE NULL END))`,
                         label: "totalAcivitySum"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `((COUNT(DISTINCT (CASE WHEN (({activity.type} ='Phone Call' OR {activity.type} ='Event') AND ({activity.createddate}>= TO_DATE('${START_DATE}','YYYY-MM-DD') AND {activity.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') )) THEN {activity.internalid} ELSE NULL END)))/NULLIF(COUNT(DISTINCT(CASE WHEN (({activity.type} ='Phone Call' OR {activity.type} ='Event') AND ({activity.createddate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') AND  {activity.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD'))) THEN {activity.internalid} ELSE NULL END)) ,0))*100*0.1`,
                         label: "activityWeighting"
                     }),
                     search.createColumn({
                         name: "internalid",
                         join: "case",
                         summary: "COUNT",
                         label: "casesCount"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "COUNT",
                         formula: `CASE WHEN ({case.status} != 'Closed' AND {case.createddate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') AND  {case.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD')) THEN {case.internalid} ELSE NULL END`,
                         label: "countOfOpenCases"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `(COUNT(CASE WHEN ({case.status} != 'Closed' AND {case.createddate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') AND  {case.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD')) THEN {case.internalid} ELSE NULL END)/NULLIF(COUNT(CASE WHEN ({case.createddate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') AND  {case.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD')) THEN {case.internalid} ELSE NULL END),0))*100`,
                         label: "casePercentage"
                     }),
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         formula: `(COUNT(CASE WHEN ({case.status} != 'Closed' AND {case.createddate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') AND  {case.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD')) THEN {case.internalid} ELSE NULL END)/NULLIF(COUNT(CASE WHEN ({case.createddate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') AND  {case.createddate} <= TO_DATE('${END_DATE}','YYYY-MM-DD')) THEN {case.internalid} ELSE NULL END) ,0))*0.15*100`,
                         label: "caseWeighting"
                     })
                 ]
             });



             let searchResultCount = customerSearchObj.runPaged().count;
             log.debug("executeActivitiesAndCasesSearch result count", searchResultCount);

             try {
                 //customerSearchObj.save();
             } catch (e) {
                 log.debug("cases search", e);

             }
             return dataSets.iterateSavedSearch(customerSearchObj, dataSets.fetchSavedSearchColumn(customerSearchObj, 'label'));
         },
         executeCountOfMonths({CUSTOMER_ID, START_DATE, END_DATE }){
             log.debug('month count????');
             var customerArr = [];
             var customerArr2 =[];
             customerArr = apiMethods.getChildCustomers(CUSTOMER_ID);

             var customer_total_count = customerArr.length;


             log.debug('customer len',customer_total_count);
             var monthCountSearchObj = search.create({
                 type: "customer",
                 filters:[
                     ["internalidnumber", "equalto", CUSTOMER_ID]


                 ],
                 columns: [
                     search.createColumn({
                         name: "formulanumeric",
                         summary: "MAX",
                         //formula: `EXTRACT(MONTH FROM  TO_DATE('${END_DATE}','YYYY-MM-DD'))-EXTRACT(MONTH FROM  TO_DATE('${START_DATE}','YYYY-MM-DD'))`,
                         formula:`((EXTRACT(YEAR FROM  TO_DATE('${END_DATE}','YYYY-MM-DD')) *12 + EXTRACT(MONTH FROM  TO_DATE('${END_DATE}','YYYY-MM-DD'))) - (EXTRACT(YEAR FROM  TO_DATE('${START_DATE}','YYYY-MM-DD')) *12 + EXTRACT(MONTH FROM  TO_DATE('${START_DATE}','YYYY-MM-DD'))))*${customer_total_count}`,
                         label: "monthCount"
                     }),
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `TO_CHAR(TO_DATE('${START_DATE}','YYYY-MM-DD'),'YYYY-MM-DD')`,
                         label: "startDate"
                     }),
                     search.createColumn({
                         name: "formulatext",
                         summary: "MAX",
                         formula: `TO_CHAR(TO_DATE('${END_DATE}','YYYY-MM-DD'),'YYYY-MM-DD')`,
                         label: "endDate"
                     })
                 ]
             });
             //monthCountSearchObj.save();
             let  monthCountSearchObjCount = monthCountSearchObj.runPaged().count;
             log.debug("childCustomerSearchObj result count", monthCountSearchObjCount);
             return dataSets.iterateSavedSearch(monthCountSearchObj, dataSets.fetchSavedSearchColumn(monthCountSearchObj, 'label'));
         },
         executeMarketingSupportActivitySearch({CUSTOMER_ID, START_DATE, END_DATE}){
             log.debug('in Marketing support search?????');
             var marketing_support_child_customers = [];
             marketing_support_child_customers = apiMethods.getChildCustomers(CUSTOMER_ID);
             const marketingSupportSearchobj = search.create({
                 type: "calendarevent",
                 filters:
                     [
                         ["custevent_jj_marketing_support_otgn976","is","T"],
                         "AND",
                         ["attendeecustomer.internalid","anyof",marketing_support_child_customers],
                         "AND",
                         [`formulanumeric: CASE WHEN  {startdate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"],
                         "AND",
                         [`formulanumeric: CASE WHEN  {startdate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"]

                     ],
                 columns:
                     [
                         search.createColumn({
                             name: "createddate",
                             summary: "GROUP",
                             sort: search.Sort.DESC,
                             label: "dateCreated"
                         }),
                         search.createColumn({
                             name: "title",
                             summary: "GROUP",
                             label: "eventTitle"
                         }),
                         search.createColumn({
                             name: "custevent_jj_marketing_support_list",
                             summary: "MAX",
                             label: "marketingSupport"
                         }),
                         search.createColumn({
                             name: "custevent_jj_marketing_support_otgn976",
                             summary: "MAX",
                             label: "marketingSupportProvided"
                         })
                     ]
             });
             //marketingSupportSearchobj.save();
             var searchResultCount = marketingSupportSearchobj.runPaged().count;
             log.debug("calendareventSearchObj result count",searchResultCount);
             return dataSets.iterateSavedSearch(marketingSupportSearchobj, dataSets.fetchSavedSearchColumn(marketingSupportSearchobj, 'label'));

         },
         executeTrainingActivitySearch({CUSTOMER_ID, START_DATE, END_DATE}){
             var training_activity_child_customers = [];
             training_activity_child_customers = apiMethods.getChildCustomers(CUSTOMER_ID);
             const trainingActivitySearchobj = search.create({
                 type: "calendarevent",
                 filters:
                     [
                         ["custevent_jj_training_conducted_otgn976","is","T"],
                         "AND",
                         ["attendeecustomer.internalid","anyof",training_activity_child_customers],
                         "AND",
                         [`formulanumeric: CASE WHEN {startdate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"],
                         "AND",
                         [`formulanumeric: CASE WHEN {startdate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"]

                     ],
                 columns:
                     [
                         search.createColumn({
                             name: "createddate",
                             summary: "GROUP",
                             sort: search.Sort.DESC,
                             label: "dateCreated"
                         }),
                         search.createColumn({
                             name: "title",
                             summary: "GROUP",
                             label: "eventTitle"
                         }),
                         search.createColumn({
                             name: "custevent_jj_training_provided_otgn976",
                             summary: "MAX",
                             label: "trainingProvided"
                         }),
                         search.createColumn({
                             name: "custevent_jj_training_conducted_otgn976",
                             summary: "MAX",
                             label: "trainingConducted"
                         })
                     ]
             });
             //trainingActivitySearchobj.save();
             var searchResultCount = trainingActivitySearchobj.runPaged().count;
             log.debug("calendareventSearchObj result count",searchResultCount);
             return dataSets.iterateSavedSearch(trainingActivitySearchobj, dataSets.fetchSavedSearchColumn(trainingActivitySearchobj, 'label'));

         },
         /**
          * @description - Saved Search which will retrieve the customer's top selling items by revenue
          * @param {Number} CUSTOMER_ID  - Internal Id of the customer
          * @param {String} START_DATE  - Start Date
          * @param {String} END_DATE  - End Date
          * @returns {[]|Object[]}
          */
         executeTopTenItemsByRevenue({ CUSTOMER_ID, START_DATE, END_DATE }) {
             log.debug('executeTopTenItemsByRevenue', {
                 CUSTOMER_ID,
                 START_DATE,
                 END_DATE,
             });

             var top_ten_items_child_customers = [];
             top_ten_items_child_customers = apiMethods.getChildCustomers(CUSTOMER_ID);
             log.debug('executeTopTenItemsByRevenue child customers ', top_ten_items_child_customers);

             const invoiceSearchObj = search.create({
                 type: "salesorder",
                 filters: [
                     ["type", "anyof", "SalesOrd"], //Type  is Invoice
                     "AND",
                     ["name", "anyof", top_ten_items_child_customers], //Name is not CUSTOMER_ID
                     "AND",
                     ["mainline", "is", "F"], //Main Line    is false
                     "AND",
                     ["taxline", "is", "F"], //Tax Line  is false
                     "AND",
                     ["shipping", "is", "F"], //Shipping Line    is false
                     "AND",
                     ["item.type", "anyof", "Assembly", "InvtPart", "Group", "Kit"], //Item : Type   is any of Assembly/Bill of Materials, Inventory Item, Item Group, Kit/Package
                     "AND",
                     [`formulanumeric: CASE WHEN {trandate} >= TO_DATE('${START_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"],
                     "AND",
                     [`formulanumeric: CASE WHEN {trandate} <= TO_DATE('${END_DATE}','YYYY-MM-DD') THEN 1 ELSE 0 END`, "equalto", "1"]
                 ],
                 columns: [
                     search.createColumn({
                         name: "item",
                         summary: "GROUP",
                         label: "item"
                     }),
                     search.createColumn({
                         name: "salesdescription",
                         join: "item",
                         summary: "MAX",
                         label: "salesdescription"
                     }),
                     search.createColumn({
                         name: "amount",
                         summary: "SUM",
                         sort: search.Sort.DESC,
                         label: "fxamount"
                     }),
                     search.createColumn({
                         name: "amount",
                         summary: "SUM",
                         label: "Amount"
                     })
                 ]
             });
             let columns = dataSets.fetchSavedSearchColumn(invoiceSearchObj, 'label');
             let searchResultCount = invoiceSearchObj.runPaged().count;
             log.debug("executeTopTenItemsByRevenue result count", searchResultCount);
             return invoiceSearchObj.run().getRange({ start: 0, end: 10 }).reduce((acc, el) => {
                 return acc.push(dataSets.formatSingleSavedSearchResult(el, columns)), acc;
             }, []);
         },
     }
     applyTryCatch(dataSets, 'dataSets');


     /**
      * @description ApiMethods available to the user
      * @type {{listOrders(): ({reason: string, data: null, status: string}),fetchOrder(): ({reason: string, data: null, status: string})}}
      */
     const apiMethods = {
         /**
          * @description To get the Customer Sales Data (Sales Summary, OX Support and Component Weighting)
          * @returns  {{reason: (string), data: null, status: string}|{reason: string, data: (Object[]|*[]), status: string}|{reason: string, data: null, status: string}}
          */



         getSalesData() {
             const requestObj = {
                 'startDate': exports.parameters.startDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), -90)).join(),
                 'endDate': exports.parameters.endDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), 0)).join(),
                 'customerId': exports.parameters.customerId,
             };
             log.debug('getSalesData requestObj', requestObj);
             for (let key in requestObj)
                 if (!checkForParameter((requestObj[key])))
                     return { status: 'FAILURE', reason: 'EMPTY_VALUE', data: null };

             //to check the given date format and range
             if (!dateLogic.validateDateRange(requestObj.startDate.split(","), requestObj.endDate.split(",")))
                 return { status: 'FAILURE', reason: 'INVALID_DATE_RANGE', data: null };


             if (!Number.isInteger(Number(requestObj.customerId)))
                 return { status: 'FAILURE', reason: 'INVALID_INTERNALID', data: null };


             let START_DATE = dateLogic.generateDate(requestObj.startDate.split(","));
             let END_DATE = dateLogic.generateDate(requestObj.endDate.split(","));
             let LAST_YEAR_START_DATE = dateLogic.addDays(dateLogic.generateDate(dateLogic.dateAsArray(START_DATE)), -365);
             let LAST_YEAR_END_DATE = dateLogic.addDays(dateLogic.generateDate(dateLogic.dateAsArray(END_DATE)), -365);

             const customerSalesResult = dataSets.executeCustomerSalesSearch({
                 CUSTOMER_ID: Number(requestObj.customerId),
                 START_DATE: dateLogic.formatDate(START_DATE, NETSUITE_CONFIG.date_format),
                 END_DATE: dateLogic.formatDate(END_DATE, NETSUITE_CONFIG.date_format),
                 LAST_YEAR_START_DATE: dateLogic.formatDate(LAST_YEAR_START_DATE, NETSUITE_CONFIG.date_format),
                 LAST_YEAR_END_DATE: dateLogic.formatDate(LAST_YEAR_END_DATE, NETSUITE_CONFIG.date_format)
             });
             log.debug('customerSalesResult[0]', customerSalesResult[0]);

             //Only if there is an array length and not a false response
             if (customerSalesResult && util.isArray(customerSalesResult) && customerSalesResult.length){
                 //XXXXX
                 var scriptObj = runtime.getCurrentScript();

                 var promotionLink = scriptObj.getParameter({
                     name: 'custscript_promotion_link_otga1284'
                 });
                 log.debug("promotionLink",promotionLink)
                 customerSalesResult[0]["promotionLink"]=promotionLink;

                 return { status: 'SUCCESS', reason: 'RECORD_FOUND', data: { salesData: customerSalesResult[0] } };

             }


             return { status: 'FAILURE', reason: ERROR_STACK.length ? 'ERROR' : 'NO_CUSTOMER_FOUND', data: null };
         },
         /**
          * @description To get the Customer's Sales by product category
          * @returns  {{reason: (string), data: null, status: string}|{reason: string, data: (Object[]|*[]), status: string}|{reason: string, data: null, status: string}}
          */
         getSalesByProductCategory() {
             const requestObj = {
                 'startDate': exports.parameters.startDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), -90)).join(),
                 'endDate': exports.parameters.endDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), 0)).join(),
                 'customerId': exports.parameters.customerId,
             };
             log.debug('getSalesByProductCategory requestObj', requestObj);
             log.debug('getSalesByProductCategory requestObj1111', exports.parameters);

             for (let key in requestObj)
                 if (!checkForParameter((requestObj[key])))
                     return { status: 'FAILURE', reason: 'EMPTY_VALUE', data: null };

             //to check the given date format and range
             if (!dateLogic.validateDateRange(requestObj.startDate.split(","), requestObj.endDate.split(",")))
                 return { status: 'FAILURE', reason: 'INVALID_DATE_RANGE', data: null };

             if (!Number.isInteger(Number(requestObj.customerId)))
                 return { status: 'FAILURE', reason: 'INVALID_INTERNALID', data: null };

             let START_DATE = dateLogic.generateDate(requestObj.startDate.split(","));
             let END_DATE = dateLogic.generateDate(requestObj.endDate.split(","));
             let LAST_YEAR_START_DATE = dateLogic.addDays(dateLogic.generateDate(dateLogic.dateAsArray(START_DATE)), -365);
             let LAST_YEAR_END_DATE = dateLogic.addDays(dateLogic.generateDate(dateLogic.dateAsArray(END_DATE)), -365);


             const customerSalesResult = dataSets.executeSalesByProductCategorySearch({
                 CUSTOMER_ID: Number(requestObj.customerId),
                 START_DATE: dateLogic.formatDate(START_DATE, NETSUITE_CONFIG.date_format),
                 END_DATE: dateLogic.formatDate(END_DATE, NETSUITE_CONFIG.date_format),
                 LAST_YEAR_START_DATE: dateLogic.formatDate(LAST_YEAR_START_DATE, NETSUITE_CONFIG.date_format),
                 LAST_YEAR_END_DATE: dateLogic.formatDate(LAST_YEAR_END_DATE, NETSUITE_CONFIG.date_format)
             });

             //Only if there is an array length and not a false response
             if (customerSalesResult && util.isArray(customerSalesResult) && customerSalesResult.length)
                 return {
                     status: 'SUCCESS',
                     reason: 'RECORD_FOUND',
                     data: { salesByProductCategory: customerSalesResult }
                 };

             return { status: 'FAILURE', reason: ERROR_STACK.length ? 'ERROR' : 'NO_RECORD_FOUND', data: null };
         },
         /**
          * @description To get the other Customer's Sales by Customer Primary Group
          * @returns  {{reason: (string), data: null, status: string}|{reason: string, data: (Object[]|*[]), status: string}|{reason: string, data: null, status: string}}
          */
         getSalesByCustomerPrimaryGroup() {
             const requestObj = {
                 'startDate': exports.parameters.startDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), -90)).join(),
                 'endDate': exports.parameters.endDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), 0)).join(),
                 'customerId': exports.parameters.customerId,
                 'customerPrimaryGroupId': exports.parameters.customerPrimaryGroupId,
                 'subsidiary': exports.parameters.subsidiary,
             };
             log.debug('getSalesByProductCategory requestObj', requestObj);
             log.debug('getSalesByProductCategory requestObj1111', exports.parameters.customerPrimaryGroupId);
             log.debug('getSalesByProductCategory requestObj2222', exports.parameters.subsidiary);

             for (let key in requestObj)
                 if (!checkForParameter((requestObj[key])))
                     return { status: 'FAILURE', reason: 'EMPTY_VALUE', data: null };

             //to check the given date format and range
             if (!dateLogic.validateDateRange(requestObj.startDate.split(","), requestObj.endDate.split(",")))
                 return { status: 'FAILURE', reason: 'INVALID_DATE_RANGE', data: null };

             if (!Number.isInteger(Number(requestObj.customerId)) || !Number.isInteger(Number(requestObj.customerPrimaryGroupId)))
                 return { status: 'FAILURE', reason: 'INVALID_INTERNALID', data: null };

             let START_DATE = dateLogic.generateDate(requestObj.startDate.split(","));
             let END_DATE = dateLogic.generateDate(requestObj.endDate.split(","));

             const salesResult = dataSets.executeSalesByCustomerPrimaryGroupSearch({
                 CUSTOMER_ID: Number(requestObj.customerId),
                 START_DATE: dateLogic.formatDate(START_DATE, NETSUITE_CONFIG.date_format),
                 END_DATE: dateLogic.formatDate(END_DATE, NETSUITE_CONFIG.date_format),
                 CUSTOMER_PRIMARY_GROUP_ID: Number(requestObj.customerPrimaryGroupId),
                 SUBSIDIARY_ID: Number(requestObj.subsidiary),
             });

             //Only if there is an array length and not a false response
             if (salesResult && util.isArray(salesResult) && salesResult.length)
                 return {
                     status: 'SUCCESS',
                     reason: 'RECORD_FOUND',
                     data: { salesByCustomerPrimaryGroup: salesResult }
                 };

             return { status: 'FAILURE', reason: ERROR_STACK.length ? 'ERROR' : 'NO_RECORD_FOUND', data: null };
         },
         /**
          * @description To get the other Customer's Sales by Distribution Channel
          * @returns  {{reason: (string), data: null, status: string}|{reason: string, data: (Object[]|*[]), status: string}|{reason: string, data: null, status: string}}
          */
         getSalesByDistributionChannel() {
             const requestObj = {
                 'startDate': exports.parameters.startDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), -90)).join(),
                 'endDate': exports.parameters.endDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), 0)).join(),
                 'customerId': exports.parameters.customerId,
                 'customerDistributionChannelId': exports.parameters.customerDistributionChannelId,
                 'subsidiary': exports.parameters.subsidiary,
             };
             log.debug('getSalesByProductCategory requestObj', requestObj);

             for (let key in requestObj)
                 if (!checkForParameter((requestObj[key])))
                     return { status: 'FAILURE', reason: 'EMPTY_VALUE', data: null };

             //to check the given date format and range
             if (!dateLogic.validateDateRange(requestObj.startDate.split(","), requestObj.endDate.split(",")))
                 return { status: 'FAILURE', reason: 'INVALID_DATE_RANGE', data: null };

             if (!Number.isInteger(Number(requestObj.customerId)) || !Number.isInteger(Number(requestObj.customerDistributionChannelId)))
                 return { status: 'FAILURE', reason: 'INVALID_INTERNALID', data: null };

             let START_DATE = dateLogic.generateDate(requestObj.startDate.split(","));
             let END_DATE = dateLogic.generateDate(requestObj.endDate.split(","));

             const salesResult = dataSets.executeSalesByDistributionChannelSearch({
                 CUSTOMER_ID: Number(requestObj.customerId),
                 START_DATE: dateLogic.formatDate(START_DATE, NETSUITE_CONFIG.date_format),
                 END_DATE: dateLogic.formatDate(END_DATE, NETSUITE_CONFIG.date_format),
                 DISTRIBUTION_CHANNEL_ID: Number(requestObj.customerDistributionChannelId),
                 SUBSIDIARY_ID: Number(requestObj.subsidiary),
             });

             //Only if there is an array length and not a false response
             if (salesResult && util.isArray(salesResult) && salesResult.length)
                 return {
                     status: 'SUCCESS',
                     reason: 'RECORD_FOUND',
                     data: { salesByDistributionChannel: salesResult }
                 };

             return { status: 'FAILURE', reason: ERROR_STACK.length ? 'ERROR' : 'NO_RECORD_FOUND', data: null };
         },
         /**
          * @description To get activities and cases for the customer within the given date range
          * @returns  {{reason: (string), data: null, status: string}|{reason: string, data: (Object[]|*[]), status: string}|{reason: string, data: null, status: string}}
          */
         getActivitiesAndCases() {
             const requestObj = {
                 'startDate': exports.parameters.startDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), -90)).join(),
                 'endDate': exports.parameters.endDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), 0)).join(),
                 'customerId': exports.parameters.customerId,
             };
             log.debug('getActivitiesAndCases requestObj', requestObj);

             for (let key in requestObj)
                 if (!checkForParameter((requestObj[key])))
                     return { status: 'FAILURE', reason: 'EMPTY_VALUE', data: null };

             //to check the given date format and range
             if (!dateLogic.validateDateRange(requestObj.startDate.split(","), requestObj.endDate.split(",")))
                 return { status: 'FAILURE', reason: 'INVALID_DATE_RANGE', data: null };

             if (!Number.isInteger(Number(requestObj.customerId)))
                 return { status: 'FAILURE', reason: 'INVALID_INTERNALID', data: null };

             let START_DATE = dateLogic.generateDate(requestObj.startDate.split(","));
             let END_DATE = dateLogic.generateDate(requestObj.endDate.split(","));

             const customerResult = dataSets.executeActivitiesAndCasesSearch({
                 CUSTOMER_ID: Number(requestObj.customerId),
                 START_DATE: dateLogic.formatDate(START_DATE, NETSUITE_CONFIG.date_format),
                 END_DATE: dateLogic.formatDate(END_DATE, NETSUITE_CONFIG.date_format),
             });

             //Only if there is an array length and not a false response
             if (customerResult && util.isArray(customerResult) && customerResult.length)
                 return {
                     status: 'SUCCESS',
                     reason: 'RECORD_FOUND',
                     data: { customerActivitiesAndCases: customerResult[0] }
                 };

             return { status: 'FAILURE', reason: ERROR_STACK.length ? 'ERROR' : 'NO_RECORD_FOUND', data: null };

         },
         countOfMonthsInSelectedPeriod(){
             const requestObj = {
                 'startDate': exports.parameters.startDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), -90)).join(),
                 'endDate': exports.parameters.endDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), 0)).join(),
                 'customerId': exports.parameters.customerId,
             };
             let START_DATE = dateLogic.generateDate(requestObj.startDate.split(","));
             let END_DATE = dateLogic.generateDate(requestObj.endDate.split(","));

             const customerResult = dataSets.executeCountOfMonths({
                 CUSTOMER_ID: Number(requestObj.customerId),
                 START_DATE: dateLogic.formatDate(START_DATE, NETSUITE_CONFIG.date_format),
                 END_DATE: dateLogic.formatDate(END_DATE, NETSUITE_CONFIG.date_format),
             });
             if (customerResult && util.isArray(customerResult) && customerResult.length)
                 return {
                     status: 'SUCCESS',
                     reason: 'RECORD_FOUND',
                     data: { monthCountInPeriod: customerResult[0] }
                 };

             return { status: 'FAILURE', reason: ERROR_STACK.length ? 'ERROR' : 'NO_RECORD_FOUND', data: null };

         },
         getMarketingSupportActivity(){
             log.debug('in marketing support method??????')
             const requestObj = {
                 'startDate': exports.parameters.startDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), -90)).join(),
                 'endDate': exports.parameters.endDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), 0)).join(),
                 'customerId': exports.parameters.customerId,
             };
             log.debug('getActivitiesAndCases requestObj', requestObj);

             for (let key in requestObj)
                 if (!checkForParameter((requestObj[key])))
                     return { status: 'FAILURE', reason: 'EMPTY_VALUE', data: null };

             //to check the given date format and range
             if (!dateLogic.validateDateRange(requestObj.startDate.split(","), requestObj.endDate.split(",")))
                 return { status: 'FAILURE', reason: 'INVALID_DATE_RANGE', data: null };

             if (!Number.isInteger(Number(requestObj.customerId)))
                 return { status: 'FAILURE', reason: 'INVALID_INTERNALID', data: null };

             let START_DATE = dateLogic.generateDate(requestObj.startDate.split(","));
             let END_DATE = dateLogic.generateDate(requestObj.endDate.split(","));

             const customerResult = dataSets.executeMarketingSupportActivitySearch({
                 CUSTOMER_ID: Number(requestObj.customerId),
                 START_DATE: dateLogic.formatDate(START_DATE, NETSUITE_CONFIG.date_format),
                 END_DATE: dateLogic.formatDate(END_DATE, NETSUITE_CONFIG.date_format)
             });

             //Only if there is an array length and not a false response
             if (customerResult && util.isArray(customerResult) && customerResult.length)
                 return {
                     status: 'SUCCESS',
                     reason: 'RECORD_FOUND',
                     data: { marketingSupportActivities: customerResult[0] }
                 };

             return { status: 'FAILURE', reason: ERROR_STACK.length ? 'ERROR' : 'NO_RECORD_FOUND', data: null };


         },
         getTrainingActivity(){
             log.debug('in marketing support method??????')
             const requestObj = {
                 'startDate': exports.parameters.startDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), -90)).join(),
                 'endDate': exports.parameters.endDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), 0)).join(),
                 'customerId': exports.parameters.customerId,
             };
             log.debug('getActivitiesAndCases requestObj', requestObj);

             for (let key in requestObj)
                 if (!checkForParameter((requestObj[key])))
                     return { status: 'FAILURE', reason: 'EMPTY_VALUE', data: null };

             //to check the given date format and range
             if (!dateLogic.validateDateRange(requestObj.startDate.split(","), requestObj.endDate.split(",")))
                 return { status: 'FAILURE', reason: 'INVALID_DATE_RANGE', data: null };

             if (!Number.isInteger(Number(requestObj.customerId)))
                 return { status: 'FAILURE', reason: 'INVALID_INTERNALID', data: null };

             let START_DATE = dateLogic.generateDate(requestObj.startDate.split(","));
             let END_DATE = dateLogic.generateDate(requestObj.endDate.split(","));

             const customerResult = dataSets.executeTrainingActivitySearch({
                 CUSTOMER_ID: Number(requestObj.customerId),
                 START_DATE: dateLogic.formatDate(START_DATE, NETSUITE_CONFIG.date_format),
                 END_DATE: dateLogic.formatDate(END_DATE, NETSUITE_CONFIG.date_format)
             });

             //Only if there is an array length and not a false response
             if (customerResult && util.isArray(customerResult) && customerResult.length)
                 return {
                     status: 'SUCCESS',
                     reason: 'RECORD_FOUND',
                     data: { trainingtActivities: customerResult[0] }
                 };

             return { status: 'FAILURE', reason: ERROR_STACK.length ? 'ERROR' : 'NO_RECORD_FOUND', data: null };

         },
         /**
          * @description To get the Customer's top ten bought items by amount (revenue)
          * @returns  {{reason: (string), data: null, status: string}|{reason: string, data: (Object[]|*[]), status: string}|{reason: string, data: null, status: string}}
          */
         getSalesByCustomerTopTen() {
             const requestObj = {
                 'startDate': exports.parameters.startDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), -90)).join(),
                 'endDate': exports.parameters.endDate || dateLogic.dateAsArray(dateLogic.addDays(new Date(), 0)).join(),
                 'customerId': exports.parameters.customerId,
             };
             log.debug('getSalesByCustomerTopTen requestObj', requestObj);

             for (let key in requestObj)
                 if (!checkForParameter((requestObj[key])))
                     return { status: 'FAILURE', reason: 'EMPTY_VALUE', data: null };

             //to check the given date format and range
             if (!dateLogic.validateDateRange(requestObj.startDate.split(","), requestObj.endDate.split(",")))
                 return { status: 'FAILURE', reason: 'INVALID_DATE_RANGE', data: null };

             if (!Number.isInteger(Number(requestObj.customerId)))
                 return { status: 'FAILURE', reason: 'INVALID_INTERNALID', data: null };

             let START_DATE = dateLogic.generateDate(requestObj.startDate.split(","));
             let END_DATE = dateLogic.generateDate(requestObj.endDate.split(","));

             const customerSalesResult = dataSets.executeTopTenItemsByRevenue({
                 CUSTOMER_ID: Number(requestObj.customerId),
                 START_DATE: dateLogic.formatDate(START_DATE, NETSUITE_CONFIG.date_format),
                 END_DATE: dateLogic.formatDate(END_DATE, NETSUITE_CONFIG.date_format),
             });

             log.debug('executeTopTenItemsByRevenue  customerSalesResult', customerSalesResult);

             //Only if there is an array length and not a false response
             if (customerSalesResult && util.isArray(customerSalesResult) && customerSalesResult.length)
                 return {
                     status: 'SUCCESS',
                     reason: 'RECORD_FOUND',
                     data: { SalesByCustomerTopTen: customerSalesResult }
                 };

             return { status: 'FAILURE', reason: ERROR_STACK.length ? 'ERROR' : 'NO_RECORD_FOUND', data: null };

         },
         getChildCustomers(CUSTOMER_ID) {
             var childCustomerSearchObj = search.create({
                 type: "customer",
                 filters: [
                     [["toplevelparent.internalidnumber", "equalto", CUSTOMER_ID],
                         "OR",
                         ["internalidnumber", "equalto", CUSTOMER_ID],
                         "OR",
                         ["parentcustomer.internalidnumber", "equalto", CUSTOMER_ID]],
                     "AND",
                     ["isinactive", "is", "F"],
                     "AND",
                     ["stage", "anyof", "CUSTOMER"]
                 ],
                 columns: [
                     search.createColumn({
                         name: "internalid",
                         summary: "GROUP",
                         sort: search.Sort.ASC,
                         label: "Internal ID"
                     })
                 ]
             });
             var searchchildResultCount = childCustomerSearchObj.runPaged().count;
             log.debug("childCustomerSearchObj result count", searchchildResultCount);
             var childCustomerID = [];
             childCustomerSearchObj.run().each(function(result) {
                 childCustomerID.push(result.getValue({
                     name: "internalid",
                     summary: "GROUP",
                     sort: search.Sort.ASC,
                     label: "Internal ID"
                 }));
                 return true;
             });

             log.debug("childCustomerID", childCustomerID);
             return childCustomerID;

         }

     };
     applyTryCatch(apiMethods, 'apiMethods');

     const exports = {
         /**
          * @description To initialise the export Object with the Suitelet methods and parameters
          * @param {Object} scriptContext
          * @param {ServerRequest} scriptContext.request - Incoming request
          * @param {ServerResponse} scriptContext.response - Suitelet response
          */
         init(context) {
             this.context = context;
             this.method = context.request.method;
             this.parameters = context.request.parameters;
             this.body = context.request.body;
             //Initialize date format
             NETSUITE_CONFIG.date_format = 'YYYY-MM-DD';
         },
         /**
          * @description To route request based on API Type
          * @returns {{reason: string, data: null, status: string}|undefined|{reason: string, data: null, status: string}}
          */
         routeRequest() {

             if (checkForParameter(exports.parameters.apiType)) {
                 switch (exports.parameters.apiType) {
                     case 'getSalesData': //To get the Customer Sales Data (Sales Summary, OX Support and Component Weighting)
                         return apiMethods.getSalesData();
                     case 'getSalesByProductCategory': //To get the Customer's Sales by product category
                         return apiMethods.getSalesByProductCategory();
                     case 'getSalesByCustomerPrimaryGroup': //To get the other Customer's Sales by Customer Primary Group
                         return apiMethods.getSalesByCustomerPrimaryGroup();
                     case 'getSalesByDistributionChannel': //To get the other Customer's Sales by Distribution Channel
                         return apiMethods.getSalesByDistributionChannel();
                     case 'getActivitiesAndCases': //To get activities and cases for the customer within the given date range
                         return apiMethods.getActivitiesAndCases();
                     case 'getSalesByCustomerTopTen': //To get the Customer's top ten bought items by amount (revenue)
                         return apiMethods.getSalesByCustomerTopTen();
                     case 'countOfMonthsInSelectedPeriod':
                         return apiMethods.countOfMonthsInSelectedPeriod();
                     case 'getMarketingSupportActivity':
                         return apiMethods.getMarketingSupportActivity();
                     case 'getTrainingActivity':
                         return apiMethods.getTrainingActivity();
                     default:
                         return { status: 'FAILURE', reason: 'INVALID_APITYPE', data: null };
                 }
             }
             return { status: 'FAILURE', reason: 'INVALID_APITYPE', data: null };
         },
         /**
          * Defines the Suitelet script trigger point.
          * @param {Object} scriptContext
          * @param {ServerRequest} scriptContext.request - Incoming request
          * @param {ServerResponse} scriptContext.response - Suitelet response
          * @since 2015.2
          */
         onRequest(context) {
             //Initialize Suitelet
             exports.init(context);
             var scriptObj = runtime.getCurrentScript();

             var promotionLink = scriptObj.getParameter({
                 name: 'custscript_promotion_link_otga1284'
             });


             return exports.sendResponse(exports.routeRequest() || {
                 status: 'FAILURE',
                 reason: 'ERROR',
                 data: null
             }), true;
         },
         /**
          * @description Structures and sens the response
          * @param STATUS - It will be either Success or Failure
          * @param REASON - Reason Code
          * @param DATA - Data to be passed if any
          * @returns {boolean}
          */
         sendResponse(STATUS, REASON, DATA) { //All response will be send from this common point
             //log.debug(`arguments.length : ${arguments.length}`, arguments);
             if (arguments.length < 2) {
                 DATA = arguments[0].data;
                 REASON = arguments[0].reason;
                 STATUS = arguments[0].status;
             }

             return this.context.response.write(`${JSON.stringify({
                 summary: {
                     status: STATUS || (ERROR_STACK && util.isArray(ERROR_STACK) && ERROR_STACK.length > 0 ? 'FAILURE' : null),
                     reason: REASON || null,
                     error: (ERROR_STACK ? ERROR_STACK : null) || null,
                     request: {
                         parameters: this.parameters
                     }
                 },
                 data: (DATA ? DATA : null) || null
             })}`), true;
         }
     };
     applyTryCatch(exports, 'exports');

     return exports;

 });