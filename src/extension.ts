// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	//Registra o comando para abrir o chat
	let disposable = vscode.commands.registerCommand('mackenzie-chat.openChat', () => {
		ChatPanel.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(disposable);

	//Registra o provedor de visualização do chat
	if (vscode.window.registerWebviewViewProvider) {
		const provider = new ChatViewProvider(context.extensionUri);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider('mackenzieChat',provider)
		);
	}
}

class ChatViewProvider implements vscode.WebviewViewProvider {
	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken
	) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

		//Manipula mensagens do webview
		webviewView.webview.onDidReceiveMessage(async (data: { type: string, content?: string }) => {
			switch (data.type) {
				case 'analyze':
					this._analyzeCurrentFile(webviewView.webview);
					break;
				case 'suggest':
					this._suggestImprovements(webviewView.webview);
					break;
				case 'explain':
					this._explainSelectedCode(webviewView.webview);
					break;	
			}
		});
	}
	
	private getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
		);
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
		);

		return `<!DOCTYPE html>
		<html lang="pt-BR">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initialscale=1.0">
			<link href="${styleUri}" rel="stylesheet">
			<title>Analisador de Código</title>
		</head>
		<body>
			<div class="chat-container">
				<div class="chat-messages" id="chat-messages">
					<div class="message system">
						Olá! Sou seu assistente de análise de código. Como posso ajudar?
					</div>
				</div>
				<div class="chat-input-container">
					<input type="text" id="chat-input" placeholder="Digite sua mensagem...">
					<button id="send-button">Enviar</button>
				</div>
				<div class="quick-actions">
					<button id="analyze-button">Analisar arquivo atual</button>
					<button id="suggest-button">Sugerir melhorias</button>
					<button id="explain-button">Explicar código selecionado</button>
				</div>
			</div>
			<script src="${scriptUri}"></script>	
		</body>
		</html>`;
	}

	private async _analyzeCurrentFile(webview: vscode.Webview) {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			webview.postMessage({
				type: 'response',
				content: 'Nenhum arquivo aberto para análise.'
			});
			return;
		}

		const filePath= editor.document.uri.fsPath;

		try {
			//Chama o servidor MCP para analisar o código
			const result = await this._callMcpTool
			('codeAnalyzer', 'analyze_code', {
				file_path: filePath
			});

			webview.postMessage({
				type: 'response',
				content: `Analise concluída:\n${JSON.stringify(result, null, 2)}`
			});
		} catch (error) {
			webview.postMessage({
				type: 'response',
				content: `Erro ao analisar arquivo: ${error}`
			});
		}
	}
	//Implementação simplificada das outras funções
	private async _suggestImprovements(webview: vscode.Webview){
		//avaliar
	}

	private async _explainSelectedCode(webview: vscode.Webview){
		//avaliar
	}

	private async _callMcpTool(server: string, tool: string, params: any): Promise<any> {
		//Simulação da chamada ao MCP Server
		return new Promise((resolve) => {
			setTimeout(() => {
				if (tool === 'analyze_code') {
					resolve({
						language: path.extname(params.file_path).substring(1),
						lines_of_code: 120,
						issues: [
							{
								type: "warning",
								description: "Variável não utilizada",
								line: 10
							}
						],
						complexity_score: 6.8
					});
				}
			}, 1000);
		});
	}
}

class ChatPanel {
	public static currentPanel: ChatPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
		? vscode.window.activeTextEditor.viewColumn
		: undefined;

		if (ChatPanel.currentPanel) {
			ChatPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'mackenzieChat',
			'Chat com Mackenzie',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri]
			}
		);

		ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;

		this._panel.webview.html = this._getHtmlForWebview(panel.webview, extensionUri);
		
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	private _getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri) {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(extensionUri, 'media', 'main.js')
		);
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(extensionUri, 'media', 'style.css')
		);
		return `<!DOCTYPE html>
		<html lang="pt-BR">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link href="${styleUri}" rel="stylesheet">
			<title>Analisador de Código</title>
		</head>
		<body>
			<div class="chat-container">
				<div class="chat-messages" id="chat-messages">
					<div class="message system">
						Olá! Sou seu assistente de análise de código. Como posso ajudar?
					</div>
				</div>
				<div class="chat-input-container">
					<input type="text" id="chat-input" placeholder="Digite sua mensagem...">
					<button id="send-button">Enviar</button>
				</div>
				<div class="quick-actions">
					<button id="analyze-button">Analisar arquivo atual</button>
					<button id="suggest-button">Sugerir melhorias</button>
					<button id="explain-button">Explicar código selecionado</button>
				</div>
			</div>
			<script src="${scriptUri}"></script>
		</body>
		</html>`;
	}

	public dispose() {
		ChatPanel.currentPanel = undefined;
		this._panel.dispose();
		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}
}

export function deactivate() {}
