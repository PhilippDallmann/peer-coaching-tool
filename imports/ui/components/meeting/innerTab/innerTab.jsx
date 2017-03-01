import {Meteor} from 'meteor/meteor';
import React, {Component, PropTypes} from 'react';
import {createContainer} from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';
import {TAPi18n} from 'meteor/tap:i18n';
import ReactEmoji from 'react-emoji';
import {Streamy} from 'meteor/yuukan:streamy';

import MeetingCollection from '../../../../api/meetings/meetings';
import ChatMessageCollection from '../../../../api/chatMessages/chatMessages';
import StageCollection from '../../../../api/stages/stages';
import MaterialCollection from '../../../../api/materials/materials';

import MeetingActions from '../../../../reflux/actions/meetingActions';
import MeetingStore from '../../../../reflux/stores/meetingStore';
import MeetingTimeActions from '../../../../reflux/actions/meetingTimeActions';
import MeetingTimeStore from '../../../../reflux/stores/meetingTimeStore';
import UserActions from '../../../../reflux/actions/userActions';
import UserStore from '../../../../reflux/stores/userStore';

import truncate from '../../../../util/truncate';

import ChatUserBar from './chat/chatUserBar';
import ResultEditor from "./resultEditor";
import MaterialArea from "./materialArea";

let Reflux = require('reflux');
let Clipboard = require("clipboard");

let Grid = require('react-bootstrap').Grid;
let Row = require('react-bootstrap').Row;
let Col = require('react-bootstrap').Col;
let Panel = require('react-bootstrap').Panel;
let FormGroup = require('react-bootstrap').FormGroup;
let FormControl = require('react-bootstrap').FormControl;
let Button = require('react-bootstrap').Button;
let OverlayTrigger = require('react-bootstrap').OverlayTrigger;
let Popover = require('react-bootstrap').Popover;
let ButtonGroup = require('react-bootstrap').ButtonGroup;
let InputGroup = require('react-bootstrap').InputGroup;

var EMOTICONS = [":smiley:" , ":pensive:" , ":rage:" , ":open_mouth:" , ":fearful:" , ":blush:" , ":worried:" , ":stuck_out_tongue_closed_eyes:"];
const emojifyOptions = {
	attributes: { width: '20px', height: '20px'}
};
const emojifyButtonOptions = {
	attributes: { width: '18px', height: '18px'}
};
var messageChangeCount = 0;
var currentMeeting = null;
// {TAPi18n.__("meeting.timeRemainingTotal")}<div id="timerTotal">{this.props&&this.props.currentMeeting ? this.props.currentMeeting.time_total + " " +  TAPi18n._("meeting.minutes") : "0"}</div>

class InnerTab extends Reflux.Component {
  constructor(props) {
    super(props);

    let time = new Date();
    this.state = {
      stageId: this.props.stageId,
      time: time.getHours() + ":" + time.getMinutes()
    };
    this.time = MeetingTimeStore;

    this.createChatMessage = this.createChatMessage.bind(this);
  }
	shouldComponentUpdate(nextProps, nextState) {
		return false;
	}
	componentWillReceiveProps(nextProps) {
		this.setState({
			stageId: nextProps.stageId
		});
	}
	componentDidMount() {
		require("../../../../../node_modules/clipboard/dist/clipboard.js");
		//document.getElementById('timerTotal').innerHTML = this.props.currentMeeting.time_total.toString();
		this.updateScroll();
		new Clipboard('.clipboard');
	}
	componentWillUnmount() {
		UserActions.unsetActiveMeeting();
		MeetingTimeActions.killTimer();
		Streamy.leave(this.currentMeetingId);
  }
	componentDidUpdate() {
		this.updateScroll();
    let time = new Date();
    this.setState({
      time: time.getHours() + ":" + time.getMinutes()
    });
	}
	updateScroll() {
		if (document.getElementById('chatDiv')) {
			var element = document.getElementById('chatDiv');
			element.scrollTop = element.scrollHeight;
		}
	}
	createChatMessage() {

		var chatMessageText = document.getElementById('chatMessageTextInput').value;

		var message = {
			userId: Meteor.userId(),
			userName: Meteor.user().username,
			text: chatMessageText
		};
		MeetingActions.createChatMessage(message, this.props.currentMeeting.chat);

		document.getElementById('chatMessageTextInput').value = "";
	}
	handleChatMessageChange(event) {
		if (messageChangeCount == 0) {
			Streamy.rooms(this.currentMeetingId).emit('isTyping', {username: Meteor.user().username});
			messageChangeCount = 5;
		} else {
			messageChangeCount -= 1;
		}
	}
	handleKeyPress(event) {
		if (event.key === 'Enter') {
			this.createChatMessage();
		}
	}
	addEmoticon(emoticon, event) {
		var chatMessageText = document.getElementById('chatMessageTextInput').value;

		chatMessageText = chatMessageText ? chatMessageText + ' ' + emoticon + ' ' : ' ' + emoticon + ' ';

		document.getElementById('chatMessageTextInput').value = chatMessageText;
	}
	onPlayButtonClick() {
		if(this.props.currentMeeting.active_stage_id == 0) {
			this.onNextStageButtonClick();
		} else {
			MeetingActions.playMeeting(this.props.currentMeeting);
		}
	}
	onPauseButtonClick() {
		MeetingActions.pauseMeeting(this.props.currentMeeting._id);
	}
	onNextStageButtonClick() {
		var newStageId = this.props.currentMeeting.active_stage_id + 1;

		MeetingActions.updateMeetingStageAndSetStageActive(this.props.currentMeeting, newStageId);
		MeetingActions.createBotChatMessage(newStageId, this.props.currentMeeting.chat);
	}
	showOnlyIfFacilitator() {
		var style = {};
		style.display = (this.props.currentMeeting && this.props.currentMeeting.facilitator == Meteor.userId()) ? null : 'none';
		return style;
	}
	isClient() {

		return this.props.currentMeeting && Meteor.userId()== this.props.currentMeeting.client;
	}
	getRole(userId) {
			if(this.props.currentMeeting && this.props.currentMeeting.facilitator == userId) {
				return " (" + TAPi18n.__("roles.facilitator") + ")";
			} else if (this.props.currentMeeting && this.props.currentMeeting.client == userId) {
				return " (" + TAPi18n.__("roles.client") + ")";
			} else {
				return " (" + TAPi18n.__("roles.advisor") + ")";
			}
	}
	render() {
		const supportPanelHeading = (
			<Row>
				<div className="title-panel pull-left">
					{TAPi18n.__("meeting.supportPanelHeader")}
				</div>

				<Button className="play-button" onClick={this.onPlayButtonClick} style={this.showOnlyIfFacilitator()}
					disabled={this.props.currentMeeting ? (this.props.currentMeeting.status_code == 1 || (this.props.currentMeeting.current_stage_time_remaining == 0 && this.props.currentMeeting.active_stage_id != 0)) : true}>
					<span className="glyph glyphicon glyphicon-play"></span>
				</Button>

				<Button className="pause-button" onClick={this.onPauseButtonClick} style={this.showOnlyIfFacilitator()} disabled={this.props.currentMeeting ? this.props.currentMeeting.status_code == 0 : true}>
					<span className="glyph glyphicon glyphicon-pause"></span>
				</Button>

				<Button className="nextStage-button" onClick={this.onNextStageButtonClick} style={this.showOnlyIfFacilitator()}
					disabled={this.props.currentMeeting ? (this.props.currentMeeting.active_stage_id >= 6 || this.props.currentMeeting.active_stage_id == 0) : true}>
					<span className="glyph glyphicon glyphicon-forward"></span>
				</Button>
			</Row>
		);
		let clientPage = (
			<Panel key={this.props.resultKey} className="results-panel-client" header={TAPi18n.__("meeting.resultPanelHeader")}>
				<ResultEditor groupPadID={this.props.currentMeeting ?this.props.currentMeeting.result_group_pad : null}/>
			</Panel>
		);
		let regularPage = (
			<div>
				<Panel className="support-panel" header={supportPanelHeading}>
					<MaterialArea stageId= {this.state.stageId} chatId={this.props.currentMeeting ? this.props.currentMeeting.chat : null} stage={this.props.currentStage ? this.props.currentStage : null}/>
				</Panel>
				<Panel key={this.props.resultKey} className="results-panel" header={TAPi18n.__("meeting.resultPanelHeader")}>
					<ResultEditor/>
				</Panel>
			</div>
		);
		return (
		<div className="inner-tab">
    <Grid fluid>
      <Row>
				<Col
             sm={12}
             md={5}
             lg={6}>
				 <div className="time-area">
	         <h2>{TAPi18n.__("meeting.timeRemaining")} <div id="timer">00:00</div><div id="timerTotal">{TAPi18n.__("meeting.timeRemainingTotal")} {this.state.time}</div></h2>
	       </div>
				</Col>
				<Col
             sm={12}
             md={5}
             lg={6}>
				 <div className="time-area">
           <h2>{this.props.currentMeeting ? TAPi18n.__("meeting.meetingTopic") + this.props.currentMeeting.topic : TAPi18n.__("meeting.meetingTopic")}</h2>
         </div>
				</Col>
      </Row>
			<Row>
        <Col
             sm={12}
             md={5}
             lg={6}>
          <Panel className="chat-panel" header={TAPi18n.__("meeting.chatPanelHeader")}>
            <div id="chatDiv" className="chat-div">
              <div className="chat-text-container">
                <ul className="message-ul">
                  {this.props.currentChatMessages.map((message) => {
										var date = new Date(message.timestamp);
										date = date.toLocaleString();
										if(message.is_bot_message && message.is_bot_message == true) {
											var clipTarget= "#"+message._id;
											var htmlString = "<div><span class='chat-message-date'>"+ date + "</span><span id=" + message._id + ">" + message.text + "</span></div>"
											function createMarkup() { return {__html: htmlString};};
											return (
											<div className="bot-message">
		                    <li>
													<OverlayTrigger trigger="click" rootClose placement="right" overlay={
															<Popover>
																	<ButtonGroup vertical block>
																		<Button className="clipboard" data-clipboard-target={clipTarget} itemID={message._id}>{TAPi18n.__("meeting.addToResult")}</Button>
																	</ButtonGroup>
															</Popover>
														}>
		                      	<span className="message-text right" dangerouslySetInnerHTML={createMarkup()}/>
													</OverlayTrigger>
		                      <div className="clear"></div>
		                    </li>
		                  </div>);}
										else if (message.user_name === Meteor.user().username) {
											var clipTarget= "#"+message._id;
											return (
			                  <div className="message">
			                    <li>
														<OverlayTrigger trigger="click" rootClose placement="left" overlay={
																<Popover>
																		<ButtonGroup vertical block>
																			<Button className="clipboard" data-clipboard-target={clipTarget} itemID={message._id}>{TAPi18n.__("meeting.addToResult")}</Button>
																		</ButtonGroup>
																</Popover>
															}>
			                      	<span className="message-text right"><div><span className="chat-message-date">{date}</span><span id={message._id}>{ReactEmojiMixin.emojify(message.text, emojifyOptions)}</span></div></span>
														</OverlayTrigger>
			                      <div className="clear"></div>
			                    </li>
			                  </div>
			                  ); }
										else {
											var clipTarget= "#"+message._id;
											return (
			                  <div className="message">
			                    <li>
			                      <strong>{message.user_name + this.getRole(message.user_id) + ":"}</strong>
															<OverlayTrigger trigger="click" rootClose placement="right" overlay={
																<Popover>
																		<ButtonGroup vertical block>
																			<Button className="clipboard" data-clipboard-target={clipTarget} itemID={message._id}>{TAPi18n.__("meeting.addToResult")}</Button>
																		</ButtonGroup>
																</Popover>
															}>
			                      	<span className="message-text left"><div><span className="chat-message-date">{date}</span><span id={message._id}>{ReactEmojiMixin.emojify(message.text, emojifyOptions)}</span></div></span>
														</OverlayTrigger>
			                      <div className="clear"></div>
			                    </li>
			                  </div>
	                  ); } })}
                  <div className="clear"></div>
                </ul>
              </div>
            </div>
            <ChatUserBar currentMeetingId={this.props.currentMeeting && this.props.currentMeeting._id}/>
          </Panel>
          <FormGroup>
            <InputGroup>
              <InputGroup.Button>
                <OverlayTrigger
                  trigger="focus"
                  placement="top"
                  onEntered={this.componentDidUpdate}
                  overlay={ <Popover id="emojiPopover">
                    {EMOTICONS.map((emo) => { return (
                      <Button key={emo} onClick={(event)=> this.addEmoticon(emo, event)}>
                        <span>{ReactEmoji.emojify(emo, emojifyOptions)}</span>
                      </Button>
                    ); })}
                  </Popover>}>
                  <Button className="chat-emoticons">
                    <span>{ReactEmoji.emojify(':)', emojifyButtonOptions)}</span>
                  </Button>
                </OverlayTrigger>
              </InputGroup.Button>
              <FormControl
                id="chatMessageTextInput"
                onKeyPress={this.handleKeyPress}
                ref="chatInput"
                className="chat-input"
                type='text'
                placeholder={TAPi18n.__("meeting.chatInputPlaceholder")}
                onChange={this.handleChatMessageChange}
              />
              <InputGroup.Button>
                <Button onClick={this.createChatMessage}>{TAPi18n.__("meeting.chatInputButton")}</Button>
              </InputGroup.Button>
            </InputGroup>
          </FormGroup>
        </Col>
        <Col
             sm={12}
             md={7}
             lg={6}>
					{this.isClient() ?	clientPage : regularPage}
        </Col>
      </Row>
    </Grid>
  </div>
		);
	}
}

InnerTab.propTypes = {
  currentMeeting: PropTypes.object,
  currentChatMessages: PropTypes.array.isRequired,
  currentStage: PropTypes.object,
  roleMaterial: PropTypes.array.isRequired
};

export default createContainer(({stageId}) => {

  var currentMeeting = MeetingCollection.find().fetch()[0];
  if (currentMeeting) {
    if (!this.currentMeetingId) {
      this.currentMeetingId = currentMeeting._id;
      UserActions.setActiveMeeting(currentMeeting._id);
      Streamy.join(this.currentMeetingId);
    } else if (this.currentMeetingId != currentMeeting._id) {
      this.currentMeetingId = currentMeeting._id;
      UserActions.setActiveMeeting(currentMeeting._id);
      Streamy.join(this.currentMeetingId);
    }
  }

  return {
    currentMeeting: currentMeeting,
    currentChatMessages: ChatMessageCollection.find().fetch(),
    currentStage: StageCollection.find({stage_id: stageId}).fetch()[0],
    roleMaterial: MaterialCollection.find().fetch()
  };
},InnerTab);