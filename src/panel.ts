import * as vscode from "vscode";

interface user {
    id: number
    name: string
    username: string
    token: string
    pfp: string
    sessionToken: string
}

export class panelProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _doc?: vscode.TextDocument;

    constructor(private readonly _extensionUri: vscode.Uri, private readonly githubClient:string, private readonly globalState:vscode.Memento) { }
 
    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getWebviewContent(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onInfo": {
                    if (!data.value) {return;}
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {return;}
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }

    public reloadWebview() {
        if (this._view) {
            this.resolveWebviewView(this._view);
        }
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }
    
    private _getWebviewContent (webview: vscode.Webview) {

        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const styleMain = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "style.min.css"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "scripts", "panel.js"));
        const nonce = getNonce();

        const loginHtml = `
            <div id="login-container" class="w-full h-full flex flex-col gap-3 items-center place-content-center">
                <a href="https://github.com/login/oauth/authorize?client_id=${this.githubClient}" class="drop-shadow-lg w-full h-fit max-w-[240px] flex gap-3 tet-sm place-items-center p-3 bg-black !text-white hover:bg-black/[0.8] text-center justify-center rounded-md">
                    <svg class="login-icon w-6 h-6" width="98" height="96" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#fff"/></svg>    
                    Sign in with Github
                </a>
            </div>
        `;

        const loggedInHtml = `
            <div class="flex flex-col h-full gap-3">
                <div class="grow">
                    <div class="flex gap-2 pb-3 border-b border-vs" id="connections">
                        
                    </div>
                </div>
                <div class="h-fit">
                    <form class="relative" id="message">
                        <label for="Search" class="sr-only"> Search </label>

                        <input
                            type="text"
                            placeholder="Enter message"
                            class="w-full rounded-md !py-2.5 !px-3 shadow-sm sm:text-sm"
                        />

                        <span class="input-colors absolute inset-y-0 end-0 grid w-10 place-content-center">
                            <button type="submit" class="hover:!bg-transparent">
                                <span class="sr-only">Search</span>
                                <svg class="rotate-45 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                        </span>
                    </form>
                </div>
            </div>
        `;

        return `
            <!DOCTYPE html>
			<html lang="en" class="h-full">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link nonce="${nonce}" href="${styleVSCodeUri}" rel="stylesheet">
                    <link nonce="${nonce}" href="${styleMain}" rel="stylesheet">
                    ${this.globalState.get('user') === undefined ? '' : `<script nonce="${nonce}">const tsvscode = acquireVsCodeApi(); const session = "${(this.globalState.get('user') as user).sessionToken}";</script>` }
                    ${this.globalState.get('user') === undefined ? '' : `<script nonce="${nonce}" src="${scriptUri}"></script>`}
                </head>

                <body class="h-full min-width-[240px] p-3">
                    ${this.globalState.get('user') === undefined ? loginHtml : loggedInHtml}
                </body>
			</html>
        `;
    }
}

function getNonce(): string {
    const possible:string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length:number = 32;
    return Array.from({ length }, () => possible.charAt(Math.floor(Math.random() * possible.length))).join('');
}