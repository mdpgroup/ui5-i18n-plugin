import * as theia from '@theia/plugin';
// import { posix } from 'path';
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

export function start(context: theia.PluginContext) {
    const i18nCheckTranslationsCommand = {
        id: 'ui5-i18n-check-translations',
        label: "Check i18n Translations"
    };
    context.subscriptions.push(theia.commands.registerCommand(i18nCheckTranslationsCommand, async (...args: any[]) => {

        if (!theia.workspace.workspaceFolders) {
            return theia.window.showInformationMessage('No folder or workspace opened!');
        }

        let propertyFilesP = theia.workspace.findFiles('{**/i18n*.properties}');
        let xmlviewFilesP = theia.workspace.findFiles('{**/*.view.xml}');
        let [, xmlviewFiles] = await Promise.all([propertyFilesP, xmlviewFilesP]);

        // theia.window.showInformationMessage(JSON.stringify(files));
        theia.window.showInformationMessage("i18n check is running...");
        theia.window.showInformationMessage(JSON.stringify(xmlviewFiles[0]))





        const doc: theia.TextDocument = await theia.workspace.openTextDocument({ content: JSON.stringify(xmlviewFiles[0]) }) as theia.TextDocument;
        theia.window.showTextDocument(doc, { viewColumn: theia.ViewColumn.Beside });
    }));

}

export function stop() {

}
