import {Meteor} from 'meteor/meteor';
import React from 'react';
import ReactDOM from 'react-dom';

let Reflux = require('reflux');

import LoadingModal from '../../ui/components/modals/loadingModal';
import LoadingActions from '../actions/loadingActions';

let LoadingStore = Reflux.createStore({
	listenables: [LoadingActions],
	state: {
		loadingModal: null
	},
	onSetLoading: function () {
		if (this.state.loadingModal === null) {
			var newModal = ReactDOM.render(<LoadingModal/>, document.getElementById('loadingModal'));
			this.state.loadingModal = newModal;
			newModal.open();
		} else {
			this.state.loadingModal.open();
		}
	},
	onUnsetLoading: function () {
		var modal = this.state.loadingModal;
		if (modal) {
			modal.close();
		}
	}

});

export default LoadingStore;
