/// <reference path="../References.d.ts"/>
import * as React from 'react';

interface Props {
	className?: string;
	style?: React.CSSProperties;
	hidden?: boolean;
	to: string;
	children?: React.ReactNode
}

export default class RouterLink extends React.Component<Props, {}> {
	render(): JSX.Element {
		return <a
			className={this.props.className}
			style={this.props.style}
			hidden={this.props.hidden}
			onClick={(): void => {
				window.location.hash = this.props.to;
				let evt = new Event("router_update")
				window.dispatchEvent(evt)
			}}
		>{this.props.children}</a>
	}
}
