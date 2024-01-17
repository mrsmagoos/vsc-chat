import * as vscode from 'vscode';
import { panelProvider } from './panel';

const githubClient:string = '912edb61a73a1b6553dc';
const serverUrl:string = 'http://localhost:3000';

export async function activate(context: vscode.ExtensionContext) {

	const panel = new panelProvider(context.extensionUri, githubClient, context.globalState);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"vsc-chat.panel",
			panel,
		)
	);

	context.subscriptions.push(
		vscode.window.registerUriHandler({
			handleUri: async (uri: vscode.Uri) => {		
				const queryParams = new URLSearchParams(uri.query);
				if (queryParams.has('code')) {
					await context.globalState.update(`githubCode`, queryParams.get('code'));
					vscode.window.showInformationMessage(`URI Handler says: ${queryParams.get('code') as string}`);
					panel.reloadWebview();

					const response = await fetch(`${serverUrl}/authenticate`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							code: queryParams.get('code')
						})
					});

				}
			}
		})
	);

	vscode.commands.registerCommand('vsc-chat.logout', async () => {
		await context.globalState.update(`githubCode`, undefined);
		panel.reloadWebview();
	});

}

export function deactivate() {}
