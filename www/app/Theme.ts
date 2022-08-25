/// <reference path="./References.d.ts"/>
import * as SuperAgent from 'superagent';
import * as Alert from './Alert';
import * as Csrf from './Csrf';

export interface Callback {
	(): void;
}

let callbacks: Set<Callback> = new Set<Callback>();
export let theme = 'dark';

export function save(): Promise<void> {
	return new Promise<void>((resolve, reject): void => {
		SuperAgent
			.put('/theme')
			.send({
				theme: theme,
			})
			.set('Accept', 'application/json')
			.set('Csrf-Token', Csrf.token)
			.end((err: any, res: SuperAgent.Response): void => {
				if (res && res.status === 401) {
					window.location.href = '/login';
					resolve();
					return;
				}

				if (err) {
					Alert.errorRes(res, 'Failed to save theme');
					reject(err);
					return;
				}

				resolve();
			});
	});
}

export function light(): void {
	theme = 'light';
	document.body.className = '';
	callbacks.forEach((callback: Callback): void => {
		callback();
	});
}

export function dark(): void {
	theme = 'dark';
	document.body.className = 'bp3-dark';
	callbacks.forEach((callback: Callback): void => {
		callback();
	});
}

export function toggle(): void {
	if (theme === 'light') {
		dark();
	} else {
		light();
	}
}

export function editorTheme(): string {
	if (theme === "light") {
		return "eclipse";
	} else {
		return "dracula";
	}
}

export function addChangeListener(callback: Callback): void {
	callbacks.add(callback);
}

export function removeChangeListener(callback: () => void): void {
	callbacks.delete(callback);
}
