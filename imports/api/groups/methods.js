import {Meteor} from 'meteor/meteor';
import GroupCollection from './groups';

if(Meteor.isServer) {
  Meteor.methods({
    createGroup: function(group, languageKey) {
      if(!Meteor.userId()) {
        throw new Meteor.Error(500, "Access denied");
      } else {
        if(group.users.length<=0) {
          throw new Meteor.Error(500, "UserArray cannot be empty");
        } else {
          var groupId = GroupCollection.insert({
            name: group.name,
            description: group.description,
            users: group.users,
            owner: group.owner
          });
          Meteor.call("createNotification", {
            text: __("notifications.groupInvitation", {}, languageKey) + group.name,
            type: "groupInvitation",
            owner: {_id: Meteor.userId(), username: Meteor.user().username},
            groupId: groupId,
            timestamp: new Date().toISOString(),
            needsConfirmation: true,
            confirmedBy: [Meteor.userId()]
          });
        }
      }
    },
    editGroup: function(group) {
      GroupCollection.update(group._id, {
        $set: {
          name: group.name,
          description: group.description,
          users: group.users
        }
      });
    },
    deleteGroup: function(group) {
      if(group.owner!==Meteor.userId()) {
        throw new Meteor.Error(500, "Access denied");
      } else {
        GroupCollection.remove(group._id);
      }
    },
    validateUsernameList: function(users) {
      var result = [];
      for(var i=0;i<users.length;i++) {
        var user = Accounts.findUserByUsername(users[i]);
        if(user) {
          result.push(user._id);
        } else {
          throw new Meteor.Error(500, 'Error 500: Not found', 'user with username "' + users[i] + '" not found');
        }
      }
      return result;
    },
    getIdUsernameList: function(users) {
      var result = [];
      for(var i=0;i<users.length;i++) {
        var user = Meteor.users.findOne(users[i], {fields: {username: 1}});
        if(user) {
          result.push(user.username);
        }
      }
      return result;
    },
    removeUserFromGroup: function(groupId, userId) {
      GroupCollection.update(groupId, {
        $pull: {users: userId}
      });
    }
  });
}