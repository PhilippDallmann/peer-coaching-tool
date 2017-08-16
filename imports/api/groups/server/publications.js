import { Meteor } from 'meteor/meteor';
import GroupCollection from '../groups';

if (Meteor.isServer) {
  /**
   * @summary Publishes all Groups the current user is part of
   * @locus Publication
   * */
  Meteor.publish('groupsOfCurrentUser', function () {
    return GroupCollection.find({ users: this.userId });
  });
}
/**
 * @summary Publishes all users belonging to a group
 * @param {String} groupId - id of the group
 * @locus Publication
 * */
Meteor.publish('usersOfGroup', function (groupId) {
  if (groupId) {
    this.autorun(() => {
      const group = GroupCollection.findOne(groupId, { fields: { users: 1 } });

      return Meteor.users.find(
        { _id: { $in: group.users } }, { fields: { _id: 1, username: 1 } },
      );
    });
  }
});
