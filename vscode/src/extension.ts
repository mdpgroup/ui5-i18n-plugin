// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// const fs = require('fs');
const util = require('util');
// const readFile = util.promisify(fs.readFile);

import * as pluginUtils from './utils';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ui5-i18n-plugin" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('ui5-i18n-plugin.check-translations', async () => {
		// The code you place here will be executed every time your command is executed

		if (!vscode.workspace.workspaceFolders) {
			return vscode.window.showInformationMessage('No folder or workspace opened!');
		}
		vscode.window.setStatusBarMessage("i18n check is running...",3000);

		let propertyFilesP = vscode.workspace.findFiles('{**/i18n*.properties}', '**/node_modules/**');
		let xmlviewFilesP = vscode.workspace.findFiles('{**/*.view.xml}', '**/node_modules/**');
		let [propertyFiles, xmlviewFiles] = await Promise.all([propertyFilesP, xmlviewFilesP]);

		//Start all the async work concurrently
		let xmlviewFileContentsP: PromiseLike<any>[] = []
		xmlviewFiles.forEach(url => {
			let asyncWorkForContent = async () => {
				let fileContentBytes = await vscode.workspace.fs.readFile(url);
				let fileContent = Buffer.from(fileContentBytes).toString('utf8');
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
				let fileContentBytes = await vscode.workspace.fs.readFile(url);
				let fileContent = Buffer.from(fileContentBytes).toString('utf8');
				let properties = pluginUtils.readProperties(fileContent);

				var notFoundProperties: any[] = [];
				// var notUsedProperties = [];
				//Look for undefined properties
				Object.keys(i18nAll).forEach(function (i18nKey) {
					//var i18n = i18nAll[i18nKey];
					if (!properties.hasOwnProperty(i18nKey)) {
						notFoundProperties.push(i18nAll[i18nKey]);
					}
				});
				var prop_file_path = url.path;
				reportText += '==================\nFile: ' + prop_file_path + '\n';
				notFoundProperties.forEach(function (i18nUsage) {
					//console.log(i18nUsage);
					reportText += '#Missing key: ' + i18nUsage.key + '\n';
					i18nUsage.usedIn.forEach(function (usedIn: String) {
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


		// vscode.window.showInformationMessage(JSON.stringify(files));
		// vscode.window.showInformationMessage(JSON.stringify(xmlviewFiles[0]))


		// let content = await readFile(xmlviewFiles[0].path, "utf-8")

		const doc: vscode.TextDocument = await vscode.workspace.openTextDocument({ content: reportText }) as vscode.TextDocument;
		vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
