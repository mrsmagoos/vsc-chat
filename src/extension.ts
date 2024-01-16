import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar';

const githubClient:string = '912edb61a73a1b6553dc';

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"vsc-chat.sidebar",
			new SidebarProvider(context.extensionUri, githubClient, context.globalState),
		)
	);

	context.subscriptions.push(
		vscode.window.registerUriHandler({
			handleUri: async (uri: vscode.Uri) => {		
				const queryParams = new URLSearchParams(uri.query);
				if (queryParams.has('code')) {
					await context.globalState.update(`githubCode`, queryParams.get('code'))
					vscode.window.showInformationMessage(`URI Handler says: ${queryParams.get('code') as string}`);
				}
			}
		})
	);

}

export function deactivate() {}
