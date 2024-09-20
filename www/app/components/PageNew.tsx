/// <reference path="../References.d.ts"/>
import * as React from 'react';

interface Props {
	message: string;
	changed: boolean;
	disabled: boolean;
	onSave: () => void;
}

const css = {
	message: {
		marginTop: '6px',
	} as React.CSSProperties,
	box: {
		marginTop: '15px',
	} as React.CSSProperties,
	button: {
		marginLeft: '10px',
	} as React.CSSProperties,
	buttons: {
		flexShrink: 0,
	} as React.CSSProperties,
};

export default class PageNew extends React.Component<Props, {}> {
	render(): JSX.Element {
		return <div className="layout horizontal" style={css.box}>
			<div className="flex"/>
			<div className="layout horizontal">
				<span style={css.message} hidden={!this.props.message}>
					{this.props.message}
				</span>
				<div style={css.buttons}>
					<button
						className="bp5-button bp5-intent-success bp5-icon-add"
						style={css.button}
						type="button"
						disabled={!this.props.changed || this.props.disabled}
						onClick={this.props.onSave}
					>
						New
					</button>
				</div>
			</div>
		</div>;
	}
}
