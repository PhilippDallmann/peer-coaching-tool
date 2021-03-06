import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import MeetingCollection from '../../meetings/meetings';
import ChatCollection from '../../chats/chats';
import ChatMessageCollection from '../chatMessages';

if (Meteor.isServer) {
  /**
   * @summary Publishes ChatMessages belonging to a meetings chat
   * @param {String} meetingId - id of the meeting the chat belongs to
   * @locus Publication
   * */
  Meteor.publish('currentChatMessages', function currentChatMessages(meetingId) {
    check(meetingId, String);
    this.autorun(() => {
      const meeting = MeetingCollection.findOne(meetingId, { fields: { chat: 1 } });
      const chat = ChatCollection.findOne(meeting.chat, { fields: { chat_messages: 1 } });

      return ChatMessageCollection.find({ _id: { $in: chat.chat_messages } }, { sort: ['timestamp', 'asc'] });
    });
  });
}
