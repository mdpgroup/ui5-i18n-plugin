import * as theia from '@theia/plugin';
// import { posix } from 'path';
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

import * as pluginUtils from './utils';

export function start(context: theia.PluginContext) {
    const i18nCheckTranslationsCommand = {
        id: 'ui5-i18n-check-translations',
        label: "Check i18n Translations"
    };
    context.subscriptions.push(theia.commands.registerCommand(i18nCheckTranslationsCommand, async (...args: any[]) => {

        if (!theia.workspace.workspaceFolders) {
            return theia.window.showInformationMessage('No folder or workspace opened!');
        }
        theia.window.showInformationMessage("i18n check is running...");

        let propertyFilesP = theia.workspace.findFiles('{**/i18n*.properties}', '**/node_modules/**');
        let xmlviewFilesP = theia.workspace.findFiles('{**/*.view.xml}', '**/node_modules/**');
        let [propertyFiles, xmlviewFiles] = await Promise.all([propertyFilesP, xmlviewFilesP]);

        //Start all the async work concurrently
        let xmlviewFileContentsP: PromiseLike<any>[] = []
        xmlviewFiles.forEach(url => {
            let asyncWorkForContent = async () => {
                let fileContent = await readFile(url.path, "utf-8");
                return pluginUtils.readI18nUsageFromXML(fileContent, url.path);
            }
            xmlviewFileContentsP.push(asyncWorkForContent());
        });

        let xmlReadingResultArr = await Promise.all(xmlviewFileContentsP);
        let i18nUsageXMLArr = Array.prototype.concat.apply([], xmlReadingResultArr);
        //console.log(i18nUsageXMLArr);

        let i18nAll: any = {};
        i18nUsageXMLArr.forEach((i18nUsage: any) => {
            if (!i18nAll.hasOwnProperty(i18nUsage.value)) {
                i18nAll[i18nUsage.value] = {};
                i18nAll[i18nUsage.value]["key"] = i18nUsage.value;
                i18nAll[i18nUsage.value]["usedIn"] = new Set([i18nUsage.file]);
            } else {
                i18nAll[i18nUsage.value]["usedIn"].add(i18nUsage.file);
            }
        });

        let propertyFileContentsP: PromiseLike<any>[] = []
        let reportText = "";
        propertyFiles.forEach(url => {
            let asyncWorkForContent = async () => {
                let fileContent = await readFile(url.path, "utf-8");
                let properties = pluginUtils.readProperties(fileContent);

                var notFoundProperties: any[] = [];
                // var notUsedProperties = [];
                //Look for undefined properties
                Object.keys(i18nAll).forEach(function(i18nKey) {
                    //var i18n = i18nAll[i18nKey];
                    if (!properties.hasOwnProperty(i18nKey)) {
                        notFoundProperties.push(i18nAll[i18nKey]);
                    }
                });
                var prop_file_path = url.path;
                reportText += '==================\nFile: ' + prop_file_path + '\n';
                notFoundProperties.forEach(function(i18nUsage) {
                    //console.log(i18nUsage);
                    reportText += '#Missing key: ' + i18nUsage.key + '\n';
                    i18nUsage.usedIn.forEach(function(usedIn: String) {
                        reportText += '#Used in: ' + usedIn + '\n';
                    });
                    reportText += '\n';
                });
                reportText += '\n\n\n';

                return
            }
            propertyFileContentsP.push(asyncWorkForContent());
        });
        // let propertyReadingResultArr = 
        await Promise.all(propertyFileContentsP);


        // propertyReadingResultArr.forEach((properties: any) => {

        //     //our work ends here:
        // });


        // theia.window.showInformationMessage(JSON.stringify(files));
        // theia.window.showInformationMessage(JSON.stringify(xmlviewFiles[0]))


        // let content = await readFile(xmlviewFiles[0].path, "utf-8")

        const doc: theia.TextDocument = await theia.workspace.openTextDocument({ content: reportText }) as theia.TextDocument;
        theia.window.showTextDocument(doc, { viewColumn: theia.ViewColumn.Beside });
    }));

}

export function stop() {

}
