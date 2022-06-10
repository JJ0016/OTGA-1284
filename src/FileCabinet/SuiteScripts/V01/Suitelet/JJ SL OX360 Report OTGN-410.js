/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/render', 'N/runtime', 'N/search', 'N/file', 'N/xml','N/format'],
    /**
     * @param{record} record
     * @param{render} render
     * @param{runtime} runtime
     * @param{search} search
     */
    (record, render, runtime, search, file, xml,format) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                var requests = scriptContext.request.parameters.dataString;

                var requestParsed1 = requests.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;');

                var requestParsed2 = JSON.parse(requestParsed1);

                log.debug('requestParsed2', requestParsed2.dataSets.salesData.startDate)

                var startDateArray =  requestParsed2.dataSets.salesData.startDate.value.split('-');
                var newStartDate =  startDateArray[2]+'/'+startDateArray[1]+'/'+startDateArray[0];
                requestParsed2.dataSets.salesData.startDate.value = newStartDate;


                var endDateArray =  requestParsed2.dataSets.monthCountInPeriod.endDate.value.split('-');
                var newEndDate =  endDateArray[2]+'/'+endDateArray[1]+'/'+endDateArray[0];
                requestParsed2.dataSets.monthCountInPeriod.endDate.value = newEndDate;


                var customerId = requestParsed2.customerId;
                log.debug('customerId', customerId)

                var comments = requestParsed2.comments;
                log.debug('comments', comments)

                if (Number(comments.commentSectionHeight) > 0) {
                    createEventRec(comments, customerId)
                }



                var incentives =  requestParsed2.incentive;
                log.debug('incentives', incentives)

                var performanceIncentiveValueExisting =requestParsed2.dataSets.salesData.performanceIncentiveValue.value;
                var performanceIncentiveExisting = requestParsed2.dataSets.salesData.performanceIncentive.value;

                log.debug("performanceIncentiveValueExisting",performanceIncentiveValueExisting);
                log.debug("performanceIncentiveExisting",performanceIncentiveExisting)

                if (Number(incentives.performanceSectionHeight) > 0) {
                    log.debug(' INN OF incentives', Number(incentives.performanceSectionHeight));
                    saveToCustomerRecord(incentives,customerId);
                }else if(performanceIncentiveExisting || performanceIncentiveValueExisting){
                    log.debug(' ELSE OF incentives', Number(incentives.performanceSectionHeight));
                    incentives["performanceIncentive"] = performanceIncentiveExisting;
                    incentives["performanceIncentiveValue"] = performanceIncentiveValueExisting;
                    incentives["performanceSectionHeight"]=200;

                }
                var xmlfile = file.load('../Template/JJ AT OX360 report OTGN-410.xml');

                var fileContent = xmlfile.getContents();

                var newFile = render.create();

                newFile.templateContent = fileContent;

                newFile.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "data",
                    data: requestParsed2
                });

                var report = newFile.renderAsPdf();



                try {

                    var custName = requestParsed2.dataSets.salesData.customerName.value;

                    log.debug("custName",custName)
                    var date = new Date().toISOString().split('T')[0];
                    log.debug("date",date)
                    var reportName  = 'OX360 Report_'+custName+'_'+new Date();
                    var fileObj = file.create({
                        name    : reportName,
                        fileType: file.Type.PDF,
                        contents: report.getContents()
                    });
                    fileObj.folder = 4768653;


                    var fileId = fileObj.save();

                    var id = record.attach({
                        record: {
                            type: 'file',
                            id: fileId
                        },
                        to: {
                            type: 'customer',
                            id: customerId
                        }
                    });


                  //  requestParsed2


                }catch (e) {
                    log.debug("err @ file create", e)
                }

                scriptContext.response.writeFile(report, true);

            } catch (e) {
                log.debug("error @onRequest", e);
            }
        }
        const createEventRec = (comments, customerId) => {
            try {
                for (var property in comments) {
                    if (comments[property] != "" && property != "commentSectionHeight") {
                        var eventRecord = record.create({ type: record.Type.CALENDAR_EVENT, isDynamic: true });
                        eventRecord.setValue('title', property);
                        eventRecord.setValue('message', comments[property]);
                        eventRecord.setValue('company', customerId);
                        eventRecord.setValue('custevent3', 4);
                        var id = eventRecord.save();
                        log.debug('id',id)
                    }
                }
            } catch (e) {
                log.debug("error @createEventRec", e);
            }
        };
            const saveToCustomerRecord=(incentives,customerId) =>{
                try{
                    if((incentives.performanceIncentive!="" || incentives.performanceIncentiveValue!="") && customerId!=""){
                       var id = record.submitFields({
                           type:'customer',
                           id:customerId,
                           values:{
                               'custentity_incentives_otga1271':incentives.performanceIncentive,
                               'custentity_incentive_value_otga1271':incentives.performanceIncentiveValue
                           }

                        })
                    }

                }catch (e) {
                    log.debug("Err @saveToCustomerRecord",e)
                }

        }
        return { onRequest }

    });
