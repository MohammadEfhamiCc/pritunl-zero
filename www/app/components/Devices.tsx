/// <reference path="../References.d.ts"/>
import * as React from 'react';
import * as SuperAgent from 'superagent';
import * as DeviceTypes from '../types/DeviceTypes';
import DevicesStore from '../stores/DevicesStore';
import * as DeviceActions from '../actions/DeviceActions';
import * as Constants from "../Constants";
import NonState from './NonState';
import Device from './Device';
import PageHeader from './PageHeader';
import Loader from "../Loader";
import * as Csrf from "../Csrf";
import * as Alert from "../Alert";

interface Props {
	userId: string;
}

interface State {
	devices: DeviceTypes.DevicesRo;
	deviceType: string;
	deviceName: string;
	devicePubKey: string;
	devicePhoneNumber: string;
	showEnded: boolean;
	disabled: boolean;
}

const css = {
	header: {
		marginTop: '5px',
	} as React.CSSProperties,
	heading: {
		margin: '19px 0 0 0',
	} as React.CSSProperties,
	button: {
		margin: '15px 0 -5px 0',
	} as React.CSSProperties,
	group: {
		marginTop: '18px',
	} as React.CSSProperties,
	groupBox: {
	} as React.CSSProperties,
	inputBox: {
		flex: '1',
	} as React.CSSProperties,
};

export default class Devices extends React.Component<Props, State> {
	alertKey: string;
	u2fToken: string;

	constructor(props: any, context: any) {
		super(props, context);
		this.state = {
			devices: DevicesStore.devices,
			deviceName: '',
			deviceType: '',
			devicePubKey: '',
			devicePhoneNumber: '',
			showEnded: false,
			disabled: false,
		};
	}

	componentDidMount(): void {
		DevicesStore.addChangeListener(this.onChange);
		if (this.props.userId) {
			DeviceActions.load(this.props.userId);
		}
	}

	componentWillUnmount(): void {
		DevicesStore.removeChangeListener(this.onChange);
	}

	onChange = (): void => {
		this.setState({
			...this.state,
			devices: DevicesStore.devices,
		});
	}

	u2fRegistered = (resp: any): void => {
		Alert.dismiss(this.alertKey);

		if (resp.errorCode) {
			this.u2fToken = null;
			this.setState({
				disabled: false,
			});

			let errorMsg = 'U2F error code ' + resp.errorCode;
			let u2fMsg = Constants.u2fErrorCodes[resp.errorCode as number];
			if (u2fMsg) {
				errorMsg += ': ' + u2fMsg;
			}
			Alert.error(errorMsg);

			return
		}

		let loader = new Loader().loading();

		SuperAgent
			.post('/device/' + DevicesStore.userId + '/register')
			.send({
				token: this.u2fToken,
				name: this.state.deviceName,
				response: resp,
			})
			.set('Accept', 'application/json')
			.set('Csrf-Token', Csrf.token)
			.end((err: any, res: SuperAgent.Response): void => {
				loader.done();

				this.u2fToken = null;
				this.setState({
					...this.state,
					disabled: false,
					deviceName: '',
				});

				if (err) {
					Alert.errorRes(res, 'Failed to register device');
					return;
				}

				Alert.success('Successfully registered device');
			});
	}

	registerSign = (): void => {
		this.setState({
			disabled: true,
		});

		let loader = new Loader().loading();

		SuperAgent
			.get('/device/' + DevicesStore.userId + '/register')
			.set('Accept', 'application/json')
			.set('Csrf-Token', Csrf.token)
			.end((err: any, res: SuperAgent.Response): void => {
				loader.done();

				if (err) {
					Alert.errorRes(res, 'Failed to request device registration');
					return;
				}

				this.u2fToken = res.body.token;
				this.alertKey = Alert.info(
					'Insert security key and tap the button', 30000);

				(window as any).u2f.register(res.body.request.appId,
					res.body.request.registerRequests,
					res.body.request.registeredKeys,
					this.u2fRegistered, 30);
			});
	}

	addDevice = (): void => {
		if (this.state.deviceType === 'smart_card') {
			this.setState({
				disabled: true,
			});

			DeviceActions.create({
				id: null,
				user: this.props.userId,
				name: this.state.deviceName,
				type: this.state.deviceType,
				mode: 'ssh',
				ssh_public_key: this.state.devicePubKey,
			}).then((): void => {
				this.setState({
					...this.state,
					disabled: false,
					deviceName: '',
					devicePubKey: '',
					devicePhoneNumber: '',
				});

				Alert.success('Successfully registered device');
			}).catch((): void => {
				this.setState({
					...this.state,
					disabled: false,
				});
			});
		} else if (this.state.deviceType === 'phone_call' ||
			this.state.deviceType === 'phone_sms') {

			this.setState({
				...this.state,
				disabled: true,
			});

			let deviceTypes = this.state.deviceType.split('_');
			let deviceMode = deviceTypes[0];
			let deviceType = deviceTypes[1];

			DeviceActions.create({
				id: null,
				user: this.props.userId,
				name: this.state.deviceName,
				type: deviceType,
				mode: deviceMode,
				number: this.state.devicePhoneNumber,
			}).then((): void => {
				this.setState({
					...this.state,
					disabled: false,
					deviceName: '',
					devicePubKey: '',
					devicePhoneNumber: '',
				});

				Alert.success('Successfully registered device');
			}).catch((): void => {
				this.setState({
					...this.state,
					disabled: false,
				});
			});
		} else {
			this.registerSign();
		}
	}

	render(): JSX.Element {
		if (!this.props.userId) {
			return <div/>;
		}

		let devices: JSX.Element[] = [];

		this.state.devices.forEach((device: DeviceTypes.DeviceRo): void => {
			devices.push(<Device
				key={device.id}
				device={device}
			/>);
		});

		return <div>
			<PageHeader>
				<div className="layout horizontal wrap" style={css.header}>
					<h2 style={css.heading}>User Security Devices</h2>
					<div className="flex"/>
					<div style={css.groupBox} className="layout horizontal">
						<div
							className="bp3-control-group"
							style={css.group}
						>
							<div className="bp3-select">
								<select
									value={this.state.deviceType}
									onChange={(evt): void => {
										this.setState({
											...this.state,
											deviceType: evt.target.value,
											devicePubKey: '',
										});
									}}
								>
									<option value="u2f">U2F</option>
									<option value="smart_card">Smart Card</option>
									<option value="phone_call">Phone (Call)</option>
									<option value="phone_message">Phone (SMS)</option>
								</select>
							</div>
							<div className="layout horizontal" style={css.inputBox}>
								<input
									className="bp3-input"
									type="text"
									placeholder="Device name"
									value={this.state.deviceName}
									onChange={(evt): void => {
										this.setState({
											...this.state,
											deviceName: evt.target.value,
										});
									}}
									onKeyPress={(evt): void => {
										if (this.state.deviceType !== 'smart_card' &&
												evt.key === 'Enter') {
											this.addDevice();
										}
									}}
								/>
								<input
									className="bp3-input"
									hidden={this.state.deviceType !== 'smart_card'}
									type="text"
									placeholder="Device SSH public key"
									value={this.state.devicePubKey}
									onChange={(evt): void => {
										this.setState({
											...this.state,
											devicePubKey: evt.target.value,
										});
									}}
									onKeyPress={(evt): void => {
										if (evt.key === 'Enter') {
											this.addDevice();
										}
									}}
								/>
								<input
									className="bp3-input"
									hidden={this.state.deviceType !== 'phone_call' &&
										this.state.deviceType !== 'phone_sms'}
									type="text"
									placeholder="Device phone number"
									value={this.state.devicePhoneNumber}
									onChange={(evt): void => {
										this.setState({
											...this.state,
											devicePhoneNumber: evt.target.value,
										});
									}}
									onKeyPress={(evt): void => {
										if (evt.key === 'Enter') {
											this.addDevice();
										}
									}}
								/>
							</div>
							<div>
								<button
									className="bp3-button bp3-intent-success bp3-icon-add"
									disabled={this.state.disabled}
									onClick={this.addDevice}
								>Add Device</button>
							</div>
						</div>
					</div>
				</div>
			</PageHeader>
			<div>
				{devices}
			</div>
			<NonState
				hidden={!!devices.length}
				iconClass="bp3-icon-id-number"
				title="No devices"
			/>
		</div>;
	}
}
